<script setup lang="ts">
/**
 * Slide 4: the 12 build tools of the 2025 edition (`data/build-tools.ts`). Bars grow sorted by usage
 * (webpack first, Vite second), then re-sort by retention in place: Vite
 * rises to the top and webpack falls to the bottom. On the last beat a ping
 * marks webpack's bar and a dashed span draws the gap from its 26% to the
 * next-lowest tool's value.
 */
import { reactive, ref } from 'vue'
import { DUR, ink, useStage, type BarsHandle } from 'slidev-addon-decks/story'
import {
  BY_RETENTION,
  BY_USAGE,
  DOMAIN,
  EDITION,
  GAP_TO_NEXT,
  NEXT_LOWEST,
  OTHERS_COUNT,
  OTHERS_MAX,
  OTHERS_MIN,
  TOOL_COUNT,
  VITE,
  WEBPACK,
} from '../data/build-tools'

const X_RANGE: [number, number] = [820, 1560]
const Y_BAND: [number, number] = [230, 720]
const THICKNESS = 22

/** Where webpack's bar sits once the rows are sorted by retention: last row. */
const PITCH = (Y_BAND[1] - Y_BAND[0]) / TOOL_COUNT
const WEBPACK_ROW_Y = Y_BAND[0] + PITCH * (BY_RETENTION.findIndex((r) => r.id === 'webpack') + 0.5)
const xOf = (v: number) => X_RANGE[0] + ((v - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * (X_RANGE[1] - X_RANGE[0])
const WEBPACK_LEN = xOf(WEBPACK.retention) - X_RANGE[0]
/** The gap the last card names: webpack's bar end to the next-lowest tool's value, on webpack's row. */
const GAP = { x1: xOf(WEBPACK.retention) + 96, x2: xOf(OTHERS_MIN), y: WEBPACK_ROW_Y }

const COPY = [
  {
    lead: `By ${EDITION} usage, webpack and Vite lead.`,
    body: `Share of respondents who had used each of the ${TOOL_COUNT} build tools the survey asked about.`,
  },
  {
    lead: 'By retention, Vite ranks first and webpack last.',
    body: `Share of each tool's users who would use it again: ${VITE.retention}% for Vite, ${WEBPACK.retention}% for webpack.`,
  },
  {
    lead: `The other ${OTHERS_COUNT} sit between ${OTHERS_MIN}% and ${OTHERS_MAX}%.`,
    body: `webpack trails the next-lowest tool, ${NEXT_LOWEST}, by ${GAP_TO_NEXT} points.`,
  },
]

const bars = ref<BarsHandle | null>(null)
const s = reactive({ ping: 0, gap: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** The bars grow once on landing; seeking skips it and they rest grown. */
  enter: (tl) => {
    bars.value?.addGrow(tl, 0)
  },
  beats: (tl, beat) => {
    beat(0)
    bars.value?.addReorder(tl, BY_RETENTION, DOMAIN, 'beat0')
    beat(1)
    tl.to(s, { gap: 1, duration: DUR.grow }, 'beat1')
    tl.to(s, { ping: 1, duration: DUR.scale }, '<')
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <InkBars
        ref="bars"
        :rows="BY_USAGE"
        :domain="DOMAIN"
        :x-range="X_RANGE"
        :y-band="Y_BAND"
        :thickness="THICKNESS"
        :label-width="300"
        seed="sojs-build-tools"
      />
      <g :style="{ opacity: String(s.gap) }">
        <line :x1="GAP.x1" :x2="GAP.x1 + (GAP.x2 - GAP.x1) * s.gap" :y1="GAP.y" :y2="GAP.y" :stroke="ink('rose', 2)" stroke-width="3" stroke-dasharray="8 8" />
        <line :x1="GAP.x2" :x2="GAP.x2" :y1="GAP.y - 16" :y2="GAP.y + 16" :stroke="ink('rose', 2)" stroke-width="3" />
      </g>
      <InkPing
        :x="X_RANGE[0]"
        :y="WEBPACK_ROW_Y - THICKNESS"
        :width="WEBPACK_LEN"
        :height="THICKNESS * 2"
        :rx="8"
        hue="rose"
        :progress="s.ping"
      />
    </template>

    <template #overlay>
      <h2 class="od-story-head">
        Of {{ TOOL_COUNT }} build tools in {{ EDITION }}, webpack ranked first in use and last in retention.
      </h2>
      <StoryLink href="https://tryopendata.ai/datasets/state-of-survey/state-of-js" :label="`State of JavaScript ${EDITION}, Devographics, CC-BY-4.0`" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" :hue="clicks >= 2 ? 'rose' : 'cyan'" />
    </template>
  </StoryStage>
</template>
