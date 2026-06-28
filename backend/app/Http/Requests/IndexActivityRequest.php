<?php

namespace App\Http\Requests;

/**
 * Validates the activity-log index filters. All are optional; unknown query
 * params are ignored. Authorization (permission:activity.view) is gated on the
 * route via ActivityLogController::middleware(), so authorize() stays open.
 */
class IndexActivityRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'log_name' => ['sometimes', 'string', 'max:255'],
            // Filter by who acted / what was acted on. IDs are UUIDs (all
            // auditable models are UUID-keyed); types are morph-map FQCNs.
            'causer_id' => ['sometimes', 'uuid'],
            'causer_type' => ['sometimes', 'string', 'max:255'],
            'subject_id' => ['sometimes', 'uuid'],
            'subject_type' => ['sometimes', 'string', 'max:255'],
            // Inclusive created_at range.
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
