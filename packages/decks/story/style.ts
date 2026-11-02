/**
 * Mark style for story slides.
 *
 * `clean` (default) draws marks as crisp stroked paths and rects in the ramp
 * hue with an optional soft same-hue glow, which is what the design system's
 * charts look like. `marker` keeps the hand-inked dab ribbons from
 * `brush.ts` behind the same component APIs, so a deck can opt into the
 * editorial look without touching its slides.
 *
 * Mutable so a deck's setup can flip it once; components read it through
 * `inkStyle()` at render time.
 */
import type { Point } from './types'

export type InkStyle = 'clean' | 'marker'

export const STORY_STYLE: { ink: InkStyle } = { ink: 'clean' }

export function inkStyle(): InkStyle {
  return STORY_STYLE.ink
}

/** Stroke widths in viewBox units of the 1920x1080 stage. */
export const STROKE = {
  /** A data series. */
  line: 3.5,
  /** A hairline axis or baseline. */
  rule: 1.5,
  /** An annotation tick. */
  tick: 4,
  /** A faint background stroke. */
  faint: 2,
} as const

/** `M x y L x y ...` for a polyline, rounded to centipixels. */
export function polylinePath(points: Point[]): string {
  if (points.length === 0) return ''
  const r = (n: number) => Math.round(n * 100) / 100
  let d = `M${r(points[0].x)} ${r(points[0].y)}`
  for (let i = 1; i < points.length; i++) d += `L${r(points[i].x)} ${r(points[i].y)}`
  return d
}
