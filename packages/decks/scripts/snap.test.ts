/**
 * The snap harness is the parity gate for every story refactor, so the two
 * things that decide what it compares are pinned here: how a frame is named,
 * and how long it waits before capturing one.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DUR } from '../story/easings'
import { frameName, hashUrl } from './frames.mjs'

describe('frameName', () => {
  it('names a frame by zero padded slide and click count', () => {
    expect(frameName('http://localhost:3031/1')).toBe('s01-c0.png')
    expect(frameName('http://localhost:3031/4?clicks=2')).toBe('s04-c2.png')
    expect(frameName('http://localhost:3031/12?clicks=0')).toBe('s12-c0.png')
  })

  it('reads the route after the hash for a hash-routed deck', () => {
    expect(frameName('http://localhost:3031/#/4?clicks=2')).toBe('s04-c2.png')
    expect(frameName('http://localhost:3031/#/1')).toBe('s01-c0.png')
  })

  it('treats the root as slide 1', () => {
    expect(frameName('http://localhost:3031/')).toBe('s01-c0.png')
  })
})

describe('hashUrl', () => {
  it('moves the path and query behind the hash', () => {
    expect(hashUrl('http://localhost:3031/4?clicks=2')).toBe('http://localhost:3031/#/4?clicks=2')
  })
})

describe('settle time', () => {
  // The script keeps a literal so it never imports the story engine; this
  // assertion is what ties the literal to the pacing it has to outlast: the
  // longest beat (bloom) plus a card swap plus margin.
  it('is the bloom plus a card swap plus 500 ms', () => {
    const src = readFileSync(new URL('./snap.mjs', import.meta.url), 'utf8')
    const literal = Number(src.match(/^const SETTLE_MS = (\d+)$/m)?.[1])
    expect(literal).toBe(Math.round((DUR.bloom + DUR.card) * 1000) + 500)
  })
})
