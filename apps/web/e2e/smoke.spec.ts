import { expect, test } from '@playwright/test'

// Minimal smoke test. Unauthenticated visitors hitting a protected route are redirected to login.
// Run against http://localhost (never 127.0.0.1) so Sanctum's localhost-scoped cookies work.
test('redirects unauthenticated users from a protected route to login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
})

test('the login page renders its form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})
