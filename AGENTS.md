# AGENTS.md — frontend (Nuxt 4)

Nuxt 4 + Vue 3 + @nuxt/ui v4 + Pinia + Tailwind v4. Source lives in `app/`. Backend is sibling `../backend/`.

## Commands (pnpm only)

- `pnpm install` — repo uses `pnpm-lock.yaml`; never npm/yarn.
- `pnpm dev` = `pnpm generate:types && nuxt dev`. Fails unless backend is up (types fetch from `$SWAGGER_URL`).
- `pnpm generate:types` — regenerates `app/types/api.d.ts` via `dotenv + cross-var openapi-typescript $SWAGGER_URL`.
- `pnpm build` / `pnpm preview` / `pnpm generate` — build / preview / static.
- No test, lint, or typecheck scripts (`vue-tsc` is installed but unwired). Don't invent them.
- If pnpm errors `ERR_PNPM_IGNORED_BUILDS`, run `pnpm approve-builds` (`pnpm-workspace.yaml` `allowBuilds` policy) and retry.

## Env + ports (verify before running)

- Dev server is `:5002` (`nuxt.config devServer`, `NITRO_PORT=5002`), not the Nuxt default `:3000`.
- Backend per `.env` is `http://localhost:4002` (old docs said `:3001` — stale).
- `.env` is gitignored, no `.env.example`, and the current `.env` is broken: duplicate `SWAGGER_URL` lines (4001 vs 4002) and a malformed `NUXT_PUBLIC_FILES:` line (missing `=`, unclosed quote). Fix it before `dev`/`generate:types`.
- `nuxt.config runtimeConfig.public.apiUrl` is empty in code, filled by `NUXT_PUBLIC_API_URL` at runtime. Use `useRuntimeConfig().public.apiUrl`; never hardcode URLs.

## API client — broken, check imports before adding calls

- Real client is `app/plugins/api.ts` (`$fetch.create`, provided as `$api`): `baseURL` is `config.public.apiUrl` as-is (no `/api` appended), token from `useCookie('auth_token')` only, 401 → `authStore.refreshSession()` retry once else `logout()`.
- `app/composables/useApi.ts` does not exist, but all 8 files in `app/services/*.service.ts` still do `import { useApi } from '~/composables/useApi'` — those imports fail. Don't copy the service pattern until it's migrated to `$api` (or restore `useApi`).
- Path convention vs `.env` (`NUXT_PUBLIC_API_URL=http://localhost:4002/api`, already has `/api`): prefix-less service paths (`/transactions`, `/reports/dashboard`, `/auth/me`) are correct; `auth.service.ts` `/api/auth/login|register` double-prefixes to `/api/api/auth/*`. `auth.store.ts` bypasses the plugin with `` `${apiUrl}/auth/login|refresh` `` (correct under current env).
- Store path is plural `app/stores/*`, but `app/plugins/api.ts`, `app/plugins/auth-init.ts`, and composables (`useCatalogos`, `useMenu`, `useNotificaciones`, `usePermisos`, `useUsuarios`) import `~/store/*` (singular) — broken. Use `~/stores/*`.
- Dead `app/composables/useAuth.ts` imports `~/services/auth.repository`, `~/services/usuarios.respository` (typo), `~/types/auth` — none exist. The working auth is `app/stores/auth.store.ts` + `app/services/auth.service.ts` (different login shapes: `{email,password}` vs `{nombreUsuario,contrasena}` — check backend DTO).
- Dashboard reads go through `useDashboardData` (`useAsyncData` key `dashboard-report`, shared by layout + page — don't duplicate the fetch).

## Auth + routing

- `app/middleware/auth.global.ts` runs on every route: server reads `auth_token` cookie, client reads Pinia + `auth_screens` localStorage; unauthenticated → `/login`; logged-in on `/login` → `/`; other routes checked via `permisos.store can(path)` (throws 404 to hide forbidden pages). Routes needing exemption set `meta.skipPermissionCheck`.
- `app/middleware/guest.ts` references `auth.isLoggedIn`, which does not exist (store exposes `isAuthenticated`) — broken, don't copy it. `pages/dashboard.vue` sets `middleware: 'auth'`, but only `auth.global.ts` + `guest.ts` exist — that named reference resolves to nothing.
- `routeRules: { '/': { redirect: '/dashboard' } }`, `colorMode.preference: 'dark'`. Layouts: `auth` / `dashboard` / `default` (+ `login`).

## Generated code — don't hand-edit

- `app/types/api.d.ts` is `openapi-typescript` output. Never edit; run `pnpm generate:types`.
- Root `tsconfig.json` has `"files": []` by design; real configs live in `.nuxt/tsconfig.*` (from `postinstall: nuxt prepare`). If types break, run `nuxt prepare`, don't add paths to the root file.
- `app.vue` is just `<UApp><NuxtLayout><NuxtPage/></NuxtLayout></UApp>` (at `app/app.vue`, not root). Fonts/theme: `nuxt.config app.head` (Inter + Plus Jakarta Sans, `lang: es`) + `app/assets/css/main.css` (`@theme` tokens).

## Nuxt docs

- Nuxt MCP is configured in `opencode.json` (`https://nuxt.com/mcp`) — use its docs tools for Nuxt API questions.
