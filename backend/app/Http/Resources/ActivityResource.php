<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\Activitylog\Models\Activity;

/**
 * @mixin Activity
 *
 * Serializes a Spatie activity-log entry for the API. Mirrors the shared
 * `Activity` type in `@app/types`. The `subject`/`causer` morphs are exposed as
 * flat type+id pairs (the SPA resolves names from data it already holds);
 * `attribute_changes` holds the before/after diff, `properties` any extras.
 */
class ActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'log_name' => $this->log_name,
            'description' => $this->description,
            'event' => $this->event,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'causer_type' => $this->causer_type,
            'causer_id' => $this->causer_id,
            'attribute_changes' => $this->attribute_changes,
            'properties' => $this->properties,
            'created_at' => $this->created_at,
        ];
    }
}
