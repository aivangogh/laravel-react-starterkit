<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Orders. Part of the stubbed e-commerce module. Reading, status updates and
 * deletion are back-office actions gated by the `orders.*` permissions; placing
 * an order (`store`) is a self-service checkout for the authenticated user (no
 * permission), building an Order from the user's own cart. Sits behind
 * `auth:sanctum` (the route group).
 */
class OrderController extends ApiController implements HasMiddleware
{
    /**
     * The statuses an order may be moved to. `store` always creates `pending`.
     *
     * @var list<string>
     */
    private const STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

    /**
     * Per-action permission gates. `store` is intentionally ungated — checkout
     * is self-service against the acting user's own cart.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:orders.view', only: ['index', 'show']),
            new Middleware('permission:orders.update', only: ['update']),
            new Middleware('permission:orders.delete', only: ['destroy']),
        ];
    }

    /**
     * Paginated list of every order with its line items — the shared
     * `Paginated<Order>` shape. Back-office view, gated by orders.view.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        return OrderResource::collection(
            Order::query()->with('items')->latest('id')->paginate($perPage)
        );
    }

    /**
     * Checkout: build an order from the authenticated user's cart. Each cart
     * line is snapshotted into an order line (product_id, name, unit_price,
     * quantity), the total is summed, and the cart is emptied. 422 if the cart
     * has no items. Self-service — no permission required.
     */
    public function store(Request $request): JsonResponse
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);
        $items = $cart->items()->with('product')->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart is empty.',
            ]);
        }

        $order = DB::transaction(function () use ($request, $cart, $items) {
            $total = $items->sum(fn ($item) => $item->product->price * $item->quantity);

            $order = Order::create([
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'total' => $total,
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'name' => $item->product->name,
                    'unit_price' => $item->product->price,
                    'quantity' => $item->quantity,
                ]);
            }

            $cart->items()->delete();

            return $order;
        });

        return (new OrderResource($order->load('items')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * A single order with its line items. Gated by orders.view.
     */
    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load('items'));
    }

    /**
     * Update an order's status. Gated by orders.update.
     */
    public function update(Request $request, Order $order): OrderResource
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(self::STATUSES)],
        ]);

        $order->update($validated);

        return new OrderResource($order->load('items'));
    }

    /**
     * Delete an order. Gated by orders.delete.
     */
    public function destroy(Order $order): Response
    {
        $order->delete();

        return $this->noContent();
    }
}
