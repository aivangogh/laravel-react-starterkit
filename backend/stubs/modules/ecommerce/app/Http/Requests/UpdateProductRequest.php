<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Validates updating a catalog product. Fields are `sometimes` so partial
 * (PATCH) updates work; the slug uniqueness check ignores the product being
 * edited. Part of the stubbed e-commerce module (see the module README).
 */
class UpdateProductRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'uuid', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('products', 'slug')->ignore($this->route('product')),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'integer', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
