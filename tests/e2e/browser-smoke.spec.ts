import { test, expect } from '@playwright/test'

test.describe('browser smoke', () => {
  test('public landing renders', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('http://127.0.0.1:3100/', { waitUntil: 'networkidle' })
    await expect(page.getByText('The complete gym management solution', { exact: false })).toBeVisible()
    await page.screenshot({ path: 'tests/artifacts/landing.png', fullPage: true })

    expect(errors).toEqual([])
  })

  test('admin route redirects anonymous user to login', async ({ page }) => {
    await page.goto('http://127.0.0.1:3100/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForURL('**/auth/login', { timeout: 15000 })
    await expect(page.getByText('Sign in', { exact: false })).toBeVisible()
    await page.screenshot({ path: 'tests/artifacts/admin-anon-redirect.png', fullPage: true })
  })

  test('dev login and admin sessions page loads', async ({ page }) => {
    await page.goto('http://127.0.0.1:3100/api/dev-login', { waitUntil: 'domcontentloaded' })
    await page.waitForURL('**/dashboard', { timeout: 20000 })

    await page.goto('http://127.0.0.1:3100/admin/sessions', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Session Management' })).toBeVisible()
    await page.screenshot({ path: 'tests/artifacts/admin-sessions.png', fullPage: true })
  })
})
