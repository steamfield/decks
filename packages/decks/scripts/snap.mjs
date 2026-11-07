// Visual regression harness for a whole deck, against a dev server.
//
//   decks snap <alias> [outDir] [--port N]          # the CLI (deck.mjs)
//   decks snap diff <dirA> <dirB> [threshold]
//   bun run snap <alias> [outDir] [--port N]       # repo shorthand, same CLI
//   bun run snap:diff <dirA> <dirB> [threshold]   # compare two walks, print per-frame diff
//
// The walk is deck agnostic: it starts at /1 and presses ArrowRight until the
// URL stops changing, so hidden slides and per-slide click counts come from
// Slidev itself rather than from parsing slides.md. Each frame waits
// SETTLE_MS, DUR.bloom plus DUR.card plus a 500 ms margin, so every scripted
// beat has landed before the capture. snap.test.ts pins the literal to DUR.
//
// Frames with continuous motion (force graphs, drifting fields) never match
// pixel for pixel, so the way to read a diff is against a noise floor: walk the
// same commit twice, diff those, and any frame whose post-refactor diff sits
// well above its own floor is the one to open. The default threshold is the
// fraction of pixels that may differ before a frame is listed as changed.
//
// Every frame's visible text goes to text.json beside the PNGs (the harvest
// `decks review-prose` reads), and a story headline that wraps past
// HEAD_LINE_LIMIT lines prints a warning; neither fails the walk.
//
// The walk needs playwright-chromium and the diff needs pngjs and pixelmatch,
// all optional peers of slidev-addon-decks, loaded on first use.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { frameName, slideLocation } from './frames.mjs'
import { harvestText, openDeck, optionalPeer, wrapWarning } from './browser.mjs'

const SETTLE_MS = 3200

/** Compare two walks frame by frame. Returns the number of changed frames. */
export async function diff(a, b, threshold = 0.002) {
  const { PNG } = await optionalPeer('pngjs', 'decks snap diff')
  const pixelmatch = (await optionalPeer('pixelmatch', 'decks snap diff')).default
  const names = readdirSync(a)
    .filter((f) => f.endsWith('.png'))
    .sort()
  const outDir = join(b, 'diff')
  mkdirSync(outDir, { recursive: true })
  let changed = 0
  for (const name of names) {
    let imgB
    try {
      imgB = PNG.sync.read(readFileSync(join(b, name)))
    } catch {
      console.log(`${name}\tmissing in ${b}`)
      changed++
      continue
    }
    const imgA = PNG.sync.read(readFileSync(join(a, name)))
    if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
      console.log(`${name}\tsize mismatch`)
      changed++
      continue
    }
    const out = new PNG({ width: imgA.width, height: imgA.height })
    const n = pixelmatch(imgA.data, imgB.data, out.data, imgA.width, imgA.height, {
      threshold: 0.1,
    })
    const frac = n / (imgA.width * imgA.height)
    const flag = frac > threshold ? 'CHANGED' : 'ok'
    if (frac > threshold) {
      changed++
      writeFileSync(join(outDir, name), PNG.sync.write(out))
    }
    console.log(`${name}\t${(frac * 100).toFixed(3)}%\t${flag}`)
  }
  const extra = readdirSync(b).filter((f) => f.endsWith('.png') && !names.includes(f))
  for (const name of extra) {
    console.log(`${name}\tonly in ${b}`)
    changed++
  }
  console.log(`\n${changed} of ${names.length + extra.length} frames over ${threshold * 100}%`)
  return changed
}

/**
 * Walk every slide and click of the deck served at `origin`, harvesting each
 * frame's visible text and warning on a headline that wraps. With `shots`
 * (the default) each frame is also a PNG in `outDir`, with the harvest in
 * `outDir/text.json`. `log` takes the progress lines; `review-prose` sends
 * them to stderr. Returns `{ clean, frames }`: `clean` is false when the walk
 * logged a console error, and `frames` holds `{ slide, click, entries, heads }`
 * per frame in walk order.
 */
export async function walk({ origin, outDir, shots = true, log = console.log }) {
  if (shots) mkdirSync(outDir, { recursive: true })
  const { browser, page, errors } = await openDeck(`${origin}/1`, {
    settleMs: SETTLE_MS,
    what: shots ? 'decks snap' : 'decks review-prose',
  })
  const frames = []
  let last = null
  try {
    for (;;) {
      const name = frameName(page.url())
      const at = slideLocation(page.url())
      const slide = Number(at.pathname.replace(/^\//, '') || '1')
      const click = Number(at.searchParams.get('clicks') ?? '0')
      // WebGL frames can take a while to rasterise on a loaded machine.
      if (shots) await page.screenshot({ path: join(outDir, name), timeout: 120_000 })
      const text = await harvestText(page, slide)
      frames.push({ slide, click, ...text })
      for (const head of text.heads) {
        const warning = wrapWarning(slide, click, head)
        if (warning) log(warning)
      }
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(SETTLE_MS)
      const now = page.url()
      if (now === last || frameName(now) === name) break
      last = now
    }
    if (shots) {
      writeFileSync(join(outDir, 'text.json'), JSON.stringify(frames, null, 2) + '\n')
      log(`${frames.length} frames -> ${outDir}`)
    } else log(`${frames.length} frames read`)
    log('errors:', errors.length ? errors : 'none')
  } finally {
    // Always close, or a failed walk leaves a headless Chromium behind.
    await browser.close()
  }
  // A walk that logged a console error is not a baseline: an unresolved
  // component renders as an empty slot, which diffs clean against itself.
  return { clean: errors.length === 0, frames }
}
