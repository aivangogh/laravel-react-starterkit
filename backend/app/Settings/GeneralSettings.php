<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

/**
 * Application-wide settings (the `general` group), persisted by
 * spatie/laravel-settings. Initial values + the property schema are seeded by
 * the matching settings migration in database/settings; read/written through
 * the API by SettingsController. Mirrors the shared `GeneralSettings` type.
 */
class GeneralSettings extends Settings
{
    public string $app_name;

    public ?string $support_email;

    public bool $registration_enabled;

    public static function group(): string
    {
        return 'general';
    }
}
