/**
 * Slide 5: Jest and Vitest, 2021 against 2025, as a slope chart.
 *
 * `tools_historical.csv` rows `jest` (2016 to 2025) and `vitest` (2021 to
 * 2025), columns `Usage` (share of respondents who have used it) and
 * `Retention` (share of its users who would use it again), as whole percents.
 * 2021 is the first edition with a Vitest row, so both tools are compared
 * across the same two editions. See `raw/SOURCE.md`.
 */
import { at, history, pct } from './survey'

export const FROM = history('vitest')[0].year
export const TO = 2025

const pair = (id: string, key: 'usage' | 'retention') => ({ from: pct(at(id, FROM)[key]), to: pct(at(id, TO)[key]) })

/** Jest usage 72 to 75, retention 92 to 65; Vitest usage 2 to 54, retention 94 to 97. */
export const JEST_USAGE = pair('jest', 'usage')
export const JEST_RETENTION = pair('jest', 'retention')
export const VITEST_USAGE = pair('vitest', 'usage')
export const VITEST_RETENTION = pair('vitest', 'retention')

const JEST = history('jest')
/** Jest's highest retention (96) and the editions that reached it (2018, 2019, 2020). */
export const JEST_PEAK = Math.max(...JEST.map((r) => pct(r.retention)))
const peakYears = JEST.filter((r) => pct(r.retention) === JEST_PEAK).map((r) => r.year)
export const JEST_PEAK_FROM = peakYears[0]
export const JEST_PEAK_TO = peakYears[peakYears.length - 1]

export const Y_DOMAIN: [number, number] = [0, 100]

/*
 * Checks on what the cards and the slides.md title say. `bun run test` loads
 * this module (data-guards.test.ts).
 */
if (peakYears.length !== JEST_PEAK_TO - JEST_PEAK_FROM + 1) {
  throw new Error(`testing.ts: Jest's peak years ${peakYears.join()} are not one run; the Slide 5 card says "from ... to"`)
}
if (!(VITEST_RETENTION.to > JEST_PEAK)) {
  throw new Error('testing.ts: Vitest 2025 retention no longer beats Jest\'s best year; the Slide 5 card is wrong')
}
if (JEST_RETENTION.to !== 65 || VITEST_USAGE.to !== 54 || FROM !== 2021) {
  throw new Error('testing.ts: the figures moved; update the Slide 5 title in slides.md')
}
