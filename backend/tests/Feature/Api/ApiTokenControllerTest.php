<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Personal access tokens are self-service: any authenticated user manages
 * their own tokens. Token auth itself is exercised with a real Bearer header
 * (no actingAs) so the create -> use -> revoke lifecycle is genuinely tested.
 */
class ApiTokenControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_lists_only_the_callers_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('laptop');
        $user->createToken('ci');
        User::factory()->create()->createToken('someone-else');

        // A flat ApiToken[] catalogue (no pagination, no `data` wrapper).
        $this->actingAs($user)
            ->getJson('/api/tokens')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['name' => 'laptop'])
            ->assertJsonFragment(['name' => 'ci'])
            ->assertJsonMissing(['name' => 'someone-else']);
    }

    public function test_index_never_exposes_the_token_secret(): void
    {
        $user = User::factory()->create();
        $user->createToken('laptop');

        $item = $this->actingAs($user)->getJson('/api/tokens')->assertOk()->json('0');

        $this->assertArrayHasKey('abilities', $item);
        $this->assertArrayNotHasKey('token', $item);
    }

    public function test_store_creates_token_and_returns_plaintext_once(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/tokens', ['name' => 'CLI', 'abilities' => ['posts:read']])
            ->assertCreated()
            ->assertJsonPath('name', 'CLI')
            ->assertJsonPath('abilities', ['posts:read']);

        $this->assertIsString($response->json('plain_text_token'));
        $this->assertNotEmpty($response->json('plain_text_token'));
        $this->assertArrayNotHasKey('token', $response->json());

        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'CLI',
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_store_defaults_to_full_abilities(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/tokens', ['name' => 'CLI'])
            ->assertCreated()
            ->assertJsonPath('abilities', ['*']);
    }

    public function test_store_requires_a_name(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/tokens', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_token_authenticates_a_request_then_revocation_rejects_it(): void
    {
        $user = User::factory()->create();
        $created = $user->createToken('cli');
        $plain = $created->plainTextToken;
        $id = $created->accessToken->getKey();

        // The freshly minted token authenticates a protected request.
        $this->withHeader('Authorization', 'Bearer '.$plain)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('id', $user->id);

        // It can revoke itself... (reset the guard so the next request
        // re-resolves the token instead of reusing the memoized user).
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$plain)
            ->deleteJson('/api/tokens/'.$id)
            ->assertNoContent();

        // ...after which it no longer authenticates.
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$plain)
            ->getJson('/api/user')
            ->assertUnauthorized();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $id]);
    }

    public function test_cannot_revoke_another_users_token(): void
    {
        $owner = User::factory()->create();
        $token = $owner->createToken('owners')->accessToken;

        $this->actingAs(User::factory()->create())
            ->deleteJson('/api/tokens/'.$token->getKey())
            ->assertNotFound();

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $token->getKey()]);
    }

    public function test_token_endpoints_require_authentication(): void
    {
        $this->getJson('/api/tokens')->assertUnauthorized();
    }
}
