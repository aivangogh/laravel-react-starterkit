import axios, { AxiosError } from 'axios'
import type { ApiError } from '@app/types'

/**
 * The ONE axios instance for the whole app. Never import raw `axios` in a component —
 * import `http` (or, better, wrap the call in a TanStack Query composable).
 *
 * Sanctum SPA cookie auth: `withCredentials` sends the session cookie, and axios mirrors the
 * `XSRF-TOKEN` cookie (url-decoded) into the `X-XSRF-TOKEN` header. `withXSRFToken: true` forces
 * that even cross-origin (the SPA and API run on different ports = different origins).
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

let csrfReady = false

/**
 * Prime the CSRF cookie once before the first mutating request. Sanctum's
 * `GET /sanctum/csrf-cookie` sets the `XSRF-TOKEN` cookie that axios then echoes back.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (csrfReady) return
  await http.get('/sanctum/csrf-cookie')
  csrfReady = true
}

/** Narrow an unknown error to an axios error carrying the standard API error body. */
export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error)
}

/** Extract the standard `{ message, errors }` body from any thrown value. */
export function extractApiError(error: unknown): ApiError {
  if (isApiError(error) && error.response?.data) {
    return error.response.data
  }
  return { message: 'An unexpected error occurred. Please try again.' }
}

/** Field-level validation errors from a 422 response, keyed by field name. */
export function getValidationErrors(error: unknown): Record<string, string[]> {
  return extractApiError(error).errors ?? {}
}

/** Human-readable top-level message from an error response. */
export function getErrorMessage(error: unknown): string {
  return extractApiError(error).message
}
