<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\HandlesListQuery;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Users management: CRUD plus role assignment. Each action is gated by a
 * distinct `users.*` permission (declared in middleware() below) so an admin
 * UI can grant view/create/update/delete independently.
 */
class UserController extends ApiController implements HasMiddleware
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
            new Middleware('permission:users.view', only: ['index', 'show']),
            new Middleware('permission:users.create', only: ['store']),
            new Middleware('permission:users.update', only: ['update']),
            new Middleware('permission:users.delete', only: ['destroy']),
        ];
    }

    /**
     * Paginated list of users — the shared `Paginated<User>` shape. Honors the
     * list-query contract (`q`, `sort`, `dir`, `per_page`). Roles and
     * permissions are eager-loaded to keep the listing free of N+1 queries.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        $users = $this->applyListQuery(
            User::query()->with(['roles', 'permissions', 'media']),
            $request,
            sortable: ['name', 'email', 'created_at'],
            searchable: ['name', 'email'],
        )->paginate($perPage);

        return UserResource::collection($users);
    }

    /**
     * Create a user and optionally assign roles. The `password` cast hashes it.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->safe()->only(['name', 'email', 'password']));

        if ($request->has('roles')) {
            $user->syncRoles($request->validated('roles'));
        }

        return (new UserResource($user->load('roles')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * A single user with its roles + flattened permissions.
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user->load(['roles', 'media']));
    }

    /**
     * Update a user. Only supplied fields change; an empty password is ignored,
     * and `roles` (when present) replaces the user's current role set.
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->fill($request->safe()->only(['name', 'email']));

        if ($request->filled('password')) {
            $user->password = $request->validated('password');
        }

        $user->save();

        if ($request->has('roles')) {
            $user->syncRoles($request->validated('roles'));
        }

        return new UserResource($user->load('roles'));
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): Response
    {
        $user->delete();

        return $this->noContent();
    }
}
