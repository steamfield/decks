/**
 * Guards for the theme source: the default and every registered deck's
 * theme.json resolve, keep their ink floor readable, and define every token
 * the styles read.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance } from '../story/ramps'
import { ROOT_DIR } from '../story/test-decks'
import defaults from './default.json'
import { HUE_NAMES, deepMerge, resolveAliases, resolveTheme, themeCss } from './resolve'

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'))

/**
 * Deck name -> the theme.json next to its slides.md, for every registered
 * deck that has one, so a new deck's theme is checked the day it is
 * registered. Keyed by `name`, not alias: the alias is a CLI shorthand.
 */
const DECK_THEMES: Record<string, string> = {}
for (const [alias, deck] of Object.entries(readJson(join(ROOT_DIR, 'decks.json')))) {
  if (alias.startsWith('_') || !deck || typeof deck !== 'object') continue
  const { entry, name } = deck as { entry?: string; name?: string }
  if (!entry || !name) continue
  const file = join(ROOT_DIR, dirname(entry), 'theme.json')
  if (existsSync(file)) DECK_THEMES[name] = file
}

/** The resolved theme for `default` or a deck name. Resolved on call, inside the test that reads it. */
const themeFor = (name: string) =>
  name === 'default' ? resolveTheme(defaults) : resolveTheme(defaults, readJson(DECK_THEMES[name]))

describe.each(['default', ...Object.keys(DECK_THEMES)])('%s theme', (name) => {
  it('resolves, clears 3:1 at ink step 1, lightens every ramp step, and leaves no alias', () => {
    const theme = themeFor(name)
    for (const hue of HUE_NAMES) {
      expect(
        contrastRatio(theme.ramps[hue][0], theme.surfaces.canvas),
        `${hue} step 1 against the canvas`,
      ).toBeGreaterThanOrEqual(3)
      const lums = theme.ramps[hue].map(relativeLuminance)
      for (let i = 1; i < lums.length; i++)
        expect(lums[i], `${hue} step ${i + 1} is lighter than step ${i}`).toBeGreaterThan(lums[i - 1])
    }
    expect(JSON.stringify(theme)).not.toMatch(/\{[\w.-]+\}/)
  })
})

describe('alternate palette', () => {
  it('is a different palette, not a copy of the default', () => {
    const a = themeFor('default')
    const b = themeFor('od-templates')
    expect(b.surfaces.canvas).not.toBe(a.surfaces.canvas)
    expect(b.text.primary).not.toBe(a.text.primary)
    for (const hue of HUE_NAMES) expect(b.ramps[hue]).not.toEqual(a.ramps[hue])
  })

  it('re-resolves default aliases against its own ramps', () => {
    // default.json says accents.cyan = {ramps.cyan.2}; the override only sets ramps.
    expect(themeFor('od-templates').accents.cyan).toBe(readJson(DECK_THEMES['od-templates']).ramps.cyan[1])
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
    const generated = new Set(all(/(--od-[\w-]+):/g, themeCss(themeFor('default'))))
    // Declared in a stylesheet or bound from a component's style object.
    const declaredLocally = new Set(files.flatMap((f) => all(/['"]?(--od-[\w-]+)['"]?\s*:/g, f)))
    const missing = files
      .flatMap((f) => all(/var\((--od-[\w-]+)\s*\)/g, f))
      .filter((v) => !generated.has(v) && !declaredLocally.has(v))
    expect([...new Set(missing)]).toEqual([])
  })

  it('emits the shape group as --od-<key>, overridable like any group', () => {
    const css = themeCss(themeFor('default'))
    expect(css).toContain('--od-radius: 12px;')
    expect(css).toContain('--od-hairline: 1px;')
    expect(css).toContain('--od-card-width: 36;')
    expect(css).toContain('--od-dim: 0.4;')
    expect(themeCss(resolveTheme(defaults, { shape: { radius: '4px' } }))).toContain('--od-radius: 4px;')
  })

  it('keeps the CSS fallbacks equal to the shape defaults, so a var miss changes nothing', () => {
    const shape = themeFor('default').shape as Record<string, string>
    const uses = files.flatMap((f) => [
      ...f.matchAll(/var\(--od-(radius|hairline|card-width|dim),\s*([^)]+)\)/g),
    ])
    expect(uses.length).toBeGreaterThan(0)
    for (const [, key, fallback] of uses) expect(`${key}: ${fallback.trim()}`).toBe(`${key}: ${shape[key]}`)
  })

  it('defaults fonts.serif to the sans, and follows a deck that sets only the sans', () => {
    expect(themeFor('default').fonts.serif).toBe(themeFor('default').fonts.sans)
    expect(resolveTheme(defaults, { fonts: { sans: 'Lato' } }).fonts.serif).toBe('Lato')
  })

  it('rejects a shape number with a unit', () => {
    expect(() => resolveTheme(defaults, { shape: { dim: '40%' } })).toThrow(/shape.dim/)
  })

  it('emits glows as rgb triplets for rgba(var(), alpha)', () => {
    expect(themeCss(themeFor('default'))).toContain('--od-glow-primary-rgb: 6, 182, 212;')
  })
})
