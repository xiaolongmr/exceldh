# Firebase 到 Neon 数据库迁移指南

这个项目已经从 Firebase 成功迁移到 Neon PostgreSQL 数据库。本文档说明如何部署和使用新的 Neon 认证系统。

## 🚀 已完成的迁移内容

### ✅ 后端 API 系统
- **数据库连接配置** (`api/neon-config.js`)
- **数据库操作工具** (`js/neon-db.js`)
- **用户认证 API** (`api/auth-handler.js`)
- **用户资料管理 API** (`api/profile-handler.js`)
- **收藏功能 API** (`api/favorites-handler.js`)
- **API 路由处理** (`api/api-router.js`)

### ✅ 前端系统
- **Neon 认证系统** (`js/neon-auth.js`) - 替换 `firebase-auth.js`
- **Neon 收藏系统** (`js/neon-favorites.js`) - 替换 `favorites.js`
- **Neon 账号设置** (`js/neon-account-settings.js`) - 替换 `account-settings.js`
- **HTML 更新** - 已更新脚本引用

### ✅ 数据库结构
- **用户表** (`users`) - 替换 Firebase Auth
- **用户资料表** (`user_profiles`) - 替换 Firebase Firestore
- **用户收藏表** (`user_favorites`) - 替换 Firebase Firestore
- **用户会话表** (`user_sessions`) - 新增会话管理

## 🛠️ 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

执行数据库初始化脚本：

```bash
# 在 Neon 数据库中执行 SQL 脚本
# 可以使用 Neon 控制台或 psql 命令行
psql 'postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f api/init-database.sql
```

### 3. 迁移用户数据

执行用户数据迁移脚本：

```bash
npm run migrate
```

这将：
- 生成 `zlnp@qq.com` 账号的密码哈希（密码：`jiushimima1.`）
- 创建用户资料
- 添加示例收藏数据

### 4. 启动服务器

```bash
npm start
# 或开发模式
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## 🔧 配置说明

### 数据库配置

在 `api/neon-config.js` 中配置 Neon 数据库连接：

```javascript
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
```

### 环境变量（可选）

可以通过环境变量配置：

```bash
export NEON_DATABASE_URL="your_neon_database_url"
export JWT_SECRET="your_jwt_secret_key"
export PORT=3000
```

## 📋 API 端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/anonymous` - 匿名登录
- `POST /api/auth/upgrade` - 升级匿名账号
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/user` - 获取用户信息

### 用户资料
- `GET /api/profile` - 获取用户资料
- `PUT /api/profile` - 更新用户资料
- `POST /api/profile/avatar` - 上传头像
- `PUT /api/profile/email` - 更新邮箱
- `PUT /api/profile/password` - 修改密码
- `DELETE /api/profile/delete` - 删除账号
- `GET /api/profile/stats` - 获取用户统计

### 收藏功能
- `GET /api/favorites` - 获取收藏列表
- `POST /api/favorites` - 添加收藏
- `POST /api/favorites/batch` - 批量添加收藏
- `PUT /api/favorites/:id` - 更新收藏
- `DELETE /api/favorites/:id` - 删除收藏
- `PUT /api/favorites/order` - 更新排序
- `GET /api/favorites/check` - 检查是否已收藏
- `GET /api/favorites/categories` - 获取分类列表

## 🔒 安全特性

### JWT 认证
- 使用 JWT 令牌进行用户认证
- 令牌有效期：7天
- 自动令牌验证和刷新

### 密码安全
- 使用 bcrypt 进行密码加密
- 盐轮数：10
- 密码强度要求：至少6位

### 数据验证
- 前端和后端双重验证
- SQL 注入防护
- XSS 攻击防护

## 🎯 功能对比

| 功能 | Firebase | Neon | 状态 |
|------|----------|------|------|
| 用户注册 | ✅ | ✅ | ✅ 完成 |
| 用户登录 | ✅ | ✅ | ✅ 完成 |
| 匿名登录 | ✅ | ✅ | ✅ 完成 |
| 账号升级 | ✅ | ✅ | ✅ 完成 |
| 用户资料 | ✅ | ✅ | ✅ 完成 |
| 头像上传 | ✅ | ✅ | ✅ 完成 |
| 收藏管理 | ✅ | ✅ | ✅ 完成 |
| 拖拽排序 | ✅ | ✅ | ✅ 完成 |
| 批量操作 | ✅ | ✅ | ✅ 完成 |

## 🧪 测试账号

迁移后的测试账号：
- **邮箱**: `zlnp@qq.com`
- **密码**: `jiushimima1.`

## 📝 迁移清单

### ✅ 已完成
- [x] 数据库表结构设计
- [x] 后端API开发
- [x] 前端认证系统重构
- [x] 前端收藏系统重构
- [x] 前端资料管理重构
- [x] HTML模板更新
- [x] 用户数据迁移脚本

### ⏳ 待完成
- [ ] 邮箱验证功能
- [ ] 密码重置功能
- [ ] 数据备份机制
- [ ] 性能优化
- [ ] 错误监控

## 🔄 回滚方案

如需回滚到 Firebase：

1. 恢复 HTML 中的脚本引用：
```html
<script type="module" src="js/firebase-auth.js"></script>
<script type="module" src="js/favorites.js"></script>
<script type="module" src="js/account-settings.js"></script>
```

2. 注释掉 Neon 脚本引用

3. 确保 Firebase 配置正确

## 📞 支持

如遇到问题，请：
1. 检查控制台错误信息
2. 确认数据库连接正常
3. 验证API端点响应
4. 查看服务器日志

## 🎉 总结

Firebase 到 Neon 的迁移已成功完成！新系统提供了：

- ✨ **完整的用户认证系统**
- 🔒 **安全的数据存储**
- 🚀 **高性能的 PostgreSQL 数据库**
- 💾 **灵活的数据模型**
- 🛡️ **增强的安全性**

现在您可以享受更加稳定和可控的数据管理体验！