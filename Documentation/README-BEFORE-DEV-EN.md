This document defines shared rules for developers and AI code assistants to keep output consistent, maintainable, and safe across the Moonshot Library project.

---

## 0. Core Principles
- Read this before coding; ask when unsure, do not guess.
- Keep scope tight: change only what the task requires; no drive-by refactors.
- Self-check after edits: lint, type-check, and relevant tests. If tests can’t run, say why.
- Log unrelated findings as TODO/issue; do not silently change out-of-scope logic.
- Never commit secrets/certs; use env vars and update `.env.example` accordingly.

---

## 1. Repo Layout
- `frontend/`: Vue 3 + Vite + TS (UI, router, state, services).
- `backend/`: Express + TS + SQLite (API, auth, data, scripts).
- Root: project-level scripts, Docker/Compose, design/review docs in `Documentation/`.

---

## 2. Environment & Dependencies
- Node 20+ for both ends; install deps per directory (`npm install` in frontend/backend).
- `.env` holds secrets; `.env.example` stays current with comments.
- Docker contexts: frontend `./frontend`, backend `./backend`, DB volume `./backend/database`.

---

## 3. Branch & Commits
- Branch: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`.
- Commit message: verb + scope + result (e.g., `fix(auth): handle refresh token validation`).
- Don’t include unrelated files; don’t commit build artifacts.

---

## 4. Frontend Standards (frontend/)
- Stack: Vue 3 SFC + TS, prefer `<script setup>`.
- State: Pinia; cross-page state in stores, avoid deep prop chains.
- Router: define meta (auth/role) centrally, lazy load routes, scroll to top.
- HTTP: single axios instance + interceptors for token, 401 refresh, global errors; components shouldn’t duplicate.
- Components: separate presentational vs container; reuse base components and design tokens (spacing/color/typography).
- Forms/validation: use `vee-validate`/`zod` (or current solution), avoid ad-hoc regex.
- I18n: add strings to language files, not inline literals; use params for placeholders.
- Accessibility: semantic elements, labels/aria, keyboard navigable.
- Performance: paginate/virtualize lists, avoid new fns/objs in templates, lazy-load images, use composables for shared logic.
- Tests: for core logic add Vitest/component tests; at minimum `npm run type-check` and `npm run lint`.

---

## 5. Backend Standards (backend/)
- TS strict; shared types in `src/types`.
- Layering: route → controller (parse/validate, call service) → service/use-case (rules, transactions) → repository (DB). No SQL in routes/controllers.
- Validation: unified validator (current express-validator). Return clear codes/messages on failure.
- AuthZ: consistent JWT/refresh/session handling; roles enforced via middleware; do not bypass auth.
- Transactions/consistency: inventory/borrowing writes must be transactional; keep multi-update operations atomic.
- Errors: use AppError/ValidationError/NotFoundError; let global error handler respond.
- Logging: use existing logger/morgan; include request id/user id/key fields; remove stray console logs.
- API contract: changing response/fields requires updating OpenAPI/docs and notifying frontend; keep `{ success, message, data }`.
- Security: validate/trim inputs, limit upload type/size, rate-limit on, CORS via env allowlist.
- Scripts: place in `src/scripts`, runnable via ts-node/compiled; one-off migrations clearly labeled.
- Tests: update/add tests for core flows (auth, borrowing, inventory). Run `npm run lint` and relevant tests.

---

## 6. API Contract & Shared Types
- Backend changes → sync frontend types/client (OpenAPI or shared types).
- Centralize roles/error codes/enums; avoid scattered string literals.
- Messages: user-facing, concise; distinguish user messages from debug info.

---

## 7. Config & Secrets
- Secrets only in `.env`, never committed; keep `.env.example` accurate with notes.
- Docker/Compose use env vars, no hardcoded secrets.
- Don’t commit certs/backups; use placeholders if examples are needed.

---

## 8. Database & Migrations
- Schema changes need migration scripts (even on SQLite) with version and rollback notes.
- Add indexes for hot queries; reassess after changes.
- Seed data lives in `src/scripts`; separate dev/test/demo; avoid polluting production.

---

## 9. Testing & Quality
- Minimum bar: lint + type-check.
- Backend: cover login/borrow/renew/return and changed endpoints.
- Frontend: test complex components/logic; ensure guards/auth/error handling work.
- If tests can’t run, state reason/risks in commit/PR.

---

## 10. Docs & Readability
- Self-explanatory code preferred; brief comments only for “why/assumptions/edge cases”.
- Update docs when adding APIs/flows or env vars; keep paths/commands in sync with layout.

---

## 11. Extra Rules for AI Agents
- Follow existing patterns; don’t invent architecture or rename widely.
- Don’t delete/alter unrelated logic; record out-of-scope issues via TODO or notes.
- Provide a short change summary and what was validated; if unvalidated, say so.
- When business rules are unclear, request clarification or add explicit TODO, don’t fabricate.
- Respect `.gitignore`; no large/binary artifacts.

---

## 12. Security & Privacy
- Validate inputs, encode outputs; guard against injection/XSS/CSRF.
- Auth data: follow chosen token/refresh/cookie strategy; avoid long-term secrets in localStorage; enforce expiry/revocation.
- Log sanitization: never log passwords/tokens/PII.
- Upload/Download: enforce MIME/size; disallow user-controlled storage paths.

---

## 13. Release & Ops
- Compose entry at root; contexts `backend`/`frontend`; DB volume `./backend/database`.
- Health checks: backend `/health`; sync path changes to compose/scripts.
- Backups: SQLite backups in `backend/database/backups`; keep permissions; set retention in prod.

---

Adhering to these rules reduces style drift across developers and AI models, cuts regression risk, and improves collaboration efficiency.
