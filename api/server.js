/**
 * Neon API 服务器
 * 提供认证、收藏等API服务
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// 导入处理器
const authHandler = require('./auth-handler');
const favoritesHandler = require('./favorites-handler');
const profileHandler = require('./profile-handler');
const { sendResponse } = require('./response-utils');

// 服务器配置
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// CORS 头部
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
}

// 静态文件服务
function serveStaticFile(req, res, filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                sendResponse(res, 404, { error: 'File not found' });
            } else {
                sendResponse(res, 500, { error: 'Internal server error' });
            }
            return;
        }
        
        // 设置正确的 Content-Type
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        const contentType = mimeTypes[ext] || 'text/plain';
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
    });
}

// 主要请求处理器
async function handleRequest(req, res) {
    // 设置 CORS 头部
    setCORSHeaders(res);
    
    // 处理 OPTIONS 请求（预检请求）
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 解析 URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    
    console.log(`${new Date().toISOString()} - ${method} ${pathname}`);
    
    try {
        // API 路由
        if (pathname.startsWith('/api/')) {
            
            // 健康检查
            if (pathname === '/api/health') {
                sendResponse(res, 200, { 
                    status: 'healthy', 
                    timestamp: new Date().toISOString(),
                    service: 'Neon API Server'
                });
                return;
            }
            
            // 分享内容获取API（公开访问）
            if (pathname.startsWith('/api/share/')) {
                const shareKey = pathname.split('/')[3];
                if (shareKey) {
                    // 直接调用favorites-handler的handleGetShareContent
                    req.params = { shareKey };
                    req.url = pathname + (parsedUrl.search || '');
                    await favoritesHandler.handleGetShareContent(req, res);
                    return;
                }
            }
            
            // 认证相关 API
            if (pathname.startsWith('/api/auth/')) {
                await authHandler.handle(req, res, pathname, method);
                return;
            }
            
            // 收藏相关 API
            if (pathname.startsWith('/api/favorites')) {
                await favoritesHandler.handle(req, res, pathname, method);
                return;
            }
            
            // 用户资料相关 API
            if (pathname.startsWith('/api/profile')) {
                await profileHandler.handle(req, res, pathname, method);
                return;
            }
            
            // 未找到的 API 路由
            sendResponse(res, 404, { error: 'API endpoint not found' });
            return;
        }
        
        // 分享页面路由
        if (pathname.startsWith('/share/')) {
            serveStaticFile(req, res, '/share.html');
            return;
        }
        
        // 静态文件服务
        let filePath = pathname === '/' ? '/index.html' : pathname;
        
        // 安全检查：防止目录遍历攻击
        if (filePath.includes('..')) {
            sendResponse(res, 403, { error: 'Forbidden' });
            return;
        }
        
        serveStaticFile(req, res, filePath);
        
    } catch (error) {
        console.error('请求处理错误:', error);
        sendResponse(res, 500, { error: 'Internal server error' });
    }
}

// 创建 HTTP 服务器
const server = http.createServer(handleRequest);

// 错误处理
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用`);
        console.log('💡 请尝试以下解决方案：');
        console.log(`   1. 使用其他端口：PORT=3001 node api/server.js`);
        console.log(`   2. 查找占用进程：netstat -ano | findstr :${PORT}`);
        console.log(`   3. 终止占用进程：taskkill /PID <进程ID> /F`);
        process.exit(1);
    } else {
        console.error('❌ 服务器错误:', error);
        process.exit(1);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

// 启动服务器
server.listen(PORT, HOST, () => {
    console.log('🚀 Neon API 服务器已启动');
    console.log(`📍 地址: http://${HOST}:${PORT}`);
    console.log(`🕒 启动时间: ${new Date().toISOString()}`);
    console.log('🔧 可用端点:');
    console.log('   GET  /api/health           - 健康检查');
    console.log('   POST /api/auth/login       - 用户登录');
    console.log('   POST /api/auth/register    - 用户注册');
    console.log('   GET  /api/favorites        - 获取收藏');
    console.log('   POST /api/favorites        - 添加收藏');
    console.log('   GET  /api/profile          - 获取用户资料');
    console.log('   PUT  /api/profile          - 更新用户资料');
    console.log('');
    console.log('🌐 静态文件服务: http://localhost:3000/');
    console.log('📋 测试页面: http://localhost:3000/test-module-loading.html');
    console.log('');
    console.log('💡 使用 Ctrl+C 停止服务器');
});

module.exports = server;