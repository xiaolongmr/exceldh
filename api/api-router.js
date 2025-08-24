/**
 * API路由处理器
 * 统一处理所有API请求
 */

// 导入响应工具
const { enhanceResponse, sendJsonResponse, sendSuccess, sendError, sendNotFound, sendMethodNotAllowed } = require('./response-utils');

// 导入所有处理器
const dbHandler = require('./db-handler');
const authHandler = require('./auth-handler');
const favoritesHandler = require('./favorites-handler');
const profileHandler = require('./profile-handler');
const sharesHandler = require('./shares-handler');

/**
 * 主API路由处理函数
 * @param {Request} req - 请求对象
 * @param {Response} res - 响应对象
 */
async function handleApiRequest(req, res) {
    // 增强响应对象，添加Express.js风格的方法
    res = enhanceResponse(res);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 解析URL路径
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part !== '');
    
    // 移除'api'前缀
    if (pathParts[0] === 'api') {
        pathParts.shift();
    }

    const endpoint = pathParts[0];
    const subEndpoint = pathParts[1];
    const id = pathParts[2];

    console.log(`API Request: ${req.method} ${url.pathname}`);
    console.log(`🔄 路径解析: endpoint=${endpoint}, subEndpoint=${subEndpoint}, id=${id}`);
    
    // 特别记录reorder请求
    if (subEndpoint === 'reorder') {
        console.log('🎯 检测到reorder请求!');
        console.log('请求方法:', req.method);
        console.log('请求路径:', url.pathname);
    }

    try {
        // 数据库相关API
        if (endpoint === 'db-query') {
            return await dbHandler.handleDatabaseQuery(req, res);
        }

        if (endpoint === 'hash-password') {
            return await dbHandler.handleHashPassword(req, res);
        }

        if (endpoint === 'verify-password') {
            return await dbHandler.handleVerifyPassword(req, res);
        }

        if (endpoint === 'generate-token') {
            return await dbHandler.handleGenerateToken(req, res);
        }

        if (endpoint === 'verify-token') {
            return await dbHandler.handleVerifyToken(req, res);
        }

        // 认证相关API
        if (endpoint === 'auth') {
            if (subEndpoint === 'register') {
                return await authHandler.handleUserRegister(req, res);
            }
            
            if (subEndpoint === 'login') {
                return await authHandler.handleUserLogin(req, res);
            }
            
            if (subEndpoint === 'anonymous') {
                return await authHandler.handleAnonymousLogin(req, res);
            }
            
            if (subEndpoint === 'upgrade') {
                // 需要认证
                return await authHandler.authenticateToken(req, res, () => 
                    authHandler.handleUpgradeAccount(req, res)
                );
            }
            
            if (subEndpoint === 'logout') {
                // 需要认证
                return await authHandler.authenticateToken(req, res, () => 
                    authHandler.handleUserLogout(req, res)
                );
            }
            
            if (subEndpoint === 'user') {
                // 需要认证
                return await authHandler.authenticateToken(req, res, () => 
                    authHandler.handleGetUserInfo(req, res)
                );
            }
        }

        // 用户资料相关API
        if (endpoint === 'profile') {
            // 所有profile API都需要认证
            if (subEndpoint === undefined) {
                return await profileHandler.authenticateToken(req, res, () => {
                    if (req.method === 'GET') {
                        return profileHandler.handleGetUserProfile(req, res);
                    } else if (req.method === 'PUT') {
                        return profileHandler.handleUpdateUserProfile(req, res);
                    }
                    return res.status(405).json({ error: 'Method not allowed' });
                });
            }
            
            if (subEndpoint === 'avatar') {
                return await profileHandler.authenticateToken(req, res, () => 
                    profileHandler.handleUploadAvatar(req, res)
                );
            }
            
            if (subEndpoint === 'email') {
                return await profileHandler.authenticateToken(req, res, () => 
                    profileHandler.handleUpdateEmail(req, res)
                );
            }
            
            if (subEndpoint === 'password') {
                return await profileHandler.authenticateToken(req, res, () => 
                    profileHandler.handleChangePassword(req, res)
                );
            }
            
            if (subEndpoint === 'delete') {
                return await profileHandler.authenticateToken(req, res, () => 
                    profileHandler.handleDeleteAccount(req, res)
                );
            }
            
            if (subEndpoint === 'stats') {
                return await profileHandler.authenticateToken(req, res, () => 
                    profileHandler.handleGetUserStats(req, res)
                );
            }
        }

        // 收藏相关API
        if (endpoint === 'favorites') {
            // 所有favorites API都需要认证
            if (subEndpoint === undefined) {
                return await favoritesHandler.authenticateToken(req, res, () => {
                    if (req.method === 'GET') {
                        return favoritesHandler.handleGetFavorites(req, res);
                    } else if (req.method === 'POST') {
                        return favoritesHandler.handleAddFavorite(req, res);
                    }
                    return res.status(405).json({ error: 'Method not allowed' });
                });
            }
            
            if (subEndpoint === 'batch') {
                return await favoritesHandler.authenticateToken(req, res, () => 
                    favoritesHandler.handleBatchAddFavorites(req, res)
                );
            }
            
            if (subEndpoint === 'order') {
                return await favoritesHandler.authenticateToken(req, res, () => 
                    favoritesHandler.handleUpdateFavoritesOrder(req, res)
                );
            }
            
            if (subEndpoint === 'check') {
                return await favoritesHandler.authenticateToken(req, res, () => 
                    favoritesHandler.handleCheckFavorite(req, res)
                );
            }
            
            if (subEndpoint === 'categories') {
                return await favoritesHandler.authenticateToken(req, res, () => 
                    favoritesHandler.handleGetFavoriteCategories(req, res)
                );
            }
            
            if (subEndpoint === 'reorder') {
                console.log('✅ 进入reorder路由处理逻辑');
                return await favoritesHandler.authenticateToken(req, res, () => {
                    console.log('✅ 认证通过，调用handleReorderFavorites');
                    return favoritesHandler.handleReorderFavorites(req, res);
                });
            }
            
            // 处理特定收藏的操作 (PUT/DELETE /api/favorites/:id)
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (uuidRegex.test(subEndpoint)) {
                req.params = { id: subEndpoint };
                return await favoritesHandler.authenticateToken(req, res, () => {
                    if (req.method === 'PUT') {
                        return favoritesHandler.handleUpdateFavorite(req, res);
                    } else if (req.method === 'DELETE') {
                        return favoritesHandler.handleDeleteFavorite(req, res);
                    }
                    return res.status(405).json({ error: 'Method not allowed' });
                });
            }
        }

        // 分享相关API
        if (endpoint === 'shares') {
            if (subEndpoint === undefined) {
                if (req.method === 'GET') {
                    // 获取用户的分享列表 - 需要认证
                    return await sharesHandler.authenticateToken(req, res, () =>
                        sharesHandler.handleGetUserShares(req, res)
                    );
                } else if (req.method === 'POST') {
                    // 创建分享 - 需要认证
                    return await sharesHandler.authenticateToken(req, res, () =>
                        sharesHandler.handleCreateShare(req, res)
                    );
                }
                return res.status(405).json({ error: 'Method not allowed' });
            }
            
            // 处理特定分享的操作
            if (subEndpoint) {
                req.params = { shareId: subEndpoint };
                if (req.method === 'GET') {
                    // 获取分享内容 - 无需认证（公开接口）
                    return await sharesHandler.handleGetShare(req, res);
                } else if (req.method === 'DELETE') {
                    // 删除分享 - 需要认证
                    return await sharesHandler.authenticateToken(req, res, () =>
                        sharesHandler.handleDeleteShare(req, res)
                    );
                }
                return res.status(405).json({ error: 'Method not allowed' });
            }
        }

        // 健康检查API
        if (endpoint === 'health') {
            return sendSuccess(res, {
                timestamp: new Date().toISOString()
            }, 'API is healthy');
        }

        // 未找到的API端点
        return sendNotFound(res, 'API endpoint not found');

    } catch (error) {
        console.error('API Error:', error);
        console.error('Error stack:', error.stack);
        return sendError(res, 500, 'Internal server error', { details: error.message });
    }
}

/**
 * 解析请求体
 * @param {Request} req 
 * @returns {Promise<void>}
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
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

/**
 * Express.js 风格的中间件处理器
 * @param {Request} req 
 * @param {Response} res 
 */
async function expressStyleHandler(req, res) {
    try {
        // 增强响应对象
        res = enhanceResponse(res);
        
        // 解析请求体
        await parseRequestBody(req);
        
        // 处理API请求
        await handleApiRequest(req, res);
        
    } catch (error) {
        console.error('Request processing error:', error);
        return sendError(res, 400, error.message);
    }
}

module.exports = {
    handleApiRequest,
    expressStyleHandler,
    parseRequestBody
};