/**
 * Slide 5a: how fast datasets have been added, from git.
 *
 * Every row is one ISO week (Monday start) and the number of `dataset.yaml`
 * files whose first-add commit fell in it, from
 *
 *   git log --diff-filter=A --format='%ad %H' --date=short --name-only \
 *     -- 'datasets/*\/*\/dataset.yaml'
 *
 * run on 2026-09-12 (earliest date per path, 1003 paths ever added, 973 on
 * disk today). Weeks with no adds are omitted; the cumulative curve carries
 * across them. Includes the ten derived `opendata/` datasets and one test
 * fixture: the same query without them moves the total by 12 and no week's
 * rank. Full table and commands in `data-sources.md`, "Slide 5a".
 *
 * Three commits are bulk imports rather than a week's authoring and they sit
 * inside the two peak weeks: 77 datasets on 2026-02-02, 50 on 2026-01-31 (a
 * subject_tags migration), 33 on 2026-08-20. The slide therefore says "as
 * many as" and never "every week".
 */
export interface WeekAdd {
  /** ISO week start, YYYY-MM-DD. */
  week: string
  count: number
}

export const WEEKLY_ADDS: WeekAdd[] = [
  { week: '2025-12-15', count: 14 },
  { week: '2025-12-29', count: 1 },
  { week: '2026-01-12', count: 41 },
  { week: '2026-01-26', count: 52 },
  { week: '2026-02-02', count: 87 },
  { week: '2026-02-09', count: 21 },
  { week: '2026-02-16', count: 1 },
  { week: '2026-02-23', count: 1 },
  { week: '2026-03-09', count: 4 },
  { week: '2026-03-16', count: 15 },
  { week: '2026-03-23', count: 43 },
  { week: '2026-03-30', count: 22 },
  { week: '2026-04-06', count: 34 },
  { week: '2026-04-13', count: 44 },
  { week: '2026-04-20', count: 6 },
  { week: '2026-04-27', count: 7 },
  { week: '2026-05-04', count: 43 },
  { week: '2026-05-11', count: 22 },
  { week: '2026-05-18', count: 3 },
  { week: '2026-05-25', count: 48 },
  { week: '2026-06-01', count: 33 },
  { week: '2026-06-08', count: 27 },
  { week: '2026-06-15', count: 12 },
  { week: '2026-06-22', count: 18 },
  { week: '2026-06-29', count: 1 },
  { week: '2026-07-06', count: 31 },
  { week: '2026-07-13', count: 47 },
  { week: '2026-07-20', count: 14 },
  { week: '2026-08-03', count: 11 },
  { week: '2026-08-10', count: 68 },
  { week: '2026-08-17', count: 93 },
  { week: '2026-08-24', count: 73 },
  { week: '2026-08-31', count: 42 },
  { week: '2026-09-07', count: 24 },
]

/** Days since the repo's first commit, for an x axis in days. */
export const REPO_BORN = '2025-11-27'

const DAY = 86_400_000
export function daysSince(date: string, from: string = REPO_BORN): number {
  return Math.round((Date.parse(date) - Date.parse(from)) / DAY)
}

/** Cumulative series in (days since repo start, datasets added so far). */
export const CUMULATIVE = (() => {
  let total = 0
  const points = [{ x: 0, y: 0 }]
  for (const w of WEEKLY_ADDS) {
    total += w.count
    // Plot at the end of the week the adds landed in.
    points.push({ x: daysSince(w.week) + 7, y: total })
  }
  return points
})()

export const TOTAL_EVER_ADDED = CUMULATIVE[CUMULATIVE.length - 1].y
export const PEAK_WEEK = WEEKLY_ADDS.reduce((a, b) => (b.count > a.count ? b : a))
export const FIRST_DATASET = { date: '2025-12-16', slug: 'bls/cpi-u' }
export const TENTH_DATASET = { date: '2025-12-21', slug: 'm4/competition' }
export const DEPLOY_MINUTES = 4

/** Days from repo start to the first dataset: the pipeline was built first. */
export const DAYS_TO_FIRST = daysSince(FIRST_DATASET.date)
/** Last four weeks before the deck date. */
export const LAST_FOUR_WEEKS = WEEKLY_ADDS.filter((w) => w.week >= '2026-08-15').reduce(
  (n, w) => n + w.count,
  0,
)

/**
 * Pipeline stages, in the order `opendata/opendata/ingestion/pipeline/stages.py`
 * runs them, plus the enrichment hand-off in `finalize.py`. Labels are the
 * slide's; the module names are in data-sources.md.
 *
 * `glow` is presentation, and it sits on the row rather than in a parallel
 * array in the stage component because it is positional: a parallel array is
 * silently mis-paired the moment a stage is inserted or reordered here, and
 * nothing fails, the boxes just light up in the wrong corners. It is the
 * bounding-box corner each lit box anchors its card glow in, so six identical
 * boxes do not read as six copies of one card.
 */
export const STAGES = [
  { id: 'fetch', label: 'Fetch', note: '26 connectors', glow: { cx: 0, cy: 0 } },
  { id: 'parse', label: 'Parse', note: '14 formats', glow: { cx: 1, cy: 0 } },
  {
    id: 'transform',
    label: 'Transform',
    note: 'declared in YAML',
    glow: { cx: 0, cy: 1 },
  },
  {
    id: 'gate',
    label: 'Quality gate',
    note: 'blocks the swap',
    glow: { cx: 0.5, cy: 0 },
  },
  { id: 'parquet', label: 'Parquet', note: 'atomic promote', glow: { cx: 1, cy: 1 } },
  { id: 'enrich', label: 'Enrich', note: '19 steps', glow: { cx: 0, cy: 0.5 } },
] as const

/** The dataset the slide's YAML defines, so the block can be clicked through. */
export const DATASET_YAML_URL =
  'https://tryopendata.ai/datasets/tea/staar-accountability'

/**
 * The YAML the slide draws, trimmed from `datasets/tea/staar-accountability/
 * dataset.yaml`: the keys that make a dataset declarative, with the long
 * description and the field list cut down. The block scrolls, so the lines
 * past the first fold are there for a reader who wheels down.
 */
export const YAML_LINES = [
  'kind: Dataset',
  'metadata:',
  '  name: staar-accountability',
  '  namespace: tea',
  '  labels: { category: education, region: us-tx }',
  'spec:',
  '  connector: opendata/generic',
  '  format: csv',
  '  aggregator:',
  '    type: time-series',
  '    variables: { year: [2017-2018, …] }',
  '    stop_on_error: 3',
  '  expected_schema:',
  '    - { name: DISTRICT, type: string }',
  '    - { name: value, type: integer }',
  '  ingest:',
  '    transform: [replace, cast, wide_to_long]',
  '  sync: { interval: yearly }',
  '  landing_url: https://tea.texas.gov/…/academic-accountability',
  '  source_url: https://rptsvr1.tea.texas.gov/cgi/sas/broker?…',
]
