# Firebase 清理清单

## 已备份的文件
- [x] js/firebase-auth.js
- [x] css/firebase-auth.css
- [x] js/favorites.js

## 需要手动检查的项目

### 1. HTML文件中的Firebase引用
- [ ] 检查 index.html 中是否还有Firebase CDN引用
- [ ] 确认所有脚本引用已更新为Neon版本

### 2. JavaScript文件中的Firebase导入
- [ ] 搜索项目中所有 `import.*firebase` 的引用
- [ ] 检查是否还有 `getAuth`、`getFirestore` 等Firebase函数调用

### 3. CSS文件中的Firebase相关样式
- [ ] 检查是否有针对Firebase UI的特定样式

### 4. 配置文件
- [ ] 检查是否有Firebase配置文件 (firebase.json, .firebaserc)
- [ ] 验证环境变量中的Firebase配置

### 5. 依赖管理
- [ ] 如果使用package.json，检查Firebase依赖
- [ ] 清理不再需要的Firebase SDK引用

## 安全注意事项
⚠️ 在删除任何文件之前，请确保：
1. 新的Neon系统已经过完整测试
2. 所有用户数据已成功迁移
3. 备份文件已妥善保存
4. 有回滚计划以防出现问题

## 回滚步骤
如果需要回滚到Firebase版本：
1. 停止Neon系统服务
2. 从备份目录恢复Firebase文件
3. 在HTML中恢复Firebase脚本引用
4. 重新启动Firebase服务

## 完成确认
- [ ] 网站在新系统下正常运行
- [ ] 所有用户功能正常
- [ ] 性能和稳定性符合预期
- [ ] 监控系统正常工作
