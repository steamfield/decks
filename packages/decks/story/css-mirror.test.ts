/**
 * Guard: the CSS mirrors of the duration table match DUR.
 *
 * story-frame.css keeps a few transitions in CSS (card swap, chip travel, the view
 * transition root and named groups). Their durations are literals, because a
 * stylesheet cannot import easings.ts, so this test reads them back and
 * compares against DUR. Change DUR and the stylesheet together.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DRAW_CSS, DUR, SETTLE_CSS } from './easings'

const CSS = readFileSync(
  fileURLToPath(new URL('../styles/story-frame.css', import.meta.url)),
  'utf8',
)

function ms(seconds: number): string {
  return `${Math.round(seconds * 1000)}ms`
}

function custom(name: string): string {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(CSS)
  if (!m) throw new Error(`${name} not found in story-frame.css`)
  return m[1].trim()
}

/** Every `@keyframes name { ... }` block and every `::view-transition` rule. */
function rootScopedBlocks(): { where: string; body: string }[] {
  const out: { where: string; body: string }[] = []
  const heads = /(@keyframes\s+[\w-]+|[^{}\n]*::view-transition[^{}]*?)\s*\{/g
  for (let m = heads.exec(CSS); m; m = heads.exec(CSS)) {
    // Walk to the matching brace: a keyframes block nests one level.
    let depth = 1
    let i = m.index + m[0].length
    for (; i < CSS.length && depth > 0; i++) {
      if (CSS[i] === '{') depth++
      else if (CSS[i] === '}') depth--
    }
    out.push({ where: m[1].trim(), body: CSS.slice(m.index + m[0].length, i) })
  }
  return out
}

/** The four control points of a cubic-bezier(), so `.32` and `0.32` agree. */
function bezier(value: string): number[] {
  const m = /cubic-bezier\(([^)]+)\)/.exec(value)
  if (!m) throw new Error(`not a cubic-bezier: ${value}`)
  return m[1].split(',').map((n) => Number(n.trim()))
}

describe('story-frame.css mirrors', () => {
  it('custom properties match DUR and the two easings', () => {
    expect(custom('--od-dur-card')).toBe(ms(DUR.card))
    expect(custom('--od-dur-opacity')).toBe(ms(DUR.opacity))
    expect(bezier(custom('--od-settle'))).toEqual(bezier(SETTLE_CSS))
    expect(bezier(custom('--od-draw'))).toEqual(bezier(DRAW_CSS))
  })

  it('view transition root and groups run at the morph duration', () => {
    const groups = /view-transition-group\(\*\)\s*{\s*animation-duration:\s*([^;]+);/.exec(CSS)
    expect(groups?.[1]).toBe(ms(DUR.morph))
    const oldNew = /view-transition-new\(\*\)\s*{\s*animation-duration:\s*([^;]+);/.exec(CSS)
    expect(oldNew?.[1]).toBe(ms(DUR.morph))
    const inRule = /od-vt-in (\d+ms)/.exec(CSS)
    expect(inRule?.[1]).toBe(ms(DUR.morph))
    const outRule = /od-vt-out (\d+ms)/.exec(CSS)
    expect(outRule?.[1]).toBe(ms(DUR.morph))
  })

  it('staggers the card one entrance beat behind the headline', () => {
    const delay = /only-child\s*{\s*animation-delay:\s*([^;]+);/.exec(CSS)
    expect(delay?.[1]).toBe(ms(DUR.opacity * 2))
  })

  it('reduced motion collapses the root transition to a plain fade at the opacity beat', () => {
    const block =
      /prefers-reduced-motion[\s\S]*?view-transition-new\(root\)[^{]*{\s*animation-name:\s*od-vt-fade;\s*animation-duration:\s*([^;]+);/.exec(
        CSS,
      )
    expect(block?.[1]).toBe(ms(DUR.opacity))
  })

  /*
   * --sw and --sh are declared on `.od-slide.is-story`. A ::view-transition
   * pseudo element is generated on the document root and inherits from :root,
   * not from the slide, so a frame unit resolves to nothing there and the
   * keyframe silently drops its transform. Both drift keyframes use a literal
   * vh instead, which is the one place in this file a viewport unit is right.
   */
  it('keeps frame units out of the keyframes and the view transition rules', () => {
    const blocks = rootScopedBlocks()
    expect(blocks.filter((b) => b.where.startsWith('@keyframes')).length).toBeGreaterThan(3)
    expect(blocks.filter((b) => b.where.includes('::view-transition')).length).toBeGreaterThan(4)
    const offenders = blocks
      .filter(({ body }) => /var\(--s[wh]\)/.test(body))
      .map(({ where }) => where)
    expect(offenders).toEqual([])
  })

  it('would catch a frame unit that came back', () => {
    expect(/var\(--s[wh]\)/.test('transform: translateY(calc(1.4 * var(--sh)));')).toBe(true)
  })
})
