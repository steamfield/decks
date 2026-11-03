/**
 * Slide 4: average yearly rise per decade.
 *
 * NOAA GML `co2_gr_mlo.csv`, column `ann inc`: the annual mean growth rate at
 * Mauna Loa, ppm per year, 1959 onward. Each row here is the plain mean of the
 * years in that decade; the 1950s hold only 1959, so the series starts at 1960.
 * The 2020s are partial (2020 to the last year in the file).
 */
import type { InkBarRow } from 'slidev-addon-decks/story'
import { GROWTH } from './noaa.generated'

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

const LAST_YEAR = GROWTH[GROWTH.length - 1].year

export const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => {
  const years = GROWTH.filter((g) => g.year >= d && g.year < d + 10)
  return { decade: d, years: years.length, ppm: mean(years.map((g) => g.ppm)) }
})

export const ROWS: InkBarRow[] = DECADES.map((d) => ({
  id: `d${d.decade}`,
  label: d.years < 10 ? `${d.decade}s (to ${LAST_YEAR})` : `${d.decade}s`,
  value: d.ppm,
  text: `${d.ppm.toFixed(2)} ppm/yr`,
}))

const first = DECADES[0]
const lastFull = DECADES.filter((d) => d.years === 10).at(-1)!

/** How many times faster the last full decade rose than the 1960s. */
export const SPEEDUP_LABEL = `${(lastFull.ppm / first.ppm).toFixed(1)} times`
export const FIRST_DECADE = `${first.decade}s`
export const LAST_FULL_DECADE = `${lastFull.decade}s`

/** Smallest single-year rise in the file: every year still went up. */
export const MIN_YEAR = GROWTH.reduce((a, b) => (b.ppm < a.ppm ? b : a))

export const DOMAIN: [number, number] = [0, Math.ceil(Math.max(...DECADES.map((d) => d.ppm)))]

/** The partial current decade, for the last card. */
const current = DECADES[DECADES.length - 1]
export const CURRENT_YEARS = current.years
export const CURRENT_PPM = current.ppm.toFixed(2)

/** The last card says this decade is running faster than the last full one. Checked, not assumed. */
if (!(current.ppm > lastFull.ppm)) {
  throw new Error(`decades.ts: the ${current.decade}s mean (${CURRENT_PPM}) is not above the ${lastFull.decade}s; the Slide 4 card is wrong`)
}
