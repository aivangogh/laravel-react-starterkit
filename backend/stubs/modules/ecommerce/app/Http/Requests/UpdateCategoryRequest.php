<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Validates updating a catalog category. Fields are `sometimes` so partial
 * (PATCH) updates work; the slug uniqueness check ignores the category being
 * edited. Part of the stubbed e-commerce module (see the module README).
 */
class UpdateCategoryRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('categories', 'slug')->ignore($this->route('category')),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
