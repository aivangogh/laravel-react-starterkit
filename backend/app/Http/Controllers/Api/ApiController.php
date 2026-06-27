<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Base controller for the JSON API.
 *
 * Provides the small set of response helpers shared by the resource
 * controllers. Index/show endpoints should return API Resources directly
 * (they are Responsable and already produce the `{ data, meta, links }`
 * Paginated shape); use these helpers for bare messages and status-only
 * responses so the envelope stays consistent.
 */
abstract class ApiController extends Controller
{
    /**
     * Success response with an arbitrary JSON payload.
     */
    protected function respond(mixed $data = null, int $status = Response::HTTP_OK): JsonResponse
    {
        return response()->json($data, $status);
    }

    /**
     * 201 Created.
     */
    protected function created(mixed $data = null): JsonResponse
    {
        return $this->respond($data, Response::HTTP_CREATED);
    }

    /**
     * 204 No Content — for successful deletes / actions with no body.
     */
    protected function noContent(): Response
    {
        return response()->noContent();
    }

    /**
     * A bare `{ message }` envelope — matches the shared `ApiError` shape.
     */
    protected function message(string $message, int $status = Response::HTTP_OK): JsonResponse
    {
        return response()->json(['message' => $message], $status);
    }
}
