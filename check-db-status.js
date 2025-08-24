/**
 * 简化的数据库连接和状态检查脚本
 */

const { Client } = require('pg');

const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkDatabaseStatus() {
    console.log('🔍 检查Neon数据库状态...\n');

    const client = new Client({
        connectionString: NEON_DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // 连接到数据库
        console.log('🔗 连接数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功！\n');

        // 检查表结构
        console.log('📋 当前表结构:');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        if (tables.rows.length === 0) {
            console.log('  (无表存在)');
        } else {
            tables.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

        // 检查用户数据
        console.log('\n👤 检查用户数据:');
        try {
            const users = await client.query('SELECT email, display_name FROM users LIMIT 5;');
            if (users.rows.length === 0) {
                console.log('  (无用户数据)');
            } else {
                users.rows.forEach(user => {
                    console.log(`  - ${user.email} (${user.display_name || 'N/A'})`);
                });
            }
        } catch (error) {
            console.log('  (users表不存在或查询失败)');
        }

        console.log('\n✅ 数据库状态检查完成');

    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
    } finally {
        await client.end();
    }
}

checkDatabaseStatus().catch(console.error);