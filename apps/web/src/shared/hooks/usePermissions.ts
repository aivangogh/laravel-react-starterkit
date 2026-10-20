import { useUser } from '@/features/auth/hooks/useAuth'
import { can } from '@/shared/lib/permissions'

/**
 * Read the authenticated user's permissions/roles. Backed by the session user query, so this is the
 * single source of `can()` / `hasRole()` in components and `<Can>`.
 */
export function usePermissions() {
  const user = useUser()

  return {
    /** Delegates to the canonical rule (super-admin bypass included). */
    can: (permission: string) => can(user, permission),
    hasRole: (role: string) => user?.roles.includes(role) ?? false,
    permissions: user?.permissions ?? [],
    roles: user?.roles ?? [],
  }
}
