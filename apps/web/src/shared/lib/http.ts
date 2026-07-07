import axios, { AxiosError } from 'axios'
import type { ApiError } from '@app/types'

/**
 * The ONE axios instance for the whole app. Never import raw `axios` in a component —
 * import `http` (or, better, wrap the call in a TanStack Query composable).
 *
 * Sanctum SPA cookie auth: `withCredentials` sends the session cookie, and axios mirrors the
 * `XSRF-TOKEN` cookie (url-decoded) into the `X-XSRF-TOKEN` header. `withXSRFToken: true` forces
 * that even cross-origin (the SPA and API run on different ports = different origins).
 *
 * `baseURL` is the bare API host (no `/api` suffix): API calls pass `/api/...` and Fortify actions
 * hit the root (`/login`, `/register`). It comes from `VITE_API_URL`, which vite.config.ts derives
 * from the single source of truth in `backend/.env` (SERVER_HOST/SERVER_PORT) so `pnpm dev` works
 * out of the box and follows the backend port. Use `localhost` (not 127.0.0.1) so the session
 * cookie, scoped to `SESSION_DOMAIN=localhost`, round-trips. Override via `apps/web/.env` (see
 * .env.example); the literal below is only the last-resort default when neither is available.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
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
