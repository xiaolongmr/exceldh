/**
 * Neon 数据库配置
 * PostgreSQL 连接设置
 */

// Neon数据库连接字符串
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// 数据库连接池配置
const DB_CONFIG = {
    connectionString: NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

// 数据库配置对象（服务器端使用）
const neonConfig = {
    connection: DB_CONFIG,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here-please-change-in-production'
};

// 对于前端使用，检查是否在浏览器环境中
if (typeof window !== 'undefined') {
    // 浏览器环境 - 使用ES6模块导出
    const API_BASE_URL = window.location.origin + '/api';
    
    // 暂时注释掉ES6导出，以防止服务器端错误
    // export { DB_CONFIG, API_BASE_URL, NEON_DATABASE_URL };
    
    // 使用全局变量代替
    window.neonConfig = { API_BASE_URL, NEON_DATABASE_URL };
} else {
    // Node.js环境 - 使用CommonJS导出
    module.exports = {
        DB_CONFIG,
        NEON_DATABASE_URL,
        neonConfig
    };
}