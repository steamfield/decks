import { describe, expect, it } from 'vitest'
import { DRAW, DRAW_CSS, DUR, easedStagger, SETTLE, SETTLE_CSS, TRACE, TRACE_CSS, gsap } from './easings'

const EXPECTED: Record<string, number> = {
  tick: 0.03,
  opacity: 0.14,
  draw: 0.24,
  card: 0.3,
  color: 0.34,
  eraseDelay: 0.35,
  eraseHold: 0.49,
  grow: 0.56,
  morph: 0.6,
  scale: 0.9,
  gather: 1.6,
  trace: 1.8,
  bloom: 2.4,
}

describe('easings', () => {
  it('exposes every duration in seconds', () => {
    expect(Object.keys(DUR).sort()).toEqual(Object.keys(EXPECTED).sort())
    for (const [key, value] of Object.entries(EXPECTED)) {
      expect(DUR[key as keyof typeof DUR]).toBeCloseTo(value, 5)
    }
  })

  it('names three easings and ships the CSS twins', () => {
    expect(SETTLE).toBe('odSettle')
    expect(DRAW).toBe('odDraw')
    expect(TRACE).toBe('odTrace')
    expect(SETTLE_CSS).toBe('cubic-bezier(.32,.72,0,1)')
    expect(DRAW_CSS).toBe('cubic-bezier(.65,0,.35,1)')
    expect(TRACE_CSS).toBe('cubic-bezier(.62,.02,.18,1)')
  })

  it('registers every ease with gsap', () => {
    expect(typeof gsap.parseEase(SETTLE)).toBe('function')
    expect(typeof gsap.parseEase(DRAW)).toBe('function')
    expect(typeof gsap.parseEase(TRACE)).toBe('function')
  })

  it('maps the unit interval onto itself', () => {
    for (const name of [SETTLE, DRAW, TRACE]) {
      const ease = gsap.parseEase(name)
      expect(ease(0)).toBeCloseTo(0, 3)
      expect(ease(1)).toBeCloseTo(1, 3)
    }
  })

  it('spreads a stagger on an ease-in-out curve, not even steps', () => {
    const offsets = Array.from({ length: 11 }, (_, i) => easedStagger(i, 11, 1))
    expect(offsets[0]).toBe(0)
    expect(offsets[10]).toBeCloseTo(1, 5)
    expect(offsets[5]).toBeCloseTo(0.5, 5)
    const gaps = offsets.slice(1).map((o, i) => o - offsets[i])
    expect(gaps[0]).toBeLessThan(gaps[4])
    expect(gaps[9]).toBeLessThan(gaps[5])
    expect(easedStagger(0, 1, 1)).toBe(0)
    expect(easedStagger(3, 5, 0)).toBe(0)
  })
})
