/**
 * 用户数据迁移工具
 * 生成密码哈希并迁移Firebase用户数据到Neon
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// 数据库连接配置
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: {
        rejectUnauthorized: false
    }
});

/**
 * 生成密码哈希
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 密码哈希
 */
async function generatePasswordHash(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * 迁移用户数据
 */
async function migrateUserData() {
    try {
        console.log('开始迁移用户数据...');

        // 生成密码哈希
        const password = 'jiushimima1.';
        const passwordHash = await generatePasswordHash(password);
        console.log('密码哈希生成成功');

        // 开始事务
        await pool.query('BEGIN');

        try {
            // 删除可能存在的旧数据
            console.log('清理旧数据...');
            await pool.query('DELETE FROM user_favorites WHERE user_id IN (SELECT id FROM users WHERE email = $1)', ['zlnp@qq.com']);
            await pool.query('DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = $1)', ['zlnp@qq.com']);
            await pool.query('DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = $1)', ['zlnp@qq.com']);
            await pool.query('DELETE FROM users WHERE email = $1', ['zlnp@qq.com']);

            // 插入用户基本信息
            console.log('插入用户基本信息...');
            const userResult = await pool.query(`
                INSERT INTO users (
                    email, 
                    password_hash, 
                    display_name, 
                    is_email_verified, 
                    is_anonymous,
                    created_at, 
                    updated_at,
                    last_login
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                'zlnp@qq.com',
                passwordHash,
                'zlnp',
                true,
                false,
                '2024-01-01 00:00:00+00',
                new Date(),
                new Date()
            ]);

            const userId = userResult.rows[0].id;
            console.log('用户创建成功，ID:', userId);

            // 插入用户资料
            console.log('插入用户资料...');
            await pool.query(`
                INSERT INTO user_profiles (
                    user_id,
                    nickname,
                    avatar,
                    bio,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                userId,
                'zlnp',
                'https://q1.qlogo.cn/g?b=qq&nk=zlnp&s=100',
                '网站创建者和管理员',
                '2024-01-01 00:00:00+00',
                new Date()
            ]);

            // 插入示例收藏数据
            console.log('插入示例收藏数据...');
            const favorites = [
                {
                    title: 'GitHub',
                    url: 'https://github.com',
                    icon: 'https://github.com/favicon.ico',
                    description: '全球最大的代码托管平台',
                    category: '开发工具',
                    sort_order: 1
                },
                {
                    title: 'Stack Overflow',
                    url: 'https://stackoverflow.com',
                    icon: 'https://stackoverflow.com/favicon.ico',
                    description: '程序员问答社区',
                    category: '开发工具',
                    sort_order: 2
                },
                {
                    title: 'MDN Web Docs',
                    url: 'https://developer.mozilla.org',
                    icon: 'https://developer.mozilla.org/favicon.ico',
                    description: 'Web开发者文档',
                    category: '文档资源',
                    sort_order: 3
                },
                {
                    title: 'Vue.js',
                    url: 'https://vuejs.org',
                    icon: 'https://vuejs.org/favicon.ico',
                    description: '渐进式JavaScript框架',
                    category: '前端框架',
                    sort_order: 4
                },
                {
                    title: 'React',
                    url: 'https://reactjs.org',
                    icon: 'https://reactjs.org/favicon.ico',
                    description: '用于构建用户界面的JavaScript库',
                    category: '前端框架',
                    sort_order: 5
                }
            ];

            for (const fav of favorites) {
                await pool.query(`
                    INSERT INTO user_favorites (
                        user_id,
                        title,
                        url,
                        icon,
                        description,
                        category,
                        sort_order,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    userId,
                    fav.title,
                    fav.url,
                    fav.icon,
                    fav.description,
                    fav.category,
                    fav.sort_order,
                    new Date()
                ]);
            }

            // 提交事务
            await pool.query('COMMIT');
            console.log('用户数据迁移完成！');

            // 验证迁移结果
            console.log('\n验证迁移结果...');
            const verifyResult = await pool.query(`
                SELECT 
                    u.email,
                    u.display_name,
                    u.is_email_verified,
                    u.created_at,
                    p.nickname,
                    p.avatar,
                    p.bio,
                    (SELECT COUNT(*) FROM user_favorites WHERE user_id = u.id) as favorites_count
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE u.email = $1
            `, ['zlnp@qq.com']);

            if (verifyResult.rows.length > 0) {
                const user = verifyResult.rows[0];
                console.log('迁移验证成功:');
                console.log('- 邮箱:', user.email);
                console.log('- 显示名称:', user.display_name);
                console.log('- 昵称:', user.nickname);
                console.log('- 邮箱已验证:', user.is_email_verified);
                console.log('- 收藏数量:', user.favorites_count);
                console.log('- 创建时间:', user.created_at);
            } else {
                console.log('验证失败：未找到迁移的用户数据');
            }

        } catch (error) {
            // 回滚事务
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('迁移失败:', error);
    } finally {
        // 关闭数据库连接
        await pool.end();
    }
}

/**
 * 测试密码哈希验证
 */
async function testPasswordVerification() {
    try {
        console.log('\n测试密码验证...');
        const password = 'jiushimima1.';
        const hash = await generatePasswordHash(password);
        
        const isValid = await bcrypt.compare(password, hash);
        const isInvalid = await bcrypt.compare('wrongpassword', hash);
        
        console.log('正确密码验证:', isValid ? '通过' : '失败');
        console.log('错误密码验证:', isInvalid ? '失败（应该失败）' : '通过');
        
        console.log('\n生成的密码哈希:');
        console.log(hash);
        
    } catch (error) {
        console.error('密码验证测试失败:', error);
    }
}

// 如果直接运行此脚本，则执行迁移
if (require.main === module) {
    console.log('=== Firebase 到 Neon 用户数据迁移工具 ===\n');
    
    // 先测试密码哈希
    testPasswordVerification().then(() => {
        // 然后执行迁移
        return migrateUserData();
    }).catch(error => {
        console.error('程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    generatePasswordHash,
    migrateUserData,
    testPasswordVerification
};