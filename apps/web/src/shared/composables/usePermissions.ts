import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/auth'

/**
 * Read the authenticated user's permissions/roles. Backed by the auth store (client state), so
 * this is the single source of truth for `can()` / `hasRole()` in components, the `v-can`
 * directive, and the router guard.
 */
export function usePermissions() {
  const store = useAuthStore()
  const { user } = storeToRefs(store)

  const permissions = computed(() => user.value?.permissions ?? [])
  const roles = computed(() => user.value?.roles ?? [])

  function can(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  return { can, hasRole, permissions, roles }
}
