<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\HandlesListQuery;
use App\Http\Requests\IndexActivityRequest;
use App\Http\Resources\ActivityResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Spatie\Activitylog\Models\Activity;

/**
 * Read-only access to the Spatie activity log. Entries are written by the
 * models themselves (the LogsActivity trait), never through this API — hence
 * index + show only. Gated by `activity.view`.
 */
class ActivityLogController extends ApiController implements HasMiddleware
{
    use HandlesListQuery;

    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:activity.view', only: ['index', 'show']),
        ];
    }

    /**
     * Paginated, filterable activity feed (newest first) — the shared
     * `Paginated<Activity>` shape. Filterable by log name, causer, subject and
     * an inclusive created_at range, plus the list-query contract (`q` free-text
     * search, `sort`, `dir`, `per_page`) layered on top of those filters.
     */
    public function index(IndexActivityRequest $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        $query = Activity::query()
            ->when($request->filled('log_name'), fn ($q) => $q->where('log_name', $request->string('log_name')))
            ->when($request->filled('causer_type'), fn ($q) => $q->where('causer_type', $request->string('causer_type')))
            ->when($request->filled('causer_id'), fn ($q) => $q->where('causer_id', $request->string('causer_id')))
            ->when($request->filled('subject_type'), fn ($q) => $q->where('subject_type', $request->string('subject_type')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->string('subject_id')))
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->date('to')));

        $activities = $this->applyListQuery(
            $query,
            $request,
            sortable: ['created_at', 'log_name'],
            searchable: ['description', 'log_name'],
            defaultSort: 'created_at',
        )->paginate($perPage);

        return ActivityResource::collection($activities);
    }

    /**
     * A single activity-log entry.
     */
    public function show(Activity $activity): ActivityResource
    {
        return new ActivityResource($activity);
    }
}
