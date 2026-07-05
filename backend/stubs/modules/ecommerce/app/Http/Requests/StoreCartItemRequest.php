<?php

namespace App\Http\Requests;

/**
 * Validates adding a product line to the authenticated user's cart. Self-service
 * (no permission gate) — authorize() stays open and the controller resolves the
 * cart from the acting user. Part of the stubbed e-commerce module.
 */
class StoreCartItemRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
