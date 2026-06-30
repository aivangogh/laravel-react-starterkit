<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UploadAvatarRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\UpdatesUserProfileInformation;
use Symfony\Component\HttpFoundation\Response;

/**
 * The authenticated user's own profile: name/email, password and avatar.
 *
 * Every action is self-service — gated only by `auth:sanctum` (the route
 * group), since a user may always manage their own profile. Name/email
 * updates delegate to Fortify's UpdatesUserProfileInformation contract so the
 * "how to update a profile" logic stays in one place (shared with Fortify's
 * own web routes); password and avatar are API concerns handled here.
 */
class ProfileController extends ApiController
{
    /**
     * Update the authenticated user's name and email. Validation lives in the
     * Fortify action and surfaces as the shared 422 `ApiError` shape.
     */
    public function update(Request $request, UpdatesUserProfileInformation $updater): UserResource
    {
        $updater->update($request->user(), $request->all());

        return new UserResource($request->user()->fresh()->load(['roles', 'media']));
    }

    /**
     * Change the authenticated user's password. The `hashed` cast on the model
     * hashes the new value on save.
     */
    public function updatePassword(UpdatePasswordRequest $request): Response
    {
        $user = $request->user();
        $user->password = $request->validated('password');
        $user->save();

        return $this->noContent();
    }

    /**
     * Upload (and replace) the authenticated user's avatar. The `avatar`
     * collection is single-file, so a new upload supersedes the previous one.
     */
    public function uploadAvatar(UploadAvatarRequest $request): UserResource
    {
        $request->user()
            ->addMediaFromRequest('avatar')
            ->toMediaCollection('avatar');

        return new UserResource($request->user()->fresh()->load(['roles', 'media']));
    }

    /**
     * Remove the authenticated user's avatar.
     */
    public function destroyAvatar(Request $request): Response
    {
        $request->user()->clearMediaCollection('avatar');

        return $this->noContent();
    }
}
