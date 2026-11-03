// Shared browser boot for the screenshot scripts, against a running dev server.
//
// Waits on 'load', never 'networkidle': the dev server keeps HMR sockets open
// and networkidle never fires. The double goto absorbs a mid-reload redirect
// that otherwise lands on a different slide. Console errors are collected,
// including "Failed to resolve component", which means the dev server
// predates a component file and needs a restart. A deck with `routerMode:
// hash` shows a `#/` after the first load; the second goto then uses the
// hash form of the same slide URL.
//
// playwright-chromium is an optional peer dependency of slidev-addon-decks:
// only `shot` and `snap` need it, so it loads on first use and a missing
// install exits with the command that adds it.
import { hashUrl } from './frames.mjs'

/**
 * Import an optional peer, or exit 1 naming the install command. `what` says
 * which command needed it.
 */
export async function optionalPeer(name, what) {
  try {
    return await import(name)
  } catch (err) {
    // Only the package itself missing gets the hint; a broken install rethrows.
    const missing =
      ['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'].includes(err?.code) &&
      String(err.message).includes(name)
    if (!missing) throw err
    console.error(
      `${what} needs ${name}, an optional peer dependency of slidev-addon-decks that is not installed.\n` +
        `Install it in this project:\n  bun add -d ${name}\n  npm install -D ${name}`,
    )
    process.exit(1)
  }
}

/** Exit 1 with the install hint unless playwright-chromium resolves. */
export async function requireChromium(what) {
  return (await optionalPeer('playwright-chromium', what)).chromium
}

/**
 * Launch Chromium at 1920x1080, load `url` twice and settle.
 * `reloadMs` is the wait after the first load, `settleMs` after the second.
 * Returns `{ browser, page, errors }`; the caller closes the browser.
 */
export async function openDeck(url, { reloadMs = 4000, settleMs, what = 'This command' }) {
  const chromium = await requireChromium(what)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' || /resolve component/.test(m.text()))
      errors.push(m.text().slice(0, 160))
  })
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(reloadMs)
  if (page.url().includes('#/') && !url.includes('#/')) url = hashUrl(url)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)
  return { browser, page, errors }
}
