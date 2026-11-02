/**
 * Where the "Teacher Avg Salary" field sits in each annual Illinois State
 * Board of Education Report Card file, 1997 to 2017.
 *
 * Values copied verbatim from
 * `blog/src/data/articles/what-opendata-is-building.charts.json`, key
 * `columnPositionDrift`, which is also what the previous deck charted. Twenty
 * one annual files, fourteen distinct positions, thirteen moves between them.
 *
 * The stage geometry lives here too, because slides 1 and 2 have to draw the
 * same line in the same place for the cross slide morph to read as a morph
 * rather than as a cut.
 */
import type { Point } from 'slidev-addon-decks/story'

export interface ColumnDriftRow {
  year: number
  position: number
}

export const COLUMN_DRIFT: ColumnDriftRow[] = [
  { year: 1997, position: 196 },
  { year: 1998, position: 196 },
  { year: 1999, position: 217 },
  { year: 2000, position: 217 },
  { year: 2001, position: 217 },
  { year: 2002, position: 268 },
  { year: 2003, position: 310 },
  { year: 2004, position: 318 },
  { year: 2005, position: 322 },
  { year: 2006, position: 336 },
  { year: 2007, position: 336 },
  { year: 2008, position: 336 },
  { year: 2009, position: 336 },
  { year: 2010, position: 340 },
  { year: 2011, position: 358 },
  { year: 2012, position: 415 },
  { year: 2013, position: 431 },
  { year: 2014, position: 451 },
  { year: 2015, position: 451 },
  { year: 2016, position: 563 },
  { year: 2017, position: 607 },
]

export const DRIFT_POINTS: Point[] = COLUMN_DRIFT.map((row) => ({ x: row.year, y: row.position }))

export const FIRST_YEAR = COLUMN_DRIFT[0].year
export const LAST_YEAR = COLUMN_DRIFT[COLUMN_DRIFT.length - 1].year
export const FIRST_POSITION = COLUMN_DRIFT[0].position
export const LAST_POSITION = COLUMN_DRIFT[COLUMN_DRIFT.length - 1].position

/** The distinct positions the field occupied: 14 of them. */
export const DISTINCT_POSITIONS = new Set(COLUMN_DRIFT.map((row) => row.position)).size

/** Each year the position changed, with the values on either side of it. */
export const JUMPS = COLUMN_DRIFT.slice(1)
  .map((row, i) => ({ year: row.year, from: COLUMN_DRIFT[i].position, to: row.position }))
  .filter((jump) => jump.from !== jump.to)

/* ── Stage geometry, shared by slide 1 and slide 2 ── */
export const X_DOMAIN: [number, number] = [FIRST_YEAR, LAST_YEAR]
export const Y_DOMAIN: [number, number] = [150, 660]
export const X_RANGE: [number, number] = [300, 1700]
/** Bottom first: a larger column position sits higher on the stage. */
export const Y_RANGE: [number, number] = [940, 250]

/** Baseline hairline and the two x labels. */
export const BASELINE_Y = 955
export const LABEL_Y = 1002
