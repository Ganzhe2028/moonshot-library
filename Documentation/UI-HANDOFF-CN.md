# UI 交付与对齐流程

## 1. 目标
- 统一设计与前端交付方式，避免页面对齐/布局规则分散。
- 明确交付范围、状态与验收标准，减少返工。

## 2. 适用范围
- 新页面/新模块/跨页面改版。
- 对齐规范或交互规则出现明显漂移时。

## 3. 交付流程
1. 需求确认：明确范围、目标用户、关键路径与限制。
2. 设计交付：提供设计稿、组件状态、交互说明与数据映射。
3. 前端落地：使用全局 tokens 与布局工具类统一对齐。
4. 联合验收：对照交付清单与验收项逐条核对。

## 4. 交付清单（必须）
- 需求范围：页面/模块边界、功能范围、排除项。
- 设计产物：Figma 链接、标注、切图/图标、交互原型。
- 组件状态：默认/悬停/禁用/错误/加载/空状态。
- 响应式：断点与布局变化规则。
- 数据字段映射：字段来源、格式、空值/异常展示。
- 交互/动效：触发条件、时长、缓动、反馈提示。
- 验收标准：视觉一致性、功能可用性、数据正确性。

## 5. 状态/异常规范
- 必备状态：loading、empty、error、disabled、no-permission。
- 异常说明：触发条件、文案、回退样式、截图示例（如有）。

## 6. 响应式断点（默认）
- >=1200px：Desktop
- 900–1199px：Tablet
- <900px：Mobile
- <600px：Small mobile

> 如需调整断点必须在交付文档中说明。

## 7. 数据字段映射（模板）
| 字段 | 来源 | 格式/单位 | 空值/异常处理 | 备注 |
| --- | --- | --- | --- | --- |
| title | API.book.title | string | 显示“暂无” | i18n 同步 |

## 8. 交互/动效（模板）
- 触发条件：点击/滚动/加载完成
- 动效类型：淡入/位移/骨架屏
- 时长与缓动：200–350ms，ease-out
- 反馈：成功/失败提示样式与文案

## 9. 对齐/布局规范（必须遵守）
- 全局 tokens 与工具类在 `frontend/src/assets/main.css`。
- 统一使用以下工具类完成对齐/布局：
  - `u-stack` / `u-stack-sm` / `u-stack-lg`
  - `u-inline` / `u-inline-sm` / `u-inline-md` / `u-inline-lg` / `u-inline-xl`
  - `u-center` / `u-center-x` / `u-center-y`
  - `u-split` / `u-wrap` / `u-grid`
- 避免在单个页面内重复定义 `display: flex/grid` 与对齐规则；优先复用工具类。

示例：
```html
<div class="u-stack u-stack-lg">
  <section class="u-stack-sm">
    <h1>Title</h1>
    <p>Subtitle</p>
  </section>
  <div class="u-inline u-inline-lg u-wrap">
    <button>Primary</button>
    <button>Secondary</button>
  </div>
</div>
```

## 10. 验收标准（最小项）
- 对齐：关键布局使用全局工具类，无私有对齐漂移。
- 响应式：断点下无溢出/错位。
- 状态：loading/empty/error/disabled 可验证。
- 数据：字段映射与格式正确，空值处理明确。
- i18n：无硬编码文案；中英文都可用。

## 11. 规范模板（交付时填写）
- 范围：
- 设计产物链接：
- 状态/异常说明：
- 响应式断点：
- 数据字段映射：
- 交互/动效：
- 验收标准：
