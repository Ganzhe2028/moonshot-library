This file is for developers and AI assistants to keep outputs consistent, maintainable, and safe.

---

## 0. Core principles
- Read this file first; ask when unsure.
- Keep scope tight; avoid “drive-by” refactors.
- Self-check: run lint/type-check/tests; if you can’t, state why.
- Don’t change unrelated issues silently; leave TODO/notes.
- Never commit secrets; use `.env` and keep `.env.example` updated.

---

## 1–13 (Brief)
- Frontend: Vue 3 + TS + Pinia; use shared design tokens; i18n all new strings.
- Backend: Express + TS + SQLite; validation via express-validator; auth/roles via middleware; errors via AppError handler; keep `{ success, message, data }`.
- Types/contracts: sync shared types and docs when APIs change.
- Security: validate input, avoid logging secrets, respect CORS/rate limits, etc.
- DB/migrations: schema changes need migrations/notes even on SQLite; seed scripts live in `src/scripts`.
- Tests: at minimum lint + type-check; add tests for changed logic.
- Docs: update relevant docs when adding APIs/flows/env vars.

---

## 14. Favorites & Credit (new)
- Favorites API: `GET/POST /api/users/:id/favorites`, `DELETE /api/users/:id/favorites/:bookId`; accessible by the user or admin/librarian.
- Credit API: `GET /api/users/:id/credit` (self/admin/librarian), `PUT /api/users/:id/credit` (admin/librarian only). Only `score` (0–100) and `remarks` are editable; level/status are derived from score (≥90 excellent, ≥70 good, ≥50 warn, else suspended). Default score 80; auto-recovery +10 every 3 days on access, capped at 100.
- Business rules: score <50 blocks borrowing/rating/comment; score <70 blocks renew; backend enforces borrow/renew restrictions—mirror on the frontend if needed.
- Frontend usage: favorites via `favoriteService` + `libraryStore` (`fetch/add/remove`); credit via `creditService` + `libraryStore.credit` (loaded on auth change). Admin users page includes “Edit credit” modal for score edits; MyBorrowings shows credit badge/state.

---

## 15. UI Handoff & Alignment (new)
- Handoff checklist + spec template: `Documentation/UI-HANDOFF-EN.md` (CN: `Documentation/UI-HANDOFF-CN.md`).
- Alignment tokens/utilities: `frontend/src/assets/main.css` (use `u-stack`, `u-inline`, `u-center`, etc.).
- Minimum acceptance: layout uses global utilities, responsive breakpoints verified, loading/empty/error/disabled states covered, data mapping confirmed, and i18n strings in language files.
