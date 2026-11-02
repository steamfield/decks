/**
 * Guard: no raw viewport unit inside a story slide.
 *
 * A story slide draws ink in a 1920x1080 viewBox and lays its overlay out in
 * CSS, and the two only coincide inside `.od-story-frame`, the largest 16:9
 * box that fits the viewport. Lengths inside the frame are hundredths of the
 * frame (`calc(N * var(--sw))` / `var(--sh)`), never `vw`/`vh`: on a 16:10 or
 * 3:2 screen, which is what full screen gives you, a viewport unit sizes off
 * the window while everything around it sizes off the frame, and the slide
 * clips. See `.claude/rules/deck-patterns.md`, "Story slides".
 *
 * The frame's own definition is the one place a viewport unit is correct, so
 * the two `--od-fw`/`--od-fh` lines and the cover slide's background gradient
 * (which is painted on the slide, outside the frame) are allowlisted.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { storyDecks } from './test-decks'

const SHARED_COMPONENTS = fileURLToPath(new URL('../components/', import.meta.url))
const STORY_CSS = ['story-frame.css', 'story-marks.css'].map((name) =>
  fileURLToPath(new URL(`../styles/${name}`, import.meta.url)),
)
const DECKS = storyDecks()

const VIEWPORT_UNIT = /\b\d+(\.\d+)?v[wh]\b/

/** Lines where a viewport unit is the correct thing to write. */
const ALLOW = [
  // The frame itself: the largest 16:9 box that fits the viewport.
  /--od-f[wh]:/,
  // The cover background gradient is painted on the slide, not in the frame.
  /rgba\(var\(--od-glow-(primary|secondary)-rgb\)/,
  // Both view-transition drift keyframes: --sw/--sh are declared on the slide
  // and a ::view-transition pseudo element hangs off the document root.
  /transform: translateY\(-?1\.4vh\);/,
  // A frame-unit fallback for a component that also renders outside a frame.
  /var\(--s[wh], 1v[wh]\)/,
  // The letterbox overhang a full bleed layer uses to reach the window edges.
  // Anchored to the declaration's own shape, so a later edit to it is scanned
  // rather than exempted by the property name alone.
  /^\s*--od-bleed-x: calc\(\(100vw/,
]

function files(dir: string, exts: string[]): string[] {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names
    .filter((name) => exts.includes(extname(name)))
    .filter((name) => !name.endsWith('.test.ts'))
    .map((name) => join(dir, name))
}

function scanTargets(): string[] {
  return [
    ...STORY_CSS,
    ...files(SHARED_COMPONENTS, ['.vue']),
    ...DECKS.flatMap(({ dir }) => [
      ...files(join(dir, 'components'), ['.vue']),
      ...files(join(dir, 'pages'), ['.md']),
      ...files(join(dir, 'data'), ['.ts']),
      ...files(join(dir, 'styles'), ['.css']),
    ]),
  ]
}

function offenders(): string[] {
  const found: string[] = []
  for (const file of scanTargets()) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!VIEWPORT_UNIT.test(line)) return
        if (ALLOW.some((rule) => rule.test(line))) return
        found.push(`${file}:${i + 1}: ${line.trim()}`)
      })
  }
  return found
}

describe('frame units', () => {
  it('has files to scan', () => {
    expect(scanTargets().length).toBeGreaterThan(10)
  })

  it('scans every story deck', () => {
    expect(DECKS.map((deck) => deck.alias)).toContain('pitch')
    expect(DECKS.length).toBeGreaterThanOrEqual(2)
    for (const { dir } of DECKS) {
      expect(files(join(dir, 'components'), ['.vue']).length, dir).toBeGreaterThan(0)
      expect(files(join(dir, 'pages'), ['.md']).length, dir).toBeGreaterThan(0)
    }
  })

  it('would catch a raw viewport length', () => {
    expect(VIEWPORT_UNIT.test('max-width: 64vw;')).toBe(true)
    expect(VIEWPORT_UNIT.test("'--od-qr-top': '14vh',")).toBe(true)
    expect(VIEWPORT_UNIT.test('max-width: calc(64 * var(--sw));')).toBe(false)
  })

  it('finds no raw viewport unit in a story slide', () => {
    expect(offenders()).toEqual([])
  })
})
