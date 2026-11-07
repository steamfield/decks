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
// It also holds the text pass both walks share: `harvestText` reads a
// slide's visible text where it renders (headline, card copy, chips, SVG
// labels, foreignObject and other text), and the line count behind the
// wrapped-headline warning. `decks review-prose` builds its prompt from it.
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

/**
 * A story headline that renders on more lines than this gets a warning from
 * `shot` and `snap`. One line: every headline texas-2026's slide runs had to
 * shorten by hand rendered on two, and a limit of two catches none of them.
 * state-of-js slides 2 to 5 warn at one; their headlines carry the same kind
 * of leading qualifier. See RFC 0005, "Results".
 */
export const HEAD_LINE_LIMIT = 1

/**
 * How many lines a run of text occupies, from the client rects of its text
 * nodes (`{ top, height, width }`). A rect starts a new line when its top sits
 * more than half a line below the previous line's; rects on one line (an
 * inline element splits a line into several) share a top within that margin.
 */
export function lineCount(rects) {
  const tops = rects
    .filter((r) => r.height > 0 && r.width > 0)
    .map((r) => ({ top: r.top, half: r.height / 2 }))
    .sort((a, b) => a.top - b.top)
  let lines = 0
  let last = -Infinity
  for (const { top, half } of tops) {
    if (top > last + half) {
      lines++
      last = top
    }
  }
  return lines
}

/**
 * The visible text of slide `slide` as it renders at this click, and the line
 * count of each story headline. Returns `{ entries, heads }`. `entries` is
 * `{ kind, text }` in document order, kind one of `head` (h2.od-story-head),
 * `lead` and `body` (the story card's data-lead and data-body), `chip`
 * (.od-inkchip), `svg` (an SVG <text>), `foreign` (text inside a
 * foreignObject) and `text` (any other visible block of text on the slide).
 * `heads` is `{ text, lines }`. Text under an element faded below 5% opacity
 * or hidden is left out, so a label that fades in at click 2 first appears
 * at click 2; so are the story's beat dots and strings with no letter in them
 * (axis ticks, bare figures).
 */
export async function harvestText(page, slide) {
  return page.evaluate(
    ({ slide, lineCountSrc }) => {
      const lineCount = new Function(`return (${lineCountSrc})`)()
      const root = document.querySelector(`.slidev-page-${slide}`) ?? document.body
      const squash = (s) => (s ?? '').replace(/\s+/g, ' ').trim()
      const wordy = (s) => /\p{L}/u.test(s)
      const visible = (el) => {
        let alpha = 1
        for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
          const cs = getComputedStyle(e)
          if (cs.display === 'none' || cs.visibility === 'hidden') return false
          // A screen-reader-only block (`.sr-only`: absolute, clipped, 1px).
          if (cs.position === 'absolute' && (cs.clip !== 'auto' || cs.overflow === 'hidden')) {
            const r = e.getBoundingClientRect()
            if (r.width <= 1 && r.height <= 1) return false
          }
          alpha *= Number(cs.opacity)
        }
        return alpha >= 0.05
      }
      const isBlock = (el) =>
        el.tagName === 'foreignObject' || !getComputedStyle(el).display.startsWith('inline')
      const nearestBlock = (node) => {
        let el = node.parentElement
        while (el && el !== root && !isBlock(el)) el = el.parentElement
        return el ?? root
      }
      const entries = []
      const heads = []
      const add = (kind, text) => {
        text = squash(text)
        if (text && wordy(text)) entries.push({ kind, text })
      }
      const owners = new Set()
      // Plain text is grouped by the block element that holds it, so an
      // inline <strong> stays inside its sentence.
      const blocks = new Map()
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim()) continue
        const el = node.parentElement
        if (!el || el.closest('script, style, .od-story-foot')) continue
        const inForeign = el.closest('foreignObject')
        const head = el.closest('h2.od-story-head')
        const card = el.closest('.od-story-card')
        const chip = el.closest('.od-inkchip')
        const svgText = inForeign ? null : el.closest('text')
        const owner = head ?? card ?? chip ?? svgText
        if (owner) {
          if (owners.has(owner)) continue
          owners.add(owner)
          if (!visible(owner)) continue
          if (owner === head) {
            add('head', head.innerText)
            // Only the headline's own text counts: a child block (a detail
            // line set on purpose) is not a wrap.
            const rects = []
            const own = document.createTreeWalker(head, NodeFilter.SHOW_TEXT)
            for (let t = own.nextNode(); t; t = own.nextNode()) {
              if (!t.textContent.trim() || nearestBlock(t) !== head) continue
              const range = document.createRange()
              range.selectNodeContents(t)
              for (const r of range.getClientRects())
                rects.push({ top: r.top, height: r.height, width: r.width })
            }
            heads.push({ text: squash(head.innerText), lines: lineCount(rects) })
          } else if (owner === card) {
            add('lead', card.dataset.lead)
            add('body', card.dataset.body)
          } else if (owner === chip) add('chip', chip.textContent)
          else {
            // A <tspan> placed with x or dy starts a new line: join it with a space.
            const parts = [...svgText.childNodes].map((n) =>
              n.nodeType === 1 && (n.hasAttribute('x') || n.hasAttribute('dy'))
                ? ` ${n.textContent} `
                : n.textContent,
            )
            add('svg', parts.join(''))
          }
          continue
        }
        if (!visible(el)) continue
        const block = nearestBlock(node)
        if (!blocks.has(block)) {
          const entry = { kind: inForeign ? 'foreign' : 'text', parts: [] }
          blocks.set(block, entry)
          entries.push(entry)
        }
        blocks.get(block).parts.push(node.textContent)
      }
      return {
        entries: entries
          .map((e) => (e.parts ? { kind: e.kind, text: squash(e.parts.join(' ')) } : e))
          .filter((e) => e.text && wordy(e.text)),
        heads,
      }
    },
    { slide: String(slide), lineCountSrc: lineCount.toString() },
  )
}

/** The warning `shot` and `snap` print for a headline over `limit` lines, or null. */
export function wrapWarning(slide, click, head, limit = HEAD_LINE_LIMIT) {
  if (head.lines <= limit) return null
  return `warning: slide ${slide} click ${click}: headline wraps to ${head.lines} lines (limit ${limit}): "${head.text}"`
}
