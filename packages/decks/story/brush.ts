/**
 * brushRibbon: turn a polyline into a chain of short closed filled polygons.
 *
 * This is how every mark on a story slide is drawn. A stroke is not one path
 * with a stroke width, it is a run of ~12 unit dabs, each a closed 16 point
 * polygon whose top and bottom edges wobble independently. Overlap darkening
 * comes from stacked fill opacity plus an overpaint pass on a hashed subset,
 * not from blend modes.
 *
 * All numbers are viewBox units on the 1920x1080 stage.
 */
import { hash, hashRange } from './hash'
import type { Dab, InkOpts, Point } from './types'

/** Vertices per dab: 8 along the top edge, 8 back along the bottom edge. */
const EDGE_VERTS = 8
export const DAB_VERTS = EDGE_VERTS * 2

/** Fraction of dabs that get a darker second pass. */
const OVERPAINT_SHARE = 0.3
/** Fill opacity of that second pass. */
const OVERPAINT_OPACITY = 0.3

const OPACITY_MIN = 0.42
const OPACITY_MAX = 0.78

/**
 * Mutable so the visual gate can tune the ink without touching call sites.
 * Sized for a 1920x1080 stage read from the back of a room, which is why
 * wobble and edge are several times the amplitude a web page would use.
 */
export const BRUSH_DEFAULTS: InkOpts = {
  width: 14,
  seed: 0,
  taperIn: 0.12,
  taperOut: 0.18,
  startWidth: 0.35,
  endWidth: 0.25,
  belly: 1,
  wobble: 2.2,
  edge: 0.9,
  chisel: 0,
  samples: 12,
}

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

/** Width multiplier along the stroke: narrow tips, full belly in the middle. */
function widthProfile(t: number, o: InkOpts): number {
  if (o.taperIn > 0 && t < o.taperIn) {
    return o.startWidth + (o.belly - o.startWidth) * smoothstep(t / o.taperIn)
  }
  if (o.taperOut > 0 && t > 1 - o.taperOut) {
    return o.belly + (o.endWidth - o.belly) * smoothstep((t - (1 - o.taperOut)) / o.taperOut)
  }
  return o.belly
}

/** Resample a polyline at a fixed arc spacing. Always returns >= 2 points. */
export function resample(points: Point[], spacing: number): Point[] {
  const src = points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y)
  if (src.length < 2) return src.length === 1 ? [src[0], src[0]] : []

  const step = Math.max(0.5, spacing)
  const out: Point[] = [{ x: src[0].x, y: src[0].y }]
  let carry = 0

  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1]
    const b = src[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len === 0) continue
    let travelled = step - carry
    while (travelled <= len) {
      const u = travelled / len
      out.push({ x: a.x + dx * u, y: a.y + dy * u })
      travelled += step
    }
    carry = len - (travelled - step)
  }

  const last = src[src.length - 1]
  const tail = out[out.length - 1]
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > 1e-6) out.push({ x: last.x, y: last.y })
  if (out.length < 2) out.push({ x: last.x, y: last.y })
  return out
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/** Each dab spans this many sample spacings, so neighbours overlap heavily. */
const DAB_SPAN = 2.6
/** Arc length between wobble control points; the edge drifts, never jumps. */
const WOBBLE_PERIOD = 90
/** Floor of the per dab lens envelope, so a dab's own ends never pinch to zero. */
const LENS_FLOOR = 0.55

/** Smooth, deterministic noise in [-1, 1] along arc length. */
function drift(seed: number | string, lane: number, arc: number): number {
  const cell = Math.floor(arc / WOBBLE_PERIOD)
  const u = smoothstep(arc / WOBBLE_PERIOD - cell)
  const a = hash(seed, lane * 4096 + cell) * 2 - 1
  const b = hash(seed, lane * 4096 + cell + 1) * 2 - 1
  return a + (b - a) * u
}

/** Position and unit tangent at arc length `arc` along a resampled polyline. */
function along(
  line: Point[],
  cum: number[],
  arc: number,
): { x: number; y: number; dx: number; dy: number } {
  const total = cum[cum.length - 1]
  const s = Math.min(Math.max(arc, 0), total)
  let i = 1
  while (i < cum.length - 1 && cum[i] < s) i++
  const a = line[i - 1]
  const b = line[i]
  const len = cum[i] - cum[i - 1]
  const u = len === 0 ? 0 : (s - cum[i - 1]) / len
  let dx = b.x - a.x
  let dy = b.y - a.y
  const n = Math.hypot(dx, dy) || 1
  dx /= n
  dy /= n
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dx, dy }
}

/**
 * Build the dab chain for a polyline.
 *
 * The centreline is resampled at `samples` units of arc length. Each sample
 * becomes one closed polygon centred on it and spanning DAB_SPAN samples, so
 * consecutive dabs overlap by most of their length and fuse into one ribbon.
 * The top and bottom edges follow independent low frequency drifts along the
 * arc plus fine hashed jitter per vertex, and each dab is a shallow lens so
 * its own ends feather into its neighbours instead of cutting a hard tile.
 */
export function brushRibbon(points: Point[], opts: Partial<InkOpts> = {}): Dab[] {
  const o: InkOpts = { ...BRUSH_DEFAULTS, ...opts }
  const line = resample(points, o.samples)
  if (line.length < 2) return []

  const cum: number[] = [0]
  for (let i = 1; i < line.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y))
  }
  const total = cum[cum.length - 1]
  if (total === 0) return []

  const seed = o.seed
  const shear = Math.tan(o.chisel)
  const dabs: Dab[] = []
  const segments = line.length - 1
  const half_span = (o.samples * DAB_SPAN) / 2

  for (let s = 0; s < segments; s++) {
    const centre = (cum[s] + cum[s + 1]) / 2
    const k = s * 64
    const top: Point[] = []
    const bottom: Point[] = []

    for (let v = 0; v < EDGE_VERTS; v++) {
      const u = v / (EDGE_VERTS - 1)
      const arc = centre + (u - 0.5) * 2 * half_span
      const p = along(line, cum, arc)
      const t = Math.min(1, Math.max(0, arc / total))
      const lens = LENS_FLOOR + (1 - LENS_FLOOR) * Math.sin(Math.PI * u)
      const half = (o.width * widthProfile(t, o) * lens) / 2
      const nx = -p.dy
      const ny = p.dx

      const topWobble = drift(seed, 1, arc) * o.wobble
      const botWobble = drift(seed, 2, arc) * o.wobble
      const topJit = (hash(seed, k + 8 + v) - 0.5) * 2 * o.edge
      const botJit = (hash(seed, k + 24 + v) - 0.5) * 2 * o.edge
      const topOff = half + topWobble + topJit
      const botOff = -(half - botWobble + botJit)

      top.push({
        x: p.x + nx * topOff + p.dx * topOff * shear,
        y: p.y + ny * topOff + p.dy * topOff * shear,
      })
      bottom.push({
        x: p.x + nx * botOff + p.dx * botOff * shear,
        y: p.y + ny * botOff + p.dy * botOff * shear,
      })
    }

    const ring = [...top, ...bottom.reverse()]
    let d = `M${round(ring[0].x)} ${round(ring[0].y)}`
    for (let i = 1; i < ring.length; i++) d += `L${round(ring[i].x)} ${round(ring[i].y)}`
    d += 'Z'

    const dab: Dab = {
      d,
      fillOpacity: round(hashRange(seed, k + 3, OPACITY_MIN, OPACITY_MAX) * 1000) / 1000,
    }
    if (hash(seed, k + 4) < OVERPAINT_SHARE) dab.overpaint = OVERPAINT_OPACITY
    dabs.push(dab)
  }

  return dabs
}

/** Axis aligned bounding box of a dab chain, in viewBox units. */
export function ribbonBounds(dabs: Dab[]): { x: number; y: number; width: number; height: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const dab of dabs) {
    const nums = dab.d.match(/-?\d+(?:\.\d+)?/g)
    if (!nums) continue
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = Number(nums[i])
      const y = Number(nums[i + 1])
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (minX === Infinity) return { x: 0, y: 0, width: 0, height: 0 }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
