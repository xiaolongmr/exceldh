/**
 * 前端 Neon 配置
 * 浏览器端使用的配置信息
 */

// API基础URL配置
export const API_BASE_URL = window.location.origin + '/api';

// 前端配置选项
export const FRONTEND_CONFIG = {
    // 登录相关配置
    auth: {
        rememberLoginKey: 'rememberLogin',
        tokenKey: 'neon_auth_token',
        sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
    },
    
    // API请求配置
    api: {
        timeout: 30000, // 30秒
        retryAttempts: 3,
        retryDelay: 1000, // 1秒
    },
    
    // UI配置
    ui: {
        loadingDelay: 300, // 显示加载状态的延迟
        toastDuration: 3000, // 提示消息显示时间
    },
    
    // 调试配置
    debug: {
        enableConsoleLog: true,
        enableNetworkLog: false,
    }
};

// 令牌工具类
export class TokenUtils {
    /**
     * 存储令牌
     * @param {string} token - JWT令牌
     */
    static setStoredToken(token) {
        localStorage.setItem(FRONTEND_CONFIG.auth.tokenKey, token);
    }

    /**
     * 获取存储的令牌
     * @returns {string|null} JWT令牌
     */
    static getStoredToken() {
        return localStorage.getItem(FRONTEND_CONFIG.auth.tokenKey);
    }

    /**
     * 移除存储的令牌
     */
    static removeStoredToken() {
        localStorage.removeItem(FRONTEND_CONFIG.auth.tokenKey);
    }

    /**
     * 检查令牌是否存在
     * @returns {boolean} 是否存在令牌
     */
    static hasToken() {
        return !!this.getStoredToken();
    }

    /**
     * 解析JWT令牌载荷（不验证签名）
     * @param {string} token - JWT令牌
     * @returns {Object|null} 令牌载荷
     */
    static parseTokenPayload(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (error) {
            console.error('解析令牌失败:', error);
            return null;
        }
    }

    /**
     * 检查令牌是否过期
     * @param {string} token - JWT令牌
     * @returns {boolean} 是否过期
     */
    static isTokenExpired(token) {
        const payload = this.parseTokenPayload(token);
        if (!payload || !payload.exp) return true;
        
        return Date.now() >= payload.exp * 1000;
    }
}

// HTTP请求工具类
export class ApiClient {
    /**
     * 发送GET请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    static async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    /**
     * 发送POST请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    static async post(endpoint, data = null, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    /**
     * 发送PUT请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    static async put(endpoint, data = null, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    /**
     * 发送DELETE请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    static async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    /**
     * 通用请求方法
     * @param {string} method - HTTP方法
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    static async request(method, endpoint, data = null, options = {}) {
        const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        
        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 添加认证头
        const token = TokenUtils.getStoredToken();
        if (token && !TokenUtils.isTokenExpired(token)) {
            requestOptions.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求体
        if (data && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, requestOptions);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            if (FRONTEND_CONFIG.debug.enableNetworkLog) {
                console.error(`API请求失败 [${method} ${url}]:`, error);
            }
            throw error;
        }
    }
}

// 默认导出
export default {
    API_BASE_URL,
    FRONTEND_CONFIG,
    TokenUtils,
    ApiClient
};