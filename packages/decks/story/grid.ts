/**
 * UnitGrid layout math, shared so a stage can find a cell without restating it.
 *
 * `UnitGrid` places cell `i` at column `i % cols`, row `floor(i / cols)`, one
 * pitch (cell plus gap) apart from `origin`. A stage that orders its cells by
 * position (a ripple out from one corner, a ping on one cell) asks this module
 * for the centre rather than repeating that arithmetic. `UNIT_GRID_DEFAULTS`
 * is also `UnitGrid`'s own prop defaults, so pass the same props and get the
 * same point.
 *
 * ```ts
 * const geom = { origin: { x: 960, y: 215 }, cols: 12, cellWidth: 54, gapX: 14, gapY: 14 }
 * const c = unitCellCenter(5, geom) // { x, y } in stage units
 * ```
 */
import type { Point } from './types'

export interface UnitGridGeometry {
  origin?: Point
  cols?: number
  cellWidth?: number
  /** Defaults to square, or a page shape (1.32x as tall) for `glyph: 'sheet'`. */
  cellHeight?: number
  gapX?: number
  gapY?: number
  glyph?: 'square' | 'sheet'
}

/** Geometry defaults, shared by `UnitGrid`'s props and the math below. */
export const UNIT_GRID_DEFAULTS = {
  glyph: 'square',
  cols: 20,
  cellWidth: 16,
  gapX: 8,
  gapY: 8,
  origin: { x: 0, y: 0 },
} as const

/** Cell height after the glyph default, in stage units. */
export function unitCellHeight(geom: UnitGridGeometry): number {
  const w = geom.cellWidth ?? UNIT_GRID_DEFAULTS.cellWidth
  return geom.cellHeight ?? (geom.glyph === 'sheet' ? w * 1.32 : w)
}

/** Centre of cell `index`, in stage viewBox units, before any scatter or collapse. */
export function unitCellCenter(index: number, geom: UnitGridGeometry): Point {
  const w = geom.cellWidth ?? UNIT_GRID_DEFAULTS.cellWidth
  const h = unitCellHeight(geom)
  const cols = Math.max(1, geom.cols ?? UNIT_GRID_DEFAULTS.cols)
  const origin = geom.origin ?? UNIT_GRID_DEFAULTS.origin
  return {
    x: origin.x + (index % cols) * (w + (geom.gapX ?? UNIT_GRID_DEFAULTS.gapX)) + w / 2,
    y: origin.y + Math.floor(index / cols) * (h + (geom.gapY ?? UNIT_GRID_DEFAULTS.gapY)) + h / 2,
  }
}
