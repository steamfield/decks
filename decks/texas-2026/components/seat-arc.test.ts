import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error The repo has no Vue type shim; Vitest uses the Vue plugin.
import SeatArc from './SeatArc.vue'
import { PARLIAMENT, democrat, republican } from './design'
import { senate, confirmation, arcLabels } from '../data/08-senate-arc'

// Rendering this SVG needs no Slidev host APIs.
vi.mock('@slidev/client', () => ({}))

const groups = [
  { label: arcLabels.democratic, seats: senate.democratic, filled: senate.democratic, color: democrat() },
  { label: arcLabels.republican, seats: senate.republican, filled: senate.republican, color: republican() },
]
const attributes = (tag: string) => Object.fromEntries(
  [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]),
)
const render = async (props = {}) => {
  const markup = await renderToString(createSSRApp({ render: () => h(SeatArc, { groups, ...props }) }))
  const seats = [...markup.matchAll(/<g[^>]*data-seat[^>]*>\s*<circle[^>]*>/g)].map(([tag]) => {
    const a = attributes(tag)
    const x = Number(a.cx), y = Number(a.cy)
    return { x, y, radius: Number(a.r), angle: Math.atan2(-y, x), row: Math.round(Math.hypot(x, y)), party: a['data-group'], fill: a.fill }
  })
  const lines = [...markup.matchAll(/<line[^>]*class="threshold"[^>]*>/g)].map(([tag]) => attributes(tag))
  return { seats, lines }
}

describe('SeatArc parliament layout', () => {
  it('allocates all seats to three concentric rows by largest remainder', async () => {
    const { seats } = await render()
    const counts = new Map<number, number>()
    seats.forEach(seat => counts.set(seat.row, (counts.get(seat.row) ?? 0) + 1))
    expect(seats).toHaveLength(senate.total)
    expect([...counts].sort(([a], [b]) => a - b).map(([, count]) => count)).toEqual([7, 10, 14])
  })

  it('spaces each row evenly with half a step of padding at both ends', async () => {
    const { seats } = await render()
    for (const radius of new Set(seats.map(seat => seat.row))) {
      const row = seats.filter(seat => seat.row === radius).sort((a, b) => a.angle - b.angle)
      const step = Math.PI / row.length
      row.forEach((seat, i) => expect(seat.angle).toBeCloseTo((i + 0.5) * step, 10))
    }
  })

  it('mirrors every seat across the vertical center line with one radius throughout', async () => {
    const { seats } = await render()
    for (const seat of seats) {
      expect(seats.some(other => Math.abs(other.x + seat.x) < 1e-8 && Math.abs(other.y - seat.y) < 1e-8)).toBe(true)
    }
    expect(new Set(seats.map(seat => seat.radius))).toEqual(new Set([PARLIAMENT.seatRadius]))
  })

  it('keeps a constant radial gap between adjacent rows', async () => {
    const { seats } = await render()
    const radii = [...new Set(seats.map(seat => seat.row))].sort((a, b) => a - b)
    expect(radii).toHaveLength(PARLIAMENT.rowCount)
    for (let i = 1; i < radii.length; i++) expect(radii[i] - radii[i - 1]).toBe(PARLIAMENT.rowGap)
  })

  it('keeps each party contiguous in angular order', async () => {
    const { seats } = await render()
    const ordered = [...seats].sort((a, b) => b.angle - a.angle)
    expect(ordered.map(seat => seat.party)).toEqual([
      ...Array(senate.democratic).fill(arcLabels.democratic),
      ...Array(senate.republican).fill(arcLabels.republican),
    ])
    expect(ordered.slice(0, senate.democratic).every(seat => seat.fill === democrat())).toBe(true)
    expect(ordered.slice(senate.democratic).every(seat => seat.fill === republican())).toBe(true)
  })

  it.each([senate.majority, confirmation.required])('clears every seat at the threshold after seat %i', async at => {
    const { seats, lines } = await render({ thresholds: [{ at, label: '', progress: 1 }] })
    const line = lines[0]
    const x1 = Number(line.x1), y1 = Number(line.y1), x2 = Number(line.x2), y2 = Number(line.y2)
    const dx = x2 - x1, dy = y2 - y1
    const angle = Math.atan2(-y1, x1)
    const ordered = [...seats].sort((a, b) => b.angle - a.angle)
    expect(angle).toBeCloseTo((ordered[at - 1].angle + ordered[at].angle) / 2, 10)
    expect(seats.filter(seat => seat.angle > angle)).toHaveLength(at)
    // The tick sits wholly outside the outer row's seat edges.
    expect(Math.hypot(x1, y1)).toBeGreaterThan(Math.max(...seats.map(seat => Math.hypot(seat.x, seat.y))) + PARLIAMENT.seatRadius)
    expect(Math.hypot(x2, y2)).toBeGreaterThan(Math.hypot(x1, y1))
    for (const seat of seats) {
      const t = Math.max(0, Math.min(1, ((seat.x - x1) * dx + (seat.y - y1) * dy) / (dx * dx + dy * dy)))
      const distance = Math.hypot(seat.x - x1 - t * dx, seat.y - y1 - t * dy)
      // Include the highlight stroke and threshold stroke, not only the fill.
      expect(distance).toBeGreaterThan(PARLIAMENT.ringRadius + 2)
    }
  })

  it('fills every seat for the unanimous-vote caller without changing its props', async () => {
    const { seats } = await render({ groups: [{ label: arcLabels.confirmation, seats: senate.total, filled: senate.total, step: 2 }] })
    expect(seats).toHaveLength(senate.total)
    expect(seats.every(seat => seat.radius === PARLIAMENT.seatRadius)).toBe(true)
    expect(new Set(seats.map(seat => seat.fill)).size).toBe(1)
  })

  it('keeps both party colors lit when every member votes together', async () => {
    const { seats } = await render()
    expect(seats.filter(seat => seat.radius === PARLIAMENT.seatRadius)).toHaveLength(senate.total)
    expect(seats.filter(seat => seat.fill === democrat())).toHaveLength(senate.democratic)
    expect(seats.filter(seat => seat.fill === republican())).toHaveLength(senate.republican)
  })
})
