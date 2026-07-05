<?php

namespace Tests\Feature\Modules\Ecommerce;

use App\Models\Category;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Catalog API (categories + products): CRUD, `catalog.*` permission gating and
 * validation. Exercises the e-commerce module stub as if installed — its
 * migrations are registered for the testing env (AppServiceProvider), its routes
 * loaded from the stub (routes/api.php), and its classes autoloaded via the
 * autoload-dev classmap.
 */
class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create the four catalog.* permissions.
     */
    private function seedPermissions(): void
    {
        foreach (['catalog.view', 'catalog.create', 'catalog.update', 'catalog.delete'] as $name) {
            Permission::findOrCreate($name);
        }
    }

    /**
     * An acting user holding every catalog.* permission.
     */
    private function admin(): User
    {
        $this->seedPermissions();

        $role = Role::findOrCreate('catalog-admin');
        $role->givePermissionTo(['catalog.view', 'catalog.create', 'catalog.update', 'catalog.delete']);

        return tap(User::factory()->create())->assignRole($role);
    }

    // --- Categories -------------------------------------------------------

    public function test_index_returns_paginated_categories(): void
    {
        Category::factory()->count(3)->create();

        $this->actingAs($this->admin())
            ->getJson('/api/categories')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'slug', 'description', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ]);
    }

    public function test_store_creates_category(): void
    {
        $this->actingAs($this->admin())->postJson('/api/categories', [
            'name' => 'Beverages',
            'slug' => 'beverages',
            'description' => 'Drinks and such',
        ])->assertCreated()
            ->assertJsonPath('name', 'Beverages')
            ->assertJsonPath('slug', 'beverages');

        $this->assertDatabaseHas('categories', ['slug' => 'beverages']);
    }

    public function test_show_returns_category(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin())
            ->getJson("/api/categories/{$category->id}")
            ->assertOk()
            ->assertJsonPath('id', $category->id);
    }

    public function test_update_changes_category(): void
    {
        $category = Category::factory()->create(['name' => 'Old']);

        $this->actingAs($this->admin())
            ->patchJson("/api/categories/{$category->id}", ['name' => 'New'])
            ->assertOk()
            ->assertJsonPath('name', 'New');

        $this->assertSame('New', $category->fresh()->name);
    }

    public function test_destroy_deletes_category(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin())
            ->deleteJson("/api/categories/{$category->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_store_validates_category_input(): void
    {
        $existing = Category::factory()->create();

        $this->actingAs($this->admin())->postJson('/api/categories', [
            'name' => '',
            'slug' => $existing->slug, // duplicate
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'slug']);
    }

    // --- Products ---------------------------------------------------------

    public function test_index_returns_paginated_products(): void
    {
        Product::factory()->count(3)->create();

        $this->actingAs($this->admin())
            ->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'category_id', 'name', 'slug', 'price', 'stock', 'is_active', 'image_url']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ]);
    }

    public function test_store_creates_product(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin())->postJson('/api/products', [
            'category_id' => $category->id,
            'name' => 'Coffee Mug',
            'slug' => 'coffee-mug',
            'description' => 'A sturdy mug',
            'price' => 1500,
            'stock' => 42,
            'is_active' => true,
        ])->assertCreated()
            ->assertJsonPath('name', 'Coffee Mug')
            ->assertJsonPath('price', 1500)
            ->assertJsonPath('category.id', $category->id);

        $this->assertDatabaseHas('products', ['slug' => 'coffee-mug', 'price' => 1500]);
    }

    public function test_show_returns_product_with_category(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin())
            ->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('id', $product->id)
            ->assertJsonPath('category.id', $product->category_id);
    }

    public function test_update_changes_product(): void
    {
        $product = Product::factory()->create(['price' => 100]);

        $this->actingAs($this->admin())
            ->patchJson("/api/products/{$product->id}", ['price' => 999])
            ->assertOk()
            ->assertJsonPath('price', 999);

        $this->assertSame(999, $product->fresh()->price);
    }

    public function test_destroy_deletes_product(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin())
            ->deleteJson("/api/products/{$product->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_store_validates_product_input(): void
    {
        $this->actingAs($this->admin())->postJson('/api/products', [
            'name' => '',
            'category_id' => 'not-a-real-category',
            'price' => -5,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'slug', 'category_id', 'price']);
    }

    // --- Authorization ----------------------------------------------------

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/categories')->assertUnauthorized();
        $this->getJson('/api/products')->assertUnauthorized();
    }

    public function test_user_without_permission_gets_403(): void
    {
        $this->seedPermissions();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/categories')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_catalog_view_does_not_grant_create(): void
    {
        $this->seedPermissions();

        $role = Role::findOrCreate('catalog-viewer');
        $role->givePermissionTo('catalog.view');
        $actor = tap(User::factory()->create())->assignRole($role);
        $category = Category::factory()->create();

        // view is allowed...
        $this->actingAs($actor)->getJson('/api/categories')->assertOk();

        // ...but create/update/delete are not.
        $this->actingAs($actor)->postJson('/api/categories', [
            'name' => 'Nope', 'slug' => 'nope',
        ])->assertForbidden();

        $this->actingAs($actor)
            ->deleteJson("/api/categories/{$category->id}")
            ->assertForbidden();
    }
}
