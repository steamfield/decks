/**
 * Guard: the addon's copies of the Decks mark match the site's.
 *
 * `site/src/lib/brand.ts` is the one geometry for the mark; the addon draws it
 * in `DecksCredit.vue` and ships it as `public/favicon.svg` without importing
 * that module (site/ is outside the workspace). site/'s own test compares them
 * too, but it runs only under the site's `make test`, so this one keeps the
 * shipped copies in the project gate. It reads brand.ts as text.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT_DIR } from '../story/test-decks'
import defaults from './default.json'

const read = (rel: string) => readFileSync(join(ROOT_DIR, rel), 'utf8')
const brandFile = join(ROOT_DIR, 'site/src/lib/brand.ts')

describe.skipIf(!existsSync(brandFile))("the addon's copies of the site's mark", () => {
  const brand = read('site/src/lib/brand.ts')
  const back = /back:\s*"([^"]+)"/.exec(brand)?.[1]
  const front = Object.fromEntries(
    [...(/front:\s*\{([^}]+)\}/.exec(brand)?.[1] ?? '').matchAll(/(\w+):\s*([\d.]+)/g)].map(
      ([, k, v]) => [k, v],
    ),
  )
  const rectAttrs = (src: string) =>
    Object.fromEntries(
      [...(/<rect([^>]*)\/>/.exec(src)?.[1] ?? '').matchAll(/(x|y|width|height|rx)="([\d.]+)"/g)].map(
        ([, k, v]) => [k, v],
      ),
    )

  it('reads the geometry from brand.ts', () => {
    expect(back).toMatch(/^M/)
    expect(Object.keys(front).sort()).toEqual(['height', 'rx', 'width', 'x', 'y'])
  })

  it('DecksCredit.vue draws the same back path and front rect', () => {
    const credit = read('packages/decks/components/DecksCredit.vue')
    expect(/class="back"\s+d="([^"]+)"/.exec(credit)?.[1]).toBe(back)
    expect(rectAttrs(credit)).toEqual(front)
  })

  it('the shipped favicon draws the same mark in the default ramps', () => {
    const svg = read('packages/decks/public/favicon.svg')
    expect(svg).toContain(`<path class="b" d="${back}"/>`)
    expect(rectAttrs(svg)).toEqual(front)
    const { cyan, violet } = defaults.ramps
    expect(svg).toContain(`.f{fill:${cyan[1]}}.b{fill:${violet[1]}}`)
    expect(svg).toContain(`.f{fill:${cyan[2]}}.b{fill:${violet[2]}}`)
  })
})
