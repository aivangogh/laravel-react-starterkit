<?php

namespace App\Http\Requests;

/**
 * Validates an avatar upload. A single image file under the `avatar` key,
 * capped at 2 MB; stored into the User's single-file `avatar` media
 * collection by ProfileController.
 */
class UploadAvatarRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }
}
