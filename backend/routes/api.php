<?php

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
