import { describe, expect, it } from 'vitest'
import { cleanAxis, stackEndLabels, stagger, xScale, yScale } from './scales'
import type { EndLabel } from './scales'

function overlaps(labels: EndLabel[], resolved: number[]): boolean {
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const need = labels[i].h / 2 + labels[j].h / 2
      if (Math.abs(resolved[i] - resolved[j]) < need - 1e-9) return true
    }
  }
  return false
}

describe('scales', () => {
  it('maps the domain onto the stage', () => {
    const x = xScale([1997, 2025], [200, 1720])
    expect(x(1997)).toBe(200)
    expect(x(2025)).toBe(1720)

    const y = yScale([0, 600], [960, 120])
    expect(y(0)).toBe(960)
    expect(y(600)).toBe(120)
  })
})

describe('cleanAxis', () => {
  it('returns hairline rules and exactly two x labels', () => {
    const axis = cleanAxis({
      x: xScale([1997, 2025], [200, 1720]),
      y: yScale([0, 600], [960, 120]),
      first: 1997,
      last: 2025,
    })
    expect(axis.rules.length).toBeGreaterThan(1)
    for (const rule of axis.rules) {
      expect(rule.y).toBeGreaterThanOrEqual(120)
      expect(rule.y).toBeLessThanOrEqual(960)
    }
    expect(axis.labels).toHaveLength(2)
    expect(axis.labels[0]).toEqual({ value: 1997, x: 200, anchor: 'start' })
    expect(axis.labels[1]).toEqual({ value: 2025, x: 1720, anchor: 'end' })
  })
})

describe('stackEndLabels', () => {
  it('leaves already separated labels alone', () => {
    const labels: EndLabel[] = [
      { y: 100, h: 40 },
      { y: 300, h: 40 },
      { y: 500, h: 40 },
    ]
    expect(stackEndLabels(labels)).toEqual([100, 300, 500])
  })

  it('resolves every overlap', () => {
    const labels: EndLabel[] = [
      { y: 400, h: 44 },
      { y: 410, h: 44 },
      { y: 415, h: 44 },
      { y: 700, h: 44 },
    ]
    const out = stackEndLabels(labels)
    expect(overlaps(labels, out)).toBe(false)
  })

  it('preserves vertical order and input indexing', () => {
    const labels: EndLabel[] = [
      { y: 600, h: 50 },
      { y: 100, h: 50 },
      { y: 610, h: 50 },
    ]
    const out = stackEndLabels(labels)
    expect(out[1]).toBeLessThan(out[0])
    expect(out[0]).toBeLessThan(out[2])
    expect(overlaps(labels, out)).toBe(false)
  })

  it('never moves a label upward', () => {
    const labels: EndLabel[] = [
      { y: 200, h: 60 },
      { y: 210, h: 60 },
      { y: 220, h: 60 },
    ]
    const out = stackEndLabels(labels)
    for (let i = 0; i < labels.length; i++) expect(out[i]).toBeGreaterThanOrEqual(labels[i].y)
  })

  it('honours an extra gap', () => {
    const labels: EndLabel[] = [
      { y: 100, h: 20 },
      { y: 105, h: 20 },
    ]
    const out = stackEndLabels(labels, 10)
    expect(out[1] - out[0]).toBeCloseTo(30, 5)
  })

  it('handles an empty list', () => {
    expect(stackEndLabels([])).toEqual([])
  })
})

describe('stagger', () => {
  it('starts each item one step after the last and lands them all at 1', () => {
    expect(stagger(0, 0, 3, 0.2)).toBe(0)
    expect(stagger(0.2, 1, 3, 0.2)).toBe(0)
    expect(stagger(0.6, 0, 3, 0.2)).toBeCloseTo(1, 12)
    expect(stagger(1, 2, 3, 0.2)).toBe(1)
    expect(stagger(1, 0, 3, 0.2)).toBe(1)
  })

  it('is the hand written slice, clamped', () => {
    expect(stagger(0.5, 1, 4, 0.16)).toBe(Math.min(1, Math.max(0, (0.5 - 0.16) / (1 - 3 * 0.16))))
    expect(stagger(-1, 0, 2, 0.25)).toBe(0)
    expect(stagger(2, 1, 2, 0.25)).toBe(1)
  })

  it('is plain progress for one item', () => {
    expect(stagger(0.42, 0, 1, 0.3)).toBeCloseTo(0.42, 12)
  })
})
