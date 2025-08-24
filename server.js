/**
 * 简单的Node.js服务器
 * 处理API请求和静态文件服务
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { expressStyleHandler } = require('./api/api-router');

const PORT = process.env.PORT || 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

/**
 * 获取文件的MIME类型
 * @param {string} filePath 
 * @returns {string}
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 服务静态文件
 * @param {*} req 
 * @param {*} res 
 * @param {*} filePath 
 */
function serveStaticFile(req, res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

/**
 * 主请求处理器
 * @param {*} req 
 * @param {*} res 
 */
async function requestHandler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    console.log(`${req.method} ${pathname}`);

    // 处理API请求
    if (pathname.startsWith('/api/')) {
        return await expressStyleHandler(req, res);
    }

    // 处理分享页面路由
    if (pathname.startsWith('/share/')) {
        // 所有/share/xxx路径都返回share.html
        filePath = path.join(__dirname, 'share.html');
        return serveStaticFile(req, res, filePath);
    }

    // 处理静态文件请求
    let filePath;
    if (pathname === '/') {
        filePath = path.join(__dirname, 'index.html');
    } else {
        filePath = path.join(__dirname, pathname);
    }

    // 安全检查：防止目录遍历攻击
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // 检查文件是否存在
    fs.access(normalizedPath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        // 检查是否为目录
        fs.stat(normalizedPath, (err, stats) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }

            if (stats.isDirectory()) {
                // 如果是目录，尝试提供index.html
                const indexPath = path.join(normalizedPath, 'index.html');
                fs.access(indexPath, fs.constants.F_OK, (err) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Directory listing not allowed');
                        return;
                    }
                    serveStaticFile(req, res, indexPath);
                });
            } else {
                // 提供文件
                serveStaticFile(req, res, normalizedPath);
            }
        });
    });
}

// 创建服务器
const server = http.createServer(requestHandler);

// 启动服务器
server.listen(PORT, (err) => {
    if (err) {
        console.error('服务器启动失败:', err);
        return;
    }
    
    console.log(`=== Neon Auth Server ===`);
    console.log(`服务器运行在: http://localhost:${PORT}`);
    console.log(`静态文件目录: ${__dirname}`);
    console.log(`API端点: http://localhost:${PORT}/api/`);
    console.log(`========================\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});