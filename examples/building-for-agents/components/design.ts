/**
 * Night drive, on stage: JS-side constants. SVG geometry is in the story
 * frame's 1920x1080 viewBox units. Colors come from theme.json through ink()
 * or the --od-* custom properties.
 */
import { ink } from "@steamfield/decks/kit";

/** Stage colours retain their original theme ramp and shade. */
export const PINK = ink("rose", 2);
export const DATA = ink("cyan", 2);
export const PLUMB = ink("violet", 3);
export const WAIT = ink("amber", 2);
export const GREEN = ink("emerald", 2);
export const NEUTRAL = ink("slate", 1);
export const QUIET = ink("slate", 2);
export const RUST_INK = ink("cyan", 1);
export const ACTION_INK = ink("slate", 3);

/** Earlier evidence stays readable. Mirror in tokens.css: --sf-dim. */
export const DIM = 0.45;
/** Resting and hidden endpoints for beat opacity and progress. */
export const ON = 1;
export const OFF = 0;

/** Shared viewBox and the frame's horizontal margins (5.7lw is about 110). */
export const FRAME = {
  viewBox: "0 0 1920 1080",
  width: 1920,
  height: 1080,
  left: 110,
  right: 1810,
} as const;

/**
 * The cover's picture. The horizon sits at 65% of the frame; the sun and the
 * grid's vanishing point share one x so the road runs toward the mark.
 */
export const FIELD = {
  horizon: 756,
  sunX: 960,
  /** Mark diameter, and how far its lowest band sinks below the horizon. */
  sunSize: 330,
  sunSink: 24,
  /** How far below its resting place the sun starts the entrance. */
  sunRise: 150,
  haloRadius: 360,
  haloOpacity: 0.34,
  /** Tallest point of the commit ridge above the horizon. */
  ridgeHeight: 138,
  ridgeGlow: 0.9,
  /** Sky gradient stops: canvas at the top, haze at the horizon. */
  skyMidAt: 0.62,
  skyMidOpacity: 0.72,
  skyHazeOpacity: 0.62,
  stars: 90,
  starMin: 0.9,
  starSpan: 1.3,
  starOpacity: 0.75,
  /** Grid floor: fan lines from the vanishing point, cross lines by depth. */
  fanCount: 41,
  fanSpacing: 210,
  crossCount: 9,
  crossPower: 2.3,
  gridNear: 0.62,
  gridFar: 0.1,
  horizonOpacity: 0.85,
  /** The bottom of the floor fades into the canvas over this share of it. */
  fadeFrom: 0.72,
  tagY: 744,
} as const;

/** CRT frame: bezel thickness, the bezel's tag band and one scanline period. */
export const CRT = { pad: 14, tagBand: 44, scanPeriod: 6, scanHeight: 3 } as const;

/** Slide 4, the Stacks loop. */
export const LOOP = {
  boundary: { x: 664, y: 236, w: 1146, h: 318 },
  command: { x: 110, y: 342, w: 500, h: 64 },
  file: { x: 700, y: 258, w: 340, h: 48, gap: 58 },
  agent: { x: 1130, y: 318, w: 280, h: 112 },
  gate: { x: 1494, y: 280, w: 290, h: 188 },
  /** The gate's step squares: five across, three down. */
  step: { cols: 5, size: 30, gap: 12, top: 62 },
  prompt: { x: 700, y: 490, w: 710, h: 54 },
  digest: { x: 1494, y: 572, w: 290, h: 46 },
  crt: { x: 880, y: 640, w: 930, h: 310 },
  /** The timeline inside the CRT screen. */
  axis: { x0: 1000, x1: 1740, y: 800, tick: 14, labelUp: 30, labelDown: 46 },
  packet: 9,
  lock: 20,
} as const;

/** A deterministic 0..1 value for a seed and an index (stars, never data). */
export function noise(seed: number, n: number): number {
  const x = Math.sin(seed * 9283.17 + n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export type Pt = readonly [number, number];

/** The point a share `t` (0..1) of the way along a polyline, by length. */
export function along(points: readonly Pt[], t: number): Pt {
  const first = points[0];
  if (!first) throw new Error("along: points must contain at least one point");
  const lengths = points.slice(1).map((p, i) => {
    const previous = points[i];
    if (!previous) throw new Error(`along: missing point ${i}`);
    return Math.hypot(p[0] - previous[0], p[1] - previous[1]);
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  let left = Math.min(1, Math.max(0, t)) * total;
  for (const [i, length] of lengths.entries()) {
    if (left <= length || i === lengths.length - 1) {
      const start = points[i];
      const end = points[i + 1];
      if (!start || !end) throw new Error(`along: missing segment ${i}`);
      const f = length === 0 ? 0 : Math.min(1, left / length);
      return [start[0] + (end[0] - start[0]) * f, start[1] + (end[1] - start[1]) * f];
    }
    left -= length;
  }
  return points.at(-1) ?? first;
}

/** An SVG path through a polyline. */
export function polyline(points: readonly Pt[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
}
