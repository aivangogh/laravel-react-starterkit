import type { ReactNode } from 'react'
import { usePermissions } from '@/shared/hooks/usePermissions'

/**
 * Permission-gate a subtree (the React replacement for the old `v-can` directive):
 *
 *   <Can permission="users.create"><Button>New user</Button></Can>
 *
 * Renders `fallback` (default: nothing) when the user lacks the permission. To keep a control
 * visible but disabled instead, read `usePermissions().can()` and pass `disabled` directly.
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can } = usePermissions()
  return can(permission) ? children : fallback
}
