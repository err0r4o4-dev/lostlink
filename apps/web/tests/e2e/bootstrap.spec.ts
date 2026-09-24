import { expect, test } from '@playwright/test'

const viewports = [
  { width: 320, height: 844 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

test('shows the public guest home and its trust boundaries', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('ของที่หาย')
  await expect(page.getByText(/AI เป็นเพียงเครื่องมือช่วยค้นหาและจัดอันดับ/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /ไม่ต้องเปิดเผยข้อมูลเกินความจำเป็น/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'เริ่มต้นใช้งาน' })).toHaveAttribute('href', '/register')
  await expect(page.getByRole('link', { name: 'เข้าสู่ระบบ' }).first()).toHaveAttribute('href', '/login')
  await expect(page.getByRole('navigation', { name: 'Mobile primary' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0)
})

test('keeps the guest landing page responsive without authenticated navigation or overflow', async ({ page }) => {
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
    await expect(page.getByRole('navigation', { name: 'Mobile primary' })).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0)
    await expect(page.getByRole('main')).toBeVisible()
  }
})

test('provides keyboard access to the main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'ข้ามไปยังเนื้อหา' })
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

test('uses local production fonts and touch-sized guest actions on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const fontFamily = await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)
  expect(fontFamily).toContain('Inter Variable')
  expect(fontFamily).toContain('Noto Sans Thai Variable')

  await expect(page.getByRole('navigation', { name: 'Mobile primary' })).toHaveCount(0)
  const guestActions = page.getByRole('link', { name: /เข้าสู่ระบบ|สร้างบัญชี|เริ่มต้นใช้งาน|สร้างบัญชีฟรี/ })
  for (const link of await guestActions.all()) {
    const box = await link.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.width).toBeGreaterThanOrEqual(44)
  }
})
