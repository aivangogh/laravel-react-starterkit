<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ConfigTest extends TestCase
{
    public function test_config_is_public_and_returns_preset_and_features(): void
    {
        // No actingAs(): the endpoint must be reachable before authentication.
        $this->getJson('/api/config')
            ->assertOk()
            ->assertJsonStructure(['preset', 'features'])
            ->assertJsonPath('preset', config('starterkit.preset'))
            ->assertJsonPath('features', config('starterkit.features'));
    }
}
