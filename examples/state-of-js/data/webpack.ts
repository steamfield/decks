/**
 * Slide 2: webpack usage and retention by edition, then Vite usage.
 *
 * `tools_historical.csv` rows `webpack` and `vite` (2021 to 2025), columns
 * `Usage` (share of respondents who have used it) and `Retention` (share of
 * its users who would use it again), as whole percents. See `raw/SOURCE.md`.
 * The export has no webpack row for 2018 or 2019; those two points are
 * interpolated between 2017 and 2020 (`filled`), and the slide says so.
 */
import { at, filled, history, LAST_YEAR, pct, runs } from './survey'

const WEBPACK = filled(history('webpack'))

/** The interpolated editions: 2018 and 2019. */
export const WEBPACK_ESTIMATED = WEBPACK.filter((r) => r.estimated).map((r) => r.year)
const VITE = history('vite')

/** Line segments, split where an edition is missing. */
export const WEBPACK_USAGE = runs(WEBPACK, 'usage')
export const WEBPACK_RETENTION = runs(WEBPACK, 'retention')
export const VITE_USAGE = runs(VITE, 'usage')

/** webpack usage, 2025 edition: 87. */
export const WEBPACK_USAGE_2025 = pct(at('webpack', 2025).usage)
/** The latest edition in the export: 2025. */
export const LAST = LAST_YEAR

/** webpack's highest measured retention (2017, 95). Estimated rows are excluded. */
const PEAK = history('webpack').reduce((a, b) => (b.retention > a.retention ? b : a))
export const WEBPACK_FROM = PEAK.year
export const WEBPACK_RETENTION_FROM = pct(PEAK.retention)
/** webpack retention, 2025 edition: 26. */
export const WEBPACK_RETENTION_2025 = pct(at('webpack', 2025).retention)

/** Vite usage in its first edition in the export (2021, 29) and in 2025 (84). */
export const VITE_FIRST = { year: VITE[0].year, usage: pct(VITE[0].usage) }
export const VITE_USAGE_2025 = pct(at('vite', 2025).usage)
/** Lowest and highest Vite retention across its editions: 97 and 98. */
export const VITE_RETENTION_MIN = Math.min(...VITE.map((r) => pct(r.retention)))
export const VITE_RETENTION_MAX = Math.max(...VITE.map((r) => pct(r.retention)))

export const X_DOMAIN: [number, number] = [WEBPACK[0].year, LAST_YEAR]
export const Y_DOMAIN: [number, number] = [0, 100]

/*
 * Checks on what slides.md types (the Slide 2 title) and what the cards say.
 * `bun run test` loads this module (data-guards.test.ts).
 */
const typed = { from: 2017, rFrom: 95, r2025: 26, vFirst: 29, v2025: 84 }
if (
  WEBPACK_FROM !== typed.from ||
  WEBPACK_RETENTION_FROM !== typed.rFrom ||
  WEBPACK_RETENTION_2025 !== typed.r2025 ||
  VITE_FIRST.usage !== typed.vFirst ||
  VITE_USAGE_2025 !== typed.v2025
) {
  throw new Error('webpack.ts: the figures moved; update the Slide 2 title in slides.md')
}
if (WEBPACK_ESTIMATED.join() !== '2018,2019') {
  throw new Error(`webpack.ts: estimated editions are ${WEBPACK_ESTIMATED.join()}; the Slide 2 card names 2018 and 2019`)
}

/** The Slide 2 card says retention fell in every measured edition from 2017. */
export const FELL_EVERY_EDITION = history('webpack')
  .filter((r) => r.year >= WEBPACK_FROM)
  .every((r, i, rows) => i === 0 || r.retention < rows[i - 1].retention)
if (!FELL_EVERY_EDITION) throw new Error('webpack.ts: webpack retention rose in some edition after 2017; the Slide 2 card is wrong')
