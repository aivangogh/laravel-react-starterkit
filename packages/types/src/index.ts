// Shared TypeScript contract between the React frontend and the Laravel API.
// Hand-authored types live here; generated types live in ./generated and are re-exported.
// Consumers always import from the package root: `import type { User } from '@app/types'`.

/** Branded primitive aliases — zero runtime cost, prevents mixing plain strings with IDs/dates. */
export type Uuid = string & { readonly __brand: 'Uuid' }
export type IsoDateTime = string & { readonly __brand: 'IsoDateTime' }

/** Standard Laravel paginated response envelope (`AnonymousResourceCollection`). */
export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

/** Standard Laravel validation/error response shape. */
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

/**
 * Public install state exposed by `GET /api/config` (from `config/starterkit.php`).
 * The SPA reads this at boot to gate navigation before the user is authenticated.
 */
export interface AppConfig {
  preset: 'basic' | 'ecommerce'
  features: Record<string, boolean>
}

export interface Role {
  id: Uuid
  name: string
  permissions: string[]
}

export interface Permission {
  id: Uuid
  name: string
}

export interface User {
  id: Uuid
  name: string
  email: string
  email_verified_at: IsoDateTime | null
  /** Public URL of the user's avatar, or null when none is set. */
  avatar_url: string | null
  roles: string[]
  permissions: string[]
  created_at: IsoDateTime
}

/** Application-wide settings (spatie/laravel-settings `general` group). */
export interface GeneralSettings {
  app_name: string
  support_email: string | null
  registration_enabled: boolean
}

/** A Sanctum personal access token — metadata only, never the secret. */
export interface ApiToken {
  id: number
  name: string
  abilities: string[]
  last_used_at: IsoDateTime | null
  expires_at: IsoDateTime | null
  created_at: IsoDateTime
}

/**
 * The response when creating a token: the metadata plus the one-time
 * plaintext secret, which is shown once and never recoverable afterwards.
 */
export interface NewApiToken extends ApiToken {
  plain_text_token: string
}

/** A Spatie activity-log entry. `subject`/`causer` are flat morph type+id pairs. */
export interface Activity {
  id: number
  log_name: string | null
  description: string
  event: string | null
  subject_type: string | null
  subject_id: Uuid | null
  causer_type: string | null
  causer_id: Uuid | null
  attribute_changes: Record<string, unknown> | null
  properties: Record<string, unknown> | null
  created_at: IsoDateTime
}

export * from './generated'
