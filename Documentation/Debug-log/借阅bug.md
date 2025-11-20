**复盘日志：重复借阅 Bug 修复**

- **起因**
  - 学生和老师分别在两个浏览器登录，学生借出一本书后，老师界面仍显示“可借阅”，还能再次借走同一本书。
  - 核查发现：前端 libraryStore 登录切换后未重新拉取最新图书/借阅状态；后端也缺少基于 status 的并发保护，借阅接口只依赖可用副本数，没有及时同步 status。
- **诊断步骤**
  1. 本地模拟双浏览器，确认数据库 available_copies 已减少，却因前端缓存/后端逻辑差异导致页面仍显示 available。
  2. 查看后端 updateBookAvailability & createBorrowing，发现 status 未根据副本数量更新，且新增借阅只检查“同一个用户”而非“所有用户”。
  3. 检查 App.vue、libraryStore，登录切换时未刷新 store 数据，导致老师端沿用学生时代的缓存。
- **修复措施**
  1. App.vue 监听 authStore.user?.id，切换账号或登出都强制调用 libraryStore.fetchBooks(true)/fetchBorrowings(true)，刷新前端缓存。
  2. libraryStore.borrowBook 增加本地 status 检查与借阅前的刷新，避免重复请求。
  3. 后端 createBorrowing 取消老的 userId 传参校验，自动取 req.user.id，并将“不可借”判断收敛于 book.status !== 'available'。
  4. updateBookAvailability 读取当前图书，按剩余副本数实时更新 available_copies + status（满 -> available，部分/为零 -> borrowed，维护状态保持不变）。
  5. 前后端重新构建验证 (npm --prefix server run build、npm run build)。
- **结果与验证**
  - 学生借书后，老师端刷新即看到状态变为“借出”，借阅按钮也会收到 “Book is not available for borrowing” 提示。
  - 相同账号在不同浏览器操作，也会因前端 watch + store 刷新而一致显示库存状态。
  - 构建通过，验证用例符合预期。
- **经验与建议**
  - 面向多终端/多账号场景，前端状态切换时必须强制刷新缓存；后端状态字段要么保持一致的业务语义，要么干脆提供更严谨的库存判断。
  - 可在后续增加 WebSocket 或 SSE 推送，减少依赖手动刷新带来的延迟，进一步提升一致性体验。
