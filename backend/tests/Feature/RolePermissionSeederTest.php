<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionSeederTest extends TestCase
{
    use RefreshDatabase;

    /** The permission catalogue the API controllers actually enforce. */
    private const ENFORCED = [
        'users.view', 'users.create', 'users.update', 'users.delete',
        'roles.view', 'roles.create', 'roles.update', 'roles.delete',
        'activity.view', 'settings.view', 'settings.update',
    ];

    /** Catalogue the e-commerce module controllers enforce — preset-gated. */
    private const ECOMMERCE = [
        'catalog.view', 'catalog.create', 'catalog.update', 'catalog.delete',
        'orders.view', 'orders.update', 'orders.delete',
    ];

    public function test_seeds_the_enforced_catalogue_and_roles(): void
    {
        $this->seed(RolePermissionSeeder::class);

        foreach (self::ENFORCED as $name) {
            $this->assertDatabaseHas('permissions', ['name' => $name, 'guard_name' => 'web']);
        }
        $this->assertSame(count(self::ENFORCED), Permission::count());

        foreach (['super-admin', 'admin', 'user'] as $role) {
            $this->assertDatabaseHas('roles', ['name' => $role, 'guard_name' => 'web']);
        }
        $this->assertSame(3, Role::count());
    }

    public function test_admin_gets_every_permission_and_user_gets_none(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $this->assertEqualsCanonicalizing(
            self::ENFORCED,
            Role::findByName('admin', 'web')->permissions->pluck('name')->all(),
        );
        $this->assertCount(0, Role::findByName('user', 'web')->permissions);
    }

    public function test_super_admin_bypasses_permission_checks(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $superAdmin = tap(User::factory()->create())->assignRole('super-admin');

        // Every ability — even ones no one was granted — passes for super-admin.
        $this->assertTrue($superAdmin->can('users.view'));
        $this->assertTrue($superAdmin->can('nonexistent.ability'));

        // And it flows through Spatie's `permission:*` middleware (canAny -> Gate).
        $this->actingAs($superAdmin)->getJson('/api/users')->assertOk();
    }

    public function test_feature_flags_gate_which_permissions_are_seeded(): void
    {
        config(['starterkit.features' => [
            'activity_log' => false,
            'media' => true,
            'api_tokens' => true,
            'settings' => false,
        ]]);

        $this->seed(RolePermissionSeeder::class);

        $this->assertDatabaseMissing('permissions', ['name' => 'activity.view']);
        $this->assertDatabaseMissing('permissions', ['name' => 'settings.view']);
        $this->assertDatabaseMissing('permissions', ['name' => 'settings.update']);
        $this->assertDatabaseHas('permissions', ['name' => 'users.view']);
    }

    public function test_reseeding_is_idempotent(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $this->seed(RolePermissionSeeder::class);

        $this->assertSame(count(self::ENFORCED), Permission::count());
        $this->assertSame(3, Role::count());
        $this->assertCount(count(self::ENFORCED), Role::findByName('admin', 'web')->permissions);
    }

    public function test_ecommerce_preset_seeds_catalog_and_orders_permissions_for_admin(): void
    {
        config(['starterkit.preset' => 'ecommerce']);

        $this->seed(RolePermissionSeeder::class);

        foreach (self::ECOMMERCE as $name) {
            $this->assertDatabaseHas('permissions', ['name' => $name, 'guard_name' => 'web']);
        }

        // Admin holds core + feature + the ecommerce catalogue; user still none.
        $this->assertEqualsCanonicalizing(
            array_merge(self::ENFORCED, self::ECOMMERCE),
            Role::findByName('admin', 'web')->permissions->pluck('name')->all(),
        );
        $this->assertCount(0, Role::findByName('user', 'web')->permissions);
    }

    public function test_basic_preset_does_not_seed_ecommerce_permissions(): void
    {
        config(['starterkit.preset' => 'basic']);

        $this->seed(RolePermissionSeeder::class);

        foreach (self::ECOMMERCE as $name) {
            $this->assertDatabaseMissing('permissions', ['name' => $name]);
        }
        $this->assertSame(count(self::ENFORCED), Permission::count());
    }

    public function test_ecommerce_permission_seeding_is_idempotent(): void
    {
        config(['starterkit.preset' => 'ecommerce']);

        $this->seed(RolePermissionSeeder::class);
        $this->seed(RolePermissionSeeder::class);

        $expected = count(self::ENFORCED) + count(self::ECOMMERCE);
        $this->assertSame($expected, Permission::count());
        $this->assertCount($expected, Role::findByName('admin', 'web')->permissions);
    }

    public function test_database_seeder_creates_the_super_admin_account(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@example.com')->sole();
        $this->assertTrue($admin->hasRole('super-admin'));

        // Re-running does not duplicate the account.
        $this->seed(DatabaseSeeder::class);
        $this->assertSame(1, User::where('email', 'admin@example.com')->count());
    }
}
