import { describe, expect, it } from 'vitest'
import { CANVAS, HUES, RAMPS, contrastRatio, ink, relativeLuminance } from './ramps'

describe('ramps', () => {
  it('has a four step ramp for every hue', () => {
    expect(HUES).toHaveLength(6)
    for (const hue of HUES) {
      expect(RAMPS[hue]).toHaveLength(4)
      for (const hex of RAMPS[hue]) expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('clears 3:1 against the canvas at ink step 1', () => {
    for (const hue of HUES) {
      expect(contrastRatio(ink(hue, 1), CANVAS)).toBeGreaterThanOrEqual(3)
    }
  })

  it('gets lighter with every step', () => {
    for (const hue of HUES) {
      const lums = RAMPS[hue].map(relativeLuminance)
      for (let i = 1; i < lums.length; i++) expect(lums[i]).toBeGreaterThan(lums[i - 1])
    }
  })

  it('clamps out of range steps', () => {
    expect(ink('cyan', 0 as 1)).toBe(RAMPS.cyan[0])
    expect(ink('cyan', 9 as 4)).toBe(RAMPS.cyan[3])
  })
})

describe('contrastRatio', () => {
  it('matches the WCAG reference points', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 2)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })
})
