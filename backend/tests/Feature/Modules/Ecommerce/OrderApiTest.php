<?php

namespace Tests\Feature\Modules\Ecommerce;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Order API. Checkout (`store`) is self-service against the acting user's cart;
 * reading, status updates and deletion are back-office actions gated by the
 * `orders.*` permissions. Exercises the e-commerce module stub as if installed.
 */
class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create the three orders.* permissions.
     */
    private function seedPermissions(): void
    {
        foreach (['orders.view', 'orders.update', 'orders.delete'] as $name) {
            Permission::findOrCreate($name);
        }
    }

    /**
     * An acting user holding every orders.* permission.
     */
    private function admin(): User
    {
        $this->seedPermissions();

        $role = Role::findOrCreate('orders-admin');
        $role->givePermissionTo(['orders.view', 'orders.update', 'orders.delete']);

        return tap(User::factory()->create())->assignRole($role);
    }

    /**
     * Seed a cart with two priced lines for the given user.
     *
     * @return array{cart: Cart, total: int}
     */
    private function seedCart(User $user): array
    {
        $cart = Cart::factory()->for($user)->create();
        $p1 = Product::factory()->create(['price' => 1000]);
        $p2 = Product::factory()->create(['price' => 250]);
        CartItem::factory()->for($cart)->for($p1)->create(['quantity' => 2]);
        CartItem::factory()->for($cart)->for($p2)->create(['quantity' => 1]);

        return ['cart' => $cart, 'total' => 1000 * 2 + 250 * 1];
    }

    // --- Checkout (self-service) -----------------------------------------

    public function test_checkout_builds_an_order_from_the_cart_and_empties_it(): void
    {
        $user = User::factory()->create();
        ['total' => $total] = $this->seedCart($user);

        $this->actingAs($user)->postJson('/api/orders')
            ->assertCreated()
            ->assertJsonPath('user_id', $user->id)
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('total', $total)
            ->assertJsonCount(2, 'items');

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 2);
        // Cart is emptied on checkout.
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_checkout_snapshots_product_name_and_price(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->for($user)->create();
        $product = Product::factory()->create(['name' => 'Snapshot Me', 'price' => 777]);
        CartItem::factory()->for($cart)->for($product)->create(['quantity' => 3]);

        $this->actingAs($user)->postJson('/api/orders')->assertCreated();

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'name' => 'Snapshot Me',
            'unit_price' => 777,
            'quantity' => 3,
        ]);
    }

    public function test_checkout_with_an_empty_cart_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/orders')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cart']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_requires_no_permission(): void
    {
        // A plain authenticated user (no orders.* permission) can still check out.
        $user = User::factory()->create();
        $this->seedCart($user);

        $this->actingAs($user)->postJson('/api/orders')->assertCreated();
    }

    // --- Reading (orders.view) -------------------------------------------

    public function test_index_lists_orders_for_a_permitted_user(): void
    {
        Order::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->getJson('/api/orders')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'user_id', 'status', 'total', 'items']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ]);
    }

    public function test_show_returns_an_order_with_items(): void
    {
        $order = Order::factory()->create();

        $this->actingAs($this->admin())
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('id', $order->id);
    }

    public function test_index_requires_orders_view(): void
    {
        $this->seedPermissions();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/orders')
            ->assertForbidden();
    }

    // --- Status update (orders.update) -----------------------------------

    public function test_update_changes_the_order_status(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $this->actingAs($this->admin())
            ->patchJson("/api/orders/{$order->id}", ['status' => 'shipped'])
            ->assertOk()
            ->assertJsonPath('status', 'shipped');

        $this->assertSame('shipped', $order->fresh()->status);
    }

    public function test_update_validates_the_status(): void
    {
        $order = Order::factory()->create();

        $this->actingAs($this->admin())
            ->patchJson("/api/orders/{$order->id}", ['status' => 'bogus'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_update_requires_orders_update(): void
    {
        $this->seedPermissions();
        $order = Order::factory()->create();

        $this->actingAs(User::factory()->create())
            ->patchJson("/api/orders/{$order->id}", ['status' => 'shipped'])
            ->assertForbidden();
    }

    // --- Deletion (orders.delete) ----------------------------------------

    public function test_destroy_deletes_an_order(): void
    {
        $order = Order::factory()->create();

        $this->actingAs($this->admin())
            ->deleteJson("/api/orders/{$order->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_destroy_requires_orders_delete(): void
    {
        $this->seedPermissions();
        $order = Order::factory()->create();

        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/orders')->assertUnauthorized();
    }
}
