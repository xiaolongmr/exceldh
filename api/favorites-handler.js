/**
 * 用户收藏功能API处理器
 * 替换Firebase Firestore收藏功能
 */

const { pool, authenticateToken } = require('./db-handler');

/**
 * 获取用户收藏列表
 */
async function handleGetFavorites(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, title, url, icon, description, category, sort_order, created_at, updated_at
             FROM user_favorites 
             WHERE user_id = $1 
             ORDER BY sort_order ASC, created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            favorites: result.rows
        });

    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 添加收藏
 */
async function handleAddFavorite(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { title, url, icon, description, category } = req.body;

        // 验证输入
        if (!title || !url) {
            return res.status(400).json({ error: 'Title and URL are required' });
        }

        // 检查是否已收藏该URL
        const existingFav = await pool.query(
            'SELECT id FROM user_favorites WHERE user_id = $1 AND url = $2',
            [userId, url]
        );

        if (existingFav.rows.length > 0) {
            return res.status(400).json({ error: 'URL already in favorites' });
        }

        // 获取当前最大排序值
        const maxSortResult = await pool.query(
            'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM user_favorites WHERE user_id = $1',
            [userId]
        );
        const nextSortOrder = maxSortResult.rows[0].max_sort + 1;

        // 添加收藏
        const newFavorite = await pool.query(
            `INSERT INTO user_favorites (user_id, title, url, icon, description, category, sort_order) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [userId, title, url, icon || '', description || '', category || '', nextSortOrder]
        );

        res.json({
            success: true,
            favorite: newFavorite.rows[0]
        });

    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 批量添加收藏
 */
async function handleBatchAddFavorites(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { favorites } = req.body;

        if (!Array.isArray(favorites) || favorites.length === 0) {
            return res.status(400).json({ error: 'Favorites array is required' });
        }

        // 获取当前最大排序值
        const maxSortResult = await pool.query(
            'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM user_favorites WHERE user_id = $1',
            [userId]
        );
        let nextSortOrder = maxSortResult.rows[0].max_sort + 1;

        const addedFavorites = [];

        // 逐个添加收藏（检查重复）
        for (const fav of favorites) {
            if (!fav.title || !fav.url) continue;

            // 检查是否已收藏该URL
            const existingFav = await pool.query(
                'SELECT id FROM user_favorites WHERE user_id = $1 AND url = $2',
                [userId, fav.url]
            );

            if (existingFav.rows.length === 0) {
                const newFavorite = await pool.query(
                    `INSERT INTO user_favorites (user_id, title, url, icon, description, category, sort_order) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) 
                     RETURNING *`,
                    [userId, fav.title, fav.url, fav.icon || '', fav.description || '', fav.category || '', nextSortOrder]
                );
                addedFavorites.push(newFavorite.rows[0]);
                nextSortOrder++;
            }
        }

        res.json({
            success: true,
            addedCount: addedFavorites.length,
            favorites: addedFavorites
        });

    } catch (error) {
        console.error('Batch add favorites error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 更新收藏
 */
async function handleUpdateFavorite(req, res) {
    if (req.method !== 'PUT') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { title, url, icon, description, category } = req.body;

        console.log(`📝 开始更新收藏: userId=${userId}, favoriteId=${id}`);
        console.log(`📝 更新数据:`, { title, url, icon, description, category });
        console.log(`📝 参数类型检查: id类型=${typeof id}, userId类型=${typeof userId}`);

        // 验证输入
        if (!title || !url) {
            console.log(`❌ 缺少必填字段: title=${title}, url=${url}`);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: 'Title and URL are required' 
            }));
            return;
        }

        // 检查收藏是否属于当前用户
        console.log(`🔍 开始查询收藏: id=${id}, userId=${userId}`);
        const existingFav = await pool.query(
            'SELECT id, title FROM user_favorites WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        
        console.log(`🔍 查询结果: 找到${existingFav.rows.length}条记录`);
        console.log(`🔍 查询详情:`, existingFav.rows);

        if (existingFav.rows.length === 0) {
            console.log(`❌ 收藏不存在或不属于当前用户: favoriteId=${id}, userId=${userId}`);
            
            // 额外查询：检查该收藏是否存在但属于其他用户
            const anyFav = await pool.query(
                'SELECT id, user_id, title FROM user_favorites WHERE id = $1',
                [id]
            );
            
            if (anyFav.rows.length > 0) {
                console.log(`⚠️ 收藏存在但属于其他用户: favoriteOwner=${anyFav.rows[0].user_id}, currentUser=${userId}`);
            } else {
                console.log(`⚠️ 收藏完全不存在于数据库中: favoriteId=${id}`);
            }
            
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: 'Favorite not found' 
            }));
            return;
        }

        const originalTitle = existingFav.rows[0].title;
        console.log(`🎯 找到收藏: "${originalTitle}" -> "${title}"`);

        // 更新收藏
        const updatedFavorite = await pool.query(
            `UPDATE user_favorites 
             SET title = $1, url = $2, icon = $3, description = $4, category = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND user_id = $7 
             RETURNING *`,
            [title, url, icon || '', description || '', category || '', id, userId]
        );

        console.log(`✅ 成功更新收藏: "${title}"`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            favorite: updatedFavorite.rows[0],
            message: 'Favorite updated successfully'
        }));

    } catch (error) {
        console.error('Update favorite error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}

/**
 * 删除收藏
 */
async function handleDeleteFavorite(req, res) {
    if (req.method !== 'DELETE') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        const userId = req.user.userId;
        const { id } = req.params;

        console.log(`🗑️ 开始删除收藏: userId=${userId}, favoriteId=${id}`);

        // 检查收藏是否属于当前用户
        const existingFav = await pool.query(
            'SELECT id, title FROM user_favorites WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingFav.rows.length === 0) {
            console.log(`❌ 收藏不存在: ${id}`);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: 'Favorite not found' 
            }));
            return;
        }

        const favoriteTitle = existingFav.rows[0].title;
        console.log(`🎯 找到收藏: "${favoriteTitle}"`);

        // 删除收藏
        await pool.query(
            'DELETE FROM user_favorites WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        console.log(`✅ 成功删除收藏: "${favoriteTitle}"`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Favorite deleted successfully',
            deletedTitle: favoriteTitle
        }));

    } catch (error) {
        console.error('Delete favorite error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}

/**
 * 更新收藏排序（兼容旧API）
 */
async function handleReorderFavorites(req, res) {
    if (req.method !== 'PUT') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        const userId = req.user.userId;
        
        console.log(`🔄 开始排序更新: userId=${userId}`);
        console.log(`🔄 原始请求体:`, req.body);
        console.log(`🔄 请求体类型:`, typeof req.body);
        
        const { orders } = req.body;
        
        console.log(`🔄 提取的orders:`, orders);
        console.log(`🔄 orders类型:`, typeof orders);
        console.log(`🔄 orders是否为数组:`, Array.isArray(orders));
        console.log(`🔄 orders数量:`, orders?.length);

        if (!Array.isArray(orders) || orders.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Orders array is required' }));
            return;
        }

        // 开始事务
        await pool.query('BEGIN');

        try {
            // 逐个更新排序
            for (const order of orders) {
                if (!order.id || typeof order.order !== 'number') {
                    console.log(`⚠️ 跳过无效排序项:`, order);
                    continue;
                }

                console.log(`📝 更新排序: ${order.id} -> ${order.order}`);
                await pool.query(
                    'UPDATE user_favorites SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                    [order.order, order.id, userId]
                );
            }

            await pool.query('COMMIT');
            console.log(`✅ 排序更新成功`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: '排序更新成功'
            }));

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Reorder favorites error:', error);
        console.error('Error stack:', error.stack);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: error.message,
            details: error.stack
        }));
    }
}

/**
 * 更新收藏排序
 */
async function handleUpdateFavoritesOrder(req, res) {
    if (req.method !== 'PUT') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        const userId = req.user.userId;
        const { favoriteIds } = req.body;

        console.log(`🔄 开始更新收藏顺序: userId=${userId}, favoriteIds数量=${favoriteIds?.length}`);
        console.log(`🔄 排序数据:`, favoriteIds);

        if (!Array.isArray(favoriteIds)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Favorite IDs array is required' }));
            return;
        }

        // 使用事务更新排序
        await pool.query('BEGIN');

        try {
            for (let i = 0; i < favoriteIds.length; i++) {
                console.log(`📝 更新排序: ${favoriteIds[i]} -> ${i + 1}`);
                await pool.query(
                    'UPDATE user_favorites SET sort_order = $1 WHERE id = $2 AND user_id = $3',
                    [i + 1, favoriteIds[i], userId]
                );
            }

            await pool.query('COMMIT');
            console.log(`✅ 收藏顺序更新成功`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Favorites order updated successfully'
            }));

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Update favorites order error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}

/**
 * 根据URL检查是否已收藏
 */
async function handleCheckFavorite(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        const result = await pool.query(
            'SELECT id FROM user_favorites WHERE user_id = $1 AND url = $2',
            [userId, url]
        );

        res.json({
            success: true,
            isFavorited: result.rows.length > 0,
            favoriteId: result.rows.length > 0 ? result.rows[0].id : null
        });

    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 获取收藏分类列表
 */
async function handleGetFavoriteCategories(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT DISTINCT category, COUNT(*) as count
             FROM user_favorites 
             WHERE user_id = $1 AND category != ''
             GROUP BY category
             ORDER BY count DESC, category ASC`,
            [userId]
        );

        res.json({
            success: true,
            categories: result.rows
        });

    } catch (error) {
        console.error('Get favorite categories error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 获取用户收藏分组列表
 */
async function handleGetFavoriteGroups(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT fg.id, fg.name, fg.description, fg.color, fg.sort_order,
                    fg.created_at, fg.updated_at,
                    COUNT(uf.id) as favorites_count
             FROM favorite_groups fg
             LEFT JOIN user_favorites uf ON fg.id = uf.group_id
             WHERE fg.user_id = $1
             GROUP BY fg.id, fg.name, fg.description, fg.color, fg.sort_order, fg.created_at, fg.updated_at
             ORDER BY fg.sort_order ASC, fg.created_at ASC`,
            [userId]
        );

        res.json({
            success: true,
            groups: result.rows
        });

    } catch (error) {
        console.error('Get favorite groups error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 创建收藏分组
 */
async function handleCreateFavoriteGroup(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { name, description, color } = req.body;

        // 验证输入
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // 检查分组名是否已存在
        const existingGroup = await pool.query(
            'SELECT id FROM favorite_groups WHERE user_id = $1 AND name = $2',
            [userId, name.trim()]
        );

        if (existingGroup.rows.length > 0) {
            return res.status(400).json({ error: 'Group name already exists' });
        }

        // 获取当前最大排序值
        const maxSortResult = await pool.query(
            'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM favorite_groups WHERE user_id = $1',
            [userId]
        );
        const nextSortOrder = maxSortResult.rows[0].max_sort + 1;

        // 创建分组
        const newGroup = await pool.query(
            `INSERT INTO favorite_groups (user_id, name, description, color, sort_order) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, name.trim(), description || '', color || '#007bff', nextSortOrder]
        );

        res.json({
            success: true,
            group: newGroup.rows[0]
        });

    } catch (error) {
        console.error('Create favorite group error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 更新收藏分组
 */
async function handleUpdateFavoriteGroup(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { groupId } = req.params;
        const { name, description, color } = req.body;

        // 验证输入
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // 检查分组是否存在且属于当前用户
        const existingGroup = await pool.query(
            'SELECT id FROM favorite_groups WHERE id = $1 AND user_id = $2',
            [groupId, userId]
        );

        if (existingGroup.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // 检查分组名是否与其他分组冲突
        const nameConflict = await pool.query(
            'SELECT id FROM favorite_groups WHERE user_id = $1 AND name = $2 AND id != $3',
            [userId, name.trim(), groupId]
        );

        if (nameConflict.rows.length > 0) {
            return res.status(400).json({ error: 'Group name already exists' });
        }

        // 更新分组
        const updatedGroup = await pool.query(
            `UPDATE favorite_groups 
             SET name = $1, description = $2, color = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5 
             RETURNING *`,
            [name.trim(), description || '', color || '#007bff', groupId, userId]
        );

        res.json({
            success: true,
            group: updatedGroup.rows[0]
        });

    } catch (error) {
        console.error('Update favorite group error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 删除收藏分组
 */
async function handleDeleteFavoriteGroup(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { groupId } = req.params;
        const { moveToGroupId } = req.body; // 可选：将收藏移动到的目标分组ID

        // 检查分组是否存在且属于当前用户
        const existingGroup = await pool.query(
            'SELECT id FROM favorite_groups WHERE id = $1 AND user_id = $2',
            [groupId, userId]
        );

        if (existingGroup.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // 使用事务处理删除
        await pool.query('BEGIN');

        try {
            // 处理分组中的收藏
            if (moveToGroupId) {
                // 检查目标分组是否存在
                const targetGroup = await pool.query(
                    'SELECT id FROM favorite_groups WHERE id = $1 AND user_id = $2',
                    [moveToGroupId, userId]
                );

                if (targetGroup.rows.length === 0) {
                    throw new Error('Target group not found');
                }

                // 将收藏移动到目标分组
                await pool.query(
                    'UPDATE user_favorites SET group_id = $1 WHERE group_id = $2',
                    [moveToGroupId, groupId]
                );
            } else {
                // 将收藏移动到默认分组
                const defaultGroup = await pool.query(
                    'SELECT id FROM favorite_groups WHERE user_id = $1 AND name = $2',
                    [userId, '默认分组']
                );

                if (defaultGroup.rows.length > 0) {
                    await pool.query(
                        'UPDATE user_favorites SET group_id = $1 WHERE group_id = $2',
                        [defaultGroup.rows[0].id, groupId]
                    );
                } else {
                    // 如果没有默认分组，将group_id设为null
                    await pool.query(
                        'UPDATE user_favorites SET group_id = NULL WHERE group_id = $1',
                        [groupId]
                    );
                }
            }

            // 删除分组
            await pool.query(
                'DELETE FROM favorite_groups WHERE id = $1 AND user_id = $2',
                [groupId, userId]
            );

            await pool.query('COMMIT');

            res.json({
                success: true,
                message: 'Group deleted successfully'
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Delete favorite group error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 创建收藏分享
 */
async function handleCreateFavoriteShare(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { title, description, favoriteIds, password, expiresIn } = req.body;

        // 验证输入
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Share title is required' });
        }

        if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
            return res.status(400).json({ error: 'At least one favorite must be selected' });
        }

        // 验证所有收藏都属于当前用户
        const favoritesCheck = await pool.query(
            'SELECT id FROM user_favorites WHERE id = ANY($1) AND user_id = $2',
            [favoriteIds, userId]
        );

        if (favoritesCheck.rows.length !== favoriteIds.length) {
            return res.status(400).json({ error: 'Some favorites do not belong to the current user' });
        }

        // 生成唯一的分享键
        const shareKey = generateShareKey();

        // 计算过期时间
        let expiresAt = null;
        if (expiresIn && expiresIn > 0) {
            expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000); // expiresIn为天数
        }

        // 使用事务创建分享
        await pool.query('BEGIN');

        try {
            // 创建分享记录
            const newShare = await pool.query(
                `INSERT INTO favorite_shares (user_id, share_key, title, description, password, expires_at) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [userId, shareKey, title.trim(), description || '', password || null, expiresAt]
            );

            const shareId = newShare.rows[0].id;

            // 添加分享项目
            for (let i = 0; i < favoriteIds.length; i++) {
                await pool.query(
                    `INSERT INTO favorite_share_items (share_id, favorite_id, sort_order) 
                     VALUES ($1, $2, $3)`,
                    [shareId, favoriteIds[i], i + 1]
                );
            }

            await pool.query('COMMIT');

            res.json({
                success: true,
                share: {
                    ...newShare.rows[0],
                    shareUrl: `${req.headers.host || 'localhost:3000'}/share/${shareKey}`
                }
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Create favorite share error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 获取用户的分享列表
 */
async function handleGetUserShares(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT fs.id, fs.share_key, fs.title, fs.description, fs.is_public,
                    fs.expires_at, fs.view_count, fs.created_at, fs.updated_at,
                    COUNT(fsi.id) as items_count
             FROM favorite_shares fs
             LEFT JOIN favorite_share_items fsi ON fs.id = fsi.share_id
             WHERE fs.user_id = $1
             GROUP BY fs.id, fs.share_key, fs.title, fs.description, fs.is_public,
                      fs.expires_at, fs.view_count, fs.created_at, fs.updated_at
             ORDER BY fs.created_at DESC`,
            [userId]
        );

        const shares = result.rows.map(share => ({
            ...share,
            shareUrl: `${req.headers.host || 'localhost:3000'}/share/${share.share_key}`,
            isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false
        }));

        res.json({
            success: true,
            shares
        });

    } catch (error) {
        console.error('Get user shares error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 获取分享内容（公开访问）
 */
async function handleGetShareContent(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { shareKey } = req.params;
        const { password } = req.query;

        if (!shareKey) {
            return res.status(400).json({ error: 'Share key is required' });
        }

        // 获取分享信息
        const shareResult = await pool.query(
            `SELECT fs.*, u.display_name as owner_name
             FROM favorite_shares fs
             JOIN users u ON fs.user_id = u.id
             WHERE fs.share_key = $1 AND fs.is_public = true`,
            [shareKey]
        );

        if (shareResult.rows.length === 0) {
            return res.status(404).json({ error: 'Share not found or not public' });
        }

        const share = shareResult.rows[0];

        // 检查是否过期
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Share has expired' });
        }

        // 检查密码
        if (share.password && share.password !== password) {
            return res.status(401).json({ error: 'Password required or incorrect' });
        }

        // 获取分享的收藏项目
        const itemsResult = await pool.query(
            `SELECT uf.id, uf.title, uf.url, uf.icon, uf.description, uf.category,
                    fsi.sort_order
             FROM favorite_share_items fsi
             JOIN user_favorites uf ON fsi.favorite_id = uf.id
             WHERE fsi.share_id = $1
             ORDER BY fsi.sort_order ASC`,
            [share.id]
        );

        // 更新查看次数
        await pool.query(
            'UPDATE favorite_shares SET view_count = view_count + 1 WHERE id = $1',
            [share.id]
        );

        res.json({
            success: true,
            share: {
                title: share.title,
                description: share.description,
                ownerName: share.owner_name,
                createdAt: share.created_at,
                viewCount: share.view_count + 1,
                items: itemsResult.rows
            }
        });

    } catch (error) {
        console.error('Get share content error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * 删除分享
 */
async function handleDeleteShare(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.user.userId;
        const { shareId } = req.params;

        // 检查分享是否存在且属于当前用户
        const existingShare = await pool.query(
            'SELECT id FROM favorite_shares WHERE id = $1 AND user_id = $2',
            [shareId, userId]
        );

        if (existingShare.rows.length === 0) {
            return res.status(404).json({ error: 'Share not found' });
        }

        // 使用事务删除
        await pool.query('BEGIN');

        try {
            // 删除分享项目
            await pool.query(
                'DELETE FROM favorite_share_items WHERE share_id = $1',
                [shareId]
            );

            // 删除分享
            await pool.query(
                'DELETE FROM favorite_shares WHERE id = $1 AND user_id = $2',
                [shareId, userId]
            );

            await pool.query('COMMIT');

            res.json({
                success: true,
                message: 'Share deleted successfully'
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Delete share error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// 生成分享键的工具函数
function generateShareKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 统一的收藏API处理函数
 * @param {Request} req 
 * @param {Response} res 
 * @param {string} pathname 
 * @param {string} method 
 */
async function handle(req, res, pathname, method) {
    console.log(`收藏API处理: ${method} ${pathname}`);
    
    // 解析路径
    const pathParts = pathname.split('/').filter(p => p);
    console.log(`路径解析: pathParts =`, pathParts);
    console.log(`pathParts.length = ${pathParts.length}`);
    
    if (pathParts.length === 3) {
        const subPath = pathParts[2];
        console.log(`检查 subPath: "${subPath}"`);
        console.log(`UUID正则测试: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test("${subPath}") = ${/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(subPath)}`);
    }
    // pathParts = ['api', 'favorites', ...]
    
    // 解析请求体
    if (['POST', 'PUT'].includes(method)) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        await new Promise((resolve, reject) => {
            req.on('end', () => {
                try {
                    if (body) {
                        req.body = JSON.parse(body);
                    } else {
                        req.body = {};
                    }
                    resolve();
                } catch (error) {
                    reject(new Error('Invalid JSON'));
                }
            });
            req.on('error', reject);
        });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    
    try {
        // 路由处理
        if (pathParts.length === 2 && pathParts[1] === 'favorites') {
            // /api/favorites
            if (method === 'GET') {
                return await authenticateToken(req, res, () => handleGetFavorites(req, res));
            } else if (method === 'POST') {
                return await authenticateToken(req, res, () => handleAddFavorite(req, res));
            }
        } else if (pathParts.length === 3) {
            const subPath = pathParts[2];
            
            if (subPath === 'batch' && method === 'POST') {
                // /api/favorites/batch
                return await authenticateToken(req, res, () => handleBatchAddFavorites(req, res));
            } else if (subPath === 'reorder' && method === 'PUT') {
                // /api/favorites/reorder
                return await authenticateToken(req, res, () => handleReorderFavorites(req, res));
            } else if (subPath === 'order' && method === 'PUT') {
                // /api/favorites/order
                return await authenticateToken(req, res, () => handleUpdateFavoritesOrder(req, res));
            } else if (subPath === 'check' && method === 'GET') {
                // /api/favorites/check
                return await authenticateToken(req, res, () => handleCheckFavorite(req, res));
            } else if (subPath === 'categories' && method === 'GET') {
                // /api/favorites/categories
                return await authenticateToken(req, res, () => handleGetFavoriteCategories(req, res));
            } else if (subPath === 'groups' && method === 'GET') {
                // /api/favorites/groups
                return await authenticateToken(req, res, () => handleGetFavoriteGroups(req, res));
            } else if (subPath === 'groups' && method === 'POST') {
                // /api/favorites/groups
                return await authenticateToken(req, res, () => handleCreateFavoriteGroup(req, res));
            } else if (subPath === 'shares' && method === 'GET') {
                // /api/favorites/shares
                return await authenticateToken(req, res, () => handleGetUserShares(req, res));
            } else if (subPath === 'shares' && method === 'POST') {
                // /api/favorites/shares
                return await authenticateToken(req, res, () => handleCreateFavoriteShare(req, res));
            } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(subPath)) {
                // /api/favorites/:id (UUID格式)
                console.log(`✅ UUID路由匹配: ${subPath}`);
                req.params = { id: subPath };
                
                if (method === 'PUT') {
                    return await authenticateToken(req, res, () => handleUpdateFavorite(req, res));
                } else if (method === 'DELETE') {
                    return await authenticateToken(req, res, () => handleDeleteFavorite(req, res));
                } else {
                    res.writeHead(405);
                    res.end(JSON.stringify({ error: 'Method not allowed' }));
                    return;
                }
            } else {
                console.log(`❌ UUID路由不匹配: ${subPath}`);
            }
        } else if (pathParts.length === 4) {
            const subPath = pathParts[2];
            const id = pathParts[3];
            
            if (subPath === 'groups' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
                // /api/favorites/groups/:id
                console.log(`✅ Groups UUID路由匹配: ${id}`);
                req.params = { groupId: id };
                
                if (method === 'PUT') {
                    return await authenticateToken(req, res, () => handleUpdateFavoriteGroup(req, res));
                } else if (method === 'DELETE') {
                    return await authenticateToken(req, res, () => handleDeleteFavoriteGroup(req, res));
                }
            } else if (subPath === 'shares' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
                // /api/favorites/shares/:id
                console.log(`✅ Shares UUID路由匹配: ${id}`);
                req.params = { shareId: id };
                
                if (method === 'DELETE') {
                    return await authenticateToken(req, res, () => handleDeleteShare(req, res));
                }
            } else {
                console.log(`❌ Groups/Shares UUID路由不匹配: ${subPath}/${id}`);
            }
        }
        
        // 未找到匹配的路由
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
        
    } catch (error) {
        console.error('收藏API处理错误:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

module.exports = {
    handle,
    handleGetFavorites,
    handleAddFavorite,
    handleBatchAddFavorites,
    handleUpdateFavorite,
    handleDeleteFavorite,
    handleReorderFavorites,
    handleUpdateFavoritesOrder,
    handleCheckFavorite,
    handleGetFavoriteCategories,
    handleGetFavoriteGroups,
    handleCreateFavoriteGroup,
    handleUpdateFavoriteGroup,
    handleDeleteFavoriteGroup,
    handleCreateFavoriteShare,
    handleGetUserShares,
    handleGetShareContent,
    handleDeleteShare,
    authenticateToken
};