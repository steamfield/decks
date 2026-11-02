<script setup lang="ts">
/**
 * Slide 2: two days of Boston water level. The line draws, the highs are
 * marked with their average spacing, then the card ties the rhythm to the Moon.
 */
import { reactive, ref } from 'vue'
import {
  DUR,
  ink,
  useStage,
  xScale,
  yScale,
  type LineHandle,
  type RuleHandle,
} from 'slidev-addon-decks/story'
import { DAYS_LABEL, HIGHS, HOURLY } from '../data/boston-days'
import { HIGH_GAP_LABEL, WINDOW_LABEL } from '../data/boston-month'
import { LUNAR_DAY_LABEL } from '../data/moon-clock'

const X_DOMAIN: [number, number] = [0, 47]
const Y_DOMAIN: [number, number] = [0, 3.6]
const X_RANGE: [number, number] = [220, 1700]
/** Bottom first. The card sits below the baseline, so the chart stays high. */
const Y_RANGE: [number, number] = [620, 230]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const DOTS = HIGHS.map((h) => ({ x: sx(h.x), y: sy(h.y) }))
/** The chip sits above the gap between the first two highs. */
const CHIP_X = (DOTS[0].x + DOTS[1].x) / 2 - 90
const CHIP_Y = sy(3.45)
const TICKS = [
  { x: sx(0), text: 'Jun 11, 00:00' },
  { x: sx(24), text: 'Jun 12, 00:00' },
  { x: sx(47), text: '23:00' },
]

const COPY = [
  {
    lead: 'Water level, hour by hour, for two days.',
    body: `NOAA prediction for Boston Harbor, ${DAYS_LABEL}, in meters above mean lower low water.`,
  },
  {
    lead: `High tides arrive ${HIGH_GAP_LABEL} apart.`,
    body: `That is the average gap between every Boston high tide from ${WINDOW_LABEL}.`,
  },
  {
    lead: 'The schedule follows the Moon.',
    body: `Two tides take ${LUNAR_DAY_LABEL}, the time Earth needs to turn back under the Moon.`,
  },
]

const line = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)
const s = reactive({ dots: 0, chip: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => rule.value?.addDraw(tl, 0),
  beats: (tl, beat) => {
    beat(0)
    line.value?.addDraw(tl)
    beat(1)
    tl.to(s, { dots: 1, duration: DUR.opacity })
    tl.to(s, { chip: 1, duration: DUR.card })
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <InkLine
          ref="line"
          :series="HOURLY"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          seed="boston-two-days"
        />
        <circle
          v-for="(d, i) in DOTS"
          :key="i"
          :cx="d.x"
          :cy="d.y"
          r="11"
          :fill="ink('cyan', 4)"
          :style="{ opacity: String(s.dots) }"
        />
        <text
          v-for="t in TICKS"
          :key="t.text"
          class="od-stage-label"
          :x="t.x"
          :y="Y_RANGE[0] + 52"
          text-anchor="middle"
        >
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="tide-day-base" />
      </StoryLayer>
      <h2 class="od-story-head">Boston gets two high tides a day.</h2>
      <InkChip :x="CHIP_X" :y="CHIP_Y" :text="HIGH_GAP_LABEL" :progress="s.chip" />
      <StoryLink href="https://tidesandcurrents.noaa.gov/stationhome.html?id=8443970" label="NOAA CO-OPS, station 8443970" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
