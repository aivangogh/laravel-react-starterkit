<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * UUID-keyed Role (PRISM parity).
 *
 * Spatie's base model uses an auto-increment id; HasUuids generates an ordered
 * UUID on create instead, matching the UUID primary keys used across the kit.
 * Registered as the role model in config/permission.php so Spatie's relations
 * resolve to this class.
 */
class Role extends SpatieRole
{
    use HasUuids;
}
