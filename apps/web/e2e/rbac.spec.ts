import { expect, test } from '@playwright/test'
import { login, register, sidebar } from './helpers'

/**
 * Role-based access control, verified through the real router guard + `/api/user` permissions:
 *   - the seeded super-admin bypasses every check (sees all nav, reaches gated pages);
 *   - a freshly-registered account has NO role/permission, so gated routes redirect to /forbidden
 *     and the permission-gated nav items never render.
 */

// Nav items that require a permission (hidden from a no-permission user).
const GATED_NAV = ['Users', 'Roles', 'Activity', 'Settings'] as const
// Nav items with no permission gate (always visible to any authenticated user).
const OPEN_NAV = ['Home', 'Profile', 'API Tokens'] as const

test.describe('RBAC — super-admin', () => {
  test('sees every nav item, gated and open alike', async ({ page }) => {
    await login(page)
    const nav = sidebar(page)
    for (const label of [...OPEN_NAV, ...GATED_NAV]) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
  })

  test('can open a permission-gated page', async ({ page }) => {
    await login(page)
    await sidebar(page).getByRole('link', { name: 'Users', exact: true }).click()
    await expect(page).toHaveURL(/\/users$/)
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })
})

test.describe('RBAC — no-permission user', () => {
  test('is redirected from a gated route to the forbidden page', async ({ page }) => {
    await register(page)
    await page.goto('/users')
    await expect(page).toHaveURL(/\/forbidden$/)
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible()
  })

  test('does not see the permission-gated nav items', async ({ page }) => {
    await register(page)
    const nav = sidebar(page)
    for (const label of OPEN_NAV) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    for (const label of GATED_NAV) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0)
    }
  })
})
