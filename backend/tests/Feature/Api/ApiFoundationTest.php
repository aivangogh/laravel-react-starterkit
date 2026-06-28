<?php

namespace Tests\Feature\Api;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_returns_401_json(): void
    {
        $this->getJson('/api/user')
            ->assertUnauthorized()
            ->assertJsonStructure(['message']);
    }

    public function test_request_missing_permission_returns_403_json(): void
    {
        Permission::create(['name' => 'users.view']);

        // A route gated by a permission the acting user does not hold.
        Route::middleware(['auth:sanctum', 'permission:users.view'])
            ->get('/api/_foundation/gated', fn () => response()->json(['ok' => true]));

        $this->actingAs(User::factory()->create());

        $this->getJson('/api/_foundation/gated')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_authenticated_user_returns_flattened_user_shape(): void
    {
        $permission = Permission::create(['name' => 'users.view']);
        $role = Role::create(['name' => 'admin']);
        $role->givePermissionTo($permission);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user);

        $response = $this->getJson('/api/user')->assertOk();

        // Shape must match the shared `User` type in @app/types.
        $response->assertJsonStructure([
            'id', 'name', 'email', 'email_verified_at', 'roles', 'permissions', 'created_at',
        ]);

        // roles + permissions are flattened to plain string arrays.
        $response->assertJsonPath('roles', ['admin']);
        $response->assertJsonPath('permissions', ['users.view']);
        $this->assertSame($user->email, $response->json('email'));

        // The User PK is a UUID (PRISM parity), not an auto-increment int.
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $response->json('id'),
        );
    }
}
