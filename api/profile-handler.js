/**
 * 用户资料管理API处理器
 * 替换Firebase Firestore用户资料功能
 */

const { pool, authenticateToken } = require('./db-handler');

/**
 * 获取用户资料
 */
async function handleGetUserProfile(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT u.id, u.email, u.display_name, u.is_anonymous, u.is_email_verified,
                    u.created_at, u.last_login,
                    p.nickname, p.avatar, p.bio, p.updated_at as profile_updated_at
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            profile: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                nickname: user.nickname,
                avatar: user.avatar,
                bio: user.bio,
                isAnonymous: user.is_anonymous,
                isEmailVerified: user.is_email_verified,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                profileUpdatedAt: user.profile_updated_at
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 更新用户资料
 */
async function handleUpdateUserProfile(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { nickname, avatar, bio, displayName } = req.body;

        // 使用事务更新用户资料
        await pool.query('BEGIN');

        try {
            // 更新用户基本信息（如果提供了displayName）
            if (displayName !== undefined) {
                await pool.query(
                    'UPDATE users SET display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [displayName, userId]
                );
            }

            // 更新用户资料
            const updatedProfile = await pool.query(
                `UPDATE user_profiles 
                 SET nickname = COALESCE($1, nickname), 
                     avatar = COALESCE($2, avatar), 
                     bio = COALESCE($3, bio),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $4 
                 RETURNING *`,
                [nickname, avatar, bio, userId]
            );

            // 如果用户资料不存在，创建一个
            if (updatedProfile.rows.length === 0) {
                const newProfile = await pool.query(
                    `INSERT INTO user_profiles (user_id, nickname, avatar, bio) 
                     VALUES ($1, $2, $3, $4) 
                     RETURNING *`,
                    [userId, nickname || '', avatar || '', bio || '']
                );
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    profile: newProfile.rows[0]
                });
            } else {
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    profile: updatedProfile.rows[0]
                });
            }

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 上传头像
 */
async function handleUploadAvatar(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({ error: 'Avatar URL is required' });
        }

        // 更新头像
        const result = await pool.query(
            `UPDATE user_profiles 
             SET avatar = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $2 
             RETURNING avatar`,
            [avatar, userId]
        );

        if (result.rows.length === 0) {
            // 如果用户资料不存在，创建一个
            await pool.query(
                `INSERT INTO user_profiles (user_id, avatar) 
                 VALUES ($1, $2)`,
                [userId, avatar]
            );
        }

        res.json({
            success: true,
            avatar: avatar
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 更新邮箱
 */
async function handleUpdateEmail(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { newEmail } = req.body;

        if (!newEmail) {
            return res.status(400).json({ error: 'New email is required' });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // 检查邮箱是否已被使用
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [newEmail, userId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // 更新邮箱
        await pool.query(
            `UPDATE users 
             SET email = $1, is_email_verified = false, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [newEmail, userId]
        );

        res.json({
            success: true,
            message: 'Email updated successfully'
        });

    } catch (error) {
        console.error('Update email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 更改密码
 */
async function handleChangePassword(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // 获取当前密码哈希
        const userResult = await pool.query(
            'SELECT password_hash, is_anonymous FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // 匿名用户不能更改密码
        if (user.is_anonymous) {
            return res.status(400).json({ error: 'Anonymous users cannot change password' });
        }

        // 验证当前密码
        const bcrypt = require('bcrypt');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // 加密新密码
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 删除用户账号
 */
async function handleDeleteAccount(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { password } = req.body;

        // 获取用户信息
        const userResult = await pool.query(
            'SELECT password_hash, is_anonymous FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // 如果不是匿名用户，需要验证密码
        if (!user.is_anonymous) {
            if (!password) {
                return res.status(400).json({ error: 'Password is required for account deletion' });
            }

            const bcrypt = require('bcrypt');
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Password is incorrect' });
            }
        }

        // 使用事务删除用户和相关数据
        await pool.query('BEGIN');

        try {
            // 删除用户收藏
            await pool.query('DELETE FROM user_favorites WHERE user_id = $1', [userId]);
            
            // 删除用户资料
            await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
            
            // 删除用户会话
            await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
            
            // 删除用户
            await pool.query('DELETE FROM users WHERE id = $1', [userId]);

            await pool.query('COMMIT');

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 获取用户统计信息
 */
async function handleGetUserStats(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        // 获取收藏数量
        const favoritesCount = await pool.query(
            'SELECT COUNT(*) as count FROM user_favorites WHERE user_id = $1',
            [userId]
        );

        // 获取分类数量
        const categoriesCount = await pool.query(
            'SELECT COUNT(DISTINCT category) as count FROM user_favorites WHERE user_id = $1 AND category != \'\'',
            [userId]
        );

        // 获取注册时间
        const userInfo = await pool.query(
            'SELECT created_at FROM users WHERE id = $1',
            [userId]
        );

        const stats = {
            favoritesCount: parseInt(favoritesCount.rows[0].count),
            categoriesCount: parseInt(categoriesCount.rows[0].count),
            memberSince: userInfo.rows[0]?.created_at
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 统一的用户资料API处理函数
 * @param {Request} req 
 * @param {Response} res 
 * @param {string} pathname 
 * @param {string} method 
 */
async function handle(req, res, pathname, method) {
    console.log(`用户资料API处理: ${method} ${pathname}`);
    
    // 解析路径
    const pathParts = pathname.split('/').filter(p => p);
    // pathParts = ['api', 'profile', ...]
    
    // 解析请求体
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        await new Promise((resolve, reject) => {
            req.on('end', () => {
                try {
                    if (body) {
                        req.body = JSON.parse(body);
                    } else {
                        req.body = {};
                    }
                    resolve();
                } catch (error) {
                    reject(new Error('Invalid JSON'));
                }
            });
            req.on('error', reject);
        });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    
    try {
        // 路由处理 - 所有profile API都需要认证
        if (pathParts.length === 2 && pathParts[1] === 'profile') {
            // /api/profile
            if (method === 'GET') {
                return await authenticateToken(req, res, () => handleGetUserProfile(req, res));
            } else if (method === 'PUT') {
                return await authenticateToken(req, res, () => handleUpdateUserProfile(req, res));
            }
        } else if (pathParts.length === 3) {
            const subPath = pathParts[2];
            
            if (subPath === 'avatar' && method === 'POST') {
                // /api/profile/avatar
                return await authenticateToken(req, res, () => handleUploadAvatar(req, res));
            } else if (subPath === 'email' && method === 'PUT') {
                // /api/profile/email
                return await authenticateToken(req, res, () => handleUpdateEmail(req, res));
            } else if (subPath === 'password' && method === 'PUT') {
                // /api/profile/password
                return await authenticateToken(req, res, () => handleChangePassword(req, res));
            } else if (subPath === 'delete' && method === 'DELETE') {
                // /api/profile/delete
                return await authenticateToken(req, res, () => handleDeleteAccount(req, res));
            } else if (subPath === 'stats' && method === 'GET') {
                // /api/profile/stats
                return await authenticateToken(req, res, () => handleGetUserStats(req, res));
            }
        }
        
        // 未找到匹配的路由
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
        
    } catch (error) {
        console.error('用户资料API处理错误:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

module.exports = {
    handle,
    handleGetUserProfile,
    handleUpdateUserProfile,
    handleUploadAvatar,
    handleUpdateEmail,
    handleChangePassword,
    handleDeleteAccount,
    handleGetUserStats,
    authenticateToken
};