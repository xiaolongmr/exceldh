/**
 * 执行数据库扩展：添加收藏分组和分享功能
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function executeExtension() {
    console.log('🚀 开始执行数据库扩展...');
    
    try {
        // 读取SQL文件
        const sqlPath = path.join(__dirname, 'add-groups-and-shares.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📖 SQL文件读取成功');
        
        // 执行SQL
        console.log('🔄 执行SQL扩展脚本...');
        await pool.query(sqlContent);
        
        console.log('✅ 数据库扩展执行成功！');
        
        // 验证结果
        console.log('🔍 验证扩展结果...');
        
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('favorite_groups', 'favorite_shares', 'favorite_share_items')
            ORDER BY table_name
        `);
        
        console.log('📋 新增的表:');
        tableCheck.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        // 检查用户分组情况
        const groupCheck = await pool.query(`
            SELECT 
                u.email,
                fg.name as group_name,
                fg.sort_order,
                COUNT(uf.id) as favorites_count
            FROM users u
            LEFT JOIN favorite_groups fg ON u.id = fg.user_id
            LEFT JOIN user_favorites uf ON fg.id = uf.group_id
            WHERE u.email = 'zlnp@qq.com'
            GROUP BY u.email, fg.name, fg.sort_order
            ORDER BY fg.sort_order
        `);
        
        console.log('👤 用户分组情况:');
        groupCheck.rows.forEach(row => {
            console.log(`   - ${row.group_name}: ${row.favorites_count} 个收藏`);
        });
        
    } catch (error) {
        console.error('❌ 数据库扩展失败:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔚 数据库连接已关闭');
    }
}

// 执行扩展
executeExtension();