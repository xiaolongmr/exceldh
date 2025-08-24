/**
 * Neon数据库查询API处理器
 * 处理前端的数据库查询请求
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 数据库连接配置
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * 处理数据库查询请求
 */
async function handleDatabaseQuery(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, params } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // 执行查询
        const result = await pool.query(query, params || []);

        res.json({
            success: true,
            rows: result.rows,
            rowCount: result.rowCount
        });

    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 处理密码加密请求
 */
async function handleHashPassword(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        res.json({
            success: true,
            hash
        });

    } catch (error) {
        console.error('Password hashing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 处理密码验证请求
 */
async function handleVerifyPassword(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password, hash } = req.body;

        if (!password || !hash) {
            return res.status(400).json({ error: 'Password and hash are required' });
        }

        const valid = await bcrypt.compare(password, hash);

        res.json({
            success: true,
            valid
        });

    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 处理JWT令牌生成请求
 */
async function handleGenerateToken(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { payload } = req.body;

        if (!payload) {
            return res.status(400).json({ error: 'Payload is required' });
        }

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token
        });

    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 处理JWT令牌验证请求
 */
async function handleVerifyToken(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const payload = jwt.verify(token, JWT_SECRET);

        res.json({
            success: true,
            payload
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
}

/**
 * 中间件：验证JWT令牌
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = payload;
        next();
    });
}

module.exports = {
    handleDatabaseQuery,
    handleHashPassword,
    handleVerifyPassword,
    handleGenerateToken,
    handleVerifyToken,
    authenticateToken,
    pool
};