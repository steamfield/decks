/**
 * Slide 5: when the rise since 1959 was half done.
 *
 * NOAA GML `co2_annmean_mlo.csv`, column `mean` (annual mean CO2, ppm), 1959
 * to the last full year. The halfway value is the midpoint of the first and
 * last annual means; the halfway year is the first year whose mean reached it.
 */
import { ANNUAL, GROWTH } from './noaa.generated'

export const SERIES = ANNUAL.map((r) => ({ x: r.x, y: r.y }))

export const FIRST = ANNUAL[0]
export const LAST = ANNUAL[ANNUAL.length - 1]

/** Total rise across the record, ppm. */
export const RISE = LAST.y - FIRST.y
export const RISE_LABEL = `${Math.round(RISE)} ppm`

export const HALF = (FIRST.y + LAST.y) / 2
/** The halfway level as the card prints it. */
export const HALF_LABEL = HALF.toFixed(1)
/** The first annual mean at or above the halfway level. */
export const HALF_POINT = ANNUAL.find((r) => r.y >= HALF)!
export const HALF_YEAR = HALF_POINT.x

/** Where the line between annual points crosses the halfway level: geometry for the rule's end, not a figure. */
const below = ANNUAL[ANNUAL.indexOf(HALF_POINT) - 1]
export const CROSS_X = below.x + (HALF - below.y) / (HALF_POINT.y - below.y)

/** The record from the halfway year on, which Beat 2 redraws in amber. */
export const AFTER = SERIES.filter((p) => p.x >= HALF_YEAR)

/** Years from the halfway year to the last full year, and before it. */
export const YEARS_AFTER = LAST.x - HALF_YEAR
export const YEARS_BEFORE = HALF_YEAR - FIRST.x

/** The y range the stage draws: 300 ppm up to the last mean rounded up to the next 40. */
export const Y_DOMAIN: [number, number] = [300, Math.ceil(LAST.y / 40) * 40]

/*
 * The checks below are what the slide types rather than computes. `bun run
 * test` loads this module (data-guards.test.ts), so a refresh that breaks one
 * fails the test run.
 */

/** True when every annual mean is higher than the year before it. */
export const ALWAYS_UP = ANNUAL.every((r, i) => i === 0 || r.y > ANNUAL[i - 1].y)
if (!ALWAYS_UP) throw new Error('halfway.ts: an annual mean fell; the Slide 5 card is wrong')

/** Smallest single-year rise in `co2_gr_mlo.csv`: the second source for the same card. */
export const MIN_GROWTH = GROWTH.reduce((a, b) => (b.ppm < a.ppm ? b : a))
if (!(MIN_GROWTH.ppm > 0)) {
  throw new Error(`halfway.ts: growth in ${MIN_GROWTH.year} was ${MIN_GROWTH.ppm} ppm; the Slide 5 card is wrong`)
}

/** The Slide 5 title in slides.md and pages/05-halfway.md types this number. */
const TITLE_YEARS_AFTER = 23
if (YEARS_AFTER !== TITLE_YEARS_AFTER) {
  throw new Error(`halfway.ts: the second half took ${YEARS_AFTER} years; update the Slide 5 title in slides.md and pages/05-halfway.md`)
}

if (FIRST.y <= Y_DOMAIN[0]) throw new Error(`halfway.ts: ${FIRST.y} ppm sits below the Slide 5 y range`)
