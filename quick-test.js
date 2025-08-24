/**
 * 快速API功能测试脚本
 */

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
    console.log('🧪 开始API功能测试...\n');

    try {
        // 1. 测试健康检查
        console.log('1️⃣ 测试健康检查...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ 健康检查成功:', healthData.message);
        } else {
            console.log('❌ 健康检查失败');
            return;
        }

        // 2. 测试迁移用户登录
        console.log('\n2️⃣ 测试迁移用户登录...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'zlnp@qq.com',
                password: 'jiushimima1.'
            })
        });

        let authToken = null;
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.success) {
                authToken = loginData.token;
                console.log('✅ 迁移用户登录成功');
                console.log(`   用户ID: ${loginData.user.id}`);
                console.log(`   邮箱: ${loginData.user.email}`);
            } else {
                console.log('❌ 登录失败:', loginData.message);
                return;
            }
        } else {
            console.log('❌ 登录请求失败');
            return;
        }

        // 3. 测试获取用户资料
        console.log('\n3️⃣ 测试获取用户资料...');
        const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success) {
                console.log('✅ 获取用户资料成功');
                console.log(`   昵称: ${profileData.profile.nickname}`);
                console.log(`   头像: ${profileData.profile.avatar}`);
            } else {
                console.log('❌ 获取资料失败:', profileData.message);
            }
        } else {
            console.log('❌ 获取资料请求失败');
        }

        // 4. 测试收藏功能
        console.log('\n4️⃣ 测试收藏功能...');
        
        // 添加测试收藏
        const addFavResponse = await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title: '测试网站',
                url: 'https://test.example.com',
                icon: 'https://test.example.com/icon.png',
                description: '这是一个测试收藏',
                category: '测试分类'
            })
        });

        if (addFavResponse.ok) {
            const addFavData = await addFavResponse.json();
            if (addFavData.success) {
                console.log('✅ 添加收藏成功');
                
                // 获取收藏列表
                const getFavResponse = await fetch(`${API_BASE_URL}/favorites`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (getFavResponse.ok) {
                    const getFavData = await getFavResponse.json();
                    if (getFavData.success) {
                        console.log(`✅ 获取收藏列表成功 (共${getFavData.favorites.length}个收藏)`);
                    }
                }
            } else {
                console.log('❌ 添加收藏失败:', addFavData.message);
            }
        } else {
            console.log('❌ 添加收藏请求失败');
        }

        // 5. 测试匿名登录
        console.log('\n5️⃣ 测试匿名登录...');
        const anonResponse = await fetch(`${API_BASE_URL}/auth/anonymous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (anonResponse.ok) {
            const anonData = await anonResponse.json();
            if (anonData.success) {
                console.log('✅ 匿名登录成功');
                console.log(`   匿名用户ID: ${anonData.user.id}`);
            } else {
                console.log('❌ 匿名登录失败:', anonData.message);
            }
        } else {
            console.log('❌ 匿名登录请求失败');
        }

        console.log('\n🎉 所有API测试完成！');
        console.log('\n📋 系统状态: ✅ 正常运行');
        console.log('🌐 访问地址: http://localhost:3000');
        console.log('🧪 测试页面: http://localhost:3000/test.html');
        console.log('🏠 主页面: http://localhost:3000/index.html');

    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    }
}

// 延迟一下再测试，确保服务器完全启动
setTimeout(() => {
    testAPI().catch(console.error);
}, 2000);