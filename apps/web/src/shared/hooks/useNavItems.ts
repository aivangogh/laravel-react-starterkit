import { useRouter, type AnyRoute } from '@tanstack/react-router'
import { useAppConfig } from '@/shared/hooks/useAppConfig'
import { usePermissions } from '@/shared/hooks/usePermissions'
import type { NavItem } from '@/shared/router/types'

/** Nav-able routes (those declaring `staticData.nav`), projected to {@link NavItem} and sorted by order. */
export function navItemsFrom(routes: AnyRoute[]): NavItem[] {
  return routes
    .filter((route) => route.options.staticData?.nav)
    .map((route) => {
      const { nav, permission, module } = route.options.staticData!
      return {
        to: route.fullPath,
        title: nav!.title,
        icon: nav!.icon,
        order: nav!.order ?? 0,
        permission,
        module,
      }
    })
    .sort((a, b) => a.order - b.order)
}

/**
 * The app sidebar/nav, filtered to what the current user may see.
 *
 * Items come from the registered file routes that set `staticData.nav`. We drop any item whose
 * `permission` the user lacks, plus any item belonging to an install module that isn't enabled
 * (`module` + `/api/config` — see {@link useAppConfig}). Re-renders on login/logout and once the
 * install config resolves, since both are queries.
 */
export function useNavItems(): NavItem[] {
  const router = useRouter()
  const { can } = usePermissions()
  const { isModuleEnabled } = useAppConfig()

  return navItemsFrom(Object.values(router.routesById))
    .filter((item) => !item.permission || can(item.permission))
    .filter((item) => !item.module || isModuleEnabled(item.module))
}
