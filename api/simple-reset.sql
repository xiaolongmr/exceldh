-- 简化的Neon数据库初始化脚本
-- 分步执行，避免一次性执行过多语句

-- 第1步：清理现有表
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS playing_with_neon CASCADE;