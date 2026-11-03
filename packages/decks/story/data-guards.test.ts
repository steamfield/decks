/**
 * Guard: every story deck's data modules load without throwing.
 *
 * A deck's `data/*.ts` can check a claim its cards make (a trend still holds,
 * a typed title still matches the data) and throw when it stops holding.
 * `slidev build` bundles those modules without running them, so the throw
 * would only surface in a viewer's browser. Importing each module here runs
 * the guards in `bun run test`, after every data refresh.
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { storyDecks } from './test-decks'

function dataModules(dir: string): string[] {
  try {
    return readdirSync(join(dir, 'data'))
      .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.d.ts'))
      .map((name) => join(dir, 'data', name))
  } catch {
    return []
  }
}

/**
 * Modules that import a runtime value from `slidev-addon-decks/story`, whose
 * index pulls in `@slidev/client` and so only loads inside a Slidev app. A
 * guard written into one of these would not run here; keep guards out of them.
 */
const NEEDS_SLIDEV = new Set(['pitch: data/graph-palette.ts'])

const MODULES = storyDecks().flatMap((deck) =>
  dataModules(deck.dir).map((file) => ({ name: `${deck.alias}: ${file.split('/').slice(-2).join('/')}`, file })),
)

describe('story deck data modules', () => {
  it('finds data modules to load', () => {
    expect(MODULES.length).toBeGreaterThan(0)
  })

  it('skips only modules that exist', () => {
    const names = new Set(MODULES.map((m) => m.name))
    expect([...NEEDS_SLIDEV].filter((name) => !names.has(name))).toEqual([])
  })

  it.each(MODULES.filter((m) => !NEEDS_SLIDEV.has(m.name)).map((m) => [m.name, m.file]))(
    '%s loads',
    async (_name, file) => {
      await expect(import(pathToFileURL(file).href)).resolves.toBeDefined()
    },
  )
})
