<script setup lang="ts">
/**
 * UnitGrid: a waffle of unit glyphs inside the stage svg.
 *
 * One square is one dataset, everywhere in the deck. Files get the taller
 * `sheet` glyph (a page with a folded corner and two ruled lines) so a sheet
 * and a square are never confused for each other.
 *
 * Marks follow `inkStyle()`. In `clean` (the default) a square is a rounded
 * rect and a sheet is a page outline with etched rules, both in the ramp hue
 * with an optional soft same-hue glow. In `marker` the same cells are hashed
 * polygons under `mk-marker-lite`.
 *
 * The component owns no timeline. Everything animatable is a plain 0..1 prop,
 * so a parent can build its beat timeline at setup time against a reactive
 * state object and bind the fields straight through:
 *
 * - `reveal`   brings the cells in, with a hashed stagger across the field
 * - `recolor`  blends each cell from `color` toward its own category hue
 * - `scatter`  loosens the grid into a cloud: each cell drifts part of the
 *   way toward the field's centre and off its row on a hashed jitter, which
 *   is how a waffle stops reading as a table and starts reading as nodes
 * - `collapse` scales and slides every cell toward `collapseTo`. With a
 *   `collapseStagger` the cells leave in a wave, farthest from the target
 *   first, each on its own TRACE curve (a slow start, a run, a long settle)
 *   along a bowed path with a hashed side, holding size for most of the trip
 *   and dissolving only once inside the `collapseInto` box around the target,
 *   so the field flows into a container rather than vanishing in mid air.
 *   Tween `collapse` with `ease: 'none'` then, since the shape is per cell.
 *   `arrived` (exposed) counts the cells that have entered the box, for a
 *   parent that wants to tick a figure with the landings.
 *
 * Per cell the animated transform and opacity sit on an unfiltered wrapper
 * and the group inside it is static, which is the same split InkLine and
 * InkRule use to keep any filter output cached. Values are quantised, so most
 * frames of a long bloom leave most cells untouched in the DOM.
 *
 * On a field of several hundred cells, leave `glow` off and pass
 * `filter-id="none"`: a filter region per cell is affordable for twenty nine
 * sheets and is not affordable for nine hundred squares.
 */
import { computed } from 'vue'
import {
  CANVAS,
  clamp01,
  FILTER_IDS,
  filterUrl,
  hash,
  hashRange,
  hashSigned,
  ink,
  inkStyle,
  type Point,
  type UnitGridItem,
  TRACE,
  gsap,
  UNIT_GRID_DEFAULTS,
  unitCellCenter,
  unitCellHeight,
} from '../story'

const props = withDefaults(
  defineProps<{
    /** Explicit items. Takes precedence over `count`. */
    items?: UnitGridItem[]
    /** Anonymous cells, when the field is a quantity rather than a list. */
    count?: number
    glyph?: 'square' | 'sheet'
    cols?: number
    /** Cell size in stage viewBox units. Sheets default to a page shape. */
    cellWidth?: number
    cellHeight?: number
    gapX?: number
    gapY?: number
    /** Top left corner of the field, in stage viewBox units. */
    origin?: Point
    /** Base ink, before any recolor. */
    color?: string
    /** Recolor target: one color for the whole field, or one per item. */
    colorBy?: string | ((item: UnitGridItem, index: number) => string | undefined)
    seed?: string
    /** 0 hides the field, 1 shows all of it. Stagger is applied internally. */
    reveal?: number
    /** Share of `reveal` spent on the stagger. 0 brings every cell in at once. */
    stagger?: number
    /** 0 is `color`, 1 is the per item color. */
    recolor?: number
    /** 0 is the grid, 1 is the grid loosened into a cloud around its own centre. */
    scatter?: number
    /** 0 is the grid, 1 is every cell collapsed onto `collapseTo`. */
    collapse?: number
    collapseTo?: Point
    /** Share of `collapse` spent on the per cell wave. 0 moves every cell together. */
    collapseStagger?: number
    /** Box around `collapseTo`, in stage units, inside which a staggered cell dissolves. */
    collapseInto?: { width: number; height: number }
    /** Soft same-hue glow. Off on large fields: it is one filter per cell. */
    glow?: boolean
    /** Marker style only: which marker filter to use, or 'none'. */
    filterId?: string
  }>(),
  {
    items: undefined,
    count: 0,
    glyph: UNIT_GRID_DEFAULTS.glyph,
    cols: UNIT_GRID_DEFAULTS.cols,
    cellWidth: UNIT_GRID_DEFAULTS.cellWidth,
    cellHeight: undefined,
    gapX: UNIT_GRID_DEFAULTS.gapX,
    gapY: UNIT_GRID_DEFAULTS.gapY,
    origin: () => ({ ...UNIT_GRID_DEFAULTS.origin }),
    color: undefined,
    colorBy: undefined,
    seed: 'unit-grid',
    reveal: 1,
    stagger: 0.6,
    recolor: 0,
    scatter: 0,
    collapse: 0,
    collapseTo: () => ({ x: 960, y: 540 }),
    collapseStagger: 0,
    collapseInto: undefined,
    glow: false,
    filterId: FILTER_IDS.markerLite,
  },
)

const marker = computed(() => inkStyle() === 'marker')

/** Sheets are pages: taller than they are wide. Squares are square. */
const cellH = computed(() => unitCellHeight(props))

/** Corner radius of a clean square. */
const radius = computed(() => Math.min(props.cellWidth, cellH.value) * 0.18)

const baseInk = computed(() => props.color ?? ink('slate', 2))

const source = computed<UnitGridItem[]>(() => {
  if (props.items) return props.items
  return Array.from({ length: Math.max(0, props.count) }, (_, i) => ({ id: `${props.seed}:${i}` }))
})

const filterAttr = computed(() => {
  if (marker.value) {
    return props.filterId === 'none' ? undefined : filterUrl(props.filterId)
  }
  return props.glow ? filterUrl(FILTER_IDS.glow) : undefined
})

/** The long move curve, applied per cell when the collapse is staggered. */
const trace: (t: number) => number = gsap.parseEase(TRACE) ?? ((t) => t)

/** With no `collapseInto` box, the share of a cell's own trip over which it fades. */
const ABSORB_FROM = 0.7

/** A cell lands as a tile this much of its size, and the dissolve takes it from there. */
const TILE = 0.4

/** Scatter: how far in toward the centre a cell drifts, as a share of its distance. */
const PULL = 0.3
/** Scatter: the hashed jitter off the row, in stage units. */
const JITTER = 70

/** How far a cell bows off its straight line, as a share of the trip length. */
const BOW = 0.22
const q = (n: number, step = 100) => Math.round(n * step) / step

/** Rounded path point, in the cell's own 0,0 to w,h space. */
function p(x: number, y: number): string {
  return `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`
}

/** A mark drawn over the cell body: `canvas` ones are etched out of it. */
interface CellMark {
  d: string
  etch: boolean
  opacity: number
}

interface Glyph {
  /** Path body, or null when the cell is a plain rect. */
  body: string | null
  marks: CellMark[]
}

/** Marker style: a filled quad with hashed corners and edge midpoints. */
function markerSquare(seed: string, w: number, h: number): Glyph {
  const j = Math.min(w, h) * 0.14
  const jit = (i: number) => (hash(seed, i) - 0.5) * 2 * j
  const ring: string[] = [
    p(jit(1), jit(2)),
    p(w / 2 + jit(3), jit(4) * 0.6),
    p(w + jit(5), jit(6)),
    p(w + jit(7) * 0.6, h / 2 + jit(8)),
    p(w + jit(9), h + jit(10)),
    p(w / 2 + jit(11), h + jit(12) * 0.6),
    p(jit(13), h + jit(14)),
    p(jit(15) * 0.6, h / 2 + jit(16)),
  ]
  return { body: `M${ring.join('L')}Z`, marks: [] }
}

/** The fold and the two ruled lines, in cell space. Shared by both styles. */
function pageMarks(w: number, h: number, fold: number): CellMark[] {
  const rule = (yy: number): string => {
    const x0 = w * 0.16
    const x1 = w * 0.74
    const t = Math.max(0.6, h * 0.045)
    return `M${p(x0, yy)}L${p(x1, yy)}L${p(x1, yy + t)}L${p(x0, yy + t)}Z`
  }
  return [
    { d: `M${p(w - fold, 0)}L${p(w - fold, fold)}L${p(w, fold)}Z`, etch: true, opacity: 0.55 },
    { d: rule(h * 0.56), etch: true, opacity: 0.42 },
    { d: rule(h * 0.73), etch: true, opacity: 0.42 },
  ]
}

/** Clean style: a page outline with a cut corner, no jitter. */
function cleanSheet(w: number, h: number): Glyph {
  const fold = Math.min(w, h) * 0.3
  const body = `M${p(0, 0)}L${p(w - fold, 0)}L${p(w, fold)}L${p(w, h)}L${p(0, h)}Z`
  return { body, marks: pageMarks(w, h, fold) }
}

/** Marker style: the same page, drawn with a shaky hand. */
function markerSheet(seed: string, w: number, h: number): Glyph {
  const j = Math.min(w, h) * 0.07
  const jit = (i: number) => (hash(seed, i) - 0.5) * 2 * j
  const fold = Math.min(w, h) * 0.3
  const body =
    `M${p(jit(1), jit(2))}` +
    `L${p(w - fold + jit(3), jit(4))}` +
    `L${p(w + jit(5), fold + jit(6))}` +
    `L${p(w + jit(7), h + jit(8))}` +
    `L${p(jit(9), h + jit(10))}Z`
  return { body, marks: pageMarks(w, h, fold) }
}

interface Cell {
  id: string
  /** Cell centre in stage viewBox units, before any collapse. */
  cx: number
  cy: number
  body: string | null
  marks: CellMark[]
  fill: string
  fillOpacity: number
  opacity: number
  /** 0 outside the target box, 1 fully dissolved into it. */
  absorbed: number
  transform: string
}

/** Geometry only, so it survives every reveal and recolor frame untouched. */
const layout = computed(() => {
  const w = props.cellWidth
  const h = cellH.value
  const cols = Math.max(1, props.cols)
  const isMarker = marker.value

  return source.value.map((item, i) => {
    const seed = `${props.seed}:${item.id}`
    let glyph: Glyph
    if (props.glyph === 'sheet') {
      glyph = isMarker ? markerSheet(seed, w, h) : cleanSheet(w, h)
    } else {
      glyph = isMarker ? markerSquare(seed, w, h) : { body: null, marks: [] }
    }
    const center = unitCellCenter(i, props)
    return {
      item,
      index: i,
      cx: center.x,
      cy: center.y,
      body: glyph.body,
      marks: glyph.marks,
      // A hashed order offset, so the field does not come in as a wipe.
      order: (i + hash(`${props.seed}:order`, i) * cols) / Math.max(1, source.value.length),
      gather: hash(`${props.seed}:gather`, i),
      jx: hashSigned(`${props.seed}:jx`, i, JITTER),
      jy: hashSigned(`${props.seed}:jy`, i, JITTER),
      fillOpacity: isMarker ? q(hashRange(`${props.seed}:alpha`, i, 0.58, 0.96), 1000) : 0.92,
    }
  })
})

function targetColor(item: UnitGridItem, index: number): string {
  if (typeof props.colorBy === 'function') {
    const c = props.colorBy(item, index)
    if (c) return c
  } else if (typeof props.colorBy === 'string') {
    return props.colorBy
  }
  if (item.hue) return ink(item.hue, item.step ?? 2)
  return baseInk.value
}

const cells = computed<Cell[]>(() => {
  const w = props.cellWidth
  const h = cellH.value
  const spread = clamp01(props.stagger)
  const ramp = Math.max(0.001, 1 - spread)
  const c = clamp01(props.collapse)
  const mix = clamp01(props.recolor)
  const base = baseInk.value
  const wave = clamp01(props.collapseStagger)
  const waveRamp = Math.max(0.001, 1 - wave)

  // Farthest cells leave first, so the wave runs inward toward the target.
  // A little hash keeps two cells at the same radius from moving in lockstep.
  const far = layout.value.map((cell) =>
    Math.hypot(cell.cx - props.collapseTo.x, cell.cy - props.collapseTo.y),
  )
  const farMax = Math.max(1, ...far)
  const box = props.collapseInto
  const sc = clamp01(props.scatter)
  const mid = layout.value.reduce(
    (acc, cell) => ({
      x: acc.x + cell.cx / layout.value.length,
      y: acc.y + cell.cy / layout.value.length,
    }),
    { x: 0, y: 0 },
  )

  return layout.value.map((cell, i) => {
    const local = clamp01((clamp01(props.reveal) - cell.order * spread) / ramp)
    // Quantised, so a slow bloom writes to the DOM for a fraction of frames.
    const shown = q(local, 32)
    const grown = 0.62 + 0.38 * shown

    let trip = c
    let size = 1 - c
    let absorbed = 0
    let bowX = 0
    let bowY = 0
    if (wave > 0) {
      const lead = clamp01(1 - far[i] / farMax + (cell.gather - 0.5) * 0.3)
      const own = clamp01((c - lead * wave) / waveRamp)
      trip = trace(own)
      // Size holds through the run and settles to a tile late in the trip.
      size = 1 - (1 - TILE) * trip * trip
      const dx = props.collapseTo.x - cell.cx
      const dy = props.collapseTo.y - cell.cy
      if (box) {
        // Share of the straight line that lies inside the box: the dissolve
        // starts at the box edge and completes at the target.
        const edge = Math.min(
          dx === 0 ? 1 : box.width / 2 / Math.abs(dx),
          dy === 0 ? 1 : box.height / 2 / Math.abs(dy),
          1,
        )
        absorbed = clamp01(1 - (1 - trip) / Math.max(0.001, edge))
      } else {
        absorbed = clamp01((own - ABSORB_FROM) / (1 - ABSORB_FROM))
      }
      // A bow perpendicular to the straight line, peaking mid trip, on a
      // hashed side, so the paths fan and cross instead of raying inward.
      const side = cell.gather < 0.5 ? -1 : 1
      const arc = Math.sin(Math.PI * trip) * BOW * side
      bowX = -dy * arc
      bowY = dx * arc
    }

    const sx = sc * ((mid.x - cell.cx) * PULL + cell.jx)
    const sy = sc * ((mid.y - cell.cy) * PULL + cell.jy)
    const cx = cell.cx + (props.collapseTo.x - cell.cx) * trip + bowX + sx
    const cy = cell.cy + (props.collapseTo.y - cell.cy) * trip + bowY + sy
    const k = q(grown * size, 1000)

    const fill =
      mix <= 0
        ? base
        : `color-mix(in oklab, ${targetColor(cell.item, cell.index)} ${q(mix * 100, 10)}%, ${base})`

    return {
      id: cell.item.id,
      cx: cell.cx,
      cy: cell.cy,
      body: cell.body,
      marks: cell.marks,
      fill,
      fillOpacity: cell.fillOpacity,
      opacity: q(shown * (1 - absorbed), 32),
      absorbed,
      transform: `translate(${q(cx, 10)} ${q(cy, 10)}) scale(${k}) translate(${-w / 2} ${-h / 2})`,
    }
  })
})

/** Cells that have entered the target box. */
const arrived = computed(() => cells.value.filter((cell) => cell.absorbed > 0).length)

defineExpose({ arrived })
</script>

<template>
  <g class="od-unit-grid">
    <g :style="{ opacity: cell.opacity }" v-for="cell in cells" :key="cell.id" :transform="cell.transform">
      <g :filter="filterAttr">
        <rect
          v-if="cell.body === null"
          :style="{ fillOpacity: cell.fillOpacity }"
          :width="props.cellWidth"
          :height="cellH"
          :rx="radius"
          :fill="cell.fill"
        />
        <path :style="{ fillOpacity: cell.fillOpacity }" v-else :d="cell.body" :fill="cell.fill" />
        <path
          v-for="(mark, i) in cell.marks"
          :style="{ fillOpacity: mark.opacity }"
          :key="i"
          :d="mark.d"
          :fill="mark.etch ? CANVAS : cell.fill"
        />
      </g>
    </g>
  </g>
</template>
