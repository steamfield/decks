<script setup lang="ts">
/**
 * Cover field: webpack retention and Vite usage, traced in behind the title
 * on the cover's TRACE curve. Both are real series (data/cover.ts); the lines
 * cross between the 2022 and 2023 editions, which is the deck in one picture.
 *
 * The cover is one beat, so this field owns only an entrance: it plays once
 * on landing and rests fully drawn in the presenter, overview and export.
 */
import { ref } from 'vue'
import { DUR, TRACE, ink, useScriptedDemo, useStageEntrance, xScale, yScale, type LineHandle } from 'slidev-addon-decks/story'
import { VITE_USAGE, WEBPACK_RETENTION, X_DOMAIN, Y_DOMAIN } from '../data/cover'

const X_RANGE: [number, number] = [880, 1420]
const Y_RANGE: [number, number] = [860, 400]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const lastOf = (runs: { x: number; y: number }[][]) => runs[runs.length - 1][runs[runs.length - 1].length - 1]
const WEBPACK_END = lastOf(WEBPACK_RETENTION)
const VITE_END = lastOf(VITE_USAGE)

const webpackLines = ref<(LineHandle | null)[]>([])
const viteLine = ref<LineHandle | null>(null)

const { clicks, isActive } = useScriptedDemo()

useStageEntrance(
  (tl) => {
    // Both lines trace together; Vite leaves a beat later so the two cross mid-stroke.
    webpackLines.value.forEach((line) => line?.addDraw(tl, 0, { duration: DUR.trace, ease: TRACE }))
    viteLine.value?.addDraw(tl, DUR.morph, { duration: DUR.trace, ease: TRACE })
  },
  { clicks, isActive },
)
</script>

<template>
  <StoryLayer>
    <InkLine
      v-for="(run, i) in WEBPACK_RETENTION"
      :key="`w${i}`"
      :ref="(el) => (webpackLines[i] = el as unknown as LineHandle | null)"
      :series="run"
      :x-domain="X_DOMAIN"
      :y-domain="Y_DOMAIN"
      :x-range="X_RANGE"
      :y-range="Y_RANGE"
      hue="rose"
      :step="2"
      dots
      :seed="`sojs-cover-webpack-${i}`"
    />
    <InkLine
      ref="viteLine"
      :series="VITE_USAGE[0]"
      :x-domain="X_DOMAIN"
      :y-domain="Y_DOMAIN"
      :x-range="X_RANGE"
      :y-range="Y_RANGE"
      hue="cyan"
      :step="2"
      dots
      seed="sojs-cover-vite"
    />
    <text class="od-stage-label is-end" :x="sx(WEBPACK_END.x) + 24" :y="sy(WEBPACK_END.y) + 8" :style="{ fill: ink('rose', 3) }">webpack, would use again</text>
    <text class="od-stage-label is-end" :x="sx(VITE_END.x) + 24" :y="sy(VITE_END.y) + 8" :style="{ fill: ink('cyan', 3) }">Vite, used it</text>
  </StoryLayer>
</template>
