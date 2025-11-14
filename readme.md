# 📚 Moonshot Library System (Vue Edition)

A unified **library management platform** designed for Moonshot Academy — combining **online borrowing, search, and status synchronization** between web and on-site systems.

## 🚀 Overview
Moonshot Library System enables students to:
- Search books by title / author / ISBN / category  
- Borrow and return books through the library or web  
- View current and past borrowing records  
- Sync borrowing data with school account (`@moonshotacademy.cn`)

## 🧰 Tech Stack

| Module | Technology | Notes |
|---------|-------------|-------|
| Frontend Framework | **Vue 3 + Vite** | Fast & modular SPA |
| State Management | **Pinia** | User + book states |
| Routing | **Vue Router 4** | Multi-page structure |
| API Requests | **Axios** | Connect to Supabase / REST endpoints |
| UI Library | **Element Plus / Tailwind CSS** | Lightweight UI |
| Auth | **MSA OAuth / Email Login** | `@moonshotacademy.cn` integration |
| Database | **Supabase (PostgreSQL)** | Store books, users, transactions |
| Version Control | **GitHub (main/dev branches)** | Use PR workflow |

## 📦 Core Features (MVP)

### 🧑‍💻 User Login
- Login via school email (`@moonshotacademy.cn`)
- Display personal profile + active borrowings

### 🔍 Book Search
- Search by title / author / ISBN / category
- Display `title`, `author`, `category`, `location`, `status`
- Highlight status (✅ available / 🕓 borrowed)

### 📘 Book Details
- Show full `basic_info` (title, author, ISBN, category, location, status)
- Borrow button enabled only if available

### 📚 My Borrowings
- List user's current & past borrowings
- Support renewals and return actions
- Auto-sync with backend status

### 🏛 Admin Panel (Future)
- Add/edit books manually
- Monitor borrowing logs

## 🗂 Folder Structure

```
moonshot-library/
 │
 ├── src/
 │   ├── assets/              # Static assets
 │   ├── components/          # Reusable components
 │   ├── pages/               # Page-level views
 │   │   ├── Login.vue
 │   │   ├── Home.vue
 │   │   ├── BookDetail.vue
 │   │   ├── MyBorrowings.vue
 │   │   └── Admin.vue
 │   ├── store/               # Pinia stores
 │   │   └── userStore.js
 │   ├── router/              # Vue Router config
 │   │   └── index.js
 │   ├── services/            # Axios / Supabase requests
 │   │   └── bookService.js
 │   ├── utils/               # Helper functions
 │   ├── App.vue
 │   └── main.js
 │
 ├── public/
 ├── .env                     # Environment variables (SUPABASE_URL, API_KEY)
 ├── package.json
 └── vite.config.js
```

## 🧩 Database Schema (Supabase)

### `books`
| Field | Type | Description |
|--------|------|-------------|
| id | string | Unique book ID |
| isbn | string | Standard ISBN |
| title | string | Book title |
| author | string | Author name |
| category | string | Category code (A–Z + number) |
| location | string | Shelf location |
| status | string | `available` / `borrowed` / `reserved` |
| user_id | string | Borrower ID |
| history | json | Borrowing records |

### `users`
| Field | Type | Description |
|--------|------|-------------|
| id | string | Unique user ID |
| email | string | School email |
| name | string | Full name |
| borrowed_books | array | Active borrowings |

### `transactions`
| Field | Type | Description |
|--------|------|-------------|
| id | string | Transaction ID |
| user_id | string | Borrower |
| book_id | string | Book reference |
| borrow_date | timestamp | Borrowing date |
| return_date | timestamp | Return date |
| status | string | `active` / `returned` / `overdue` |

## 🌐 API Endpoints (Mock)

| Function | Method | Endpoint | Description |
|-----------|---------|-----------|-------------|
| Get all books | `GET` | `/api/books` | Fetch all book records |
| Search books | `GET` | `/api/books?query=xxx` | Fuzzy search |
| Borrow a book | `POST` | `/api/borrow/:book_id` | Update status & user_id |
| Return a book | `POST` | `/api/return/:book_id` | Reset to available |
| Get user borrowings | `GET` | `/api/user/:id/borrowings` | Query user records |

## 🔄 Development Steps

1. **Initialize Project**
   ```bash
   npm create vite@latest moonshot-library -- --template vue
   cd moonshot-library
   npm install
   ```

2. **Add Libraries**
   ```bash
   npm install vue-router pinia axios element-plus tailwindcss
   ```
   
3. **Setup Pages & Routing**
   - Create `src/pages` and `src/router/index.js`
   - Configure `Login`, `Home`, `BookDetail`, `MyBorrowings`

4. **Create API Service**
   - Implement `/services/bookService.js`
   - Connect to mock API or Supabase REST endpoints

5. **Integrate State (Pinia)**
   - Manage `user`, `borrowedBooks`, and `session`

6. **Connect to Supabase**
   - Configure `.env`:
     ```
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_KEY=...
     ```

7. **Test MVP**
   - Run locally:
     ```bash
     npm run dev
     ```
   - Verify login → search → borrow → return flow.

------

## 🧭 Roadmap

| Phase     | Goal                               | Output                          |
| --------- | ---------------------------------- | ------------------------------- |
| 🥇 Phase 1 | Vue app skeleton + routing + login | Initial commit (main structure) |
| 🥈 Phase 2 | Connect Supabase + data binding    | CRUD endpoints functional       |
| 🥉 Phase 3 | Add MyBorrowings UI & renew logic  | MVP ready                       |
| 🏁 Phase 4 | Deploy to Netlify / Vercel         | Live beta                       |

------

## 🧠 Notes

- Temporary mock data may be used under `/mock/books.json`
- Align naming conventions with backend schema

## 🎯 Project Highlights

1. **类型安全**：全面使用TypeScript，定义了完整的类型系统
2. **状态管理**：使用Pinia进行集中式状态管理
3. **组件化设计**：高度模块化的组件架构
4. **用户体验**：现代化的UI设计和流畅的交互
5. **响应式**：适配不同设备尺寸
6. **数据持久化**：本地状态管理，便于后续接入后端API

## 🚀 Development Commands

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 代码检查
npm run format   # 代码格式化
npm run preview  # 预览构建结果
```

这个项目展现了一个完整的现代化前端应用开发实践，从架构设计到用户体验都体现了较高的水准，非常适合作为校园图书馆系统的解决方案。