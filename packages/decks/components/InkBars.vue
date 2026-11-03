<script setup lang="ts">
/**
 * InkBars: a horizontal bar set drawn as short brush ribbons.
 *
 * Each row is one ribbon growing rightward from a shared origin, with its
 * label typeset to the left and its value typeset in the series ink at the
 * live end of the ribbon. Nothing here is an axis: the value scale is carried
 * by the end labels, exactly as InkLine carries a series with direct labels.
 *
 * Growth, reordering, rescaling and exit are all driven by a caller's
 * timeline through the four `add*` helpers, so beat pacing stays in one place
 * and every stop is seekable in both directions.
 *
 * Two implementation notes.
 *
 * A partial bar is a rebuilt ribbon rather than a scaled one, the same rule
 * InkLine follows: scaling a ribbon on x stretches the taper and the hashed
 * edge jitter with it, so a half grown bar would not look like a shorter
 * stroke, it would look like a squashed one.
 *
 * The reorder is a tween of row geometry, not GSAP Flip. Flip creates its
 * tweens at call time from a captured DOM state, which cannot be built into
 * the paused, label-seeked timeline this deck drives every beat from: a seek
 * backwards past a Flip would have nothing to play. Here the layout is known
 * in closed form (rows are evenly spaced in a band, lengths come from the
 * domain), so tweening `y` and `len` directly gives the same motion and stays
 * reversible.
 *
 * Geometry is in viewBox units of the 1920x1080 stage.
 */
import { computed, reactive } from 'vue'
import {
  DUR,
  easedStagger,
  FILTER_IDS,
  brushRibbon,
  filterUrl,
  gsap,
  ink,
  inkStyle,
  resolvePosition,
  stackEndLabels,
  type BarsHandle,
  type Hue,
  type InkBarRow,
  type InkStep,
} from '../story'

const props = withDefaults(
  defineProps<{
    rows: InkBarRow[]
    /** Value domain. Bars start at domain[0], which is the bar origin. */
    domain: [number, number]
    /** Bar origin and full domain end, in viewBox units. */
    xRange: [number, number]
    /** Top and bottom of the row block, in viewBox units. */
    yBand: [number, number]
    /** Ribbon thickness in viewBox units. */
    thickness?: number
    /** Row order. `none` keeps the order given. */
    sort?: 'none' | 'asc' | 'desc'
    /** Label column width, ending `labelGap` left of the bar origin. */
    labelWidth?: number
    labelGap?: number
    /** Fallback end label formatter. */
    format?: (value: number) => string
    hue?: Hue
    step?: InkStep
    seed?: string
  }>(),
  {
    thickness: 24,
    sort: 'none',
    labelWidth: 460,
    labelGap: 40,
    format: (value: number) => String(value),
    hue: 'emerald',
    step: 3,
    seed: 'ink-bars',
  },
)

interface RowState {
  /** Row centre in viewBox units. */
  y: number
  /** Full bar length in viewBox units at the current domain. */
  len: number
  /** How much of that length is drawn, 0 to 1. */
  reveal: number
  opacity: number
  /** How far the row has moved onto its accent ink, 0 to 1. */
  accent: number
  label: string
  text: string
  accentColor: string
  base: string
}

/**
 * Every row this component has ever been handed, keyed by id. Exited rows
 * stay in the map at zero opacity so a reverse seek can bring them back.
 */
const state = reactive<Record<string, RowState>>({})
/** Ids in render order. Layout order is resolved separately. */
const order = reactive<string[]>([])

function baseInk(row: InkBarRow): string {
  return ink(row.hue ?? props.hue, row.step ?? props.step)
}

function labelFor(row: InkBarRow): string {
  return row.text ?? props.format(row.value)
}

/** Row centres and bar lengths for a set of rows at a given domain. */
function layoutFor(
  rows: InkBarRow[],
  domain: [number, number],
): Record<string, { y: number; len: number }> {
  const sorted = [...rows]
  if (props.sort === 'desc') sorted.sort((a, b) => b.value - a.value)
  if (props.sort === 'asc') sorted.sort((a, b) => a.value - b.value)

  const [top, bottom] = props.yBand
  const pitch = sorted.length ? (bottom - top) / sorted.length : 0
  const span = props.xRange[1] - props.xRange[0]
  const width = domain[1] - domain[0] || 1

  const out: Record<string, { y: number; len: number }> = {}
  sorted.forEach((row, i) => {
    const clamped = Math.max(domain[0], Math.min(domain[1], row.value))
    out[row.id] = {
      y: top + pitch * (i + 0.5),
      len: ((clamped - domain[0]) / width) * span,
    }
  })
  return out
}

/** Seed the state map from the rows the component was mounted with. */
{
  const initial = layoutFor(props.rows, props.domain)
  for (const row of props.rows) {
    order.push(row.id)
    state[row.id] = {
      y: initial[row.id].y,
      len: initial[row.id].len,
      reveal: 0,
      opacity: 1,
      accent: 0,
      label: row.label,
      text: labelFor(row),
      accentColor: baseInk(row),
      base: baseInk(row),
    }
  }
}

const LABEL_X = computed(() => props.xRange[0] - props.labelGap)
/** Left edge of the label column, exposed so a caller can align a headline. */
const labelLeft = computed(() => LABEL_X.value - props.labelWidth)

const style = computed(() => inkStyle())

interface RenderRow {
  id: string
  label: string
  y: number
  color: string
  opacity: number
  text: string
  /** Clean bar rect, in viewBox units. */
  x: number
  top: number
  width: number
  endX: number
  endY: number
  /** Populated only in marker style. */
  dabs: ReturnType<typeof brushRibbon>
}

/** Rows currently carrying any ink, in the order they were handed over. */
const live = computed(() =>
  order.filter((id) => state[id] && state[id].opacity > 0 && state[id].reveal > 0),
)

const rendered = computed<RenderRow[]>(() => {
  const rows = live.value.map((id) => state[id])
  // The helper the deck uses everywhere for direct labels. Rows are already
  // spaced by the band, so this only ever bites after several exits have
  // widened the pitch and a caller has tightened the band.
  const stacked = stackEndLabels(
    rows.map((row) => ({ y: row.y, h: props.thickness })),
    props.thickness * 0.5,
  )

  return live.value.map((id, i) => {
    const row = state[id]
    const drawn = row.len * Math.min(1, Math.max(0, row.reveal))
    const color =
      row.accent > 0
        ? `color-mix(in oklab, ${row.accentColor} ${row.accent * 100}%, ${row.base})`
        : row.base
    return {
      id,
      label: row.label,
      y: row.y,
      color,
      opacity: row.opacity,
      text: row.text,
      x: props.xRange[0],
      top: row.y - props.thickness / 2,
      width: Math.max(drawn, 1),
      endX: props.xRange[0] + drawn + props.thickness * 0.7,
      endY: stacked[i],
      dabs:
        style.value === 'marker'
          ? brushRibbon(
              [
                { x: props.xRange[0], y: row.y },
                { x: props.xRange[0] + Math.max(drawn, 1), y: row.y },
              ],
              {
                seed: `${props.seed}:${id}`,
                width: props.thickness,
                taperIn: 0.04,
                taperOut: 0.07,
                startWidth: 0.82,
                endWidth: 0.66,
                wobble: 1.6,
                edge: 0.9,
                samples: 16,
              },
            )
          : [],
    }
  })
})

/**
 * Grow every current row from the origin. `spread` (seconds, a DUR value)
 * cascades the rows top to bottom on `easedStagger`; 0, the default, grows
 * them together.
 */
function addGrow(
  tl: gsap.core.Timeline,
  position?: gsap.Position,
  { spread = 0 }: { spread?: number } = {},
): gsap.core.Timeline {
  const at = resolvePosition(tl, position ?? '>')
  const ids = order.filter((id) => state[id])
  ids.forEach((id, i) => {
    tl.to(state[id], { reveal: 1, opacity: 1, duration: DUR.grow }, at + easedStagger(i, ids.length, spread))
  })
  return tl
}

/**
 * Re-sort and rescale in place. `next` is the full row set that survives,
 * already carrying its new values; rows absent from it keep their geometry
 * and should be handed to addExit first.
 */
function addReorder(
  tl: gsap.core.Timeline,
  next: InkBarRow[],
  nextDomain: [number, number] = props.domain,
  position?: gsap.Position,
  { spread = 0 }: { spread?: number } = {},
): gsap.core.Timeline {
  const target = layoutFor(next, nextDomain)
  const at = resolvePosition(tl, position ?? '>')
  const rows = next.filter((row) => target[row.id] && state[row.id])
  rows.forEach((row, i) => {
    const slot = target[row.id]
    const current = state[row.id]
    const start = at + easedStagger(i, rows.length, spread)
    tl.set(current, { text: labelFor(row), label: row.label }, start)
    tl.to(current, { y: slot.y, len: slot.len, duration: DUR.scale }, start)
  })
  return tl
}

/** Fade rows out. Erase holds before it fades, as everywhere else. */
function addExit(
  tl: gsap.core.Timeline,
  ids: string[],
  position?: gsap.Position,
): gsap.core.Timeline {
  const at = resolvePosition(tl, position ?? `+=${DUR.eraseDelay}`)
  for (const id of ids) {
    if (!state[id]) continue
    tl.to(state[id], { opacity: 0, duration: DUR.opacity }, at)
  }
  return tl
}

/** Move one row onto an accent ink. Recolor is slower than opacity. */
function addRecolor(
  tl: gsap.core.Timeline,
  id: string,
  color: string,
  position?: gsap.Position,
): gsap.core.Timeline {
  const row = state[id]
  if (!row) return tl
  const at = resolvePosition(tl, position ?? '>')
  tl.set(row, { accentColor: color }, at)
  tl.to(row, { accent: 1, duration: DUR.color }, at)
  return tl
}

/* `labelLeft` and `state` ride along for a caller that needs the geometry;
   the four timeline helpers are the contract, so they are typed. */
const handle: BarsHandle = { addGrow, addReorder, addExit, addRecolor }
defineExpose({ ...handle, labelLeft, state })
</script>

<template>
  <g class="od-ink-bars">
    <g
      v-for="row in rendered"
      :key="row.id"
      :style="{ color: row.color, opacity: String(row.opacity) }"
    >
      <text
        class="od-stage-label"
        :x="LABEL_X"
        :y="row.y + props.thickness * 0.36"
        text-anchor="end"
      >
        {{ row.label }}
      </text>

      <!-- Clean style: one rounded rect per bar, glowing in its own hue. -->
      <rect
        v-if="style === 'clean'"
        :x="row.x"
        :y="row.top"
        :width="row.width"
        :height="props.thickness"
        rx="3"
        fill="currentColor"
        :filter="filterUrl(FILTER_IDS.glow)"
      />

      <g v-else :filter="filterUrl(FILTER_IDS.marker)">
        <path
          v-for="(dab, i) in row.dabs"
          :style="{ fillOpacity: dab.fillOpacity }"
          :key="`d${i}`"
          :d="dab.d"
          fill="currentColor"
        />
        <template v-for="(dab, i) in row.dabs" :key="`o${i}`">
          <path
            v-if="dab.overpaint !== undefined"
            :style="{ fillOpacity: dab.overpaint }"
            :d="dab.d"
            fill="currentColor"
          />
        </template>
      </g>

      <text
        class="od-bars-value"
        :x="row.endX"
        :y="row.endY + props.thickness * 0.36"
        text-anchor="start"
      >
        {{ row.text }}
      </text>
    </g>
  </g>
</template>

<style scoped>
/* Typeset text is never filtered: the tension between drawn marks and crisp
   labels is the whole aesthetic. */
.od-bars-value {
  font-family: var(--od-font-mono);
  font-size: 30px;
  font-weight: 590;
  letter-spacing: 0.01em;
  fill: currentColor;
}
</style>
