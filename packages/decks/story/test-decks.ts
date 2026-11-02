/**
 * The decks the story guard tests scan.
 *
 * A deck opts into the story engine with `data-od-story` in its headmatter,
 * which is the same signal the view-transition rules and the addon guard key
 * on at runtime. Deriving the scan set from it means a new story deck is
 * guarded the day it is registered, without editing a test.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The nearest ancestor of this file that holds a `decks.json` registry. */
function registryRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (!existsSync(join(dir, 'decks.json'))) {
    const parent = dirname(dir)
    if (parent === dir) throw new Error('No decks.json above ' + fileURLToPath(import.meta.url))
    dir = parent
  }
  return dir
}

const ROOT_DIR = registryRoot()

export interface StoryDeck {
  alias: string
  /** Absolute path to the deck directory holding `slides.md`. */
  dir: string
}

/** Registered decks whose `slides.md` carries `data-od-story`. */
export function storyDecks(): StoryDeck[] {
  const registry = JSON.parse(readFileSync(join(ROOT_DIR, 'decks.json'), 'utf8')) as Record<
    string,
    { entry?: string } | string
  >
  const decks: StoryDeck[] = []
  for (const [alias, deck] of Object.entries(registry)) {
    if (alias.startsWith('_') || typeof deck === 'string' || !deck.entry) continue
    const entry = join(ROOT_DIR, deck.entry)
    if (!readFileSync(entry, 'utf8').includes('data-od-story')) continue
    decks.push({ alias, dir: dirname(entry) })
  }
  return decks
}
