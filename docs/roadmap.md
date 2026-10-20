# Roadmap

What's done, and what remains — in build order.

## Locked decisions

- **Layout:** pnpm-workspace monorepo — `apps/web` (SPA) + `packages/{config,types,ui}` (`@app/*`);
  `backend/` (Laravel) **outside** the workspace.
- **Package manager:** pnpm. **Web app package:** `web`. **Shared scope:** `@app/*`.
- **Frontend:** React 19 + TypeScript; Vite; **TanStack Router** (file-based) + **TanStack Query** (all
  server state, incl. the session user); Axios; Valibot; Tailwind 4; **shadcn/ui on Base UI** via
  `@app/ui`; lucide-react; ESLint; Vitest + React Testing Library + Playwright. (Originally built in
  Vue 3 — see Phase 10.)
- **Backend:** Laravel 13 on PHP 8.4; Sanctum + Fortify; Spatie permission/activitylog/medialibrary/settings.
- **Auth:** Fortify (headless) + Sanctum SPA cookie sessions.
- **Data (target):** Docker **Postgres 17 + Redis 7**, `.env`-driven.
- **Module selection:** interactive `php artisan kit:install` (stub-publishing) — see [modules.md](modules.md).
- **One-command install:** `pnpm create laravel-react-starterkit` (Node scaffolder) over a shared
  `pnpm setup` orchestrator — see [installer.md](installer.md). Ships last (Phase 9).

## ✅ Done

1. **PHP 8.4.22** installed and configured.
2. **Laravel 13** scaffolded in `backend/`; upgraded to the latest majors with a local `platform.php` pin.
3. **Packages installed, published, migrated** (on SQLite): Sanctum, Fortify, Spatie
   permission/activitylog/medialibrary/settings. `FortifyServiceProvider` registered.
4. **Documentation** for the monorepo architecture (this `docs/` folder).
5. **Phase 0 — monorepo scaffolding:** `pnpm-workspace.yaml`, root `package.json` (pnpm pinned +
   scripts), `.editorconfig`/`.gitignore`/`.nvmrc`, and `packages/{config,types,ui}` (`@app/*`)
   installed & validated (`pnpm type-check` green; `@app/config` linked into `types`/`ui`).
6. **Phase 1 — local stack + backend wiring:** Docker Postgres 17 + Redis 7 (`docker-compose.yml`,
   `docker/`), backend switched to Postgres + Redis (`predis`), `User` traits, headless Fortify,
   Sanctum stateful + CORS, Spatie middleware aliases. **End-to-end verified:** CSRF → register →
   authenticated `/api/user` (200), with an `activity_log` row written.

## ⏳ To build (in order)

### Phase 0 — Monorepo scaffolding ✅ done
- [x] Root `package.json` (pnpm `packageManager`, scripts: `dev`, `build`, `lint`, `format`,
      `type-check`, `test:unit`, `test:e2e`, `db:*`), `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
- [x] `.editorconfig`, `.gitignore`, `.nvmrc`.
- [x] `packages/config` (`@app/config`) — eslint 10 / prettier 3.9 / tsconfig bases.
- [x] `packages/types` (`@app/types`) — `Uuid`, `IsoDateTime`, `Paginated<T>`, `ApiError`, `User`,
      `Role`, `Permission`.
- [x] `packages/ui` (`@app/ui`) — shadcn config (`components.json`, `lib/utils.ts` `cn()`,
      `styles/globals.css` neutral theme).

### Phase 1 — Local stack + backend wiring ✅ done
- [x] `docker-compose.yml` + `docker/postgres/init/01-extensions.sql` + `docker/redis/redis.conf`;
      backend switched to Postgres + Redis; `migrate:fresh`. Host ports **5434** (pg) / **6381**
      (redis) to avoid conflicts; `predis` client (no phpredis ext). ([local-stack.md](local-stack.md))
- [x] `User` traits: `HasRoles`, `HasApiTokens`, `LogsActivity`, `InteractsWithMedia` (`HasMedia`),
      `TwoFactorAuthenticatable`. *(activitylog v5: trait is `…\Models\Concerns\LogsActivity`,
      `LogOptions` under `…\Support`, method `dontLogEmptyChanges()`.)*
- [x] Headless **Fortify** config (`'views' => false`, features incl. email verification).
- [x] **Sanctum** SPA: `.env` stateful domains + `SESSION_DOMAIN` + `FRONTEND_URL`; `config/cors.php`
      `supports_credentials = true` + SPA origin; `$middleware->statefulApi()`.
- [x] Spatie `role`/`permission` middleware aliases in `bootstrap/app.php`.

### Phase 2 — Base API
- [ ] Controllers (`app/Http/Controllers/Api/`): `AuthController`, `UserController`, `RoleController`,
      `PermissionController`, `ActivityLogController`, `ProfileController`, `SettingsController`,
      `ApiTokenController`.
- [ ] API Resources + FormRequests; `/api/user` returns roles + flattened permissions.
- [ ] `routes/api.php` (`auth:sanctum` + `permission:*`) + `routes/modules/*.php` autoloader.

### Phase 3 — Installer & presets
- [ ] `php artisan kit:install` (Laravel Prompts) + `config/starterkit.php`.
- [ ] `RolePermissionSeeder` + `DatabaseSeeder` reading `config('starterkit')`.
- [ ] **Basic** preset seeding (roles/permissions + super-admin). ([modules.md](modules.md))

### Phase 4 — E-commerce backend module (stub)
- [ ] `backend/stubs/modules/ecommerce/`: `Category`, `Product` (+media), `Cart`, `CartItem`, `Order`,
      `OrderItem` models/migrations; controllers; `routes/modules/ecommerce.php`; sample-data seeder;
      `customer` role + `products/categories/orders` permissions.

### Phase 5 — `apps/web` scaffold
- [ ] `apps/web` (Vite + React) + TanStack Router, TanStack Query, Axios, Tailwind 4.
- [ ] `src/main.tsx`, `src/router.tsx`, `src/routes/` (`_app` guard, `_guest`), `src/shared/lib/`
      (`http.ts`, `query-client.ts`, `query-keys.ts`), `src/shared/hooks/usePermissions.ts`,
      `src/shared/components/Can.tsx`.
- [ ] `features/auth/` (login/register/forgot/reset, `useAuth` hooks, session user query, Sanctum cookie flow).

### Phase 6 — Base feature pages
- [ ] `features/`: `users`, `roles`, `permissions`, `activity-log`, `profile`, `settings`, `api-tokens`
      — pages + Query hooks; permission-gated nav + routes.

### Phase 7 — E-commerce frontend module (stub)
- [ ] `apps/web/stubs/modules/ecommerce/`: `products`, `categories`, `orders`, `cart` feature
      (route files + pages/hooks/components); gated by the installer flag.

### Phase 8 — Verification
Scope: verify the **Basic** preset end to end against the live stack, and keep both presets green
across every check. The **live** E-commerce installer round-trip depends on `kit:install`
stub-publishing (not yet built) and is deferred to Phase 9; here, E-commerce is verified at the
test-suite level (`composer test` + `pnpm test:unit` exercise the in-place module stub).

- [ ] `pnpm db:up` → backend on Postgres+Redis; `pnpm dev` → web + API.
- [ ] **Basic** live flow, driven by a Playwright E2E suite (`apps/web/e2e/`, against `localhost`):
      register/login (Sanctum cookie) → RBAC enforcement (no-permission user redirected to
      `/forbidden`, gated nav hidden) → activity log reflects actions → users CRUD round-trip →
      page-level smoke of every base feature.
- [ ] E-commerce verified at the test-suite level (backend 141 + FE unit 107); the live preset
      round-trip (`kit:install` → product/category/order CRUD + pages appear + sample data) moves to
      Phase 9, which is where the publishing step is implemented.
- [ ] `pnpm lint`, `pnpm type-check`, `pnpm test:unit`, `pnpm test:e2e`, `composer test` all green.

> Three real, user-facing defects surfaced and fixed here:
> 1. **SPA could not reach the API** — no `VITE_API_URL` default (and `.env.example` had the wrong
>    port), so a fresh `pnpm dev` hit the Vite origin. Fixed with a `http://localhost:8000` default
>    in the axios client + an aligned `.env.example`.
> 2. **The permission directive hid every gated control from the super-admin** — it lacked the
>    super-admin bypass that `usePermissions().can()` has. Fixed by routing both through one
>    canonical `can()` (today `src/shared/lib/permissions.ts`, used by `usePermissions` and `<Can>`).
> 3. **All modals rendered off-screen** — Tailwind v4 was not scanning `packages/ui`, so utilities
>    used only inside `@app/ui` (the dialog's `fixed top-[50%] translate-*` centering) were never
>    generated. Fixed with a `@source` in the shared `globals.css`.
>
> Also: the login rate limiter is now strict only in production (relaxed elsewhere so dev + E2E can
> log in repeatedly), and modal dialogs cap their height and scroll so actions stay reachable.

### Phase 9 — One-command installer ([installer.md](installer.md))
> Ships **last** — the scaffolder clones the finished, verified template, so it depends on Phases 0–8.
- [x] **`kit:install` stub-publishing** — `App\Installer\ModulePublisher` **moves** the backend stub
      (`app`/`database`/`routes/modules/ecommerce.php`) and the frontend stub
      (`routes/_app/**` → `apps/web/src/routes/_app/`, the rest → `apps/web/src/features/ecommerce/`) into place for the E-commerce preset (moving, not copying,
      avoids duplicate-class + double-migration; see [modules.md](modules.md)). A fresh publish
      re-dumps Composer and migrates + seeds in a subprocess. Verified live end to end.
- [x] `scripts/setup.mjs` + root `pnpm run setup` — idempotent orchestrator: preflight (Node/pnpm/
      Composer + runtime **PHP ≥ 8.4** with `--php-bin`/`STARTERKIT_PHP` override), backend
      `.env`/`composer install`/`key:generate`, data layer (Docker → SQLite fallback), `pnpm install`,
      hand off to `kit:install`, print next steps. *(`pnpm run setup`, not `pnpm setup` — the latter is
      a pnpm built-in.)*
- [x] `create-laravel-react-starterkit` npm package — thin, dependency-free Node `bin`:
      `git clone --depth 1` the template at a ref → drop `.git` → prompt name/preset →
      `pnpm run setup`. Verified via a full local scaffold (E-commerce, SQLite).
- [ ] **Release (yours):** tag a template release, pin the scaffolder's `DEFAULT_REF` to it,
      `npm publish` `create-laravel-react-starterkit`, and smoke-test `pnpm create laravel-react-starterkit`
      in a clean dir. See [installer.md](installer.md) → Release mechanics.

### Phase 10 — React migration
- [ ] Port `apps/web` from Vue 3 to React 19: TanStack Router file routes (`src/routes/`, single
      `_app` guard reading `staticData.{permission,module}`, nav from `staticData.nav`), TanStack Query
      for all server state (Pinia removed; session user under `authKeys.user()`), Valibot search
      params, `<Can>` in place of `v-can`, `FormField` + `formErrors()` for forms.
- [ ] `packages/ui` → shadcn/ui on Base UI (`base-nova`) + `@tanstack/react-table` `DataTable`;
      `@app/config` → `tsconfig.react.json` + react-hooks/react-refresh ESLint.
- [ ] E-commerce web stub ported (`stubs/modules/ecommerce/routes/_app/**` + feature folders);
      installer scaffolder renamed to `create-laravel-react-starterkit`.

## Notes / gotchas discovered

- Your **global Composer `platform.php = 8.2`** silently downgrades the stack; the project pins
  `platform.php = 8.4.22` locally to override it. ([getting-started.md](getting-started.md))
- `laravel/tinker` had to be bumped to **v3** for Laravel 13 (v2 caps at Laravel 12).
- Installing Fortify also pulled `laravel/passkeys` (passkeys table + migration).
- The backend was installed on **SQLite**; moving to Postgres+Redis is Phase 1.
