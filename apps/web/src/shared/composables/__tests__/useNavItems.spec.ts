import { beforeEach, describe, expect, it, vi } from 'vitest'

// Set of permissions the mocked user holds; each test mutates it before building the nav.
const permitted = vi.hoisted(() => new Set<string>())

// Mock the registered nav items (deliberately unsorted) so we can assert filtering + ordering
// without booting the real router.
vi.mock('@/app/router', () => ({
  navItems: [
    { name: 'reports', title: 'Reports', order: 2 },
    { name: 'home', title: 'Home', order: 1 },
    { name: 'users', title: 'Users', order: 3, permission: 'users.view' },
  ],
}))

vi.mock('@/shared/composables/usePermissions', () => ({
  usePermissions: () => ({ can: (permission: string) => permitted.has(permission) }),
}))

import { useNavItems } from '@/shared/composables/useNavItems'

describe('useNavItems', () => {
  beforeEach(() => {
    permitted.clear()
  })

  it('hides items whose permission the user lacks and returns the rest sorted by order', () => {
    const { items } = useNavItems()

    // `users` (needs users.view) is hidden; the permission-less items show, sorted by order.
    expect(items.value.map((item) => item.name)).toEqual(['home', 'reports'])
  })

  it('shows a permission-gated item once the user holds the permission', () => {
    permitted.add('users.view')

    const { items } = useNavItems()

    expect(items.value.map((item) => item.name)).toEqual(['home', 'reports', 'users'])
  })
})
