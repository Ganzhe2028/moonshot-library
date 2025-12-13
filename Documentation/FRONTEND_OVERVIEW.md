# 前端概览（现状版）

基于 **Vue 3 + Vite + TypeScript** 的 SPA，使用 **Pinia** 管理状态、**Vue Router 4** 路由、原生 `fetch` 访问后端。本文同步当前代码实现，便于新成员快速上手。

---

## 技术与目录
- 栈：Vue 3、TypeScript、Pinia、Vue Router、vue-i18n、Vite。
- 入口：`frontend/src/main.ts`；路由定义在 `frontend/src/router`。
- 组件：`frontend/src/components`（如 `BookCard`、`RatingStars`、`CommentSection`）。
- 页面：`frontend/src/pages`
  - `HomePage`：书籍列表/筛选
  - `BookDetailPage`：详情、借阅、收藏、评分/评论
  - `MyBorrowingsPage`：当前/历史借阅、信用分、收藏
  - `admin/AdminBorrowingsPage`：馆员编辑借阅记录
  - 其他：登录/注册/社区等
- 状态：`frontend/src/stores`
  - `auth`：登录态、token、本地存储
  - `library`：书籍、借阅、收藏、评分/评论、信用分
  - `admin`：管理端的用户与借阅列表
- 服务：`frontend/src/services/*Service.ts`，封装 `/api` 请求；默认从 `localStorage.token` 读取 Bearer。

---

## 关键数据流
- 登录后：`libraryStore.fetchBooks/fetchBorrowings/fetchFavorites/fetchCredit` 会根据用户变化刷新。
- 借阅按钮：仅在 `book.status === 'available'` 且当前用户未借过时可用；借阅成功后重新拉取书目与借阅列表。
- 归还/续借：调用 `borrowingService.returnBook/renewBorrowing` 后刷新书目与借阅。
- 收藏/信用：通过各自服务读写，UI 在详情页和“我的借阅”展示。
- 备注：后端会在有任意副本外借时将 `book.status` 设为 `borrowed`，前端据此禁用借阅按钮，因此多副本场景仍需依赖后端的状态计算。

---

## 环境与命令
- 运行：`npm install && npm run dev`（开发端口 5173，代理到 `/api`）
- 构建：`npm run build`
- 检查：`npm run type-check`，`npm run lint`
- 环境变量：`frontend/.env.*`（若不存在会使用默认开发配置），常用 `VITE_API_BASE=/api`。

---

## 待办/注意
- 若调整接口字段或状态语义，请同步更新 `libraryStore`、各 `service` 与 i18n 文案。
- 书籍可借逻辑当前完全依赖后端的 `status/availableCopies`；多副本可借策略需后端修正后再放开前端判断。***
