# 配置测试指南

本文档提供了如何测试我们优化的Nginx反向代理配置和前端API调用配置的步骤。

## 开发环境测试

### 1. 启动后端服务
确保后端服务正在本地的3000端口运行。

### 2. 启动前端开发服务器
```bash
cd frontend
npm install
npm run dev
```

### 3. 验证API调用
- 打开浏览器，访问前端开发服务器URL（通常是 http://localhost:5173）
- 打开浏览器的开发者工具（F12）
- 切换到网络（Network）选项卡
- 执行需要API调用的操作（如登录、查看书籍等）
- 确认所有API请求都指向 `/api/...` 而不是 `http://localhost:3000/api/...`
- 确认请求状态为200（成功）

## 生产环境测试

### 1. 构建Docker镜像
```bash
cd frontend
docker build -t moonshot-library-frontend .
```

### 2. 使用Docker Compose启动
确保docker-compose.yml文件中包含正确的服务配置，然后运行：
```bash
cd ..
docker-compose up -d
```

### 3. 验证部署
- 打开浏览器，访问部署的网站（根据您的服务器配置，可能是 https://your-domain.com 或 https://your-server-ip）
- 打开浏览器的开发者工具
- 切换到网络选项卡
- 执行需要API调用的操作
- 确认所有API请求都指向相对路径 `/api/...`
- 确认请求状态为200（成功）
- 验证页面功能正常工作

## 常见问题排查

### 1. API请求失败
- 检查Nginx日志：`docker logs moonshot-library-frontend`
- 确认后端服务正在运行且可从前端容器访问
- 验证Docker网络配置，确保前后端容器在同一网络中

### 2. 跨域问题
- 检查后端CORS配置，确保允许前端域名访问
- 验证Nginx代理配置中的头部设置是否正确

### 3. 静态资源加载问题
- 确认Nginx配置中的静态文件路径正确
- 验证构建产物是否正确复制到Nginx容器中

## 回滚方案
如果测试失败，可以回滚到之前的配置：

1. 恢复前端服务文件中的API_BASE_URL设置
2. 恢复.env文件中的VITE_API_BASE_URL配置
3. 恢复Dockerfile中的动态Nginx配置生成
4. 重新构建和部署

---

通过这些测试步骤，您可以确保我们的优化配置在开发和生产环境中都能正常工作，解决了之前请求指向localhost:3000的问题。