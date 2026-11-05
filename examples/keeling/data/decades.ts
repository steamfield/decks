/**
 * Slide 4: average yearly rise per decade.
 *
 * NOAA GML `co2_gr_mlo.csv`, column `ann inc`: the annual mean growth rate at
 * Mauna Loa, ppm per year, 1959 onward. Each column here is the plain mean of
 * the years in that decade; the 1950s hold only 1959, so the series starts at
 * 1960. The 2020s are partial (2020 to the last year in the file).
 *
 * The columns stand on the same time axis as the record on Slides 2 and 3, so
 * each one spans the years it averages and the partial decade is visibly short.
 */
import { GROWTH } from './noaa.generated'

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Last year in the growth file. */
export const LAST_YEAR = GROWTH[GROWTH.length - 1].year

export const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => {
  const years = GROWTH.filter((g) => g.year >= d && g.year < d + 10)
  return { decade: d, years: years.length, ppm: mean(years.map((g) => g.ppm)) }
})

/** One column per decade: its span in years (geometry), its mean and labels. */
export const COLUMNS = DECADES.map((d) => ({
  id: `d${d.decade}`,
  from: d.decade,
  to: d.decade + d.years,
  ppm: d.ppm,
  label: `${d.decade}s`,
  /** A second label line for the partial decade, which stops at the file's last year. */
  note: d.years < 10 ? `to ${LAST_YEAR}` : '',
  value: d.ppm.toFixed(2),
}))

const first = DECADES[0]
const lastFull = DECADES.filter((d) => d.years === 10).at(-1)!
const current = DECADES[DECADES.length - 1]

/** The columns the stage lights: the first decade, the last full one, the partial current one. */
export const FIRST_ID = `d${first.decade}`
export const LAST_FULL_ID = `d${lastFull.decade}`
export const CURRENT_ID = `d${current.decade}`

/** The first decade's mean, for the reference level drawn across the chart. */
export const FIRST_PPM = first.ppm

/** How many times faster the last full decade rose than the 1960s. */
export const SPEEDUP_LABEL = `${(lastFull.ppm / first.ppm).toFixed(1)} times`
export const FIRST_DECADE = `${first.decade}s`
export const LAST_FULL_DECADE = `${lastFull.decade}s`

/** The y range: zero up to the largest mean rounded up to a whole ppm. */
export const DOMAIN: [number, number] = [0, Math.ceil(Math.max(...DECADES.map((d) => d.ppm)))]

/** The partial current decade, for the last card. */
export const CURRENT_YEARS = current.years
export const CURRENT_PPM = current.ppm.toFixed(2)

/**
 * The last card says this decade is running faster than the last full one.
 * Checked, not assumed: `bun run test` loads this module (data-guards.test.ts),
 * so the throw fails the test run after a refresh rather than the slide in a browser.
 */
if (!(current.ppm > lastFull.ppm)) {
  throw new Error(`decades.ts: the ${current.decade}s mean (${CURRENT_PPM}) is not above the ${lastFull.decade}s; the Slide 4 card is wrong`)
}
