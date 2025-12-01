# Moonshot Library System · 新手入门指南

Moonshot Library 是一个“前端 + 后端”分离的校园图书馆管理系统。你会接触到两个主要部分：

- **前端**：Vue 3 + Vite + TypeScript，负责界面和交互（位于 `frontend/`）。
- **后端**：Express.js + TypeScript + SQLite，负责 API、鉴权和数据（位于 `backend/`）。

本指南面向新手程序员，按照如下顺序带你一步步完成环境搭建、运行和探索。

---

## 1. 为什么选择这个项目？

- 🧩 **真实业务**：多角色（管理员/馆员/老师/学生）权限、图书 CRUD、借阅流程等完整功能。
- 🪪 **安全实践**：JWT 鉴权、速率限制、输入校验、Helmet 安全头。
- 🧠 **技术栈现代**：TypeScript 全覆盖、Vite 极速开发体验、SQLite 轻量数据库。
- 🧪 **自带测试与文档**：API 文档、自动化测试脚本帮助你理解接口行为。

---

## 2. 技术栈速览

| 部分 | 主技术 | 说明 |
| --- | --- | --- |
| 前端 | Vue 3、Pinia、Vue Router、Vite | 现代前端脚手架，热更新体验优秀 |
| 后端 | Node.js、Express.js、TypeScript | 负责 API、认证、业务逻辑 |
| 数据 | SQLite3 | 免安装数据库，适合本地学习 |
| 工具 | ESLint、Prettier、npm-run-all2 | 代码质量与并行脚本支持 |

---

## 3. 快速体验（建议一步步来）

```Quick Start
cd frontend && npm install && npm run dev   # 终端1：前端
cd backend && npm install && npm run dev    # 终端2：后端
```


> ❗️在动手之前，请先安装 **Node.js 20+**（前端要求更高版本，后端兼容 16+，统一使用 20 可以避免问题）。

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd moonshot-library
   ```

2. **安装依赖**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **配置后端环境变量**
   ```bash
   cd backend
   cp .env.example .env
   ```
   - 根据注释修改 `.env`（如 JWT 密钥、端口、前端地址、借阅策略等）。
   - 默认数据库位置为 `backend/database/library.db`，初学者无需改动。

4. **初始化数据库（仅首次）**
   ```bash
   cd backend
   npm run init-db
   ```

5. **启动后端**
   ```bash
   cd backend
   npm run dev
   ```
   - 默认运行在 `http://localhost:3000`，终端会输出 API 日志。

6. **启动前端**
   ```bash
   # 新开一个终端
   cd frontend
   npm run dev
   ```
   - Vite 会提示访问地址，一般是 `http://localhost:5173`。

7. **验证一切正常**
   - 浏览器访问前端地址，尝试登录/浏览图书。
- 如需查看 API 列表，进入 `backend/API_DOCUMENTATION.md` 或访问 Swagger（若已暴露）。

---

## 4. 项目结构（删繁就简）

```
moonshot-library/
├── frontend/           # 前端源代码（Vue 3 + Vite + TS）
│   ├── src/components  # 复用组件
│   ├── src/pages       # 页面视图
│   ├── src/stores      # Pinia 状态
│   ├── src/services    # 与后端交互的请求封装
│   └── src/router      # 前端路由配置
├── backend/            # 后端项目（Express + TS + SQLite）
│   ├── src/controllers # 处理请求的控制器
│   ├── src/models      # 数据访问层
│   ├── src/routes      # 路由定义
│   ├── src/middleware  # 鉴权/校验等中间件
│   └── src/scripts     # 初始化数据库、测试脚本
├── Documentation/      # 设计/复盘等非技术文档
└── readme.md           # 你正在阅读的指南
```

---

## 5. 常用脚本速查

| 位置 | 命令 | 用途 |
| --- | --- | --- |
| frontend/ | `npm run dev` | 启动前端开发服务器 |
| frontend/ | `npm run build` | 构建前端产物（`dist/`） |
| frontend/ | `npm run type-check` | 前端 TypeScript 检查 |
| frontend/ | `npm run lint` | 前端 ESLint + Prettier |
| backend/ | `npm run dev` | 启动后端（ts-node-dev 热重载） |
| backend/ | `npm run build && npm start` | 编译并运行后端生产版本 |
| backend/ | `npm run init-db` | 初始化SQLite数据库并创建核心表结构，在数据库为空时自动填充示例图书数据，同时创建三种角色的演示账户（学生、教师、图书管理员） |
| backend/ | `npm run setup-test` | 准备测试数据 |
| backend/ | `npm test` / `npm run test:watch` | 运行 API 测试 |
| backend/ | `npm run lint` | 后端 ESLint 检查 |
| 根目录 | `./start.sh` | 一键启动前后端开发（自动安装依赖，可配置端口） |

---

## 6. API 与数据

- 📄 **API 文档**：`backend/API_DOCUMENTATION.md`（涵盖认证、图书、借阅等所有端点）  
- 🗄️ **数据库**：默认 SQLite 文件位于 `backend/database/`，测试脚本会自动创建所需表。  
- 🔑 **用户角色**：Admin → Librarian → Teacher/Student，权限逐级递减，可在 API 文档中查看每个角色能做什么。  
- ✅ **测试**：先运行 `npm run setup-test` 填充数据，再执行 `npm test` 验证主要流程。  
- 🔐 **M365 SSO 登录**：支持使用 Microsoft 365 账户登录，配置说明详见 `M365_AUTH_SETUP.md`

---

## 7. 新手学习路线（可按需挑选）

1. **理解请求流程**  
   - 打开浏览器开发者工具，观察前端发出的 API 请求与响应。
   - 对照 `backend/src/routes` 和 `controllers` 查看后端如何处理请求。

2. **阅读数据模型**  
   - `backend/src/models` 展示了 SQLite 查询语句和业务字段，适合理解数据库结构。

3. **尝试扩展**  
   - 在前端 `services` 里新增一个 API 封装，再在 `pages` 中调用它。
   - 在后端新增一个简单路由（例如“系统状态”），并在 Postman 里测试。

4. **运行测试并调试失败用例**  
   - 分析 `backend/src/scripts/apiTest.ts`，了解如何使用 axios 进行端到端测试。

5. **安全思维**  
   - 阅读 `middleware` 中的鉴权、速率限制、输入校验代码，理解为什么要这样做。

---

## 8. 常见问题 & 排障

- **Node 版本不一致**：确保前端/根目录使用 Node 20+，后端也能兼容该版本。`node -v` 检查，必要时使用 nvm 切换。  
- **无法连接数据库**：确认已运行 `npm run init-db`，并检查 `.env` 中的 `DATABASE_PATH` 是否指向 `./data/library.db`。  
- **前后端 CORS 报错**：`.env` 中 `FRONTEND_URL` 需与 Vite 真正的访问地址一致（含协议和端口）。  
- **JWT 报错或登录失败**：确保 `.env` 中的 `JWT_SECRET`、`REFRESH_TOKEN_SECRET` 不为空，并重新启动后端。  
- **测试脚本失败**：先运行 `npm run setup-test`，确保数据库有基础数据，再执行 `npm test`。  

---

## 9. 贡献 & 支持

1. Fork → 创建分支 → 开发 → 补充测试 → `npm run lint` / `npm test` → 提交 PR。  
2. 有问题可：
   - 查看 `backend/README.md` 与 `backend/API_DOCUMENTATION.md` 获取更详细的后端说明；
   - 在 Issues 中描述你的使用场景与报错；
   - 阅读测试脚本或 `Documentation/` 目录寻找答案。

---

祝使用愉快，欢迎你把 Moonshot Library 当作练手项目，也可以把它部署到自己的校园或社团中继续打磨！ 🚀
