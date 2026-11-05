<script setup lang="ts">
/**
 * Slide 3: the same record, zoomed into its last five full years.
 *
 * Beat 0 is Slide 2's end state, line for line (same series, geometry, ink
 * and `vt-keeling-line` layer), plus a box drawn around 2021 to 2025, so the
 * view transition holds the curve still and only the box arrives.
 *
 * Beat 1 is the zoom. The box is in data units, so it grows to fill the plot
 * as the scales change: one value, `s.zoom`, moves the box linearly in screen
 * space from where it sat on the record to the plot's edges, and the domains
 * are solved from the box at each frame. Axis labels on both scales ride the
 * live scales and cross fade from the record's ticks to the window's.
 *
 * Beat 2 pops each year's high and low in date order. Beat 3 steps the line
 * back and draws the drawdowns, high month to low month, in emerald: the
 * stretch of each year the card says plants pull carbon dioxide down.
 */
import { computed, reactive, ref, useId } from 'vue'
import {
  DRAW,
  DUR,
  FILTER_IDS,
  SETTLE,
  clamp01,
  easedStagger,
  filterUrl,
  ink,
  lerp,
  useStage,
  xScale,
  yScale,
  type LineHandle,
  type RuleHandle,
} from 'slidev-addon-decks/story'
import {
  GRID_PPM as RECORD_GRID,
  SERIES,
  TICK_YEARS,
  X_DOMAIN as RECORD_X,
  Y_DOMAIN as RECORD_Y,
} from '../data/record'
import {
  DRAWDOWNS,
  FROM,
  GRID_PPM as ZOOM_GRID,
  HIGHS,
  HIGH_MONTHS,
  LOWS,
  LOW_MONTHS,
  SWING_LABEL,
  TO,
  X_DOMAIN as ZOOM_X,
  Y_DOMAIN as ZOOM_Y,
} from '../data/seasons'
import { GRID_LABEL_X, TICK_Y, X_RANGE, Y_RANGE } from '../data/frame'

const COPY = [
  {
    lead: 'The box holds the last five years.',
    body: `The same monthly means, ${FROM} through ${TO}.`,
  },
  {
    lead: 'Up close, the line is a sawtooth.',
    body: 'NOAA calls it the seasonal cycle. It rides on top of the climb.',
  },
  {
    lead: 'Highs in late spring, lows in early fall.',
    body: `Every year peaked in ${HIGH_MONTHS} and bottomed out in ${LOW_MONTHS}.`,
  },
  {
    lead: 'Growing plants pull carbon dioxide down.',
    body: `Respiration and decay release it again. Each yearly swing ran ${SWING_LABEL}.`,
  },
]

const s = reactive({ zoom: 0, lens: 1, dots: 0, ghost: 0 })
const rule = ref<RuleHandle | null>(null)
const drawdowns = ref<LineHandle[]>([])

/* ── The zoom: the box's screen rect at each `zoom`, and the domains it implies ── */
const sx0 = xScale(RECORD_X, X_RANGE)
const sy0 = yScale(RECORD_Y, Y_RANGE)
/** The box on the full record: [left, right], [bottom, top] in viewBox units. */
const LENS_X: [number, number] = [sx0(ZOOM_X[0]), sx0(ZOOM_X[1])]
const LENS_Y: [number, number] = [sy0(ZOOM_Y[0]), sy0(ZOOM_Y[1])]

const domains = computed(() => {
  const z = s.zoom
  const bx0 = lerp(LENS_X[0], X_RANGE[0], z)
  const bx1 = lerp(LENS_X[1], X_RANGE[1], z)
  const kx = (bx1 - bx0) / (ZOOM_X[1] - ZOOM_X[0])
  const by0 = lerp(LENS_Y[0], Y_RANGE[0], z)
  const by1 = lerp(LENS_Y[1], Y_RANGE[1], z)
  const ky = (by0 - by1) / (ZOOM_Y[1] - ZOOM_Y[0])
  const x: [number, number] = [ZOOM_X[0] - (bx0 - X_RANGE[0]) / kx, ZOOM_X[1] + (X_RANGE[1] - bx1) / kx]
  const y: [number, number] = [ZOOM_Y[0] - (Y_RANGE[0] - by0) / ky, ZOOM_Y[1] + (by1 - Y_RANGE[1]) / ky]
  return { x, y, box: { x: bx0, y: by1, width: bx1 - bx0, height: by0 - by1 } }
})
const sx = computed(() => xScale(domains.value.x, X_RANGE))
const sy = computed(() => yScale(domains.value.y, Y_RANGE))

/**
 * Only the months near the visible window go to the line, so its path and its
 * glow filter stay plot-sized while the scale runs past the frame. The clip
 * trims the last partial segment at each edge.
 */
const visible = computed(() => {
  const [x0, x1] = domains.value.x
  const pad = (x1 - x0) * 0.02 + 1 / 12
  return SERIES.filter((p) => p.x >= x0 - pad && p.x <= x1 + pad)
})

/** Opacity for a label at `at` on an axis spanning `lo..hi`: gone past either end. */
const inside = (at: number, lo: number, hi: number) => (at >= lo - 2 && at <= hi + 2 ? 1 : 0)
const fadeOut = computed(() => clamp01(1 - s.zoom * 2))
const fadeIn = computed(() => clamp01(s.zoom * 2 - 1))

const xTicks = computed(() => [
  ...TICK_YEARS.map((y) => ({ key: `r${y}`, x: sx.value(y), text: String(y), o: fadeOut.value })),
  ...Array.from({ length: TO - FROM + 1 }, (_, i) => FROM + i).map((y) => ({
    key: `z${y}`,
    x: sx.value(y + 0.5),
    text: String(y),
    o: fadeIn.value,
  })),
].map((t) => ({ ...t, o: t.o * inside(t.x, X_RANGE[0], X_RANGE[1]) })))

const yGrid = computed(() => [
  ...RECORD_GRID.map((v) => ({ key: `r${v}`, y: sy.value(v), text: `${v} ppm`, o: fadeOut.value })),
  ...ZOOM_GRID.map((v) => ({ key: `z${v}`, y: sy.value(v), text: `${v} ppm`, o: fadeIn.value })),
].map((g) => ({ ...g, o: g.o * inside(g.y, Y_RANGE[1], Y_RANGE[0]) })))

/* ── Highs and lows, in date order ── */
const MARKS = [...HIGHS.map((r) => ({ ...r, hue: 'amber' as const })), ...LOWS.map((r) => ({ ...r, hue: 'emerald' as const }))]
  .sort((a, b) => a.x - b.x)
/** Each mark's start inside the beat, eased across the spread. */
const MARK_AT = MARKS.map((_, i) => easedStagger(i, MARKS.length, 0.6))
const marks = computed(() =>
  MARKS.map((m, i) => {
    const p = clamp01((s.dots - MARK_AT[i]) / 0.4)
    return { key: `${m.year}-${m.month}`, x: sx.value(m.x), y: sy.value(m.y), r: 10 * p, fill: ink(m.hue, 3) }
  }),
)

const clipId = `keeling-zoom-${useId()}`
const CLIP = { x: X_RANGE[0], y: Y_RANGE[1] - 40, width: X_RANGE[1] - X_RANGE[0], height: Y_RANGE[0] - Y_RANGE[1] + 40 }
const GLOW = filterUrl(FILTER_IDS.glow)
const LENS_INK = ink('cyan', 2)

const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { zoom: 1, duration: DUR.gather, ease: DRAW })
    tl.to(s, { lens: 0, duration: DUR.grow, ease: SETTLE }, `-=${DUR.grow}`)
    beat(1)
    tl.to(s, { dots: 1, duration: DUR.scale, ease: 'none' })
    beat(2)
    const at = tl.duration()
    tl.to(s, { ghost: 0.7, duration: DUR.color, ease: SETTLE }, at)
    drawdowns.value.forEach((line, i) => line.addDraw(tl, at + DUR.opacity + easedStagger(i, DRAWDOWNS.length, DUR.grow)))
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <line v-for="g in yGrid" :key="`l${g.key}`" class="grid" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y1="g.y" :y2="g.y" :style="{ opacity: String(g.o) }" />
        <text v-for="g in yGrid" :key="g.key" class="od-stage-label" :x="GRID_LABEL_X" :y="g.y + 10" text-anchor="end" :style="{ opacity: String(g.o) }">
          {{ g.text }}
        </text>
        <text v-for="t in xTicks" :key="t.key" class="od-stage-label" :x="t.x" :y="TICK_Y" text-anchor="middle" :style="{ opacity: String(t.o) }">
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer class="vt-baseline">
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-baseline" />
      </StoryLayer>
      <!-- Not keyed on playCount: the drawdowns are driven through refs. -->
      <StoryLayer class="vt-keeling-line">
        <defs>
          <clipPath :id="clipId">
            <rect :x="CLIP.x" :y="CLIP.y" :width="CLIP.width" :height="CLIP.height" />
          </clipPath>
        </defs>
        <g :clip-path="`url(#${clipId})`">
          <InkLine
            :series="visible"
            :x-domain="domains.x"
            :y-domain="domains.y"
            :x-range="X_RANGE"
            :y-range="Y_RANGE"
            hue="cyan"
            :step="4"
            :ghost="s.ghost"
            seed="keeling-record"
          />
          <InkLine
            v-for="(d, i) in DRAWDOWNS"
            :key="i"
            ref="drawdowns"
            :series="d"
            :x-domain="domains.x"
            :y-domain="domains.y"
            :x-range="X_RANGE"
            :y-range="Y_RANGE"
            hue="emerald"
            :step="3"
            :seed="`keeling-drawdown-${FROM + i}`"
          />
          <g :filter="GLOW">
            <circle v-for="m in marks" :key="m.key" :cx="m.x" :cy="m.y" :r="m.r" :fill="m.fill" />
          </g>
        </g>
        <rect
          class="lens"
          :x="domains.box.x"
          :y="domains.box.y"
          :width="domains.box.width"
          :height="domains.box.height"
          rx="6"
          :stroke="LENS_INK"
          :fill="LENS_INK"
          :style="{ opacity: String(s.lens) }"
        />
      </StoryLayer>
      <h2 class="od-story-head">The curve breathes once a year.</h2>
      <StoryLink href="https://gml.noaa.gov/education/carbon_toolkit/basics.html" label="NOAA GML, carbon cycle basics" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" hue="emerald" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.grid {
  stroke: var(--od-border-subtle);
  stroke-width: 1.5;
}
.lens {
  stroke-width: 2.5;
  fill-opacity: 0.08;
}
</style>
