<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Base Form Request for the JSON API.
 *
 * Every API request object should extend this so validation failures always
 * surface as the shared `ApiError` JSON shape (`{ message, errors }`),
 * independent of the client's `Accept` header. Subclasses override
 * `rules()` (and `authorize()` when the action is permission-gated).
 */
abstract class ApiFormRequest extends FormRequest
{
    /**
     * Authorize the request. Permission/role gating is normally done at the
     * route via the Spatie middleware; override here for record-level checks.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Render validation errors as a consistent JSON `ApiError` payload.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], Response::HTTP_UNPROCESSABLE_ENTITY));
    }
}
