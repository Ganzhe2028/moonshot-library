# Moonshot Library System

面向校园的前后端分离图书馆管理系统。

- **前端**：Vue 3 + Vite + TypeScript（位于 `frontend/`）
- **后端**：Express.js + TypeScript + SQLite（位于 `backend/`）

---

## ⚠️ 开发前必读

1. **每次开发前** AI Agent 需阅读：`README-BEFORE-DEV-EN.md`
2. 第一次开发请仔细阅读本文档和开发规范文档

---

## 目录结构

```
moonshot-library/
├── frontend/              # 前端 Vue 应用
├── backend/               # 后端 Express API
├── Documentation/         # 设计/复盘等非技术文档
├── nginx/                 # Nginx 配置模板
├── ecosystem.config.js    # PM2 配置文件
├── deploy.sh              # 部署脚本
└── readme.md              # 本文件
```

---

## 技术栈

| 部分 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue 3, Pinia, Vue Router, Vite | 现代前端框架，热更新体验优秀 |
| 后端 | Node.js, Express.js, TypeScript | API、认证、业务逻辑 |
| 数据库 | SQLite3 | 轻量级数据库，适合校园项目 |
| 认证 | JWT + Microsoft MSAL | 支持本地登录和 M365 SSO |
| 工具 | ESLint, Prettier, PM2 | 代码质量与进程管理 |

---

## 快速开始

### 环境要求

- Node.js 20+
- npm（或兼容的包管理器）

### 本地开发

```bash
# 1. 克隆仓库
git clone <repository-url>
cd moonshot-library

# 2. 安装前端依赖并启动（终端 1）
cd frontend
npm install
npm run dev    # http://localhost:5173

# 3. 安装后端依赖并启动（终端 2）
cd backend
npm install
npm run init-db    # 首次需要初始化数据库
npm run dev        # http://localhost:3000
```

### 配置环境变量

项目支持多环境配置（开发/测试/生产），环境配置文件位于：

```
backend/
├── .env.example      # 配置模板（必看）
├── .env.development  # 开发环境
├── .env.production   # 生产环境模板
└── .env              # 实际使用的配置（从模板复制）

frontend/
├── .env.example      # 配置模板
├── .env.development  # 开发环境
├── .env.production   # 生产环境模板
└── .env.local        # 实际使用的配置
```

**快速开始（开发环境）：**

```bash
# 后端
cd backend
cp .env.development .env

# 前端（可选，开发环境有默认值）
cd frontend
cp .env.development .env.local
```

**主要配置项：**

| 变量 | 说明 | 开发环境 | 生产环境 |
|------|------|----------|----------|
| `NODE_ENV` | 运行环境 | development | production |
| `PORT` | 后端端口 | 3000 | 3000 |
| `FRONTEND_URL` | 前端地址 | http://localhost:5173 | https://your-domain.com |
| `JWT_SECRET` | JWT 密钥 | 开发用简单密钥 | **必须使用强随机字符串** |
| `MSAL_*` | SSO 配置 | 可选（模拟模式） | Azure 门户获取 |

---

## 常用命令

| 位置 | 命令 | 说明 |
|------|------|------|
| frontend/ | `npm run dev` | 启动前端开发服务器 |
| frontend/ | `npm run build` | 构建生产版本 |
| frontend/ | `npm run type-check` | TypeScript 检查 |
| frontend/ | `npm run lint` | ESLint + Prettier |
| backend/ | `npm run dev` | 启动后端（热重载） |
| backend/ | `npm run build` | 编译 TypeScript |
| backend/ | `npm start` | 运行生产版本 |
| backend/ | `npm run init-db` | 初始化数据库 |
| backend/ | `npm run lint` | ESLint 检查 |
| 根目录 | `./deploy.sh deploy` | 完整部署 |
| 根目录 | `./deploy.sh start` | 启动服务 |
| 根目录 | `./deploy.sh status` | 查看状态 |

---

## 生产部署（PM2 + Nginx）

### 1. 使用部署脚本

```bash
# 开发环境部署（默认）
./deploy.sh deploy

# 生产环境部署
./deploy.sh deploy --prod

# 测试环境部署
./deploy.sh deploy --test

# 分步执行（带环境参数）
./deploy.sh install           # 安装依赖
./deploy.sh build --prod      # 生产环境构建
./deploy.sh init-db           # 初始化数据库
./deploy.sh start --prod      # 生产环境启动
./deploy.sh restart --prod    # 重启生产环境
./deploy.sh status            # 查看状态
./deploy.sh logs              # 查看日志
```

**环境参数：**
- `--dev` / `--development` - 开发环境（默认）
- `--test` - 测试环境（端口 3001）
- `--prod` / `--production` - 生产环境

### 2. 配置 Nginx

```bash
# 复制配置模板
sudo cp nginx/moonshot-library.conf /etc/nginx/sites-available/

# 编辑配置，修改域名和路径
sudo nano /etc/nginx/sites-available/moonshot-library.conf

# 创建软链接
sudo ln -s /etc/nginx/sites-available/moonshot-library.conf /etc/nginx/sites-enabled/

# 测试并重载
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置 SSL（推荐 Certbot）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 4. PM2 管理

```bash
pm2 list              # 查看进程
pm2 logs              # 查看日志
pm2 restart all       # 重启所有
pm2 stop all          # 停止所有
pm2 save              # 保存进程列表
pm2 startup           # 设置开机自启
```

---

## 用户角色

| 角色 | 说明 |
|------|------|
| student | 学生 - 浏览图书、借阅 |
| teacher | 教师 - 浏览图书、借阅 |
| librarian | 图书管理员 - 管理图书、用户、借阅 |

---

## 文档

- **API 文档**：`backend/API_DOCUMENTATION.md`
- **开发规范**：`Documentation/README-BEFORE-DEV-CN.md`
- **M365 SSO 配置**：`Documentation/M365_AUTH_SETUP.md`

---

## 常见问题

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173

# 或修改配置使用其他端口
```

### CORS 错误

确保 `backend/.env` 中的 `FRONTEND_URL` 与前端实际地址一致。

### 数据库问题

```bash
# 重新初始化数据库
cd backend
rm -rf database/library.db
npm run init-db
```

### SSO 登录失败

1. 检查 `MSAL_REDIRECT_URI` 是否与 Azure 门户配置一致
2. 确保 `FRONTEND_URL` 与实际访问地址一致
3. 查看后端日志获取详细错误信息

---

## 贡献指南

1. Fork → 创建分支 → 开发
2. 运行 `npm run lint` 和 `npm run type-check`
3. 提交 PR 并附上变更说明

---

## License

MIT License

---

欢迎把 Moonshot Library 部署到校园环境继续打磨！ 🚀
