# Roles & Permissions (Spatie Permission v8)

## Installed state

- `spatie/laravel-permission` **8.0.0** is installed.
- `config/permission.php` is published.
- Tables exist: `roles`, `permissions`, `model_has_roles`, `model_has_permissions`,
  `role_has_permissions`.

## Wiring status

### 1. `HasRoles` trait on the `User` model — ✅ done (Phase 1)

`backend/app/Models/User.php` uses `HasRoles` (alongside `HasApiTokens`, `LogsActivity`,
`InteractsWithMedia`, `TwoFactorAuthenticatable`):

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    use HasFactory, Notifiable, HasRoles /* , HasApiTokens, LogsActivity, … */;
}
```

### 2. Seed roles & permissions

Presets (see [modules.md](modules.md)). Permission names below are the ones the API controllers
actually enforce via `permission:*` middleware — the seeder must match them exactly.

**Basic preset** — implemented by `RolePermissionSeeder` (Phase 3)
- Roles: `super-admin`, `admin`, `user`
- Permissions: `users.{view,create,update,delete}`, `roles.{view,create,update,delete}`,
  `activity.view`, `settings.{view,update}`
- `activity.view` and `settings.*` are seeded only when the matching feature is enabled in
  `config/starterkit.php`. `super-admin` holds no explicit permissions — a `Gate::before` hook
  (`AppServiceProvider`) grants it every ability. `admin` gets the full installed catalogue; `user`
  gets none (self-service endpoints — profile, tokens — need no permission).

**E-commerce preset** (adds — Phase 4)
- Role: `customer`
- Permissions: `products.*`, `categories.*`, `orders.*`

`RolePermissionSeeder` reads the chosen preset + features from `config('starterkit')` and seeds only
what's installed; `php artisan kit:install` provisions it end to end (migrate + seed + super-admin).

### 3. Protect API routes

```php
Route::middleware(['auth:sanctum', 'permission:users.view'])
    ->get('/users', [UserController::class, 'index']);
```

The middleware aliases are **already registered** (Phase 1) in `backend/bootstrap/app.php`
`->withMiddleware()` (next to `$middleware->statefulApi()` for Sanctum):

```php
$middleware->alias([
    'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
    'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
    'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
]);
```

### 4. Expose permissions to the SPA

`/api/user` should return the user's roles and a flat list of permission names so the frontend can
show/hide UI:

```php
return [
    'id' => $user->id,
    'name' => $user->name,
    'roles' => $user->getRoleNames(),
    'permissions' => $user->getAllPermissions()->pluck('name'),
];
```

The SPA then gates UI with `usePermissions().can()` / the `<Can permission>` component — see the permission-aware UI
section in [frontend.md](frontend.md).

## Reference

- Docs: https://spatie.be/docs/laravel-permission/v8
- Clear the permission cache after seeding: `php artisan permission:cache-reset`
