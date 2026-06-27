# Modules & the `kit:install` Installer (Planned)

> **Status:** design only. This captures the intended mechanism so implementation stays consistent.
> See [roadmap.md](roadmap.md).

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
apps/web/stubs/modules/ecommerce/     # feature folder: pages, composables, stores, types
```

`php artisan kit:install` will:

1. **Prompt** for preset + optional features (Laravel Prompts).
2. **Write `.env`** — feature flags, Sanctum/CORS/frontend URLs. (DB/Redis come from the Docker stack —
   see [local-stack.md](local-stack.md).)
3. **Publish** vendor config/migrations (already done for the base packages).
4. **Copy module stubs** — backend stubs into `backend/app|database|routes/modules`; frontend stubs
   into `apps/web/src/features/<module>`.
5. **Register module routes** — `routes/api.php` auto-loads `routes/modules/*.php`; the SPA adds the
   feature's routes/nav behind an installer-written flag.
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

## Authoring a new module

1. `backend/stubs/modules/<name>/` with `app/`, `database/migrations/`, `routes/modules/<name>.php`.
2. `apps/web/stubs/modules/<name>/` as a feature folder (`pages/`, `composables/`, `stores/`).
3. Add shared types to `@app/types`; reusable UI to `@app/ui`.
4. Register the module as a feature/preset choice in `kit:install` + `config/starterkit.php`.
5. Re-run `php artisan kit:install` and select it.
