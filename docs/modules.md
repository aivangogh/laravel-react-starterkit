# Modules & the `kit:install` Installer

> **Status:** implemented (Phase 9). `kit:install` publishes the chosen preset's module by **moving**
> its stub into the app (`App\Installer\ModulePublisher`) — see "Mechanism" below. This doc describes
> the mechanism; see [installer.md](installer.md) for the surrounding `pnpm run setup` orchestration.

## Goal

Pick what a new project contains at setup time:

```
$ php artisan kit:install
? Choose a preset:        Basic | E-commerce
? Enable activity log?    yes
? Enable media uploads?   yes
? Enable API tokens?      yes
Installing...
```

A **Basic** project should carry **zero** e-commerce code (backend *and* `apps/web`), and you should
be able to re-run the installer later to add a module.

## Mechanism: stub publishing

Optional modules live as self-contained stubs and are **copied into the app only when chosen** — so
disabled modules leave no trace. Each module has a backend half and a frontend half:

```
backend/stubs/modules/ecommerce/      # models, migrations, controllers, routes
apps/web/stubs/modules/ecommerce/     # routes/_app/** (file routes) + feature folders: pages, hooks, components
```

`php artisan kit:install` will:

1. **Prompt** for preset + optional features (Laravel Prompts).
2. **Write `.env`** — feature flags, Sanctum/CORS/frontend URLs. (DB/Redis come from the Docker stack —
   see [local-stack.md](local-stack.md).)
3. **Publish** vendor config/migrations (already done for the base packages).
4. **Move module stubs** — backend stubs into `backend/app|database|routes/modules`; the frontend
   stub's `routes/_app/**` into `apps/web/src/routes/_app/`, everything else into
   `apps/web/src/features/<module>/`.
5. **Register module routes** — `routes/api.php` auto-loads `routes/modules/*.php`; on the SPA side
   the published route files are picked up by the TanStack Router Vite plugin (route tree regenerated
   on the next `dev`/`build`), and their `staticData.nav` adds the sidebar entries.
6. **Record state** in `backend/config/starterkit.php` (`preset`, `features[]`).
7. **Migrate + seed** — roles/permissions + preset demo data.
8. **Print next steps** (default admin credentials, `pnpm dev`).

Idempotent: detect a prior install and offer `--fresh` / reinstall.

## `config/starterkit.php` (planned shape)

```php
return [
    'preset'   => 'basic',          // 'basic' | 'ecommerce'
    'features' => [
        'activity_log' => true,
        'media'        => true,
        'api_tokens'   => true,
        'settings'     => true,
    ],
];
```

Seeders (`RolePermissionSeeder`, `DatabaseSeeder`) and the SPA navigation read this to enable only
what's installed. Shared TS types for a module go in `@app/types` (re-exported from `index.ts`).

## Presets

| Preset | Adds |
| --- | --- |
| **Basic** | Roles/permissions + user management + activity log + profile/settings |
| **E-commerce** | Basic **plus** `Category`, `Product`, `Cart`, `Order` (backend models/migrations/controllers + `apps/web` feature), a `customer` role, and `products/categories/orders` permissions |

## Module gating (SPA)

An optional module's SPA routes/nav are gated by **two independent layers**. The first keeps a
Basic build free of the module entirely; the second guards a module that has been mounted but is not
enabled.

### 1. File-presence (primary)

Routes are files: the TanStack Router Vite plugin builds `src/routeTree.gen.ts` from whatever exists
under `src/routes/`. The e-commerce route files live in `apps/web/stubs/modules/ecommerce/routes/_app/`
and are moved into `src/routes/_app/` (the rest of the stub into `src/features/<module>/`) **only for
the E-commerce preset**. On a Basic install they never exist under `src/routes/`, so the route tree
has **no e-commerce routes, no nav entries, and no e-commerce JavaScript in the production build.**
A Basic build carries zero e-commerce code. This is the primary gate; nothing else is needed for a
clean Basic install.

### 2. Runtime install flag (secondary)

For the case where the module *is* mounted but should be off (e.g. a re-run of the installer, or a
build that ships the module but is configured Basic), a runtime flag hides it:

- Every e-commerce route sets `staticData.module: 'ecommerce'` (see `AppRouteStaticData.module` in
  `src/shared/router/types.ts`).
- `GET /api/config` exposes the install's `preset` + `features[]` (from `config/starterkit.php`);
  the SPA reads it via `useAppConfig` and derives `isModuleEnabled(module)` — `ecommerce` is enabled
  iff `preset === 'ecommerce'`, any other module falls back to `features[module] === true`.
- **Nav:** `useNavItems` drops any item whose `staticData.module` is set and not enabled (alongside
  the `staticData.permission` filter).
- **Guard:** the `_app` route guard (`routes/_app.tsx`) redirects to `/` when a matched route's
  `staticData.module` is set and the module is not enabled (`ensureModuleEnabled`, which loads
  `/api/config` into the shared query cache the same way the guard loads the session user). Ordered before the `permission` check, so a disabled
  module reads as "not installed" (home) rather than "forbidden".

Net effect: **Basic preset → no e-commerce routes/nav (and no chunks); E-commerce preset → they
appear.** Even if the module code is present, the runtime flag hides it unless the preset enables it.

## Authoring a new module

1. `backend/stubs/modules/<name>/` with `app/`, `database/migrations/`, `routes/modules/<name>.php`.
2. `apps/web/stubs/modules/<name>/` with `routes/_app/**` (thin file routes setting
   `staticData.module: '<name>'`) plus feature folders (`pages/`, `hooks/`, `components/`, `__tests__/`).
3. Add shared types to `@app/types`; reusable UI to `@app/ui`.
4. Register the module as a feature/preset choice in `kit:install` + `config/starterkit.php`.
5. Re-run `php artisan kit:install` and select it.
