# AGENTS.md — frontend (Nuxt 4)

Nuxt 4.5 + Vue 3.5 + @nuxt/ui v4 + Pinia + Tailwind v4 + Zod; app code lives in `app/`. This is the **Capital Flow** personal-finance UI (accounts, transactions, budgets, debts, savings goals, reports, admin config), even though the repo and `<title>` say "Tortilleria La Abuelita". UI copy is Spanish; API fields/enums are English. Root `README.md` is the stock Nuxt starter (`:3000`, npm) — ignore it.

## Commands (pnpm only)

- `pnpm install` — lockfile v9. Never npm/yarn.
- `pnpm dev` = `pnpm generate:types && nuxt dev`. Codegen fetches `SWAGGER_URL`, so it fails if the backend is down or `.env` is missing.
- `pnpm exec nuxt dev` — UI only, skips codegen and uses the checked-in `app/types/api.d.ts`. Serves `http://localhost:5002` (verified).
- `pnpm generate:types` — regenerates the **tracked** `app/types/api.d.ts`. Large diffs are normal: the backend exposes many more endpoints than the UI uses.
- `pnpm build` / `pnpm preview` / `pnpm generate`.
- No test, lint, or typecheck scripts; `vue-tsc` is installed but unwired. Don't invent commands.
- `ERR_PNPM_IGNORED_BUILDS` → `pnpm approve-builds` (see `allowBuilds` in `pnpm-workspace.yaml`).

## Env and backend

- `.env` is gitignored; no `.env.example` in this repo. This checkout has one pointing at backend `:4002`:
  - `SWAGGER_URL` — `.../api/docs-json` (only for `generate:types`).
  - `NUXT_PUBLIC_API_URL` — must include `/api` (`.../api`). Services pass prefix-less paths and the NestJS backend uses a global `api` prefix, so dropping `/api` breaks every call.
  - `NITRO_PORT=5003` (built/preview Nitro server; dev is still `5002`), plus `NUXT_PUBLIC_SOCKET_URL` / `NUXT_PUBLIC_FILES`, which no app code reads yet.
- Backend is the sibling `../Tortilleria-La-Abuelita-Backend` (NestJS + TypeORM + Postgres, Swagger at `/api/docs`). It also serves inventory/sales/production endpoints that this frontend does not implement — don't assume a service/page exists just because the type does.
- `runtimeConfig.public.apiUrl` is empty in `nuxt.config.ts` and filled by `NUXT_PUBLIC_API_URL`. Never hardcode URLs; use `useRuntimeConfig().public.apiUrl`.
- `devServer.host` is the literal placeholder `[IP_ADDRESS]`; Nuxt warns `Invalid hostname ... Using fallback` and still serves on `:5002`. Harmless unless you're changing host binding.

## API and data conventions

- `app/plugins/api.ts` provides `$api` (`$fetch.create`); `app/composables/useApi.ts` wraps it. Services call `useApi().api<T>('/path', { method, body })`.
- Call `useApi()` inside functions, never at module top level (needs Nuxt context).
- `app/services/*.service.ts` are plain exported functions, one per endpoint (no classes). Services throw; pages/composables catch via `getApiMessage` (`app/utils/api-error.ts`) + `useToast()`.
- Reuse `components['schemas'][...]` from generated `~/types/api`; don't hand-write DTOs. `app/types/dashboard.ts` is the one handwritten type module.
- Domain composables (`use<X>.ts`) own refs, filters, and toasts; pages consume them. Zod schemas live in `app/schemas/*.schema.ts` and feed `UForm`.
- Dashboard: `useDashboardData()` uses `useState` + global `useAsyncData` keys (`dashboard-overview|breakdown|debts|savings`), so every caller shares the same state. Don't re-fetch those endpoints in pages.
- Payload values stay English (`income|expense|transfer`, `pending|reconciled`, `cash|debit_card|credit_card|bank_transfer`); only labels are Spanish.
- `useSeed()` (`/seed`) is unused dead code.

## Auth and permissions (non-obvious)

- Login is `{ email, password }` (`authStore.login`) even though the form labels the field "Usuario". `login`/`register` resolve `{ data, error }` instead of throwing.
- The access JWT embeds `permisos` and exceeds the ~4KB cookie limit, so browsers drop `auth_token`. Source of truth is Pinia → `localStorage.auth_token` → cookie (SSR fallback only); the tiny `auth_flag` cookie tells SSR a session exists. Don't "simplify" to cookie-only auth.
- `app/plugins/api.ts` refreshes an expired token before the request, retries once on 401, and `refreshSession()` is single-flight. `auth.store.refreshSession()` uses raw `$fetch` on purpose (going through `$api` would recurse).
- `app/middleware/auth.global.ts` runs on every route. Permission enforcement is client-side and only after `pantallas` loads (empty list = no checks), so it's UX, not security. Forbidden paths throw 404; opt out with `definePageMeta({ skipPermissionCheck: true })` (only `pages/perfil.vue`). `middleware: 'guest'` is used only by `pages/register.vue`.
- Action gating: `permisosStore.can(path, 'canCreate'|'canUpdate'|'canDelete')` hides buttons (see `transacciones`/`cuentas`).
- Navigation is backend-driven: `useMenu()` + `permisos.store` build the sidebar from JWT `permisos`. Adding a page is not enough — the backend must expose a screen with that path and `canRead`. Dynamic patterns (`/presupuestos/[id]`) are matched but excluded from nav.

## Generated code and app shell

- Never edit `app/types/api.d.ts` (openapi-typescript output); update with `pnpm generate:types`.
- Root `tsconfig.json` has `"files": []` by design and references `.nuxt/tsconfig.*`. Run `nuxt prepare` (also `postinstall`) if editor types are missing; don't add paths to the root file.
- `app/app.vue` = `<UApp>` + loading indicator + `<NuxtLayout>`. Layouts: `default` (dashboard shell), `auth` (login/register), `login` (unused). `/` redirects to `/dashboard`; dark mode default; `app.config.ts` sets primary `blue`.
- Nuxt dev warns about duplicated `MetodoPago` auto-imports (`useDashboardData`, `useTransacciones`, `dashboard.service`). Harmless; avoid adding another export of the same name.

## Nuxt docs

- Nuxt MCP is configured in `opencode.json` (`https://nuxt.com/mcp`) — use its docs tools for Nuxt API questions.
