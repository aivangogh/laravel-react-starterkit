import { expect, test } from '@playwright/test'
import { TEST_PASSWORD, login, uniqueEmail } from './helpers'

/**
 * The user-management CRUD round-trip, driven entirely through the UI against the live API:
 * create a user, find it in the server-side DataTable, rename it, then delete it. One test owns the
 * whole lifecycle so it stays self-contained under parallel execution on a shared database.
 */
test('super-admin creates, edits, and deletes a user', async ({ page }) => {
  const email = uniqueEmail('e2e-crud')
  const name = 'CRUD User'
  const renamed = 'CRUD User Renamed'

  await login(page)
  await page.goto('/users')
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

  // --- Create ---------------------------------------------------------------
  await page.getByRole('button', { name: 'New user' }).click()
  const createDialog = page.getByRole('dialog')
  await expect(createDialog.getByRole('heading', { name: 'New user' })).toBeVisible()
  await createDialog.getByLabel('Name').fill(name)
  await createDialog.getByLabel('Email').fill(email)
  const password = createDialog.getByLabel('Password', { exact: true })
  await password.fill(TEST_PASSWORD)
  await password.press('Enter') // form's implicit submit — robust to the button being below the fold
  await expect(createDialog).toBeHidden()

  // Find the new user via the table's server-side search.
  await page.getByLabel('Search').fill(email)
  const row = page.getByRole('row').filter({ hasText: email })
  await expect(row).toBeVisible()
  await expect(row).toContainText(name)

  // --- Edit -----------------------------------------------------------------
  await row.getByRole('button', { name: 'Open actions menu' }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  const editDialog = page.getByRole('dialog')
  await expect(editDialog.getByRole('heading', { name: 'Edit user' })).toBeVisible()
  const nameField = editDialog.getByLabel('Name')
  await nameField.fill(renamed)
  await nameField.press('Enter')
  await expect(editDialog).toBeHidden()
  await expect(row).toContainText(renamed)

  // --- Delete ---------------------------------------------------------------
  await row.getByRole('button', { name: 'Open actions menu' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm.getByRole('heading', { name: 'Delete user' })).toBeVisible()
  await confirm.getByRole('button', { name: 'Delete' }).click()
  await expect(confirm).toBeHidden()
  await expect(row).toHaveCount(0)
})
