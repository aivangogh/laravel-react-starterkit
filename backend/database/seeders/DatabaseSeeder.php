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

        // In-process installs pass creds via runtime config(); a post-publish install seeds from a
        // fresh subprocess that instead carries them as env vars (never written to disk).
        $admin = User::updateOrCreate(
            ['email' => config('starterkit.admin.email') ?? env('STARTERKIT_ADMIN_EMAIL', 'admin@example.com')],
            [
                'name' => config('starterkit.admin.name', 'Super Admin'),
                'password' => config('starterkit.admin.password') ?? env('STARTERKIT_ADMIN_PASSWORD', 'password'),
                'email_verified_at' => now(),
            ],
        );

        $admin->assignRole('super-admin');

        // Demo catalogue + a sample cart/order, seeded only for the E-commerce
        // preset. The seeder self-guards on the preset too, so a Basic install
        // stays free of any e-commerce data.
        if (config('starterkit.preset') === 'ecommerce') {
            $this->call(EcommerceSampleDataSeeder::class);
        }
    }
}
