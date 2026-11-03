<script setup lang="ts">
/**
 * Slide 3: one hundred squares, one per percent of a tool's 2025 users.
 *
 * Beat 0 lights the 26 webpack users who would use it again, and its figure
 * counts up. Arriving from Slide 2 the figure is the same element as that
 * slide's "26%" chip (`vt-sojs-keep`), so the chip flies into place instead.
 * Beat 1 fills the grid to Vite's 98 on a hashed stagger and counts the
 * second figure up.
 */
import { computed, reactive, ref } from 'vue'
import { DUR, STAGE, TRACE, ink, useStage, type GrowHandle } from 'slidev-addon-decks/story'
import { UNITS, VITE_FIRST_YEAR, VITE_KEEP, VITE_KEEP_MIN, WEBPACK_KEEP, YEAR } from '../data/keep'

/** Grid geometry, stage units: 10 by 10. */
const GRID = { cols: 10, cellWidth: 44, gapX: 12, gapY: 12, origin: { x: 1080, y: 250 } }
/** Top left of the figure block, stage units. */
const NUM = { x: 300, y: 300 }
const numStyle = computed(() => ({ left: `${(NUM.x / STAGE.width) * 100}%`, top: `${(NUM.y / STAGE.height) * 100}%` }))

const COPY = [
  {
    lead: `${WEBPACK_KEEP} of ${UNITS} would use webpack again.`,
    body: `Each square is one percent of webpack's ${YEAR} users. The lit ones would use it again.`,
  },
  {
    lead: `${VITE_KEEP} of ${UNITS} would use Vite again.`,
    body: `Vite's retention has been ${VITE_KEEP_MIN}% or higher in every edition from ${VITE_FIRST_YEAR} to ${YEAR}.`,
  },
]

const webpackNum = ref<GrowHandle | null>(null)
const viteNum = ref<GrowHandle | null>(null)
const s = reactive({ base: 0, webpack: 0, vite: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** The field and the webpack figure settle once on landing; a view transition skips this and they rest in place. */
  enter: (tl) => {
    tl.to(s, { base: 1, duration: DUR.scale }, 0)
    // The lit cells start filling while the field is still arriving.
    tl.to(s, { webpack: 1, duration: DUR.gather, ease: TRACE }, DUR.card)
    webpackNum.value?.addGrow(tl, '<')
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { vite: 1, duration: DUR.gather, ease: TRACE }, 'beat0')
    viteNum.value?.addGrow(tl, '<')
    beat(1)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <UnitGrid :count="UNITS" v-bind="GRID" :color="ink('slate', 1)" :reveal="s.base" seed="sojs-keep-all" />
        <UnitGrid
          :count="WEBPACK_KEEP"
          v-bind="GRID"
          :color="ink('rose', 3)"
          :reveal="s.webpack * (1 - s.vite)"
          seed="sojs-keep-webpack"
        />
        <UnitGrid :count="VITE_KEEP" v-bind="GRID" :color="ink('cyan', 3)" :reveal="s.vite" seed="sojs-keep-vite" />
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">
        {{ WEBPACK_KEEP }} of every {{ UNITS }} webpack users would use it again, against {{ VITE_KEEP }} of every {{ UNITS }} Vite users.
      </h2>
      <div class="keep-num vt-sojs-keep" :style="{ ...numStyle, opacity: String(1 - s.vite) }">
        <InkNumber ref="webpackNum" :value="String(WEBPACK_KEEP)" suffix="%" hue="rose" label="of webpack users would use it again" />
      </div>
      <div class="keep-num" :style="{ ...numStyle, opacity: String(s.vite) }">
        <InkNumber ref="viteNum" :value="String(VITE_KEEP)" suffix="%" hue="cyan" label="of Vite users would use it again" />
      </div>
      <StoryLink href="https://tryopendata.ai/datasets/state-of-survey/state-of-js" :label="`State of JavaScript ${YEAR}, Devographics, CC-BY-4.0`" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" :hue="clicks >= 1 ? 'cyan' : 'rose'" />
    </template>
  </StoryStage>
</template>

<style scoped>
.keep-num {
  position: absolute;
  width: max-content;
}
</style>
