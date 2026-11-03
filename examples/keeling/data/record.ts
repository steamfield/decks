/**
 * Slide 2: the full Mauna Loa monthly record.
 *
 * NOAA GML `co2_mm_mlo.csv`, column `average` (monthly mean CO2, ppm), March
 * 1958 to the last month in the file. Scripps (C. D. Keeling) data through
 * April 1974, NOAA after. Request and file date in data-sources.md, "Slide 2".
 */
import { MONTHLY } from './noaa.generated'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthLabel = (r: { year: number; month: number }) => `${MONTHS[r.month - 1]} ${r.year}`

/** x is decimal year, y is ppm. */
export const SERIES = MONTHLY.map((r) => ({ x: r.x, y: r.y }))

/** The first monthly mean in the file. */
export const FIRST = MONTHLY[0]
export const FIRST_LABEL = monthLabel(FIRST)

/** The highest monthly mean in the file. */
export const PEAK = MONTHLY.reduce((a, b) => (b.y > a.y ? b : a))
export const PEAK_LABEL = monthLabel(PEAK)

/** Last month in the file: the record's end year for the axis. */
export const LAST = MONTHLY[MONTHLY.length - 1]

/** The y range the stage draws: 300 ppm up to the peak rounded up to the next 40. */
export const Y_DOMAIN: [number, number] = [300, Math.ceil(PEAK.y / 40) * 40]

/** Gridline values, every 40 ppm from 320 to the top of the range. */
export const GRID_PPM = Array.from({ length: (Y_DOMAIN[1] - 320) / 40 + 1 }, (_, i) => 320 + i * 40)

/** The lowest month has to sit inside the range. `bun run test` loads this module (data-guards.test.ts). */
const LOW = MONTHLY.reduce((a, b) => (b.y < a.y ? b : a))
if (LOW.y <= Y_DOMAIN[0]) throw new Error(`record.ts: ${LOW.y} ppm sits below the Slide 2 y range`)

/** First year of NOAA's own measurements: the file header says Scripps data run through April 1974. */
export const NOAA_FROM = 1974
