/**
 * Three easings and one duration table, for the whole deck.
 *
 * SETTLE is for anything that appears, disappears, recolors or repositions.
 * DRAW is for anything that draws or travels in a beat, and is eased on both
 * ends: a line that leaves at full speed reads as a wipe rather than as a
 * stroke, which is what SETTLE is for. TRACE is for the one
 * long hero moves: the cover trace and a staggered gather, where a slow start,
 * a run, and a long settle read as a hand moving rather than as a wipe. There
 * is no fourth easing, and there are no numeric duration literals outside this
 * file (a unit test scans for them).
 */
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

export const SETTLE = 'odSettle'
export const DRAW = 'odDraw'
export const TRACE = 'odTrace'

/** The same curves as CSS strings, for transitions that stay in CSS. */
export const SETTLE_CSS = 'cubic-bezier(.32,.72,0,1)'
export const DRAW_CSS = 'cubic-bezier(.65,0,.35,1)'
export const TRACE_CSS = 'cubic-bezier(.62,.02,.18,1)'

const SETTLE_PATH = 'M0,0 C0.32,0.72 0,1 1,1'
const DRAW_PATH = 'M0,0 C0.65,0 0.35,1 1,1'
const TRACE_PATH = 'M0,0 C0.62,0.02 0.18,1 1,1'

// gsap runs headless, but a plugin registration failure must never take a
// slide down with it.
try {
  gsap.registerPlugin(CustomEase)
  CustomEase.create(SETTLE, SETTLE_PATH)
  CustomEase.create(DRAW, DRAW_PATH)
  CustomEase.create(TRACE, TRACE_PATH)
  gsap.defaults({ ease: SETTLE })
} catch {
  // Fall back to gsap's built in easing if CustomEase is unavailable.
}

/** Durations in seconds. Every tween on a story slide reads one of these. */
export const DUR = {
  /** One step of a progressive append, such as a fan chart sample path. */
  tick: 0.03,
  opacity: 0.14,
  draw: 0.24,
  card: 0.3,
  color: 0.34,
  eraseDelay: 0.35,
  eraseHold: 0.49,
  grow: 0.56,
  morph: 0.6,
  scale: 0.9,
  /** A field gathering into one card, sheet by sheet. */
  gather: 1.6,
  /** The cover's hero line, traced end to end. */
  trace: 1.8,
  bloom: 2.4,
} as const

export type DurKey = keyof typeof DUR

/**
 * The start offset, in seconds, of item `i` of `n` when a group of tweens is
 * spread across `spread` seconds. The offsets follow an ease-in-out curve: the
 * first few leave close together, the middle flows and the last few settle, so
 * a cascade reads as one gesture rather than a metronome of even steps.
 */
export function easedStagger(i: number, n: number, spread: number): number {
  if (n <= 1 || spread <= 0) return 0
  const t = i / (n - 1)
  return spread * (0.5 - Math.cos(Math.PI * t) / 2)
}

export { gsap }
