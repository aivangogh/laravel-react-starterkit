<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Validates updating a role. `name` is partial (sometimes) and its uniqueness
 * check ignores the role being edited; `permissions` (when present) replaces
 * the role's current permission set.
 */
class UpdateRoleRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('roles', 'name')->ignore($this->route('role')),
            ],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
