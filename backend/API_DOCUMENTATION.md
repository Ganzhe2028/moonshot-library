# Moonshot Library API 概览

面向校园的图书馆管理系统后端，基于 **Express.js + TypeScript + SQLite**。文档反映当前代码实现，便于前后端协作和排查。

---

## 技术栈与约定
- **框架**：Express.js（TypeScript）
- **数据库**：SQLite3（`backend/database/library.db`，表结构见下）
- **认证**：JWT，`Authorization: Bearer <token>`
- **角色**：`student` / `teacher` / `librarian`（部分接口接受 `admin` 用作扩展）
- **验证**：`express-validator`，错误统一 `{ success, message, data? }`
- **文档**：Swagger UI `GET /api-docs`，OpenAPI JSON `GET /api-docs.json`
- **分页**：`limit` / `offset`，默认 50 / 0

---

## 主要功能模块（路由前缀 `/api`）

### 1) 认证 Auth (`/auth/*`)
- `POST /auth/register` 用户注册
- `POST /auth/login` 登录获取 token
- `POST /auth/refresh` 刷新 token
- `POST /auth/logout` 退出
- `POST /auth/microsoft`（可选）MSAL 登录

### 2) 图书 Books (`/books/*`)
- `GET /books` 列表，支持 `limit/offset/category/search`
- `GET /books/:id` 详情
- `POST /books` 创建（需 `librarian` 或 `admin`）
- `PUT /books/:id` 更新（需 `librarian` 或 `admin`）
- `DELETE /books/:id` 删除（需 `librarian` 或 `admin`）
- `GET /books/categories` 分类列表
- `POST /books/import` 批量导入（表格上传）

> 实际可借判断依赖 `available_copies` 与 `status`。当前实现：当 `available_copies < total_copies` 时状态会变为 `borrowed`，即使仍有剩余副本。

### 3) 借阅 Borrowings (`/borrowings/*`)
- `GET /borrowings` 列表，支持 `userId/bookId/status/limit/offset`（需登录；管理员可查看任意用户）
- `GET /borrowings/:id` 详情
- `POST /borrowings` 创建借阅（登录用户）
  - 业务规则：`available_copies > 0` 且 `status === 'available'`
  - 信用分 `< 50` 拒绝借阅
  - 默认借期 21 天（`BORROW_PERIOD_DAYS`，默认 21）
- `PUT /borrowings/:id/return` 归还，释放库存
- `PUT /borrowings/:id/renew` 续借
  - 信用分 `< 70` 拒绝续借
  - 每次续借增加 `RENEW_PERIOD_DAYS`（默认 14），最多 `MAX_RENEWALS` 次（默认 2）
- `PUT /borrowings/:id` 管理端更新借阅记录（仅 `librarian`，可改借期/状态）
- `GET /borrowings/overdue` 逾期检查
  - 先查询 `due_date < today AND status=active`，再批量标记 `status=overdue`

### 4) 用户 Users (`/users/*`)
- `GET /users` / `GET /users/role/:role` 用户列表（`librarian`/`admin`）
- `GET /users/:id` 用户详情（本人或管理员）
- `PUT /users/:id` 更新用户（管理员）

#### 收藏 Favorites (`/users/:id/favorites`)
- `GET /users/:id/favorites` 本人或管理员
- `POST /users/:id/favorites` body `{ bookId }`
- `DELETE /users/:id/favorites/:bookId`

#### 信用 Credit (`/users/:id/credit`)
- `GET /users/:id/credit` 本人或管理员
- `PUT /users/:id/credit`（仅管理员/馆员）body `{ score?, remarks? }`
- 规则：0–100，默认 80；`>=90 excellent / >=70 good / >=50 warn / else suspended`；`<50` 禁借阅，`<70` 禁续借；访问接口会按“每 3 天 +10，封顶 100”自动恢复。

---

## 数据模型（SQLite 表）
- `users`
  - `id (TEXT PK)`, `email`, `password`, `name`, `role ('student'|'teacher'|'librarian')`, `grade`, `membership ('active'|'suspended')`, `avatar_color`, `created_at/updated_at`
- `books`
  - 基础信息 + 双语字段（`*_en`）、`total_copies`、`available_copies`、`status ('available'|'borrowed'|'reserved'|'maintenance')`、`tags/tags_en` (JSON)
- `borrowing_records`
  - `user_id`, `book_id`, `borrow_date`, `due_date`, `return_date`, `status ('active'|'returned'|'overdue')`, `renewals`
- `favorites`
  - `user_id`, `book_id`，唯一约束 `(user_id, book_id)`
- `user_credit`
  - `user_id` (unique), `score`, `level`, `status`, `remarks`, `last_recovered_at`
- `reservations`
  - 预留表，当前接口未暴露

索引与外键已在初始化时创建，`PRAGMA foreign_keys = ON`。

---

## 响应与错误
```json
{
  "success": true,
  "message": "说明",
  "data": { /* 可选 */ },
  "errors": [ /* 可选，验证失败时提供 */ ]
}
```
- 常见状态码：`200/201` 成功，`400` 业务或参数错误，`401` 未认证，`403` 权限不足，`404` 未找到，`429` 频控，`500` 服务异常。

---

## 开发与调试
- 本地运行：`npm install && npm run init-db && npm run dev`
- Swagger UI：`http://localhost:3000/api-docs`
- 若修改 API：同步更新 Swagger 注释与本文档，确保前端服务契约一致。
