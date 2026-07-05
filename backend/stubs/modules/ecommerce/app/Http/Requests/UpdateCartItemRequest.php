<?php

namespace App\Http\Requests;

/**
 * Validates changing the quantity of a line in the authenticated user's cart.
 * Self-service (no permission gate); the controller enforces that the line
 * belongs to the acting user's cart. Part of the stubbed e-commerce module.
 */
class UpdateCartItemRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
