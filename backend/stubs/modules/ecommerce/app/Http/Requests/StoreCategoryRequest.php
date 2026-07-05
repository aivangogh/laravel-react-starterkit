<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Validates creating a catalog category. Authorization (permission:catalog.create)
 * is gated on the route via CategoryController::middleware(), so authorize()
 * stays open. Part of the stubbed e-commerce module (see the module README).
 */
class StoreCategoryRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('categories', 'slug')],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
