import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { storyDecks } from './test-decks'

// Attributify can emit [opacity="1"] { opacity: 0.01 } from an unrelated
// template. Animated SVG opacity must use inline styles to keep 1 fully opaque.
describe('SVG opacity isolation', () => {
  it('keeps animated SVG opacity out of attributify selectors', () => {
    const dirs = [
      fileURLToPath(new URL('../components/', import.meta.url)),
      ...storyDecks().map(({ dir }) => join(dir, 'components')),
    ]
    const offenders = dirs.flatMap(root => {
      let names: string[] = []
      try {
        names = readdirSync(root)
      } catch {
        return []
      }
      return names.filter(name => name.endsWith('.vue')).flatMap(name => {
        const source = readFileSync(`${root}/${name}`, 'utf8')
        return [...source.matchAll(/<(?:g|rect|path|text)\b[^>]*\s:(?:fill-)?opacity="[^>]*>/g)].map(() => name)
      })
    })
    expect(offenders).toEqual([])
  })
})
