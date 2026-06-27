<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
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
    }
}
