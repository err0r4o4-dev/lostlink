import { expect, test } from '@playwright/test'

async function mockAuthenticatedSession(page: import('@playwright/test').Page, role: 'user' | 'staff' | 'admin' = 'user') {
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
          role,
          created_at: '2026-09-09T00:00:00Z',
        },
      }),
    })
  })
}

const routeCases = [
  ['/', /Lost items deserve/],
  ['/search', /Search LostLink/],
  ['/report', /What happened/],
  ['/report/lost', /Report a lost item/],
  ['/report/found', /Report a found item/],
  ['/items/item-reference', /Public report/],
  ['/matches', /Potential matches/],
  ['/matches/match-reference', /Review available attributes/],
  ['/verification', /How ownership verification works/],
  ['/claims/new', /Start a claim/],
  ['/claims/claim-reference', /Claim details are unavailable/],
  ['/tracking', /Track a report or claim/],
  ['/notifications', /Notifications/],
  ['/profile', /Profile and preferences/],
  ['/help', /LostLink guide/],
  ['/locations', /Explore approximate areas/],
  ['/onboarding', /Privacy-conscious by design/],
  ['/staff', /Operations dashboard/],
  ['/staff/reports', /Report queue/],
  ['/staff/matches', /Matching review/],
  ['/staff/claims', /Claim review/],
  ['/login', /Sign in to LostLink/],
  ['/register', /Create your account/],
  ['/forgot-password', /Recover account access/],
  ['/reset-password', /Set a new password/],
] as const

const viewports = [375, 390, 430, 768, 1024, 1280, 1440, 1920]
const responsiveRoutes = ['/report/lost', '/search', '/matches/match-reference', '/claims/new', '/tracking', '/help', '/locations', '/staff/reports', '/login']

test('renders every approved frontend destination', async ({ page }) => {
  await mockAuthenticatedSession(page, 'admin')
  for (const [route, heading] of routeCases) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole('main')).toHaveCount(1)
  }
})

test('keeps representative surfaces responsive at every required width', async ({ page }) => {
  await mockAuthenticatedSession(page, 'admin')
  for (const width of viewports) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    for (const route of responsiveRoutes) {
      await page.goto(route)
      await expect(page.getByRole('main')).toBeVisible()
      const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
      expect(dimensions.scrollWidth, `${route} overflowed at ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth)
    }
  }
})

test('validates and reviews a report without pretending to submit it', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await page.goto('/report/lost')
  await page.getByRole('button', { name: 'Review report' }).click()
  await expect(page.getByText('Enter a clear item name.')).toBeVisible()
  await page.getByLabel('Item name').fill('Black water bottle')
  await page.getByLabel('Category').fill('Drinkware')
  await page.getByRole('textbox', { name: /^Public description/ }).fill('Matte black bottle with a silver lid.')
  await page.getByLabel('Date lost').fill('2026-09-09')
  await page.getByLabel('Approximate location').fill('Campus library')
  await page.getByRole('checkbox', { name: /kept contact information/i }).check()
  await page.getByRole('button', { name: 'Review report' }).click()
  await expect(page.getByRole('heading', { name: 'Review your report' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit report' })).toBeEnabled()
  await expect(page.getByText('Private fields stay local')).toBeVisible()
})

test('redirects unauthenticated users away from protected destinations', async ({ page }) => {
  await page.goto('/report/lost')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to LostLink' })).toBeVisible()
})

test('supports search state without issuing an unavailable product request', async ({ page }) => {
  await page.route('**/api/v1/reports?*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ reports: [], pagination: { limit: 20, offset: 0 } }),
    })
  })
  await page.goto('/search')
  await page.getByRole('searchbox', { name: 'Search lost and found reports' }).fill('water bottle')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page).toHaveURL(/q=water(?:\+|%20)bottle/)
  await expect(page.getByRole('heading', { name: 'No reports found' })).toBeVisible()
})

test('provides truthful authentication validation and pending state', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /Sign in/ }).click()
  await expect(page.getByText('Use at least 3 characters.')).toBeVisible()
  await expect(page.getByText('Enter your password.')).toBeVisible()
  await page.getByLabel('University email or account identifier').fill('student@example.edu')
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('local-test-only')
  await page.getByRole('button', { name: /Sign in/ }).click()
  await expect(page.getByRole('alert')).toContainText('Sign in failed')
})

test('renders a deliberate not-found state', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/')
})

test('moves focus to main content after client-side navigation', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Report' }).click()
  await expect(page).toHaveURL(/\/report$/)
  await expect(page.getByRole('main')).toBeFocused()
})

test('switches between Thai and English next to the notification action', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const notificationAction = page.getByRole('link', { name: 'Notifications' })
  const thaiLanguageAction = page.getByRole('button', { name: 'เปลี่ยนภาษาเป็นไทย' })
  await expect(notificationAction).toBeVisible()
  await expect(thaiLanguageAction).toBeVisible()
  await expect(thaiLanguageAction).toContainText('TH')
  await expect(thaiLanguageAction).toContainText('EN')
  await expect(thaiLanguageAction.locator('svg')).toHaveCount(0)
  await expect(thaiLanguageAction.getByText('TH', { exact: true })).not.toHaveClass(/bg-brand/)
  await expect(thaiLanguageAction.getByText('EN', { exact: true })).toHaveClass(/bg-brand/)
  await expect(thaiLanguageAction.locator('xpath=following-sibling::*[1]')).toHaveAttribute('aria-label', 'Notifications')
  const languageBox = await thaiLanguageAction.boundingBox()
  const notificationBox = await notificationAction.boundingBox()
  expect(languageBox?.width).toBeGreaterThan(notificationBox?.width ?? 0)
  expect(languageBox?.height).toBe(notificationBox?.height)

  await thaiLanguageAction.click()
  await expect(page.getByRole('heading', { level: 1, name: 'ของที่หายควรมีเส้นทางกลับคืนอย่างชัดเจน' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Switch language to English' }).getByText('TH', { exact: true })).toHaveClass(/bg-brand/)
  await expect(page.getByRole('button', { name: 'Switch language to English' }).getByText('EN', { exact: true })).not.toHaveClass(/bg-brand/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'th')

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'ของที่หายควรมีเส้นทางกลับคืนอย่างชัดเจน' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch language to English' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Lost items deserve/ })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})
