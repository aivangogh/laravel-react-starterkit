# Backend (`backend/`)

Laravel 13 JSON API. **Not** a pnpm workspace member — managed via Composer + `php artisan`.

## Runtime

- **PHP 8.4.22** (NTS x64) — `D:\php\php-8.4.22-nts-Win32-vs17-x64`
- **Composer 2.9.7**
- **DB / cache / queue / session:** **Postgres 17 + Redis 7** via Docker (`predis` client) —
  see [local-stack.md](local-stack.md)

## Installed packages

| Package | Version | Role |
|---|---|---|
| `laravel/framework` | 13.17.0 | The framework |
| `laravel/sanctum` | 4.3.2 | SPA cookie auth + API tokens |
| `laravel/fortify` | 1.37.2 | Headless auth actions (login, registration, password reset, email verification, 2FA) |
| `laravel/tinker` | 3.0.2 | REPL (v3 required for Laravel 13) |
| `laravel/passkeys` | (via Fortify) | WebAuthn passkeys |
| `spatie/laravel-permission` | 8.0.0 | Roles & permissions |
| `spatie/laravel-activitylog` | 5.0.0 | Activity / audit log |
| `spatie/laravel-medialibrary` | 11.23.1 | Media / file attachments |
| `spatie/laravel-settings` | 3.9.0 | Strongly-typed persisted settings |

> **Why these versions** — with PHP 8.4 + a local `platform.php` pin, Composer resolves the latest
> majors. `laravel/tinker` had to float to **v3** (v2 caps at Laravel 12). See
> [getting-started.md](getting-started.md#-the-php-84-requirement-important-on-this-machine).

## How it was installed

```bash
composer create-project laravel/laravel backend
composer config platform.php 8.4.22
composer require -W laravel/framework:^13.0 laravel/tinker:^3.0 \
  spatie/laravel-permission:^8.0 spatie/laravel-activitylog:^5.0
composer require laravel/sanctum laravel/fortify \
  spatie/laravel-medialibrary spatie/laravel-settings

php artisan install:api                                  # Sanctum + routes/api.php
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider"
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider"
php artisan vendor:publish --provider="Spatie\LaravelSettings\LaravelSettingsServiceProvider"
php artisan vendor:publish --provider="Laravel\Fortify\FortifyServiceProvider"
php artisan migrate
```

`App\Providers\FortifyServiceProvider` is registered in `backend/bootstrap/providers.php`.

## Published files

- **Configs** (`backend/config/`): `permission.php`, `activitylog.php`, `media-library.php`,
  `settings.php`, `fortify.php` (still default — not yet tuned for headless), `sanctum.php`.
- **App files**: `app/Providers/FortifyServiceProvider.php`, `app/Actions/Fortify/*`
  (`CreateNewUser`, `UpdateUserProfileInformation`, `UpdateUserPassword`, `ResetUserPassword`,
  `PasswordValidationRules`), `routes/api.php` (created by `install:api`).

## Database tables

```
users  ·  sessions  ·  password_reset_tokens  ·  cache / cache_locks  ·  jobs / job_batches / failed_jobs
personal_access_tokens                       (Sanctum)
roles · permissions · model_has_roles · model_has_permissions · role_has_permissions   (Spatie Permission)
activity_log                                 (Spatie Activitylog)
media                                        (Spatie MediaLibrary)
settings                                     (Spatie Settings)
passkeys  +  two_factor_* columns on users   (Fortify / Passkeys)
```

## Auth model (target)

- **Fortify** provides headless auth actions; **Sanctum** maintains the SPA session via cookies
  (CSRF cookie → `/login` → session). Non-browser clients use Sanctum Bearer tokens.
- To wire: configure `config/fortify.php` (`'views' => false`, enable features), set Sanctum stateful
  domains + CORS, and add the Spatie middleware aliases. See [rbac.md](rbac.md) and
  [architecture.md](architecture.md).

## What's NOT wired yet

Installation ≠ wiring. Still to do (see [roadmap.md](roadmap.md)):

- `User` traits: `HasRoles`, `HasApiTokens`, `LogsActivity`, `InteractsWithMedia` (`HasMedia`),
  `TwoFactorAuthenticatable`. Currently only `HasFactory, Notifiable`.
- Headless Fortify config; Sanctum stateful domains + `config/cors.php` `supports_credentials`.
- API controllers/resources/requests; `/api/user` returning roles + permissions.
- Seeders (roles/permissions, demo data); the `kit:install` installer.
- Switch DB off SQLite to Postgres + Redis.

## Conventions

See [conventions.md](conventions.md):

- Eloquent: use the **`casts()` method** form (not `protected $casts = []`); use **`$fillable`**
  (allowlist), never `$guarded = []`.
- Migrations are append-only in shared environments; `migrate:fresh` is fine locally.
- Factories in `database/factories/`.
- **Pint** for formatting (`./vendor/bin/pint`); **Pest** is the intended test runner
  (Laravel ships PHPUnit by default — adopting Pest is a convention-alignment step).
