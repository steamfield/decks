<script setup lang="ts">
/**
 * Slide 4: the average yearly rise in each decade, as columns on the record's
 * time axis. Each column spans the years it averages, so the partial 2020s
 * column is visibly short, and the baseline is the same rule as Slides 2, 3
 * and 5 (`vt-baseline`), so it holds still through the transition.
 *
 * Entry grows the columns left to right in grey. Beat 1 lights the 1960s and
 * the 2010s and draws the 1960s level across the chart, so every later column
 * reads against it; the chip names the multiple. Beat 2 hands the focus to
 * the partial 2020s in amber while the first pair steps back.
 *
 * The rise is not steeper every decade (the 1990s sit below the 1980s), so
 * the headline compares the record's end with its first decade instead.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, FILTER_IDS, SETTLE, easedStagger, filterUrl, ink, useStage, xScale, yScale } from 'slidev-addon-decks/story'
import {
  COLUMNS,
  CURRENT_ID,
  CURRENT_PPM,
  CURRENT_YEARS,
  DOMAIN,
  FIRST_DECADE,
  FIRST_ID,
  FIRST_PPM,
  LAST_FULL_DECADE,
  LAST_FULL_ID,
  SPEEDUP_LABEL,
} from '../data/decades'
import { X_DOMAIN } from '../data/record'
import { GRID_LABEL_X, TICK_Y, X_RANGE, Y_RANGE } from '../data/frame'

const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(DOMAIN, Y_RANGE)

/** Gap between neighbouring columns, in years on the shared axis. */
const GAP = 0.6
const GLOW = filterUrl(FILTER_IDS.glow)
/** Opacity of a column that is context rather than focus. */
const DIM = 0.4

const COPY = [
  {
    lead: "Each column is a decade's average yearly rise.",
    body: 'NOAA annual growth at Mauna Loa, averaged across each decade, in ppm per year.',
  },
  {
    lead: `In the ${LAST_FULL_DECADE}, it rose ${SPEEDUP_LABEL} as fast.`,
    body: `Measured against the ${FIRST_DECADE}, the first full decade of the record.`,
  },
  {
    lead: 'This decade is running faster still.',
    body: `Its first ${CURRENT_YEARS} years averaged ${CURRENT_PPM} ppm a year.`,
  },
]

const grow = reactive(COLUMNS.map(() => 0))
const s = reactive({ pair: 0, level: 0, chip: 0, current: 0, pairBack: 0 })

/** 0..1 hue mix and focus per column, from the beat state. */
function look(id: string): { hue: 'cyan' | 'amber' | 'slate'; mix: number; focus: number } {
  if (id === FIRST_ID || id === LAST_FULL_ID) return { hue: 'cyan', mix: s.pair, focus: 1 - (1 - DIM) * s.pairBack }
  if (id === CURRENT_ID) return { hue: 'amber', mix: s.current, focus: 1 - (1 - DIM) * (s.pair - s.current) }
  return { hue: 'slate', mix: 0, focus: 1 - (1 - DIM) * s.pair }
}

/** Gridlines at each whole ppm per year above zero. Geometry. */
const GRID = Array.from({ length: DOMAIN[1] }, (_, i) => ({ v: i + 1, y: sy(i + 1) }))

const BASE_INK = ink('slate', 1)
const columns = computed(() =>
  COLUMNS.map((c, i) => {
    const x0 = sx(c.from + GAP / 2)
    const x1 = sx(c.to - GAP / 2)
    const h = (Y_RANGE[0] - sy(c.ppm)) * grow[i]
    const { hue, mix, focus } = look(c.id)
    const fill = mix <= 0 ? BASE_INK : `color-mix(in oklab, ${ink(hue, 3)} ${(mix * 100).toFixed(1)}%, ${BASE_INK})`
    return {
      ...c,
      x: x0,
      cx: (x0 + x1) / 2,
      width: x1 - x0,
      y: Y_RANGE[0] - h,
      height: h,
      fill,
      text: mix > 0 ? fill : undefined,
      focus,
      labelIn: Math.max(0, Math.min(1, (grow[i] - 0.7) / 0.3)),
    }
  }),
)

const first = computed(() => columns.value.find((c) => c.id === FIRST_ID)!)
const lastFull = computed(() => columns.value.find((c) => c.id === LAST_FULL_ID)!)
const LEVEL_Y = sy(FIRST_PPM)
const LEVEL_INK = ink('cyan', 2)

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    COLUMNS.forEach((_, i) => {
      tl.to(grow, { [i]: 1, duration: DUR.grow, ease: DRAW }, DUR.opacity + easedStagger(i, COLUMNS.length, DUR.scale))
    })
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { pair: 1, duration: DUR.color, ease: SETTLE })
    tl.to(s, { level: 1, duration: DUR.scale, ease: DRAW }, `-=${DUR.opacity}`)
    tl.to(s, { chip: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`)
    beat(1)
    const at = tl.duration()
    tl.to(s, { current: 1, duration: DUR.color, ease: SETTLE }, at)
    tl.to(s, { pairBack: 1, chip: 0, duration: DUR.color, ease: SETTLE }, at)
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <line v-for="g in GRID" :key="`r${g.v}`" class="grid" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y1="g.y" :y2="g.y" />
        <text v-for="g in GRID" :key="g.v" class="od-stage-label" :x="GRID_LABEL_X" :y="g.y + 10" text-anchor="end">{{ g.v }} ppm/yr</text>
        <g v-for="c in columns" :key="c.id" :style="{ opacity: String(c.focus) }">
          <rect :x="c.x" :y="c.y" :width="c.width" :height="c.height" rx="4" :fill="c.fill" :filter="c.text ? GLOW : undefined" />
          <text
            class="od-stage-label value"
            :class="{ 'is-end': !!c.text }"
            :x="c.cx"
            :y="c.y - 18"
            text-anchor="middle"
            :style="{ opacity: String(c.labelIn), fill: c.text }"
          >
            {{ c.value }}
          </text>
          <text class="od-stage-label" :x="c.cx" :y="TICK_Y" text-anchor="middle">{{ c.label }}</text>
          <text v-if="c.note" class="od-stage-label note" :x="c.cx" :y="TICK_Y + 34" text-anchor="middle">{{ c.note }}</text>
        </g>
        <line
          class="level"
          :x1="first.x"
          :x2="first.x + (X_RANGE[1] - first.x) * s.level"
          :y1="LEVEL_Y"
          :y2="LEVEL_Y"
          :stroke="LEVEL_INK"
          :style="{ opacity: String(s.level > 0 ? 1 - 0.5 * s.pairBack : 0) }"
        />
      </g>
    </template>

    <template #overlay>
      <StoryLayer class="vt-baseline">
        <InkRule :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-baseline" />
      </StoryLayer>
      <h2 class="od-story-head">The climb is steeper now than in the {{ FIRST_DECADE }}.</h2>
      <InkChip :x="lastFull.x - 16" :y="lastFull.y - 64" anchor="right" hue="cyan" :text="`${SPEEDUP_LABEL} the ${FIRST_DECADE} rate`" :progress="s.chip" />
      <StoryLink href="https://gml.noaa.gov/ccgg/trends/gr.html" label="NOAA GML, Mauna Loa annual growth rate" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :hue="clicks >= 2 ? 'amber' : 'cyan'" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.grid {
  stroke: var(--od-border-subtle);
  stroke-width: 1.5;
}
.value {
  font-size: 34px;
}
.note {
  font-size: 22px;
}
.level {
  stroke-width: 2.5;
  stroke-dasharray: 10 10;
}
</style>
