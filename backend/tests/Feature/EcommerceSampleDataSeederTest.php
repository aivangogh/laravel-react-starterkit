<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\EcommerceSampleDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sample-data seeder for the e-commerce module. Exercises the module stub as if
 * installed — its migrations are registered for the testing env
 * (AppServiceProvider) and its models/factories autoload via the dev classmap
 * (composer.json). The seeder is preset-gated, so a Basic install stays empty.
 */
class EcommerceSampleDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_demo_catalogue_for_the_ecommerce_preset(): void
    {
        config(['starterkit.preset' => 'ecommerce']);

        $this->seed(EcommerceSampleDataSeeder::class);

        $this->assertGreaterThanOrEqual(3, Category::count());
        $this->assertGreaterThanOrEqual(6, Product::count());

        // Every seeded product belongs to a seeded category.
        $this->assertSame(0, Product::whereNull('category_id')->count());
        $this->assertTrue(Product::whereNotIn('category_id', Category::pluck('id'))->doesntExist());
    }

    public function test_seeds_a_sample_cart_and_snapshotted_order(): void
    {
        config(['starterkit.preset' => 'ecommerce']);

        $this->seed(EcommerceSampleDataSeeder::class);

        $customer = User::where('email', 'customer@example.com')->sole();

        $cart = Cart::where('user_id', $customer->id)->sole();
        $this->assertGreaterThan(0, $cart->items()->count());

        $order = Order::where('user_id', $customer->id)->sole();
        $this->assertGreaterThan(0, $order->items()->count());

        // The order total equals the sum of its snapshotted line items, and each
        // line snapshots a name + unit price (survives later product changes).
        $expected = $order->items->sum(fn (OrderItem $item): int => $item->unit_price * $item->quantity);
        $this->assertSame($expected, $order->total);
        $order->items->each(function (OrderItem $item): void {
            $this->assertNotEmpty($item->name);
            $this->assertGreaterThan(0, $item->unit_price);
        });
    }

    public function test_is_a_no_op_for_the_basic_preset(): void
    {
        config(['starterkit.preset' => 'basic']);

        $this->seed(EcommerceSampleDataSeeder::class);

        $this->assertSame(0, Category::count());
        $this->assertSame(0, Product::count());
        $this->assertSame(0, Cart::count());
        $this->assertSame(0, Order::count());
        $this->assertDatabaseMissing('users', ['email' => 'customer@example.com']);
    }

    public function test_reseeding_is_idempotent(): void
    {
        config(['starterkit.preset' => 'ecommerce']);

        $this->seed(EcommerceSampleDataSeeder::class);
        $categories = Category::count();
        $products = Product::count();

        $this->seed(EcommerceSampleDataSeeder::class);

        $this->assertSame($categories, Category::count());
        $this->assertSame($products, Product::count());

        // Exactly one demo customer, one cart, one order after re-running.
        $this->assertSame(1, User::where('email', 'customer@example.com')->count());
        $customer = User::where('email', 'customer@example.com')->sole();
        $this->assertSame(1, Cart::where('user_id', $customer->id)->count());
        $this->assertSame(1, Order::where('user_id', $customer->id)->count());
    }
}
