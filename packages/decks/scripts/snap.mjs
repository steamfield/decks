// Visual regression harness for a whole deck, against a dev server.
//
//   decks snap <alias> [outDir] [--port N]          # the CLI (deck.mjs)
//   decks snap diff <dirA> <dirB> [threshold]
//   bun run snap <outDir> [port]             # repo shorthand: a server already on :3030
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
// The walk needs playwright-chromium and the diff needs pngjs and pixelmatch,
// all optional peers of slidev-addon-decks, loaded on first use.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { frameName } from './frames.mjs'
import { openDeck, optionalPeer } from './browser.mjs'

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
 * Walk every slide and click of the deck served at `origin`, one PNG per
 * frame into `outDir`. Returns false when the walk logged a console error.
 */
export async function walk({ origin, outDir }) {
  mkdirSync(outDir, { recursive: true })
  const { browser, page, errors } = await openDeck(`${origin}/1`, {
    settleMs: SETTLE_MS,
    what: 'decks snap',
  })
  let frames = 0
  let last = null
  try {
    for (;;) {
      const name = frameName(page.url())
      // WebGL frames can take a while to rasterise on a loaded machine.
      await page.screenshot({ path: join(outDir, name), timeout: 120_000 })
      frames++
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(SETTLE_MS)
      const now = page.url()
      if (now === last || frameName(now) === name) break
      last = now
    }
    console.log(`${frames} frames -> ${outDir}`)
    console.log('errors:', errors.length ? errors : 'none')
  } finally {
    // Always close, or a failed walk leaves a headless Chromium behind.
    await browser.close()
  }
  // A walk that logged a console error is not a baseline: an unresolved
  // component renders as an empty slot, which diffs clean against itself.
  return errors.length === 0
}

// Run directly (`bun run snap`, `bun run snap:diff`): the repo shorthand.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2)
  if (mode === 'diff') {
    const [a, b, thresholdArg = '0.002'] = rest
    if (!a || !b) {
      console.error('usage: bun run snap:diff <dirA> <dirB> [threshold]')
      process.exit(2)
    }
    process.exit((await diff(a, b, Number(thresholdArg))) ? 1 : 0)
  }
  const [outDir, portArg = '3030'] = mode === 'walk' ? rest : [mode, ...rest]
  if (!outDir) {
    console.error('usage: bun run snap <outDir> [port]   (or: decks snap <alias> [outDir])')
    process.exit(2)
  }
  process.exit((await walk({ origin: `http://localhost:${portArg}`, outDir })) ? 0 : 1)
}
