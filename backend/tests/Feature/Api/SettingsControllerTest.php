<?php

namespace Tests\Feature\Api;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An acting user holding the given settings.* permissions.
     *
     * @param  list<string>  $permissions
     */
    private function userWith(array $permissions): User
    {
        foreach ($permissions as $name) {
            Permission::findOrCreate($name);
        }

        $role = Role::findOrCreate('admin');
        $role->givePermissionTo($permissions);

        return tap(User::factory()->create())->assignRole($role);
    }

    public function test_show_returns_settings(): void
    {
        $this->actingAs($this->userWith(['settings.view']))
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonStructure(['app_name', 'support_email', 'registration_enabled'])
            ->assertJsonPath('registration_enabled', true);
    }

    public function test_update_persists_changes(): void
    {
        $this->actingAs($this->userWith(['settings.update']))
            ->putJson('/api/settings', [
                'app_name' => 'Acme Starter',
                'support_email' => 'help@acme.test',
                'registration_enabled' => false,
            ])
            ->assertOk()
            ->assertJsonPath('app_name', 'Acme Starter')
            ->assertJsonPath('support_email', 'help@acme.test')
            ->assertJsonPath('registration_enabled', false);

        $settings = app(GeneralSettings::class);
        $this->assertSame('Acme Starter', $settings->app_name);
        $this->assertFalse($settings->registration_enabled);
    }

    public function test_update_validates_input(): void
    {
        $this->actingAs($this->userWith(['settings.update']))
            ->putJson('/api/settings', ['support_email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['support_email']);
    }

    public function test_show_requires_settings_view_permission(): void
    {
        Permission::findOrCreate('settings.view');

        $this->actingAs(User::factory()->create())
            ->getJson('/api/settings')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_update_requires_settings_update_permission(): void
    {
        // Holds only the read permission — must not be able to write.
        $this->actingAs($this->userWith(['settings.view']))
            ->putJson('/api/settings', ['app_name' => 'Nope'])
            ->assertForbidden();
    }

    public function test_settings_endpoints_require_authentication(): void
    {
        $this->getJson('/api/settings')->assertUnauthorized();
    }
}
