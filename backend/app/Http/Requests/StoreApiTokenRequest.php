<?php

namespace App\Http\Requests;

/**
 * Validates creating a personal access token. `name` labels the token in the
 * UI; `abilities` is optional and scopes what the token may do (defaults to
 * full access `['*']` in the controller when omitted).
 */
class StoreApiTokenRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'abilities' => ['sometimes', 'array'],
            'abilities.*' => ['string', 'max:255'],
        ];
    }
}
