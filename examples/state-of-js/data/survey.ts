/**
 * Shared lookups over the State of JavaScript export. Not a slide module: the
 * per-slide modules import these helpers rather than restating them.
 *
 * Source: State of JavaScript survey (Devographics), editions 2016 to 2025,
 * exported 2026-11-03 from OpenData dataset `state-of-survey/state-of-js`,
 * CC-BY-4.0. The two CSVs and the exact API requests are in `raw/`
 * (`raw/SOURCE.md`); `sojs.generated.ts` is written from them by
 * `scripts/extract.mjs`. Ratios are 0 to 1:
 *
 * - usage: share of respondents who have used the tool
 * - retention: share of the tool's users who would use it again
 *
 * Respondents self-select, so every figure describes survey respondents, not
 * all JavaScript developers.
 */
import { HISTORICAL, TOOLS_2025 } from './sojs.generated'

export type Row = (typeof HISTORICAL)[number]
export type Tool2025 = (typeof TOOLS_2025)[number]

/** Every row for one tool id, in year order. Throws on an unknown id. */
export function history(id: string): Row[] {
  const rows = HISTORICAL.filter((r) => r.id === id).sort((a, b) => a.year - b.year)
  if (!rows.length) throw new Error(`survey.ts: no rows for ${id}`)
  return rows
}

/** One tool's row for one year. Throws when the survey has none. */
export function at(id: string, year: number): Row {
  const row = HISTORICAL.find((r) => r.id === id && r.year === year)
  if (!row) throw new Error(`survey.ts: no ${id} row for ${year}`)
  return row
}

/** A 0 to 1 ratio as a whole percent, the precision the export carries. */
export const pct = (ratio: number) => Math.round(ratio * 100)

/** Split a yearly series wherever a year is missing, so a line never bridges a gap. */
export function runs(rows: readonly Yearly[], key: 'usage' | 'retention'): { x: number; y: number }[][] {
  const out: { x: number; y: number }[][] = []
  rows.forEach((r, i) => {
    if (i === 0 || r.year !== rows[i - 1].year + 1) out.push([])
    out[out.length - 1].push({ x: r.year, y: pct(r[key]) })
  })
  return out
}

/**
 * A tool's rows with missing editions filled by straight-line interpolation
 * between the editions either side, so a line runs through the gap. Filled
 * rows carry `estimated: true`; a slide that plots one says so.
 */
export type Yearly = { year: number; usage: number; retention: number; estimated?: true }

export function filled(rows: readonly Row[]): Yearly[] {
  const out: Yearly[] = []
  rows.forEach((r, i) => {
    const prev = rows[i - 1]
    if (prev) {
      const span = r.year - prev.year
      for (let year = prev.year + 1; year < r.year; year++) {
        const t = (year - prev.year) / span
        const lerp = (key: 'usage' | 'retention') => prev[key] + (r[key] - prev[key]) * t
        out.push({ year, usage: lerp('usage'), retention: lerp('retention'), estimated: true })
      }
    }
    out.push(r)
  })
  return out
}

/** First and last survey year in the export: the cover's "2016 to 2025". */
export const FIRST_YEAR = Math.min(...HISTORICAL.map((r) => r.year))
export const LAST_YEAR = Math.max(...HISTORICAL.map((r) => r.year))

/** The cover lede types the span. `bun run test` loads this module (data-guards.test.ts). */
if (FIRST_YEAR !== 2016 || LAST_YEAR !== 2025) {
  throw new Error(`survey.ts: the export spans ${FIRST_YEAR} to ${LAST_YEAR}; update the cover lede in pages/01-cover.md`)
}

export { TOOLS_2025 }
