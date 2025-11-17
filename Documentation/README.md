# Moonshot Library 前端（Vue 3）快速开始

本文件聚焦前端（仓库根目录）开发者需要知道的最小知识集合，适用于刚接触 Vite + Vue 3 + TypeScript 的同学。

---

## 1. 环境要求

- **Node.js 20.19+**（或 22.12+），建议使用 [nvm](https://github.com/nvm-sh/nvm) 切换版本
- **npm 10+**（Node 安装时自带）
- 推荐 IDE：VS Code + [Volar 官方插件](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（记得禁用旧版 Vetur）
- 浏览器调试：安装 [Vue Devtools](https://devtools.vuejs.org/) 以便检查组件状态

---

## 2. 项目安装与运行

```bash
# 安装依赖
npm install

# 开发模式（默认 http://localhost:5173）
npm run dev

# TypeScript 检查
npm run type-check

# 生产构建（输出到 dist/）
npm run build

# 本地预览构建结果
npm run preview

# 代码风格（ESLint + Prettier）
npm run lint
npm run format
```

> 💡 Vite 会在终端输出可访问地址。若端口被占用，可通过 `npm run dev -- --port 5174` 临时修改。

---

## 3. 代码结构导览

```
src/
├── main.ts           # 应用入口，注册路由/状态管理
├── App.vue           # 根组件
├── router/           # Vue Router 配置
├── stores/           # Pinia 状态（如用户信息、借阅列表）
├── services/         # 调用后端 API 的封装
├── pages/            # 具体页面（Dashboard、Books、Borrowings 等）
├── components/       # 可复用 UI 组件
├── types/            # TypeScript 类型定义
└── data/             # 静态数据或模拟数据
```

建议新手优先阅读 `router/index.ts` 和 `services/`，可以帮助理解页面是如何串联到后端 API 的。

---

## 4. 与后端交互

- 默认后端地址：`http://localhost:3000`，可在 `services/http.ts`（如果存在）或 `.env`/配置文件中修改。
- 若需要登录，先确保 `server/` 端已启动并初始化数据库（参见根目录 `readme.md`）。
- 前端请求会携带 JWT（通常来自 Pinia store）；若收到 401，可检查：
  1. 后端 `.env` 的 `FRONTEND_URL` 是否与 Vite 启动地址一致；
  2. 浏览器的本地存储中是否存在过期 token。

---

## 5. 常见问题

- **TS/ESLint 报错 Lint failed**  
  运行 `npm run lint -- --no-cache` 获取更详细的提示，必要时执行 `npm run format`。

- **接口 404/500**  
  多半是后台未开启或未初始化数据库；进入 `server/` 执行 `npm run init-db && npm run dev`。

- **跨域错误（CORS）**  
  后端 `.env` 中 `FRONTEND_URL` 必须指向当前前端地址，修改后重启后端。

- **Devtools 没有组件树**  
  检查浏览器是否安装 Vue Devtools，并在 devtools 设置中勾选“Enable custom formatters”。

---

## 6. 进阶建议

1. 阅读 `src/services` 中的请求封装，尝试添加一个新的 API 方法并在页面中调用它。
2. 查看 `src/stores`，理解如何通过 Pinia 管理登录状态和全局数据。
3. 使用组件库前，先在 `components/` 里复用已有组件，保持样式一致性。
4. 结合 `npm run type-check` 查找潜在的类型问题，培养良好的 TS 思维。

> 更多整体介绍、后端脚本或测试说明，请返回根目录阅读完整的 `readme.md`。
