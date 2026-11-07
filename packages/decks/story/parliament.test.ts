import { describe, expect, it } from 'vitest'
import { layout, thresholdAngle, type ParliamentLayout } from './parliament'

const RADIUS = 360
const TOTALS = Array.from({ length: 196 }, (_, i) => i + 5)
const sameAngle = (a: { angle: number }, b: { angle: number }) => a.angle === b.angle

/** Group sizes that cut the chamber at roughly a third and two-thirds. */
const thirds = (total: number) => {
  const a = Math.max(1, Math.floor(total / 3))
  const b = Math.max(1, Math.floor(total / 3))
  return [a, b, total - a - b]
}

function checkRows(arc: ParliamentLayout, total: number) {
  expect(arc.seats).toHaveLength(total)
  expect(arc.rowSeats.reduce((sum, n) => sum + n, 0)).toBe(total)
  expect(arc.rowRadii.at(-1)).toBeCloseTo(RADIUS, 9)
  const radiusSum = arc.rowRadii.reduce((sum, r) => sum + r, 0)
  arc.rowSeats.forEach((n, row) => {
    // Largest remainder: each row is within one seat of its share by radius.
    expect(Math.abs(n - (total * arc.rowRadii[row]) / radiusSum)).toBeLessThan(1)
    const angles = arc.seats.filter(seat => seat.row === row).map(seat => seat.angle).sort((a, b) => a - b)
    // Even spacing with half a step of padding at both ends.
    angles.forEach((angle, i) => expect(angle).toBeCloseTo(((i + 0.5) * Math.PI) / n, 10))
    for (const seat of arc.seats.filter(s => s.row === row)) {
      expect(Math.hypot(seat.x, seat.y)).toBeCloseTo(arc.rowRadii[row], 9)
    }
  })
  for (let i = 1; i < arc.rowRadii.length; i++) {
    expect(arc.rowRadii[i] - arc.rowRadii[i - 1]).toBeCloseTo(arc.rowGap, 9)
  }
}

describe('parliament layout', () => {
  it.each(TOTALS)('%i seats: rows in proportion to radius, evenly spaced', total => {
    checkRows(layout(total, { radius: RADIUS }), total)
  })

  it.each(TOTALS)('%i seats: spacing along each row matches the gap between rows', total => {
    const arc = layout(total, { radius: RADIUS })
    if (arc.rowRadii.length > 1) expect(Math.min(...arc.rowSeats)).toBeGreaterThanOrEqual(2)
    arc.rowRadii.forEach((r, row) => {
      const spacing = (Math.PI * r) / arc.rowSeats[row]
      expect(spacing / arc.rowGap).toBeGreaterThan(0.9)
      expect(spacing / arc.rowGap).toBeLessThan(1.25)
    })
  })

  it('adds rows as the chamber grows', () => {
    const rows = TOTALS.map(total => layout(total, { radius: RADIUS }).rowRadii.length)
    expect(rows[0]).toBe(1)
    expect(rows.at(-1)).toBeGreaterThan(5)
    rows.forEach((n, i) => i && expect(n).toBeGreaterThanOrEqual(rows[i - 1]))
  })

  it.each(TOTALS)('%i seats: no two seats overlap', total => {
    const { seats, seatRadius } = layout(total, { radius: RADIUS })
    expect(seatRadius).toBeGreaterThan(0)
    let closest = Infinity
    for (let i = 0; i < seats.length; i++) {
      for (let j = i + 1; j < seats.length; j++) {
        closest = Math.min(closest, Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y))
      }
    }
    expect(closest).toBeGreaterThan(2 * seatRadius)
  })

  it.each(TOTALS)('%i seats: reading order is total, ties going inner row first', total => {
    const { seats } = layout(total, { radius: RADIUS })
    for (let i = 1; i < seats.length; i++) {
      const [a, b] = [seats[i - 1], seats[i]]
      expect(a.angle).toBeGreaterThanOrEqual(b.angle)
      if (sameAngle(a, b)) expect(a.row).toBeLessThan(b.row)
    }
  })

  it.each(TOTALS)('%i seats: groups handed out by index form contiguous wedges', total => {
    const { seats } = layout(total, { radius: RADIUS })
    let start = 0
    const groups = thirds(total).map(size => seats.slice(start, (start += size)))
    groups.forEach((group, g) => {
      const hi = Math.max(...group.map(seat => seat.angle))
      const lo = Math.min(...group.map(seat => seat.angle))
      const others = groups.filter((_, o) => o !== g).flat()
      expect(others.some(seat => seat.angle > lo && seat.angle < hi)).toBe(false)
    })
  })

  it('mirrors every seat across the vertical centre line', () => {
    for (const total of [5, 31, 101, 200]) {
      const { seats } = layout(total, { radius: RADIUS })
      for (const seat of seats) {
        expect(seats.some(o => Math.abs(o.x + seat.x) < 1e-8 && Math.abs(o.y - seat.y) < 1e-8)).toBe(true)
      }
    }
  })

  it('reproduces a fixed chamber when the caller passes rows and a gap', () => {
    // texas-2026's Senate: 31 seats, three rows 83 apart, outer row at 360.
    const arc = layout(31, { radius: 360, rows: 3, rowGap: 83 })
    expect(arc.rowSeats).toEqual([7, 10, 14])
    expect(arc.rowRadii).toEqual([194, 277, 360])
    checkRows(arc, 31)
  })

  it('refuses rows that do not fit inside the radius', () => {
    expect(() => layout(31, { radius: 360, rows: 5, rowGap: 100 })).toThrow(RangeError)
    expect(() => layout(0, { radius: 360 })).toThrow(RangeError)
  })

  it.each([
    ['NaN radius', { radius: NaN }, /radius/],
    ['missing radius', {} as { radius: number }, /radius/],
    ['zero radius', { radius: 0 }, /radius must be/],
    ['negative radius', { radius: -10 }, /radius/],
    ['infinite radius', { radius: Infinity }, /radius/],
    ['negative rowGap', { radius: 360, rows: 3, rowGap: -20 }, /rowGap/],
    ['zero rowGap', { radius: 360, rows: 3, rowGap: 0 }, /rowGap/],
    ['NaN rowGap', { radius: 360, rows: 3, rowGap: NaN }, /rowGap/],
  ])('refuses a %s', (_, options, message) => {
    expect(() => layout(10, options)).toThrow(RangeError)
    expect(() => layout(10, options)).toThrow(message)
  })
})

describe('thresholdAngle', () => {
  it.each(TOTALS)('%i seats: every threshold clears its seats or refuses a tie', total => {
    const { seats } = layout(total, { radius: RADIUS })
    for (let at = 1; at < total; at++) {
      if (sameAngle(seats[at - 1], seats[at])) {
        // No radial line separates two seats at one angle.
        expect(() => thresholdAngle(seats, at)).toThrow(RangeError)
        continue
      }
      const angle = thresholdAngle(seats, at)
      expect(angle).toBeCloseTo((seats[at - 1].angle + seats[at].angle) / 2, 12)
      // Exactly `at` seats sit left of the line, and no seat centre is on it.
      expect(seats.filter(seat => seat.angle > angle)).toHaveLength(at)
      expect(seats.some(seat => seat.angle === angle)).toBe(false)
      // Tied seats are adjacent in reading order, so none straddles the line.
      const split = seats.some((seat, i) => i > 0 && sameAngle(seats[i - 1], seat)
        && (seats[i - 1].angle > angle) !== (seat.angle > angle))
      expect(split).toBe(false)
    }
  })

  it('puts thresholds at the ends on the baseline and rejects out-of-range counts', () => {
    const { seats } = layout(31, { radius: RADIUS })
    expect(thresholdAngle(seats, 0)).toBe(Math.PI)
    expect(thresholdAngle(seats, 31)).toBe(0)
    expect(() => thresholdAngle(seats, 32)).toThrow(RangeError)
    expect(() => thresholdAngle(seats, 1.5)).toThrow(RangeError)
  })

  it('separates the texas-2026 Senate at a majority and at two-thirds', () => {
    const { seats } = layout(31, { radius: 360, rows: 3, rowGap: 83 })
    for (const at of [16, 21]) {
      const angle = thresholdAngle(seats, at)
      expect(seats.filter(seat => seat.angle > angle)).toHaveLength(at)
    }
  })

  it('finds ties in real layouts, so the refusal is exercised', () => {
    // 10 and 14 seats share a factor of two: both have a seat at 45 degrees.
    const { seats } = layout(31, { radius: 360, rows: 3, rowGap: 83 })
    expect(seats.some((seat, i) => i > 0 && sameAngle(seats[i - 1], seat))).toBe(true)
  })
})
