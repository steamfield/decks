/**
 * Slide 1 (cover): the two series the cover field traces behind the title.
 *
 * webpack retention (share of its users who would use it again) and Vite
 * usage (share of respondents who have used it), from `tools_historical.csv`
 * rows `webpack` and `vite`, columns `Retention` and `Usage`. The lines cross
 * between the 2022 and 2023 editions. Request and file date in
 * `raw/SOURCE.md`. The field has no numbers on it, only the two lines and
 * their names; the cover title's two figures are checked below.
 */
import { at, filled, history, LAST_YEAR, pct, runs } from './survey'

/** webpack retention, 2016 to 2025, with 2018 and 2019 interpolated (the export has no rows for them). */
const WEBPACK = filled(history('webpack'))
export const WEBPACK_RETENTION = runs(WEBPACK, 'retention')
/** Vite usage, 2021 to 2025. */
export const VITE_USAGE = runs(history('vite'), 'usage')

/** The cover title, typed in pages/01-cover.md: webpack usage and retention in the latest edition. */
export const TITLE_YEAR = LAST_YEAR
export const TITLE_USAGE = pct(at('webpack', LAST_YEAR).usage)
export const TITLE_RETENTION = pct(at('webpack', LAST_YEAR).retention)
if (TITLE_YEAR !== 2025 || TITLE_USAGE !== 87 || TITLE_RETENTION !== 26) {
  throw new Error('cover.ts: the figures moved; update the cover title in pages/01-cover.md and slides.md')
}

export const X_DOMAIN: [number, number] = [WEBPACK[0].year, LAST_YEAR]
export const Y_DOMAIN: [number, number] = [0, 100]
