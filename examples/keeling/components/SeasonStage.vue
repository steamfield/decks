<script setup lang="ts">
/**
 * Slide 3: five years of the same record, close up. The sawtooth draws, then
 * each year's high and low month are marked.
 */
import { reactive, ref } from 'vue'
import { DUR, ink, useStage, xScale, yScale, type LineHandle, type RuleHandle } from 'slidev-addon-decks/story'
import { FROM, HIGHS, HIGH_MONTHS, LOWS, LOW_MONTHS, SERIES, SWING_LABEL, TO, Y_DOMAIN } from '../data/seasons'

const X_DOMAIN: [number, number] = [FROM, TO + 1]
const X_RANGE: [number, number] = [260, 1660]
const Y_RANGE: [number, number] = [620, 230]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const TICKS = Array.from({ length: TO - FROM + 1 }, (_, i) => ({ x: sx(FROM + i + 0.5), text: String(FROM + i) }))
const GRID = [Y_DOMAIN[0] + 1, Y_DOMAIN[1] - 1].map((v) => ({ y: sy(v), text: `${v} ppm` }))
const HIGH_DOTS = HIGHS.map((r) => ({ x: sx(r.x), y: sy(r.y) }))
const LOW_DOTS = LOWS.map((r) => ({ x: sx(r.x), y: sy(r.y) }))

const COPY = [
  {
    lead: 'Up close, the line is a sawtooth.',
    body: `The same monthly means, ${FROM} through ${TO}.`,
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

const line = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)
const s = reactive({ dots: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** The line draws once on landing. Seeking skips it and InkLine rests fully drawn. */
  enter: (tl) => {
    rule.value?.addDraw(tl, 0)
    line.value?.addDraw(tl)
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { dots: 1, duration: DUR.card })
    beat(1)
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <text v-for="g in GRID" :key="g.text" class="od-stage-label" :x="X_RANGE[0] - 24" :y="g.y + 8" text-anchor="end">
          {{ g.text }}
        </text>
        <InkLine
          ref="line"
          :series="SERIES"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          seed="keeling-seasons"
        />
        <circle v-for="(d, i) in HIGH_DOTS" :key="`h${i}`" :cx="d.x" :cy="d.y" r="11" :fill="ink('amber', 4)" :style="{ opacity: String(s.dots) }" />
        <circle v-for="(d, i) in LOW_DOTS" :key="`l${i}`" :cx="d.x" :cy="d.y" r="11" :fill="ink('emerald', 4)" :style="{ opacity: String(s.dots) }" />
        <text v-for="t in TICKS" :key="t.text" class="od-stage-label" :x="t.x" :y="Y_RANGE[0] + 52" text-anchor="middle">
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-seasons-base" />
      </StoryLayer>
      <h2 class="od-story-head">The curve breathes once a year.</h2>
      <StoryLink href="https://gml.noaa.gov/education/carbon_toolkit/basics.html" label="NOAA GML, carbon cycle basics" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
