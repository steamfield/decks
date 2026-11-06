<script setup lang="ts">
import { computed } from 'vue'
import type { ChartSpec } from '@opendata-ai/openchart-core'
import { DUR, ink, useFrameScale, useStage } from 'slidev-addon-decks/story'
import { scaleChartTheme, slideChartAnimation, slideChartTheme } from 'slidev-addon-decks/chart-theme'
import { theme } from 'slidev-addon-decks/theme'
import { enrollmentSeries, campusRatingSeries, enrollmentChange, houstonIntervention, houstonSeriesStatus, houstonLabels } from '../data/12-houston'

const shortYear = (year: string) => year.slice(0, 4) + '–' + year.slice(-2)
const ratedYears = campusRatingSeries.filter(row => row.ab !== null)
const baseline = ratedYears.find(row => row.schoolYear === enrollmentChange.baselineYear)!
const latest = ratedYears[ratedYears.length - 1]
const COPY = [
  { lead: `The count increased by ${latest.ab - baseline.ab} campuses.`, body: `A or B: ${baseline.ab} campuses in ${shortYear(baseline.schoolYear)}, ${latest.ab} in ${shortYear(latest.schoolYear)}. Final ratings pending.` },
  { lead: `The district lost ${enrollmentChange.lost.toLocaleString('en-US')} students.`, body: `School years ${shortYear(enrollmentChange.baselineYear)} to ${shortYear(enrollmentChange.endYear)}. Enrollment was declining before the takeover.` },
]
const { clicks, copy, beats } = useStage({ copy: COPY, beats: (_tl, beat) => { beat(0); beat(1) } })
const scale = useFrameScale()
const years = enrollmentSeries.map(row => row.schoolYear.slice(-4))
const takeover = `${houstonIntervention.start.slice(0, 4)} takeover`

// Only frame size can change these specs. Beat changes alter panel emphasis in CSS.
const common = computed(() => ({
  theme: scaleChartTheme(slideChartTheme, scale.value),
  animation: slideChartAnimation,
  legend: { show: false },
  annotations: [{ type: 'refline' as const, id: 'takeover', x: enrollmentChange.baselineYear.slice(-4), label: takeover,
    stroke: ink('slate', 3), style: 'solid' as const, fontSize: 22 * scale.value, labelPlacement: 'outside' as const }],
}))
const x = { field: 'year', type: 'ordinal' as const, sort: null,
  scale: { domain: years, padding: 0.1 },
  axis: { title: '', labelAngle: 0, labelOverlap: 'greedy' as const, labelColor: theme.text.muted,
    values: [years[0], years[2], enrollmentChange.baselineYear.slice(-4), latest.schoolYear.slice(-4)] } }
const ratingsSpec = computed<ChartSpec>(() => ({
  ...common.value,
  mark: { type: 'bar', fill: ink('emerald', 3) },
  // Missing rating years remain empty slots, never zero-valued bars.
  data: ratedYears.map(row => ({ year: row.schoolYear.slice(-4), campuses: row.ab })),
  encoding: { x, y: { field: 'campuses', type: 'quantitative', scale: { domain: [0, 250] },
    axis: { title: '', format: ',.0f', tickCount: 5, labelColor: theme.text.muted } } },
  labels: { density: 'none' },
  annotations: [...common.value.annotations,
    { type: 'text', id: 'unrated-years', x: years[1], y: 85, text: 'No ratings', connector: false, dot: false,
      fill: theme.text.muted, fontSize: 20 * scale.value, maxWidth: 140 * scale.value },
    { type: 'text', id: 'latest-rating', x: latest.schoolYear.slice(-4), y: latest.ab,
      text: houstonSeriesStatus.final2026Ratings === 'pending' ? 'Final ratings pending' : 'Final ratings',
      background: true, dot: false, fill: ink('amber', 3), stroke: ink('amber', 2),
      offset: { dx: -80 * scale.value, dy: -60 * scale.value }, fontSize: 20 * scale.value,
      maxWidth: 160 * scale.value, responsive: false },
  ],
  chrome: { eyebrow: 'Campus ratings', title: 'More campuses earned A or B.',
    subtitle: 'Annual campus counts by school year.', source: `${houstonLabels.agency} · School year ending` },
}))
const enrollmentSpec = computed<ChartSpec>(() => ({
  ...common.value,
  mark: { type: 'line', stroke: ink('slate', 3), strokeWidth: 2.5, point: true, interpolate: 'linear' },
  data: enrollmentSeries.map(row => ({ year: row.schoolYear.slice(-4), students: row.enrollment })),
  encoding: { x: { ...x, axis: { ...x.axis, labelPadding: 12 * scale.value } },
    y: { field: 'students', type: 'quantitative', scale: { domain: [160000, 220000], zero: false },
    // Gutter ticks keep the same placement on animated and settled entry.
    axis: { title: '', format: '~s', tickCount: 4, tickPosition: 'gutter', labelColor: theme.text.muted } } },
  labels: { density: 'none' },
  chrome: { eyebrow: 'Student enrollment', title: 'Enrollment fell before the takeover.',
    subtitle: `${houstonIntervention.district} · Students enrolled`, source: `${houstonLabels.agency} · School year ending` },
}))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">{{ houstonLabels.city }}'s enrollment kept falling.</h2>
      <div class="panels" :data-beat="clicks" :style="{ '--panel-fade': `${DUR.color}s` }">
        <div class="panel ratings">
          <OpenChart :spec="ratingsSpec" />
        </div>
        <div class="panel enrollment"><OpenChart :spec="enrollmentSpec" /></div>
      </div>
      <StoryLink :href="clicks === 0 ? 'https://tryopendata.ai/datasets/tea/accountability-summary' : 'https://tryopendata.ai/datasets/tea/student-enrollment'" :label="`${houstonLabels.agency} ${clicks === 0 ? 'campus ratings' : 'enrollment'}`" />
    </template>
    <template #card><StoryCard anchor="left" :hue="clicks === 0 ? 'emerald' : 'slate'" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
/* Two fixed plots share the full upper frame; emphasis never changes the spec. */
.panels { position: absolute; top: calc(18 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); height: calc(47 * var(--sh)); display: grid; grid-template-columns: 1fr 1fr; gap: calc(3 * var(--sw)); }
.panel { position: relative; min-width: var(--tx-zero); min-height: var(--tx-zero); opacity: var(--tx-on); transition: opacity var(--panel-fade) var(--od-settle); }
.panels[data-beat="0"] .enrollment, .panels[data-beat="1"] .ratings { opacity: var(--tx-dim); }
.panel :deep(.oc-root) { --oc-accent: var(--od-cyan); --oc-annotation-plate: var(--od-canvas); --oc-annotation-label: var(--od-text-secondary); }
/* OpenChart's on-mark evidence label uses the same dashed treatment as tx-tag. */
.ratings :deep([data-annotation-id="latest-rating"] rect) { fill: var(--od-surface); stroke: var(--od-amber); stroke-width: var(--tx-hairline); stroke-dasharray: var(--tx-pending-dash); }
@media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
</style>
