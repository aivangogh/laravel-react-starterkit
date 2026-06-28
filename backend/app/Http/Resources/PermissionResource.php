<?php

namespace App\Http\Resources;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Permission
 *
 * Serializes a Permission for the API. Mirrors the shared `Permission` type in
 * `@app/types`. Permissions are a read-only catalogue (defined by seeders),
 * so this is just the identity pair the SPA needs to assign them to roles.
 */
class PermissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
