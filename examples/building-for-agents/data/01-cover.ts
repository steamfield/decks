/**
 * Slide 1: the cover. Sourced in data-sources.md under "Slide 1".
 *
 * The ridgeline behind the title is real data, as it is on steamfield.io: the
 * trailing seven-day mean of commits per day, summed across the product
 * repositories.
 *
 * Source: ./commits.json, copied on 2026-11-13 from
 * ~/Projects/steamfield/src/data/commits.json (steamfield commit 53a1a06;
 * the file's own `generated` date is 2026-11-01). That file is written by
 * `node scripts/data/commits.mjs` in the steamfield repo, from each product
 * repo's git history. Refresh: rerun that script, copy the file again.
 *
 * The smoothing is ported from buildRidgeSeries in
 * ~/Projects/steamfield/src/lib/ridge-readout.ts.
 */
import commits from './commits.json'

/** Cover byline. The talk's date is from Riley, 2026-11-13. */
export const BYLINE = {
  speaker: 'Riley Hilliard',
  studio: 'Steamfield',
  event: 'Austin JS',
  month: '2026-11',
} as const

const totals = Array.from({ length: commits.days }, (_, i) =>
  Object.values(commits.series as Record<string, number[]>).reduce(
    (sum, values) => sum + (values[i] ?? 0),
    0,
  ),
)

const smooth = totals.map((_, i) => {
  const win = totals.slice(Math.max(0, i - 6), i + 1)
  return win.reduce((a, b) => a + b, 0) / win.length
})

const peak = Math.max(...smooth) || 1

/** One value per day, 0..1 of the busiest seven-day mean. */
export const RIDGE: readonly number[] = smooth.map((mean) => mean / peak)

/** The window the ridge covers, for the figure tag. */
export const RIDGE_WINDOW = {
  start: commits.start,
  end: commits.end,
  days: commits.days,
  repos: Object.keys(commits.series).length,
  /** The busiest seven-day mean, commits per day, rounded. */
  peakPerDay: Math.round(peak),
} as const
