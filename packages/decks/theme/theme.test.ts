/**
 * Guards for the theme source: the default and the shipped alternate both
 * resolve, keep their ink floor readable, and define every token the styles
 * read.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance } from '../story/ramps'
import defaults from './default.json'
import { HUE_NAMES, deepMerge, resolveAliases, resolveTheme, themeCss } from './resolve'

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))
const alternate = JSON.parse(readFileSync(here('../../../examples/od-templates/theme.json'), 'utf8'))

const THEMES = {
  default: resolveTheme(defaults),
  'od-templates': resolveTheme(defaults, alternate),
  'texas-2026': resolveTheme(defaults, JSON.parse(readFileSync(here('../../../decks/texas-2026/theme.json'), 'utf8'))),
}

describe.each(Object.entries(THEMES))('%s theme', (_, theme) => {
  it('clears 3:1 against the canvas at ink step 1', () => {
    for (const hue of HUE_NAMES)
      expect(contrastRatio(theme.ramps[hue][0], theme.surfaces.canvas)).toBeGreaterThanOrEqual(3)
  })

  it('gets lighter with every ramp step', () => {
    for (const hue of HUE_NAMES) {
      const lums = theme.ramps[hue].map(relativeLuminance)
      for (let i = 1; i < lums.length; i++) expect(lums[i]).toBeGreaterThan(lums[i - 1])
    }
  })

  it('leaves no alias unresolved', () => {
    expect(JSON.stringify(theme)).not.toMatch(/\{[\w.-]+\}/)
  })
})

describe('alternate palette', () => {
  it('is a different palette, not a copy of the default', () => {
    const a = THEMES.default
    const b = THEMES['od-templates']
    expect(b.surfaces.canvas).not.toBe(a.surfaces.canvas)
    expect(b.text.primary).not.toBe(a.text.primary)
    for (const hue of HUE_NAMES) expect(b.ramps[hue]).not.toEqual(a.ramps[hue])
  })

  it('re-resolves default aliases against its own ramps', () => {
    // default.json says accents.cyan = {ramps.cyan.2}; the override only sets ramps.
    expect(THEMES['od-templates'].accents.cyan).toBe(alternate.ramps.cyan[1])
  })
})

describe('resolve', () => {
  it('reads ramp aliases as 1-based ink steps', () => {
    const t = resolveAliases({ ramps: { cyan: ['#000001', '#000002'] }, a: '{ramps.cyan.2}' })
    expect(t).toMatchObject({ a: '#000002' })
  })

  it('expands aliases inside longer strings and through other aliases', () => {
    const t = resolveAliases({ x: '#123456', y: '{x}', g: 'linear-gradient({y} 0%, {x} 100%)' })
    expect(t).toMatchObject({ g: 'linear-gradient(#123456 0%, #123456 100%)' })
  })

  it('rejects unknown aliases and cycles', () => {
    expect(() => resolveAliases({ a: '{nope.b}' })).toThrow(/unknown alias/)
    expect(() => resolveAliases({ a: '{b}', b: '{a}' })).toThrow(/cycle/)
  })

  it('merges objects key by key and replaces arrays whole', () => {
    expect(deepMerge({ a: { b: 1, c: 2 }, l: [1, 2, 3] }, { a: { c: 9 }, l: [7] })).toEqual({
      a: { b: 1, c: 9 },
      l: [7],
    })
  })

  it('rejects a ramp that is not four hex colors', () => {
    expect(() => resolveTheme(defaults, { ramps: { cyan: ['#000000'] } })).toThrow(/ramps.cyan/)
  })
})

describe('tokens css', () => {
  const pkg = here('..')
  const files = ['styles', 'components', 'viewer/styles'].flatMap((dir) =>
    readdirSync(`${pkg}/${dir}`)
      .filter((f) => /\.(css|vue)$/.test(f))
      .map((f) => readFileSync(`${pkg}/${dir}/${f}`, 'utf8')),
  )
  const all = (re: RegExp, text: string) => [...text.matchAll(re)].map((m) => m[1])

  it('defines every --od- token the styles read without a fallback', () => {
    const generated = new Set(all(/(--od-[\w-]+):/g, themeCss(THEMES.default)))
    // Declared in a stylesheet or bound from a component's style object.
    const declaredLocally = new Set(files.flatMap((f) => all(/['"]?(--od-[\w-]+)['"]?\s*:/g, f)))
    const missing = files
      .flatMap((f) => all(/var\((--od-[\w-]+)\s*\)/g, f))
      .filter((v) => !generated.has(v) && !declaredLocally.has(v))
    expect([...new Set(missing)]).toEqual([])
  })

  it('emits glows as rgb triplets for rgba(var(), alpha)', () => {
    expect(themeCss(THEMES.default)).toContain('--od-glow-primary-rgb: 6, 182, 212;')
  })
})
