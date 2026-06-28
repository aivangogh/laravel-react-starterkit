<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Read-only permission catalogue. Permissions are defined by seeders (not
 * created via the API), so this exposes only the full list — the SPA reads it
 * to build a role's permission picker. Gated by `roles.view` because it exists
 * to support role management rather than as an independently-managed resource.
 */
class PermissionController extends ApiController implements HasMiddleware
{
    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:roles.view', only: ['index']),
        ];
    }

    /**
     * The full permission catalogue as a flat `Permission[]` array (no
     * pagination — the set is small and consumed as a lookup).
     */
    public function index(): AnonymousResourceCollection
    {
        return PermissionResource::collection(
            Permission::query()->orderBy('name')->get()
        );
    }
}
