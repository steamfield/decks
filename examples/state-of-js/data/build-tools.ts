/**
 * Slide 4: every build tool in the 2025 edition, by usage and then by retention.
 *
 * `tools_2025.csv`, rows with `Category` = `build_tools` (12 tools), columns
 * `Usage` (share of respondents who have used it) and `Retention` (share of
 * its users who would use it again), as whole percents. See `raw/SOURCE.md`.
 */
import type { InkBarRow } from 'slidev-addon-decks/story'
import { at, pct, TOOLS_2025 } from './survey'

const TOOLS = TOOLS_2025.filter((t) => t.category === 'build_tools')

/** The edition `tools_2025.csv` holds (the export's `tools` table carries no year column). */
export const EDITION = 2025

/** How many build tools the 2025 edition asked about: 12. */
export const TOOL_COUNT = TOOLS.length

/** The two tools the slide lights; every other row stays slate. */
const HUES: Record<string, InkBarRow['hue']> = { webpack: 'rose', vite: 'cyan' }

function rowsBy(key: 'usage' | 'retention'): InkBarRow[] {
  return [...TOOLS]
    .sort((a, b) => b[key] - a[key])
    .map((t) => ({
      id: t.id,
      label: t.name,
      value: pct(t[key]),
      text: `${pct(t[key])}%`,
      hue: HUES[t.id] ?? 'slate',
      step: HUES[t.id] ? 3 : 1,
    }))
}

/** Rows sorted by 2025 usage, highest first. */
export const BY_USAGE = rowsBy('usage')
/** The same rows sorted by 2025 retention, highest first. */
export const BY_RETENTION = rowsBy('retention')

const webpack = TOOLS.find((t) => t.id === 'webpack')!
const vite = TOOLS.find((t) => t.id === 'vite')!

/** webpack 2025: usage 87, retention 26. Vite 2025: usage 84, retention 98. */
export const WEBPACK = { usage: pct(webpack.usage), retention: pct(webpack.retention) }
export const VITE = { usage: pct(vite.usage), retention: pct(vite.retention) }

/** Retention range of the other ten build tools: 65 (Parcel) to 94 (Rolldown). */
const otherTools = TOOLS.filter((t) => t.id !== 'webpack' && t.id !== 'vite')
const others = otherTools.map((t) => pct(t.retention))
export const OTHERS_COUNT = otherTools.length
export const OTHERS_MIN = Math.min(...others)
export const OTHERS_MAX = Math.max(...others)
/** The lowest-retention tool after webpack (Parcel), and webpack's gap to it in points (39). */
export const NEXT_LOWEST = otherTools.find((t) => pct(t.retention) === OTHERS_MIN)!.name
export const GAP_TO_NEXT = OTHERS_MIN - pct(webpack.retention)

export const DOMAIN: [number, number] = [0, 100]

/*
 * The cards and the slides.md title say webpack is first in usage and last in
 * retention, and Vite second in usage and first in retention. Checked here;
 * `bun run test` loads this module (data-guards.test.ts).
 */
const rank = (rows: InkBarRow[], id: string) => rows.findIndex((r) => r.id === id) + 1
if (rank(BY_USAGE, 'webpack') !== 1 || rank(BY_USAGE, 'vite') !== 2) {
  throw new Error('build-tools.ts: webpack and Vite are no longer first and second in 2025 usage')
}
if (rank(BY_RETENTION, 'vite') !== 1 || rank(BY_RETENTION, 'webpack') !== TOOL_COUNT) {
  throw new Error('build-tools.ts: Vite and webpack are no longer first and last in 2025 retention')
}
if (!(VITE.retention > OTHERS_MAX && WEBPACK.retention < OTHERS_MIN)) {
  throw new Error('build-tools.ts: a retention tie at the top or bottom; the first-and-last claim is ambiguous')
}
/** Cross-check the edition: the tools table and the historical table agree on webpack and Vite. */
for (const id of ['webpack', 'vite']) {
  const t = TOOLS.find((x) => x.id === id)!
  const h = at(id, EDITION)
  if (t.usage !== h.usage || t.retention !== h.retention) throw new Error(`build-tools.ts: ${id} in tools_2025.csv does not match its ${EDITION} historical row`)
}
if (TOOL_COUNT !== 12 || WEBPACK.usage !== 87 || WEBPACK.retention !== 26) {
  throw new Error('build-tools.ts: the figures moved; update the Slide 4 title in slides.md')
}
