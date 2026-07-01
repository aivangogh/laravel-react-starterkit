<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeds the roles/permissions matrix for the installed preset. Idempotent —
 * safe to re-run (findOrCreate + syncPermissions never duplicate).
 *
 * The permission names MUST match the `permission:*` gates declared in the API
 * controllers (see App\Http\Controllers\Api\*). Feature-flagged groups are
 * seeded only when their feature is enabled in config/starterkit.php, so a
 * Basic install that turned a feature off carries no orphan permission.
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->forgetCachedPermissions();

        // The guard the SPA authenticates against (Sanctum is stateful over the
        // web session). Pinned explicitly so the catalogue always resolves under
        // `web`, never the request-time `sanctum` default guard.
        $guard = config('auth.defaults.guard', 'web');

        $features = config('starterkit.features', []);

        // Core management permissions — always present.
        $permissions = [
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.view', 'roles.create', 'roles.update', 'roles.delete',
        ];

        if ($features['activity_log'] ?? true) {
            $permissions[] = 'activity.view';
        }

        if ($features['settings'] ?? true) {
            $permissions[] = 'settings.view';
            $permissions[] = 'settings.update';
        }

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, $guard);
        }

        // Forget the cache before syncing roles. DatabaseSeeder runs inside
        // Model::withoutEvents(), which suppresses Spatie's automatic cache
        // reset on create — without this, syncPermissions() would resolve the
        // just-created permissions against a stale (empty) cache and throw
        // PermissionDoesNotExist.
        $registrar->forgetCachedPermissions();

        // `super-admin` needs no explicit permissions — a Gate::before hook
        // (AppServiceProvider) grants it every ability. `admin` gets the full
        // installed catalogue; `user` is a plain authenticated account whose
        // access is limited to the self-service endpoints (profile, tokens).
        Role::findOrCreate('super-admin', $guard);
        Role::findOrCreate('admin', $guard)->syncPermissions($permissions);
        Role::findOrCreate('user', $guard)->syncPermissions([]);

        $registrar->forgetCachedPermissions();
    }
}
