# Roadmap

What's done, and what remains — in build order.

## Locked decisions

- **Layout:** pnpm-workspace monorepo — `apps/web` (SPA) + `packages/{config,types,ui}` (`@app/*`);
  `backend/` (Laravel) **outside** the workspace.
- **Package manager:** pnpm. **Web app package:** `web`. **Shared scope:** `@app/*`.
- **Frontend:** Vue 3 + TypeScript; Vite; Pinia (client state) + **TanStack Query** (server state);
  Axios; Vue Router; Tailwind 4; **shadcn-vue** via `@app/ui`; lucide; oxlint→eslint; Vitest+Playwright.
- **Backend:** Laravel 13 on PHP 8.4; Sanctum + Fortify; Spatie permission/activitylog/medialibrary/settings.
- **Auth:** Fortify (headless) + Sanctum SPA cookie sessions.
- **Data (target):** Docker **Postgres 17 + Redis 7**, `.env`-driven.
- **Module selection:** interactive `php artisan kit:install` (stub-publishing) — see [modules.md](modules.md).
- **One-command install:** `pnpm create laravel-vue-starterkit` (Node scaffolder) over a shared
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
- [x] `packages/ui` (`@app/ui`) — shadcn-vue config (`components.json`, `lib/utils.ts` `cn()`,
      `styles/globals.css` neutral theme). *Note: `lucide-vue-next` to be pinned to a maintained
      version, and `vue-demi` build script approved, when `apps/web` lands in Phase 5.*

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
- [ ] `apps/web` (Vite vue-ts) + Vue Router, Pinia, `@tanstack/vue-query`, Axios, Tailwind 4.
- [ ] `src/app/` (main.ts, App.vue, router), `src/shared/lib/` (`http.ts`, `query-client.ts`,
      `query-keys.ts`), `src/shared/composables/usePermissions.ts`, `src/shared/directives/can.ts`.
- [ ] `features/auth/` (login/register/forgot/reset, `useAuth`, Pinia `auth` store, Sanctum cookie flow).

### Phase 6 — Base feature pages
- [ ] `features/`: `users`, `roles`, `permissions`, `activity-log`, `profile`, `settings`, `api-tokens`
      — pages + Query composables; permission-gated nav + routes.

### Phase 7 — E-commerce frontend module (stub)
- [ ] `apps/web/stubs/modules/ecommerce/`: `products`, `categories`, `orders`, `cart` feature
      (pages/composables/stores); gated by the installer flag.

### Phase 8 — Verification
- [ ] `pnpm db:up` → backend on Postgres+Redis; `pnpm dev` → web + API.
- [ ] Install **Basic** → register/login (Sanctum cookie) → RBAC enforcement (403 for missing perms)
      → activity log shows actions.
- [ ] Re-run installer → **E-commerce** → product/category/order CRUD + pages appear; sample data seeded.
- [ ] `pnpm lint`, `pnpm type-check`, `pnpm test:unit`, `pnpm test:e2e`, `composer test` all green.

### Phase 9 — One-command installer ([installer.md](installer.md))
> Ships **last** — the scaffolder clones the finished, verified template, so it depends on Phases 0–8.
- [ ] `scripts/setup.mjs` + root `pnpm setup` script — idempotent orchestrator: preflight (assert
      **PHP ≥ 8.4**), backend `.env`/`composer install`/`key:generate`, data layer (Docker → SQLite
      fallback), `migrate`, `pnpm install` + build shared packages, hand off to `kit:install`, print
      next steps. *(Can be grown incrementally as Phases 1/5 land; verified in Phase 8.)*
- [ ] `create-laravel-vue-starterkit` npm package — thin Node `bin`: degit template **at a tag** →
      prompt name/preset → run `pnpm setup --no-interaction`. Published so `pnpm create` works.
- [ ] Tag a template release; pin the scaffolder to it; smoke-test `pnpm create laravel-vue-starterkit`
      in a clean dir.

## Notes / gotchas discovered

- Your **global Composer `platform.php = 8.2`** silently downgrades the stack; the project pins
  `platform.php = 8.4.22` locally to override it. ([getting-started.md](getting-started.md))
- `laravel/tinker` had to be bumped to **v3** for Laravel 13 (v2 caps at Laravel 12).
- Installing Fortify also pulled `laravel/passkeys` (passkeys table + migration).
- The backend was installed on **SQLite**; moving to Postgres+Redis is Phase 1.
