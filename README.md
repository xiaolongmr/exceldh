# 🌟 坚果云相册 - Neon版本

> 基于 Neon PostgreSQL 的现代化收藏管理系统，从 Firebase 完全迁移

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME&env=NEON_DATABASE_URL,JWT_SECRET,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS&envDescription=Required%20environment%20variables&envLink=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME#environment-variables)

## ✨ 功能特色

- 🔐 **安全认证**：JWT令牌 + bcrypt密码加密
- 📚 **智能收藏**：支持分类标签、拖拽排序、批量操作
- 🌈 **现代界面**：响应式设计，完美适配移动端
- 🚀 **高性能**：基于 Neon PostgreSQL，毫秒级响应
- 📧 **邮件通知**：支持注册验证、密码重置（可选）
- 🔗 **分享功能**：一键生成分享链接
- 🏷️ **分类管理**：智能分类标签系统

## 🎯 快速开始

### 方法一：一键部署到 Vercel（推荐）

1. 点击上方 "Deploy with Vercel" 按钮
2. 连接您的 GitHub 账号
3. 配置环境变量（见下方说明）
4. 点击部署，等待完成

### 方法二：本地开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入您的配置

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 开始使用！

## ⚙️ 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置（必需）
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT配置（必需）
JWT_SECRET=your-super-secret-jwt-key-32-characters

# 服务器配置
PORT=3000
NODE_ENV=development

# 邮件配置（可选）
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your-email@qq.com
SMTP_PASS=your-smtp-authorization-code

# 功能开关
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=true
```

## 📋 详细部署指南

查看 **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** 获取完整的部署指南，包括：

- 🔧 Vercel 配置详解
- 🌐 Cloudflare 域名绑定
- 🗄️ 数据库初始化
- 🔒 安全配置建议
- 🚨 常见问题解决
- 📊 性能优化技巧

## 🏗️ 项目架构

```
├── api/                    # 后端API模块
│   ├── auth-handler.js     # 用户认证处理
│   ├── favorites-handler.js # 收藏功能处理
│   ├── profile-handler.js  # 用户资料处理
│   ├── api-router.js       # 统一路由处理
│   ├── neon-db.js         # 数据库操作封装
│   └── init-database.sql  # 数据库初始化脚本
├── js/                    # 前端JavaScript
│   ├── neon-auth.js       # 认证系统
│   ├── simple-favorites.js # 收藏管理
│   └── neon-account-settings.js # 账号设置
├── css/                   # 样式文件
│   ├── favorites.css      # 收藏样式
│   └── auth.css          # 认证样式
├── vercel.json           # Vercel部署配置
├── server.js            # 服务器入口
└── index.html          # 主页面
```

## 🔧 技术栈

- **前端**：原生 JavaScript + HTML5 + CSS3
- **后端**：Node.js + Express风格路由
- **数据库**：Neon PostgreSQL
- **认证**：JWT + bcrypt
- **部署**：Vercel + Cloudflare
- **依赖管理**：npm

## 🚀 核心功能

### 🔐 用户认证系统
- 用户注册/登录
- 匿名用户支持
- 账号升级功能
- JWT令牌管理
- 密码加密存储

### 📚 收藏管理系统
- 添加/编辑/删除收藏
- 智能分类标签
- 拖拽排序功能
- 批量操作支持
- 自动获取网站信息

### 🏷️ 分类标签功能
- 动态分类创建
- 分类筛选显示
- 标签管理界面
- 收藏统计功能

### 🔗 分享功能
- 一键生成分享链接
- 自定义分享描述
- 访问权限控制
- 分享统计数据

## 📱 移动端支持

- 🎨 响应式设计，完美适配各种屏幕
- 👆 触摸友好的交互体验
- ⚡ 优化的移动端性能
- 🔧 PWA支持（可选）

## 🔒 安全特性

- ✅ JWT令牌认证
- ✅ 密码bcrypt加密
- ✅ SQL注入防护
- ✅ XSS攻击防护
- ✅ CORS安全配置
- ✅ 环境变量保护

## 🐛 问题反馈

如果您遇到任何问题，请：

1. 查看 [部署指南](./VERCEL_DEPLOY.md)
2. 检查 [常见问题](./VERCEL_DEPLOY.md#-常见问题)
3. 提交 [Issue](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/issues)

## 🤝 贡献指南

欢迎提交 Pull Request！请确保：

1. 代码符合项目规范
2. 添加必要的测试
3. 更新相关文档
4. 提交前进行充分测试

## 📄 开源协议

本项目采用 [MIT License](./LICENSE)

## 🎉 致谢

- [Neon](https://neon.tech/) - 现代化的PostgreSQL云服务
- [Vercel](https://vercel.com/) - 优秀的部署平台
- [Cloudflare](https://www.cloudflare.com/) - 全球CDN服务

---

**🌟 如果这个项目对您有帮助，请给个Star支持一下！**

[![Star on GitHub](https://img.shields.io/github/stars/YOUR_USERNAME/YOUR_REPO_NAME.svg?style=social)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/stargazers)