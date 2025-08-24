# 🚀 坚果云相册 - Vercel 一键部署指南

## 📋 项目概述

这是一个基于 **Neon PostgreSQL** 的现代化收藏管理系统，从 Firebase 完全迁移而来，支持用户认证、收藏管理、分类标签等完整功能。

## 🔗 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME&env=NEON_DATABASE_URL,JWT_SECRET,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS&envDescription=Required%20environment%20variables%20for%20the%20application&envLink=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME#environment-variables)

> 🔥 **点击上方按钮即可一键部署到 Vercel**

## 📝 部署前准备

### 1. 创建 Neon 数据库
1. 访问 [Neon Console](https://console.neon.tech/)
2. 创建新项目或使用现有项目
3. 获取数据库连接字符串（格式：`postgresql://username:password@host/database?sslmode=require`）

### 2. 准备邮件服务（可选）
- **QQ邮箱**：需要开启SMTP服务并获取授权码
- **Gmail**：需要生成应用专用密码
- **其他邮箱**：获取相应的SMTP配置

## ⚙️ 环境变量配置

在 Vercel 部署过程中，需要配置以下环境变量：

### 🔐 必需变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `NEON_DATABASE_URL` | Neon数据库连接字符串 | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | JWT令牌密钥（建议32位随机字符串） | `your-super-secret-jwt-key-32-chars` |

### 📧 邮件配置（可选）

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `SMTP_HOST` | SMTP服务器地址 | `smtp.qq.com` |
| `SMTP_PORT` | SMTP端口号 | `465` |
| `SMTP_USER` | 邮箱账号 | `your-email@qq.com` |
| `SMTP_PASS` | 邮箱授权码 | `your-smtp-auth-code` |

### 🎛️ 可选配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `production` |
| `BCRYPT_ROUNDS` | 密码加密轮数 | `12` |
| `ENABLE_REGISTRATION` | 是否开启注册 | `true` |
| `ENABLE_EMAIL_VERIFICATION` | 是否开启邮箱验证 | `false` |

## 📂 项目结构

```
坚果云相册/
├── api/                    # 后端API
│   ├── auth-handler.js     # 用户认证
│   ├── favorites-handler.js # 收藏管理
│   ├── profile-handler.js  # 用户资料
│   ├── api-router.js       # 路由处理
│   ├── neon-db.js         # 数据库操作
│   └── init-database.sql  # 数据库初始化
├── js/                    # 前端脚本
│   ├── neon-auth.js       # 认证模块
│   ├── simple-favorites.js # 收藏功能
│   └── neon-account-settings.js # 账号设置
├── css/                   # 样式文件
├── vercel.json           # Vercel配置
├── package.json          # 项目配置
└── server.js            # 服务器入口
```

## 🔧 Vercel 配置文件

项目需要在根目录创建 `vercel.json` 文件：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 📦 package.json 配置

确保 `package.json` 包含正确的构建脚本：

```json
{
  "name": "jianguoyun-album",
  "version": "2.0.0",
  "description": "坚果云相册 - Neon版本",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'",
    "migrate": "node api/migrate-user.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## 🎯 部署步骤

### 方法一：一键部署（推荐）

1. **点击部署按钮**：使用上方的 "Deploy with Vercel" 按钮
2. **导入仓库**：选择您的 GitHub 仓库
3. **配置环境变量**：填入必需的环境变量
4. **部署**：点击 "Deploy" 开始自动部署

### 方法二：手动部署

1. **登录 Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **部署项目**
   ```bash
   vercel --prod
   ```

3. **配置环境变量**
   ```bash
   vercel env add NEON_DATABASE_URL
   vercel env add JWT_SECRET
   # ... 添加其他变量
   ```

## 🌐 自定义域名配置

### 1. 在 Vercel 中配置域名
1. 进入项目设置 → Domains
2. 添加您的自定义域名
3. 获取 Vercel 提供的 DNS 记录

### 2. 在 Cloudflare 中配置 DNS
1. 登录 Cloudflare Dashboard
2. 选择您的域名
3. 添加 DNS 记录：
   ```
   类型: CNAME
   名称: @ (或子域名)
   目标: your-vercel-domain.vercel.app
   代理状态: 已代理（橙色云朵）
   ```

### 3. 配置 SSL/TLS
1. 在 Cloudflare 中设置 SSL/TLS 模式为 "完全"
2. 启用 "始终使用 HTTPS"
3. 配置 HSTS（可选）

## 🗄️ 数据库初始化

部署成功后，需要初始化数据库：

1. **自动初始化**（推荐）
   - 项目会在首次启动时自动检查并创建必要的表结构

2. **手动初始化**
   ```bash
   # 在本地连接到 Neon 数据库
   psql "YOUR_NEON_DATABASE_URL" -f api/init-database.sql
   ```

## 🔒 安全配置

### 1. 环境变量安全
- ✅ 所有敏感信息都通过环境变量配置
- ✅ JWT密钥使用强随机字符串
- ✅ 数据库连接使用SSL

### 2. API安全
- ✅ JWT令牌认证
- ✅ 密码bcrypt加密
- ✅ SQL注入防护
- ✅ XSS攻击防护

### 3. CORS配置
```javascript
// 在生产环境中建议限制CORS来源
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true
}));
```

## 🚨 常见问题

### Q1: 部署后API无法访问
**解决方案**：
- 检查 `vercel.json` 配置是否正确
- 确认环境变量已正确设置
- 查看 Vercel 部署日志

### Q2: 数据库连接失败
**解决方案**：
- 验证 `NEON_DATABASE_URL` 格式是否正确
- 确认 Neon 数据库是否已启动
- 检查网络连接权限

### Q3: 邮件发送失败
**解决方案**：
- 验证 SMTP 配置是否正确
- 检查邮箱授权码是否有效
- 确认端口号是否正确（QQ邮箱使用465）

### Q4: 自定义域名无法访问
**解决方案**：
- 检查 Cloudflare DNS 配置
- 验证 CNAME 记录是否正确
- 等待 DNS 传播（可能需要24-48小时）

## 📊 性能优化

### 1. Vercel 配置优化
```json
{
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  },
  "regions": ["sin1"]
}
```

### 2. 数据库优化
- 启用连接池
- 使用数据库索引
- 优化查询语句

### 3. 静态资源优化
- 启用 Vercel 的自动图片优化
- 使用 CDN 加速静态文件
- 压缩 CSS/JS 文件

## 🔄 持续部署

### GitHub 集成
1. 在 Vercel 中连接 GitHub 仓库
2. 启用自动部署
3. 配置分支部署策略：
   - `main` 分支 → 生产环境
   - `dev` 分支 → 预览环境

### 部署触发器
- ✅ Git push 自动触发部署
- ✅ Pull Request 自动创建预览
- ✅ 环境变量更新自动重新部署

## 📈 监控和日志

### 1. Vercel Analytics
```javascript
// 在页面中添加分析代码
import { Analytics } from '@vercel/analytics/react';

function MyApp() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### 2. 错误监控
- 使用 Vercel 的内置日志
- 配置 Sentry 错误追踪（可选）
- 设置 Webhook 通知

## 🎉 部署完成检查清单

- [ ] ✅ Vercel 部署成功
- [ ] ✅ 自定义域名配置完成
- [ ] ✅ SSL 证书正常工作
- [ ] ✅ 数据库连接正常
- [ ] ✅ 用户注册/登录功能正常
- [ ] ✅ 收藏功能正常工作
- [ ] ✅ 分类功能正常
- [ ] ✅ 邮件发送功能正常（如已配置）
- [ ] ✅ 响应式设计在移动端正常

## 🔗 相关链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Neon 数据库文档](https://neon.tech/docs)
- [Cloudflare 文档](https://developers.cloudflare.com/)
- [项目 GitHub 仓库](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)

## 🛠️ 技术支持

如果您在部署过程中遇到问题，可以：

1. 查看 Vercel 部署日志
2. 检查浏览器开发者工具
3. 参考项目文档
4. 联系技术支持

---

**🎊 恭喜！您的坚果云相册已成功部署到 Vercel！**

立即访问您的网站开始使用完整的收藏管理功能吧！ 🚀