<script setup lang="ts">
/**
 * Slide 5: the same Moon makes very different tides. Mean tidal range at five
 * NOAA stations, then the two long-bay stations lit, then the Gulf station.
 */
import { ref } from 'vue'
import { ink, useStage, type BarsHandle } from 'slidev-addon-decks/story'
import {
  ANCHORAGE_LABEL,
  ANCHORAGE_OVER_PENSACOLA,
  EPOCH_LABEL,
  PENSACOLA_LABEL,
  RANGE_ROWS,
} from '../data/ranges'

const DOMAIN: [number, number] = [0, 9]
const X_RANGE: [number, number] = [760, 1620]
const Y_BAND: [number, number] = [230, 640]

const COPY = [
  {
    lead: 'Same Moon, very different tides.',
    body: `Average gap between high and low water at five NOAA stations, ${EPOCH_LABEL}.`,
  },
  {
    lead: 'Long, narrow bays get the biggest tides.',
    body: `Anchorage, at the head of Cook Inlet, averages ${ANCHORAGE_LABEL}. Eastport sits at the Bay of Fundy's mouth.`,
  },
  {
    lead: 'The Gulf of Mexico barely moves.',
    body: `Pensacola averages ${PENSACOLA_LABEL}. Anchorage's range is ${ANCHORAGE_OVER_PENSACOLA} times larger.`,
  },
]

const bars = ref<BarsHandle | null>(null)

const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    bars.value?.addGrow(tl)
    beat(1)
    bars.value?.addRecolor(tl, 'anchorage', ink('cyan', 3))
    bars.value?.addRecolor(tl, 'eastport', ink('cyan', 3), '<')
    beat(2)
    bars.value?.addRecolor(tl, 'pensacola', ink('amber', 3))
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <InkBars
        ref="bars"
        :rows="RANGE_ROWS"
        :domain="DOMAIN"
        :x-range="X_RANGE"
        :y-band="Y_BAND"
        :thickness="34"
        hue="slate"
        :step="3"
        seed="tide-ranges"
      />
    </template>

    <template #overlay>
      <h2 class="od-story-head">Coastline shape decides how high the tide climbs.</h2>
      <StoryLink href="https://tidesandcurrents.noaa.gov/datum_options.html" label="NOAA CO-OPS tidal datums, MN" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
