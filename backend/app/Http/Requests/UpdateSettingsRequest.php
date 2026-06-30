<?php

namespace App\Http\Requests;

/**
 * Validates a partial update of the `general` app settings. Every field is
 * `sometimes`, so the SPA can PATCH a single toggle; authorization is handled
 * by the `settings.update` route gate. The controller casts and assigns only
 * the keys that are present.
 */
class UpdateSettingsRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'app_name' => ['sometimes', 'required', 'string', 'max:255'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'registration_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
