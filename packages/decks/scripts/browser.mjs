// Shared browser boot for the screenshot scripts, against a running dev server.
//
// Waits on 'load', never 'networkidle': the dev server keeps HMR sockets open
// and networkidle never fires. The double goto absorbs a mid-reload redirect
// that otherwise lands on a different slide. Console errors are collected,
// including "Failed to resolve component", which means the dev server
// predates a component file and needs a restart.
import { chromium } from 'playwright-chromium'

/**
 * Launch Chromium at 1920x1080, load `url` twice and settle.
 * `reloadMs` is the wait after the first load, `settleMs` after the second.
 * Returns `{ browser, page, errors }`; the caller closes the browser.
 */
export async function openDeck(url, { reloadMs = 4000, settleMs }) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' || /resolve component/.test(m.text()))
      errors.push(m.text().slice(0, 160))
  })
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(reloadMs)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)
  return { browser, page, errors }
}
