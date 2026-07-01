<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

/**
 * Interactive project provisioner. Picks a preset + optional features, records
 * the choice in config/starterkit.php, then migrates and seeds (roles /
 * permissions + a super-admin user). Re-runnable; pass --fresh to wipe first.
 *
 * Runs non-interactively (`--no-interaction`) using every default, which is
 * how the installer is exercised in tests and CI.
 */
class KitInstall extends Command
{
    protected $signature = 'kit:install {--fresh : Drop all tables and migrate from scratch before seeding}';

    protected $description = 'Provision the starter kit: choose a preset + features, seed roles/permissions and a super-admin.';

    public function handle(): int
    {
        $preset = select(
            label: 'Choose a preset',
            options: ['basic' => 'Basic', 'ecommerce' => 'E-commerce'],
            default: 'basic',
        );

        $features = [
            'activity_log' => confirm('Enable activity log?', default: true),
            'media' => confirm('Enable media uploads (avatars)?', default: true),
            'api_tokens' => confirm('Enable API tokens?', default: true),
            'settings' => confirm('Enable app settings?', default: true),
        ];

        $adminEmail = text('Admin email', default: 'admin@example.com', required: true);
        $adminPassword = text('Admin password', default: 'password', required: true);

        // Persist the install state for future processes (seeders + SPA)...
        $this->writeConfig($preset, $features);

        // ...and apply it to the current process so the seeder below sees the
        // chosen features and admin credentials (creds are never written to disk).
        config([
            'starterkit.preset' => $preset,
            'starterkit.features' => $features,
            'starterkit.admin.email' => $adminEmail,
            'starterkit.admin.password' => $adminPassword,
        ]);

        $this->call($this->option('fresh') ? 'migrate:fresh' : 'migrate', ['--force' => true]);
        $this->call('db:seed', ['--force' => true]);

        if ($preset === 'ecommerce') {
            $this->components->warn(
                'E-commerce module ships in a later phase — preset recorded, but only Basic roles/permissions were seeded.'
            );
        }

        $this->newLine();
        $this->components->info('Starter kit installed.');
        $this->components->twoColumnDetail('Admin', $adminEmail.' / '.$adminPassword);
        $this->components->twoColumnDetail('Next', 'run `pnpm dev` and sign in');

        return self::SUCCESS;
    }

    /**
     * Rewrite config/starterkit.php with the chosen preset + features.
     */
    private function writeConfig(string $preset, array $features): void
    {
        $featureLines = collect($features)
            ->map(fn (bool $enabled, string $key): string => "        '{$key}' => ".($enabled ? 'true' : 'false').',')
            ->implode("\n");

        $contents = "<?php\n\n"
            ."// Written by `php artisan kit:install`. Records what was provisioned so the\n"
            ."// seeders and SPA enable only the installed features. Re-run to change it.\n\n"
            ."return [\n"
            ."    // 'basic' | 'ecommerce'\n"
            ."    'preset' => '{$preset}',\n\n"
            ."    'features' => [\n"
            ."{$featureLines}\n"
            ."    ],\n"
            ."];\n";

        file_put_contents(config_path('starterkit.php'), $contents);
    }
}
