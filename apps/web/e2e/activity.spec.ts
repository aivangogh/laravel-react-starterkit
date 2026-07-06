import { expect, test } from '@playwright/test'
import { createUser, login } from './helpers'

/**
 * The activity log reflects real actions. Creating a user writes an activity record (the `User`
 * model logs `created`/`updated`/`deleted` via Spatie activitylog); the activity page must then
 * surface it instead of the empty state.
 */
test('records actions in the activity log', async ({ page }) => {
  await login(page)
  await createUser(page, 'Activity Subject')

  await page.goto('/activity')
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible()

  // The empty state is gone and a "created" entry is on screen.
  await expect(page.getByText('No activity has been recorded yet.')).toBeHidden()
  await expect(page.getByRole('table').getByText(/created/i).first()).toBeVisible()
})
