# Xiuyi Blog - Node.js + Express 后端

## 项目概述

个人博客系统 REST API，Express 5 + MySQL，支持用户认证、文章管理。

## 快速开始

```bash
npm run init-db    # 初始化数据库（需先配置 .env）
npm run dev        # 启动开发服务器（nodemon 热重载）
npm start          # 生产环境启动
```

## 关键命令

| 命令 | 用途 |
|------|------|
| `npm run init-db` | 初始化数据库表（users, posts, categories） |
| `npm run dev` | 开发模式，端口 3000 |
| `curl http://localhost:3000/api/health` | 健康检查 |

## 项目结构

```
src/
├── app.js              # Express 应用配置（中间件、路由挂载）
├── server.js           # 入口，监听端口
├── config/
│   ├── database.js     # mysql2 连接池
│   ├── init.js         # 数据库初始化脚本
│   └── init.sql        # 建表 SQL
├── routes/
│   ├── index.js        # 路由入口，挂载 /api
│   └── auth.js         # POST /api/auth/register, /login
├── controllers/
│   └── authController.js
├── middleware/
│   └── auth.js         # JWT 认证中间件
└── models/             # 待实现
```

## 环境变量 (.env)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # 必填
DB_NAME=xiuyi_blog
JWT_SECRET=           # 必填，已生成 128 位随机密钥
PORT=3000
```

## 开发注意

- Express 5：路由错误处理需显式 try/catch，不自动捕获异步错误
- `pool.query()` 用于 DDL/init.sql，`pool.execute()` 用于参数化查询
- `dotenv` 必须在 `database.js` 之前加载（见 init.js 第 1-4 行顺序）
- 密码加密使用 bcrypt，salt rounds = 10
- JWT 有效期 7 天，payload 包含 `{ id, username }`
- 认证中间件：`Authorization: Bearer <token>`，解码后挂载到 `req.user`

## 数据库表

- `users`: id, username(唯一), email(唯一), password(bcrypt), avatar, created_at
- `posts`: id, title, content(Markdown), cover, category_id(外键), tags(JSON), author_id(外键), views, created_at, updated_at
- `categories`: id, name(唯一), description

## 待完成功能（参考 PRD.md）

- 文章 CRUD 路由
- 分类管理
- 分页/筛选/搜索
- 个人中心
