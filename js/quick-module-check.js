/**
 * 快速模块验证脚本
 * 立即检查模块加载状态
 */

console.log('🔍 快速模块验证脚本已加载');

// 立即验证模块状态
window.quickModuleCheck = function() {
    console.log('\n🚀 开始快速模块验证...');
    
    const modules = [
        { name: 'authManager', check: () => window.authManager, type: 'object' },
        { name: 'loadFavsFromCloud', check: () => window.loadFavsFromCloud, type: 'function' },
        { name: 'renderFavs', check: () => window.renderFavs, type: 'function' },
        { name: 'showLoginModal', check: () => window.showLoginModal, type: 'function' },
        { name: 'closeLoginModal', check: () => window.closeLoginModal, type: 'function' }
    ];
    
    let loadedCount = 0;
    let totalCount = modules.length;
    
    console.log('📋 模块检查结果:');
    modules.forEach(module => {
        const exists = module.check();
        const typeMatch = module.type === 'function' ? typeof exists === 'function' : !!exists;
        
        if (typeMatch) {
            console.log(`✅ ${module.name} - 已加载 (${typeof exists})`);
            loadedCount++;
        } else {
            console.log(`❌ ${module.name} - 未加载 (${typeof exists})`);
        }
    });
    
    const loadRate = Math.round((loadedCount / totalCount) * 100);
    console.log(`\n📊 模块加载状态: ${loadedCount}/${totalCount} (${loadRate}%)`);
    
    if (loadedCount === totalCount) {
        console.log('🎉 所有模块已正确加载！');
    } else {
        console.log('⚠️ 部分模块未加载，可能需要等待或刷新页面');
    }
    
    return { loadedCount, totalCount, loadRate };
};

// 延迟检查函数
window.delayedModuleCheck = function(delay = 2000) {
    console.log(`⏰ 将在 ${delay}ms 后进行模块检查...`);
    setTimeout(() => {
        window.quickModuleCheck();
    }, delay);
};

// 手动触发模块监控器检查
window.triggerModuleMonitor = function() {
    if (window.ModuleMonitor && window.ModuleMonitor.manualCheck) {
        console.log('🔄 手动触发模块监控器检查...');
        window.ModuleMonitor.manualCheck();
    } else {
        console.log('❌ 模块监控器不可用');
    }
};

// 重启模块监控器
window.restartModuleMonitor = function() {
    if (window.ModuleMonitor && window.ModuleMonitor.restart) {
        console.log('🔄 重启模块监控器...');
        window.ModuleMonitor.restart();
    } else {
        console.log('❌ 模块监控器不可用');
    }
};

// 页面加载完成后定期检查
let periodicCheckCount = 0;
const maxChecks = 5;

function periodicCheck() {
    periodicCheckCount++;
    console.log(`\n📅 第 ${periodicCheckCount} 次定期检查:`);
    
    const result = window.quickModuleCheck();
    
    if (result.loadedCount === result.totalCount || periodicCheckCount >= maxChecks) {
        if (result.loadedCount === result.totalCount) {
            console.log('✅ 定期检查完成 - 所有模块已加载');
        } else {
            console.log('❌ 定期检查结束 - 部分模块仍未加载');
        }
        return;
    }
    
    // 继续检查
    setTimeout(periodicCheck, 2000);
}

// 页面加载后开始定期检查
window.addEventListener('load', () => {
    console.log('📱 页面已加载，开始定期模块检查...');
    setTimeout(periodicCheck, 1000);
});

// 立即进行一次检查
setTimeout(() => {
    console.log('⚡ 立即进行初始模块检查:');
    window.quickModuleCheck();
}, 500);

console.log('\n💡 可用命令:');
console.log('- quickModuleCheck() : 立即检查模块状态');
console.log('- delayedModuleCheck(2000) : 延迟检查');
console.log('- triggerModuleMonitor() : 手动触发监控器');
console.log('- restartModuleMonitor() : 重启监控器');