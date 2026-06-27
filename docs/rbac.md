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

Planned presets (see [modules.md](modules.md)):

**Basic preset**
- Roles: `super-admin`, `admin`, `user`
- Permissions: `users.{view,create,update,delete}`, `roles.{view,manage}`,
  `permissions.view`, `activity-log.view`, `settings.manage`

**E-commerce preset** (adds)
- Role: `customer`
- Permissions: `products.*`, `categories.*`, `orders.*`

A `RolePermissionSeeder` will read the chosen preset from `config('starterkit')` and seed only
what's installed.

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

The SPA then gates UI with a `can()` helper / `v-can` directive — see the permission-aware UI
section in [frontend.md](frontend.md).

## Reference

- Docs: https://spatie.be/docs/laravel-permission/v8
- Clear the permission cache after seeding: `php artisan permission:cache-reset`
