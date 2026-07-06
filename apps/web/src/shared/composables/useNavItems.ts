import { computed, type ComputedRef } from 'vue'
import { navItems } from '@/app/router'
import { useAppConfig } from '@/shared/composables/useAppConfig'
import { usePermissions } from '@/shared/composables/usePermissions'
import type { NavItem } from '@/shared/router/types'

/**
 * The app sidebar/nav, filtered to what the current user may see.
 *
 * `navItems` is derived once from the registered feature routes (those with `meta.nav`) and is
 * already sorted by `meta.nav.order`. Here we drop any item whose `meta.permission` the user
 * lacks, plus any item belonging to an install module that isn't enabled (`meta.module` +
 * `/api/config` — see {@link useAppConfig}). Items without a permission/module are always visible.
 * Reactive to the auth store and the config query, so the nav updates on login/logout and once the
 * install config resolves.
 */
export function useNavItems(): { items: ComputedRef<NavItem[]> } {
  const { can } = usePermissions()
  const { isModuleEnabled } = useAppConfig()

  const items = computed(() =>
    navItems
      .filter((item) => !item.permission || can(item.permission))
      .filter((item) => !item.module || isModuleEnabled(item.module))
      .sort((a, b) => a.order - b.order),
  )

  return { items }
}
