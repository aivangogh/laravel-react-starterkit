<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rules\Password;

/**
 * Validates creating a user. Authorization (permission:users.create) is gated
 * on the route via UserController::middleware(), so authorize() stays open.
 */
class StoreUserRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
            // Optional role assignment by role name; each must already exist.
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
