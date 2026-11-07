/**
 * Guard: no new hex colors in component code.
 *
 * A hex literal in a component is a color the deck's `theme.json` cannot
 * reach. This walks the addon's `components/*.vue` and every registered deck's
 * `components/*.vue` and counts hex colors in color contexts only: an SVG
 * color attribute (`fill`, `stroke`, `stop-color`, ...), a color-valued CSS
 * property, or a style-object key of the same name. `url(#id)`, `href="#id"`
 * and HTML entities are not colors and do not match.
 *
 * A line carrying `lint-allow` (bare, or `lint-allow: hex-color`) is exempt,
 * for the rare color that must not follow the theme. Files that already had
 * literals when the guard landed are pinned in `PINNED` by count, so the test
 * fails only on a new one. Lower a count, or drop the entry, in the commit
 * that cleans the file; raising one is the thing this test exists to stop.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ROOT_DIR } from './test-decks'

const ADDON_COMPONENTS = fileURLToPath(new URL('../components/', import.meta.url))

/** Every registered deck's directory, story or conventional. */
function deckDirs(): string[] {
  const registry = JSON.parse(readFileSync(join(ROOT_DIR, 'decks.json'), 'utf8')) as Record<
    string,
    { entry?: string } | string
  >
  return Object.entries(registry)
    .filter(([alias, deck]) => !alias.startsWith('_') && typeof deck !== 'string' && deck.entry)
    .map(([, deck]) => dirname(join(ROOT_DIR, (deck as { entry: string }).entry)))
}

function vueFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.vue'))
      .map((f) => join(dir, f))
  } catch {
    return []
  }
}

/**
 * Properties, attributes and style-object keys whose value is a color: any
 * name ending in `color` (`stop-color`, `border-left-color`, `labelColor`),
 * the shorthands that take one, and custom properties, whose only hex value
 * is a color.
 */
const COLOR_PROP =
  /(?:^|[^\w-])(?:--[\w-]+|[\w-]*color|fill|stroke|background(?:-image)?|border(?:-[a-z]+)*|outline|box-shadow|text-shadow|column-rule|text-decoration|-webkit-text-stroke)['"]?\s*[:=]/gi

/** A 3, 4, 6 or 8 digit hex color, not an entity (`&#160;`) or a `url(#id)`. */
const HEX = /(?<![\w&#])(?<!url\()#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi

function allowed(line: string): boolean {
  if (!line.includes('lint-allow')) return false
  const ids = /lint-allow:\s*([\w-]+(?:\s*,\s*[\w-]+)*)/.exec(line)
  return !ids || ids[1].split(/\s*,\s*/).includes('hex-color')
}

/**
 * Hex colors in color contexts on one line. A hex counts when a color
 * property or attribute precedes it on the line and no `;` closes that
 * declaration in between.
 */
function hexColors(line: string): string[] {
  if (allowed(line)) return []
  const props = [...line.matchAll(COLOR_PROP)].map((m) => m.index! + m[0].length)
  if (!props.length) return []
  return [...line.matchAll(HEX)]
    .filter((m) => props.some((at) => at <= m.index! && !line.slice(at, m.index!).includes(';')))
    .map((m) => m[0])
}

function countIn(file: string): number {
  return readFileSync(file, 'utf8')
    .split('\n')
    .reduce((n, line) => n + hexColors(line).length, 0)
}

/**
 * Hex colors that predate the guard, by file. Clean them when the deck is next
 * touched (RFC 0002) and lower the count with it.
 */
const PINNED: Record<string, number> = {
  'examples/aisd-showcase/components/CampusHoverCard.vue': 14,
  'examples/aisd-showcase/components/ScatterStage.vue': 6,
}

describe('hex colors in components', () => {
  const files = [ADDON_COMPONENTS, ...deckDirs().map((d) => join(d, 'components'))].flatMap(vueFiles)

  it('scans the addon and every registered deck', () => {
    expect(files.some((f) => f.startsWith(ADDON_COMPONENTS))).toBe(true)
    expect(files.some((f) => f.includes('/examples/texas-2026/components/'))).toBe(true)
  })

  it('adds no hex color beyond the pinned baseline', () => {
    const found = Object.fromEntries(
      files.map((f) => [relative(ROOT_DIR, f), countIn(f)] as const).filter(([, n]) => n > 0),
    )
    const over = Object.entries(found)
      .filter(([file, n]) => n > (PINNED[file] ?? 0))
      .map(([file, n]) => `${file}: ${n} (pinned ${PINNED[file] ?? 0})`)
    expect(over).toEqual([])
  })

  it('keeps the baseline current, so a cleaned file cannot regrow its literals', () => {
    const stale = Object.entries(PINNED)
      .map(([file, n]) => [file, n, countIn(join(ROOT_DIR, file))] as const)
      .filter(([, n, now]) => now < n)
      .map(([file, n, now]) => `${file}: pinned ${n}, now ${now}`)
    expect(stale).toEqual([])
  })
})

describe('hexColors', () => {
  it('finds hex in attributes, CSS declarations and style objects', () => {
    expect(hexColors('<rect fill="#fff" />')).toEqual(['#fff'])
    expect(hexColors('<stop stop-color="#1e293b" />')).toEqual(['#1e293b'])
    expect(hexColors('  border: 1px solid #27272a80;')).toEqual(['#27272a80'])
    expect(hexColors("const st = { color: '#e0e0e0', opacity: 1 }")).toEqual(['#e0e0e0'])
    expect(hexColors('  background: linear-gradient(#000, #111);')).toEqual(['#000', '#111'])
    expect(hexColors('.x { --grade-color: #94a3b8; }')).toEqual(['#94a3b8'])
    expect(hexColors("axis: { tickCount: 5, labelColor: '#a1a1aa' }")).toEqual(['#a1a1aa'])
    expect(hexColors(`<circle :fill="on ? '#fb7185' : ink('slate', 1)" />`)).toEqual(['#fb7185'])
  })

  it('ignores ids, links, entities and hex outside a color context', () => {
    expect(hexColors('<path fill="url(#abc)" />')).toEqual([])
    expect(hexColors('<a href="#abc">x</a>')).toEqual([])
    expect(hexColors('<span>&#160;</span> color: var(--od-text)')).toEqual([])
    expect(hexColors("const ID = '#fade'")).toEqual([])
    expect(hexColors('width: 10px; #abc')).toEqual([])
  })

  it('honors lint-allow on the line', () => {
    expect(hexColors('background: #fff; /* lint-allow */')).toEqual([])
    expect(hexColors('background: #fff; /* lint-allow: hex-color */')).toEqual([])
    expect(hexColors('background: #fff; /* lint-allow: em-dash */')).toEqual(['#fff'])
  })
})
