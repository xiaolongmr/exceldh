/**
 * 模块加载状态监控器
 * 监控关键模块的加载状态
 */

console.log('🔍 模块监控器已加载');

// 配置参数
const CONFIG = {
    CHECK_INTERVAL: 2000, // 检查间隔（毫秒）
    MAX_CHECKS: 10,       // 最大检查次数
    REQUIRED_MODULES: [
        { name: 'loadFavsFromCloud', type: 'function', description: '收藏加载函数' },
        { name: 'renderFavs', type: 'function', description: '收藏渲染函数' },
        { name: 'authManager', type: 'object', description: '认证管理器' },
        { name: 'showLoginModal', type: 'function', description: '登录弹窗函数' }
    ]
};

// 状态变量
let monitorCheckCount = 0;
let monitorTimer = null;
let isMonitoring = false;

// 模块监控器对象
const ModuleMonitor = {
    
    // 检查单个模块
    checkModule(module) {
        const value = window[module.name];
        const actualType = typeof value;
        const isLoaded = module.type === 'function' ? 
            actualType === 'function' : 
            actualType === module.type && value !== null && value !== undefined;
            
        return {
            name: module.name,
            description: module.description,
            expected: module.type,
            actual: actualType,
            value: value,
            loaded: isLoaded
        };
    },
    
    // 检查所有模块
    checkModules() {
        const results = CONFIG.REQUIRED_MODULES.map(module => this.checkModule(module));
        const loadedCount = results.filter(r => r.loaded).length;
        const totalCount = results.length;
        
        console.log(`🔍 模块检查结果 (${loadedCount}/${totalCount}):`);
        
        results.forEach(result => {
            const icon = result.loaded ? '✅' : '❌';
            const status = result.loaded ? '已加载' : '未加载';
            console.log(`   ${icon} ${result.name} (${result.description}): ${status} (${result.actual})`);
            
            if (!result.loaded && result.actual !== 'undefined') {
                console.log(`      ℹ️ 实际值:`, result.value);
            }
        });
        
        return {
            results,
            loadedCount,
            totalCount,
            allLoaded: loadedCount === totalCount
        };
    },
    
    // 开始监控
    startMonitoring() {
        if (isMonitoring) {
            console.log('⚠️ 模块监控器已在运行中');
            return;
        }
        
        console.log('🚀 开始模块加载监控...');
        isMonitoring = true;
        monitorCheckCount = 0;
        
        const monitor = () => {
            monitorCheckCount++;
            const timestamp = new Date().toLocaleTimeString();
            
            console.log(`📅 第${monitorCheckCount}次模块检查 [${timestamp}]:`);
            
            const status = this.checkModules();
            
            if (status.allLoaded) {
                console.log('🎉 所有模块已加载完成！');
                this.stopMonitoring();
                return;
            }
            
            if (monitorCheckCount >= CONFIG.MAX_CHECKS) {
                console.log('⚠️ 达到最大检查次数，停止监控');
                this.stopMonitoring();
                return;
            }
            
            console.log(`⏳ ${CONFIG.CHECK_INTERVAL/1000}秒后进行下一次检查...`);
            monitorTimer = setTimeout(monitor, CONFIG.CHECK_INTERVAL);
        };
        
        // 立即执行第一次检查
        monitor();
    },
    
    // 停止监控
    stopMonitoring() {
        if (monitorTimer) {
            clearTimeout(monitorTimer);
            monitorTimer = null;
        }
        isMonitoring = false;
        console.log('🛑 模块监控器已停止');
    },
    
    // 重新开始监控
    restart() {
        this.stopMonitoring();
        setTimeout(() => this.startMonitoring(), 500);
    },
    
    // 手动检查
    manualCheck() {
        console.log('🔄 手动触发模块检查...');
        return this.checkModules();
    }
};

// 暴露到全局作用域
window.ModuleMonitor = ModuleMonitor;

// 监听自定义事件
window.addEventListener('neonFavoritesLoaded', function(event) {
    console.log('📡 接收到neonFavoritesLoaded事件:', event.detail);
    ModuleMonitor.manualCheck();
});

// 页面加载完成后自动开始监控
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🔥 DOMContentLoaded - 开始模块监控');
            ModuleMonitor.startMonitoring();
        }, 1500);
    });
} else {
    // 页面已加载完成
    setTimeout(() => {
        console.log('🔥 页面已加载 - 开始模块监控');
        ModuleMonitor.startMonitoring();
    }, 1500);
}

console.log('📚 模块监控器初始化完成');
console.log('💪 可用命令:');
console.log('  - ModuleMonitor.checkModules() : 检查模块状态');
console.log('  - ModuleMonitor.startMonitoring() : 开始监控');
console.log('  - ModuleMonitor.stopMonitoring() : 停止监控');
console.log('  - ModuleMonitor.restart() : 重启监控');
