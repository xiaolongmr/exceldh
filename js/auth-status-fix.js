/**
 * 登录状态检测和修复脚本
 * 解决登录状态检测不准确的问题
 */

console.log('🔍 登录状态检测脚本已加载');

// 检查所有可能的认证令牌存储位置
function checkAllAuthTokens() {
    console.log('🔍 检查所有认证令牌存储位置...');
    
    const tokenSources = [
        { name: 'neon_auth_token', key: 'neon_auth_token' },
        { name: 'authToken', key: 'authToken' },
        { name: 'auth_token', key: 'auth_token' },
        { name: 'token', key: 'token' },
        { name: 'userToken', key: 'userToken' }
    ];
    
    let foundToken = null;
    
    tokenSources.forEach(source => {
        const token = localStorage.getItem(source.key);
        if (token) {
            console.log(`✅ 找到令牌: ${source.name} = ${token.substring(0, 20)}...`);
            if (!foundToken) {
                foundToken = token;
            }
        } else {
            console.log(`❌ 未找到令牌: ${source.name}`);
        }
    });
    
    // 检查 sessionStorage
    tokenSources.forEach(source => {
        const token = sessionStorage.getItem(source.key);
        if (token) {
            console.log(`✅ 在sessionStorage找到令牌: ${source.name} = ${token.substring(0, 20)}...`);
            if (!foundToken) {
                foundToken = token;
            }
        }
    });
    
    return foundToken;
}

// 验证令牌有效性
async function validateToken(token) {
    if (!token) return false;
    
    try {
        console.log(`🔍 验证令牌: ${token.substring(0, 20)}...`);
        
        const response = await fetch('/api/auth/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ 令牌有效 - 用户: ${data.user.email}`);
            return data.user;
        } else {
            console.log(`❌ 令牌无效 - 状态: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 令牌验证失败:`, error);
        return false;
    }
}

// 修复登录状态
async function fixAuthStatus() {
    console.log('🔧 开始修复登录状态...');
    
    // 1. 检查所有可能的令牌
    const token = checkAllAuthTokens();
    
    if (!token) {
        console.log('❌ 未找到任何认证令牌');
        return false;
    }
    
    // 2. 验证令牌
    const user = await validateToken(token);
    
    if (!user) {
        console.log('❌ 所有令牌都无效');
        return false;
    }
    
    // 3. 确保令牌存储在正确位置
    localStorage.setItem('neon_auth_token', token);
    console.log('✅ 已将有效令牌存储到 neon_auth_token');
    
    // 4. 创建或更新全局认证管理器
    if (!window.authManager) {
        console.log('🔧 创建 authManager...');
        window.authManager = {
            currentUser: null,
            isAuthenticated: false,
            token: null,
            
            // 设置用户信息
            setUser: function(userData, authToken) {
                this.currentUser = userData;
                this.isAuthenticated = true;
                this.token = authToken;
                console.log('✅ authManager 用户信息已设置');
            },
            
            // 清除用户信息
            clearUser: function() {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.token = null;
                console.log('✅ authManager 用户信息已清除');
            },
            
            // 获取当前用户
            getCurrentUser: function() {
                return this.currentUser;
            },
            
            // 检查是否已认证
            isUserAuthenticated: function() {
                return this.isAuthenticated && this.currentUser && this.token;
            }
        };
        console.log('✅ authManager 已创建');
    }
    
    // 5. 设置认证状态
    window.authManager.setUser(user, token);
    console.log('✅ 已更新全局认证状态');
    
    // 6. 触发登录状态更新事件
    window.dispatchEvent(new CustomEvent('authStatusChanged', {
        detail: { user, authenticated: true }
    }));
    
    // 7. 更新页面显示
    updatePageAuthStatus(user);
    
    console.log('🎉 登录状态修复完成！');
    return true;
}

// 更新页面认证状态显示
function updatePageAuthStatus(user) {
    console.log('🎨 更新页面认证状态显示...');
    
    // 更新用户显示区域
    const userDisplayElements = [
        document.getElementById('user-info'),
        document.querySelector('.user-display'),
        document.querySelector('.auth-info')
    ];
    
    userDisplayElements.forEach(element => {
        if (element) {
            element.style.display = 'block';
            if (element.querySelector) {
                const emailElement = element.querySelector('.user-email');
                const nameElement = element.querySelector('.user-name');
                
                if (emailElement) emailElement.textContent = user.email;
                if (nameElement) nameElement.textContent = user.displayName || user.profile?.nickname || user.email;
            }
        }
    });
    
    // 隐藏登录按钮，显示用户菜单
    const loginButton = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (loginButton) loginButton.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    
    // 显示收藏区域
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        favBox.style.display = 'block';
        console.log('✅ 收藏区域已显示');
    }
    
    console.log('✅ 页面认证状态显示已更新');
}
async function comprehensiveAuthCheck() {
    console.log('🚀 开始全面登录状态检查...');
    
    // 检查 localStorage
    const neonToken = localStorage.getItem('neon_auth_token');
    console.log('neon_auth_token:', neonToken ? `${neonToken.substring(0, 20)}...` : '未找到');
    
    // 检查认证管理器
    if (window.authManager) {
        console.log('authManager.isAuthenticated:', window.authManager.isAuthenticated);
        console.log('authManager.currentUser:', window.authManager.currentUser);
    } else {
        console.log('❌ authManager 不存在');
    }
    
    // 尝试修复
    const fixed = await fixAuthStatus();
    
    if (fixed) {
        console.log('✅ 登录状态已修复，重新检查...');
        
        // 重新检查
        const finalToken = localStorage.getItem('neon_auth_token');
        if (finalToken) {
            const user = await validateToken(finalToken);
            if (user) {
                console.log(`🎉 最终确认 - 用户已登录: ${user.email}`);
                return true;
            }
        }
    }
    
    console.log('❌ 用户确实未登录');
    return false;
}

// 暴露全局函数
window.checkAllAuthTokens = checkAllAuthTokens;
window.validateToken = validateToken;
window.fixAuthStatus = fixAuthStatus;
window.comprehensiveAuthCheck = comprehensiveAuthCheck;

// 自动执行检查
setTimeout(() => {
    console.log('⚡ 自动执行登录状态检查...');
    comprehensiveAuthCheck();
}, 500);

console.log('💡 可用命令:');
console.log('  - checkAllAuthTokens() : 检查所有令牌');
console.log('  - fixAuthStatus() : 修复登录状态');
console.log('  - comprehensiveAuthCheck() : 全面检查');