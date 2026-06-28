<?php

namespace App\Http\Requests;

/**
 * Validates creating a role. Authorization (permission:roles.create) is gated
 * on the route via RoleController::middleware(), so authorize() stays open.
 */
class StoreRoleRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            // Optional permission set assigned by permission name; each must exist.
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
