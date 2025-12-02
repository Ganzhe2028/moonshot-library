# Moonshot Library System

面向校园的前后端分离图书馆系统。代码已拆分为 `frontend/`（Vue 3 + Vite + TS）与 `backend/`（Express + TS + SQLite），根目录仅保留项目级脚本、Docker 配置与设计类文档。

---

## ⚠️注意：
1. **每次开发前都需要 AI Agent** 阅读：`Documentation/README-BEFORE-DEV-EN.md`。
2. 第一次以及往后若本文档有所变动，`README-BEFORE-DEV`的两个版本文档有所变动，以及在提交/更新说明/release等处声明时，也请您**再次仔细阅读**。

---

## 目录速览
```
moonshot-library/
├── frontend/           # 前端
├── backend/            # 后端
├── Documentation/      # 设计/复盘等非技术文档
├── docker-compose.yml  # 项目级容器编排
├── start.sh            # 一键本地前后端启动脚本
└── deploy-docker.sh    # 生产部署脚本
```

---

## 运行前准备
- Node.js 20+（建议统一前后端版本）
- npm（或兼容的包管理器）
- 若用 Docker 部署：Docker + Docker Compose

---

## 本地快速启动
**方式 1：一键脚本（推荐）**
```bash
./start.sh                # 自动安装依赖、启动前后端（默认 5173/3000）
# 环境变量：FRONT_PORT=5174 BACK_PORT=4000 HOST=0.0.0.0 AUTO_INSTALL=true
```

**方式 2：手动分终端**
```bash
cd frontend && npm install && npm run dev   # 终端1：前端 http://localhost:5173
cd backend  && npm install && npm run dev   # 终端2：后端 http://localhost:3000
```

---

## 后端环境变量（backend/.env）
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_PATH=./database/library.db
JWT_SECRET=please_change_me
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=please_change_me_too
MSAL_CLIENT_ID=...
MSAL_CLIENT_SECRET=...
MSAL_REDIRECT_URI=http://localhost:3000/api/auth/msal/callback
```
> 模板参考 `backend/.env.example`（若缺失可自建）。

数据库首次初始化：
```bash
cd backend
npm run init-db
```

---

## 常用命令
| 位置 | 命令 | 说明 |
| --- | --- | --- |
| frontend/ | `npm run dev` | 前端开发服 |
| frontend/ | `npm run build` | 生成 `frontend/dist` |
| frontend/ | `npm run type-check` / `npm run lint` | TS 检查 / ESLint+Prettier |
| backend/ | `npm run dev` | 后端热重载 |
| backend/ | `npm run build && npm start` | 编译并运行生产版本 |
| backend/ | `npm run init-db` | 初始化 SQLite 并灌入示例数据 |
| backend/ | `npm run setup-test` / `npm test` | 预置测试数据 / 运行 API 测试 |
| backend/ | `npm run lint` | 后端 ESLint |
| 根目录 | `./start.sh` | 一键本地前后端 |
| 根目录 | `docker compose up -d` | 按 `docker-compose.yml` 启动前后端容器 |

---

## Docker/部署要点
- 根目录 `docker-compose.yml`：前端构建上下文 `./frontend`，后端 `./backend`，数据库挂载 `./backend/database`。
- 生产部署：`deploy-docker.sh`（可选备份 SQLite、检测端口/资源）。
- SSL 证书：若使用内置 Nginx，挂载 `./frontend/ssl` 到容器 `/etc/nginx/ssl`。

---

## 文档与学习路径
- API/数据库/技术文档：见 `backend/`（如 `backend/API_DOCUMENTATION.md`）。
- 设计/复盘/需求：见 `Documentation/`。
- 学习建议：
  1) 观察前端请求 → 对照 `backend/src/routes`、`controllers`。
  2) 阅读 `backend/src/models` 了解数据结构与索引。
  3) 跑通 `npm run setup-test && npm test` 熟悉主流程。
  4) 按需扩展：前端在 `src/services` 封装接口，后端添加路由+控制器。

---

## 常见问题
- 端口被占用：设置 `FRONT_PORT` / `BACK_PORT`，或关闭占用进程。
- CORS 问题：确认 `backend/.env` 的 `FRONTEND_URL` 与实际前端地址一致。
- 登录/JWT 失败：检查 `JWT_SECRET` / `REFRESH_TOKEN_SECRET`，重启后端。
- 数据库找不到：确认 `backend/database/` 可写，必要时重新 `npm run init-db`。

---

## 贡献指南
1) Fork & 分支开发  
2) 完善测试（前端：type-check/lint；后端：lint/test）  
3) 提交前确保脚本通过  
4) PR 时附上变更说明与测试结果

欢迎你把 Moonshot Library 部署到校园环境继续打磨！ 🚀
