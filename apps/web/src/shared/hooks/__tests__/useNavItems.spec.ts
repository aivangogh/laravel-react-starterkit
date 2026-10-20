import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { AnyRoute } from '@tanstack/react-router'
import type { AppRouteStaticData } from '@/shared/router/types'

// Set of permissions the mocked user holds; each test mutates it before building the nav.
const permitted = vi.hoisted(() => new Set<string>())
// Set of install modules currently enabled; drives the mocked `isModuleEnabled`.
const enabledModules = vi.hoisted(() => new Set<string>())
// The registered routes the mocked router exposes (filled below, read lazily by `useRouter`).
const routes = vi.hoisted(() => [] as AnyRoute[])

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ routesById: Object.fromEntries(routes.map((r) => [r.fullPath, r])) }),
}))

vi.mock('@/shared/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: (permission: string) => permitted.has(permission) }),
}))

vi.mock('@/shared/hooks/useAppConfig', () => ({
  useAppConfig: () => ({ isModuleEnabled: (module: string) => enabledModules.has(module) }),
}))

import { navItemsFrom, useNavItems } from '@/shared/hooks/useNavItems'

/** The slice of a TanStack route `navItemsFrom` reads. */
function route(fullPath: string, staticData?: AppRouteStaticData): AnyRoute {
  return { fullPath, options: { staticData } } as unknown as AnyRoute
}

// Deliberately unsorted, plus a non-nav route. `shop` is gated behind the `ecommerce` install module.
routes.push(
  route('/reports', { nav: { title: 'Reports', order: 2 } }),
  route('/', { nav: { title: 'Home', order: 1 } }),
  route('/users', { permission: 'users.view', nav: { title: 'Users', order: 3 } }),
  route('/shop', { module: 'ecommerce', nav: { title: 'Shop', order: 4 } }),
  route('/forbidden'),
)

function titles() {
  return renderHook(() => useNavItems()).result.current.map((item) => item.title)
}

describe('navItemsFrom', () => {
  it('projects nav-able routes to nav items sorted by order, skipping routes without nav', () => {
    expect(navItemsFrom(routes)).toEqual([
      { to: '/', title: 'Home', icon: undefined, order: 1 },
      { to: '/reports', title: 'Reports', icon: undefined, order: 2 },
      { to: '/users', title: 'Users', icon: undefined, order: 3, permission: 'users.view' },
      { to: '/shop', title: 'Shop', icon: undefined, order: 4, module: 'ecommerce' },
    ])
  })

  it('defaults a missing order to 0', () => {
    expect(navItemsFrom([route('/x', { nav: { title: 'X' } })])[0]?.order).toBe(0)
  })
})

describe('useNavItems', () => {
  beforeEach(() => {
    permitted.clear()
    enabledModules.clear()
  })

  it('hides items whose permission the user lacks and returns the rest sorted by order', () => {
    // `users` (needs users.view) and `shop` (needs the ecommerce module) are hidden; the
    // permission-less, non-module items show, sorted by order.
    expect(titles()).toEqual(['Home', 'Reports'])
  })

  it('shows a permission-gated item once the user holds the permission', () => {
    permitted.add('users.view')

    expect(titles()).toEqual(['Home', 'Reports', 'Users'])
  })

  it('hides a module-gated item while the module is disabled', () => {
    expect(titles()).not.toContain('Shop')
  })

  it('shows a module-gated item once the module is enabled', () => {
    enabledModules.add('ecommerce')

    expect(titles()).toEqual(['Home', 'Reports', 'Shop'])
  })
})
