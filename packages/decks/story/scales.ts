/**
 * d3-scale wrappers and clean axis helpers for the 1920x1080 stage.
 *
 * Axes on a story slide are horizontal hairline rules plus two x labels. There
 * are no axis lines, no ticks and no legend: series carry direct end labels in
 * their own ink, which is what stackEndLabels resolves.
 */
import { scaleLinear, type ScaleLinear } from 'd3-scale'

/** Clamp to the 0..1 range every beat field and progress helper works in. */
export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/** Linear interpolation between two numbers. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Progress of item `i` of `n` when one 0..1 beat field is staggered by `step`
 * per item: each item starts `step` after the one before it, and the last one
 * still lands at 1. Six stages had written this slice out by hand.
 */
export function stagger(progress: number, i: number, n: number, step: number): number {
  return clamp01((progress - i * step) / (1 - (n - 1) * step))
}

export type LinearScale = ScaleLinear<number, number>

/** Left to right scale across the stage. */
export function xScale(domain: [number, number], range: [number, number]): LinearScale {
  return scaleLinear().domain(domain).range(range)
}

/** Top down scale: pass the range already inverted (bottom first). */
export function yScale(domain: [number, number], range: [number, number]): LinearScale {
  return scaleLinear().domain(domain).range(range)
}

export interface CleanAxisOpts {
  x: LinearScale
  y: LinearScale
  /** First x domain value to label. */
  first: number
  /** Last x domain value to label. */
  last: number
  /** How many hairline rules to lay down. Defaults to 4. */
  rules?: number
}

export interface CleanAxis {
  rules: { y: number; value: number }[]
  labels: { x: number; value: number; anchor: 'start' | 'end' }[]
}

/** Hairline rule positions plus the two x label positions. */
export function cleanAxis(opts: CleanAxisOpts): CleanAxis {
  const count = opts.rules ?? 4
  const values = opts.y.ticks(count)
  return {
    rules: values.map((value) => ({ value, y: opts.y(value) })),
    labels: [
      { value: opts.first, x: opts.x(opts.first), anchor: 'start' },
      { value: opts.last, x: opts.x(opts.last), anchor: 'end' },
    ],
  }
}

export interface EndLabel {
  /** Preferred vertical centre, in viewBox units. */
  y: number
  /** Label height, in viewBox units. */
  h: number
}

/**
 * Nudge overlapping end labels apart, keeping their vertical order.
 *
 * Returns resolved centres in the input order. Pure: no clamping to the stage,
 * because a caller that cares about the frame edge will shift the whole block.
 */
export function stackEndLabels(labels: EndLabel[], gap = 0): number[] {
  const order = labels
    .map((label, index) => ({ label, index }))
    .sort((a, b) => a.label.y - b.label.y || a.index - b.index)

  const out = new Array<number>(labels.length)
  let prevY = -Infinity
  let prevH = 0

  for (let i = 0; i < order.length; i++) {
    const { label, index } = order[i]
    const min = i === 0 ? label.y : prevY + prevH / 2 + label.h / 2 + gap
    const y = Math.max(label.y, min)
    out[index] = y
    prevY = y
    prevH = label.h
  }

  return out
}
