import { expect, test, type Page } from '@playwright/test'

async function mockAuthenticatedSession(page: Page) {
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'synthetic-e2e-token',
        token_type: 'Bearer',
        expires_at: '2099-01-01T00:00:00Z',
        user: {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          identifier: 'student@example.edu',
          role: 'user',
          created_at: '2026-09-09T00:00:00Z',
        },
      }),
    })
  })
  await page.route('**/api/v1/auth/logout', async (route) => route.fulfill({ status: 204 }))
}

test('renders success feedback without an opaque animation mask', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByRole('dialog', { name: 'Sign out?' }).getByRole('button', { name: 'Sign out' }).click()

  const dialog = page.getByRole('dialog', { name: 'Signed out' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.swal2-success-circular-line-left')).toHaveCount(0)
  await expect(dialog.locator('.swal2-success-circular-line-right')).toHaveCount(0)
  await expect(dialog.locator('.swal2-success-fix')).toHaveCount(0)
  await expect(dialog.locator('.swal2-success-line-tip')).toHaveCSS('animation-name', 'none')
  await expect(dialog.locator('.swal2-success-line-long')).toHaveCSS('animation-name', 'none')
  await dialog.getByRole('button', { name: 'OK' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
