/**
 * 快速功能测试脚本
 * 可以在浏览器控制台中运行的测试命令
 */

console.log('🔧 快速功能测试脚本已加载');
console.log('使用以下命令进行测试：');
console.log('1. testLogin() - 测试登录功能');
console.log('2. testLogout() - 测试退出登录');
console.log('3. testSearchBox() - 测试搜索框');
console.log('4. testFavorites() - 测试收藏功能');
console.log('5. testAllFeatures() - 测试所有功能');

// 测试登录功能
window.testLogin = async function() {
    console.log('🔐 开始测试登录功能...');
    
    try {
        // 检查登录按钮
        const loginBtn = document.getElementById('top-login-btn');
        if (loginBtn) {
            console.log('✅ 登录按钮存在');
            
            // 模拟点击登录按钮
            loginBtn.click();
            console.log('✅ 登录按钮点击成功');
            
            // 检查登录弹窗是否显示
            setTimeout(() => {
                const modal = document.getElementById('login-modal');
                if (modal && modal.style.display === 'flex') {
                    console.log('✅ 登录弹窗正确显示');
                } else {
                    console.log('❌ 登录弹窗未显示');
                }
            }, 500);
        } else {
            console.log('❌ 登录按钮不存在');
        }
        
        // 测试API登录
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'zlnp@qq.com',
                password: 'jiushimima1.'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ API登录成功');
            console.log('用户信息:', result.user);
            
            // 保存令牌
            localStorage.setItem('auth_token', result.token);
            console.log('✅ 令牌已保存');
            
            // 触发认证状态变化
            window.location.reload();
        } else {
            console.log('❌ API登录失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 登录测试失败:', error);
    }
};

// 测试退出登录
window.testLogout = function() {
    console.log('🚪 开始测试退出登录功能...');
    
    if (window.authManager && typeof window.authManager.handleLogout === 'function') {
        window.authManager.handleLogout();
        console.log('✅ 退出登录功能调用成功');
    } else {
        console.log('❌ 认证管理器或退出登录方法不存在');
    }
    
    // 检查令牌是否被清除
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.log('✅ 令牌已清除');
    } else {
        console.log('⚠️ 令牌仍然存在');
    }
};

// 测试搜索框
window.testSearchBox = function() {
    console.log('🔍 开始测试搜索框功能...');
    
    const searchInput = document.getElementById('txt');
    if (searchInput) {
        console.log('✅ 搜索框元素存在');
        
        // 检查搜索框内容
        const currentValue = searchInput.value;
        console.log(`当前搜索框内容: "${currentValue}"`);
        
        if (currentValue === '') {
            console.log('✅ 搜索框为空（正确）');
        } else {
            console.log('⚠️ 搜索框有内容，尝试清空...');
            searchInput.value = '';
            console.log('✅ 搜索框已清空');
        }
        
        // 测试搜索功能
        searchInput.value = '测试搜索';
        searchInput.dispatchEvent(new Event('keyup'));
        console.log('✅ 搜索功能测试完成');
        
        // 检查清除按钮
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) {
            if (clearBtn.style.display !== 'none') {
                console.log('✅ 清除按钮正确显示');
            } else {
                console.log('⚠️ 清除按钮未显示');
            }
        } else {
            console.log('❌ 清除按钮不存在');
        }
    } else {
        console.log('❌ 搜索框元素不存在');
    }
};

// 测试收藏功能
window.testFavorites = async function() {
    console.log('🌟 开始测试收藏功能...');
    
    // 检查收藏模块
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        console.log('✅ 收藏模块存在');
        
        const isVisible = favBox.style.display !== 'none';
        console.log(`收藏模块显示状态: ${isVisible ? '显示' : '隐藏'}`);
        
        // 检查收藏列表
        const favList = document.getElementById('fav-list');
        if (favList) {
            console.log('✅ 收藏列表存在');
            console.log(`收藏数量: ${favList.children.length}`);
        } else {
            console.log('❌ 收藏列表不存在');
        }
    } else {
        console.log('❌ 收藏模块不存在');
    }
    
    // 测试收藏加载功能
    if (window.loadFavsFromCloud) {
        try {
            await window.loadFavsFromCloud();
            console.log('✅ 收藏加载功能正常');
        } catch (error) {
            console.log('❌ 收藏加载失败:', error);
        }
    } else {
        console.log('❌ 收藏加载函数不存在');
    }
    
    // 测试添加收藏（需要登录）
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: '测试网站',
                    url: 'https://test.example.com',
                    icon: 'https://test.example.com/favicon.ico',
                    description: '这是一个测试收藏'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ 添加收藏成功');
            } else {
                console.log('❌ 添加收藏失败:', result.error);
            }
        } catch (error) {
            console.log('❌ 添加收藏API调用失败:', error);
        }
    } else {
        console.log('⚠️ 未登录，跳过添加收藏测试');
    }
};

// 测试所有功能
window.testAllFeatures = async function() {
    console.log('🧪 开始全功能测试...');
    
    console.log('\n=== 1. 搜索框测试 ===');
    window.testSearchBox();
    
    console.log('\n=== 2. 登录功能测试 ===');
    await window.testLogin();
    
    // 等待2秒让登录完成
    setTimeout(async () => {
        console.log('\n=== 3. 收藏功能测试 ===');
        await window.testFavorites();
        
        console.log('\n=== 4. 退出登录测试 ===');
        // window.testLogout(); // 可选择是否测试退出
        
        console.log('\n🎉 全功能测试完成！');
    }, 2000);
};

// 检查当前状态
window.checkCurrentStatus = function() {
    console.log('📊 当前系统状态：');
    
    const token = localStorage.getItem('auth_token');
    console.log(`登录状态: ${token ? '已登录' : '未登录'}`);
    
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        console.log(`收藏模块: ${favBox.style.display !== 'none' ? '显示' : '隐藏'}`);
    }
    
    const searchInput = document.getElementById('txt');
    if (searchInput) {
        console.log(`搜索框内容: "${searchInput.value}"`);
    }
    
    const avatarBtn = document.getElementById('user-avatar-btn');
    if (avatarBtn) {
        console.log(`用户头像: ${avatarBtn.style.display !== 'none' ? '显示' : '隐藏'}`);
    }
};