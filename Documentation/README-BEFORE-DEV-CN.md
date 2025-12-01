本文件为开发者与 AI 代码助手提供统一规则，确保 Moonshot Library 项目的代码输出一致、可维护且安全。

---

## 0. 核心原则
- 开发前先读本文件；有疑问先确认，不要猜。
- 控制变更范围：只改任务相关内容，避免“顺手”重构。
- 自检：提交前跑 lint、type-check、相关测试；无法跑测试要说明原因。
- 发现与任务无关的问题，记录 TODO/issue，不要悄悄改。
- 绝不提交密钥/证书；机密放 `.env`，并同步 `.env.example`。

---

## 1. 仓库结构
- `frontend/`：Vue 3 + Vite + TS（UI、路由、状态、服务）。
- `backend/`：Express + TS + SQLite（API、鉴权、数据、脚本）。
- 根目录：项目级脚本、Docker/Compose，设计/复盘文档在 `Documentation/`。

---

## 2. 环境与依赖
- Node 20+，前后端各自 `npm install`。
- `.env` 存机密，`.env.example` 保持最新并写注释。
- Docker 构建上下文：前端 `./frontend`，后端 `./backend`，数据库卷 `./backend/database`。

---

## 3. 分支与提交
- 分支：`feat/<scope>`、`fix/<scope>`、`chore/<scope>`、`docs/<scope>`。
- 提交：动词 + 范围 + 结果（例：`fix(auth): handle refresh token validation`）。
- 不提交无关文件与构建产物。

---

## 4. 前端规范（frontend/）
- 技术：Vue 3 SFC + TS，优先 `<script setup>`。
- 状态：Pinia，跨页状态放 store，避免深层 props 传递。
- 路由：统一在 `src/router` 定义 meta（鉴权/角色），路由懒加载，滚动置顶。
- HTTP：统一 axios 实例 + 拦截器（token、401 刷新、全局错误），组件内不重复实现。
- 组件：区分展示/容器，复用基础组件与设计 tokens（间距/色板/字体）。
- 表单校验：用 `vee-validate`/`zod`（或现有方案），避免零散正则。
- I18n：新文案写入语言包，使用参数占位，不要硬编码。
- 可访问性：语义标签、label/aria、可键盘操作。
- 性能：长列表分页/虚拟滚动；避免模板中新建函数/对象；图片懒加载；共享逻辑抽成 composable。
- 测试：核心逻辑补 Vitest/组件测试；至少保证 `npm run type-check`、`npm run lint` 通过。

---

## 5. 后端规范（backend/）
- TS 严格模式，共享类型放 `src/types`。
- 分层：路由 → 控制器（解析/校验、调用服务） → 服务/用例（规则、事务） → 仓储（DB）；不要在路由/控制器写 SQL。
- 校验：统一校验库（现为 express-validator），校验失败返回清晰错误码/信息。
- 鉴权/授权：JWT/刷新/Session 逻辑一致；角色用中间件检查；不要绕过 auth。
- 事务与一致性：库存/借阅写操作必须事务；多次更新保持原子性。
- 错误：使用 AppError/ValidationError/NotFoundError，全局 error handler 统一返回。
- 日志：用既有 logger/morgan，包含请求 id/用户 id/关键字段；清理多余 console.log。
- 契约：变更响应/字段需同步 OpenAPI/文档并通知前端；保持 `{ success, message, data }`。
- 安全：输入校验与收敛；上传限类型/大小；速率限制开启；CORS 由环境变量控制。
- 脚本：放 `src/scripts`，可 ts-node/编译后直接跑；一次性迁移脚本需标注。
- 测试：改动核心逻辑需补/更新测试（鉴权、借阅、库存）；至少跑 `npm run lint` 与相关测试。

---

## 6. API 契约与共享类型
- 后端接口变更 → 同步前端类型/客户端（OpenAPI 或 shared types）。
- 角色/错误码/业务枚举集中管理，避免多处硬编码。
- 文案：用户可读、简洁；前端区分用户提示与调试信息。

---

## 7. 配置与机密
- 机密仅在 `.env`，不提交；`.env.example` 要准确并注明用途。
- Docker/Compose 通过环境变量传参，不硬编码密钥。
- 不提交证书/备份；如需示例，用占位文件并说明。

---

## 8. 数据库与迁移
- 表结构变更需迁移脚本（即使 SQLite），写明版本与回滚策略。
- 高频查询加索引，变更后评估影响。
- 种子数据放 `src/scripts`，区分开发/测试/演示，避免污染生产。

---

## 9. 测试与质量
- 最低要求：lint + type-check 通过。
- 后端：覆盖登录/借阅/续借/归还及改动的接口。
- 前端：复杂组件/逻辑要测试；验证路由守卫、鉴权状态、错误提示。
- 无法跑测试时，在提交/说明中写清原因与风险。

---

## 10. 文档与可读性
- 代码自解释优先；仅在复杂逻辑前写短注释说明“为什么/假设/边界”。
- 新增接口/流程时更新相关文档：后端 API、前端使用说明、环境变量说明。
- 文档中的路径/命令必须与现目录结构一致。

---

## 11. 面向 AI Agent 的附加约束
- 遵循现有模式，不自创架构/大规模重命名。
- 不改动不相关逻辑；超出范围的疑似问题记 TODO 或备注。
- 变更后简要写明改动与验证情况；未验证要说明。
- 业务不确定时请求澄清或加显式 TODO，不要编造。
- 遵守 `.gitignore`，不引入大体积/二进制。

---

## 12. 安全与隐私
- 输入校验、输出编码，防注入/XSS/CSRF。
- 认证信息：遵循既定 token/refresh/cookie 策略，避免在 localStorage 长期存密钥；实现过期/吊销。
- 日志脱敏：不记录密码、token、敏感身份。
- 上传/下载：限制 MIME/大小，存储路径不可被用户控制。

---

## 13. 发布与运维
- Compose 入口在根目录，构建上下文 `backend`/`frontend`，数据库卷 `./backend/database`。
- 健康检查：后端 `/health`；如改路径同步 compose/脚本。
- 备份：SQLite 备份目录 `backend/database/backups`，保持权限；生产需保留策略。

---

遵守以上约定，可最大限度减少不同开发者与 AI 模型的风格偏差，降低回归风险，提高协作效率。 
