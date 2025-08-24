/**
 * 密码哈希生成脚本
 * 为指定密码生成bcrypt哈希
 */

const bcrypt = require('bcrypt');

// 配置
const SALT_ROUNDS = 10;
const PASSWORD = 'jiushimima1.'; // 用户密码
const EMAIL = 'zlnp@qq.com';

async function generatePasswordHash() {
    try {
        console.log('🔐 开始生成密码哈希...');
        console.log(`📧 用户邮箱: ${EMAIL}`);
        console.log(`🔑 原始密码: ${PASSWORD}`);
        
        const startTime = Date.now();
        const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
        const endTime = Date.now();
        
        console.log(`✅ 密码哈希生成完成 (耗时: ${endTime - startTime}ms)`);
        console.log(`🔒 哈希结果: ${hashedPassword}`);
        
        // 验证哈希是否正确
        const isValid = await bcrypt.compare(PASSWORD, hashedPassword);
        console.log(`🔍 哈希验证: ${isValid ? '✅ 通过' : '❌ 失败'}`);
        
        // 生成SQL更新语句
        console.log('\n📝 SQL更新语句:');
        console.log(`UPDATE users SET password_hash = '${hashedPassword}' WHERE email = '${EMAIL}';`);
        
        // 生成完整的用户插入语句
        console.log('\n📝 完整插入语句:');
        console.log(`INSERT INTO users (email, password_hash, display_name, is_email_verified, created_at, last_login) 
VALUES (
    '${EMAIL}', 
    '${hashedPassword}', 
    'zlnp', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET 
    password_hash = '${hashedPassword}',
    updated_at = CURRENT_TIMESTAMP;`);
        
        return hashedPassword;
    } catch (error) {
        console.error('❌ 密码哈希生成失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    generatePasswordHash()
        .then(hash => {
            console.log('\n🎉 密码哈希生成完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 生成失败:', error);
            process.exit(1);
        });
}

module.exports = { generatePasswordHash };