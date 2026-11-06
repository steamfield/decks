/** Ballot and chalk: SVG geometry is in the story frame's viewBox units. */
import { ink, type InkStep } from 'slidev-addon-decks/story'

/** Earlier evidence stays readable. Mirror in tokens.css: --tx-dim. */
export const DIM = 0.55
/** Resting and hidden endpoints for beat opacity and progress. */
export const ON = 1
export const OFF = 0
/** Ballot proportions; size is a multiplier of these two radii. */
export const OVAL = { rx: 34, ry: 20, size: 1 } as const
/** Scenario stripes and pending dashes; mirrors live in tokens.css. */
export const HATCH = { spacing: 8, path: 'M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6' } as const
export const DASH = '8 6'
/** Shared vertical spacing for the outcome ladder. */
export const RUNG_GAP = 92
/** Radius of the later Senate hemicycle. */
export const SEAT_ARC_RADIUS = 360
/** Parliament rows: even spacing within each arc, with phases that leave the
 * majority and confirmation boundaries clear of the circular seat outlines. */
export const PARLIAMENT = {
  rows: [
    { radius: 180, seats: 5, phase: 0.75 },
    { radius: 240, seats: 7, phase: 0.25 },
    { radius: 300, seats: 9, phase: 0.25 },
    { radius: SEAT_ARC_RADIUS, seats: 10, phase: 0.25 },
  ],
  seatRadius: 18, ringRadius: 22, ruleEnd: 1.12, labelRadius: 1.25,
} as const
/** 720 / 1080 = two-thirds down the frame; CSS uses --tx-baseline-y. */
export const BASELINE_Y = 720
/** Shared viewBox and the line's horizontal endpoints. */
export const FRAME = { viewBox: '0 0 1920 1080', left: 112, right: 1808 } as const
/** Cover field: a quiet vertical ballot to the right of the question. */
export const FIELD = { x: 1280, y: 324, gap: 76, ovalX: 1744, labelDy: 8, ruleY: 42 } as const
/** Sample office tiles and their text/mark offsets. */
export const BOARD = {
  x: 704, y: 336, gap: 32, width: 344, height: 256,
  pad: 28, nameY: 52, noteY: 90, ovalX: 62, ovalY: 170,
  statusX: 124, statusY: 178,
  riskX: 1424, riskY: 640, riskWidth: 376, riskHeight: 56,
  riskTextX: 1444, riskTextY: 677,
} as const
/** One unfiltered oval ring: expansion and peak opacity. */
export const PING = { growth: 0.8, peak: 0.8 } as const

/** Meaning helpers keep stages independent of the palette's legacy slot names. */
export const changed = () => ink('cyan', 2)
export const risk = () => ink('amber', 2)
export const neutral = (step: InkStep = 2) => ink('slate', step)
