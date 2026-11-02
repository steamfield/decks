<script setup lang="ts">
/**
 * Bars: grow, recolor, then drop rows and re-sort what is left.
 *
 * The four things `InkBars` can be asked to do, in the order a slide usually
 * asks for them. Geometry lives in the child; the beat script here only says
 * when. Every helper takes the timeline, so a seek backwards plays the whole
 * sequence in reverse for free.
 *
 * The bars are deliberately outside the `playCount` key: the timeline built
 * on mount tweens this instance's row state, and a remount on slide re-entry
 * would leave it animating an orphan.
 */
import { ref } from 'vue'
import { DUR, ink, useStage, type BarsHandle, type InkBarRow } from 'slidev-addon-decks/story'

/** Illustrative rows. A real stage imports these from `data/*.ts`. */
const ROWS: InkBarRow[] = [
  { id: 'a', label: 'Alpha', value: 64, text: '64%' },
  { id: 'b', label: 'Bravo', value: 51, text: '51%' },
  { id: 'c', label: 'Charlie', value: 44, text: '44%' },
  { id: 'd', label: 'Delta', value: 38, text: '38%' },
  { id: 'e', label: 'Echo', value: 22, text: '22%' },
]

/** The rows that survive the exit, on their second metric and second domain. */
const DROPPED = ['c', 'e']
const SECOND: InkBarRow[] = [
  { id: 'a', label: 'Alpha', value: 880, text: '880' },
  { id: 'b', label: 'Bravo', value: 960, text: '960' },
  { id: 'd', label: 'Delta', value: 915, text: '915' },
]

const FIRST_DOMAIN: [number, number] = [0, 70]
const SECOND_DOMAIN: [number, number] = [800, 1000]
/** Bar origin and band, in viewBox units of the 1920x1080 stage. */
const BAR_X: [number, number] = [620, 1620]
const BAR_BAND: [number, number] = [300, 700]

/** One row leaves the series hue, which is what makes it the argument. */
const ACCENT = ink('rose', 3)

const COPY = [
  {
    lead: 'Five rows, one metric.',
    body: 'The bars grow as the slide arrives, so beat 0 is never empty.',
  },
  {
    lead: 'Echo is the outlier.',
    body: 'One row leaves the series hue; everything else stays grey-green.',
  },
  {
    lead: 'The second metric drops two rows.',
    body: 'What is left re-sorts and rescales in place, reversibly.',
  },
]

const bars = ref<BarsHandle | null>(null)

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** Enter motion: the bars are grown by the time the first card is read. */
  enter: (tl) => bars.value?.addGrow(tl),
  beats: (tl, beat) => {
    beat(0)
    bars.value?.addRecolor(tl, 'e', ACCENT, `+=${DUR.opacity}`)
    beat(1)
    bars.value?.addExit(tl, DROPPED)
    bars.value?.addReorder(tl, SECOND, SECOND_DOMAIN, `+=${DUR.opacity}`)
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <InkBars
        ref="bars"
        seed="bars-template"
        hue="emerald"
        :step="3"
        :rows="ROWS"
        :domain="FIRST_DOMAIN"
        :x-range="BAR_X"
        :y-band="BAR_BAND"
        :thickness="24"
        sort="desc"
      />
    </template>

    <template #overlay>
      <h2 class="od-story-head">Bars grow, recolor, exit and re-sort.</h2>
    </template>

    <template #card>
      <StoryCard anchor="left" hue="emerald" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
