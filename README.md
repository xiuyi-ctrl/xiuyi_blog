# Xiuyi Blog

个人博客系统，前后端分离架构，支持文章管理、项目展示、照片集、留言板、搜索、音乐、站点统计、GitHub OAuth 登录、Live2D 看板娘等功能。

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
- Live2D 看板娘（l2d-widget）

## 功能特性

- GitHub OAuth 第三方登录（无本地注册/密码登录）
- 文章 CRUD，支持 Markdown 编写
- 文章分类、标签、搜索、分页
- 浏览次数统计
- 项目展示页
- 照片集管理
- 留言板（回复、点赞）
- 音乐播放器
- 站点数据统计
- Live2D 看板娘

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
GITHUB_CLIENT_ID=你的 GitHub OAuth Client ID
GITHUB_CLIENT_SECRET=你的 GitHub OAuth Client Secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
CLIENT_URL=http://localhost:5173
HTTP_PROXY=           # 可选，GitHub OAuth 请求代理
```

生成 JWT_SECRET：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

GitHub OAuth 应用需在 GitHub 开发者设置中创建，Authorization callback URL 填 `GITHUB_CALLBACK_URL`。

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
│   ├── app.js              # Express 应用配置（NODE_ENV=production 时加载 .env.production）
│   ├── server.js           # 入口文件
│   ├── config/             # 数据库配置与初始化（database.js, init.js, init.sql, seed.js）
│   ├── controllers/        # 控制器（目前只有 postController.js）
│   ├── middleware/         # 中间件（JWT 认证等）
│   └── routes/             # API 路由（业务逻辑大多直接写在这里）
├── client/                 # 前端源码（React + Vite）
│   └── src/
│       ├── api/            # Axios 封装（自动带 localStorage.token 的 Bearer 头）
│       ├── pages/ components/ contexts/ lib/ utils/
├── scripts/                # 工具脚本（optimize-images.js 图片压缩）
├── docs/                   # 文档（live2d-models.md 等）
├── .env.example            # 环境变量模板
└── package.json
```

## API 路由（挂载于 /api）

| 路由 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /auth/github` | GitHub OAuth 登录跳转 |
| `GET /auth/github/callback` | GitHub OAuth 回调 |
| `GET /auth/github/status` | 获取 GitHub OAuth Client ID |
| `/posts` | 文章管理，GET 支持 `page`/`pageSize`/`category`/`keyword`，GET /:id 会 views+1 |
| `/categories` | 分类管理 |
| `/projects` | 项目展示 |
| `/photos` | 照片集 |
| `/guestbook` | 留言板（回复、点赞） |
| `/search` | 搜索 |
| `/music` | 音乐 |
| `/archive` | 归档 |
| `/site-stats` | 站点统计 |
| `/blog-stats` | 博客统计 |

写操作（POST/PUT/DELETE）需要 `Authorization: Bearer <token>`（auth 中间件），仅作者本人可编辑/删除自己的文章。

## 其他脚本

```bash
npm run optimize-images  # 压缩 client/public/pictures/{photos_pictures,post_pictures} 下 >400KB 的 jpg/png
```

## License

ISC
