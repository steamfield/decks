<script setup lang="ts">
/**
 * Slide 5: annual means draw, then a level rule marks the halfway point of
 * the whole rise and a chip names the year the curve crossed it.
 */
import { reactive, ref } from 'vue'
import { DUR, ink, useStage, xScale, yScale, type LineHandle, type RuleHandle } from 'slidev-addon-decks/story'
import { FIRST, HALF, HALF_YEAR, LAST, RISE_LABEL, SERIES, YEARS_AFTER, YEARS_BEFORE } from '../data/halfway'

const X_DOMAIN: [number, number] = [FIRST.x, LAST.x]
const Y_DOMAIN: [number, number] = [300, 440]
const X_RANGE: [number, number] = [260, 1660]
const Y_RANGE: [number, number] = [620, 230]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const TICKS = [FIRST.x, HALF_YEAR, LAST.x].map((y) => ({ x: sx(y), text: String(y) }))
const HALF_Y = sy(HALF)
const HALF_X = sx(HALF_YEAR)

const COPY = [
  {
    lead: `Carbon dioxide rose ${RISE_LABEL} since ${FIRST.x}.`,
    body: `Yearly averages, from ${FIRST.y} ppm in ${FIRST.x} to ${LAST.y} in ${LAST.x}.`,
  },
  {
    lead: `The halfway mark fell in ${HALF_YEAR}.`,
    body: `The first half of the rise took ${YEARS_BEFORE} years. The second half took ${YEARS_AFTER}.`,
  },
  {
    lead: 'Every year beat the one before.',
    body: `No annual average since ${FIRST.x} has fallen below the previous year's.`,
  },
]

const line = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)
const s = reactive({ half: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** The line draws once on landing. Seeking skips it and InkLine rests fully drawn. */
  enter: (tl) => {
    rule.value?.addDraw(tl, 0)
    line.value?.addDraw(tl)
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { half: 1, duration: DUR.card })
    beat(1)
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <g :style="{ opacity: String(s.half) }">
          <line :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y1="HALF_Y" :y2="HALF_Y" :stroke="ink('amber', 2)" stroke-width="3" stroke-dasharray="10 10" />
          <line :x1="HALF_X" :x2="HALF_X" :y1="HALF_Y" :y2="Y_RANGE[0]" :stroke="ink('amber', 2)" stroke-width="3" stroke-dasharray="10 10" />
          <circle :cx="HALF_X" :cy="HALF_Y" r="12" :fill="ink('amber', 4)" />
        </g>
        <InkLine
          ref="line"
          :series="SERIES"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          seed="keeling-annual"
        />
        <text v-for="t in TICKS" :key="t.text" class="od-stage-label" :x="t.x" :y="Y_RANGE[0] + 52" text-anchor="middle">
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-annual-base" />
      </StoryLayer>
      <h2 class="od-story-head">Half the rise came in the last {{ YEARS_AFTER }} years.</h2>
      <InkChip :x="HALF_X" :y="HALF_Y - 48" hue="amber" anchor="right" :text="`Halfway: ${HALF_YEAR}`" :progress="s.half" />
      <StoryLink href="https://gml.noaa.gov/ccgg/trends/data.html" label="NOAA GML, Mauna Loa annual mean CO2" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
