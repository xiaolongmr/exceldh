# 🚀 快速启动指南

## 立即开始使用

### 1. 安装依赖
```bash
npm install
```

### 2. 初始化数据库
执行以下命令创建数据库表结构：
```bash
# 方法1：使用psql命令行
psql 'postgresql://neondb_owner:npg_2y4woQIxESZC@ep-spring-sky-a1c6jtjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f api/init-database.sql

# 方法2：在Neon控制台中执行api/init-database.sql文件内容
```

### 3. 迁移用户数据
```bash
npm run migrate
```

### 4. 启动服务器
```bash
npm start
```

打开浏览器访问：http://localhost:3000

## 测试账号
- **邮箱**: zlnp@qq.com
- **密码**: jiushimima1.

## 🎉 迁移完成！

您的网站已成功从Firebase迁移到Neon数据库！现在可以：

✅ **登录/注册** - 完整的用户认证系统
✅ **管理收藏** - 添加、编辑、删除、排序收藏
✅ **用户资料** - 编辑昵称、头像、个人说明
✅ **匿名模式** - 访客也可以使用基础功能
✅ **安全存储** - 数据安全存储在Neon PostgreSQL中

如有问题，请查看 `README-MIGRATION.md` 详细文档。