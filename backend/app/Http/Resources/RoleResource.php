<?php

namespace App\Http\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Role
 *
 * Serializes a Role for the API. Mirrors the shared `Role` type in
 * `@app/types` — keep the two in sync. `permissions` is flattened to a plain
 * string array so the SPA can render/edit a role's permission set directly.
 */
class RoleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'permissions' => $this->permissions->pluck('name'),
        ];
    }
}
