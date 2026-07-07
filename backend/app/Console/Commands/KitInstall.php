<?php

namespace App\Console\Commands;

use App\Installer\ModulePublisher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

/**
 * Interactive project provisioner. Picks a preset + optional features, records the choice in
 * config/starterkit.php, publishes the chosen module's stub into the app, then migrates and seeds
 * (roles / permissions + a super-admin user, plus demo data for e-commerce). Re-runnable; pass
 * --fresh to wipe first.
 *
 * Runs non-interactively (`--no-interaction`) using every default, which is how the installer is
 * exercised by `scripts/setup.mjs`, the scaffolder, and CI.
 */
class KitInstall extends Command
{
    protected $signature = 'kit:install
        {--fresh : Drop all tables and migrate from scratch before seeding}
        {--preset= : basic|ecommerce — skips the preset prompt (for setup.mjs / CI)}';

    protected $description = 'Provision the starter kit: choose a preset + features, publish modules, seed roles/permissions and a super-admin.';

    public function handle(): int
    {
        $preset = $this->option('preset') ?: select(
            label: 'Choose a preset',
            options: ['basic' => 'Basic', 'ecommerce' => 'E-commerce'],
            default: 'basic',
        );

        if (! in_array($preset, ['basic', 'ecommerce'], true)) {
            $this->components->error("Unknown preset '{$preset}'. Use 'basic' or 'ecommerce'.");

            return self::FAILURE;
        }

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

        // ...and apply it to the current process so an in-process seed sees the chosen features and
        // admin credentials (creds are never written to disk).
        config([
            'starterkit.preset' => $preset,
            'starterkit.features' => $features,
            'starterkit.admin.email' => $adminEmail,
            'starterkit.admin.password' => $adminPassword,
        ]);

        // Publish optional module stubs BEFORE migrating so their migrations are in place. A fresh
        // publish MOVES App\ classes that were reachable only via the autoload-dev classmap, which
        // invalidates THIS process's autoloader — so when a publish actually happens we migrate +
        // seed in a subprocess that loads the regenerated autoloader (see migrateAndSeedFresh).
        $freshlyPublished = $preset === 'ecommerce' && $this->publishModule('ecommerce');

        if ($freshlyPublished) {
            $this->migrateAndSeedFresh($adminEmail, $adminPassword);
        } else {
            $this->call($this->option('fresh') ? 'migrate:fresh' : 'migrate', ['--force' => true]);
            $this->call('db:seed', ['--force' => true]);
        }

        $this->newLine();
        $this->components->info('Starter kit installed.');
        $this->components->twoColumnDetail('Preset', $preset);
        $this->components->twoColumnDetail('Admin', $adminEmail.' / '.$adminPassword);
        $this->components->twoColumnDetail('Next', 'run `pnpm dev` and sign in');

        return self::SUCCESS;
    }

    /**
     * Move a module's stub into the app. Returns true only when it published on THIS run (already
     * published → false, so the caller keeps the fast in-process migrate/seed path).
     */
    private function publishModule(string $module): bool
    {
        if (! ModulePublisher::make()->publish($module)) {
            $this->components->info("The {$module} module is already installed.");

            return false;
        }

        $this->components->info("Published the {$module} module into the app.");
        $this->dumpAutoload();

        return true;
    }

    /**
     * Regenerate Composer's autoloader so the classmap drops the moved-away stub paths and PSR-4
     * picks the module classes up from app/. Best-effort: warn (don't fail) if Composer is absent.
     */
    private function dumpAutoload(): void
    {
        if (! Process::path(base_path())->run('composer dump-autoload')->successful()) {
            $this->components->warn('Could not run `composer dump-autoload` — run it manually so the module classes autoload.');
        }
    }

    /**
     * Migrate + seed in a fresh PHP process. Needed right after a publish because the moved classes
     * are not loadable in the current process. Admin credentials ride along as env vars (they are
     * never written to disk) so the seeded super-admin still matches the operator's answers.
     */
    private function migrateAndSeedFresh(string $adminEmail, string $adminPassword): void
    {
        $migrate = $this->option('fresh') ? 'migrate:fresh' : 'migrate';
        $env = [
            'STARTERKIT_ADMIN_EMAIL' => $adminEmail,
            'STARTERKIT_ADMIN_PASSWORD' => $adminPassword,
        ];

        foreach ([[$migrate, '--force'], ['db:seed', '--force']] as $args) {
            $result = Process::path(base_path())
                ->env($env)
                ->run(array_merge([PHP_BINARY, 'artisan'], $args), function (string $type, string $output) {
                    $this->output->write($output);
                });

            if (! $result->successful()) {
                $this->components->error('`php artisan '.implode(' ', $args).'` failed.');
            }
        }
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
