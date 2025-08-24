/**
 * 主页面功能检测脚本
 * 在主页面加载后运行，检测修复后的功能是否正常
 */

(function() {
    'use strict';
    
    // 等待页面完全加载
    window.addEventListener('load', function() {
        setTimeout(runMainPageTests, 2000); // 等待2秒确保所有模块加载完成
    });
    
    function runMainPageTests() {
        console.log('🔧 开始主页面功能检测...');
        
        const results = {
            searchBox: testSearchBox(),
            authSystem: testAuthSystem(),
            favoritesSystem: testFavoritesSystem(),
            userInterface: testUserInterface(),
            eventBindings: testEventBindings()
        };
        
        // 显示检测结果
        displayTestResults(results);
    }
    
    // 测试搜索框功能
    function testSearchBox() {
        console.log('📝 检测搜索框功能...');
        const result = { name: '搜索框功能', tests: [] };
        
        // 检查搜索框元素
        const searchInput = document.getElementById('txt');
        if (searchInput) {
            result.tests.push({ name: '搜索框元素', status: 'success', message: '搜索框元素存在' });
            
            // 检查搜索框是否为空
            if (searchInput.value === '') {
                result.tests.push({ name: '搜索框内容', status: 'success', message: '搜索框内容为空（正确）' });
            } else {
                result.tests.push({ name: '搜索框内容', status: 'warning', message: `搜索框有内容: "${searchInput.value}"` });
            }
            
            // 检查清除按钮
            const clearBtn = document.getElementById('search-clear');
            if (clearBtn) {
                const isHidden = clearBtn.style.display === 'none';
                result.tests.push({ 
                    name: '清除按钮状态', 
                    status: isHidden ? 'success' : 'warning', 
                    message: isHidden ? '清除按钮已隐藏（正确）' : '清除按钮仍显示' 
                });
            }
        } else {
            result.tests.push({ name: '搜索框元素', status: 'error', message: '搜索框元素不存在' });
        }
        
        return result;
    }
    
    // 测试认证系统
    function testAuthSystem() {
        console.log('📝 检测认证系统...');
        const result = { name: '认证系统', tests: [] };
        
        // 检查认证管理器
        if (window.authManager) {
            result.tests.push({ name: '认证管理器', status: 'success', message: '认证管理器已加载' });
            
            // 检查关键方法
            const methods = ['handleLogin', 'handleLogout', 'showLoginModal', 'closeLoginModal'];
            methods.forEach(method => {
                if (typeof window.authManager[method] === 'function') {
                    result.tests.push({ name: `${method}方法`, status: 'success', message: `${method}方法存在` });
                } else {
                    result.tests.push({ name: `${method}方法`, status: 'error', message: `${method}方法不存在` });
                }
            });
        } else {
            result.tests.push({ name: '认证管理器', status: 'error', message: '认证管理器未加载' });
        }
        
        // 检查登录状态
        const token = localStorage.getItem('auth_token');
        if (token) {
            result.tests.push({ name: '登录状态', status: 'success', message: '用户已登录' });
        } else {
            result.tests.push({ name: '登录状态', status: 'info', message: '用户未登录' });
        }
        
        return result;
    }
    
    // 测试收藏系统
    function testFavoritesSystem() {
        console.log('📝 检测收藏系统...');
        const result = { name: '收藏系统', tests: [] };
        
        // 检查收藏模块
        const favBox = document.getElementById('my-fav-box');
        if (favBox) {
            result.tests.push({ name: '收藏模块元素', status: 'success', message: '收藏模块元素存在' });
            
            const isVisible = favBox.style.display !== 'none';
            result.tests.push({ 
                name: '收藏模块显示', 
                status: isVisible ? 'success' : 'info', 
                message: isVisible ? '收藏模块已显示' : '收藏模块已隐藏（未登录状态正常）' 
            });
            
            // 检查收藏列表
            const favList = document.getElementById('fav-list');
            if (favList) {
                result.tests.push({ name: '收藏列表元素', status: 'success', message: '收藏列表元素存在' });
                
                const favCount = favList.children.length;
                result.tests.push({ name: '收藏数量', status: 'info', message: `收藏总数: ${favCount}` });
            } else {
                result.tests.push({ name: '收藏列表元素', status: 'error', message: '收藏列表元素不存在' });
            }
        } else {
            result.tests.push({ name: '收藏模块元素', status: 'error', message: '收藏模块元素不存在' });
        }
        
        // 检查收藏相关函数
        const favFunctions = ['loadFavsFromCloud', 'renderFavs', 'showLoginModal', 'closeLoginModal'];
        favFunctions.forEach(func => {
            if (typeof window[func] === 'function') {
                result.tests.push({ name: `${func}函数`, status: 'success', message: `${func}函数存在` });
            } else {
                result.tests.push({ name: `${func}函数`, status: 'warning', message: `${func}函数不存在` });
            }
        });
        
        return result;
    }
    
    // 测试用户界面
    function testUserInterface() {
        console.log('📝 检测用户界面...');
        const result = { name: '用户界面', tests: [] };
        
        // 检查登录按钮
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            result.tests.push({ name: '登录按钮', status: 'success', message: '登录按钮存在' });
        } else {
            result.tests.push({ name: '登录按钮', status: 'error', message: '登录按钮不存在' });
        }
        
        // 检查用户头像按钮
        const avatarBtn = document.getElementById('user-avatar-btn');
        if (avatarBtn) {
            result.tests.push({ name: '用户头像按钮', status: 'success', message: '用户头像按钮存在' });
            
            const isVisible = avatarBtn.style.display !== 'none';
            result.tests.push({ 
                name: '头像按钮显示', 
                status: isVisible ? 'success' : 'info', 
                message: isVisible ? '头像按钮已显示' : '头像按钮已隐藏（未登录状态正常）' 
            });
        } else {
            result.tests.push({ name: '用户头像按钮', status: 'error', message: '用户头像按钮不存在' });
        }
        
        // 检查登录弹窗
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            result.tests.push({ name: '登录弹窗', status: 'success', message: '登录弹窗存在' });
        } else {
            result.tests.push({ name: '登录弹窗', status: 'error', message: '登录弹窗不存在' });
        }
        
        return result;
    }
    
    // 测试事件绑定
    function testEventBindings() {
        console.log('📝 检测事件绑定...');
        const result = { name: '事件绑定', tests: [] };
        
        // 检查下拉菜单按钮
        const dropdownButtons = [
            { id: 'logout-link', name: '退出登录' },
            { id: 'account-settings-link', name: '账号设置' },
            { id: 'profile-center-link', name: '个人中心' },
            { id: 'system-notice-link', name: '系统通知' }
        ];
        
        dropdownButtons.forEach(btn => {
            const element = document.getElementById(btn.id);
            if (element) {
                result.tests.push({ name: `${btn.name}按钮`, status: 'success', message: `${btn.name}按钮存在` });
                
                // 检查事件监听器（使用dataset标记）
                const hasListener = element.onclick || element.getAttribute('onclick') || element.dataset.hasListener === 'true';
                if (hasListener) {
                    result.tests.push({ name: `${btn.name}事件`, status: 'success', message: `${btn.name}有点击事件` });
                } else {
                    result.tests.push({ name: `${btn.name}事件`, status: 'warning', message: `${btn.name}可能没有点击事件` });
                }
            } else {
                result.tests.push({ name: `${btn.name}按钮`, status: 'warning', message: `${btn.name}按钮不存在（可能未登录）` });
            }
        });
        
        return result;
    }
    
    // 显示测试结果
    function displayTestResults(results) {
        console.log('📊 显示检测结果...');
        
        // 创建结果面板
        const panel = createResultsPanel();
        
        // 统计结果
        let totalTests = 0;
        let successCount = 0;
        let warningCount = 0;
        let errorCount = 0;
        
        Object.values(results).forEach(category => {
            category.tests.forEach(test => {
                totalTests++;
                switch(test.status) {
                    case 'success': successCount++; break;
                    case 'warning': warningCount++; break;
                    case 'error': errorCount++; break;
                }
            });
        });
        
        // 更新面板内容
        updateResultsPanel(panel, results, { totalTests, successCount, warningCount, errorCount });
        
        // 控制台输出总结
        console.log(`🎉 检测完成！总计 ${totalTests} 项测试`);
        console.log(`✅ 成功: ${successCount} 项`);
        console.log(`⚠️ 警告: ${warningCount} 项`);
        console.log(`❌ 错误: ${errorCount} 项`);
    }
    
    // 创建结果面板
    function createResultsPanel() {
        // 如果已存在面板，先移除
        const existingPanel = document.getElementById('main-page-test-results');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'main-page-test-results';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            overflow: hidden;
        `;
        
        document.body.appendChild(panel);
        return panel;
    }
    
    // 更新结果面板内容
    function updateResultsPanel(panel, results, stats) {
        const html = `
            <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd;">
                <h3 style="margin: 0; color: #333; display: flex; justify-content: space-between; align-items: center;">
                    🔧 功能检测结果
                    <button onclick="this.closest('#main-page-test-results').remove()" 
                            style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">×</button>
                </h3>
                <div style="margin-top: 10px; font-size: 14px;">
                    <span style="color: #28a745;">✅ ${stats.successCount}</span> |
                    <span style="color: #ffc107;">⚠️ ${stats.warningCount}</span> |
                    <span style="color: #dc3545;">❌ ${stats.errorCount}</span>
                </div>
            </div>
            <div style="max-height: 500px; overflow-y: auto; padding: 15px;">
                ${Object.values(results).map(category => `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #495057; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                            ${category.name}
                        </h4>
                        ${category.tests.map(test => `
                            <div style="margin-bottom: 8px; padding: 6px; border-radius: 4px; background: ${getTestBgColor(test.status)};">
                                <div style="font-weight: bold; color: ${getTestColor(test.status)};">
                                    ${getTestIcon(test.status)} ${test.name}
                                </div>
                                <div style="font-size: 12px; color: #666; margin-top: 2px;">
                                    ${test.message}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        panel.innerHTML = html;
    }
    
    // 获取测试状态对应的颜色
    function getTestColor(status) {
        switch(status) {
            case 'success': return '#28a745';
            case 'warning': return '#ffc107';
            case 'error': return '#dc3545';
            case 'info': return '#17a2b8';
            default: return '#6c757d';
        }
    }
    
    // 获取测试状态对应的背景色
    function getTestBgColor(status) {
        switch(status) {
            case 'success': return '#d4edda';
            case 'warning': return '#fff3cd';
            case 'error': return '#f8d7da';
            case 'info': return '#d1ecf1';
            default: return '#f8f9fa';
        }
    }
    
    // 获取测试状态对应的图标
    function getTestIcon(status) {
        switch(status) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '🔍';
        }
    }
    
    // 暴露手动运行测试的函数
    window.runMainPageTests = runMainPageTests;
    
    console.log('🚀 主页面功能检测脚本已加载');
    console.log('💡 可以手动运行: runMainPageTests()');
})();