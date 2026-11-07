/**
 * Parliament (hemicycle) layout math: concentric rows of seats on a half
 * circle centred at (0, 0), on its baseline, opening upward in SVG (negative y).
 *
 * Rows get seats in proportion to their radius by largest-remainder rounding,
 * and each row spaces its seats evenly with half a step of padding at both
 * ends. A hemicycle only reads as rows when the spacing along a row matches the
 * gap between rows, so `layout` picks the row count and that gap from the
 * total. Seats come back in reading order, left to right by angle; two seats at
 * the same angle (two rows whose counts share a power of two, such as two odd
 * rows meeting at the top) go inner row first, so the order is total and a
 * caller can hand out contiguous wedges by index.
 *
 * ```ts
 * const arc = layout(31, { radius: 360 })
 * arc.seats[0] // { x, y, angle, row }: the leftmost seat, row 0 innermost
 * const majority = thresholdAngle(arc.seats, 16) // between seat 15 and seat 16
 * ```
 *
 * The geometry is generic; the drawing (seat marks, ticks, labels) stays with
 * the deck's component until a second deck needs the same chart.
 */

export interface ParliamentSeat {
  x: number
  y: number
  /** Radians from the right-hand baseline: pi is the far left, 0 the far right. */
  angle: number
  /** 0 is the innermost row. */
  row: number
}

export interface ParliamentLayout {
  /** Every seat, in reading order (angle descending, then row ascending). */
  seats: ParliamentSeat[]
  /** One radius per row, innermost first; the last equals `radius`. */
  rowRadii: number[]
  /** Seats per row, innermost first. */
  rowSeats: number[]
  /** Radial distance between adjacent rows (the one row's seat spacing when `rows` is 1). */
  rowGap: number
  /** A seat radius that leaves a clear gap to every neighbour. */
  seatRadius: number
}

export interface ParliamentOptions {
  /** Outer row radius, in the caller's units. */
  radius: number
  /** Row count. Defaults to the count whose inner radius lands near `INNER_SHARE` of `radius`. */
  rows?: number
  /** Radial gap between rows. Defaults to the gap at which spacing along a row matches it. */
  rowGap?: number
}

/** The inner row's radius as a share of the outer one, for the default row count. */
export const INNER_SHARE = 0.5
/** Seat diameter as a share of the closest centre-to-centre spacing. */
export const SEAT_SHARE = 0.7

/**
 * Rows for `total` seats. With rows `r0 + i * g` matching spacing `pi * r / n`
 * to `g`, and `r0 = INNER_SHARE * outer`, the seat count works out to
 * `pi * R * (R - 1) * (k + 1/2)` for `k = INNER_SHARE / (1 - INNER_SHARE)`;
 * solve for R and round. A row count that would leave the inner row with
 * under two seats steps down.
 */
function defaultRows(total: number): number {
  const k = INNER_SHARE / (1 - INNER_SHARE)
  const x = total / (Math.PI * (k + 0.5))
  let rows = Math.max(1, Math.round((1 + Math.sqrt(1 + 4 * x)) / 2))
  while (rows > 1 && innerQuota(total, rows) < 2) rows--
  return rows
}

/** The spacing-matched gap for `rows` rows: solves `pi * sum(r) / total = g`. */
function matchedGap(total: number, rows: number, radius: number): number {
  return (Math.PI * rows * radius) / (total + (Math.PI * rows * (rows - 1)) / 2)
}

function innerQuota(total: number, rows: number): number {
  const gap = matchedGap(total, rows, 1)
  const radii = Array.from({ length: rows }, (_, i) => 1 - (rows - 1 - i) * gap)
  return (total * radii[0]) / radii.reduce((sum, r) => sum + r, 0)
}

/** Seat positions for `total` seats over concentric rows ending at `radius`. */
export function layout(total: number, options: ParliamentOptions): ParliamentLayout {
  if (!Number.isInteger(total) || total < 1) throw new RangeError(`parliament: total must be a positive integer, got ${total}`)
  const { radius } = options
  const rows = options.rows ?? defaultRows(total)
  if (!Number.isInteger(rows) || rows < 1) throw new RangeError(`parliament: rows must be a positive integer, got ${rows}`)
  const rowGap = rows === 1 ? 0 : (options.rowGap ?? matchedGap(total, rows, radius))
  const rowRadii = Array.from({ length: rows }, (_, i) => radius - (rows - 1 - i) * rowGap)
  if (rowRadii[0] <= 0) throw new RangeError(`parliament: ${rows} rows ${rowGap} apart do not fit inside radius ${radius}`)

  const radiusSum = rowRadii.reduce((sum, r) => sum + r, 0)
  const allocation = rowRadii.map(r => {
    const quota = (total * r) / radiusSum
    return { seats: Math.floor(quota), remainder: quota % 1 }
  })
  const remaining = total - allocation.reduce((sum, row) => sum + row.seats, 0)
  // A stable sort, so equal remainders favour the inner row.
  const ranked = [...allocation].sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; i < remaining; i++) ranked[i].seats++
  const rowSeats = allocation.map(row => row.seats)
  if (rowSeats.some(n => n < 1)) throw new RangeError(`parliament: ${total} seats leave a row of ${rows} empty`)

  const seats = rowRadii.flatMap((r, row) => Array.from({ length: rowSeats[row] }, (_, i) => {
    const angle = Math.PI * (1 - (i + 1 / 2) / rowSeats[row])
    return { x: Math.cos(angle) * r, y: -Math.sin(angle) * r, angle, row }
  })).sort((a, b) => b.angle - a.angle || a.row - b.row)

  // Adjacent seats in a row are one step apart on the chord; adjacent rows are rowGap apart.
  const chords = rowRadii.map((r, row) => rowSeats[row] > 1 ? 2 * r * Math.sin(Math.PI / (2 * rowSeats[row])) : 2 * r)
  const closest = Math.min(...chords, ...(rows > 1 ? [rowGap] : []))
  return {
    seats,
    rowRadii,
    rowSeats,
    rowGap: rows === 1 ? chords[0] : rowGap,
    seatRadius: (SEAT_SHARE * closest) / 2,
  }
}

/**
 * The angle of a threshold after the first `at` seats in reading order: the
 * mean angle of the seats either side, so a radial tick there passes through
 * neither. `at` 0 is the left baseline (pi) and `at` equal to the seat count the
 * right one (0). Two seats at the same angle cannot be split by a radial line,
 * so a threshold that falls between them throws rather than drawing through
 * both; move the threshold or change the row count.
 */
export function thresholdAngle(seats: readonly ParliamentSeat[], at: number): number {
  if (!Number.isInteger(at) || at < 0 || at > seats.length) {
    throw new RangeError(`parliament: threshold ${at} is outside 0..${seats.length}`)
  }
  if (at === 0) return Math.PI
  if (at === seats.length) return 0
  const before = seats[at - 1]
  const after = seats[at]
  if (before.angle === after.angle) {
    throw new RangeError(`parliament: threshold ${at} falls between two seats at the same angle (rows ${before.row} and ${after.row})`)
  }
  return (before.angle + after.angle) / 2
}
