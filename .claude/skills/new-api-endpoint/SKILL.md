---
name: new-api-endpoint
description: Scaffold a new Laravel 13 API endpoint in `backend/`: route, controller, Form Request validation, API Resource, authorization (Sanctum + Spatie permission), a test, and (when FE-facing) a matching shared type in `packages/types`. Use when the user asks to add an API endpoint, route, or controller action.
---

# new-api-endpoint

Adds an API surface to the Laravel backend with validation, response shaping, authorization, and the
type contract wired in. Run all `php`/`composer`/`artisan` commands on **PHP 8.4** (see `php-84-runtime`).

## When to use

- A new HTTP endpoint exposed by the Laravel API.
- A new controller / action / route on the backend.

## Steps

1. **Route.** Add to `backend/routes/api.php` (it exists — created by `install:api`). It's served under
   the `/api` prefix with the stateful Sanctum group. Group by resource:
   ```php
   Route::middleware('auth:sanctum')->group(function () {
       Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.view');
       Route::apiResource('users', UserController::class);
   });
   ```
   Module routes live in `backend/routes/modules/*.php` (autoloaded; see `docs/modules.md`).
2. **Controller.** `php artisan make:controller Api/<Name>Controller` (add `--api` for resourceful,
   `--invokable` for single-action). Under `app/Http/Controllers/Api/`.
3. **Validation.** Anything beyond a param-less `GET` → `php artisan make:request <Name>Request` and
   validate there. Never validate inline in the controller.
4. **Response shape.** `php artisan make:resource <Name>Resource` so JSON is centralized. **Never return
   an Eloquent model directly.** Use `Paginated<T>` shape for index endpoints (Laravel resource
   collections produce `{ data, meta, links }`).
5. **Authorization.**
   - Protect with `auth:sanctum` (cookie session or token).
   - Gate by permission/role with the Spatie middleware aliases (already registered):
     `->middleware('permission:users.update')` / `'role:admin'`. See the `rbac` notes below.
6. **Type contract.** If FE-facing, add the matching TS type to `packages/types/src/index.ts` (see
   `add-shared-type`) so the Resource shape and the FE type stay in sync.
7. **Test.** `backend/tests/Feature/`. Cover happy path, validation failure, and authorization (e.g.
   a user lacking the permission gets 403). Tests run against the local Postgres — `pnpm db:up` first;
   use `RefreshDatabase`.
8. **Run, in order** (PHP 8.4):
   - `cd backend && ./vendor/bin/pint` (format)
   - `cd backend && php artisan test` (PHPUnit today; Pest is the intended runner)
   - From repo root: `pnpm type-check` (catches TS contract drift if step 6 added a type)

## RBAC quick reference

- `User` already uses `HasRoles`. Assign with `$user->assignRole('admin')`,
  check with `$user->can('users.view')`.
- `/api/user` should return `roles` + flattened `permissions` so the SPA can gate UI:
  ```php
  'roles' => $user->getRoleNames(),
  'permissions' => $user->getAllPermissions()->pluck('name'),
  ```
- After seeding roles/permissions: `php artisan permission:cache-reset`.

## Auditing

To audit a model's create/update/delete, add the activitylog trait. **v5 API** (changed from v4):
```php
use Spatie\Activitylog\Models\Concerns\LogsActivity;   // not Traits\LogsActivity
use Spatie\Activitylog\Support\LogOptions;             // not Activitylog\LogOptions

public function getActivitylogOptions(): LogOptions
{
    return LogOptions::defaults()->logOnly(['name'])->logOnlyDirty()->dontLogEmptyChanges();
    //                                                                  ^ not dontSubmitEmptyLogs()
}
```

## Conventions

- PSR-4 per `backend/composer.json`: `App\` → `app/`. PHP indent: 4 spaces.
- Use the `casts()` method form, `$fillable` (allowlist) never `$guarded = []`.
- Don't bypass Form Requests; don't return models directly — go through a Resource.

## Don't

- Don't run `migrate:fresh` mid-task without warning — it wipes dev data (`db-reset` skill if needed).
- Don't skip Pint or failing tests. Fix the cause.
- Don't run backend commands on the default PHP 8.2 (`php-84-runtime`).
