/**
 * d3-scale wrappers and clean axis helpers for the 1920x1080 stage.
 *
 * Axes on a story slide are horizontal hairline rules plus two x labels. There
 * are no axis lines, no ticks and no legend: series carry direct end labels in
 * their own ink, which is what stackEndLabels resolves.
 */
import { type ScaleLinear, scaleLinear } from "d3-scale";

/** Linear interpolation, including extrapolation beyond the endpoints. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp to the 0..1 range every beat field and progress helper works in. */
export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export type LinearScale = ScaleLinear<number, number>;

/** Left to right scale across the stage. */
export function xScale(domain: [number, number], range: [number, number]): LinearScale {
  return scaleLinear().domain(domain).range(range);
}

/** Top down scale: pass the range already inverted (bottom first). */
export function yScale(domain: [number, number], range: [number, number]): LinearScale {
  return scaleLinear().domain(domain).range(range);
}

/**
 * Progress of item `i` of `n` when one 0..1 beat field is staggered by `step` per item: each
 * item starts `step` after the one before it, and the last one still lands at 1.
 */
export function stagger(progress: number, i: number, n: number, step: number): number {
  return clamp01((progress - i * step) / (1 - (n - 1) * step));
}
export interface EndLabel {
  /** Preferred vertical centre, in viewBox units. */
  y: number;
  /** Label height, in viewBox units. */
  h: number;
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
    .sort((a, b) => a.label.y - b.label.y || a.index - b.index);

  const out = new Array<number>(labels.length);
  let prevY = -Infinity;
  let prevH = 0;

  for (const [i, { label, index }] of order.entries()) {
    const min = i === 0 ? label.y : prevY + prevH / 2 + label.h / 2 + gap;
    const y = Math.max(label.y, min);
    out[index] = y;
    prevY = y;
    prevH = label.h;
  }

  return out;
}
