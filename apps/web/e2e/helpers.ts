import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Shared E2E helpers. The suite drives the real SPA against the live stack (Vite + the Laravel API +
 * Postgres/Redis), so it exercises the genuine Sanctum cookie flow — never mocked. Everything runs
 * against `localhost` (see `playwright.config.ts`), because the session cookie is scoped there.
 */

/** The super-admin seeded by `php artisan db:seed` (or `kit:install`). Bypasses every permission. */
export const ADMIN = { email: 'admin@example.com', password: 'password', name: 'Super Admin' } as const

/** Password used for accounts the tests create — satisfies the default Fortify rules (min 8). */
export const TEST_PASSWORD = 'password'

/**
 * A unique email per call. Keeps the suite idempotent across reruns and safe under parallel workers
 * against a shared database — no two tests ever collide on the users table's unique email.
 */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}

/**
 * The visible desktop sidebar. The shadcn-vue `Sidebar` tags its root with `data-slot="sidebar"`;
 * at md+ only the desktop variant renders (the mobile drawer is a Sheet that stays closed).
 */
export function sidebar(page: Page): Locator {
  return page.locator('[data-slot="sidebar"]')
}

/** True once the authenticated shell is on screen — the account menu only renders when signed in. */
export function accountButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Account:/ })
}

/** Drive the login form and wait until the dashboard shell has rendered. */
export async function login(page: Page, email = ADMIN.email, password = ADMIN.password): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // The login chain is 3 sequential API round-trips (csrf -> /login -> /api/user); allow headroom.
  await expect(accountButton(page)).toBeVisible({ timeout: 15_000 })
}

/** Register a brand-new account through the UI; returns the email so callers can reuse it. */
export async function register(page: Page, name = 'E2E User'): Promise<string> {
  const email = uniqueEmail('e2e-register')
  await page.goto('/register')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel('Confirm password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(accountButton(page)).toBeVisible({ timeout: 15_000 })
  return email
}

/**
 * Create a user through the /users dialog (assumes an authenticated super-admin). Returns the
 * generated email. Used by tests that just need a user to exist (e.g. to produce an activity entry).
 */
export async function createUser(page: Page, name = 'E2E Created'): Promise<string> {
  const email = uniqueEmail('e2e-created')
  await page.goto('/users')
  await page.getByRole('button', { name: 'New user' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Name').fill(name)
  await dialog.getByLabel('Email').fill(email)
  const password = dialog.getByLabel('Password', { exact: true })
  await password.fill(TEST_PASSWORD)
  await password.press('Enter') // submit via the form's implicit submit (button may be below the fold)
  await expect(dialog).toBeHidden()
  return email
}

/** Sign out via the account menu and wait for the login page. */
export async function logout(page: Page): Promise<void> {
  await accountButton(page).click()
  await page.getByRole('menuitem', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login$/)
}
