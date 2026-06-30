<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

/**
 * Seeds the `general` settings group consumed by App\Settings\GeneralSettings.
 * Runs with the regular `migrate` (spatie registers this path), so it also
 * applies under RefreshDatabase in tests.
 */
return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.app_name', config('app.name', 'Laravel'));
        $this->migrator->add('general.support_email', null);
        $this->migrator->add('general.registration_enabled', true);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.app_name');
        $this->migrator->deleteIfExists('general.support_email');
        $this->migrator->deleteIfExists('general.registration_enabled');
    }
};
