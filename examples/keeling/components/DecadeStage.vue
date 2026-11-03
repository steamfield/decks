<script setup lang="ts">
/**
 * Slide 4: the average yearly rise in each decade. Bars grow, the first and
 * last full decades light, then the partial current decade. The rise is not
 * steeper every decade (the 1990s sit below the 1980s), so the headline
 * compares the record's end with its first decade instead.
 */
import { ref } from 'vue'
import { ink, useStage, type BarsHandle } from 'slidev-addon-decks/story'
import {
  CURRENT_PPM,
  CURRENT_YEARS,
  DOMAIN,
  FIRST_DECADE,
  LAST_FULL_DECADE,
  ROWS,
  SPEEDUP_LABEL,
} from '../data/decades'

const X_RANGE: [number, number] = [760, 1620]
const Y_BAND: [number, number] = [230, 640]

const COPY = [
  {
    lead: "Each bar is a decade's average yearly rise.",
    body: 'NOAA annual growth at Mauna Loa, averaged across each decade, in ppm per year.',
  },
  {
    lead: `In the ${LAST_FULL_DECADE}, it rose ${SPEEDUP_LABEL} as fast.`,
    body: `Measured against the ${FIRST_DECADE}, the first full decade of the record.`,
  },
  {
    lead: 'This decade is running faster still.',
    body: `${CURRENT_YEARS} years in, the average rise is ${CURRENT_PPM} ppm a year.`,
  },
]

const bars = ref<BarsHandle | null>(null)
const firstId = ROWS[0].id
const lastFullId = ROWS[ROWS.length - 2].id
const currentId = ROWS[ROWS.length - 1].id

const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    // A beat label marks the state its click lands on, so each beat's tweens sit before its label.
    bars.value?.addGrow(tl)
    beat(0)
    bars.value?.addRecolor(tl, firstId, ink('cyan', 3))
    bars.value?.addRecolor(tl, lastFullId, ink('cyan', 3), '<')
    beat(1)
    bars.value?.addRecolor(tl, currentId, ink('amber', 3))
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <InkBars
        ref="bars"
        :rows="ROWS"
        :domain="DOMAIN"
        :x-range="X_RANGE"
        :y-band="Y_BAND"
        :thickness="30"
        hue="slate"
        :step="3"
        seed="keeling-decades"
      />
    </template>

    <template #overlay>
      <h2 class="od-story-head">The climb is steeper now than in the {{ FIRST_DECADE }}.</h2>
      <StoryLink href="https://gml.noaa.gov/ccgg/trends/gr.html" label="NOAA GML, Mauna Loa annual growth rate" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
