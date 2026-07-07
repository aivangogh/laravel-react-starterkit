import { expect, test } from '@playwright/test'
import { ADMIN, login } from './helpers'

/**
 * Page-level smoke of every Base-preset feature: as the super-admin, each route renders its own
 * page (heading on screen) rather than erroring, redirecting, or landing on the forbidden page.
 * One login, then a walk through the pages.
 */
const PAGES = [
  { path: '/users', heading: /^Users$/ },
  { path: '/roles', heading: /roles & permissions/i },
  { path: '/activity', heading: /^Activity$/ },
  { path: '/profile', heading: /^Profile$/ },
  { path: '/settings', heading: /^Settings$/ },
  { path: '/tokens', heading: /^API Tokens$/ },
] as const

test('every base feature page renders for the super-admin', async ({ page }) => {
  await login(page)

  // Home (index) greets the signed-in user.
  await expect(page.getByText(`Welcome, ${ADMIN.name}`)).toBeVisible()

  for (const { path, heading } of PAGES) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
})
