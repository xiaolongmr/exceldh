/**
 * 响应工具类
 * 为原生Node.js HTTP响应对象添加Express.js风格的方法
 */

/**
 * 扩展原生响应对象，添加Express.js风格的方法
 * @param {Response} res - 原生HTTP响应对象
 */
function enhanceResponse(res) {
    // 如果已经扩展过，直接返回
    if (res.status && typeof res.status === 'function') {
        return res;
    }

    // 添加status方法
    res.status = function(code) {
        this.statusCode = code;
        return this;
    };

    // 添加json方法
    res.json = function(data) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(data));
        return this;
    };

    // 添加send方法
    res.send = function(data) {
        if (typeof data === 'object') {
            return this.json(data);
        }
        this.end(data);
        return this;
    };

    return res;
}

/**
 * 创建Express风格的响应对象
 * @param {Response} res - 原生HTTP响应对象
 * @returns {Response} 增强后的响应对象
 */
function createExpressStyleResponse(res) {
    return enhanceResponse(res);
}

/**
 * 发送JSON响应
 * @param {Response} res - 响应对象
 * @param {number} statusCode - 状态码
 * @param {Object} data - 响应数据
 */
function sendJsonResponse(res, statusCode = 200, data = {}) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

/**
 * 发送成功响应
 * @param {Response} res - 响应对象
 * @param {Object} data - 响应数据
 * @param {string} message - 成功消息
 */
function sendSuccess(res, data = null, message = 'Success') {
    sendJsonResponse(res, 200, {
        success: true,
        message,
        data
    });
}

/**
 * 发送错误响应
 * @param {Response} res - 响应对象
 * @param {number} statusCode - 错误状态码
 * @param {string} message - 错误消息
 * @param {Object} details - 错误详情
 */
function sendError(res, statusCode = 500, message = 'Internal Server Error', details = null) {
    sendJsonResponse(res, statusCode, {
        success: false,
        error: message,
        details
    });
}

/**
 * 发送未找到响应
 * @param {Response} res - 响应对象
 * @param {string} message - 错误消息
 */
function sendNotFound(res, message = 'Not Found') {
    sendError(res, 404, message);
}

/**
 * 发送未授权响应
 * @param {Response} res - 响应对象
 * @param {string} message - 错误消息
 */
function sendUnauthorized(res, message = 'Unauthorized') {
    sendError(res, 401, message);
}

/**
 * 发送方法不允许响应
 * @param {Response} res - 响应对象
 * @param {string} message - 错误消息
 */
function sendMethodNotAllowed(res, message = 'Method Not Allowed') {
    sendError(res, 405, message);
}

/**
 * 发送验证失败响应
 * @param {Response} res - 响应对象
 * @param {string} message - 错误消息
 * @param {Object} validationErrors - 验证错误详情
 */
function sendValidationError(res, message = 'Validation Failed', validationErrors = null) {
    sendError(res, 400, message, validationErrors);
}

module.exports = {
    enhanceResponse,
    createExpressStyleResponse,
    sendJsonResponse,
    sendSuccess,
    sendError,
    sendNotFound,
    sendUnauthorized,
    sendMethodNotAllowed,
    sendValidationError
};