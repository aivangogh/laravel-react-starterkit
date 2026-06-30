<?php

namespace App\Http\Resources;

use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GeneralSettings
 *
 * Serializes the `general` app settings for the API. Mirrors the shared
 * `GeneralSettings` type in `@app/types` — keep the two in sync.
 */
class SettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'app_name' => $this->app_name,
            'support_email' => $this->support_email,
            'registration_enabled' => $this->registration_enabled,
        ];
    }
}
