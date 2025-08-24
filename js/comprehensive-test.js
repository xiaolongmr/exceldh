/**
 * 综合测试脚本
 * 验证所有修复后的功能
 */

console.log('🧪 综合功能测试脚本已加载');

// 综合测试函数
window.runComprehensiveTest = async function() {
    console.log('🚀 开始综合功能测试...');
    
    const results = {
        searchBox: await testSearchBoxFixed(),
        modules: testModulesLoaded(),
        events: testEventsFixed(),
        functionality: await testFunctionalityFixed()
    };
    
    displayComprehensiveResults(results);
    return results;
};

// 测试搜索框修复
async function testSearchBoxFixed() {
    console.log('🔍 测试搜索框修复...');
    const result = { name: '搜索框修复验证', tests: [] };
    
    const searchInput = document.getElementById('txt');
    if (searchInput) {
        // 检查搜索框是否为空
        const isEmpty = searchInput.value === '';
        result.tests.push({
            name: '搜索框内容清空',
            status: isEmpty ? 'success' : 'error',
            message: isEmpty ? '搜索框已清空' : `搜索框仍有内容: "${searchInput.value}"`
        });
        
        // 检查清除按钮状态
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) {
            const isHidden = clearBtn.style.display === 'none';
            result.tests.push({
                name: '清除按钮隐藏',
                status: isHidden ? 'success' : 'error',
                message: isHidden ? '清除按钮已隐藏' : '清除按钮仍显示'
            });
        }
    }
    
    return result;
}

// 测试模块加载
function testModulesLoaded() {
    console.log('📦 测试模块加载...');
    const result = { name: '模块加载验证', tests: [] };
    
    const modules = [
        { name: 'authManager', check: () => window.authManager },
        { name: 'loadFavsFromCloud', check: () => typeof window.loadFavsFromCloud === 'function' },
        { name: 'renderFavs', check: () => typeof window.renderFavs === 'function' },
        { name: 'showLoginModal', check: () => typeof window.showLoginModal === 'function' },
        { name: 'closeLoginModal', check: () => typeof window.closeLoginModal === 'function' }
    ];
    
    modules.forEach(module => {
        const loaded = module.check();
        result.tests.push({
            name: module.name,
            status: loaded ? 'success' : 'error',
            message: loaded ? `${module.name} 已加载` : `${module.name} 未加载`
        });
    });
    
    return result;
}

// 测试事件绑定修复
function testEventsFixed() {
    console.log('🔗 测试事件绑定修复...');
    const result = { name: '事件绑定验证', tests: [] };
    
    const buttons = [
        { id: 'logout-link', name: '退出登录' },
        { id: 'account-settings-link', name: '账号设置' },
        { id: 'profile-center-link', name: '个人中心' },
        { id: 'system-notice-link', name: '系统通知' }
    ];
    
    buttons.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) {
            const hasEvent = element.dataset.hasListener === 'true';
            result.tests.push({
                name: `${btn.name}事件`,
                status: hasEvent ? 'success' : 'warning',
                message: hasEvent ? `${btn.name}事件已绑定` : `${btn.name}事件未绑定`
            });
        } else {
            result.tests.push({
                name: `${btn.name}按钮`,
                status: 'info',
                message: `${btn.name}按钮不存在（可能未登录）`
            });
        }
    });
    
    return result;
}

// 测试功能修复
async function testFunctionalityFixed() {
    console.log('⚙️ 测试功能修复...');
    const result = { name: '功能验证', tests: [] };
    
    // 测试登录状态
    const token = localStorage.getItem('auth_token');
    const isLoggedIn = !!token;
    result.tests.push({
        name: '登录状态',
        status: 'info',
        message: isLoggedIn ? '用户已登录' : '用户未登录'
    });
    
    // 如果已登录，测试收藏功能
    if (isLoggedIn) {
        // 测试收藏模块显示
        const favBox = document.getElementById('my-fav-box');
        if (favBox) {
            const isVisible = favBox.style.display !== 'none';
            result.tests.push({
                name: '收藏模块显示',
                status: isVisible ? 'success' : 'warning',
                message: isVisible ? '收藏模块已显示' : '收藏模块未显示'
            });
        }
        
        // 测试收藏数据加载
        if (window.loadFavsFromCloud) {
            try {
                await window.loadFavsFromCloud();
                result.tests.push({
                    name: '收藏数据加载',
                    status: 'success',
                    message: '收藏数据加载成功'
                });
            } catch (error) {
                result.tests.push({
                    name: '收藏数据加载',
                    status: 'error',
                    message: `收藏数据加载失败: ${error.message}`
                });
            }
        }
    }
    
    return result;
}

// 显示综合测试结果
function displayComprehensiveResults(results) {
    console.log('📊 显示综合测试结果...');
    
    // 统计总体结果
    let totalTests = 0;
    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    Object.values(results).forEach(category => {
        if (category.tests) {
            category.tests.forEach(test => {
                totalTests++;
                switch(test.status) {
                    case 'success': successCount++; break;
                    case 'error': errorCount++; break;
                    case 'warning': warningCount++; break;
                }
            });
        }
    });
    
    // 创建结果面板
    const existingPanel = document.getElementById('comprehensive-test-results');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'comprehensive-test-results';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        max-height: 80vh;
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 10001;
        font-family: Arial, sans-serif;
        overflow: hidden;
    `;
    
    const successRate = Math.round((successCount / totalTests) * 100);
    const statusColor = successRate >= 80 ? '#28a745' : successRate >= 60 ? '#ffc107' : '#dc3545';
    
    panel.innerHTML = `
        <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); padding: 20px; color: white;">
            <h2 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                🧪 综合测试结果
                <button onclick="this.closest('#comprehensive-test-results').remove()" 
                        style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; padding: 8px 12px; cursor: pointer; font-size: 16px;">×</button>
            </h2>
            <div style="margin-top: 15px; font-size: 18px;">
                成功率: ${successRate}% (${successCount}/${totalTests})
            </div>
            <div style="margin-top: 10px;">
                <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; margin-right: 10px;">✅ ${successCount}</span>
                <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; margin-right: 10px;">⚠️ ${warningCount}</span>
                <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px;">❌ ${errorCount}</span>
            </div>
        </div>
        <div style="max-height: 400px; overflow-y: auto; padding: 20px;">
            ${Object.values(results).map(category => `
                <div style="margin-bottom: 25px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                        ${category.name}
                    </h3>
                    ${category.tests ? category.tests.map(test => `
                        <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; background: ${getTestBgColor(test.status)}; border-left: 4px solid ${getTestColor(test.status)};">
                            <div style="font-weight: bold; color: ${getTestColor(test.status)}; margin-bottom: 4px;">
                                ${getTestIcon(test.status)} ${test.name}
                            </div>
                            <div style="font-size: 14px; color: #666;">
                                ${test.message}
                            </div>
                        </div>
                    `).join('') : '<div style="color: #666;">无测试项</div>'}
                </div>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // 控制台输出摘要
    console.log(`🎉 综合测试完成！成功率: ${successRate}%`);
    console.log(`✅ 成功: ${successCount} 项`);
    console.log(`⚠️ 警告: ${warningCount} 项`);
    console.log(`❌ 错误: ${errorCount} 项`);
}

// 工具函数
function getTestColor(status) {
    switch(status) {
        case 'success': return '#28a745';
        case 'warning': return '#ffc107';
        case 'error': return '#dc3545';
        case 'info': return '#17a2b8';
        default: return '#6c757d';
    }
}

function getTestBgColor(status) {
    switch(status) {
        case 'success': return '#d4edda';
        case 'warning': return '#fff3cd';
        case 'error': return '#f8d7da';
        case 'info': return '#d1ecf1';
        default: return '#f8f9fa';
    }
}

function getTestIcon(status) {
    switch(status) {
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        case 'info': return 'ℹ️';
        default: return '🔍';
    }
}

// 页面加载完成后自动运行测试
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('⏰ 5秒后将自动运行综合测试...');
        setTimeout(runComprehensiveTest, 5000);
    }, 1000);
});

// 快捷命令
console.log('💡 可用命令:');
console.log('- runComprehensiveTest() : 运行综合测试');