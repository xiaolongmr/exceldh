/**
 * AuthManager 初始化脚本
 * 确保全局认证管理器正确初始化
 */

console.log('🔧 AuthManager 初始化脚本已加载');

// 创建全局认证管理器
function createAuthManager() {
    console.log('🏗️ 创建全局认证管理器...');
    
    window.authManager = {
        // 状态属性
        currentUser: null,
        isAuthenticated: false,
        token: null,
        
        // 设置用户信息
        setUser: function(userData, authToken) {
            this.currentUser = userData;
            this.isAuthenticated = true;
            this.token = authToken;
            
            // 存储到 localStorage
            if (authToken) {
                localStorage.setItem('neon_auth_token', authToken);
            }
            
            console.log('✅ 用户信息已设置:', userData.email);
            
            // 触发事件
            window.dispatchEvent(new CustomEvent('userLoggedIn', {
                detail: { user: userData, token: authToken }
            }));
        },
        
        // 清除用户信息
        clearUser: function() {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.token = null;
            
            // 清除存储
            localStorage.removeItem('neon_auth_token');
            
            console.log('🗑️ 用户信息已清除');
            
            // 触发事件
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
        },
        
        // 获取当前用户
        getCurrentUser: function() {
            return this.currentUser;
        },
        
        // 检查是否已认证
        isUserAuthenticated: function() {
            return this.isAuthenticated && this.currentUser && this.token;
        },
        
        // 获取认证令牌
        getToken: function() {
            return this.token || localStorage.getItem('neon_auth_token');
        },
        
        // 初始化认证状态
        initializeAuth: async function() {
            console.log('🚀 初始化认证状态...');
            
            const token = localStorage.getItem('neon_auth_token');
            if (!token) {
                console.log('❌ 未找到认证令牌');
                return false;
            }
            
            try {
                // 验证令牌
                const response = await fetch('/api/auth/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.setUser(data.user, token);
                    console.log('✅ 认证状态初始化成功');
                    return true;
                } else {
                    console.log('❌ 令牌验证失败');
                    this.clearUser();
                    return false;
                }
            } catch (error) {
                console.error('❌ 认证初始化失败:', error);
                this.clearUser();
                return false;
            }
        },
        
        // 执行登录
        login: async function(email, password) {
            console.log('🔑 执行登录:', email);
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.setUser(data.user, data.token);
                        console.log('✅ 登录成功');
                        return { success: true, user: data.user };
                    }
                }
                
                const errorData = await response.json();
                throw new Error(errorData.error || '登录失败');
                
            } catch (error) {
                console.error('❌ 登录失败:', error);
                return { success: false, error: error.message };
            }
        },
        
        // 执行登出
        logout: async function() {
            console.log('👋 执行登出...');
            
            try {
                const token = this.getToken();
                if (token) {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('⚠️ 登出请求失败:', error);
            }
            
            this.clearUser();
            console.log('✅ 登出完成');
        }
    };
    
    console.log('✅ AuthManager 创建完成');
    return window.authManager;
}

// 初始化函数
async function initializeAuthManager() {
    console.log('🚀 开始初始化 AuthManager...');
    
    // 创建 authManager（如果不存在）
    if (!window.authManager) {
        createAuthManager();
    }
    
    // 尝试从存储中恢复认证状态
    const success = await window.authManager.initializeAuth();
    
    if (success) {
        console.log('🎉 AuthManager 初始化成功！');
        
        // 显示用户信息
        const user = window.authManager.getCurrentUser();
        console.log('👤 当前用户:', user.email);
        
        // 更新页面显示
        updatePageDisplay(user);
        
        // 加载收藏
        if (typeof window.loadFavsFromCloud === 'function') {
            console.log('📋 开始加载收藏...');
            window.loadFavsFromCloud();
        }
        
    } else {
        console.log('⚠️ 用户未登录或令牌无效');
    }
    
    return success;
}

// 更新页面显示
function updatePageDisplay(user) {
    // 显示收藏区域
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        favBox.style.display = 'block';
    }
    
    // 更新用户显示
    const userElements = document.querySelectorAll('.user-email');
    userElements.forEach(el => {
        if (el) el.textContent = user.email;
    });
    
    const nameElements = document.querySelectorAll('.user-name');
    nameElements.forEach(el => {
        if (el) el.textContent = user.displayName || user.profile?.nickname || user.email;
    });
}

// 全局函数
window.createAuthManager = createAuthManager;
window.initializeAuthManager = initializeAuthManager;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeAuthManager, 500);
    });
} else {
    setTimeout(initializeAuthManager, 500);
}

console.log('💡 可用命令:');
console.log('  - initializeAuthManager() : 初始化认证管理器');
console.log('  - authManager.initializeAuth() : 重新初始化认证状态');