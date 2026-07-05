<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ApiTokenController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Served under the `/api` prefix with the stateful Sanctum group (configured
| in bootstrap/app.php). Protected routes require a valid Sanctum session or
| token; gate further with the Spatie middleware: `permission:users.view` or
| `role:admin`.
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // The authenticated user ("me"). Returns roles + flattened permissions
    // so the SPA can gate its UI. Matches the shared `User` type.
    Route::get('/user', fn (Request $request) => new UserResource($request->user()));

    // Users management (CRUD + role assignment). Per-action permission gates
    // (users.view|create|update|delete) are declared in the controller via
    // HasMiddleware — see UserController::middleware().
    Route::apiResource('users', UserController::class);

    // Roles management (CRUD + permission sync), gated by roles.* in the
    // controller. Permissions are a read-only catalogue (index only).
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class)->only(['index']);

    // Activity log — read-only, filterable, paginated. Gated by activity.view
    // in the controller. Written by models (LogsActivity), never via the API.
    Route::get('activity-log', [ActivityLogController::class, 'index']);
    Route::get('activity-log/{activity}', [ActivityLogController::class, 'show']);

    // The authenticated user's own profile — name/email, password and avatar.
    // Self-service: no extra permission beyond `auth:sanctum`.
    Route::put('profile', [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('profile/avatar', [ProfileController::class, 'destroyAvatar']);

    // App-wide settings. Read/update gated by settings.view / settings.update
    // in the controller (SettingsController::middleware()).
    Route::get('settings', [SettingsController::class, 'show']);
    Route::put('settings', [SettingsController::class, 'update']);

    // The authenticated user's own Sanctum personal access tokens. Self-service
    // (no extra permission): list, create (plaintext shown once), revoke.
    Route::get('tokens', [ApiTokenController::class, 'index']);
    Route::post('tokens', [ApiTokenController::class, 'store']);
    Route::delete('tokens/{id}', [ApiTokenController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Module routes
|--------------------------------------------------------------------------
|
| Optional feature modules (e.g. e-commerce) are published by `kit:install`
| and drop a `routes/modules/<module>.php` file, which is auto-loaded here
| when present. A Basic install has an empty modules/ directory. Module route
| paths are relative to the `/api` prefix Laravel applies to this file. See
| docs/modules.md.
|
*/

foreach (glob(__DIR__.'/modules/*.php') ?: [] as $moduleRoutes) {
    require $moduleRoutes;
}

// In tests, also load each module stub's route file directly from
// stubs/modules/*/routes/*.php — the same "treat every stub as installed"
// mechanism AppServiceProvider uses to register the stub migrations in the
// testing env. Production is unaffected: a Basic install only loads the
// published routes above, so it carries no e-commerce endpoints.
if (app()->environment('testing')) {
    foreach (glob(base_path('stubs/modules/*/routes/*.php')) ?: [] as $moduleRoutes) {
        require $moduleRoutes;
    }
}
