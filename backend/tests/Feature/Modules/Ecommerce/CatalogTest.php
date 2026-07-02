<?php

namespace Tests\Feature\Modules\Ecommerce;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Catalog half of the e-commerce module stub. The module's migrations are
 * registered for the testing env (AppServiceProvider) and its classes load via
 * the autoload-dev classmap, so this exercises the stub as if it were installed.
 */
class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_module_migrations_create_the_catalog_tables(): void
    {
        $this->assertTrue(Schema::hasTable('categories'));
        $this->assertTrue(Schema::hasTable('products'));
    }

    public function test_category_factory_produces_a_valid_record(): void
    {
        $category = Category::factory()->create();

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
        $this->assertIsString($category->id);        // uuid PK
        $this->assertNotEmpty($category->slug);
    }

    public function test_product_factory_produces_a_valid_record_with_a_category(): void
    {
        $product = Product::factory()->create();

        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $this->assertIsString($product->id);         // uuid PK
        $this->assertIsInt($product->price);         // cast to int (minor units)
        $this->assertTrue($product->is_active);
        $this->assertNotNull($product->category);    // auto-created category
    }

    public function test_category_and_product_relationships(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->for($category)->create();

        $this->assertTrue($product->category->is($category));
        $this->assertTrue($category->products()->whereKey($product->getKey())->exists());
    }

    public function test_product_can_hold_images_in_its_media_collection(): void
    {
        Storage::fake('public');

        $product = Product::factory()->withImage()->create();

        $this->assertCount(1, $product->getMedia('images'));
    }
}
