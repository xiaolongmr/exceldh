/**
 * Neon数据库初始化脚本
 * 直接连接Neon数据库并执行初始化SQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 从配置文件读取数据库连接字符串
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function initializeDatabase() {
    console.log('🚀 开始初始化Neon数据库...\n');

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

        // 读取SQL初始化文件
        const sqlFilePath = path.join(__dirname, 'api', 'init-database.sql');
        console.log('📄 读取SQL文件:', sqlFilePath);
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error('找不到SQL初始化文件: ' + sqlFilePath);
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('✅ SQL文件读取成功\n');

        // 执行SQL语句
        console.log('⚡ 执行数据库初始化SQL...');
        await client.query(sqlContent);
        console.log('✅ 数据库初始化完成！\n');

        // 验证表创建
        console.log('🔍 验证表结构...');
        const tableResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'user_profiles', 'user_favorites', 'user_sessions')
            ORDER BY table_name;
        `);

        console.log('📋 已创建的表:');
        tableResult.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });

        // 检查测试用户是否存在
        console.log('\n👤 检查迁移用户数据...');
        const userResult = await client.query('SELECT email, display_name FROM users WHERE email = $1', ['zlnp@qq.com']);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            console.log(`✅ 迁移用户已创建: ${user.email} (${user.display_name})`);
        } else {
            console.log('⚠️ 迁移用户未找到，可能需要手动创建');
        }

        console.log('\n🎉 数据库初始化全部完成！');
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
    initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };