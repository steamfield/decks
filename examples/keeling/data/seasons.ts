/**
 * Slide 3: five full years of monthly means, 2021 through 2025.
 *
 * Same NOAA GML `co2_mm_mlo.csv` as Slide 2. Each year's high and low month
 * and the high minus low swing are computed here from the monthly means.
 * December 2022 to early July 2023 were measured at Maunakea while Mauna Loa
 * was closed by the eruption (file header note, data-sources.md "Slide 3").
 */
import { MONTHLY } from './noaa.generated'

export const FROM = 2021
export const TO = 2025

const window = MONTHLY.filter((r) => r.year >= FROM && r.year <= TO)

/** x is decimal year, y is ppm. */
export const SERIES = window.map((r) => ({ x: r.x, y: r.y }))

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

/** The month(s) each year's high and low fell in, for the card. */
export const HIGH_MONTHS = monthSet(HIGHS)
export const LOW_MONTHS = monthSet(LOWS)
