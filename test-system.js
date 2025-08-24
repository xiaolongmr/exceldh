/**
 * Neon系统功能测试脚本
 * 验证Firebase到Neon迁移后的系统完整性
 */

import { API_BASE_URL } from './api/neon-config.js';

class SystemTester {
    constructor() {
        this.results = [];
        this.testElement = null;
        this.createTestUI();
    }

    /**
     * 创建测试界面
     */
    createTestUI() {
        // 创建测试界面容器
        const testContainer = document.createElement('div');
        testContainer.id = 'system-test-container';
        testContainer.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                padding: 20px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 12px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #333;">🧪 系统测试</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: #ff4757; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">
                        关闭
                    </button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="run-all-tests" style="
                        background: #3385ff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">运行所有测试</button>
                    <button id="clear-results" style="
                        background: #666;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                    ">清除结果</button>
                </div>
                <div id="test-results" style="
                    border: 1px solid #eee;
                    border-radius: 4px;
                    padding: 10px;
                    background: #f9f9f9;
                    min-height: 200px;
                    max-height: 400px;
                    overflow-y: auto;
                "></div>
            </div>
        `;

        document.body.appendChild(testContainer);

        // 绑定事件
        document.getElementById('run-all-tests').addEventListener('click', () => this.runAllTests());
        document.getElementById('clear-results').addEventListener('click', () => this.clearResults());
        
        this.testElement = document.getElementById('test-results');
    }

    /**
     * 记录测试结果
     */
    log(message, type = 'info') {
        const colors = {
            info: '#333',
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107'
        };

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        const logElement = document.createElement('div');
        logElement.style.color = colors[type];
        logElement.style.marginBottom = '4px';
        logElement.textContent = logEntry;
        
        this.testElement.appendChild(logElement);
        this.testElement.scrollTop = this.testElement.scrollHeight;
        
        console.log(logEntry);
    }

    /**
     * 清除测试结果
     */
    clearResults() {
        this.testElement.innerHTML = '';
        this.results = [];
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        this.clearResults();
        this.log('🚀 开始系统测试...', 'info');

        const tests = [
            () => this.testDatabaseConnection(),
            () => this.testUserRegistration(),
            () => this.testUserLogin(),
            () => this.testAnonymousLogin(),
            () => this.testUserProfile(),
            () => this.testFavoritesOperations(),
            () => this.testMigratedUserData()
        ];

        for (const test of tests) {
            try {
                await test();
                await this.delay(500); // 测试间隔
            } catch (error) {
                this.log(`❌ 测试执行失败: ${error.message}`, 'error');
            }
        }

        this.generateReport();
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 测试数据库连接
     */
    async testDatabaseConnection() {
        this.log('🔗 测试数据库连接...', 'info');
        
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                this.log('✅ 数据库连接成功', 'success');
                return true;
            } else {
                this.log('❌ 数据库连接失败', 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 数据库连接错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 测试用户注册
     */
    async testUserRegistration() {
        this.log('👤 测试用户注册...', 'info');
        
        const testUser = {
            email: `test_${Date.now()}@test.com`,
            password: 'test123456',
            nickname: 'TestUser'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.log('✅ 用户注册成功', 'success');
                // 保存测试用户信息供后续测试使用
                this.testUser = testUser;
                this.testToken = result.token;
                return true;
            } else {
                this.log(`❌ 用户注册失败: ${result.message}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 用户注册错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 测试用户登录
     */
    async testUserLogin() {
        this.log('🔐 测试用户登录...', 'info');
        
        if (!this.testUser) {
            this.log('⚠️ 跳过登录测试（注册失败）', 'warning');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.testUser.email,
                    password: this.testUser.password
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.log('✅ 用户登录成功', 'success');
                this.testToken = result.token;
                return true;
            } else {
                this.log(`❌ 用户登录失败: ${result.message}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 用户登录错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 测试匿名登录
     */
    async testAnonymousLogin() {
        this.log('👻 测试匿名登录...', 'info');
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/anonymous`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.log('✅ 匿名登录成功', 'success');
                return true;
            } else {
                this.log(`❌ 匿名登录失败: ${result.message}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 匿名登录错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 测试用户资料
     */
    async testUserProfile() {
        this.log('📝 测试用户资料...', 'info');
        
        if (!this.testToken) {
            this.log('⚠️ 跳过用户资料测试（无token）', 'warning');
            return false;
        }

        try {
            // 测试获取用户资料
            const getResponse = await fetch(`${API_BASE_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${this.testToken}` }
            });

            if (getResponse.ok) {
                this.log('✅ 获取用户资料成功', 'success');
                
                // 测试更新用户资料
                const updateResponse = await fetch(`${API_BASE_URL}/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.testToken}`
                    },
                    body: JSON.stringify({
                        nickname: 'UpdatedTestUser',
                        bio: '这是测试用户'
                    })
                });

                if (updateResponse.ok) {
                    this.log('✅ 更新用户资料成功', 'success');
                    return true;
                } else {
                    this.log('❌ 更新用户资料失败', 'error');
                    return false;
                }
            } else {
                this.log('❌ 获取用户资料失败', 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 用户资料测试错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 测试收藏功能
     */
    async testFavoritesOperations() {
        this.log('⭐ 测试收藏功能...', 'info');
        
        if (!this.testToken) {
            this.log('⚠️ 跳过收藏功能测试（无token）', 'warning');
            return false;
        }

        try {
            // 测试添加收藏
            const addResponse = await fetch(`${API_BASE_URL}/favorites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.testToken}`
                },
                body: JSON.stringify({
                    title: '测试网站',
                    url: 'https://test.com',
                    icon: 'https://test.com/icon.ico',
                    description: '这是一个测试网站',
                    category: '测试分类'
                })
            });

            if (addResponse.ok) {
                this.log('✅ 添加收藏成功', 'success');
                
                const addResult = await addResponse.json();
                const favoriteId = addResult.favorite.id;

                // 测试获取收藏列表
                const listResponse = await fetch(`${API_BASE_URL}/favorites`, {
                    headers: { 'Authorization': `Bearer ${this.testToken}` }
                });

                if (listResponse.ok) {
                    this.log('✅ 获取收藏列表成功', 'success');
                    
                    // 测试更新收藏
                    const updateResponse = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.testToken}`
                        },
                        body: JSON.stringify({
                            title: '更新的测试网站',
                            description: '这是更新后的描述'
                        })
                    });

                    if (updateResponse.ok) {
                        this.log('✅ 更新收藏成功', 'success');
                        
                        // 测试删除收藏
                        const deleteResponse = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${this.testToken}` }
                        });

                        if (deleteResponse.ok) {
                            this.log('✅ 删除收藏成功', 'success');
                            return true;
                        } else {
                            this.log('❌ 删除收藏失败', 'error');
                            return false;
                        }
                    } else {
                        this.log('❌ 更新收藏失败', 'error');
                        return false;
                    }
                } else {
                    this.log('❌ 获取收藏列表失败', 'error');
                    return false;
                }
            } else {
                this.log('❌ 添加收藏失败', 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 收藏功能测试错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 测试迁移的用户数据
     */
    async testMigratedUserData() {
        this.log('🔄 测试迁移用户数据...', 'info');
        
        try {
            // 测试迁移的用户登录
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'zlnp@qq.com',
                    password: 'jiushimima1.'
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.log('✅ 迁移用户登录成功', 'success');
                
                // 验证用户资料
                const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
                    headers: { 'Authorization': `Bearer ${result.token}` }
                });

                if (profileResponse.ok) {
                    const profileResult = await profileResponse.json();
                    this.log(`✅ 迁移用户资料验证成功: ${profileResult.profile.nickname}`, 'success');
                    return true;
                } else {
                    this.log('❌ 迁移用户资料验证失败', 'error');
                    return false;
                }
            } else {
                this.log(`❌ 迁移用户登录失败: ${result.message}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ 迁移用户数据测试错误: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 生成测试报告
     */
    generateReport() {
        this.log('', 'info');
        this.log('📊 测试报告生成完成', 'info');
        this.log('系统迁移验证已完成，请查看上述测试结果', 'info');
        
        // 检查是否所有关键测试都通过
        const logElements = this.testElement.querySelectorAll('div');
        const successCount = Array.from(logElements).filter(el => 
            el.textContent.includes('✅')
        ).length;
        const errorCount = Array.from(logElements).filter(el => 
            el.textContent.includes('❌')
        ).length;
        
        this.log(`总计: ${successCount} 成功, ${errorCount} 失败`, 
            errorCount === 0 ? 'success' : 'warning');
    }
}

// 页面加载完成后初始化测试器
document.addEventListener('DOMContentLoaded', function() {
    // 添加测试按钮到页面
    const testBtn = document.createElement('button');
    testBtn.innerHTML = '🧪 系统测试';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3385ff;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    testBtn.onclick = function() {
        if (!document.getElementById('system-test-container')) {
            new SystemTester();
        }
    };
    
    document.body.appendChild(testBtn);
});

// 导出测试器类
window.SystemTester = SystemTester;