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

    public function test_index_filters_by_search_term(): void
    {
        $admin = $this->admin();

        activity()->log('a very findable needle message');
        activity()->log('some other unrelated entry');

        // Case-insensitive search across description + log_name.
        $descriptions = collect(
            $this->actingAs($admin)->getJson('/api/activity-log?q=NEEDLE')->assertOk()->json('data')
        )->pluck('description');

        $this->assertTrue($descriptions->contains('a very findable needle message'));
        $this->assertFalse($descriptions->contains('some other unrelated entry'));
    }

    public function test_search_layers_on_top_of_existing_filters(): void
    {
        $admin = $this->admin();

        activity('security')->log('needle inside security log');
        activity('billing')->log('needle inside billing log');

        // The `q` term matches both entries, but the log_name filter narrows it.
        $data = $this->actingAs($admin)
            ->getJson('/api/activity-log?q=needle&log_name=security')
            ->assertOk()->json('data');

        $this->assertCount(1, $data);
        $this->assertSame(['security'], collect($data)->pluck('log_name')->unique()->values()->all());
    }

    public function test_index_sorts_by_allowed_column(): void
    {
        $admin = $this->admin();

        activity('zeta')->log('later');
        activity('alpha')->log('earlier');

        $asc = collect($this->actingAs($admin)->getJson('/api/activity-log?sort=log_name&dir=asc')->assertOk()->json('data'))
            ->pluck('log_name');
        $this->assertLessThan($asc->search('zeta'), $asc->search('alpha'));

        $desc = collect($this->actingAs($admin)->getJson('/api/activity-log?sort=log_name&dir=desc')->assertOk()->json('data'))
            ->pluck('log_name');
        $this->assertLessThan($desc->search('alpha'), $desc->search('zeta'));
    }

    public function test_index_ignores_disallowed_sort(): void
    {
        $admin = $this->admin();
        User::factory()->create(); // writes an activity row

        // `causer_id` is a real column but NOT whitelisted for sorting, and a
        // bogus column would raise a SQL error if it reached the query — both
        // are ignored, leaving the default newest-first order intact.
        $this->actingAs($admin)->getJson('/api/activity-log?sort=causer_id&dir=asc')->assertOk();
        $this->actingAs($admin)->getJson('/api/activity-log?sort=bogus_column&dir=asc')->assertOk();
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
