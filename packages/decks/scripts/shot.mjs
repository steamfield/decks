// Headless screenshot of one slide at each click, against a dev server.
//
//   decks shot <alias> <slide> [clicks] [--port N] [--out DIR]   # the CLI (deck.mjs)
//   bun run shot <alias> <slide> [clicks] [--port N]             # repo shorthand, same CLI
//
// Writes slide-<n>-c<k>.png into the out dir (default: SHOT_DIR, else the
// current directory), prints the card lead and any InkChip per click, and
// lists console errors, including "Failed to resolve component", which means
// the dev server predates a component file and needs a restart. The boot
// sequence is browser.mjs; playwright-chromium is an optional peer.
import { resolve } from 'node:path'
import { openDeck } from './browser.mjs'

/** Screenshot `slide` at clicks 0..`clicks` from the server at `origin`. */
export async function shot({
  origin,
  slide,
  clicks = 0,
  out = process.env.SHOT_DIR ?? process.cwd(),
}) {
  const { browser, page, errors } = await openDeck(`${origin}/${slide}`, {
    settleMs: 3000,
    what: 'decks shot',
  })
  try {
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
      const file = resolve(out, `slide-${slide}-c${c}.png`)
      await page.screenshot({ path: file })
      console.log(`click ${c}: chip=${chip}\n  ${lead.split('\n')[0]}\n  -> ${file}`)
    }
    console.log('errors:', errors.length ? errors : 'none')
  } finally {
    await browser.close()
  }
}
