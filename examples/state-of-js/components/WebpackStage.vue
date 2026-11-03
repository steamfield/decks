<script setup lang="ts">
/**
 * Slide 2: webpack usage draws on landing, webpack retention draws down on
 * the next beat (a ping marks its 2025 point), then Vite usage draws up.
 *
 * Lines are split where the export has no edition (webpack 2018 and 2019), so
 * nothing bridges a year the survey did not report. The "26%" chip carries
 * `vt-sojs-keep`: on the cut to Slide 3 it travels into that slide's big
 * number (deck styles/index.css holds the name).
 */
import { reactive, ref } from 'vue'
import { DUR, ink, stackEndLabels, useStage, xScale, yScale, type LineHandle, type RuleHandle } from 'slidev-addon-decks/story'
import {
  LAST,
  VITE_FIRST,
  VITE_RETENTION_MAX,
  VITE_RETENTION_MIN,
  VITE_USAGE,
  VITE_USAGE_2025,
  WEBPACK_ESTIMATED,
  WEBPACK_FROM,
  WEBPACK_RETENTION,
  WEBPACK_RETENTION_FROM,
  WEBPACK_RETENTION_2025,
  WEBPACK_USAGE,
  WEBPACK_USAGE_2025,
  X_DOMAIN,
  Y_DOMAIN,
} from '../data/webpack'

const X_RANGE: [number, number] = [300, 1400]
const Y_RANGE: [number, number] = [640, 250]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const TICKS = Array.from({ length: X_DOMAIN[1] - X_DOMAIN[0] + 1 }, (_, i) => X_DOMAIN[0] + i).map((y) => ({ x: sx(y), text: String(y) }))
const GRID = [0, 50, 100].map((v) => ({ y: sy(v), text: `${v}%` }))

const lastOf = (runs: { x: number; y: number }[][]) => runs[runs.length - 1][runs[runs.length - 1].length - 1]
const USAGE_END = lastOf(WEBPACK_USAGE)
const KEEP_END = lastOf(WEBPACK_RETENTION)
const VITE_END = lastOf(VITE_USAGE)

/** Right-hand series names, nudged apart where 87% and 84% would overlap. */
const END_X = X_RANGE[1] + 28
const [USAGE_LABEL_Y, VITE_LABEL_Y, KEEP_LABEL_Y] = stackEndLabels(
  [USAGE_END, VITE_END, KEEP_END].map((p) => ({ y: sy(p.y), h: 34 })),
  6,
)

const COPY = [
  {
    lead: 'Most respondents have used webpack.',
    body: `${WEBPACK_USAGE_2025}% had used it in the ${LAST} survey. ${WEBPACK_ESTIMATED.join(' and ')} are estimated from the trend.`,
  },
  {
    lead: `Its retention fell in every edition since ${WEBPACK_FROM}.`,
    body: `Retention is the share of users who would use it again: ${WEBPACK_RETENTION_FROM}% in ${WEBPACK_FROM}, ${WEBPACK_RETENTION_2025}% in ${LAST}.`,
  },
  {
    lead: `Vite usage rose from ${VITE_FIRST.usage}% to ${VITE_USAGE_2025}%.`,
    body: `Share of respondents who had used it, ${VITE_FIRST.year} to ${LAST}. Its retention held at ${VITE_RETENTION_MIN}% to ${VITE_RETENTION_MAX}%.`,
  },
]

const usageLines = ref<(LineHandle | null)[]>([])
const keepLines = ref<(LineHandle | null)[]>([])
const viteLine = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)
const s = reactive({ keep: 0, ping: 0, vite: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** Usage draws once on landing. Seeking skips it and the lines rest fully drawn. */
  enter: (tl) => {
    rule.value?.addDraw(tl, 0)
    usageLines.value.forEach((line) => line?.addDraw(tl, '>', { duration: DUR.grow }))
  },
  beats: (tl, beat) => {
    beat(0)
    keepLines.value.forEach((line) => line?.addDraw(tl, '>', { duration: DUR.grow }))
    tl.to(s, { keep: 1, duration: DUR.card }, '>')
    tl.to(s, { ping: 1, duration: DUR.scale }, '<')
    beat(1)
    viteLine.value?.addDraw(tl, '>', { duration: DUR.scale })
    tl.to(s, { vite: 1, duration: DUR.card }, '>')
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
          v-for="(run, i) in WEBPACK_USAGE"
          :key="`u${i}`"
          :ref="(el) => (usageLines[i] = el as unknown as LineHandle | null)"
          :series="run"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="slate"
          :step="2"
          dots
          :seed="`sojs-webpack-usage-${i}`"
        />
        <InkLine
          v-for="(run, i) in WEBPACK_RETENTION"
          :key="`r${i}`"
          :ref="(el) => (keepLines[i] = el as unknown as LineHandle | null)"
          :series="run"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="rose"
          dots
          :seed="`sojs-webpack-retention-${i}`"
        />
        <InkLine
          ref="viteLine"
          :series="VITE_USAGE[0]"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          dots
          seed="sojs-vite-usage"
        />
        <InkPing :x="sx(KEEP_END.x)" :y="sy(KEEP_END.y)" :r="14" hue="rose" :progress="s.ping" />
        <text class="od-stage-label is-end" :x="END_X" :y="USAGE_LABEL_Y + 8" :style="{ fill: ink('slate', 3) }">webpack, used it</text>
        <text class="od-stage-label is-end" :x="END_X" :y="KEEP_LABEL_Y + 8" :style="{ fill: ink('rose', 3), opacity: String(s.keep) }">
          webpack, would use again
        </text>
        <text class="od-stage-label is-end" :x="END_X" :y="VITE_LABEL_Y + 8" :style="{ fill: ink('cyan', 3), opacity: String(s.vite) }">
          Vite, used it
        </text>
        <text v-for="t in TICKS" :key="t.text" class="od-stage-label" :x="t.x" :y="Y_RANGE[0] + 52" text-anchor="middle">
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="sojs-webpack-base" />
      </StoryLayer>
      <h2 class="od-story-head">
        webpack retention fell from {{ WEBPACK_RETENTION_FROM }}% to {{ WEBPACK_RETENTION_2025 }}% as Vite use rose from
        {{ VITE_FIRST.usage }}% to {{ VITE_USAGE_2025 }}%.
      </h2>
      <InkChip
        class="vt-sojs-keep"
        :x="sx(KEEP_END.x) - 24"
        :y="sy(KEEP_END.y) + 52"
        anchor="right"
        hue="rose"
        :text="`${WEBPACK_RETENTION_2025}%`"
        :progress="s.keep"
      />
      <StoryLink href="https://tryopendata.ai/datasets/state-of-survey/state-of-js" :label="`State of JavaScript ${X_DOMAIN[0]} to ${LAST}, Devographics, CC-BY-4.0`" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" :hue="clicks >= 2 ? 'cyan' : 'rose'" />
    </template>
  </StoryStage>
</template>
