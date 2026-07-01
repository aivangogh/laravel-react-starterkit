<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\PendingCommand;
use Tests\TestCase;

/**
 * Exercises `kit:install` by answering its Laravel Prompts (which fall back to
 * the console question helpers under test). The command rewrites
 * config/starterkit.php, so each test backs up and restores it.
 */
class KitInstallCommandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Drive the install prompts with the Basic preset, every feature on, and
     * the default admin credentials.
     */
    private function runInstall(): PendingCommand
    {
        return $this->artisan('kit:install')
            ->expectsQuestion('Choose a preset', 'basic')
            ->expectsConfirmation('Enable activity log?', 'yes')
            ->expectsConfirmation('Enable media uploads (avatars)?', 'yes')
            ->expectsConfirmation('Enable API tokens?', 'yes')
            ->expectsConfirmation('Enable app settings?', 'yes')
            ->expectsQuestion('Admin email', 'admin@example.com')
            ->expectsQuestion('Admin password', 'password');
    }

    public function test_install_seeds_rbac_and_creates_super_admin(): void
    {
        $configPath = config_path('starterkit.php');
        $original = file_get_contents($configPath);

        try {
            $this->runInstall()->assertSuccessful();

            $this->assertDatabaseHas('permissions', ['name' => 'users.view', 'guard_name' => 'web']);
            $this->assertDatabaseHas('roles', ['name' => 'super-admin', 'guard_name' => 'web']);

            $admin = User::where('email', 'admin@example.com')->sole();
            $this->assertTrue($admin->hasRole('super-admin'));
        } finally {
            file_put_contents($configPath, $original);
        }
    }

    public function test_install_writes_the_chosen_state_to_config(): void
    {
        $configPath = config_path('starterkit.php');
        $original = file_get_contents($configPath);

        try {
            $this->runInstall()->assertSuccessful();

            $written = file_get_contents($configPath);
            $this->assertStringContainsString("'preset' => 'basic'", $written);
            $this->assertStringContainsString("'activity_log' => true", $written);
        } finally {
            file_put_contents($configPath, $original);
        }
    }
}
