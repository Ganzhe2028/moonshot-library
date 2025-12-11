# 收藏与信用功能说明

## 后端接口
- 收藏
  - `GET /api/users/:id/favorites`：返回指定用户收藏列表（本人或管理员/图书管理员访问）。
  - `POST /api/users/:id/favorites`，body `{ bookId }`：加入收藏；已存在时返回 400。
  - `DELETE /api/users/:id/favorites/:bookId`：取消收藏。
- 信用
  - 评分区间 0–100，默认 80；等级从分数推导：`>=90 优秀 / >=70 良好 / >=50 关注 / 其他 暂停`，状态由等级派生（暂停→restricted，其余 active）。
  - `GET /api/users/:id/credit`：返回用户信用分、等级、状态（本人或管理员/图书管理员）。
  - `PUT /api/users/:id/credit`，body `{ score?, remarks? }`：仅管理员/图书管理员；只能改分数/备注，等级与状态自动随分数更新。
  - 自动恢复：每满 3 天恢复 10 分，上限 100，访问信用时触发（字段 `last_recovered_at`）。
  - 业务限制：分数 <50 禁止借阅；分数 <70 禁止续借。

## 前端实现
- 收藏
  - 服务：`frontend/src/services/favoriteService.ts`。
  - 状态：Pinia `libraryStore` `favorites`，actions `fetchFavorites/addFavorite/removeFavorite`。
  - UI：书籍详情页收藏按钮（登录可见）；“我的借阅”显示收藏列表并支持取消。
- 信用
  - 服务：`frontend/src/services/creditService.ts`。
  - 状态：Pinia `libraryStore` `credit`，`fetchCredit` 在用户变化时加载。
  - UI：MyBorrowings 展示信用分/等级/状态；管理员在 `/admin/users` 可通过“编辑信用”弹窗修改分数（等级/状态只读，跟随分数变化）。

## 注意事项
- 重建数据库会清空收藏和信用数据，需重新登录或添加收藏；信用默认 80 分，访问接口会按恢复规则更新。
- 借阅/续借限制在后端强制；若需在前端按钮也禁用，可参考 `credit.score` 判定（<50 禁借阅/评分/评论，<70 禁续借）。***
