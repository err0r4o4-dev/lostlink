import { expect, test } from '@playwright/test'

test.skip(process.env.VITE_ROUTER_MODE !== 'hash', 'Runs only against the PR preview router.')

test('supports navigation from a GitHub Pages preview', async ({ page }) => {
  await page.goto('/')

  const searchLink = page.getByRole('link', { name: /Open search/ })
  await expect(searchLink).toHaveAttribute('href', '#/search')

  await searchLink.click()

  await expect(page).toHaveURL(/#\/search$/)
  await expect(page.getByRole('main')).toBeVisible()
})
