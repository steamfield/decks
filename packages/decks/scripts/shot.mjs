// Headless screenshot of one slide at each click, against a running dev server.
//
//   bun run shot <slide> [clicks] [port]      # from talks/
//
// Writes slide-<n>-c<k>.png into SHOT_DIR (default: the current directory),
// prints the card lead and any InkChip per click, and lists console errors,
// including "Failed to resolve component", which means the dev server predates
// a component file and needs a restart.
//
// Lives here rather than in a scratch directory because playwright-chromium
// resolves from talks/node_modules. The boot sequence is browser.mjs.
import { openDeck } from './browser.mjs'

const [slide, clicksArg = '0', portArg = '3030'] = process.argv.slice(2)
if (!slide) {
  console.error('usage: bun run shot <slide> [clicks] [port]')
  process.exit(2)
}
const clicks = Number(clicksArg)
const url = `http://localhost:${portArg}/${slide}`
const out = process.env.SHOT_DIR ?? process.cwd()

const { browser, page, errors } = await openDeck(url, { settleMs: 3000 })
console.log('at', page.url())

const scope = `.slidev-page-${slide}`
for (let c = 0; c <= clicks; c++) {
  if (c) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(2500)
  }
  const lead = await page
    .locator(`${scope} .od-story-card`)
    .first()
    .innerText()
    .catch(() => '?')
  const chip = await page
    .locator(`${scope} .od-inkchip`)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect()
      return `${el.textContent.trim()} @${Math.round(r.x)},${Math.round(r.y)} op=${getComputedStyle(el).opacity}`
    })
    .catch(() => 'no chip')
  console.log(`click ${c}: chip=${chip}\n  ${lead.split('\n')[0]}`)
  await page.screenshot({ path: `${out}/slide-${slide}-c${c}.png` })
}
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
process.exit(0)
