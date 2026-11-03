<script setup lang="ts">
/**
 * Slide 2: the whole Mauna Loa monthly record draws, then the first month and
 * the highest month are marked.
 */
import { reactive, ref } from 'vue'
import { DUR, useStage, xScale, yScale, type LineHandle, type RuleHandle } from 'slidev-addon-decks/story'
import { FIRST, FIRST_LABEL, LAST, NOAA_FROM, PEAK, PEAK_LABEL, SERIES } from '../data/record'

const X_DOMAIN: [number, number] = [Math.floor(FIRST.x), Math.ceil(LAST.x)]
const Y_DOMAIN: [number, number] = [300, 440]
const X_RANGE: [number, number] = [260, 1660]
const Y_RANGE: [number, number] = [620, 230]
const sx = xScale(X_DOMAIN, X_RANGE)
const sy = yScale(Y_DOMAIN, Y_RANGE)

const TICKS = [FIRST.year, 1980, 2000, 2020].map((y) => ({ x: sx(y), text: String(y) }))
const GRID = [320, 360, 400, 440].map((v) => ({ y: sy(v), text: `${v} ppm` }))

const COPY = [
  {
    lead: 'Carbon dioxide above Mauna Loa, every month.',
    body: `Monthly means in parts per million, from ${FIRST_LABEL}. Scripps data to April ${NOAA_FROM}, NOAA after.`,
  },
  {
    lead: `It started at ${FIRST.y} ppm.`,
    body: `That is ${FIRST_LABEL}, the first month of C. David Keeling's record.`,
  },
  {
    lead: `It reached ${PEAK.y} ppm in ${PEAK_LABEL}.`,
    body: 'The highest monthly mean in the record so far.',
  },
]

const line = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)
const s = reactive({ first: 0, peak: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** The line draws once on landing. Seeking skips it and InkLine rests fully drawn. */
  enter: (tl) => {
    rule.value?.addDraw(tl, 0)
    line.value?.addDraw(tl)
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { first: 1, duration: DUR.card })
    beat(1)
    tl.to(s, { peak: 1, duration: DUR.card })
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
          ref="line"
          :series="SERIES"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          :width="4"
          seed="keeling-record"
        />
        <text v-for="t in TICKS" :key="t.text" class="od-stage-label" :x="t.x" :y="Y_RANGE[0] + 52" text-anchor="middle">
          {{ t.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="keeling-record-base" />
      </StoryLayer>
      <h2 class="od-story-head">Carbon dioxide in the air keeps climbing.</h2>
      <InkChip :x="sx(FIRST.x)" :y="sy(FIRST.y) - 40" :text="`${FIRST.y} ppm`" :progress="s.first" />
      <InkChip :x="sx(PEAK.x)" :y="sy(PEAK.y) - 40" anchor="right" :text="`${PEAK.y} ppm`" :progress="s.peak" />
      <StoryLink href="https://gml.noaa.gov/ccgg/trends/data.html" label="NOAA GML, Mauna Loa monthly mean CO2" />
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
