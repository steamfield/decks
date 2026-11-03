/**
 * Slide 3: of every 100 users, how many would use the tool again.
 *
 * Retention (share of a tool's users who would use it again) in the 2025
 * edition, `tools_historical.csv` rows `webpack` and `vite`, column
 * `Retention`, as whole percents, so one square in the 100-square grid is one
 * percent of that tool's users. See `raw/SOURCE.md`.
 */
import { at, history, LAST_YEAR, pct } from './survey'

/** webpack retention, 2025: 26. */
export const WEBPACK_KEEP = pct(at('webpack', LAST_YEAR).retention)
/** Vite retention, 2025: 98. */
export const VITE_KEEP = pct(at('vite', LAST_YEAR).retention)

const VITE = history('vite')
/** Vite's lowest retention in any edition (97, in 2021) and its first edition. */
export const VITE_KEEP_MIN = Math.min(...VITE.map((r) => pct(r.retention)))
export const VITE_FIRST_YEAR = VITE[0].year

/** The edition both figures come from: 2025, the latest in the export. */
export const YEAR = LAST_YEAR

export const UNITS = 100

/** The Slide 3 title in slides.md types both figures. `bun run test` loads this module. */
if (WEBPACK_KEEP !== 26 || VITE_KEEP !== 98) {
  throw new Error(`keep.ts: retention is ${WEBPACK_KEEP} and ${VITE_KEEP}; update the Slide 3 title in slides.md`)
}
