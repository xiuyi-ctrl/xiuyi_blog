# Xiuyi Blog

个人博客系统，前后端分离架构，支持文章管理、项目展示、照片集、留言板等功能。

## 技术栈

**后端**
- Node.js + Express 5
- MySQL (mysql2)
- JWT 认证
- GitHub OAuth 登录

**前端**
- React 18 + TypeScript
- Vite 构建
- React Router v7
- GSAP / Motion 动画
- React Markdown (GFM)
- APlayer 音乐播放器

## 功能特性

- 用户注册 / 登录 / GitHub 第三方登录
- 文章 CRUD，支持 Markdown 编写
- 文章分类、标签、搜索、分页
- 浏览次数统计
- 项目展示页
- 照片集管理
- 留言板
- 音乐播放器
- 站点数据统计

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7

### 安装

```bash
git clone https://github.com/xiuyi-ctrl/xiuyi_Blog.git
cd xiuyi_Blog

# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 配置

```bash
cp .env.example .env
```

编辑 `.env` 填写数据库和密钥配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=xiuyi_blog
JWT_SECRET=随机密钥
PORT=3000
CLIENT_URL=http://localhost:5173
```

生成 JWT_SECRET：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 初始化数据库

```bash
npm run init-db
```

### 启动

```bash
# 启动后端（开发模式）
npm run dev

# 启动前端（新终端）
cd client
npm run dev
```

前端默认运行在 `http://localhost:5173`，后端运行在 `http://localhost:3000`。

## 项目结构

```
xiuyi_Blog/
├── src/                    # 后端源码
│   ├── app.js              # Express 应用配置
│   ├── server.js           # 入口文件
│   ├── config/             # 数据库配置与初始化
│   ├── controllers/        # 控制器
│   ├── middleware/          # 中间件（JWT 认证等）
│   ├── models/             # 数据模型
│   └── routes/             # API 路由
├── client/                 # 前端源码（React + Vite）
│   └── src/
├── scripts/                # 工具脚本
├── .env.example            # 环境变量模板
└── package.json
```

## API 路由

| 路由 | 说明 |
|------|------|
| `POST /api/auth/register` | 用户注册 |
| `POST /api/auth/login` | 用户登录 |
| `GET /api/auth/github` | GitHub OAuth 登录 |
| `/api/posts` | 文章管理 |
| `/api/categories` | 分类管理 |
| `/api/projects` | 项目展示 |
| `/api/photos` | 照片集 |
| `/api/guestbook` | 留言板 |
| `/api/search` | 搜索 |
| `/api/music` | 音乐 |
| `/api/archive` | 归档 |
| `/api/site-stats` | 站点统计 |
| `/api/blog-stats` | 博客统计 |

## License

ISC
