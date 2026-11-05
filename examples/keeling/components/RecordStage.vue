<script setup lang="ts">
/**
 * Slide 2: the whole Mauna Loa monthly record.
 *
 * The line arrives already drawn: the cover traced it at this exact geometry
 * on a `vt-keeling-line` layer, so the view transition holds it still while
 * the axes and the card arrive around it. Only the baseline draws on entry.
 *
 * Beat 1 marks the first month: a dot, a one-shot ping, a chip. Beat 2 leads
 * the eye from there to the peak: the first chip steps back, a brighter copy
 * of the line sweeps the whole record with a glowing head, and the peak's dot,
 * ping and chip land as the sweep arrives. Slide 3 opens on this end state.
 */
import { reactive, ref } from 'vue'
import {
  DUR,
  FILTER_IDS,
  SETTLE,
  TRACE,
  filterUrl,
  ink,
  useStage,
  xScale,
  yScale,
  type LineHandle,
  type RuleHandle,
} from 'slidev-addon-decks/story'
import { FIRST, FIRST_LABEL, GRID_PPM, NOAA_FROM, PEAK, PEAK_LABEL, SERIES, TICK_YEARS, X_DOMAIN, Y_DOMAIN } from '../data/record'
import { GRID_LABEL_X, TICK_Y, X_RANGE, Y_RANGE } from '../data/frame'

const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const TICKS = TICK_YEARS.map((y) => ({ x: sx(y), text: String(y) }))
const GRID = GRID_PPM.map((v) => ({ y: sy(v), text: `${v} ppm` }))
const START = { x: sx(FIRST.x), y: sy(FIRST.y) }
const TOP = { x: sx(PEAK.x), y: sy(PEAK.y) }

/** Opacity of a mark that is context rather than focus. */
const DIM = 0.45
const DOT_R = 9
const GLOW = filterUrl(FILTER_IDS.glow)
const DOT_INK = ink('cyan', 4)

const COPY = [
  {
    lead: 'Carbon dioxide above Mauna Loa, every month.',
    body: `Monthly means in parts per million since ${FIRST_LABEL}. Scripps data to April ${NOAA_FROM}, NOAA after.`,
  },
  {
    lead: `It started at ${FIRST.y} ppm.`,
    body: `That is ${FIRST_LABEL}, the first month of C. David Keeling's record.`,
  },
  {
    lead: `It reached ${PEAK.y} ppm in ${PEAK_LABEL}.`,
    body: 'The highest monthly mean in the record so far.',
  },
]

const rule = ref<RuleHandle | null>(null)
const sweep = ref<LineHandle | null>(null)
const s = reactive({ first: 0, firstPing: 0, firstDim: 1, peak: 0, peakPing: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    rule.value?.addDraw(tl, 0)
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { first: 1, duration: DUR.card, ease: SETTLE })
    tl.to(s, { firstPing: 1, duration: DUR.morph, ease: 'none' }, '<')
    beat(1)
    const at = tl.duration()
    tl.to(s, { firstDim: DIM, duration: DUR.color, ease: SETTLE }, at)
    sweep.value?.addDraw(tl, at, { duration: DUR.trace, ease: TRACE })
    const land = at + DUR.trace - DUR.card
    tl.to(s, { peak: 1, duration: DUR.card, ease: SETTLE }, land)
    tl.to(s, { peakPing: 1, duration: DUR.morph, ease: 'none' }, land)
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <line v-for="g in GRID" :key="`r${g.text}`" class="grid" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y1="g.y" :y2="g.y" />
        <text v-for="g in GRID" :key="g.text" class="od-stage-label" :x="GRID_LABEL_X" :y="g.y + 10" text-anchor="end">
          {{ g.text }}
        </text>
        <text v-for="t in TICKS" :key="t.text" class="od-stage-label" :x="t.x" :y="TICK_Y" text-anchor="middle">
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer class="vt-baseline">
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-baseline" />
      </StoryLayer>
      <!-- Not keyed on playCount: the sweep is driven through a ref. -->
      <StoryLayer class="vt-keeling-line">
        <InkLine :series="SERIES" :x-domain="X_DOMAIN" :y-domain="Y_DOMAIN" :x-range="X_RANGE" :y-range="Y_RANGE" hue="cyan" :step="3" seed="keeling-record" />
        <InkLine ref="sweep" :series="SERIES" :x-domain="X_DOMAIN" :y-domain="Y_DOMAIN" :x-range="X_RANGE" :y-range="Y_RANGE" hue="cyan" :step="4" head seed="keeling-record" />
        <g :filter="GLOW">
          <circle :cx="START.x" :cy="START.y" :r="DOT_R * s.first" :fill="DOT_INK" :style="{ opacity: String(s.firstDim) }" />
          <circle :cx="TOP.x" :cy="TOP.y" :r="DOT_R * s.peak" :fill="DOT_INK" />
        </g>
        <InkPing :x="START.x" :y="START.y" :r="DOT_R" hue="cyan" :step="4" :progress="s.firstPing" />
        <InkPing :x="TOP.x" :y="TOP.y" :r="DOT_R" hue="cyan" :step="4" :progress="s.peakPing" />
      </StoryLayer>
      <h2 class="od-story-head">Carbon dioxide in the air keeps climbing.</h2>
      <InkChip :x="START.x + 8" :y="START.y - 52" :text="`${FIRST.y} ppm`" :progress="s.first * s.firstDim" />
      <InkChip :x="TOP.x - 18" :y="TOP.y - 52" anchor="right" :text="`${PEAK.y} ppm`" :progress="s.peak" />
      <StoryLink href="https://gml.noaa.gov/ccgg/trends/data.html" label="NOAA GML, Mauna Loa monthly mean CO2" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.grid {
  stroke: var(--od-border-subtle);
  stroke-width: 1.5;
}
</style>
