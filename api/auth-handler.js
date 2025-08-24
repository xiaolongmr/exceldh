/**
 * 用户认证API处理器
 * 替换Firebase Auth功能
 */

const { pool, authenticateToken } = require('./db-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * 用户注册
 */
async function handleUserRegister(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, displayName } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // 检查邮箱是否已存在
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // 加密密码
        const passwordHash = await bcrypt.hash(password, 10);

        // 创建用户
        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, display_name) 
             VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at`,
            [email, passwordHash, displayName || email.split('@')[0]]
        );

        const user = newUser.rows[0];

        // 创建用户资料
        const nickname = displayName || email.split('@')[0];
        const avatar = email.includes('@qq.com') && /^\d+$/.test(email.split('@')[0]) 
            ? `https://q1.qlogo.cn/g?b=qq&nk=${email.split('@')[0]}&s=100`
            : 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';

        await pool.query(
            `INSERT INTO user_profiles (user_id, nickname, avatar, bio) 
             VALUES ($1, $2, $3, $4)`,
            [user.id, nickname, avatar, '']
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                isAnonymous: false
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                isAnonymous: false
            },
            token
        });

    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 用户登录
 */
async function handleUserLogin(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 查找用户
        const userResult = await pool.query(
            'SELECT id, email, password_hash, display_name, is_anonymous FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // 更新最后登录时间
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                isAnonymous: user.is_anonymous
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                isAnonymous: user.is_anonymous
            },
            token
        });

    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 匿名登录
 */
async function handleAnonymousLogin(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 生成匿名用户信息
        const anonymousId = uuidv4();
        const anonymousEmail = `anonymous_${anonymousId.slice(-8)}@guest.com`;
        const nickname = `访客${anonymousId.slice(-4)}`;

        // 创建匿名用户
        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, display_name, is_anonymous) 
             VALUES ($1, $2, $3, $4) RETURNING id, email, display_name`,
            [anonymousEmail, '', nickname, true]
        );

        const user = newUser.rows[0];

        // 创建用户资料
        await pool.query(
            `INSERT INTO user_profiles (user_id, nickname, avatar, bio) 
             VALUES ($1, $2, $3, $4)`,
            [user.id, nickname, 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png', '']
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                isAnonymous: true
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                isAnonymous: true
            },
            token
        });

    } catch (error) {
        console.error('Anonymous login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 升级匿名账号为正式账号
 */
async function handleUpgradeAccount(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;
        const userId = req.user.userId;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // 检查是否为匿名用户
        const userResult = await pool.query(
            'SELECT is_anonymous FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_anonymous) {
            return res.status(400).json({ error: 'Only anonymous users can be upgraded' });
        }

        // 检查邮箱是否已存在
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [email, userId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // 加密密码
        const passwordHash = await bcrypt.hash(password, 10);

        // 更新用户信息
        await pool.query(
            `UPDATE users 
             SET email = $1, password_hash = $2, display_name = $3, is_anonymous = false, is_email_verified = false
             WHERE id = $4`,
            [email, passwordHash, email.split('@')[0], userId]
        );

        // 更新用户资料
        const nickname = email.split('@')[0];
        const avatar = email.includes('@qq.com') && /^\d+$/.test(email.split('@')[0]) 
            ? `https://q1.qlogo.cn/g?b=qq&nk=${email.split('@')[0]}&s=100`
            : 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';

        await pool.query(
            `UPDATE user_profiles 
             SET nickname = $1, avatar = $2 
             WHERE user_id = $3`,
            [nickname, avatar, userId]
        );

        res.json({
            success: true,
            message: 'Account upgraded successfully'
        });

    } catch (error) {
        console.error('Account upgrade error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 获取用户信息
 */
async function handleGetUserInfo(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        // 获取用户信息和资料
        const result = await pool.query(
            `SELECT u.id, u.email, u.display_name, u.is_anonymous, u.is_email_verified,
                    u.created_at, u.last_login,
                    p.nickname, p.avatar, p.bio
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
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                isAnonymous: user.is_anonymous,
                isEmailVerified: user.is_email_verified,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                profile: {
                    nickname: user.nickname,
                    avatar: user.avatar,
                    bio: user.bio
                }
            }
        });

    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 用户登出（清除服务端会话，如果有的话）
 */
async function handleUserLogout(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 在这里可以实现服务端会话清除逻辑
        // 目前使用JWT，主要在客户端清除令牌
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('User logout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 统一的认证API处理函数
 * @param {Request} req 
 * @param {Response} res 
 * @param {string} pathname 
 * @param {string} method 
 */
async function handle(req, res, pathname, method) {
    console.log(`认证API处理: ${method} ${pathname}`);
    
    // 解析路径
    const pathParts = pathname.split('/').filter(p => p);
    // pathParts = ['api', 'auth', ...]
    
    // 解析请求体
    if (['POST', 'PUT'].includes(method)) {
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
        // 路由处理
        if (pathParts.length === 3) {
            const subPath = pathParts[2];
            
            if (subPath === 'register' && method === 'POST') {
                // /api/auth/register
                return await handleUserRegister(req, res);
            } else if (subPath === 'login' && method === 'POST') {
                // /api/auth/login
                return await handleUserLogin(req, res);
            } else if (subPath === 'anonymous' && method === 'POST') {
                // /api/auth/anonymous
                return await handleAnonymousLogin(req, res);
            } else if (subPath === 'upgrade' && method === 'POST') {
                // /api/auth/upgrade (需要认证)
                return await authenticateToken(req, res, () => handleUpgradeAccount(req, res));
            } else if (subPath === 'logout' && method === 'POST') {
                // /api/auth/logout (需要认证)
                return await authenticateToken(req, res, () => handleUserLogout(req, res));
            } else if (subPath === 'user' && method === 'GET') {
                // /api/auth/user (需要认证)
                return await authenticateToken(req, res, () => handleGetUserInfo(req, res));
            }
        }
        
        // 未找到匹配的路由
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
        
    } catch (error) {
        console.error('认证API处理错误:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

module.exports = {
    handle,
    handleUserRegister,
    handleUserLogin,
    handleAnonymousLogin,
    handleUpgradeAccount,
    handleGetUserInfo,
    handleUserLogout,
    authenticateToken
};