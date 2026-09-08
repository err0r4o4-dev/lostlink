import { expect, test } from '@playwright/test'

test('shows the bootstrap trust boundary', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lost items deserve')
  await expect(page.getByText('Similarity assists discovery')).toBeVisible()
  await expect(page.getByText('Verification stays private')).toBeVisible()
})
