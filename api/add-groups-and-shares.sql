-- 扩展数据库：添加收藏分组和分享功能
-- 在Neon SQL Editor中执行此脚本

-- 1. 创建收藏分组表
CREATE TABLE IF NOT EXISTS favorite_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff', -- 分组颜色（16进制色值）
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 为user_favorites表添加group_id字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_favorites' AND column_name = 'group_id') THEN
        ALTER TABLE user_favorites ADD COLUMN group_id UUID REFERENCES favorite_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 创建分享表
CREATE TABLE IF NOT EXISTS favorite_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    share_key VARCHAR(32) UNIQUE NOT NULL, -- 短分享ID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    password VARCHAR(255), -- 可选的访问密码
    expires_at TIMESTAMP WITH TIME ZONE, -- 可选的过期时间
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建分享收藏关联表
CREATE TABLE IF NOT EXISTS favorite_share_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_id UUID REFERENCES favorite_shares(id) ON DELETE CASCADE,
    favorite_id UUID REFERENCES user_favorites(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_favorite_groups_user_id ON favorite_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_groups_sort_order ON favorite_groups(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_favorites_group_id ON user_favorites(group_id);
CREATE INDEX IF NOT EXISTS idx_favorite_shares_user_id ON favorite_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_shares_share_key ON favorite_shares(share_key);
CREATE INDEX IF NOT EXISTS idx_favorite_share_items_share_id ON favorite_share_items(share_id);
CREATE INDEX IF NOT EXISTS idx_favorite_share_items_favorite_id ON favorite_share_items(favorite_id);

-- 为新表创建更新时间触发器
CREATE TRIGGER update_favorite_groups_updated_at BEFORE UPDATE ON favorite_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favorite_shares_updated_at BEFORE UPDATE ON favorite_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为现有用户创建默认分组
INSERT INTO favorite_groups (user_id, name, description, color, sort_order)
SELECT u.id, '默认分组', '系统自动创建的默认分组', '#007bff', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM favorite_groups fg WHERE fg.user_id = u.id
);

-- 将没有分组的收藏移动到默认分组
UPDATE user_favorites 
SET group_id = (
    SELECT fg.id 
    FROM favorite_groups fg 
    WHERE fg.user_id = user_favorites.user_id 
    AND fg.name = '默认分组' 
    LIMIT 1
)
WHERE group_id IS NULL;

-- 验证数据
SELECT 
    'favorite_groups' as table_name,
    COUNT(*) as record_count
FROM favorite_groups
UNION ALL
SELECT 
    'favorite_shares' as table_name,
    COUNT(*) as record_count
FROM favorite_shares
UNION ALL
SELECT 
    'favorite_share_items' as table_name,
    COUNT(*) as record_count
FROM favorite_share_items;

-- 显示用户的分组情况
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
ORDER BY fg.sort_order;