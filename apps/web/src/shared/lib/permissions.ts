import type { User } from '@app/types'

/**
 * The single source of truth for permission checks in the SPA — used by `usePermissions().can()`,
 * the `<Can>` component, and the route guard. Mirrors the backend `Gate::before` hook: `super-admin`
 * bypasses every check (it holds no explicit permissions, so a plain `permissions.includes()` would
 * wrongly deny it the whole UI); everyone else needs the grant.
 */
export function can(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  return user.roles.includes('super-admin') || user.permissions.includes(permission)
}
