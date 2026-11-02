/**
 * Ripple ordering: one 0..1 beat field spread across marks by distance.
 *
 * A recolor that lands on every mark at once reads as a switch. Spread by
 * distance from the story's subject, it reads as the change travelling out
 * from that subject. `rippleProgress` is the per-mark slice of one beat
 * field: marks nearer `from` start first, the farthest starts last, and
 * every mark still lands at 1 when the field does. It is a pure function of
 * the field, so a beat built on it seeks in both directions and lands on its
 * exact end state in print and export.
 *
 * The same slice the collapse wave in `UnitGrid` runs inward; this one runs
 * outward, and is exported so a stage that draws its own marks (or feeds a
 * `UnitGrid` through `colorBy`) orders them the same way.
 *
 * ```ts
 * const reach = Math.max(...centers.map((c) => Math.hypot(c.x - from.x, c.y - from.y)))
 * const local = rippleProgress(s.nine, centers[i], from, 0.5, { reach, seed: 'waffle', index: i })
 * ```
 */
import { hashSigned } from './hash'
import { clamp01 } from './scales'
import type { Point } from './types'

/** The stage diagonal: the farthest two points in the 1920x1080 viewBox can be. */
const STAGE_DIAGONAL = Math.hypot(1920, 1080)

/** Default hashed jitter, as a share of the stagger window. */
const JITTER = 0.08

export interface RippleOptions {
  /**
   * Distance, in stage units, at which a mark starts last. Pass the farthest
   * mark's distance from `from` so the wave spans the field; the default is
   * the stage diagonal, which on a small field gives a shallow ripple.
   */
  reach?: number
  /**
   * Seed for a small hashed jitter, so two marks at the same distance do not
   * move in lockstep. No seed, no jitter. Seed from data identity.
   */
  seed?: string | number
  /** The mark's index under `seed`. */
  index?: number
  /** Jitter amplitude as a share of the stagger window. Defaults to 0.08. */
  jitter?: number
}

/**
 * A mark's local progress when the beat field `t` ripples outward from
 * `from`. `stagger` is the share of the field spent on the spread (0..1):
 * 0 returns `t` (clamped to 0..1), so every mark moves together.
 */
export function rippleProgress(
  t: number,
  at: Point,
  from: Point,
  stagger: number,
  opts: RippleOptions = {},
): number {
  const spread = Math.min(0.999, clamp01(stagger))
  if (spread <= 0) return clamp01(t)
  const reach = Math.max(1, opts.reach ?? STAGE_DIAGONAL)
  const jitter =
    opts.seed === undefined ? 0 : hashSigned(opts.seed, opts.index ?? 0, opts.jitter ?? JITTER)
  const lead = clamp01(Math.hypot(at.x - from.x, at.y - from.y) / reach + jitter)
  return clamp01((t - lead * spread) / (1 - spread))
}
