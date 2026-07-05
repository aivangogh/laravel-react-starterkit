import { computed, type ComputedRef } from 'vue'
import { navItems } from '@/app/router'
import { usePermissions } from '@/shared/composables/usePermissions'
import type { NavItem } from '@/shared/router/types'

/**
 * The app sidebar/nav, filtered to what the current user may see.
 *
 * `navItems` is derived once from the registered feature routes (those with `meta.nav`) and is
 * already sorted by `meta.nav.order`. Here we drop any item whose `meta.permission` the user
 * lacks; items without a permission are always visible. Reactive to the auth store, so the nav
 * updates on login/logout.
 */
export function useNavItems(): { items: ComputedRef<NavItem[]> } {
  const { can } = usePermissions()

  const items = computed(() =>
    navItems
      .filter((item) => !item.permission || can(item.permission))
      .sort((a, b) => a.order - b.order),
  )

  return { items }
}
