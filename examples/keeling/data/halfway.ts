/**
 * Slide 5: when the rise since 1959 was half done.
 *
 * NOAA GML `co2_annmean_mlo.csv`, column `mean` (annual mean CO2, ppm), 1959
 * to the last full year. The halfway value is the midpoint of the first and
 * last annual means; the halfway year is the first year whose mean reached it.
 */
import { ANNUAL } from './noaa.generated'

export const SERIES = ANNUAL.map((r) => ({ x: r.x, y: r.y }))

export const FIRST = ANNUAL[0]
export const LAST = ANNUAL[ANNUAL.length - 1]

/** Total rise across the record, ppm. */
export const RISE = LAST.y - FIRST.y
export const RISE_LABEL = `${Math.round(RISE)} ppm`

export const HALF = (FIRST.y + LAST.y) / 2
export const HALF_YEAR = ANNUAL.find((r) => r.y >= HALF)!.x

/** Years from the halfway year to the last full year, and before it. */
export const YEARS_AFTER = LAST.x - HALF_YEAR
export const YEARS_BEFORE = HALF_YEAR - FIRST.x

/** True when every annual mean is higher than the year before it. Checked, not assumed. */
export const ALWAYS_UP = ANNUAL.every((r, i) => i === 0 || r.y > ANNUAL[i - 1].y)
if (!ALWAYS_UP) throw new Error('halfway.ts: an annual mean fell; the Slide 5 card is wrong')
