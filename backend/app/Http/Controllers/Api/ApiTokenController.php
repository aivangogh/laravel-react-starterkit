<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreApiTokenRequest;
use App\Http\Resources\TokenResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

/**
 * The authenticated user's own Sanctum personal access tokens. Self-service —
 * gated only by `auth:sanctum` (the route group) and always scoped to the
 * caller's own tokens, so a user can never see or revoke another user's token.
 * Works whether the caller authenticated via the SPA cookie session or a token.
 */
class ApiTokenController extends ApiController
{
    /**
     * List the caller's tokens (metadata only — never the secret). A flat
     * `ApiToken[]`; the set is small and read as a lookup, so it is not
     * paginated.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        return TokenResource::collection(
            $request->user()->tokens()->latest('id')->get()
        );
    }

    /**
     * Create a token and return its one-time plaintext alongside the metadata.
     * The plaintext is shown only here — it is never recoverable afterwards.
     */
    public function store(StoreApiTokenRequest $request): JsonResponse
    {
        $token = $request->user()->createToken(
            $request->validated('name'),
            $request->validated('abilities', ['*']),
        );

        return $this->respond([
            ...(new TokenResource($token->accessToken))->toArray($request),
            'plain_text_token' => $token->plainTextToken,
        ], Response::HTTP_CREATED);
    }

    /**
     * Revoke one of the caller's tokens. Scoping to the caller's relation makes
     * another user's token id resolve to 404 rather than deleting it.
     */
    public function destroy(Request $request, string $id): Response
    {
        $request->user()->tokens()->findOrFail($id)->delete();

        return $this->noContent();
    }
}
