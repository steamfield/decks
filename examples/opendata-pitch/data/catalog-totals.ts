/**
 * Live catalog totals, from GET api.tryopendata.ai/v1/stats on 2026-09-10.
 * Slides 4 and 6b both state them; one file so they cannot drift apart.
 */
export const TOTAL_DATASETS = 969
export const TOTAL_AGENCIES = 203
export const TOTAL_ROWS = '1.6 billion'
/** The same total as a number, for figures that tick up to it. */
export const TOTAL_ROWS_N = 1.6e9

/**
 * The July snapshot's size, the "before" side of slide 4's growth beat.
 *
 * These are `graphNodes.length` and `graphEdges.length` of the July snapshot,
 * `data/graph-data-2026-07.ts` as committed on 2026-09-11.
 * The file was deleted on 2026-09-13; git still holds it, and the two
 * figures were verified against it that day. Stated here so no slide
 * has to load a 13,840-line snapshot to read two numbers off it.
 */
export const JULY_NODES = 630
export const JULY_EDGES = 2135
