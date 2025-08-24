/**
 * Neon 认证系统
 * 替换Firebase Auth，提供用户登录、注册、状态管理等核心功能
 */

import { API_BASE_URL, TokenUtils } from './neon-frontend-config.js';

// 调试: 检查TokenUtils导入
console.log('🔧 TokenUtils导入检查:', {
    TokenUtils,
    type: typeof TokenUtils,
    methods: Object.getOwnPropertyNames(TokenUtils)
});

/**
 * 全局变量
 */
let currentUser = null;
window.userProfile = window.userProfile || null;

/**
 * 用户认证状态管理类
 */
class NeonAuthManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化认证管理器
     */
    async init() {
        // 检查本地存储的令牌
        await this.checkStoredToken();
        
        // 绑定事件监听器
        this.bindEvents();
    }

    /**
     * 检查存储的令牌
     */
    async checkStoredToken() {
        const token = TokenUtils.getStoredToken();
        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        await this.handleUserLogin(result.user);
                        return;
                    }
                }
            } catch (error) {
                console.error('检查令牌失败:', error);
            }
            
            // 令牌无效，清除
            TokenUtils.removeStoredToken();
        }
        
        // 没有有效令牌，处理登出状态
        this.handleUserLogout();
    }

    /**
     * 处理用户登录
     * @param {Object} user - 用户对象
     */
    async handleUserLogin(user) {
        currentUser = user;
        console.log('用户邮箱:', user.email);
        console.log('用户ID:', user.id);

        // 获取用户详细资料
        await this.loadUserProfile();

        // 更新UI状态
        this.updateUIForLoggedInUser();

        // 显示用户头像
        this.showUserAvatar();

        // 隐藏登录按钮
        this.hideLoginButton();

        // 显示我的收藏模块
        this.showFavoritesBox();
        
        // 加载收藏数据
        if (window.loadFavsFromCloud) {
            await window.loadFavsFromCloud();
        }
        
        this.updateUpgradeBtnVisibility && this.updateUpgradeBtnVisibility();
    }

    /**
     * 处理用户登出
     */
    handleUserLogout() {
        currentUser = null;
        window.userProfile = null;
        console.log('用户已登出');

        // 更新UI状态
        this.updateUIForLoggedOutUser();

        // 隐藏用户头像
        this.hideUserAvatar();

        // 显示登录按钮
        this.showLoginButton();

        // 隐藏我的收藏模块
        this.hideFavoritesBox();
        this.updateUpgradeBtnVisibility && this.updateUpgradeBtnVisibility();
    }

    /**
     * 加载用户详细信息
     */
    async loadUserProfile() {
        try {
            const token = TokenUtils.getStoredToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    window.userProfile = {
                        nickname: result.profile.nickname || result.profile.displayName,
                        avatar: result.profile.avatar || this.getDefaultAvatar(result.profile.email),
                        bio: result.profile.bio || '',
                        createdAt: result.profile.createdAt,
                        lastLogin: result.profile.lastLogin
                    };
                }
            }
        } catch (error) {
            console.error('加载用户资料失败:', error);
            // 设置默认资料
            if (currentUser) {
                window.userProfile = {
                    nickname: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '用户'),
                    avatar: this.getDefaultAvatar(currentUser.email || ''),
                    bio: '',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
            }
        }
    }

    /**
     * 获取默认头像
     * @param {string} email - 用户邮箱
     * @returns {string} 头像URL
     */
    getDefaultAvatar(email) {
        // 如果是QQ邮箱，尝试获取QQ头像
        if (email.includes('@qq.com')) {
            const qqNumber = email.split('@')[0];
            if (/^\d+$/.test(qqNumber)) {
                return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`;
            }
        }

        // 默认头像
        return 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
    }

    /**
     * 更新登录用户UI
     */
    updateUIForLoggedInUser() {
        // 关闭登录弹窗
        this.closeLoginModal();

        // 更新用户头像显示
        this.updateUserAvatar();
    }

    /**
     * 更新登出用户UI
     */
    updateUIForLoggedOutUser() {
        // 清空表单
        this.clearLoginForm();

        // 隐藏下拉菜单
        this.hideUserDropdown();
    }

    /**
     * 显示用户头像
     */
    showUserAvatar() {
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            avatarBtn.style.display = 'block';
        }
    }

    /**
     * 隐藏用户头像
     */
    hideUserAvatar() {
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            avatarBtn.style.display = 'none';
        }
    }

    /**
     * 更新用户头像显示
     */
    updateUserAvatar() {
        const avatarContainer = document.getElementById('user-avatar-container');
        if (avatarContainer && window.userProfile) {
            const avatarImg = avatarContainer.querySelector('.user-avatar');
            const userName = avatarContainer.querySelector('.user-name');

            if (avatarImg) {
                avatarImg.src = window.userProfile.avatar;
                avatarImg.alt = window.userProfile.nickname || '访客';
            }

            if (userName) {
                userName.textContent = window.userProfile.nickname || '访客';
            }
        }
    }

    /**
     * 显示登录按钮
     */
    showLoginButton() {
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }
    }

    /**
     * 隐藏登录按钮
     */
    hideLoginButton() {
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
    }

    /**
     * 显示我的收藏模块
     */
    showFavoritesBox() {
        const favBox = document.getElementById('my-fav-box');
        if (favBox) {
            favBox.style.display = 'block';
        }
    }

    /**
     * 隐藏我的收藏模块
     */
    hideFavoritesBox() {
        const favBox = document.getElementById('my-fav-box');
        if (favBox) {
            favBox.style.display = 'none';
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 登录按钮点击事件
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // 用户头像点击事件
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            avatarBtn.addEventListener('click', () => this.toggleUserDropdown());
        }

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-avatar-btn')) {
                this.hideUserDropdown();
            }
        });

        // 登录表单提交事件
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单提交事件
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 匿名登录按钮事件
        const anonymousBtn = document.getElementById('anonymous-login-btn');
        if (anonymousBtn) {
            anonymousBtn.addEventListener('click', () => this.handleAnonymousLogin());
        }

        // 升级为正式账号按钮事件
        const upgradeBtn = document.getElementById('upgrade-account-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                document.getElementById('upgrade-modal').style.display = 'flex';
                document.getElementById('upgrade-email').value = '';
                document.getElementById('upgrade-password').value = '';
                document.getElementById('upgrade-email-error').textContent = '';
                document.getElementById('upgrade-password-error').textContent = '';
            });
        }

        // 弹窗取消按钮
        const cancelBtn = document.getElementById('upgrade-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('upgrade-modal').style.display = 'none';
            });
        }

        // 弹窗升级按钮
        const okBtn = document.getElementById('upgrade-ok-btn');
        if (okBtn) {
            okBtn.addEventListener('click', async () => {
                const email = document.getElementById('upgrade-email').value.trim();
                const password = document.getElementById('upgrade-password').value;
                let valid = true;
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                    document.getElementById('upgrade-email-error').textContent = '请输入有效邮箱';
                    valid = false;
                } else {
                    document.getElementById('upgrade-email-error').textContent = '';
                }
                if (!password || password.length < 6) {
                    document.getElementById('upgrade-password-error').textContent = '密码至少6位';
                    valid = false;
                } else {
                    document.getElementById('upgrade-password-error').textContent = '';
                }
                if (!valid) return;
                okBtn.disabled = true;
                okBtn.textContent = '升级中...';
                await this.handleUpgradeAccount(email, password);
                okBtn.disabled = false;
                okBtn.textContent = '升级';
                document.getElementById('upgrade-modal').style.display = 'none';
            });
        }
        
        // 绑定下拉菜单项事件
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
            logoutLink.dataset.hasListener = 'true'; // 标记事件已绑定
            console.log('✅ 退出登录事件已绑定');
        }
        
        const accountSettingsLink = document.getElementById('account-settings-link');
        if (accountSettingsLink) {
            accountSettingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                // 显示账号设置页面
                console.log('打开账号设置页面');
                alert('账号设置功能开发中...');
            });
            accountSettingsLink.dataset.hasListener = 'true';
            console.log('✅ 账号设置事件已绑定');
        }
        
        const profileCenterLink = document.getElementById('profile-center-link');
        if (profileCenterLink) {
            profileCenterLink.addEventListener('click', (e) => {
                e.preventDefault();
                // 显示个人中心页面
                console.log('打开个人中心页面');
                alert('个人中心功能开发中...');
            });
            profileCenterLink.dataset.hasListener = 'true';
            console.log('✅ 个人中心事件已绑定');
        }
        
        const systemNoticeLink = document.getElementById('system-notice-link');
        if (systemNoticeLink) {
            systemNoticeLink.addEventListener('click', (e) => {
                e.preventDefault();
                // 显示系统通知页面
                console.log('打开系统通知页面');
                alert('系统通知功能开发中...');
            });
            systemNoticeLink.dataset.hasListener = 'true';
            console.log('✅ 系统通知事件已绑定');
        }
    }

    /**
     * 显示登录弹窗
     */
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchToLoginMode();
            this.clearLoginForm();
            const info = this.loadLoginInfo && this.loadLoginInfo();
            if (info) {
                document.getElementById('login-email').value = info.email;
                document.getElementById('login-password').value = info.password;
                document.getElementById('remember-password').checked = true;
            } else {
                document.getElementById('remember-password').checked = false;
            }
        }
    }

    /**
     * 关闭登录弹窗
     */
    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'none';
            this.clearLoginForm();
        }
    }

    /**
     * 切换到登录模式
     */
    switchToLoginMode() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchBtn = document.getElementById('switch-mode-btn');

        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (switchBtn) switchBtn.textContent = '没有账号？立即注册';
    }

    /**
     * 切换到注册模式
     */
    switchToRegisterMode() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchBtn = document.getElementById('switch-mode-btn');

        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (switchBtn) switchBtn.textContent = '已有账号？立即登录';
    }

    /**
     * 清空登录表单
     */
    clearLoginForm() {
        const inputs = document.querySelectorAll('#login-modal input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });

        // 清除错误信息
        const errors = document.querySelectorAll('.form-error');
        errors.forEach(error => {
            error.style.display = 'none';
        });
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember-password').checked;
        const loginBtn = document.getElementById('login-btn');

        // 验证输入
        if (!this.validateEmail(email)) {
            this.showError('login-email', '请输入有效的邮箱地址');
            return;
        }

        if (!password) {
            this.showError('login-password', '请输入密码');
            return;
        }

        // 显示加载状态
        this.setLoadingState(loginBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                // 调试: 检查TokenUtils可用性
                console.log('🔧 登录成功，检查TokenUtils:', {
                    TokenUtils,
                    setStoredToken: typeof TokenUtils.setStoredToken,
                    methods: Object.getOwnPropertyNames(TokenUtils)
                });
                
                try {
                    // 保存令牌
                    TokenUtils.setStoredToken(result.token);
                    console.log('✅ 令牌保存成功');
                } catch (error) {
                    console.error('❌ TokenUtils.setStoredToken 调用失败:', error);
                    throw error;
                }
                
                // 保存登录信息（如果选择记住）
                if (remember) {
                    this.saveLoginInfo(email, password);
                } else {
                    this.clearLoginInfo();
                }

                // 处理登录成功
                await this.handleUserLogin(result.user);
                console.log('登录成功');
            } else {
                this.handleAuthError({ message: result.error });
            }
        } catch (error) {
            console.error('登录失败:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(loginBtn, false);
        }
    }

    /**
     * 处理注册
     */
    async handleRegister() {
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const nickname = document.getElementById('register-nickname').value.trim();
        const registerBtn = document.getElementById('register-btn');

        // 验证输入
        if (!this.validateEmail(email)) {
            this.showError('register-email', '请输入有效的邮箱地址');
            return;
        }

        if (password.length < 6) {
            this.showError('register-password', '密码至少需要6位');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register-confirm-password', '两次输入的密码不一致');
            return;
        }

        if (!nickname) {
            this.showError('register-nickname', '请输入昵称');
            return;
        }

        // 显示加载状态
        this.setLoadingState(registerBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    displayName: nickname 
                })
            });

            const result = await response.json();

            if (result.success) {
                // 保存令牌
                TokenUtils.setStoredToken(result.token);

                // 处理登录成功
                await this.handleUserLogin(result.user);
                console.log('注册成功');
            } else {
                this.handleAuthError({ message: result.error });
            }
        } catch (error) {
            console.error('注册失败:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(registerBtn, false);
        }
    }

    /**
     * 处理匿名登录
     */
    async handleAnonymousLogin() {
        const anonymousBtn = document.getElementById('anonymous-login-btn');
        this.setLoadingState(anonymousBtn, true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/anonymous`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                // 保存令牌
                TokenUtils.setStoredToken(result.token);

                // 处理登录成功
                await this.handleUserLogin(result.user);
                console.log('匿名登录成功');
            } else {
                this.handleAuthError({ message: result.error });
            }
        } catch (error) {
            console.error('匿名登录失败:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(anonymousBtn, false);
        }
    }

    /**
     * 处理匿名用户升级为正式账号
     */
    async handleUpgradeAccount(email, password) {
        try {
            const token = TokenUtils.getStoredToken();
            if (!token) {
                throw new Error('未找到认证令牌');
            }

            const response = await fetch(`${API_BASE_URL}/auth/upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                alert('升级成功，您的账号已绑定邮箱！');
                // 重新加载用户信息
                await this.checkStoredToken();
                this.updateUpgradeBtnVisibility && this.updateUpgradeBtnVisibility();
            } else {
                this.handleAuthError({ message: result.error });
            }
        } catch (error) {
            console.error('账号升级失败:', error);
            this.handleAuthError(error);
        }
    }

    /**
     * 处理登出
     */
    async handleLogout() {
        try {
            const token = TokenUtils.getStoredToken();
            if (token) {
                // 可选：调用服务端登出API
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }

            // 清除本地令牌
            TokenUtils.removeStoredToken();
            
            // 处理登出状态
            this.handleUserLogout();
            console.log('登出成功');
        } catch (error) {
            console.error('登出失败:', error);
            // 即使失败也要清除本地状态
            TokenUtils.removeStoredToken();
            this.handleUserLogout();
        }
    }

    /**
     * 切换用户下拉菜单
     */
    toggleUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    /**
     * 隐藏用户下拉菜单
     */
    hideUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 显示错误信息
     * @param {string} fieldId - 字段ID
     * @param {string} message - 错误信息
     */
    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentNode.querySelector('.form-error');

        if (field) {
            field.classList.add('error');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * 设置加载状态
     * @param {HTMLElement} button - 按钮元素
     * @param {boolean} loading - 是否加载中
     */
    setLoadingState(button, loading) {
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            button.dataset.originalText = button.textContent;
            button.textContent = '处理中...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = button.dataset.originalText || '登录';
        }
    }

    /**
     * 处理认证错误
     * @param {Object} error - 错误对象
     */
    handleAuthError(error) {
        let message = '操作失败';

        if (error.message) {
            message = error.message;
        }

        alert(message);
    }

    /**
     * 获取当前用户
     * @returns {Object|null} 当前用户对象
     */
    getCurrentUser() {
        return currentUser;
    }

    /**
     * 获取用户资料
     * @returns {Object|null} 用户资料对象
     */
    getUserProfile() {
        return window.userProfile;
    }

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return currentUser !== null;
    }

    /**
     * 保存登录信息
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     */
    saveLoginInfo(email, password) {
        // 简单加密（仅防止明文，非安全加密）
        localStorage.setItem('rememberLogin', JSON.stringify({
            email,
            password: window.btoa(unescape(encodeURIComponent(password)))
        }));
    }

    /**
     * 清除登录信息
     */
    clearLoginInfo() {
        localStorage.removeItem('rememberLogin');
    }

    /**
     * 加载登录信息
     * @returns {Object|null} 登录信息对象
     */
    loadLoginInfo() {
        const data = localStorage.getItem('rememberLogin');
        if (!data) return null;
        try {
            const obj = JSON.parse(data);
            return {
                email: obj.email,
                password: decodeURIComponent(escape(window.atob(obj.password)))
            };
        } catch (e) { return null; }
    }

    /**
     * 显示/隐藏"升级为正式账号"按钮
     */
    updateUpgradeBtnVisibility() {
        const upgradeBtn = document.getElementById('upgrade-account-btn');
        if (upgradeBtn) {
            if (currentUser && currentUser.isAnonymous) {
                upgradeBtn.style.display = 'block';
            } else {
                upgradeBtn.style.display = 'none';
            }
        }
    }
}

/**
 * 全局认证管理器实例
 */
window.authManager = new NeonAuthManager();

/**
 * 全局函数 - 显示登录弹窗
 */
window.showLoginModal = function () {
    window.authManager.showLoginModal();
};

/**
 * 全局函数 - 关闭登录弹窗
 */
window.closeLoginModal = function () {
    window.authManager.closeLoginModal();
};

/**
 * 全局函数 - 切换登录/注册模式
 */
window.switchAuthMode = function () {
    const loginForm = document.getElementById('login-form');
    if (loginForm && loginForm.style.display !== 'none') {
        window.authManager.switchToRegisterMode();
    } else {
        window.authManager.switchToLoginMode();
    }
};

/**
 * 全局函数 - 登出
 */
window.logout = function () {
    window.authManager.handleLogout();
};

/**
 * 全局函数 - 重置密码（需要实现）
 */
window.resetPassword = function () {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        alert('请先输入邮箱地址');
        return;
    }

    // TODO: 实现重置密码功能
    alert('重置密码功能暂未实现，请联系管理员');
};

// 密码可见切换功能
function setupPasswordVisibilityToggles() {
    document.querySelectorAll('.toggle-password-visibility').forEach(btn => {
        const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
        btn.onclick = function () {
            if (!input) return;
            const isVisible = input.type === 'text';
            input.type = isVisible ? 'password' : 'text';
            // 切换图标
            btn.innerHTML = isVisible
                ? `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                : `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 5.06-6.06M1 1l22 22"/><path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/></svg>`;
        };
    });
}

// 页面加载和弹窗切换时都要调用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPasswordVisibilityToggles);
} else {
    setupPasswordVisibilityToggles();
}

// 登录/注册模式切换后也要重新绑定
const origSwitchToLoginMode = NeonAuthManager.prototype.switchToLoginMode;
NeonAuthManager.prototype.switchToLoginMode = function () {
    origSwitchToLoginMode.call(this);
    setTimeout(() => {
        const info = this.loadLoginInfo && this.loadLoginInfo();
        if (info) {
            document.getElementById('login-email').value = info.email;
            document.getElementById('login-password').value = info.password;
            document.getElementById('remember-password').checked = true;
        } else {
            document.getElementById('remember-password').checked = false;
        }
        setupPasswordVisibilityToggles();
    }, 0);
};

const origSwitchToRegisterMode = NeonAuthManager.prototype.switchToRegisterMode;
NeonAuthManager.prototype.switchToRegisterMode = function () {
    origSwitchToRegisterMode.call(this);
    setTimeout(setupPasswordVisibilityToggles, 0);
};

// 导出认证管理器供其他模块使用
export { NeonAuthManager };