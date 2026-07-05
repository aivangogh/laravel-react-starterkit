<?php

namespace App\Http\Resources;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Cart
 *
 * Serializes the authenticated user's cart for the API. Part of the stubbed
 * e-commerce module. `items` is nested when loaded; `total` is the live sum of
 * each line's (product price * quantity), in minor units (cents), and is only
 * present once `items.product` is eager-loaded.
 */
class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'total' => $this->when(
                $this->relationLoaded('items'),
                fn () => $this->items->sum(fn ($item) => (int) ($item->product?->price ?? 0) * $item->quantity)
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
