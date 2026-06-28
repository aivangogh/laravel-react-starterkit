<?php

namespace Tests\Feature\Api;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class ActivityLogControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An acting user holding activity.view.
     */
    private function admin(): User
    {
        Permission::findOrCreate('activity.view');
        $role = Role::findOrCreate('admin');
        $role->givePermissionTo('activity.view');

        return tap(User::factory()->create())->assignRole($role);
    }

    public function test_index_returns_paginated_activity(): void
    {
        $admin = $this->admin();
        User::factory()->create(); // writes a "created" activity row

        $this->actingAs($admin)
            ->getJson('/api/activity-log')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [[
                    'id', 'log_name', 'description', 'event',
                    'subject_type', 'subject_id', 'causer_type', 'causer_id',
                    'attribute_changes', 'properties', 'created_at',
                ]],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ]);
    }

    public function test_logged_action_appears_in_index(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->getJson('/api/activity-log')->assertOk();

        // The user-creation activity (subject = that user) should appear.
        $this->assertContains(
            $user->id,
            collect($response->json('data'))->pluck('subject_id')->all(),
        );
    }

    public function test_index_filters_by_subject(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create();
        User::factory()->create(); // noise — different subject

        $response = $this->actingAs($admin)
            ->getJson('/api/activity-log?subject_id='.$target->id)
            ->assertOk();

        $subjectIds = collect($response->json('data'))->pluck('subject_id')->unique()->values();
        $this->assertSame([$target->id], $subjectIds->all());
    }

    public function test_show_returns_single_activity(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        $activity = Activity::query()->latest('id')->first();

        $this->actingAs($admin)
            ->getJson('/api/activity-log/'.$activity->id)
            ->assertOk()
            ->assertJsonPath('id', $activity->id)
            ->assertJsonPath('subject_id', $user->id);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/activity-log')->assertUnauthorized();
    }

    public function test_requires_activity_view_permission(): void
    {
        Permission::findOrCreate('activity.view');

        $this->actingAs(User::factory()->create())
            ->getJson('/api/activity-log')
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }

    public function test_invalid_filters_are_rejected(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/activity-log?from=not-a-date&causer_id=not-a-uuid')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['from', 'causer_id']);
    }
}
