<?php

namespace Tests\Feature\Api;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Seed the roles.* gates plus a few assignable permissions.
     */
    private function seedPermissions(): void
    {
        foreach ([
            'roles.view', 'roles.create', 'roles.update', 'roles.delete',
            'users.view', 'users.create', 'users.delete',
        ] as $name) {
            Permission::findOrCreate($name);
        }
    }

    /**
     * An acting user holding every roles.* permission.
     */
    private function admin(): User
    {
        $this->seedPermissions();

        $role = Role::findOrCreate('admin');
        $role->givePermissionTo(['roles.view', 'roles.create', 'roles.update', 'roles.delete']);

        return tap(User::factory()->create())->assignRole($role);
    }

    public function test_index_returns_paginated_roles(): void
    {
        Role::findOrCreate('editor');
        Role::findOrCreate('manager');

        $this->actingAs($this->admin())
            ->getJson('/api/roles')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'permissions']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ]);
    }

    public function test_index_filters_by_search_term(): void
    {
        Role::findOrCreate('editor');
        Role::findOrCreate('manager');

        // Case-insensitive search on the role name.
        $names = collect(
            $this->actingAs($this->admin())->getJson('/api/roles?q=EDIT')->assertOk()->json('data')
        )->pluck('name');

        $this->assertTrue($names->contains('editor'));
        $this->assertFalse($names->contains('manager'));
    }

    public function test_index_sorts_by_name_ascending_and_descending(): void
    {
        $admin = $this->admin();
        Role::findOrCreate('aaa-role');
        Role::findOrCreate('zzz-role');

        $asc = collect($this->actingAs($admin)->getJson('/api/roles?sort=name&dir=asc')->assertOk()->json('data'))
            ->pluck('name');
        $this->assertLessThan($asc->search('zzz-role'), $asc->search('aaa-role'));

        $desc = collect($this->actingAs($admin)->getJson('/api/roles?sort=name&dir=desc')->assertOk()->json('data'))
            ->pluck('name');
        $this->assertLessThan($desc->search('aaa-role'), $desc->search('zzz-role'));
    }

    public function test_index_ignores_disallowed_sort(): void
    {
        $admin = $this->admin();
        Role::findOrCreate('one');

        // A non-whitelisted / injection-y sort column is ignored, not executed.
        $this->actingAs($admin)
            ->getJson('/api/roles?'.http_build_query(['sort' => 'name); DROP TABLE roles; --', 'dir' => 'asc']))
            ->assertOk();

        $this->assertDatabaseHas('roles', ['name' => 'one']);
    }

    public function test_store_creates_role_and_syncs_permissions(): void
    {
        $response = $this->actingAs($this->admin())->postJson('/api/roles', [
            'name' => 'editor',
            'permissions' => ['users.view', 'users.create'],
        ]);

        $response->assertCreated()->assertJsonPath('name', 'editor');
        $this->assertEqualsCanonicalizing(
            ['users.view', 'users.create'],
            $response->json('permissions'),
        );

        // Query by name (not findByName) — after a Sanctum request the default
        // guard resolves to 'sanctum', but the role was created under 'web'.
        $role = Role::where('name', 'editor')->sole();
        $this->assertEqualsCanonicalizing(
            ['users.view', 'users.create'],
            $role->permissions->pluck('name')->all(),
        );
    }

    public function test_show_returns_role_with_permissions(): void
    {
        $admin = $this->admin();
        $role = tap(Role::findOrCreate('editor'))->givePermissionTo('users.view');

        $this->actingAs($admin)
            ->getJson("/api/roles/{$role->id}")
            ->assertOk()
            ->assertJsonPath('id', $role->id)
            ->assertJsonPath('permissions', ['users.view']);
    }

    public function test_update_changes_name_and_resyncs_permissions(): void
    {
        $admin = $this->admin();
        $role = tap(Role::findOrCreate('editor'))->givePermissionTo('users.view');

        $this->actingAs($admin)->patchJson("/api/roles/{$role->id}", [
            'name' => 'content-editor',
            'permissions' => ['users.create', 'users.delete'],
        ])->assertOk()->assertJsonPath('name', 'content-editor');

        $fresh = $role->fresh();
        $this->assertSame('content-editor', $fresh->name);
        $this->assertEqualsCanonicalizing(
            ['users.create', 'users.delete'],
            $fresh->permissions->pluck('name')->all(),
        );
        $this->assertNotContains('users.view', $fresh->permissions->pluck('name')->all());
    }

    public function test_destroy_deletes_role(): void
    {
        $role = Role::findOrCreate('obsolete');

        $this->actingAs($this->admin())
            ->deleteJson("/api/roles/{$role->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_store_validates_input(): void
    {
        Role::findOrCreate('existing');

        $this->actingAs($this->admin())->postJson('/api/roles', [
            'name' => 'existing',                 // duplicate
            'permissions' => ['does.not.exist'],  // unknown permission
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'permissions.0']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/roles')->assertUnauthorized();
    }

    public function test_user_without_permission_gets_403(): void
    {
        $this->seedPermissions();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/roles')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_one_roles_permission_does_not_grant_another(): void
    {
        $this->seedPermissions();

        $creatorRole = tap(Role::findOrCreate('creator'))->givePermissionTo('roles.create');
        $actor = tap(User::factory()->create())->assignRole($creatorRole);
        $target = Role::findOrCreate('victim');

        // roles.create lets them POST...
        $this->actingAs($actor)->postJson('/api/roles', ['name' => 'made-by-creator'])
            ->assertCreated();

        // ...but not DELETE (needs roles.delete).
        $this->actingAs($actor)
            ->deleteJson("/api/roles/{$target->id}")
            ->assertForbidden();
    }
}
