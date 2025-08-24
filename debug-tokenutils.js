/**
 * TokenUtils 调试脚本
 * 测试模块导入和方法定义
 */

import { TokenUtils } from './js/neon-frontend-config.js';

console.log('🔧 开始TokenUtils调试...');

// 测试TokenUtils类是否正确导入
console.log('1. TokenUtils类:', TokenUtils);
console.log('2. TokenUtils类型:', typeof TokenUtils);

// 测试所有方法是否存在
const methods = ['setStoredToken', 'getStoredToken', 'removeStoredToken', 'hasToken', 'parseTokenPayload', 'isTokenExpired'];

console.log('\n3. 检查TokenUtils方法:');
methods.forEach(method => {
    if (typeof TokenUtils[method] === 'function') {
        console.log(`✅ TokenUtils.${method} - 存在`);
    } else {
        console.log(`❌ TokenUtils.${method} - 不存在 (类型: ${typeof TokenUtils[method]})`);
    }
});

// 测试setStoredToken方法
console.log('\n4. 测试setStoredToken方法:');
try {
    TokenUtils.setStoredToken('test-token-123');
    console.log('✅ setStoredToken调用成功');
    
    const stored = TokenUtils.getStoredToken();
    console.log('✅ getStoredToken调用成功，返回:', stored);
    
    TokenUtils.removeStoredToken();
    console.log('✅ removeStoredToken调用成功');
} catch (error) {
    console.error('❌ TokenUtils方法调用失败:', error);
}

console.log('\n🎉 TokenUtils调试完成！');