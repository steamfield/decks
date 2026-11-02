// Visual regression harness for a whole deck, against a running dev server.
//
//   bun run snap <outDir> [port]             # walk every slide and click, write PNGs
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
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { frameName } from './frames.ts'

const SETTLE_MS = 3200

const [mode, ...rest] = process.argv.slice(2)

if (mode === 'diff') {
  const { PNG } = await import('pngjs')
  const pixelmatch = (await import('pixelmatch')).default
  const [a, b, thresholdArg = '0.002'] = rest
  const threshold = Number(thresholdArg)
  if (!a || !b) {
    console.error('usage: bun run snap:diff <dirA> <dirB> [threshold]')
    process.exit(2)
  }
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
    const diff = new PNG({ width: imgA.width, height: imgA.height })
    const n = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, {
      threshold: 0.1,
    })
    const frac = n / (imgA.width * imgA.height)
    const flag = frac > threshold ? 'CHANGED' : 'ok'
    if (frac > threshold) {
      changed++
      writeFileSync(join(outDir, name), PNG.sync.write(diff))
    }
    console.log(`${name}\t${(frac * 100).toFixed(3)}%\t${flag}`)
  }
  const extra = readdirSync(b).filter((f) => f.endsWith('.png') && !names.includes(f))
  for (const name of extra) {
    console.log(`${name}\tonly in ${b}`)
    changed++
  }
  console.log(`\n${changed} of ${names.length + extra.length} frames over ${threshold * 100}%`)
  process.exit(changed ? 1 : 0)
}

const [outDir, portArg = '3030'] = mode === 'walk' ? rest : [mode, ...rest]
if (!outDir) {
  console.error('usage: bun run snap <outDir> [port]')
  process.exit(2)
}
mkdirSync(outDir, { recursive: true })
const { openDeck } = await import('./browser.mjs')
const { browser, page, errors } = await openDeck(`http://localhost:${portArg}/1`, {
  settleMs: SETTLE_MS,
})

let frames = 0
let last = null
let broken = false
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
  broken = errors.length > 0
} finally {
  // Always close, or a failed walk leaves a headless Chromium behind.
  await browser.close()
}
// A walk that logged a console error is not a baseline: an unresolved
// component renders as an empty slot, which diffs clean against itself.
process.exit(broken ? 1 : 0)
