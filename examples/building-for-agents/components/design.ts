/**
 * Night drive, on stage: JS-side constants. SVG geometry is in the story
 * frame's 1920x1080 viewBox units. Colors are never here: they come from
 * theme.json through ink() or the --od-* custom properties.
 */

/** Earlier evidence stays readable. Mirror in tokens.css: --sf-dim. */
export const DIM = 0.45
/** Resting and hidden endpoints for beat opacity and progress. */
export const ON = 1
export const OFF = 0

/** Shared viewBox and the frame's horizontal margins (5.7lw is about 110). */
export const FRAME = { viewBox: '0 0 1920 1080', width: 1920, height: 1080, left: 110, right: 1810 } as const

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
} as const

/** CRT frame: bezel thickness, the bezel's tag band and one scanline period. */
export const CRT = { pad: 14, tagBand: 44, scanPeriod: 6, scanHeight: 3 } as const

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
} as const

/** A deterministic 0..1 value for a seed and an index (stars, never data). */
export function noise(seed: number, n: number): number {
  const x = Math.sin(seed * 9283.17 + n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export type Pt = readonly [number, number]

/** The point a share `t` (0..1) of the way along a polyline, by length. */
export function along(points: readonly Pt[], t: number): Pt {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = lengths.reduce((a, b) => a + b, 0)
  let left = Math.min(1, Math.max(0, t)) * total
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : Math.min(1, left / lengths[i])
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * f,
        points[i][1] + (points[i + 1][1] - points[i][1]) * f,
      ]
    }
    left -= lengths[i]
  }
  return points[points.length - 1]
}

/** An SVG path through a polyline. */
export function polyline(points: readonly Pt[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')
}
