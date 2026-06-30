<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Resources\SettingsResource;
use App\Settings\GeneralSettings;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * App-wide settings (the `general` group). Reading is gated by
 * `settings.view` and writing by `settings.update`, so an admin UI can expose
 * the settings screen and the save action independently. The whole controller
 * already sits behind `auth:sanctum` (the route group).
 */
class SettingsController extends ApiController implements HasMiddleware
{
    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:settings.view', only: ['show']),
            new Middleware('permission:settings.update', only: ['update']),
        ];
    }

    /**
     * The current app settings — the shared `GeneralSettings` shape.
     */
    public function show(GeneralSettings $settings): SettingsResource
    {
        return new SettingsResource($settings);
    }

    /**
     * Persist a partial update. Only supplied keys change; booleans are cast
     * so a JSON `false`/`"0"` is stored correctly.
     */
    public function update(UpdateSettingsRequest $request, GeneralSettings $settings): SettingsResource
    {
        $validated = $request->validated();

        if (array_key_exists('app_name', $validated)) {
            $settings->app_name = $validated['app_name'];
        }

        if (array_key_exists('support_email', $validated)) {
            $settings->support_email = $validated['support_email'];
        }

        if ($request->has('registration_enabled')) {
            $settings->registration_enabled = $request->boolean('registration_enabled');
        }

        $settings->save();

        return new SettingsResource($settings);
    }
}
