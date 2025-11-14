# 🧩 Moonshot Library System — 前端开发文档（Vue 版）

## 1. 📘 Project Overview

Moonshot Library System 是一个为校内图书馆开发的 **线上借阅与信息查询系统**。
 目标是通过 **Web 平台 + 馆内扫码/人脸识别**，实现统一的借书、还书、查询与状态同步。

------

## 2. ⚙️ Tech Stack

| 模块     | 技术方案                              | 备注                         |
| -------- | ------------------------------------- | ---------------------------- |
| 前端框架 | **Vue 3 + Vite**                      | 轻量快速开发                 |
| 状态管理 | **Pinia**                             | 管理登录状态 & 借阅记录      |
| 路由     | **Vue Router 4**                      | 多页面路由结构               |
| 接口请求 | **Axios**                             | 对接 Supabase / 后端 API     |
| UI 框架  | **Element Plus / Tailwind CSS**       | 按需使用（建议 Tailwind）    |
| 鉴权     | **MSA OAuth / Email Login**           | @moonshotacademy.cn 统一登录 |
| 数据源   | **Supabase REST API / PostgreSQL**    | 书籍、用户、借阅数据存储     |
| 版本控制 | **GitHub Repo (main + dev branches)** | PR 流程开发                  |

------

## 3. 🧱 Core Features（MVP 功能需求）

### 🔹 1. 用户登录与账户绑定

- 使用学校邮箱 (`@moonshotacademy.cn`) 登录。
- 登录后进入主界面：显示用户信息 + 当前借阅状态。

### 🔹 2. 搜索书籍（Search）

- 搜索字段：书名 / 作者 / ISBN / 分类号。
- 搜索结果展示：
  - `title`, `author`, `category`, `location`, `status`
  - 按 status 标注颜色（✅ 可借 / 🕓 已借出）。

### 🔹 3. 书籍详情页（Book Detail）

- 显示 basic_info：

  ```
  title
  author
  category
  isbn
  location
  status
  ```

- 若状态为 available → 显示「借阅」按钮。

### 🔹 4. 我的借阅（My Borrowings）

- 展示当前借阅书籍列表：
  - 标题 / 借出日期 / 到期日期 / 状态。
- 支持：
  - 🔁 续借（如果未超期）
  - ✅ 归还（模拟更新 status）

### 🔹 5. 管理员端（可选后续版本）

- 查看全部书籍状态 / 借阅记录。
- 手动录入书籍信息（书号 + basic_info）。

------

## 4. 📂 Folder Structure

```
moonshot-library/
│
├── src/
│   ├── assets/              # 静态资源
│   ├── components/          # 可复用组件（SearchBar, BookCard, etc.）
│   ├── pages/               # 页面级组件
│   │   ├── Login.vue
│   │   ├── Home.vue
│   │   ├── BookDetail.vue
│   │   ├── MyBorrowings.vue
│   │   └── Admin.vue
│   ├── store/               # Pinia 状态管理
│   │   └── userStore.js
│   ├── router/              # Vue Router 配置
│   │   └── index.js
│   ├── services/            # API 封装（axios / supabase）
│   │   └── bookService.js
│   ├── utils/               # 通用工具函数
│   ├── App.vue
│   └── main.js
│
├── public/                  # 公共文件
├── .env                     # 环境变量（SUPABASE_URL, API_KEY 等）
├── package.json
└── vite.config.js
```

------

## 5. 🧩 API Schema（Mock / Supabase 对接）

### 📘 `/books` 表结构

| 字段     | 类型         | 说明                            |
| -------- | ------------ | ------------------------------- |
| id       | int / string | 主键，系统内部编号              |
| isbn     | string       | 国际标准书号                    |
| title    | string       | 书名                            |
| author   | string       | 作者                            |
| category | string       | 分类号（A–Z + 数字）            |
| location | string       | 馆内位置                        |
| status   | string       | available / borrowed / reserved |
| user_id  | string       | 借阅人（为空则未借出）          |
| history  | json         | 借阅历史记录                    |

### 📘 `/users` 表结构

| 字段           | 类型   | 说明         |
| -------------- | ------ | ------------ |
| id             | string | 用户唯一 ID  |
| email          | string | 学校邮箱     |
| name           | string | 姓名         |
| borrowed_books | array  | 当前借阅书目 |

### 📘 `/transactions` 表结构

| 字段        | 类型      | 说明                 |
| ----------- | --------- | -------------------- |
| id          | string    | 交易记录 ID          |
| user_id     | string    | 用户 ID              |
| book_id     | string    | 书籍 ID              |
| borrow_date | timestamp | 借书日期             |
| return_date | timestamp | 还书日期             |
| status      | string    | 进行中 / 已还 / 逾期 |

------

## 6. 🔄 API Endpoints 示例（Mock）

| 功能         | 方法 | Endpoint                   | 说明                      |
| ------------ | ---- | -------------------------- | ------------------------- |
| 获取所有书籍 | GET  | `/api/books`               | 获取书籍列表              |
| 搜索书籍     | GET  | `/api/books?query=xxx`     | 模糊搜索                  |
| 借书         | POST | `/api/borrow/:book_id`     | 传入 user_id，更新 status |
| 还书         | POST | `/api/return/:book_id`     | 更新状态为 available      |
| 获取我的借阅 | GET  | `/api/user/:id/borrowings` | 查询用户借阅记录          |

------

## 7. 🎯 开发优先级

| 优先级 | 模块                   | 目标          |
| ------ | ---------------------- | ------------- |
| 🥇 P0   | 登录 + 搜索 + 书籍详情 | 核心框架完成  |
| 🥈 P1   | 我的借阅 + 状态更新    | 形成可用 Demo |
| 🥉 P2   | 管理端 / 自动同步      | 后续扩展开发  |

------

## 8. 📆 Next Steps（由 Codex 开发）

| 步骤 | 内容                                    | 输出                                            |
| ---- | --------------------------------------- | ----------------------------------------------- |
| 1️⃣    | 初始化 Vue 项目结构 + 路由框架          | `vue create moonshot-library` + commit 基础目录 |
| 2️⃣    | 实现 Login / Home / BookDetail 基础页面 | UI Placeholder + 路由跳转                       |
| 3️⃣    | 配置 API 服务层（Axios + Mock 数据）    | `/services/bookService.js`                      |
| 4️⃣    | 构建数据库表结构对接（Supabase）        | 测试 GET/POST 请求可用                          |
| 5️⃣    | 推送 `dev` 分支 Pull Request            | 确认架构无冲突后合并到主干                      |

------

## 9. 🧠 附注

- 登录模块暂可使用 Mock 用户信息；
- 页面数据使用假数据文件 `/mock/books.json`；
- UI 可参考 Figma 原型稿（由设计组提供，本周完成）；
- 确保 `.env` 文件中使用本地变量（不提交至仓库）。