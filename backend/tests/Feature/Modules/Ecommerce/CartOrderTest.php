<?php

namespace Tests\Feature\Modules\Ecommerce;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Cart & order half of the e-commerce module stub. Like CatalogTest, the
 * module's migrations are registered for the testing env (AppServiceProvider)
 * and its classes load via the autoload-dev classmap, so this exercises the
 * stub as if it were installed.
 */
class CartOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_module_migrations_create_the_cart_and_order_tables(): void
    {
        $this->assertTrue(Schema::hasTable('carts'));
        $this->assertTrue(Schema::hasTable('cart_items'));
        $this->assertTrue(Schema::hasTable('orders'));
        $this->assertTrue(Schema::hasTable('order_items'));
    }

    public function test_factories_produce_valid_uuid_records(): void
    {
        $cartItem = CartItem::factory()->create();
        $orderItem = OrderItem::factory()->create();

        $this->assertIsString($cartItem->id);        // uuid PK
        $this->assertIsString($orderItem->id);       // uuid PK
        $this->assertDatabaseHas('cart_items', ['id' => $cartItem->id]);
        $this->assertDatabaseHas('order_items', ['id' => $orderItem->id]);
    }

    public function test_a_guest_cart_has_no_owner(): void
    {
        $cart = Cart::factory()->guest()->create();

        $this->assertNull($cart->user_id);
        $this->assertNull($cart->user);
    }

    public function test_cart_items_relate_to_the_cart_and_a_product(): void
    {
        $cart = Cart::factory()->create();
        $product = Product::factory()->create();
        $item = CartItem::factory()->for($cart)->for($product)->create(['quantity' => 3]);

        $this->assertTrue($cart->items()->whereKey($item->getKey())->exists());
        $this->assertTrue($item->product->is($product));
        $this->assertSame(3, $item->quantity);
    }

    public function test_an_order_belongs_to_a_user_and_has_items(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user)->create();
        OrderItem::factory()->count(2)->for($order)->create();

        $this->assertTrue($order->user->is($user));
        $this->assertCount(2, $order->items);
    }

    public function test_an_order_can_be_built_from_a_cart(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->for($user)->create();

        $products = Product::factory()->count(2)->create();
        CartItem::factory()->for($cart)->for($products[0])->create(['quantity' => 2]);
        CartItem::factory()->for($cart)->for($products[1])->create(['quantity' => 1]);

        // Build an order from the cart: snapshot each line, sum the total.
        $order = Order::factory()->for($user)->create(['total' => 0]);
        $total = 0;

        foreach ($cart->items()->with('product')->get() as $item) {
            $total += $item->product->price * $item->quantity;

            $order->items()->create([
                'product_id' => $item->product_id,
                'name' => $item->product->name,
                'unit_price' => $item->product->price,
                'quantity' => $item->quantity,
            ]);
        }

        $order->update(['total' => $total]);

        $this->assertDatabaseCount('order_items', 2);
        $expectedTotal = $products[0]->price * 2 + $products[1]->price * 1;
        $this->assertSame($expectedTotal, $order->fresh()->total);

        // Line snapshots match the product at checkout time.
        $line = $order->items()->where('product_id', $products[0]->id)->sole();
        $this->assertSame($products[0]->name, $line->name);
        $this->assertSame($products[0]->price, $line->unit_price);
        $this->assertSame(2, $line->quantity);
    }

    public function test_order_line_snapshot_survives_product_deletion(): void
    {
        $product = Product::factory()->create();
        $orderItem = OrderItem::factory()->for($product)->create([
            'name' => $product->name,
            'unit_price' => $product->price,
        ]);

        $product->delete();
        $orderItem->refresh();

        $this->assertNull($orderItem->product_id);          // FK nulled out
        $this->assertSame($product->name, $orderItem->name); // snapshot intact
    }
}
