/**
 * Guard: durations live in easings.ts and nowhere else.
 *
 * A numeric duration literal in a story module or a story component is how a
 * deck drifts into a third and fourth pacing, which reads as sloppy from the
 * back of a room. This scan fails on any `duration: <number>`.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { storyDecks } from './test-decks'

const STORY_DIR = fileURLToPath(new URL('.', import.meta.url))
const COMPONENTS_DIR = fileURLToPath(new URL('../components/', import.meta.url))
const DECKS = storyDecks()
const DECK_COMPONENT_DIRS = DECKS.map((deck) => join(deck.dir, 'components'))

const STORY_COMPONENT = /^(Story|Ink|Unit|Underline|Graph3D|RowStrip|CodeInk|Demo)/
// `duration: 0` is allowed: it means "no tween at all" on the 3d-force-graph
// camera calls, which is a correctness argument rather than a pacing choice.
const NUMERIC_DURATION = /duration:\s*(\d[\d._]*)/g
const EXEMPT = new Set(['easings.ts'])

function collect(dir: string, keep: (name: string) => boolean): string[] {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names
    .filter((name) => ['.ts', '.vue'].includes(extname(name)))
    .filter((name) => !name.endsWith('.test.ts'))
    .filter((name) => !EXEMPT.has(name))
    .filter(keep)
    .map((name) => join(dir, name))
}

function scanTargets(): string[] {
  return [
    ...collect(STORY_DIR, () => true),
    ...collect(COMPONENTS_DIR, (name) => STORY_COMPONENT.test(name)),
    ...DECK_COMPONENT_DIRS.flatMap((dir) => collect(dir, () => true)),
  ]
}

describe('duration literals', () => {
  it('has files to scan', () => {
    expect(scanTargets().length).toBeGreaterThan(0)
  })

  // collect() swallows a missing directory so the shared scan works from a
  // checkout with no decks. Drop the opt-in attribute from a deck and that
  // turns the guard into a no-op, so the set is pinned and every deck in it
  // is asserted to have produced files.
  it('scans every story deck', () => {
    expect(DECKS.map((deck) => deck.alias)).toContain('pitch')
    expect(DECKS.length).toBeGreaterThanOrEqual(2)
    for (const dir of DECK_COMPONENT_DIRS) {
      expect(collect(dir, () => true).length, dir).toBeGreaterThan(0)
    }
  })

  it('would catch a hard coded pace', () => {
    const line = 'gsap.to(el, { opacity: 1, duration: 0.42 })'
    const hits = [...line.matchAll(NUMERIC_DURATION)].map((m) => Number(m[1]))
    expect(hits).toEqual([0.42])
  })

  it('finds no numeric duration outside easings.ts', () => {
    const offenders: string[] = []
    for (const file of scanTargets()) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        for (const match of line.matchAll(NUMERIC_DURATION)) {
          if (Number(match[1]) === 0) continue
          offenders.push(`${file}:${i + 1}: ${line.trim()}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })
})
