<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\HandlesListQuery;
use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\Request;
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
    use HandlesListQuery;

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
     * pagination — the set is small and consumed as a lookup), ordered by name.
     * Supports the list-query contract's `q` search on the permission name; the
     * ordering stays fixed (no sortable columns) so the picker stays alphabetical.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $permissions = $this->applyListQuery(
            Permission::query(),
            $request,
            searchable: ['name'],
            defaultSort: 'name',
            defaultDir: 'asc',
        )->get();

        return PermissionResource::collection($permissions);
    }
}
