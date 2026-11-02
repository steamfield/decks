import { describe, expect, it } from 'vitest'
import { unitCellCenter, unitCellHeight } from './grid'
import { rippleProgress } from './ripple'

const FROM = { x: 0, y: 0 }
const NEAR = { x: 100, y: 0 }
const FAR = { x: 900, y: 0 }

describe('rippleProgress', () => {
  it('returns t unchanged with no stagger, clamped to 0..1', () => {
    for (const t of [0, 0.25, 0.5, 1]) {
      expect(rippleProgress(t, FAR, FROM, 0, { reach: 1000 })).toBe(t)
    }
    expect(rippleProgress(-0.2, FAR, FROM, 0, { reach: 1000 })).toBe(0)
    expect(rippleProgress(1.3, FAR, FROM, 0, { reach: 1000 })).toBe(1)
  })

  it('moves nearer marks first', () => {
    const near = rippleProgress(0.4, NEAR, FROM, 0.6, { reach: 1000 })
    const far = rippleProgress(0.4, FAR, FROM, 0.6, { reach: 1000 })
    expect(near).toBeGreaterThan(far)
  })

  it('starts every mark at 0 and lands every mark at 1', () => {
    for (const at of [FROM, NEAR, FAR]) {
      expect(rippleProgress(0, at, FROM, 0.7, { reach: 900, seed: 's', index: 3 })).toBe(0)
      expect(rippleProgress(1, at, FROM, 0.7, { reach: 900, seed: 's', index: 3 })).toBe(1)
    }
  })

  it('is monotonic in t, so seeking back and forth is stable', () => {
    let prev = 0
    for (let k = 0; k <= 100; k++) {
      const v = rippleProgress(k / 100, FAR, FROM, 0.5, { reach: 1000, seed: 'm', index: 7 })
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('jitters deterministically, and only with a seed', () => {
    const opts = { reach: 1000 }
    const plain = rippleProgress(0.5, NEAR, FROM, 0.5, opts)
    const a = rippleProgress(0.5, NEAR, FROM, 0.5, { ...opts, seed: 'x', index: 2 })
    const b = rippleProgress(0.5, NEAR, FROM, 0.5, { ...opts, seed: 'x', index: 2 })
    expect(a).toBe(b)
    // A seed moves the mark off the unjittered value, but only a little.
    expect(a).not.toBe(plain)
    expect(Math.abs(a - plain)).toBeLessThan(0.1)
    // No seed: two marks at the same distance move in lockstep, whatever the index.
    expect(rippleProgress(0.5, NEAR, FROM, 0.5, { ...opts, index: 2 })).toBe(
      rippleProgress(0.5, NEAR, FROM, 0.5, { ...opts, index: 5 }),
    )
    // Seeded: the same two marks can part.
    expect(rippleProgress(0.5, NEAR, FROM, 0.5, { ...opts, seed: 'x', index: 2 })).not.toBe(
      rippleProgress(0.5, NEAR, FROM, 0.5, { ...opts, seed: 'x', index: 5 }),
    )
  })

  it('clamps a full stagger and still starts at 0 and lands at 1', () => {
    for (const at of [FROM, NEAR, FAR]) {
      expect(rippleProgress(0, at, FROM, 1, { reach: 900, seed: 's', index: 3 })).toBe(0)
      expect(rippleProgress(1, at, FROM, 1, { reach: 900, seed: 's', index: 3 })).toBe(1)
    }
  })
})

describe('unitCellCenter', () => {
  it('matches UnitGrid defaults', () => {
    expect(unitCellCenter(0, {})).toEqual({ x: 8, y: 8 })
    // Column 1 of row 1 at the default 20 columns, 16 cell, 8 gap.
    expect(unitCellCenter(21, {})).toEqual({ x: 8 + 24, y: 8 + 24 })
  })

  it('places cells by origin, cols and pitch', () => {
    const geom = { origin: { x: 960, y: 215 }, cols: 12, cellWidth: 54, gapX: 14, gapY: 14 }
    expect(unitCellCenter(13, geom)).toEqual({ x: 960 + 68 + 27, y: 215 + 68 + 27 })
  })

  it('gives a sheet its page height', () => {
    expect(unitCellHeight({ glyph: 'sheet', cellWidth: 50 })).toBeCloseTo(66)
    expect(unitCellHeight({ glyph: 'sheet', cellWidth: 50, cellHeight: 40 })).toBe(40)
  })
})
