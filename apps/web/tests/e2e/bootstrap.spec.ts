import { expect, test } from '@playwright/test'

const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

test('shows the bootstrap trust boundary and planned states', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lost items deserve')
  await expect(page.getByText('Similarity assists discovery')).toBeVisible()
  await expect(page.getByText('Verification stays private')).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search LostLink' })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Report a lost item/ })).toBeDisabled()
})

test('keeps the shell responsive without horizontal page overflow', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(dimensions.scrollWidth, `${viewport.width}px viewport overflowed`).toBeLessThanOrEqual(
      dimensions.clientWidth,
    )
    await expect(page.locator('nav:visible')).toHaveCount(1)
    await expect(page.getByRole('main')).toBeVisible()
  }
})

test('provides keyboard access to the main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')
  await expect(page).toHaveURL(/#main-content$/)
})

test('honors the reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const transitionDuration = await page
    .locator('.ui-transition')
    .first()
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))
  expect(transitionDuration).toBeLessThan(0.001)
})

test('uses local production fonts and touch-sized mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const fontFamily = await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)
  expect(fontFamily).toContain('Inter Variable')
  expect(fontFamily).toContain('Noto Sans Thai Variable')

  const mobileLinks = page.getByRole('navigation', { name: 'Mobile primary' }).getByRole('link')
  await expect(mobileLinks).toHaveCount(3)
  for (const link of await mobileLinks.all()) {
    const box = await link.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.width).toBeGreaterThanOrEqual(44)
  }
})
