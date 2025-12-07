# 测试指南

本文档说明如何测试 Moonshot Library 前后端功能。

## 开发环境测试

### 1. 启动后端服务

```bash
cd backend
npm install
npm run init-db    # 首次运行需要初始化数据库
npm run dev        # http://localhost:3000
```

### 2. 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 3. 验证 API 调用

- 打开浏览器，访问 http://localhost:5173
- 打开浏览器开发者工具（F12）
- 切换到网络（Network）选项卡
- 执行 API 操作（登录、查看图书等）
- 确认 API 请求指向 `/api/...`（通过 Vite 代理到后端）
- 确认请求状态为 200

### 4. 运行代码检查

```bash
# 前端
cd frontend
npm run type-check    # TypeScript 检查
npm run lint          # ESLint 检查

# 后端
cd backend
npm run lint          # ESLint 检查
```

## 生产环境测试

### 1. 构建项目

```bash
# 使用部署脚本
./deploy.sh build

# 或手动构建
cd frontend && npm run build
cd backend && npm run build
```

### 2. 启动服务

```bash
# 使用 PM2 启动
./deploy.sh start

# 查看状态
pm2 list
pm2 logs moonshot-backend
```

### 3. 配置 Nginx 并验证

参考 `nginx/moonshot-library.conf` 配置 Nginx，然后：

- 访问配置的域名
- 打开开发者工具检查 API 请求
- 验证页面功能正常

## 常见问题排查

### API 请求失败

1. 检查后端是否运行：`pm2 list`
2. 查看后端日志：`pm2 logs moonshot-backend`
3. 确认端口未被占用：`lsof -i :3000`

### CORS 问题

检查 `backend/.env` 中的 `FRONTEND_URL` 是否与实际前端地址一致。

### 数据库问题

```bash
cd backend
rm -rf database/library.db
npm run init-db
```

### SSO 登录问题

1. 检查 `MSAL_REDIRECT_URI` 配置
2. 确认 Azure 门户中的重定向 URI 配置正确
3. 查看后端日志中的 MSAL 相关错误
