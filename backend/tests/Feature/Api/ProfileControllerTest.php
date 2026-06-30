<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The profile endpoints are self-service: any authenticated user manages their
 * own name/email, password and avatar. No extra permission is required.
 */
class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile_changes_name_and_email(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => 'Renamed',
                'email' => 'renamed@example.com',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Renamed')
            ->assertJsonPath('email', 'renamed@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Renamed',
            'email' => 'renamed@example.com',
        ]);
    }

    public function test_update_profile_requires_name_and_email(): void
    {
        $this->actingAs(User::factory()->create())
            ->putJson('/api/profile', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_update_profile_rejects_email_taken_by_another_user(): void
    {
        $other = User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => $user->name,
                'email' => 'taken@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertNotSame('taken@example.com', $user->fresh()->email);
        $this->assertSame('taken@example.com', $other->fresh()->email);
    }

    public function test_change_password_with_correct_current_password(): void
    {
        $user = User::factory()->create(); // factory password is "password"

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'new-secret-password',
                'password_confirmation' => 'new-secret-password',
            ])
            ->assertNoContent();

        $this->assertTrue(Hash::check('new-secret-password', $user->fresh()->password));
    }

    public function test_change_password_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'not-my-password',
                'password' => 'new-secret-password',
                'password_confirmation' => 'new-secret-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_change_password_requires_confirmation(): void
    {
        $this->actingAs(User::factory()->create())
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'new-secret-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_upload_avatar_stores_media_and_exposes_url(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(
            '/api/profile/avatar',
            ['avatar' => UploadedFile::fake()->image('avatar.jpg')],
            ['Accept' => 'application/json'],
        );

        $response->assertOk();
        $this->assertNotNull($response->json('avatar_url'));
        $this->assertCount(1, $user->fresh()->getMedia('avatar'));
    }

    public function test_upload_avatar_rejects_non_image(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->create())->post(
            '/api/profile/avatar',
            ['avatar' => UploadedFile::fake()->create('resume.pdf', 64, 'application/pdf')],
            ['Accept' => 'application/json'],
        )->assertUnprocessable()->assertJsonValidationErrors(['avatar']);
    }

    public function test_remove_avatar_clears_media(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))->toMediaCollection('avatar');

        $this->actingAs($user)
            ->deleteJson('/api/profile/avatar')
            ->assertNoContent();

        $this->assertCount(0, $user->fresh()->getMedia('avatar'));
    }

    public function test_profile_endpoints_require_authentication(): void
    {
        $this->putJson('/api/profile', ['name' => 'X', 'email' => 'x@example.com'])
            ->assertUnauthorized();
    }
}
