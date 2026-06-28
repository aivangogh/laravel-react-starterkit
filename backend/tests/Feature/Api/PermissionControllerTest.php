<?php

namespace Tests\Feature\Api;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_permission_catalogue(): void
    {
        foreach (['roles.view', 'users.view', 'users.create'] as $name) {
            Permission::findOrCreate($name);
        }

        $viewer = tap(Role::findOrCreate('viewer'))->givePermissionTo('roles.view');
        $user = tap(User::factory()->create())->assignRole($viewer);

        $response = $this->actingAs($user)->getJson('/api/permissions')->assertOk();

        // A flat Permission[] catalogue (no pagination): [{ id, name }, ...].
        $response->assertJsonStructure([['id', 'name']]);
        $this->assertEqualsCanonicalizing(
            ['roles.view', 'users.view', 'users.create'],
            collect($response->json())->pluck('name')->all(),
        );
    }

    public function test_requires_roles_view_permission(): void
    {
        Permission::findOrCreate('roles.view');

        $this->actingAs(User::factory()->create())
            ->getJson('/api/permissions')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/permissions')->assertUnauthorized();
    }
}
