/**
 * 安全的Neon数据库重置和初始化脚本
 * 先检查现有结构，必要时重置，然后重新创建
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// 从配置文件读取数据库连接字符串
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function resetAndInitializeDatabase() {
    console.log('🚀 开始安全重置和初始化Neon数据库...\n');

    // 创建数据库客户端
    const client = new Client({
        connectionString: NEON_DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // 连接到数据库
        console.log('🔗 正在连接到Neon数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功！\n');

        // 检查现有表结构
        console.log('🔍 检查现有表结构...');
        const existingTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        if (existingTables.rows.length > 0) {
            console.log('📋 发现现有表:');
            existingTables.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });

            console.log('\n⚠️ 为了确保兼容性，将重新创建表结构...');
            
            // 安全删除现有表（按依赖关系倒序）
            const tablesToDrop = ['user_sessions', 'user_favorites', 'user_profiles', 'users'];
            for (const table of tablesToDrop) {
                try {
                    await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
                    console.log(`✅ 已删除表: ${table}`);
                } catch (error) {
                    console.log(`⚠️ 删除表 ${table} 时出错:`, error.message);
                }
            }
        } else {
            console.log('✅ 数据库为空，可以直接创建表结构');
        }

        // 启用UUID扩展
        console.log('\n🔧 启用UUID扩展...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        console.log('✅ UUID扩展已启用');

        // 创建表结构
        console.log('\n📋 创建表结构...');

        // 1. 创建用户表
        await client.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                display_name VARCHAR(100),
                is_email_verified BOOLEAN DEFAULT false,
                is_anonymous BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE
            );
        `);
        console.log('✅ 已创建: users 表');

        // 2. 创建用户资料表
        await client.query(`
            CREATE TABLE user_profiles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                nickname VARCHAR(100),
                avatar TEXT,
                bio TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ 已创建: user_profiles 表');

        // 3. 创建用户收藏表
        await client.query(`
            CREATE TABLE user_favorites (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                icon TEXT,
                description TEXT,
                category VARCHAR(100),
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ 已创建: user_favorites 表');

        // 4. 创建会话表
        await client.query(`
            CREATE TABLE user_sessions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ip_address INET,
                user_agent TEXT
            );
        `);
        console.log('✅ 已创建: user_sessions 表');

        // 创建索引
        console.log('\n🔍 创建索引...');
        const indexes = [
            'CREATE INDEX idx_users_email ON users(email);',
            'CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);',
            'CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);',
            'CREATE INDEX idx_user_favorites_sort_order ON user_favorites(user_id, sort_order);',
            'CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);',
            'CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);',
            'CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);'
        ];

        for (const indexSQL of indexes) {
            await client.query(indexSQL);
        }
        console.log('✅ 所有索引创建完成');

        // 创建触发器函数
        console.log('\n⚡ 创建触发器...');
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // 为表创建触发器
        const triggers = [
            'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            'CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            'CREATE TRIGGER update_user_favorites_updated_at BEFORE UPDATE ON user_favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
        ];

        for (const triggerSQL of triggers) {
            await client.query(triggerSQL);
        }
        console.log('✅ 所有触发器创建完成');

        // 创建迁移用户数据
        console.log('\n👤 创建迁移用户数据...');
        
        // 生成正确的密码哈希
        const password = 'jiushimima1.';
        const passwordHash = await bcrypt.hash(password, 10);
        
        // 插入用户
        const userResult = await client.query(`
            INSERT INTO users (email, password_hash, display_name, is_email_verified, created_at, last_login) 
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id;
        `, ['zlnp@qq.com', passwordHash, 'zlnp', true]);
        
        const userId = userResult.rows[0].id;
        console.log(`✅ 已创建用户: zlnp@qq.com (ID: ${userId})`);

        // 插入用户资料
        await client.query(`
            INSERT INTO user_profiles (user_id, nickname, avatar, bio)
            VALUES ($1, $2, $3, $4);
        `, [userId, 'zlnp', 'https://q1.qlogo.cn/g?b=qq&nk=zlnp&s=100', '网站管理员']);
        
        console.log('✅ 已创建用户资料');

        // 验证创建结果
        console.log('\n🔍 验证数据库结构...');
        const finalTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('📋 最终表结构:');
        finalTables.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });

        // 验证用户数据
        const userCheck = await client.query('SELECT email, display_name FROM users WHERE email = $1', ['zlnp@qq.com']);
        if (userCheck.rows.length > 0) {
            console.log(`✅ 迁移用户验证成功: ${userCheck.rows[0].email}`);
        }

        console.log('\n🎉 数据库重置和初始化全部完成！');
        console.log('\n📋 下一步:');
        console.log('1. 运行服务器: npm start');
        console.log('2. 访问测试页面: test.html');
        console.log('3. 使用迁移账号登录: zlnp@qq.com / jiushimima1.');

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        
        // 提供详细的错误信息和解决方案
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 解决方案:');
            console.log('1. 检查网络连接');
            console.log('2. 确认Neon数据库连接字符串正确');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 解决方案:');
            console.log('1. 确认Neon数据库服务正在运行');
            console.log('2. 检查防火墙设置');
        } else if (error.message.includes('authentication')) {
            console.log('\n💡 解决方案:');
            console.log('1. 检查数据库用户名和密码');
            console.log('2. 确认数据库权限设置');
        }
        
        process.exit(1);
    } finally {
        // 关闭数据库连接
        await client.end();
        console.log('\n🔚 数据库连接已关闭');
    }
}

// 运行初始化
if (require.main === module) {
    resetAndInitializeDatabase().catch(console.error);
}

module.exports = { resetAndInitializeDatabase };