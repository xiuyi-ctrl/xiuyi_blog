# Xiuyi Blog - 个人博客系统（前后端分离）

## 项目概述

React 18 + Vite 前端 + Express 5 + MySQL 后端，支持文章、项目展示、照片集、留言板、搜索、音乐、站点统计、GitHub OAuth 登录、Live2D 看板娘。

## 开发命令

**后端**（根目录）
```bash
npm run init-db   # 初始化数据库（执行 src/config/init.sql，需先配 .env）
npm run dev       # 开发模式，nodemon 热重载，端口 3000
npm start         # 生产环境启动
npm run optimize-images  # 压缩 client/public/pictures/{photos_pictures,post_pictures} 下 >400KB 的 jpg/png
```

**前端**（client/ 目录）
```bash
npm run dev       # Vite 开发服务器，端口 5173，/api 代理到 http://localhost:3000
npm run build     # tsc -b && vite build
npm run lint      # eslint .
```

> 无测试：`npm test` 是占位脚本（直接报错退出），仓库没有测试框架/用例。

## 项目结构

```
src/
├── app.js              # Express 配置；NODE_ENV=production 时加载 .env.production，否则 .env
├── server.js           # 入口
├── config/
│   ├── database.js     # mysql2 连接池
│   ├── init.js         # 读 init.sql 按 ';' 切分执行（用 pool.query）
│   └── init.sql        # 建库建表
├── routes/             # 业务逻辑大多直接写在这里，控制器仅 posts 单独抽出
├── controllers/        # 目前只有 postController.js
└── middleware/auth.js  # JWT 认证
client/                 # 前端源码（React + TS）
└── src/
    ├── api/index.ts    # axios 实例：baseURL /api，自动带 localStorage.token 的 Bearer 头
    ├── pages/ components/ contexts/ lib/ utils/
```

`src/models/` 为空目录，SQL 直接写在 routes/controllers 中，无 ORM。

## API 路由（挂载于 /api，见 src/routes/index.js）

| 路由 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `/auth` | GitHub OAuth 登录（仅 `/github`、`/github/callback`、`/github/status`，无 register/login） |
| `/posts` | 文章 CRUD，GET 支持 `page`/`pageSize`/`category`/`keyword`，GET /:id 会 views+1 |
| `/categories` `/projects` `/photos` `/archive` | 分类、项目、照片集、归档 |
| `/guestbook` `/search` `/music` | 留言板、搜索、音乐 |
| `/blog-stats` `/site-stats` | 博客/站点统计 |

写操作（POST/PUT/DELETE）需要 `Authorization: Bearer <token>`（auth 中间件），仅作者本人可编辑/删除自己的文章。

## 数据库表（init.sql）

- `users`: id, username(唯一), email(唯一), password, avatar, github_id, created_at
- `categories`: id, name(唯一), description
- `posts`: id, title, content(Markdown), summary, cover, category_id(外键), tags(JSON), author_id(外键), views, created_at, updated_at
- `projects`: id, title, description, status, github_url, skill_using(JSON)
- `photos`: id, title, description, cover, image_url(JSON，键为图片名、值为 URL)
- `site_stats`: id=1 单行, visit_count
- `guestbook` / `guestbook_replies` / `guestbook_likes`: 留言板与回复/点赞（点赞唯一约束 message_id+user_id）

## 开发注意

- Express 5 不自动捕获 async 错误，路由必须显式 try/catch
- `dotenv` 必须在 `database.js` 之前加载（见 init.js 第 1 行）
- 参数化查询用 `pool.query(sql, params)`（少数地方用 `pool.execute()`，两者都可用）
- JWT 有效期 7 天，payload `{ id, username }`；`users.password` 对 GitHub 用户为占位符 `'github_oauth'`，全站无本地密码登录、无 bcrypt
- GitHub OAuth 若配置了 `HTTP_PROXY`，会通过代理请求（见 auth.js getGithubAxios）

## 图片与封面

- 封面 URL 存相对路径，如 `/pictures/photos_pictures/XiaoAi_01.webp`（对应 `client/public/pictures/...`）
- 照片集图片已批量转 WebP，新增封面应优先用 `.webp`（`.jpg` 源文件未跟踪，勿提交）
- 新增图片可用 `npm run optimize-images` 压缩后使用

## Live2D 看板娘

- 模型位于 `client/public/live2d/`（6 个 Cubism2 模型），驱动组件 `client/src/components/VirtualPet.tsx`，文案在 `client/src/lib/petMessages.ts`
- 行为与各模型差异详见 `docs/live2d-models.md`

## Git 约定

- conventional commits：`feat/fix/refactor/perf/style` + 作用域，如 `feat(live2d): ...`、`feat(photos): ...`
- `.env`、`*.log`、`seed.sql`、`dump.js`、`.agents/` 已在 .gitignore 中，勿提交
