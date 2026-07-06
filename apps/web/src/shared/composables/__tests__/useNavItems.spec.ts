import { beforeEach, describe, expect, it, vi } from 'vitest'

// Set of permissions the mocked user holds; each test mutates it before building the nav.
const permitted = vi.hoisted(() => new Set<string>())
// Set of install modules currently enabled; drives the mocked `isModuleEnabled`.
const enabledModules = vi.hoisted(() => new Set<string>())

// Mock the registered nav items (deliberately unsorted) so we can assert filtering + ordering
// without booting the real router. `shop` is gated behind the `ecommerce` install module.
vi.mock('@/app/router', () => ({
  navItems: [
    { name: 'reports', title: 'Reports', order: 2 },
    { name: 'home', title: 'Home', order: 1 },
    { name: 'users', title: 'Users', order: 3, permission: 'users.view' },
    { name: 'shop', title: 'Shop', order: 4, module: 'ecommerce' },
  ],
}))

vi.mock('@/shared/composables/usePermissions', () => ({
  usePermissions: () => ({ can: (permission: string) => permitted.has(permission) }),
}))

vi.mock('@/shared/composables/useAppConfig', () => ({
  useAppConfig: () => ({ isModuleEnabled: (module: string) => enabledModules.has(module) }),
}))

import { useNavItems } from '@/shared/composables/useNavItems'

describe('useNavItems', () => {
  beforeEach(() => {
    permitted.clear()
    enabledModules.clear()
  })

  it('hides items whose permission the user lacks and returns the rest sorted by order', () => {
    const { items } = useNavItems()

    // `users` (needs users.view) and `shop` (needs the ecommerce module) are hidden; the
    // permission-less, non-module items show, sorted by order.
    expect(items.value.map((item) => item.name)).toEqual(['home', 'reports'])
  })

  it('shows a permission-gated item once the user holds the permission', () => {
    permitted.add('users.view')

    const { items } = useNavItems()

    expect(items.value.map((item) => item.name)).toEqual(['home', 'reports', 'users'])
  })

  it('hides a module-gated item while the module is disabled', () => {
    const { items } = useNavItems()

    expect(items.value.map((item) => item.name)).not.toContain('shop')
  })

  it('shows a module-gated item once the module is enabled', () => {
    enabledModules.add('ecommerce')

    const { items } = useNavItems()

    expect(items.value.map((item) => item.name)).toEqual(['home', 'reports', 'shop'])
  })
})
