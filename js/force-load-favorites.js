/**
 * 强制加载收藏功能模块
 * 用于解决模块加载时序问题
 */

console.log('🚀 强制加载收藏功能模块...');

// 等待一段时间确保认证系统已经初始化
setTimeout(() => {
    console.log('🔍 开始检查和初始化收藏功能...');
    
    // 检查认证状态
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        console.log('❌ 用户未登录，无法加载收藏');
        return;
    }
    
    console.log('✅ 用户已登录，开始初始化收藏功能');
    
    // 强制重新加载收藏功能
    if (typeof window.loadFavsFromCloud === 'function') {
        console.log('📋 loadFavsFromCloud函数存在，开始加载收藏...');
        window.loadFavsFromCloud().then(() => {
            console.log('✅ 收藏加载完成');
        }).catch(error => {
            console.error('❌ 收藏加载失败:', error);
        });
    } else {
        console.log('❌ loadFavsFromCloud函数不存在');
        
        // 尝试重新加载脚本
        console.log('🔄 尝试重新加载收藏脚本...');
        const script = document.createElement('script');
        script.src = 'js/neon-favorites-global.js';
        script.onload = () => {
            console.log('✅ 收藏脚本重新加载完成');
            setTimeout(() => {
                if (typeof window.loadFavsFromCloud === 'function') {
                    console.log('📋 重新加载后，开始加载收藏...');
                    window.loadFavsFromCloud();
                }
            }, 1000);
        };
        script.onerror = () => {
            console.error('❌ 收藏脚本重新加载失败');
        };
        document.head.appendChild(script);
    }
    
    // 检查和显示收藏区域
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        favBox.style.display = 'block';
        console.log('✅ 收藏区域已显示');
    } else {
        console.log('❌ 找不到收藏区域元素');
    }
    
}, 2000);

// 全局强制刷新收藏功能
window.forceRefreshFavorites = function() {
    console.log('🔄 强制刷新收藏功能...');
    
    if (typeof window.loadFavsFromCloud === 'function') {
        window.loadFavsFromCloud();
    } else {
        console.log('❌ loadFavsFromCloud函数不存在');
    }
    
    if (typeof window.loadFavoriteGroups === 'function') {
        window.loadFavoriteGroups();
    }
    
    // 重新检查模块状态
    if (typeof window.quickModuleCheck === 'function') {
        setTimeout(() => {
            window.quickModuleCheck();
        }, 1000);
    }
};

console.log('💡 可用命令: forceRefreshFavorites() - 强制刷新收藏功能');