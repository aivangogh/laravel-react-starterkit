---
name: php-84-runtime
description: How to run PHP / Composer / Artisan in THIS repo, which requires PHP 8.4 while the machine's default `php` is 8.2. Use before ANY `php`, `composer`, or `php artisan` command, when a composer install resolves wrong versions, or when an `artisan` command "isn't found" / fails with version errors. Critical, repo-specific.
---

# php-84-runtime — always run on PHP 8.4 here

This project requires **PHP 8.4** (Laravel 13 + Spatie permission v8 / activitylog v5). The machine's
default `php` is **8.2**, and Composer has a **global `platform.php = 8.2` pin**. If you run commands
on the default PHP, Composer silently resolves *older* majors (Laravel 12, permission v6, activitylog
v4) and Artisan may fail. **Every PHP/Composer/Artisan command in `backend/` must run on 8.4.**

## The setup (already in place)

- PHP 8.4 lives at `D:\php\php-8.4.22-nts-Win32-vs17-x64` (POSIX: `/d/php/php-8.4.22-nts-Win32-vs17-x64`).
- `backend/composer.json` pins `config.platform.php = 8.4.22` locally (overrides the global 8.2 pin
  for dependency resolution). **Do not change the global Composer config** — it's the user's, set
  because their default PHP is 8.2.

## How to run commands

Prepend the 8.4 dir to `PATH` for the command (or the whole shell):

```bash
# Git Bash — per shell
export PATH="/d/php/php-8.4.22-nts-Win32-vs17-x64:$PATH"
php -v            # must print 8.4.22
cd backend && composer install
php artisan migrate
```

```powershell
# PowerShell
$env:PATH = "D:\php\php-8.4.22-nts-Win32-vs17-x64;$env:PATH"
```

Composer's bash shim resolves `php` from `PATH`, so prepending it makes **composer** run on 8.4 too
(verify: `composer --version` prints `PHP version 8.4.22`).

## Verify before trusting a result

- `php -v` → `PHP 8.4.22`.
- After `composer require`/`update`: check the resolved versions are the latest majors
  (`laravel/framework` 13.x, `spatie/laravel-permission` 8.x, `spatie/laravel-activitylog` 5.x). If
  you see 12.x / v6 / v4, you ran on 8.2 — re-run on 8.4.

## Gotchas

- **`composer.lock` resolved to old versions?** You ran on PHP 8.2 (or the local `platform.php` pin is
  missing). Confirm `composer config platform.php` returns `8.4.22` inside `backend/`, then
  `composer update -W`.
- **`laravel/tinker` blocks a Laravel 13 upgrade** — it must be **v3** (v2 caps at Laravel 12).
- **Redis client is `predis`**, not `phpredis` — this PHP build has no redis extension. Don't switch
  `REDIS_CLIENT` to `phpredis` unless you install the extension.
- **`php artisan tinker --execute=...` can hang** waiting on stdin in this environment. For one-off DB
  checks, prefer a direct `php -r` with PDO (`pgsql:host=127.0.0.1;port=5434;...`).

## Don't

- Don't run backend commands on the default `php` (8.2) and assume they worked.
- Don't edit the **global** Composer `platform.php`. Pin locally per project instead.
- Don't commit `database/database.sqlite` (a leftover from the first install; the kit runs on
  Postgres). It's already gitignored via `backend/database/.gitignore`.
