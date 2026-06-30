<?php

namespace App\Http\Requests;

use App\Actions\Fortify\PasswordValidationRules;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Facades\Hash;

/**
 * Validates the authenticated user changing their own password. The new
 * password reuses the app-wide complexity rules (PasswordValidationRules, the
 * same trait Fortify uses) and must be confirmed; the current password is
 * verified with a guard-agnostic Hash::check so it works for both the Sanctum
 * cookie session and token requests.
 */
class UpdatePasswordRequest extends ApiFormRequest
{
    use PasswordValidationRules;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => $this->passwordRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! Hash::check((string) $this->input('current_password'), (string) $this->user()->password)) {
                $validator->errors()->add(
                    'current_password',
                    __('The provided password does not match your current password.'),
                );
            }
        });
    }
}
