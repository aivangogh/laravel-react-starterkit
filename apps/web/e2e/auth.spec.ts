import { expect, test } from '@playwright/test'
import { ADMIN, accountButton, login, logout, register } from './helpers'

/**
 * Authentication flow — the live Sanctum cookie session end to end: guest redirects, register,
 * login, invalid credentials, logout, and the guest-only guard. Run against `localhost` so the
 * session cookie is in scope (see `playwright.config.ts`).
 */
test.describe('authentication', () => {
  test('redirects an unauthenticated visitor from a protected route to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('the login page renders its form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('signs in with valid credentials and reaches the dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(`Welcome, ${ADMIN.name}`)).toBeVisible()
  })

  test('rejects invalid credentials and stays on the login page', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(ADMIN.email)
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    // Fortify returns a field-level 422 (message under `email`), so it renders inline, not as a banner.
    await expect(page.getByText(/these credentials do not match/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
    await expect(accountButton(page)).toBeHidden()
  })

  test('registers a new account and lands on the dashboard', async ({ page }) => {
    await register(page, 'Newly Registered')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Welcome, Newly Registered')).toBeVisible()
  })

  test('signs out from the account menu', async ({ page }) => {
    await login(page)
    await logout(page)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    // The session is gone: a protected route bounces back to login.
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('sends an already-authenticated user away from guest-only pages', async ({ page }) => {
    await login(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/$/)
    await expect(accountButton(page)).toBeVisible()
  })
})
