<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The authenticated user's own shopping cart. Part of the stubbed e-commerce
 * module. Every action is self-service — gated only by `auth:sanctum` (the
 * route group), since a user may always manage their own cart. The cart is
 * resolved from the acting user, and line mutations are ownership-checked so a
 * user can never touch another user's cart line.
 */
class CartController extends ApiController
{
    /**
     * The authenticated user's cart with its line items and their products.
     */
    public function show(Request $request): CartResource
    {
        $cart = $this->cartFor($request);

        return new CartResource($cart->load('items.product'));
    }

    /**
     * Add a product to the cart, or increment the quantity of an existing line
     * (carts are unique per cart+product). Returns the refreshed cart, 201.
     */
    public function addItem(StoreCartItemRequest $request): JsonResponse
    {
        $cart = $this->cartFor($request);
        $quantity = max(1, $request->integer('quantity', 1));

        $item = $cart->items()->firstOrNew(['product_id' => $request->validated('product_id')]);
        $item->quantity = ($item->exists ? $item->quantity : 0) + $quantity;
        $item->save();

        return (new CartResource($cart->load('items.product')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Set the quantity of a line in the authenticated user's cart. 403 if the
     * line belongs to another user's cart.
     */
    public function updateItem(UpdateCartItemRequest $request, CartItem $cartItem): CartResource
    {
        $cart = $this->authorizeLine($request, $cartItem);

        $cartItem->update(['quantity' => $request->validated('quantity')]);

        return new CartResource($cart->load('items.product'));
    }

    /**
     * Remove a line from the authenticated user's cart. 403 if the line belongs
     * to another user's cart.
     */
    public function removeItem(Request $request, CartItem $cartItem): CartResource
    {
        $cart = $this->authorizeLine($request, $cartItem);

        $cartItem->delete();

        return new CartResource($cart->load('items.product'));
    }

    /**
     * Empty the authenticated user's cart.
     */
    public function clear(Request $request): CartResource
    {
        $cart = $this->cartFor($request);
        $cart->items()->delete();

        return new CartResource($cart->load('items.product'));
    }

    /**
     * Resolve (creating if needed) the acting user's cart. The
     * `wasRecentlyCreated` flag is cleared so that reads (show/update/remove/
     * clear) always respond 200 — a JsonResource otherwise reports 201 for a
     * just-created model. `addItem` sets its 201 status explicitly.
     */
    private function cartFor(Request $request): Cart
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);
        $cart->wasRecentlyCreated = false;

        return $cart;
    }

    /**
     * Ensure the given line belongs to the acting user's cart; abort 403
     * otherwise. Returns the owning cart for convenience.
     */
    private function authorizeLine(Request $request, CartItem $cartItem): Cart
    {
        $cart = $this->cartFor($request);

        abort_unless($cartItem->cart_id === $cart->id, Response::HTTP_FORBIDDEN);

        return $cart;
    }
}
