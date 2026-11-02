import { describe, expect, it } from 'vitest'
import { BRUSH_DEFAULTS, DAB_VERTS, brushRibbon, resample, ribbonBounds } from './brush'
import type { Point } from './types'

function horizontal(length: number): Point[] {
  return [
    { x: 0, y: 500 },
    { x: length, y: 500 },
  ]
}

/** Vertical extent of one dab. On a horizontal centreline that is its width. */
function thickness(d: string): number {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const ys: number[] = []
  for (let i = 1; i < nums.length; i += 2) ys.push(nums[i])
  return Math.max(...ys) - Math.min(...ys)
}

function vertexCount(d: string): number {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).length / 2
}

describe('resample', () => {
  it('walks the polyline at roughly the requested spacing', () => {
    const pts = resample(horizontal(1200), 12)
    expect(pts.length).toBeGreaterThanOrEqual(100)
    expect(pts[0]).toEqual({ x: 0, y: 500 })
    expect(pts[pts.length - 1]).toEqual({ x: 1200, y: 500 })
  })

  it('returns nothing for a degenerate input', () => {
    expect(resample([], 12)).toEqual([])
  })
})

describe('brushRibbon', () => {
  it('emits closed 16 point polygons', () => {
    const dabs = brushRibbon(horizontal(600), { seed: 'salary' })
    expect(dabs.length).toBeGreaterThan(0)
    for (const dab of dabs) {
      expect(dab.d.startsWith('M')).toBe(true)
      expect(dab.d.endsWith('Z')).toBe(true)
      expect(vertexCount(dab.d)).toBe(DAB_VERTS)
      expect(DAB_VERTS).toBe(16)
    }
  })

  it('is identical for the same input and seed', () => {
    const a = brushRibbon(horizontal(600), { seed: 'salary' })
    const b = brushRibbon(horizontal(600), { seed: 'salary' })
    expect(a).toEqual(b)
  })

  it('differs when the seed differs', () => {
    const a = brushRibbon(horizontal(600), { seed: 'salary' })
    const b = brushRibbon(horizontal(600), { seed: 'enrollment' })
    expect(a).not.toEqual(b)
  })

  it('tapers: both endpoints are narrower than the belly', () => {
    const dabs = brushRibbon(horizontal(1200), { seed: 7, wobble: 0, edge: 0 })
    const mid = thickness(dabs[Math.floor(dabs.length / 2)].d)
    expect(thickness(dabs[0].d)).toBeLessThan(mid)
    expect(thickness(dabs[dabs.length - 1].d)).toBeLessThan(mid)
    expect(mid).toBeCloseTo(BRUSH_DEFAULTS.width * BRUSH_DEFAULTS.belly, 0)
  })

  it('scales dab count with arc length', () => {
    const short = brushRibbon(horizontal(300), { seed: 1 })
    const long = brushRibbon(horizontal(1200), { seed: 1 })
    expect(long.length).toBeGreaterThan(short.length * 3)
  })

  it('keeps fill opacity inside the ink range', () => {
    for (const dab of brushRibbon(horizontal(1200), { seed: 'drift' })) {
      expect(dab.fillOpacity).toBeGreaterThanOrEqual(0.22)
      expect(dab.fillOpacity).toBeLessThan(0.93)
    }
  })

  it('overpaints roughly a third of the dabs', () => {
    const dabs = brushRibbon(horizontal(1800), { seed: 'drift' })
    const share = dabs.filter((d) => d.overpaint !== undefined).length / dabs.length
    expect(share).toBeGreaterThan(0.15)
    expect(share).toBeLessThan(0.45)
    for (const dab of dabs) {
      if (dab.overpaint !== undefined) expect(dab.overpaint).toBeCloseTo(0.3, 5)
    }
  })

  it('returns nothing for a polyline with no length', () => {
    expect(brushRibbon([{ x: 10, y: 10 }], { seed: 1 })).toEqual([])
  })
})

describe('ribbonBounds', () => {
  it('covers the drawn ribbon', () => {
    const dabs = brushRibbon(horizontal(600), { seed: 3, wobble: 0, edge: 0 })
    const box = ribbonBounds(dabs)
    expect(box.x).toBeLessThanOrEqual(0)
    expect(box.width).toBeGreaterThan(590)
    expect(box.height).toBeLessThanOrEqual(BRUSH_DEFAULTS.width + 1)
    expect(box.y).toBeGreaterThan(490)
  })

  it('is empty for no dabs', () => {
    expect(ribbonBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
})
