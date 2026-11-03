<script setup lang="ts">
/**
 * Slide 5: Jest and Vitest, 2021 against 2025, as a slope chart. One slope
 * draws per beat and the slope before it steps back to grey, so one series is
 * lit at a time: Jest usage, Jest retention, Vitest usage, Vitest retention.
 * The last beat brings Jest retention back up beside Vitest's for the
 * comparison the card makes.
 */
import { reactive, ref } from 'vue'
import { DUR, ink, stackEndLabels, useStage, yScale, type Hue, type LineHandle, type RuleHandle } from 'slidev-addon-decks/story'
import {
  FROM,
  JEST_PEAK,
  JEST_PEAK_FROM,
  JEST_PEAK_TO,
  JEST_RETENTION,
  JEST_USAGE,
  TO,
  VITEST_RETENTION,
  VITEST_USAGE,
  Y_DOMAIN,
} from '../data/testing'

const X_DOMAIN: [number, number] = [FROM, TO]
const X_RANGE: [number, number] = [780, 1300]
const Y_RANGE: [number, number] = [660, 250]
const sy = yScale(Y_DOMAIN, Y_RANGE)

type Key = 'ju' | 'jr' | 'vu' | 'vr'
interface Slope {
  key: Key
  name: string
  hue: Hue
  pair: { from: number; to: number }
}
const SLOPES: Slope[] = [
  { key: 'ju', name: 'Jest, used it', hue: 'slate', pair: JEST_USAGE },
  { key: 'jr', name: 'Jest, would use again', hue: 'rose', pair: JEST_RETENTION },
  { key: 'vu', name: 'Vitest, used it', hue: 'cyan', pair: VITEST_USAGE },
  { key: 'vr', name: 'Vitest, would use again', hue: 'cyan', pair: VITEST_RETENTION },
]
const seriesOf = (p: { from: number; to: number }) => [
  { x: FROM, y: p.from },
  { x: TO, y: p.to },
]

/** End labels nudged apart: 92% and 94% sit four pixels apart on the left. */
const LABEL_H = 34
const LEFT_Y = stackEndLabels(SLOPES.map((sl) => ({ y: sy(sl.pair.from), h: LABEL_H })), 4)
const RIGHT_Y = stackEndLabels(SLOPES.map((sl) => ({ y: sy(sl.pair.to), h: LABEL_H })), 4)

const COPY = [
  {
    lead: `Jest usage went from ${JEST_USAGE.from}% to ${JEST_USAGE.to}%.`,
    body: `Share of respondents who had used it, in the ${FROM} and ${TO} editions.`,
  },
  {
    lead: `Jest retention fell from ${JEST_RETENTION.from}% to ${JEST_RETENTION.to}%.`,
    body: `It had held at ${JEST_PEAK}% in every edition from ${JEST_PEAK_FROM} to ${JEST_PEAK_TO}.`,
  },
  {
    lead: `Vitest usage rose from ${VITEST_USAGE.from}% to ${VITEST_USAGE.to}%.`,
    body: 'Share of respondents who had used it, in the same two editions.',
  },
  {
    lead: `${VITEST_RETENTION.to}% of Vitest users would use it again.`,
    body: `Higher than Jest's retention in any edition, including its ${JEST_PEAK}% peak.`,
  },
]

const lines = ref<Record<Key, LineHandle | null>>({ ju: null, jr: null, vu: null, vr: null })
const rule = ref<RuleHandle | null>(null)
/** `d*` is how far each slope's labels have come in; `g*` how far it has stepped back to grey. */
const s = reactive({ dju: 0, djr: 0, dvu: 0, dvr: 0, gju: 0, gjr: 0, gvu: 0 })
const drawn = (k: Key) => s[`d${k}` as const]
const ghosted = (k: Key) => (k === 'vr' ? 0 : s[`g${k}` as const])
const labelOpacity = (k: Key) => String(drawn(k) * (1 - 0.6 * ghosted(k)))
const labelFill = (sl: Slope) => ink(sl.hue, 3)
/** The card takes the hue of the slope its beat draws. */
const CARD_HUE: Hue[] = SLOPES.map((sl) => sl.hue)

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** The axis and the first slope draw once on landing; seeking skips it. */
  enter: (tl) => {
    rule.value?.addDraw(tl, 0)
    lines.value.ju?.addDraw(tl, '>')
    tl.to(s, { dju: 1, duration: DUR.card }, '<')
  },
  /** Each beat's first tween is pinned to its own label: a raw `'>'` would follow the last tween added, not the label. */
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { gju: 1, duration: DUR.color }, 'beat0')
    lines.value.jr?.addDraw(tl, '<')
    tl.to(s, { djr: 1, duration: DUR.card }, '<')
    beat(1)
    tl.to(s, { gjr: 1, duration: DUR.color }, 'beat1')
    lines.value.vu?.addDraw(tl, '<')
    tl.to(s, { dvu: 1, duration: DUR.card }, '<')
    beat(2)
    tl.to(s, { gvu: 1, gjr: 0, duration: DUR.color }, 'beat2')
    lines.value.vr?.addDraw(tl, '<')
    tl.to(s, { dvr: 1, duration: DUR.card }, '<')
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <line
          v-for="x in X_RANGE"
          :key="x"
          :x1="x"
          :x2="x"
          :y1="Y_RANGE[1]"
          :y2="Y_RANGE[0]"
          :stroke="ink('slate', 1)"
          stroke-width="2"
          stroke-dasharray="4 10"
        />
        <InkLine
          v-for="sl in SLOPES"
          :key="sl.key"
          :ref="(el) => (lines[sl.key] = el as unknown as LineHandle | null)"
          :series="seriesOf(sl.pair)"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          :hue="sl.hue"
          :step="sl.hue === 'slate' ? 2 : 3"
          :ghost="ghosted(sl.key)"
          dots
          :seed="`sojs-testing-${sl.key}`"
        />
        <text
          v-for="(sl, i) in SLOPES"
          :key="`l${sl.key}`"
          class="od-stage-label"
          :x="X_RANGE[0] - 28"
          :y="LEFT_Y[i] + 8"
          text-anchor="end"
          :style="{ fill: labelFill(sl), opacity: labelOpacity(sl.key) }"
        >
          {{ sl.pair.from }}%
        </text>
        <text
          v-for="(sl, i) in SLOPES"
          :key="`r${sl.key}`"
          class="od-stage-label is-end"
          :x="X_RANGE[1] + 28"
          :y="RIGHT_Y[i] + 8"
          :style="{ fill: labelFill(sl), opacity: labelOpacity(sl.key) }"
        >
          {{ sl.pair.to }}% {{ sl.name }}
        </text>
        <text class="od-stage-label" :x="X_RANGE[0]" :y="Y_RANGE[0] + 52" text-anchor="middle">{{ FROM }}</text>
        <text class="od-stage-label" :x="X_RANGE[1]" :y="Y_RANGE[0] + 52" text-anchor="middle">{{ TO }}</text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0] - 120" :x2="X_RANGE[1] + 120" :y="Y_RANGE[0]" seed="sojs-testing-base" />
      </StoryLayer>
      <h2 class="od-story-head">
        Since {{ FROM }}, Jest retention fell to {{ JEST_RETENTION.to }}% as Vitest use rose to {{ VITEST_USAGE.to }}%.
      </h2>
      <StoryLink href="https://tryopendata.ai/datasets/state-of-survey/state-of-js" :label="`State of JavaScript ${FROM} and ${TO}, Devographics, CC-BY-4.0`" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" :hue="CARD_HUE[clicks]" />
    </template>
  </StoryStage>
</template>
