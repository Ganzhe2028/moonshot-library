# Microsoft 365 SSO 登录功能配置指南

本文档详细说明如何在 Moonshot Library 系统中配置和使用 Microsoft 365 单点登录(SSO)功能。

## 功能概述

Microsoft 365 SSO 登录功能允许用户使用其 Microsoft 账户（如 Outlook.com、Office 365 等）快速登录到图书管理系统，无需创建新账户。系统会自动同步用户信息并维护会话状态。

## 环境要求

- Node.js >= 16.0.0
- 前端：Vue 3 + TypeScript
- 后端：Express + TypeScript
- Microsoft Azure 账户（用于配置 OAuth 应用程序，开发模式可跳过）

## 配置步骤

### 0. 配置检查清单

在开始配置之前，请确认以下信息：

- [ ] 前端实际运行的地址和端口（例如：`http://localhost:5173` 或 `http://localhost:5174`）
- [ ] 后端实际运行的地址和端口（例如：`http://localhost:3000`）

**重要配置说明**：
- `MSAL_REDIRECT_URI` = 后端地址（Microsoft 重定向到这里）
- `FRONTEND_URL` = 前端地址（后端重定向到这里）

### 1. 配置环境变量

#### 前端环境变量

在项目根目录创建 `.env` 文件，添加以下配置：

```env
# 启用 M365 SSO 登录功能（可选，用于控制UI显示）
VITE_ENABLE_M365_SSO=true

# 前端应用名称
VITE_APP_NAME="Moonshot Library"

# 后端 API 基础 URL
VITE_API_BASE_URL="http://localhost:3000/api"

# 注意：前端不需要配置 MSAL_REDIRECT_URI，因为使用后端重定向模式
```

#### 后端环境变量

在 `server` 目录创建 `.env` 文件，添加以下配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 前端 URL（用于 CORS 和重定向到前端）
# ⚠️ 重要：必须与前端实际运行的地址和端口一致
# 如果前端运行在 http://localhost:5173，则设置为 http://localhost:5173
# 如果前端运行在 http://localhost:5174，则设置为 http://localhost:5174
FRONTEND_URL="http://localhost:5173"

# Microsoft 365 OAuth 配置
MSAL_CLIENT_ID="your-client-id"
MSAL_CLIENT_SECRET="your-client-secret"
MSAL_TENANT_ID="your-tenant-id"
MSAL_AUTHORITY="https://login.microsoftonline.com/common"

# Microsoft OAuth 回调地址（后端地址）
# ⚠️ 重要：这是 Microsoft 重定向到后端的地址，必须是后端地址
# 必须与 Azure 门户中配置的重定向 URI 完全一致
MSAL_REDIRECT_URI="http://localhost:3000/api/auth/msal/callback"

# 登出后重定向地址（前端地址）
MSAL_POST_LOGOUT_REDIRECT_URI="http://localhost:5173"
MSAL_SCOPES="user.read,email,profile,openid"

# JWT 配置
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# 数据库配置
DATABASE_PATH="./data/library.db"
```

### 2. 开发模式配置

在开发环境中，系统会自动检测配置并在缺少有效凭据时启用模拟模式，无需真实的 Microsoft 365 应用程序配置：

- 系统会使用模拟用户数据进行登录测试
- 生成的 URL 和令牌都是模拟的，仅用于前端功能测试

### 3. 生产环境配置（可选）

要在生产环境中启用真实的 Microsoft 365 登录：

1. 在 [Azure 门户](https://portal.azure.com/) 创建一个应用程序注册
2. 获取客户端 ID 和客户端密钥
3. **重要**：在 Azure 门户中配置重定向 URI 为**后端地址**：
   - 开发环境：`http://localhost:3000/api/auth/msal/callback`
   - 生产环境：`https://your-backend-domain.com/api/auth/msal/callback`
4. 更新后端 `.env` 文件中的相关配置：
   - `MSAL_CLIENT_ID`: Azure 应用注册的客户端 ID
   - `MSAL_CLIENT_SECRET`: Azure 应用注册的客户端密钥
   - `MSAL_REDIRECT_URI`: 必须与 Azure 门户中配置的重定向 URI 完全一致
   - `FRONTEND_URL`: 前端应用地址（用于回调重定向）

## 使用说明

### 用户登录流程（后端重定向模式）

系统使用**后端重定向模式**来确保前后端重定向 URI 的一致性：

1. 用户在登录页面点击 "通过Microsoft登录" 按钮
2. 前端调用后端 API (`/api/auth/msal/login`) 获取 Microsoft 登录 URL
3. 浏览器重定向到 Microsoft 登录页面
4. 用户输入 Microsoft 账户凭据并授权
5. Microsoft 重定向到**后端回调地址** (`/api/auth/msal/callback`)
6. 后端处理回调，生成 JWT token，然后重定向到**前端页面** (`/auth/callback?token=...&refreshToken=...`)
7. 前端接收 token，调用 `/api/auth/me` 获取用户信息，完成登录
8. 用户被重定向到目标页面

**重要提示**：
- 后端 `MSAL_REDIRECT_URI` 必须配置为后端地址：`http://localhost:3000/api/auth/msal/callback`
- 在 Azure 门户中配置的重定向 URI 也必须与后端地址一致
- 前端不需要配置 `VITE_MSAL_REDIRECT_URI`（如果使用后端重定向模式）

### 开发模式下的测试

在开发模式下，系统会自动使用模拟数据，登录流程将简化为：
1. 点击 Microsoft 登录按钮
2. 系统会自动模拟登录成功并重定向到后端回调
3. 后端处理模拟回调，生成 token 并重定向回前端
4. 登录状态将使用模拟用户信息设置

## 代码结构说明

### 前端实现

- **`src/services/authService.ts`**: 处理与后端的认证通信，包括获取 M365 登录 URL 和处理回调
- **`src/services/msalService.ts`**: Microsoft 365 客户端认证逻辑（主要用于 popup 模式，当前使用后端重定向模式）
- **`src/stores/auth.ts`**: Pinia store，管理认证状态和登录方法
- **`src/App.vue`**: 处理后端重定向回来的 token，调用 `/api/auth/me` 获取用户信息
- **`src/pages/LoginPage.vue`**: 登录界面，包含 M365 登录按钮，调用后端 API 获取登录 URL

### 后端实现

- **`server/src/utils/msalService.ts`**: 处理 Microsoft 365 OAuth 认证、生成登录 URL、处理回调、令牌验证和用户信息提取
- **`server/src/utils/auth.ts`**: 处理 JWT 令牌生成和验证
- **`server/src/controllers/authController.ts`**: 处理认证相关的 API 请求
  - `msalLogin`: 生成 Microsoft 登录 URL
  - `msalCallback`: 处理 Microsoft OAuth 回调，生成 JWT token 并重定向到前端
  - `getCurrentUser`: 获取当前用户信息（用于前端回调后获取用户详情）
- **`server/src/models/user.ts`**: 包含 `createUserFromMicrosoft` 方法，用于创建或更新 Microsoft 用户

## 错误处理

系统实现了以下错误处理机制：

1. 无效的 OAuth 配置时自动切换到开发模式
2. 登录失败时的错误信息显示和重定向
3. 令牌过期时的会话管理
4. 网络错误和服务不可用的提示

## 安全考虑

1. 所有敏感凭据都通过环境变量配置，不硬编码在代码中
2. 用户信息在存储前进行必要的验证和处理
3. 模拟模式仅在开发环境下启用
4. 实现了适当的会话管理和令牌过期机制

## 故障排除

### 常见问题

1. **登录按钮未显示**: 确认前端 `.env` 文件中 `VITE_ENABLE_M365_SSO` 设置为 `true`

2. **登录重定向失败**: 
   - 检查后端 `MSAL_REDIRECT_URI` 配置是否正确
   - **确保与 Azure 门户中配置的重定向 URI 完全一致**（包括协议、域名、端口和路径）
   - 后端 `MSAL_REDIRECT_URI` 应该是后端地址，不是前端地址
   - 例如：`http://localhost:3000/api/auth/msal/callback`（开发环境）

3. **重定向到错误的端口**（如 `http://localhost:5174/auth/callback`）:
   - 检查后端 `.env` 文件中的 `FRONTEND_URL` 配置
   - `FRONTEND_URL` 必须与前端实际运行的地址和端口完全一致
   - 如果前端运行在 `http://localhost:5173`，则 `FRONTEND_URL` 应该设置为 `http://localhost:5173`
   - 如果前端运行在 `http://localhost:5174`，则 `FRONTEND_URL` 应该设置为 `http://localhost:5174`
   - **配置说明**：
     - `MSAL_REDIRECT_URI`: Microsoft → 后端（必须是后端地址）
     - `FRONTEND_URL`: 后端 → 前端（必须是前端地址）

4. **用户信息未同步**: 验证数据库连接是否正常，检查 `createUserFromMicrosoft` 方法是否正常工作

5. **开发模式问题**: 确认 `NODE_ENV` 设置为 `development`，系统将自动启用模拟功能

---

## 许可证

Moonshot Library - Microsoft 365 SSO 集成