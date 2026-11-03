<script setup lang="ts">
/**
 * Slide 12: Spring 2025 vs Spring 2026 pass rates, 24 D/F campuses.
 */
import CampusHoverCard from './CampusHoverCard.vue'
import { computed, ref, watch } from 'vue'
import type { MarkEvent } from '@opendata-ai/openchart-core'
import { useIsSlideActive } from '@slidev/client'
import { useStage } from 'slidev-addon-decks/story'
import { slideChartAnimation } from 'slidev-addon-decks/chart-theme'
import { useAisdChartTheme } from '../styles/chart-theme'
import { scatterPoints } from '../data/09-scatter'
// Two point layers rather than a size channel: openchart draws a size key for
// any size encoding, and its `legend.show` flag is chart-wide, so a size
// channel would either take the color legend down with it or reserve a gutter
// for a key that says nothing here. The backdrop campuses are small, the two
// tiers under discussion are not, and the shared parent encoding keeps one
// color legend in domain order across both layers.
const { chartTheme, chartScale } = useAisdChartTheme()
const BACKDROP_TIER = 'Other D/F campus'
const TIER_DOMAIN = ['Crossed the fifth F', 'One F from the trigger', BACKDROP_TIER]
const DIM = '#3f3f46'
/**
 * Tier colors per beat, in `TIER_DOMAIN` order. The legend keeps its meaning
 * across all three; what changes is which tiers carry ink, so the beat the
 * card is on is the one the eye lands on. Beat 1 is the named tiers, so the
 * field dims. Beat 2 is the six that slipped, two amber (Pecan Springs, Oak
 * Springs) and four from the field (Pickle, Govalle, Allison, Harris), so the
 * field steps up to the lighter slate, amber keeps its hue, and the crossed
 * tier dims: Burnet and Webb both improved.
 */
const TIER_RANGE: string[][] = [
  ['#fb7185', '#f59e0b', '#64748b'],
  ['#fb7185', '#f59e0b', DIM],
  [DIM, '#f59e0b', '#94a3b8'],
]
/** One annotation per beat, so no beat lands two new text zones at once. */
const BEAT_ANNOTATIONS = computed(() => [
  [{ type: 'text', x: 28, y: 62, text: 'Improved', fill: '#6a9f58', fontSize: 26 * chartScale.value, connector: false }],
  [],
  [{ type: 'text', x: 56, y: 27, text: 'Slipped', fill: '#fb7185', fontSize: 26 * chartScale.value, connector: false }],
])
/** Campuses above the diagonal (Spring 2026 over Spring 2025): 17 of 24. */
const IMPROVED = scatterPoints.filter((p) => p.y > p.x).length
const DECLINED = scatterPoints.filter((p) => p.y < p.x).length
const UNCHANGED = scatterPoints.length - IMPROVED - DECLINED
const COPY = [
  { lead: `${IMPROVED} of ${scatterPoints.length} had higher pass rates.`, body: `${DECLINED} declined; ${UNCHANGED} was unchanged. Above the line means a higher STAAR pass rate in 2026.` },
  { lead: 'Two crossed. Amber is one F away.', body: 'Six amber campuses closed; their records moved to the schools that took their students.' },
  { lead: 'Six campuses got worse.', body: 'Below the diagonal, slipping backward.' },
]
const { clicks, copy, beats } = useStage({
  copy: COPY,
  // The stage motion is the chart's own update between beats, so the beat
  // script carries labels and nothing else.
  beats: (tl, beat) => {
    beat(0); beat(1); beat(2)
  },
})
const selectedId = ref<string | null>(null)
const selected = computed(() => scatterPoints.find(point => point.campusNumber === selectedId.value))
const isActive = useIsSlideActive()
watch([clicks, isActive], () => { selectedId.value = null })
function showCampus(event: MarkEvent) {
  selectedId.value = typeof event.datum.campusNumber === 'string' ? event.datum.campusNumber : null
}
// Only plotting fields enter OpenChart; histories and hover metadata stay outside
// its validation/animation pipeline. Mark events identify the full record by ID.
const plotPoints = scatterPoints.map(({ campusNumber, campus, x, y, tier }) => ({ campusNumber, campus, x, y, tier }))
const backdropPoints = plotPoints.filter(point => point.tier === BACKDROP_TIER)
const highlightedPoints = plotPoints.filter(point => point.tier !== BACKDROP_TIER)
const scatterSpec = computed(() => ({
  encoding: {
    color: { field: 'tier', type: 'nominal', scale: { domain: TIER_DOMAIN, range: TIER_RANGE[clicks.value] ?? TIER_RANGE[0] }, legend: { title: null } },
    x: { field: 'x', type: 'quantitative', axis: { title: 'Spring 2025 pass rate', format: '.0f%', tickCount: 5, labelColor: '#a1a1aa' }, scale: { domain: [23, 73], nice: false } },
    y: { field: 'y', type: 'quantitative', axis: { title: 'Spring 2026 pass rate', format: '.0f%', tickCount: 5, labelColor: '#a1a1aa' }, scale: { domain: [23, 73], nice: false } },
  },
  layer: [
    // A true equality line, not a fitted regression: above means y > x.
    { mark: { type: 'rule', stroke: '#94a3b8', strokeWidth: 2, tooltip: null }, data: [{ x: 23, y: 23, x2: 73, y2: 73, tier: BACKDROP_TIER, campus: 'No change' }], encoding: { x2: { field: 'x2', type: 'quantitative' }, y2: { field: 'y2', type: 'quantitative' } } },
    // The backdrop draws first so the named campuses sit on top of it.
    { mark: { type: 'point', filled: true, tooltip: null, size: 6 * chartScale.value, trendline: false }, data: backdropPoints },
    { mark: { type: 'point', filled: true, tooltip: null, size: 12 * chartScale.value, trendline: false }, data: highlightedPoints },
  ],
  annotations: [
    { type: 'text', x: 61, y: 61, text: 'No change: 2026 = 2025', fill: '#cbd5e1', fontSize: 20 * chartScale.value, offset: { dx: 0, dy: 32 }, connector: false },
    ...(BEAT_ANNOTATIONS.value[clicks.value] ?? BEAT_ANNOTATIONS.value[0]),
  ],
  chrome: { subtitle: 'Each dot: an AISD campus with three straight D/F ratings, 2022-23 to 2024-25.', source: 'Source: TEA STAAR Cambium campus data' },
  legend: { position: 'top' }, theme: chartTheme.value, animation: slideChartAnimation,
}))
</script>
<template>
  <StoryStage fluid :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">{{ IMPROVED }} of {{ scatterPoints.length }} had higher STAAR pass rates.</h2>
      <div class="scatter-chart" @mouseleave="selectedId = null">
        <OpenChart :spec="scatterSpec" @mark-hover="showCampus" @mark-leave="selectedId = null" />
      </div>
      <Transition name="campus-hover">
        <CampusHoverCard v-if="selected" :key="selected.campusNumber"
          :campus="selected.metadata" :consecutive-fs="selected.consecutiveFs" :rates="selected"
          :closed="selected.closed" :record-moved-to="selected.recordMovedTo" />
      </Transition>
      <div class="hover-hint">Hover a dot for campus details.</div>
      <StoryLink href="https://tryopendata.ai/datasets/tea/staar-cambium-campus" label="Source: TEA STAAR campus data via OpenData" />
    </template>
    <template #card><StoryCard v-show="!selected" anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>
<style scoped>
/* The chart takes the right side of the frame; the headline and the card own
   the left column, so nothing is ever drawn over. */
.scatter-chart {
  position: absolute;
  /* The stage overlay swallows pointer events so ink never blocks a click; the
     chart opts back in so its dot tooltips work on hover. */
  pointer-events: auto;
  top: calc(13 * var(--sh));
  left: calc(44 * var(--lw));
  right: calc(3 * var(--lw));
  bottom: calc(7 * var(--sh));
}
.campus-tooltip {
  position: absolute;
  left: calc(4 * var(--lw));
  top: calc(22 * var(--sh));
  width: calc(38 * var(--lw));
}
.hover-hint { position: absolute; left: calc(46 * var(--lw)); bottom: calc(4 * var(--sh)); font-size: calc(1 * var(--sw)); color: var(--od-text-muted); }
@media print { .hover-hint { display: none; } }
</style>
