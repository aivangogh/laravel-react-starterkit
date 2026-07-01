<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the roles/permissions matrix for the installed preset, then create
     * (or update) the super-admin account. Idempotent — safe to re-run.
     *
     * Admin credentials come from runtime config so `php artisan kit:install`
     * can pass the operator's answers; a plain `db:seed` falls back to the
     * documented defaults.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $admin = User::updateOrCreate(
            ['email' => config('starterkit.admin.email', 'admin@example.com')],
            [
                'name' => config('starterkit.admin.name', 'Super Admin'),
                'password' => config('starterkit.admin.password', 'password'),
                'email_verified_at' => now(),
            ],
        );

        $admin->assignRole('super-admin');
    }
}
