/**
 * Guard: the view-transition name map and the null list hold the same set.
 *
 * A hand-off is two rules in story-frame.css. One assigns the name under
 * `.vt-on`, one nulls it again inside the presenter, the print container and
 * the overview, where the same slide can be on screen twice and a duplicate
 * name aborts the whole transition. A name that reaches only the first list
 * looks fine in the slide view and breaks the presenter, which is the one
 * place nobody snapshots, so the two lists are compared here instead.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const CSS = ['story-frame.css', 'story-marks.css']
  .map((name) => readFileSync(fileURLToPath(new URL(`../styles/${name}`, import.meta.url)), 'utf8'))
  .join('\n')

/** The block that nulls every name, from `:is(.slidev-presenter` to its brace. */
const NULL_LIST = (() => {
  const start = CSS.indexOf(':is(.slidev-presenter')
  if (start < 0) throw new Error('null list not found in the story CSS')
  return CSS.slice(start, CSS.indexOf('view-transition-name: none;', start))
})()

/** The `.vt-on` rules, which are the only place a name is assigned. */
const VT_ON = CSS.split('\n')
  .filter((line) => line.includes('.vt-on '))
  .join('\n')

function classes(text: string, pattern: RegExp): Set<string> {
  return new Set([...text.matchAll(pattern)].map((m) => m[0]))
}

/** Every `vt-*` hand-off class the story CSS mentions. `vt-on` is the gate. */
const NAMES = classes(CSS, /\.vt-[a-z0-9-]+/g)
NAMES.delete('.vt-on')

describe('view transition names', () => {
  it('finds the hand-off classes', () => {
    expect(NAMES.size).toBeGreaterThan(3)
  })

  it('assigns every hand-off class a name under .vt-on', () => {
    const assigned = classes(VT_ON, /\.vt-[a-z0-9-]+/g)
    assigned.delete('.vt-on')
    expect([...NAMES].filter((name) => !assigned.has(name))).toEqual([])
  })

  it('nulls every hand-off class in the presenter, print and overview', () => {
    const nulled = classes(NULL_LIST, /\.vt-[a-z0-9-]+/g)
    expect([...NAMES].filter((name) => !nulled.has(name))).toEqual([])
  })

  it('nulls the headline and the prose card, which carry names without a vt- class', () => {
    expect(NULL_LIST).toContain('.od-story-head')
    expect(NULL_LIST).toContain('.od-story-card')
  })

  it('nulls all three containers in one rule', () => {
    expect(NULL_LIST).toContain('.slidev-presenter')
    expect(NULL_LIST).toContain('#print-container')
    expect(NULL_LIST).toContain('.slidev-overview')
    expect(CSS.match(/view-transition-name: none;/g)).toHaveLength(1)
  })
})
