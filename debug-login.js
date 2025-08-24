/**
 * 登录功能调试和修复脚本
 * 检查登录系统的各个组件是否正常工作
 */

console.log('🔧 开始登录功能诊断...');

// 检查函数定义
function checkFunctionDefinitions() {
    console.log('\n📋 检查全局函数定义:');
    
    const functions = ['showLoginModal', 'closeLoginModal', 'switchAuthMode', 'logout'];
    functions.forEach(func => {
        if (typeof window[func] === 'function') {
            console.log(`✅ ${func} - 已定义`);
        } else {
            console.log(`❌ ${func} - 未定义`);
        }
    });
}

// 检查认证管理器
function checkAuthManager() {
    console.log('\n🔐 检查认证管理器:');
    
    if (window.authManager) {
        console.log('✅ window.authManager - 已初始化');
        console.log(`   类型: ${window.authManager.constructor.name}`);
        
        // 检查认证管理器的方法
        const methods = ['showLoginModal', 'closeLoginModal', 'handleLogin', 'handleLogout'];
        methods.forEach(method => {
            if (typeof window.authManager[method] === 'function') {
                console.log(`✅ authManager.${method} - 已定义`);
            } else {
                console.log(`❌ authManager.${method} - 未定义`);
            }
        });
    } else {
        console.log('❌ window.authManager - 未初始化');
    }
}

// 检查DOM元素
function checkDOMElements() {
    console.log('\n🎯 检查DOM元素:');
    
    const elements = [
        'top-login-btn',
        'login-modal',
        'login-form',
        'login-email',
        'login-password',
        'login-btn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ #${id} - 存在`);
        } else {
            console.log(`❌ #${id} - 不存在`);
        }
    });
}

// 检查事件监听器
function checkEventListeners() {
    console.log('\n🎬 检查事件监听器:');
    
    const loginBtn = document.getElementById('top-login-btn');
    if (loginBtn) {
        // 检查onclick属性
        if (loginBtn.getAttribute('onclick')) {
            console.log('✅ 登录按钮有onclick属性:', loginBtn.getAttribute('onclick'));
        } else {
            console.log('⚠️ 登录按钮没有onclick属性');
        }
        
        // 检查事件监听器（简化检查）
        const hasListeners = loginBtn.onclick || loginBtn.addEventListener;
        console.log(`${hasListeners ? '✅' : '❌'} 登录按钮事件监听器状态`);
    }
}

// 检查API连接
async function checkAPIConnection() {
    console.log('\n🌐 检查API连接:');
    
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API连接正常:', data.message);
        } else {
            console.log('❌ API连接失败，状态码:', response.status);
        }
    } catch (error) {
        console.log('❌ API连接错误:', error.message);
    }
}

// 测试登录弹窗
function testLoginModal() {
    console.log('\n🧪 测试登录弹窗:');
    
    try {
        if (typeof window.showLoginModal === 'function') {
            console.log('📱 尝试打开登录弹窗...');
            window.showLoginModal();
            
            // 检查弹窗是否显示
            setTimeout(() => {
                const modal = document.getElementById('login-modal');
                if (modal && modal.style.display === 'flex') {
                    console.log('✅ 登录弹窗已打开');
                    // 自动关闭弹窗
                    setTimeout(() => {
                        window.closeLoginModal();
                        console.log('🔄 已自动关闭弹窗');
                    }, 2000);
                } else {
                    console.log('❌ 登录弹窗未正确显示');
                }
            }, 500);
        } else {
            console.log('❌ showLoginModal函数不可用');
        }
    } catch (error) {
        console.log('❌ 测试登录弹窗失败:', error.message);
    }
}

// 修复登录功能
function fixLoginFunction() {
    console.log('\n🔧 尝试修复登录功能...');
    
    // 确保全局函数存在
    if (!window.showLoginModal) {
        console.log('⚡ 创建备用showLoginModal函数');
        window.showLoginModal = function() {
            const modal = document.getElementById('login-modal');
            if (modal) {
                modal.style.display = 'flex';
                console.log('✅ 使用备用函数打开登录弹窗');
            } else {
                console.error('❌ 登录弹窗元素不存在');
            }
        };
    }
    
    if (!window.closeLoginModal) {
        console.log('⚡ 创建备用closeLoginModal函数');
        window.closeLoginModal = function() {
            const modal = document.getElementById('login-modal');
            if (modal) {
                modal.style.display = 'none';
                console.log('✅ 使用备用函数关闭登录弹窗');
            }
        };
    }
    
    // 重新绑定登录按钮事件
    const loginBtn = document.getElementById('top-login-btn');
    if (loginBtn && !loginBtn.onclick) {
        console.log('⚡ 重新绑定登录按钮点击事件');
        loginBtn.onclick = function() {
            window.showLoginModal();
        };
    }
}

// 生成诊断报告
function generateReport() {
    console.log('\n📊 生成诊断报告...');
    
    const issues = [];
    const fixes = [];
    
    // 检查各项功能
    if (!window.authManager) {
        issues.push('认证管理器未初始化');
        fixes.push('检查neon-auth.js文件是否正确加载');
    }
    
    if (!document.getElementById('login-modal')) {
        issues.push('登录弹窗DOM元素缺失');
        fixes.push('检查HTML文件中的登录弹窗结构');
    }
    
    if (typeof window.showLoginModal !== 'function') {
        issues.push('showLoginModal函数未定义');
        fixes.push('确保neon-auth.js正确导出全局函数');
    }
    
    console.log('\n🔍 发现的问题:');
    if (issues.length === 0) {
        console.log('✅ 未发现明显问题');
    } else {
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }
    
    console.log('\n💡 建议的修复方案:');
    if (fixes.length === 0) {
        console.log('✅ 无需修复');
    } else {
        fixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix}`);
        });
    }
}

// 执行诊断流程
async function runDiagnostics() {
    checkFunctionDefinitions();
    checkAuthManager();
    checkDOMElements();
    checkEventListeners();
    await checkAPIConnection();
    testLoginModal();
    fixLoginFunction();
    generateReport();
    
    console.log('\n🎉 诊断完成！');
    console.log('\n📝 使用说明:');
    console.log('1. 打开浏览器控制台查看详细日志');
    console.log('2. 点击右上角登录按钮测试功能');
    console.log('3. 如果问题仍然存在，请刷新页面');
}

// 页面加载完成后运行诊断
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDiagnostics);
} else {
    runDiagnostics();
}

// 导出诊断函数供手动调用
window.runLoginDiagnostics = runDiagnostics;
window.fixLoginFunction = fixLoginFunction;