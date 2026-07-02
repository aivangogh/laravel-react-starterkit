<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Single API resources serialize as bare objects (matching the shared
        // `User`/`Role`/... types), while paginated collections keep their
        // `data` + `meta` + `links` wrapper (the shared `Paginated<T>` shape).
        JsonResource::withoutWrapping();

        // The `super-admin` role bypasses every authorization check. Returning
        // null (not false) for everyone else lets the normal permission checks
        // run. Spatie's `permission:*` middleware honors this via `canAny()`.
        Gate::before(fn ($user, string $ability) => $user->hasRole('super-admin') ? true : null);

        // In tests, treat every optional module stub as installed: register its
        // migrations so the suite can migrate + exercise the module without
        // publishing the stubs. Their classes load via the autoload-dev
        // classmap (see composer.json); both are dev/test-only, so a real Basic
        // install carries no e-commerce code.
        if ($this->app->environment('testing')) {
            foreach (glob(base_path('stubs/modules/*/database/migrations'), GLOB_ONLYDIR) ?: [] as $modulePath) {
                $this->loadMigrationsFrom($modulePath);
            }
        }
    }
}
