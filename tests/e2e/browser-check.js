const { chromium } = require('playwright')

;(async () => {

  const results = []
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  async function run(name, fn) {
    const start = Date.now()
    process.stdout.write(`START ${name}\n`)
    try {
      await fn()
      const ms = Date.now() - start
      process.stdout.write(`PASS ${name} ${ms}ms\n`)
      results.push({ name, status: 'PASS', ms })
    } catch (e) {
      const ms = Date.now() - start
      process.stdout.write(`FAIL ${name} ${ms}ms\n`)
      results.push({ name, status: 'FAIL', ms, error: String(e.message || e) })
    }
  }

  await run('landing page loads', async () => {
    await page.goto('http://127.0.0.1:3100/', { waitUntil: 'domcontentloaded', timeout: 180000 })
    await page.waitForSelector('text=The complete gym management solution', { timeout: 60000 })
    await page.screenshot({ path: 'tests/artifacts/landing.png', fullPage: true })
  })

  await run('anonymous admin redirects to login', async () => {
    await page.goto('http://127.0.0.1:3100/admin', { waitUntil: 'domcontentloaded', timeout: 180000 })
    await page.waitForURL('**/auth/login', { timeout: 60000 })
    await page.screenshot({ path: 'tests/artifacts/admin-anon-redirect.png', fullPage: true })
  })

  await run('dev login works', async () => {
    await page.goto('http://127.0.0.1:3100/api/dev-login', { waitUntil: 'domcontentloaded', timeout: 180000 })
    await page.waitForURL('**/dashboard', { timeout: 180000 })
  })

  await run('admin sessions page loads after login', async () => {
    await page.goto('http://127.0.0.1:3100/admin/sessions', { waitUntil: 'domcontentloaded', timeout: 180000 })
    await page.waitForSelector('h1:has-text("Session Management")', { timeout: 60000 })
    await page.screenshot({ path: 'tests/artifacts/admin-sessions.png', fullPage: true })
  })

  await run('dashboard analytics page loads after login', async () => {
    await page.goto('http://127.0.0.1:3100/dashboard/analytics', { waitUntil: 'domcontentloaded', timeout: 180000 })
    await page.waitForSelector('text=Recent Workouts', { timeout: 60000 })
    await page.screenshot({ path: 'tests/artifacts/dashboard-analytics.png', fullPage: true })
  })

  await browser.close()

  if (errors.length) {
    results.push({ name: 'browser page errors', status: 'WARN', count: errors.length, sample: errors.slice(0, 3) })
  }

  console.log(JSON.stringify(results, null, 2))
  process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0)
})()
