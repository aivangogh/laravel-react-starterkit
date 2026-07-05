<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Validates creating a catalog product. Authorization (permission:catalog.create)
 * is gated on the route via ProductController::middleware(), so authorize()
 * stays open. `price` and `stock` are integers (minor units for price), matching
 * the unsignedInteger columns. Part of the stubbed e-commerce module.
 */
class StoreProductRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('products', 'slug')],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
