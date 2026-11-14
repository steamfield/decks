/**
 * Slide 15: OpenData. Sourced in data/sources/15-opendata.md.
 *
 * THE SESSION is the first turn of the scripted OpenData session on
 * steamfield.io, copied 2026-11-13 from ~/Projects/steamfield (commit 1b001f9):
 *   src/data/opendata-demo.ts  the question's search terms and matches, the
 *                              prices query's columns, rows and run time
 *   src/lib/opendata-demo.ts   the question, the order of the tool calls
 *   src/lib/figures.ts         the chart's title (line 352)
 * That file's header says its figures are "from live queries through the
 * OpenData connector on 2026-11-04"; RECORDED is its `checked` constant.
 *
 * THE SERVER FIGURES were read 2026-11-13 from ~/Projects/opendata/mcp at
 * commit d9b5ee7c4:
 *   TOOLS_REGISTERED  the register calls in src/tools/index.ts, lines 23 to 36
 *   TOOLS_APP_ONLY    `grep -l 'visibility: \["app"\]' src/tools/*.ts`
 *   MODEL_ROW_BUDGET  src/core/constants.ts line 4
 *   CHART_SAMPLE_ROWS, CHART_MODEL_SAMPLE_ROWS  src/tools/openchart.ts lines 29 and 32
 *   CHART_ROWS_META_KEY  src/core/view-data.ts line 393
 *   CHART_RESOURCE    src/tools/openchart.ts, the tool's `_meta.ui.resourceUri`
 */
import type { TermLine } from './types'

/** `checked` in opendata-demo.ts: the day the queries ran. */
export const RECORDED = '2026-11-04'

/** QUESTIONS[0] in src/lib/opendata-demo.ts. */
export const QUESTION = 'Are AI data centers driving up electricity bills?'

/** `searchTerms` and `searchMatches` in opendata-demo.ts. */
export const SEARCH_TERMS = [
  'residential electricity prices by state',
  'data center locations',
  'PJM capacity auction prices',
] as const
export const SEARCH_MATCHES = [
  'eia/retail-electricity-prices',
  'im3/data-center-atlas',
  'pjm/capacity-market-clearing-prices',
] as const

/** `pricesQuery` in opendata-demo.ts: its columns, run time and row count. */
export const QUERY_COLUMNS = ['state_name', 'grid', 'cents_2022', 'cents_now', 'pct_change'] as const
export const QUERY_MS = 11
export const QUERY_ROWS = 51

/**
 * The prices query's rows where grid is "PJM-core", in the order it returned
 * them (pct_change descending). The session's first chart draws these eight.
 */
export const PJM_ROWS = [
  ['District of Columbia', 'PJM-core', 14.27, 24.3, 70.3],
  ['Maryland', 'PJM-core', 14.52, 22.54, 55.2],
  ['New Jersey', 'PJM-core', 16.67, 23.48, 40.9],
  ['Ohio', 'PJM-core', 13.87, 18.36, 32.3],
  ['Pennsylvania', 'PJM-core', 15.99, 20.82, 30.2],
  ['Delaware', 'PJM-core', 13.88, 18.07, 30.1],
  ['Virginia', 'PJM-core', 13.38, 16.62, 24.2],
  ['West Virginia', 'PJM-core', 13.39, 15.66, 17],
] as const

/** The chart's title in the session (`prices.title`, src/lib/figures.ts line 352). */
export const CHART_TITLE = 'Bills rose fastest on the PJM grid'

/** The chart's data: state and percent change, straight from PJM_ROWS. */
export const CHART_DATA = PJM_ROWS.map((row) => ({
  state: row[0] === 'District of Columbia' ? 'D.C.' : row[0],
  change: row[4],
}))

/** The registered tools, and which of them only the interface may call. */
export const TOOLS_REGISTERED = 14
export const TOOLS_APP_ONLY = 3
export const TOOLS_FOR_MODEL = TOOLS_REGISTERED - TOOLS_APP_ONLY

/** Rows a query result shows the model at most (query_sql, query_dataset). */
export const MODEL_ROW_BUDGET = 60
/** Rows the chart interface draws from, carried in the result's `_meta`. */
export const CHART_SAMPLE_ROWS = 120
/** Rows kept in the chart result's structuredContent. */
export const CHART_MODEL_SAMPLE_ROWS = 24
export const CHART_ROWS_META_KEY = 'opendata/chartRows'
export const CHART_RESOURCE = 'ui://opendata/chart'

const pad = (value: string | number, width: number) => String(value).padEnd(width)
const WIDTHS = [22, 10, 12, 11, 0]
const tableRow = (cells: readonly (string | number)[]) =>
  `  ${cells.map((cell, i) => pad(cell, WIDTHS[i])).join('').trimEnd()}`

/** The first turn, as terminal lines: the question, then each tool call. */
export const SESSION: readonly TermLine[] = [
  { text: QUESTION, tone: 'user' },
  { text: `search_datasets "${SEARCH_TERMS[0]}" +${SEARCH_TERMS.length - 1}`, tone: 'cmd' },
  { text: `  ${SEARCH_MATCHES.length} found: ${SEARCH_MATCHES[0]},`, tone: 'out' },
  { text: `  ${SEARCH_MATCHES[1]}, ${SEARCH_MATCHES[2]}`, tone: 'out' },
  { text: 'query_sql', tone: 'cmd' },
  { text: `  ${QUERY_ROWS} rows · ${QUERY_MS} ms`, tone: 'out' },
  { text: tableRow(QUERY_COLUMNS), tone: 'muted' },
  { text: tableRow(PJM_ROWS[0]), tone: 'out' },
  { text: tableRow(PJM_ROWS[1]), tone: 'out' },
  { text: 'openchart', tone: 'cmd' },
  { text: `  ${CHART_TITLE}`, tone: 'out' },
]

/** How many SESSION lines each beat shows: the search, the query, the chart call. */
export const SHOWN = [4, 9, SESSION.length, SESSION.length] as const
