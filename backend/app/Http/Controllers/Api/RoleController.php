<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\HandlesListQuery;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Roles management: CRUD plus permission assignment. Each action is gated by a
 * distinct `roles.*` permission so an admin UI can grant view/create/update/
 * delete independently.
 */
class RoleController extends ApiController implements HasMiddleware
{
    use HandlesListQuery;

    /**
     * Per-action permission gates via the Spatie middleware alias. The whole
     * resource already sits behind `auth:sanctum` (the route group).
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:roles.view', only: ['index', 'show']),
            new Middleware('permission:roles.create', only: ['store']),
            new Middleware('permission:roles.update', only: ['update']),
            new Middleware('permission:roles.delete', only: ['destroy']),
        ];
    }

    /**
     * Paginated list of roles — the shared `Paginated<Role>` shape. Honors the
     * list-query contract (`q`, `sort`, `dir`, `per_page`). Permissions are
     * eager-loaded to keep the listing free of N+1 queries.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        $roles = $this->applyListQuery(
            Role::query()->with('permissions'),
            $request,
            sortable: ['name', 'created_at'],
            searchable: ['name'],
        )->paginate($perPage);

        return RoleResource::collection($roles);
    }

    /**
     * Create a role and optionally sync its permission set.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        // Pin the role to the guard the SPA authenticates against — Sanctum
        // delegates to the session ('web') guard, which is also the guard the
        // permission catalogue is created under. During a stateful request
        // Sanctum makes 'sanctum' the *default* guard, so a role created here
        // would otherwise inherit guard 'sanctum' and syncPermissions() could
        // not resolve the web-guard permissions.
        $role = Role::create([
            'name' => $request->validated('name'),
            'guard_name' => config('sanctum.guard.0', 'web'),
        ]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->validated('permissions'));
        }

        return (new RoleResource($role->load('permissions')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * A single role with its flattened permission names.
     */
    public function show(Role $role): RoleResource
    {
        return new RoleResource($role->load('permissions'));
    }

    /**
     * Update a role. Only supplied fields change; `permissions` (when present)
     * replaces the role's current permission set.
     */
    public function update(UpdateRoleRequest $request, Role $role): RoleResource
    {
        if ($request->has('name')) {
            $role->update(['name' => $request->validated('name')]);
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->validated('permissions'));
        }

        return new RoleResource($role->load('permissions'));
    }

    /**
     * Delete a role.
     */
    public function destroy(Role $role): Response
    {
        $role->delete();

        return $this->noContent();
    }
}
