-- 用户数据迁移脚本
-- 将Firebase用户 zlnp@qq.com 的数据迁移到Neon数据库

-- 首先删除可能存在的测试数据
DELETE FROM user_favorites WHERE user_id IN (SELECT id FROM users WHERE email = 'zlnp@qq.com');
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'zlnp@qq.com');
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'zlnp@qq.com');
DELETE FROM users WHERE email = 'zlnp@qq.com';

-- 插入用户基本信息
-- 密码：jiushimima1. 的bcrypt哈希值（需要在Node.js环境中生成）
-- 这里使用一个占位符，实际部署时需要用bcrypt生成真实的哈希
INSERT INTO users (
    id,
    email, 
    password_hash, 
    display_name, 
    is_email_verified, 
    is_anonymous,
    created_at, 
    updated_at,
    last_login
) VALUES (
    uuid_generate_v4(),
    'zlnp@qq.com',
    '$2b$10$placeholder_for_jiushimima1_password_hash',
    'zlnp',
    true,
    false,
    '2024-01-01 00:00:00+00',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 获取刚插入的用户ID
DO $$
DECLARE
    user_id_var UUID;
BEGIN
    -- 获取用户ID
    SELECT id INTO user_id_var FROM users WHERE email = 'zlnp@qq.com';
    
    -- 插入用户资料
    INSERT INTO user_profiles (
        user_id,
        nickname,
        avatar,
        bio,
        created_at,
        updated_at
    ) VALUES (
        user_id_var,
        'zlnp',
        'https://q1.qlogo.cn/g?b=qq&nk=zlnp&s=100',
        '网站创建者和管理员',
        '2024-01-01 00:00:00+00',
        CURRENT_TIMESTAMP
    );

    -- 插入一些示例收藏数据（如果有的话）
    INSERT INTO user_favorites (
        user_id,
        title,
        url,
        icon,
        description,
        category,
        sort_order,
        created_at
    ) VALUES 
    (
        user_id_var,
        'GitHub',
        'https://github.com',
        'https://github.com/favicon.ico',
        '全球最大的代码托管平台',
        '开发工具',
        1,
        CURRENT_TIMESTAMP
    ),
    (
        user_id_var,
        'Stack Overflow',
        'https://stackoverflow.com',
        'https://stackoverflow.com/favicon.ico',
        '程序员问答社区',
        '开发工具',
        2,
        CURRENT_TIMESTAMP
    ),
    (
        user_id_var,
        'MDN Web Docs',
        'https://developer.mozilla.org',
        'https://developer.mozilla.org/favicon.ico',
        'Web开发者文档',
        '文档资源',
        3,
        CURRENT_TIMESTAMP
    );

END $$;

-- 验证迁移结果
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
WHERE u.email = 'zlnp@qq.com';