import { expect, test } from '@playwright/test'
import process from 'node:process'

test.skip(process.env.VITE_ROUTER_MODE !== 'hash', 'Runs only against the PR preview router.')

test('supports navigation from a GitHub Pages preview', async ({ page }) => {
  await page.goto('/')

  const registerLink = page.getByRole('link', { name: 'เริ่มต้นใช้งาน' })
  await expect(registerLink).toHaveAttribute('href', '#/register')

  await registerLink.click()

  await expect(page).toHaveURL(/#\/register$/)
  await expect(page.getByRole('main')).toBeVisible()
})
