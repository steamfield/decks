<script setup lang="ts">
/**
 * Slide 5: when the rise since 1959 was half done.
 *
 * Entry traces the annual means and, as the line lands, a bracket rises at
 * its right end spanning the whole rise. Beat 1 halves that bracket: a tick
 * at its midpoint, a dashed level that runs left from it until it meets the
 * curve, and a drop to the axis at the first year above it, with a ping and a
 * chip on that year. Beat 2 splits the record there: the first half steps
 * back to grey, the second redraws in amber, and the two spans are measured
 * along the baseline. Beat 3 brings the whole line back and pops a dot on
 * every annual mean in date order, each one higher than the last.
 */
import { computed, reactive, ref } from 'vue'
import {
  DRAW,
  DUR,
  FILTER_IDS,
  SETTLE,
  TRACE,
  clamp01,
  filterUrl,
  ink,
  useStage,
  xScale,
  yScale,
  type LineHandle,
} from 'slidev-addon-decks/story'
import {
  AFTER,
  CROSS_X,
  FIRST,
  HALF,
  HALF_LABEL,
  HALF_POINT,
  HALF_YEAR,
  LAST,
  RISE_LABEL,
  SERIES,
  Y_DOMAIN,
  YEARS_AFTER,
  YEARS_BEFORE,
} from '../data/halfway'
import { TICK_Y, X_RANGE, Y_RANGE } from '../data/frame'

const X_DOMAIN: [number, number] = [FIRST.x, LAST.x]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const TICKS = [FIRST.x, HALF_YEAR, LAST.x].map((y) => ({ x: sx(y), text: String(y) }))

/** The rise bracket, just right of the line's last point. */
const BRACKET_X = X_RANGE[1] + 36
const BRACKET = { x: BRACKET_X, y0: sy(FIRST.y), y1: sy(LAST.y) }
const HALF_Y = sy(HALF)
const CROSS = sx(CROSS_X)
const POINT = { x: sx(HALF_POINT.x), y: sy(HALF_POINT.y) }

/** The two spans, measured just above the baseline. */
const SPAN_Y = Y_RANGE[0] - 22
const SPANS = [
  { x0: X_RANGE[0], x1: POINT.x, text: `${YEARS_BEFORE} years` },
  { x0: POINT.x, x1: X_RANGE[1], text: `${YEARS_AFTER} years` },
]

const DOTS = SERIES.map((p) => ({ x: sx(p.x), y: sy(p.y) }))
const GLOW = filterUrl(FILTER_IDS.glow)
const AMBER = ink('amber', 3)
const DOT_INK = ink('cyan', 4)

const COPY = [
  {
    lead: `Carbon dioxide rose ${RISE_LABEL} since ${FIRST.x}.`,
    body: `Yearly averages, from ${FIRST.y} ppm in ${FIRST.x} to ${LAST.y} in ${LAST.x}.`,
  },
  {
    lead: `The halfway mark fell in ${HALF_YEAR}.`,
    body: `Halfway between ${FIRST.y} and ${LAST.y} is ${HALF_LABEL} ppm.`,
  },
  {
    lead: `The first half took ${YEARS_BEFORE} years.`,
    body: `The second half took ${YEARS_AFTER}, from ${HALF_YEAR} to ${LAST.x}.`,
  },
  {
    lead: 'Every year beat the one before.',
    body: `No annual average since ${FIRST.x} has fallen below the previous year's.`,
  },
]

const line = ref<LineHandle | null>(null)
const after = ref<LineHandle | null>(null)
const s = reactive({
  bracket: 0,
  rise: 0,
  level: 0,
  drop: 0,
  half: 0,
  ping: 0,
  ghost: 0,
  spans: 0,
  afterFade: 1,
  dots: 0,
})

const bracketTop = computed(() => BRACKET.y0 + (BRACKET.y1 - BRACKET.y0) * s.bracket)
const levelX = computed(() => BRACKET_X + (CROSS - BRACKET_X) * s.level)
const dropY = computed(() => POINT.y + (Y_RANGE[0] - POINT.y) * s.drop)
const dots = computed(() => DOTS.map((d, i) => ({ ...d, r: 6 * clamp01(s.dots * DOTS.length * 1.15 - i) })))

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    line.value?.addDraw(tl, DUR.opacity, { duration: DUR.trace, ease: TRACE })
    const land = DUR.opacity + DUR.trace - DUR.grow
    tl.to(s, { bracket: 1, duration: DUR.grow, ease: DRAW }, land)
    tl.to(s, { rise: 1, duration: DUR.card, ease: SETTLE }, land + DUR.opacity)
  },
  beats: (tl, beat) => {
    beat(0)
    let at = tl.duration()
    tl.to(s, { rise: 0, duration: DUR.opacity, ease: SETTLE }, at)
    tl.to(s, { level: 1, duration: DUR.scale, ease: DRAW }, at)
    tl.to(s, { drop: 1, duration: DUR.grow, ease: DRAW }, at + DUR.scale - DUR.opacity)
    tl.to(s, { half: 1, duration: DUR.card, ease: SETTLE }, at + DUR.scale - DUR.opacity)
    tl.to(s, { ping: 1, duration: DUR.morph, ease: 'none' }, at + DUR.scale - DUR.opacity)
    beat(1)
    at = tl.duration()
    tl.to(s, { ghost: 1, duration: DUR.color, ease: SETTLE }, at)
    after.value?.addDraw(tl, at + DUR.opacity, { duration: DUR.scale, ease: DRAW })
    tl.to(s, { spans: 1, duration: DUR.card, ease: SETTLE }, at + DUR.scale - DUR.card)
    beat(2)
    at = tl.duration()
    tl.to(s, { ghost: 0, afterFade: 0, spans: 0.35, duration: DUR.color, ease: SETTLE }, at)
    tl.to(s, { dots: 1, duration: DUR.trace, ease: 'none' }, at + DUR.opacity)
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <text v-for="t in TICKS" :key="t.text" class="od-stage-label" :class="{ 'is-end': t.text === String(HALF_YEAR) && s.half > 0.5 }" :x="t.x" :y="TICK_Y" text-anchor="middle">
          {{ t.text }}
        </text>
        <!-- The rise bracket and its midpoint. -->
        <g :stroke="AMBER" class="mark">
          <line :x1="BRACKET_X" :x2="BRACKET_X" :y1="BRACKET.y0" :y2="bracketTop" :style="{ opacity: String(s.bracket > 0 ? 1 : 0) }" />
          <line :x1="BRACKET_X - 10" :x2="BRACKET_X + 10" :y1="BRACKET.y0" :y2="BRACKET.y0" :style="{ opacity: String(s.bracket) }" />
          <line :x1="BRACKET_X - 10" :x2="BRACKET_X + 10" :y1="BRACKET.y1" :y2="BRACKET.y1" :style="{ opacity: String(s.bracket >= 1 ? 1 : 0) }" />
          <line :x1="BRACKET_X - 16" :x2="BRACKET_X + 16" :y1="HALF_Y" :y2="HALF_Y" :style="{ opacity: String(s.level > 0 ? 1 : 0) }" />
          <line class="dash" :x1="BRACKET_X" :x2="levelX" :y1="HALF_Y" :y2="HALF_Y" :style="{ opacity: String(s.level > 0 ? 1 - 0.5 * s.dots : 0) }" />
          <line class="dash" :x1="POINT.x" :x2="POINT.x" :y1="POINT.y" :y2="dropY" :style="{ opacity: String(s.drop > 0 ? 1 - 0.5 * s.dots : 0) }" />
        </g>
        <!-- The two spans along the baseline. -->
        <g v-for="(sp, i) in SPANS" :key="sp.text" :style="{ opacity: String(s.spans) }">
          <line class="span" :class="{ 'is-after': i === 1 }" :x1="sp.x0 + 6" :x2="sp.x1 - 6" :y1="SPAN_Y" :y2="SPAN_Y" />
          <text class="od-stage-label span-label" :class="{ 'is-end': i === 1 }" :x="(sp.x0 + sp.x1) / 2" :y="SPAN_Y - 18" text-anchor="middle">{{ sp.text }}</text>
        </g>
      </g>
    </template>

    <template #overlay>
      <StoryLayer class="vt-baseline">
        <InkRule :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-baseline" />
      </StoryLayer>
      <!-- Not keyed on playCount: both lines are driven through refs. -->
      <StoryLayer>
        <InkLine ref="line" :series="SERIES" :x-domain="X_DOMAIN" :y-domain="Y_DOMAIN" :x-range="X_RANGE" :y-range="Y_RANGE" hue="cyan" :step="3" :ghost="s.ghost" head seed="keeling-annual" />
        <g :style="{ opacity: String(s.afterFade) }">
          <InkLine ref="after" :series="AFTER" :x-domain="X_DOMAIN" :y-domain="Y_DOMAIN" :x-range="X_RANGE" :y-range="Y_RANGE" hue="amber" :step="3" head seed="keeling-annual-after" />
        </g>
        <g :filter="GLOW">
          <circle v-for="(d, i) in dots" :key="i" :cx="d.x" :cy="d.y" :r="d.r" :fill="DOT_INK" />
          <circle :cx="POINT.x" :cy="POINT.y" :r="11 * s.half" :fill="AMBER" />
        </g>
        <InkPing :x="POINT.x" :y="POINT.y" :r="11" hue="amber" :step="3" :progress="s.ping" />
      </StoryLayer>
      <h2 class="od-story-head">Half the rise came in the last {{ YEARS_AFTER }} years.</h2>
      <InkChip :x="BRACKET_X" :y="(BRACKET.y0 + BRACKET.y1) / 2" hue="amber" :text="`+${RISE_LABEL}`" :progress="s.rise" />
      <InkChip :x="POINT.x - 24" :y="POINT.y - 52" hue="amber" anchor="right" :text="`Halfway: ${HALF_YEAR}`" :progress="s.half * (1 - 0.5 * s.dots)" />
      <StoryLink href="https://gml.noaa.gov/ccgg/trends/data.html" label="NOAA GML, Mauna Loa annual mean CO2" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.mark line {
  stroke-width: 3;
  stroke-linecap: round;
}
.mark .dash {
  stroke-dasharray: 10 10;
}
.span {
  stroke: var(--od-text-faint);
  stroke-width: 3;
  stroke-linecap: round;
}
.span.is-after {
  stroke: var(--od-amber);
}
.span-label {
  font-size: 26px;
}
</style>
