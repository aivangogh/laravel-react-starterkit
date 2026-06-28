<?php

namespace Tests\Feature\Api;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create the four users.* permissions.
     */
    private function seedPermissions(): void
    {
        foreach (['users.view', 'users.create', 'users.update', 'users.delete'] as $name) {
            Permission::findOrCreate($name);
        }
    }

    /**
     * An acting user holding every users.* permission.
     */
    private function admin(): User
    {
        $this->seedPermissions();

        $role = Role::findOrCreate('admin');
        $role->givePermissionTo(['users.view', 'users.create', 'users.update', 'users.delete']);

        return tap(User::factory()->create())->assignRole($role);
    }

    public function test_index_returns_paginated_users(): void
    {
        User::factory()->count(3)->create();

        $this->actingAs($this->admin())
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'email', 'roles', 'permissions', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ]);
    }

    public function test_store_creates_user_and_assigns_roles(): void
    {
        $admin = $this->admin();
        Role::findOrCreate('editor');

        $response = $this->actingAs($admin)->postJson('/api/users', [
            'name' => 'New Person',
            'email' => 'new@example.test',
            'password' => 'password1234',
            'roles' => ['editor'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('email', 'new@example.test')
            ->assertJsonPath('roles', ['editor']);

        $created = User::where('email', 'new@example.test')->first();
        $this->assertNotNull($created);
        $this->assertTrue($created->hasRole('editor'));
        $this->assertNotSame('password1234', $created->password, 'password should be hashed');
    }

    public function test_show_returns_user_with_roles(): void
    {
        $target = tap(User::factory()->create())->assignRole(Role::findOrCreate('editor'));

        $this->actingAs($this->admin())
            ->getJson("/api/users/{$target->id}")
            ->assertOk()
            ->assertJsonPath('id', $target->id)
            ->assertJsonPath('roles', ['editor']);
    }

    public function test_update_changes_attributes_and_syncs_roles(): void
    {
        $admin = $this->admin();
        Role::findOrCreate('manager');
        $target = tap(User::factory()->create(['name' => 'Old Name']))
            ->assignRole(Role::findOrCreate('editor'));

        $this->actingAs($admin)->patchJson("/api/users/{$target->id}", [
            'name' => 'Updated Name',
            'roles' => ['manager'],
        ])->assertOk()
            ->assertJsonPath('name', 'Updated Name')
            ->assertJsonPath('roles', ['manager']);

        $target->refresh();
        $this->assertSame('Updated Name', $target->name);
        $this->assertTrue($target->hasRole('manager'));
        $this->assertFalse($target->hasRole('editor'));
    }

    public function test_destroy_deletes_user(): void
    {
        $target = User::factory()->create();

        $this->actingAs($this->admin())
            ->deleteJson("/api/users/{$target->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_store_validates_input(): void
    {
        User::factory()->create(['email' => 'taken@example.test']);

        $this->actingAs($this->admin())->postJson('/api/users', [
            'name' => '',
            'email' => 'taken@example.test',
            'password' => 'short',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_user_without_permission_gets_403(): void
    {
        $this->seedPermissions();

        // Authenticated, but holds no users.* permission.
        $this->actingAs(User::factory()->create())
            ->getJson('/api/users')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_one_users_permission_does_not_grant_another(): void
    {
        $this->seedPermissions();

        $role = Role::findOrCreate('creator');
        $role->givePermissionTo('users.create');
        $actor = tap(User::factory()->create())->assignRole($role);
        $target = User::factory()->create();

        // users.create lets them POST...
        $this->actingAs($actor)->postJson('/api/users', [
            'name' => 'Made By Creator',
            'email' => 'creator-made@example.test',
            'password' => 'password1234',
        ])->assertCreated();

        // ...but not DELETE (needs users.delete).
        $this->actingAs($actor)
            ->deleteJson("/api/users/{$target->id}")
            ->assertForbidden();
    }
}
