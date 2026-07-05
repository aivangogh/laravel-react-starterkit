<?php

namespace Tests\Feature\Modules\Ecommerce;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Cart API: the authenticated user's own cart. Self-service (no permission gate
 * beyond auth:sanctum); line mutations are ownership-checked. Exercises the
 * e-commerce module stub as if installed (migrations registered for the testing
 * env, routes loaded from the stub, classes autoloaded via the dev classmap).
 */
class CartApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_creates_and_returns_the_users_cart(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('user_id', $user->id)
            ->assertJsonStructure(['id', 'user_id', 'items', 'total']);

        $this->assertDatabaseHas('carts', ['user_id' => $user->id]);
    }

    public function test_add_item_adds_a_product_line(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertCreated()
            ->assertJsonPath('items.0.product_id', $product->id)
            ->assertJsonPath('items.0.quantity', 2);

        $this->assertDatabaseHas('cart_items', ['product_id' => $product->id, 'quantity' => 2]);
    }

    public function test_add_item_increments_an_existing_line(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $this->actingAs($user)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 3])
            ->assertCreated();

        // A single line, quantities summed (unique per cart+product).
        $this->assertDatabaseCount('cart_items', 1);
        $this->assertDatabaseHas('cart_items', ['product_id' => $product->id, 'quantity' => 5]);
    }

    public function test_add_item_defaults_quantity_to_one(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/cart/items', ['product_id' => $product->id])
            ->assertCreated()
            ->assertJsonPath('items.0.quantity', 1);
    }

    public function test_update_item_sets_the_quantity(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->for($user)->create();
        $item = CartItem::factory()->for($cart)->create(['quantity' => 1]);

        $this->actingAs($user)
            ->putJson("/api/cart/items/{$item->id}", ['quantity' => 7])
            ->assertOk();

        $this->assertSame(7, $item->fresh()->quantity);
    }

    public function test_remove_item_deletes_the_line(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->for($user)->create();
        $item = CartItem::factory()->for($cart)->create();

        $this->actingAs($user)
            ->deleteJson("/api/cart/items/{$item->id}")
            ->assertOk();

        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    }

    public function test_clear_empties_the_cart(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->for($user)->create();
        CartItem::factory()->count(3)->for($cart)->create();

        $this->actingAs($user)
            ->deleteJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('items', []);

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_cannot_update_another_users_line(): void
    {
        $owner = User::factory()->create();
        $cart = Cart::factory()->for($owner)->create();
        $item = CartItem::factory()->for($cart)->create(['quantity' => 1]);

        $this->actingAs(User::factory()->create())
            ->putJson("/api/cart/items/{$item->id}", ['quantity' => 99])
            ->assertForbidden();

        $this->assertSame(1, $item->fresh()->quantity);
    }

    public function test_cannot_remove_another_users_line(): void
    {
        $owner = User::factory()->create();
        $cart = Cart::factory()->for($owner)->create();
        $item = CartItem::factory()->for($cart)->create();

        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/cart/items/{$item->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('cart_items', ['id' => $item->id]);
    }

    public function test_add_item_requires_a_valid_product(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/cart/items', [
            'product_id' => 'not-a-real-product',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['product_id']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/cart')->assertUnauthorized();
    }
}
