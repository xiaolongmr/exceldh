/**
 * 分享功能处理器
 * 处理收藏分享相关的API请求
 */

const { Client } = require('pg');
const { sendSuccess, sendError } = require('./response-utils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 导入数据库配置
const { neonConfig } = require('./neon-config');

/**
 * 认证中间件
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendError(res, 401, '访问令牌缺失');
    }

    try {
        const decoded = jwt.verify(token, neonConfig.jwtSecret);
        req.user = decoded;
        await next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return sendError(res, 403, '访问令牌无效');
    }
}

/**
 * 创建分享
 * POST /api/shares
 */
async function handleCreateShare(req, res) {
    const { title, description, favoriteIds } = req.body;
    const userId = req.user.userId;

    if (!title || !favoriteIds || !Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        return sendError(res, 400, '分享标题和收藏项目不能为空');
    }

    const client = new Client(neonConfig.connection);

    try {
        await client.connect();
        await client.query('BEGIN');

        // 生成唯一的分享ID
        const shareId = crypto.randomUUID();

        // 创建分享记录
        const shareResult = await client.query(
            `INSERT INTO favorite_shares (id, user_id, title, description, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, NOW(), NOW()) 
             RETURNING *`,
            [shareId, userId, title, description || '']
        );

        const share = shareResult.rows[0];

        // 验证用户拥有这些收藏
        const ownershipCheck = await client.query(
            `SELECT id FROM favorites WHERE id = ANY($1) AND user_id = $2`,
            [favoriteIds, userId]
        );

        if (ownershipCheck.rows.length !== favoriteIds.length) {
            await client.query('ROLLBACK');
            return sendError(res, 403, '您不能分享不属于您的收藏');
        }

        // 添加分享项目
        for (const favoriteId of favoriteIds) {
            await client.query(
                `INSERT INTO favorite_share_items (share_id, favorite_id, created_at) 
                 VALUES ($1, $2, NOW())`,
                [shareId, favoriteId]
            );
        }

        await client.query('COMMIT');

        return sendSuccess(res, {
            shareId: share.id,
            title: share.title,
            description: share.description,
            itemCount: favoriteIds.length,
            createdAt: share.created_at
        }, '分享创建成功');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('创建分享失败:', error);
        return sendError(res, 500, '创建分享失败');
    } finally {
        await client.end();
    }
}

/**
 * 获取分享内容（公开接口，无需认证）
 * GET /api/shares/:shareId
 */
async function handleGetShare(req, res) {
    const { shareId } = req.params;

    if (!shareId) {
        return sendError(res, 400, '分享ID不能为空');
    }

    const client = new Client(neonConfig.connection);

    try {
        await client.connect();

        // 获取分享信息
        const shareResult = await client.query(
            `SELECT s.*, u.email as creator_email
             FROM favorite_shares s
             JOIN users u ON s.user_id = u.id
             WHERE s.id = $1`,
            [shareId]
        );

        if (shareResult.rows.length === 0) {
            return sendError(res, 404, '分享不存在');
        }

        const share = shareResult.rows[0];

        // 获取分享的收藏项目
        const itemsResult = await client.query(
            `SELECT f.id, f.title, f.url, f.description, f.icon, f.category
             FROM favorite_share_items si
             JOIN favorites f ON si.favorite_id = f.id
             WHERE si.share_id = $1
             ORDER BY si.created_at`,
            [shareId]
        );

        const items = itemsResult.rows;

        // 构造创建者信息（隐私保护）
        const creatorInfo = {
            email: share.creator_email,
            displayName: share.creator_email.split('@')[0] // 只显示邮箱用户名部分
        };

        return sendSuccess(res, {
            share: {
                id: share.id,
                title: share.title,
                description: share.description,
                creator: creatorInfo,
                createdAt: share.created_at,
                itemCount: items.length
            },
            items: items
        }, '获取分享成功');

    } catch (error) {
        console.error('获取分享失败:', error);
        return sendError(res, 500, '获取分享失败');
    } finally {
        await client.end();
    }
}

/**
 * 获取用户的分享列表
 * GET /api/shares
 */
async function handleGetUserShares(req, res) {
    const userId = req.user.userId;

    const client = new Client(neonConfig.connection);

    try {
        await client.connect();

        const result = await client.query(
            `SELECT s.*, 
                    COUNT(si.favorite_id) as item_count
             FROM favorite_shares s
             LEFT JOIN favorite_share_items si ON s.id = si.share_id
             WHERE s.user_id = $1
             GROUP BY s.id, s.title, s.description, s.created_at, s.updated_at
             ORDER BY s.created_at DESC`,
            [userId]
        );

        const shares = result.rows.map(share => ({
            id: share.id,
            title: share.title,
            description: share.description,
            itemCount: parseInt(share.item_count),
            createdAt: share.created_at,
            updatedAt: share.updated_at
        }));

        return sendSuccess(res, { shares }, '获取分享列表成功');

    } catch (error) {
        console.error('获取分享列表失败:', error);
        return sendError(res, 500, '获取分享列表失败');
    } finally {
        await client.end();
    }
}

/**
 * 删除分享
 * DELETE /api/shares/:shareId
 */
async function handleDeleteShare(req, res) {
    const { shareId } = req.params;
    const userId = req.user.userId;

    if (!shareId) {
        return sendError(res, 400, '分享ID不能为空');
    }

    const client = new Client(neonConfig.connection);

    try {
        await client.connect();
        await client.query('BEGIN');

        // 验证分享所有权
        const ownershipResult = await client.query(
            `SELECT id FROM favorite_shares WHERE id = $1 AND user_id = $2`,
            [shareId, userId]
        );

        if (ownershipResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return sendError(res, 404, '分享不存在或您没有权限删除');
        }

        // 删除分享项目
        await client.query(
            `DELETE FROM favorite_share_items WHERE share_id = $1`,
            [shareId]
        );

        // 删除分享记录
        await client.query(
            `DELETE FROM favorite_shares WHERE id = $1`,
            [shareId]
        );

        await client.query('COMMIT');

        return sendSuccess(res, null, '分享删除成功');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('删除分享失败:', error);
        return sendError(res, 500, '删除分享失败');
    } finally {
        await client.end();
    }
}

module.exports = {
    authenticateToken,
    handleCreateShare,
    handleGetShare,
    handleGetUserShares,
    handleDeleteShare
};