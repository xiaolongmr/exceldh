-- Neon数据库完整重置和初始化脚本
-- 请在Neon SQL Editor中执行此脚本

-- 清理现有表（如果存在）
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 清理示例表
DROP TABLE IF EXISTS playing_with_neon CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户认证表 (替换Firebase Auth)
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

-- 2. 用户资料表 (替换Firebase Firestore userProfiles集合)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    avatar TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 用户收藏表 (替换Firebase Firestore userFavs集合)  
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

-- 4. 会话表 (用于用户会话管理)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- 创建索引以优化查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_sort_order ON user_favorites(user_id, sort_order);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_favorites_updated_at BEFORE UPDATE ON user_favorites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入测试用户数据 (迁移firebase用户 zlnp@qq.com)
-- 使用正确的bcrypt哈希密码 (密码: jiushimima1.)
INSERT INTO users (email, password_hash, display_name, is_email_verified, created_at, last_login) 
VALUES (
    'zlnp@qq.com', 
    '$2b$10$dUa0HEqikMyCS.YIraRUaOmgQYvrY5sqBXtBgkWQC44Mwbqq4Hm5e', 
    'zlnp', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET 
    password_hash = '$2b$10$dUa0HEqikMyCS.YIraRUaOmgQYvrY5sqBXtBgkWQC44Mwbqq4Hm5e',
    updated_at = CURRENT_TIMESTAMP;

-- 获取插入用户的ID并创建资料
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- 获取刚插入用户的ID
    SELECT id INTO user_uuid FROM users WHERE email = 'zlnp@qq.com';
    
    -- 为该用户创建默认资料
    INSERT INTO user_profiles (user_id, nickname, avatar, bio)
    VALUES (
        user_uuid,
        'zlnp',
        'https://q1.qlogo.cn/g?b=qq&nk=zlnp&s=100',
        '网站管理员'
    );
    
    -- 添加一些测试收藏数据
    INSERT INTO user_favorites (user_id, title, url, icon, description, category, sort_order)
    VALUES 
        (user_uuid, 'GitHub', 'https://github.com', 'https://github.com/favicon.ico', '全球最大的代码托管平台', '开发工具', 1),
        (user_uuid, 'Stack Overflow', 'https://stackoverflow.com', 'https://stackoverflow.com/favicon.ico', '程序员问答社区', '开发工具', 2),
        (user_uuid, 'MDN Web Docs', 'https://developer.mozilla.org', 'https://developer.mozilla.org/favicon.ico', 'Web开发文档', '学习资源', 3),
        (user_uuid, 'Vue.js', 'https://vuejs.org', 'https://vuejs.org/favicon.ico', '渐进式JavaScript框架', '前端框架', 4),
        (user_uuid, 'Neon Database', 'https://neon.tech', 'https://neon.tech/favicon.ico', '现代化PostgreSQL云服务', '数据库', 5);
        
    RAISE NOTICE '用户 zlnp@qq.com 和测试数据创建完成!';
END $$;

-- 验证数据是否正确插入
SELECT 
    u.email,
    u.display_name,
    u.created_at,
    p.nickname,
    COUNT(f.id) as favorite_count
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_favorites f ON u.id = f.user_id
WHERE u.email = 'zlnp@qq.com'
GROUP BY u.id, u.email, u.display_name, u.created_at, p.nickname;

-- 显示所有收藏
SELECT 
    f.title,
    f.url,
    f.description,
    f.category,
    f.sort_order,
    f.created_at
FROM user_favorites f
JOIN users u ON f.user_id = u.id
WHERE u.email = 'zlnp@qq.com'
ORDER BY f.sort_order;

-- 显示表信息
\dt