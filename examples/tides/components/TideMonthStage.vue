<script setup lang="ts">
/**
 * Slide 4: spring and neap tides. Three weeks of Boston highs and lows drawn
 * as one zigzag, with the moon phases marked under it. The swing is widest
 * at full and new moon and narrowest at the last quarter.
 */
import { reactive, ref } from 'vue'
import {
  DUR,
  SETTLE,
  ink,
  useStage,
  xScale,
  yScale,
  type LineHandle,
  type RuleHandle,
} from 'slidev-addon-decks/story'
import {
  EXTREMES,
  NEAP,
  NEAP_LABEL,
  PHASES,
  SPRING,
  SPRING_LABEL,
  WINDOW_DAYS,
  WINDOW_LABEL,
} from '../data/boston-month'
import { SUN_TO_MOON_LABEL } from '../data/moon-clock'

const X_DOMAIN = WINDOW_DAYS
const Y_DOMAIN: [number, number] = [-0.6, 4.0]
const X_RANGE: [number, number] = [160, 1760]
const Y_RANGE: [number, number] = [620, 230]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const SERIES = EXTREMES.map(({ x, y }) => ({ x, y }))
const MARKS = PHASES.map((p) => ({ ...p, px: sx(p.x) }))
/** Both chips ride above the zigzag's highest peak. Spring sits near the
 * right edge, so it hangs leftward from its swing. */
const CHIP_Y = sy(3.75)
const SPRING_CHIP = { x: sx(SPRING.x) + 30, y: CHIP_Y }
const NEAP_CHIP = { x: sx(NEAP.x) - 30, y: CHIP_Y }

const COPY = [
  {
    lead: 'Every Boston high and low for three weeks.',
    body: `NOAA predictions, ${WINDOW_LABEL}. The zigzag widens and narrows on a two week rhythm.`,
  },
  {
    lead: 'Sun and Moon in line: spring tides.',
    body: `At full and new moon their pulls add, and a single swing reaches ${SPRING_LABEL}.`,
  },
  {
    lead: 'Sun and Moon at right angles: neap tides.',
    body: `The Sun's tidal pull is ${SUN_TO_MOON_LABEL} of the Moon's and now works against it. Swings shrink to ${NEAP_LABEL}.`,
  },
]

const line = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)
/** syzygy: full and new moon markers lit. quarter: last quarter lit. */
const s = reactive({ syzygy: 0, quarter: 0, spring: 0, neap: 0 })

const markInk = (id: string) => {
  const lit = id === 'last' ? s.quarter : s.syzygy
  return lit > 0.5 ? ink('amber', 3) : ink('slate', 2)
}

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => rule.value?.addDraw(tl, 0),
  beats: (tl, beat) => {
    beat(0)
    line.value?.addDraw(tl, undefined, { duration: DUR.trace })
    beat(1)
    tl.to(s, { syzygy: 1, duration: DUR.color, ease: SETTLE })
    tl.to(s, { spring: 1, duration: DUR.card, ease: SETTLE })
    beat(2)
    tl.to(s, { spring: 0, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { quarter: 1, duration: DUR.color, ease: SETTLE })
    tl.to(s, { neap: 1, duration: DUR.card, ease: SETTLE })
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <g v-for="m in MARKS" :key="m.id" :style="{ color: markInk(m.id) }">
          <line
            :x1="m.px"
            :x2="m.px"
            :y1="Y_RANGE[0]"
            :y2="Y_RANGE[1] - 20"
            stroke="currentColor"
            stroke-width="2"
            stroke-dasharray="6 10"
          />
          <text class="od-stage-label phase" :x="m.px" :y="Y_RANGE[0] + 50" text-anchor="middle">
            {{ m.label }}
          </text>
        </g>
        <InkLine
          ref="line"
          :series="SERIES"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          :width="4"
          seed="boston-january-extremes"
        />
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="tide-month-base" />
      </StoryLayer>
      <h2 class="od-story-head">The Sun makes the tide grow and shrink.</h2>
      <InkChip :x="SPRING_CHIP.x" :y="SPRING_CHIP.y" :text="`Spring: ${SPRING_LABEL}`" hue="amber" anchor="right" :progress="s.spring" />
      <InkChip :x="NEAP_CHIP.x" :y="NEAP_CHIP.y" :text="`Neap: ${NEAP_LABEL}`" hue="amber" :progress="s.neap" />
      <StoryLink href="https://aa.usno.navy.mil/data/MoonPhases" label="NOAA CO-OPS 8443970 · USNO moon phases" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" hue="amber" />
    </template>
  </StoryStage>
</template>

<style scoped>
.phase {
  fill: currentColor;
}
</style>
