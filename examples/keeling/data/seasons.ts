/**
 * Slide 3: five full years of monthly means, 2021 through 2025.
 *
 * Same NOAA GML `co2_mm_mlo.csv` as Slide 2. The slide opens on the full
 * record (`record.ts`) and zooms into this window, so the window's box is
 * drawn on the record first. Each year's high and low month
 * and the high minus low swing are computed here from the monthly means.
 * December 2022 to early July 2023 were measured at Maunakea while Mauna Loa
 * was closed by the eruption (file header note, data-sources.md "Slide 3").
 */
import { MONTHLY } from './noaa.generated'

export const FROM = 2021
export const TO = 2025

const window = MONTHLY.filter((r) => r.year >= FROM && r.year <= TO)

/** The zoomed x range: the window's first January to the January after its last year. */
export const X_DOMAIN: [number, number] = [FROM, TO + 1]

const years = Array.from({ length: TO - FROM + 1 }, (_, i) => FROM + i)

/** Each year's highest and lowest monthly mean. */
export const HIGHS = years.map((y) => window.filter((r) => r.year === y).reduce((a, b) => (b.y > a.y ? b : a)))
export const LOWS = years.map((y) => window.filter((r) => r.year === y).reduce((a, b) => (b.y < a.y ? b : a)))

/** Smallest and largest yearly swing, high month minus low month, ppm. */
const swings = HIGHS.map((h, i) => h.y - LOWS[i].y)
export const SWING_LABEL = `${Math.min(...swings).toFixed(1)} to ${Math.max(...swings).toFixed(1)} ppm`

/** The y range the stage draws, padded to whole ppm. */
export const Y_DOMAIN: [number, number] = [
  Math.floor(Math.min(...LOWS.map((r) => r.y))) - 1,
  Math.ceil(Math.max(...HIGHS.map((r) => r.y))) + 1,
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthSet = (rs: { month: number }[]) =>
  [...new Set(rs.map((r) => r.month))].sort((a, b) => a - b).map((m) => MONTHS[m - 1]).join(' or ')

/**
 * Each year's drawdown: the monthly means from that year's high month to its
 * low month, inclusive. The stage draws these over the line on the last beat.
 */
export const DRAWDOWNS = years.map((y) => {
  const rows = window.filter((r) => r.year === y)
  const hi = rows.indexOf(HIGHS[y - FROM])
  const lo = rows.indexOf(LOWS[y - FROM])
  return rows.slice(hi, lo + 1).map((r) => ({ x: r.x, y: r.y }))
})

/** Gridline values on the zoomed axis: every 5 ppm strictly inside the range. Geometry. */
export const GRID_PPM = Array.from({ length: 20 }, (_, i) => Math.ceil(Y_DOMAIN[0] / 5) * 5 + i * 5).filter(
  (v) => v > Y_DOMAIN[0] && v < Y_DOMAIN[1],
)

/** The month(s) each year's high and low fell in, for the card. */
export const HIGH_MONTHS = monthSet(HIGHS)
export const LOW_MONTHS = monthSet(LOWS)

/**
 * The second card's lead is typed: "Highs in late spring, lows in early fall."
 * It holds while every high lands in May or June and every low in September or
 * October. `bun run test` loads this module (data-guards.test.ts), so a refresh
 * that breaks the pattern fails the test run.
 */
const off = [
  ...HIGHS.filter((r) => r.month !== 5 && r.month !== 6).map((r) => `${r.year} high in ${MONTHS[r.month - 1]}`),
  ...LOWS.filter((r) => r.month !== 9 && r.month !== 10).map((r) => `${r.year} low in ${MONTHS[r.month - 1]}`),
]
if (off.length > 0) {
  throw new Error(`seasons.ts: ${off.join(', ')}; the Slide 3 card says highs in late spring, lows in early fall`)
}

/** Every high has to come before its low, or a drawdown would run backwards. */
if (DRAWDOWNS.some((d) => d.length < 2)) throw new Error('seasons.ts: a high month falls after its low; the Slide 3 drawdowns are wrong')
