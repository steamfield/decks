<script setup lang="ts">
import { computed } from 'vue'
import type { CampusRecord } from '../data/campuses'
import { campusUtilization } from '../data/campus-utilization'

const props = defineProps<{
  campus: CampusRecord
  consecutiveFs: number
  rates?: { x: number; y: number; change: number }
  closed?: boolean
  recordMovedTo?: string
  inheritedFrom?: string
  ownConsecutiveFs?: number
}>()
const schoolYear = computed(() => `${props.campus.year - 1}–${String(props.campus.year).slice(-2)}`)
const rateRows = computed(() => props.rates ? [
  { year: 2025, value: props.rates.x },
  { year: 2026, value: props.rates.y },
] : [])
const trend = computed(() => !props.rates?.change ? 'flat' : props.rates.change > 0 ? 'up' : 'down')
const countTone = computed(() => props.consecutiveFs >= 5 ? 'crossed' : props.consecutiveFs === 4 ? 'near' : 'neutral')
const utilization = computed(() => campusUtilization(props.campus.campusNumber))
const signed = (value: number, digits = 0) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
const utilizationPercent = (value: number | null) => value === null ? 'N/A' : `${value.toFixed(1)}%`
const percent = (value: number) => `${(value * 100).toFixed(1)}%`
</script>

<template>
  <aside class="campus-tooltip" role="tooltip">
    <header class="campus-header">
      <div class="campus-identity">
        <div class="campus-name">{{ campus.campus }}</div>
        <div class="campus-year">{{ schoolYear }} <span>·</span> TEA {{ campus.campusNumber }}</div>
      </div>
      <div class="campus-grade" :data-grade="campus.rating" :aria-label="`Latest letter grade ${campus.rating}, score ${campus.score} out of 100`">
        <span class="grade-label">Latest grade</span>
        <div><strong>{{ campus.rating }}</strong><span class="grade-score">{{ campus.score }}<span>/100</span></span></div>
      </div>
    </header>

    <section v-if="rates" class="campus-rates" aria-label="STAAR pass rates">
      <div class="rates-heading">
        <span>STAAR pass rate</span>
        <strong class="rate-change" :data-trend="trend"><span aria-hidden="true">{{ trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→' }}</span> {{ rates.change > 0 ? '+' : '' }}{{ rates.change.toFixed(1) }} pp</strong>
      </div>
      <div v-for="rate in rateRows" :key="rate.year" class="rate-row" :data-year="rate.year" :data-trend="trend">
        <span class="rate-label">Spring {{ rate.year }}</span>
        <span class="rate-track" aria-hidden="true"><span :style="{ width: `${rate.value}%` }" /></span>
        <strong>{{ rate.value.toFixed(1) }}<span class="unit">%</span></strong>
      </div>
    </section>

    <section class="campus-utilization" aria-label="Estimated campus utilization">
      <div class="rates-heading"><span>Estimated utilization</span><strong>{{ utilization.change === null ? 'N/A' : `${signed(utilization.change, 1)} pp` }}</strong></div>
      <div class="utilization-years"><span>2017–18 <strong>{{ utilizationPercent(utilization.utilizationStart) }}</strong></span><span aria-hidden="true">→</span><span>2025–26 <strong>{{ utilizationPercent(utilization.utilizationEnd) }}</strong></span></div>
      <div class="utilization-enrollment">Enrollment: {{ utilization.start?.toLocaleString('en-US') ?? 'N/A' }} → {{ utilization.end?.toLocaleString('en-US') ?? 'N/A' }}<template v-if="utilization.enrollmentChange !== null"> ({{ signed(utilization.enrollmentChange) }} students)</template></div>
      <div class="utilization-assumption">{{ utilization.capacity ? `Assumes ${utilization.capacity.toLocaleString('en-US')} permanent seats in both years.` : utilization.note }}<template v-if="utilization.capacity && utilization.note"> {{ utilization.note }}</template></div>
    </section>

    <dl class="campus-metrics">
      <div class="metric-row population-row">
        <dt>Economically disadvantaged</dt><dd>{{ percent(campus.ecoDis) }}</dd>
        <div class="population-track" aria-hidden="true"><span :style="{ width: percent(campus.ecoDis) }" /></div>
      </div>
      <div class="metric-row"><dt>Enrollment · {{ schoolYear }}</dt><dd>{{ campus.enrollment.toLocaleString('en-US') }} <span class="value-unit">students</span></dd></div>
      <div class="metric-row count-row" :data-count="countTone">
        <dt>Consecutive F count*</dt>
        <dd><span class="count-steps" aria-hidden="true"><i v-for="n in 5" :key="n" :class="{ filled: n <= consecutiveFs }" /></span><strong>{{ consecutiveFs }}</strong><span class="value-unit">/ 5</span></dd>
      </div>
    </dl>

    <div v-if="inheritedFrom" class="campus-note inherited-note">Inherited from {{ inheritedFrom }} (closed). Own-campus count: {{ ownConsecutiveFs }}.</div>
    <div v-else-if="closed" class="campus-note">Closed for 2026–27.<template v-if="recordMovedTo"> Record moved to {{ recordMovedTo }}.</template></div>
    <div v-else-if="campus.rating === 'D' && consecutiveFs" class="campus-note">The latest D pauses this count.</div>
    <footer class="campus-method">
      <div>*Derived count: D / Not Rated pauses; A–C resets. Five Fs triggers state action.</div>
      <div>Utilization: TEA enrollment ÷ AISD published capacity; pp = percentage points.</div>
      <div v-if="rates">Pass rate: Approaches or above; English tests, excluding science. pp = percentage points.</div>
    </footer>
  </aside>
</template>

<style scoped>
.campus-tooltip {
  box-sizing: border-box;
  padding: calc(1.25 * var(--sw));
  border: 1px solid var(--od-border);
  border-radius: calc(0.65 * var(--sw));
  background: var(--od-surface-raised);
  color: var(--od-text);
  font-size: calc(1.05 * var(--sw));
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}
.campus-header { display: flex; align-items: flex-start; justify-content: space-between; gap: calc(1 * var(--sw)); }
.campus-identity { min-width: 0; }
.campus-name { font-size: calc(1.4 * var(--sw)); font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; }
.campus-year { margin-top: calc(0.6 * var(--sh)); color: var(--od-text-muted); font-size: calc(0.85 * var(--sw)); }
.campus-year > span { margin: 0 calc(0.2 * var(--sw)); }
.campus-grade { --grade-color: #94a3b8; flex-shrink: 0; padding-left: calc(1 * var(--sw)); border-left: 1px solid var(--od-border); }
.campus-grade[data-grade="A"], .campus-grade[data-grade="B"] { --grade-color: #9acb95; }
.campus-grade[data-grade="D"] { --grade-color: #f5b544; }
.campus-grade[data-grade="F"] { --grade-color: #fb8b9c; }
.grade-label { display: block; font-size: calc(0.75 * var(--sw)); color: var(--od-text-muted); }
.campus-grade > div { display: flex; align-items: baseline; gap: calc(0.5 * var(--sw)); }
.campus-grade strong { font-size: calc(2 * var(--sw)); font-weight: 600; line-height: 1.2; color: var(--grade-color); }
.grade-score { font-size: calc(1 * var(--sw)); }
.grade-score > span { color: var(--od-text-muted); font-size: calc(0.8 * var(--sw)); }
.campus-rates { margin-top: calc(1.8 * var(--sh)); padding: calc(1.2 * var(--sh)) 0; border-top: 1px solid var(--od-border); border-bottom: 1px solid var(--od-border); }
.rates-heading { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: calc(0.7 * var(--sh)); font-size: calc(0.95 * var(--sw)); }
.rate-change { font-weight: 550; }
[data-trend="up"] { --trend-color: #9acb95; }
[data-trend="down"] { --trend-color: #fb8b9c; }
[data-trend="flat"] { --trend-color: #cbd5e1; }
.rate-change { color: var(--trend-color); }
.rate-row { display: grid; grid-template-columns: calc(6.1 * var(--sw)) 1fr calc(4.3 * var(--sw)); gap: calc(0.8 * var(--sw)); align-items: center; padding: calc(0.35 * var(--sh)) 0; }
.rate-label { color: var(--od-text-secondary); font-size: calc(0.9 * var(--sw)); }
.rate-row > strong { font-size: calc(1.15 * var(--sw)); font-weight: 550; text-align: right; }
.unit { font-size: calc(0.9 * var(--sw)); color: var(--od-text-muted); }
.rate-track, .population-track { display: block; background: color-mix(in srgb, var(--od-text) 8%, transparent); overflow: hidden; border-radius: 2px; }
.rate-track { height: calc(0.65 * var(--sh)); }
.rate-track > span, .population-track > span { display: block; height: 100%; background: #94a3b8; }
.rate-row[data-year="2026"] .rate-track > span { background: var(--trend-color); }
.campus-utilization { margin-top: calc(1 * var(--sh)); padding-bottom: calc(0.8 * var(--sh)); border-bottom: 1px solid var(--od-border); }
.utilization-years { display: flex; justify-content: space-between; gap: calc(0.6 * var(--sw)); color: var(--od-text-secondary); font-size: calc(0.95 * var(--sw)); }
.utilization-years strong { margin-left: calc(0.5 * var(--sw)); color: var(--od-text); font-size: calc(1.15 * var(--sw)); font-weight: 550; }
.utilization-enrollment { margin-top: calc(0.55 * var(--sh)); font-size: calc(0.85 * var(--sw)); color: var(--od-text-secondary); }
.utilization-assumption { margin-top: calc(0.35 * var(--sh)); font-size: calc(0.75 * var(--sw)); color: var(--od-text-muted); }
.campus-metrics { margin: calc(0.7 * var(--sh)) 0 0; }
.metric-row { display: grid; grid-template-columns: 1fr auto; column-gap: calc(1 * var(--sw)); align-items: center; padding: calc(0.85 * var(--sh)) 0; border-bottom: 1px solid var(--od-border); }
.metric-row dt { color: var(--od-text-secondary); font-size: calc(0.95 * var(--sw)); }
.metric-row dd { margin: 0; white-space: nowrap; font-weight: 500; }
.value-unit { color: var(--od-text-muted); font-size: calc(0.8 * var(--sw)); font-weight: 400; }
.population-track { grid-column: 1 / -1; margin-top: calc(0.6 * var(--sh)); height: calc(0.3 * var(--sh)); }
.population-track > span { background: #94a3b8; opacity: 0.65; }
.count-row { --count-color: #94a3b8; border-bottom: 0; }
.count-row[data-count="near"] { --count-color: #f5b544; }
.count-row[data-count="crossed"] { --count-color: #fb8b9c; }
.count-row dd { display: flex; align-items: center; gap: calc(0.4 * var(--sw)); }
.count-row strong { color: var(--count-color); font-weight: 600; }
.count-steps { display: flex; gap: calc(0.2 * var(--sw)); margin-right: calc(0.35 * var(--sw)); }
.count-steps i { width: calc(0.7 * var(--sw)); height: calc(0.7 * var(--sw)); box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--od-text) 22%, transparent); border-radius: 2px; }
.count-steps i.filled { background: var(--count-color); border-color: var(--count-color); }
.campus-note { margin-top: calc(0.65 * var(--sh)); padding-left: calc(0.65 * var(--sw)); border-left: 2px solid #64748b; color: var(--od-text-secondary); font-size: calc(0.9 * var(--sw)); }
.inherited-note { border-color: #a78bfa; }
.campus-method { margin-top: calc(1.15 * var(--sh)); color: var(--od-text-muted); font-size: calc(0.8 * var(--sw)); line-height: 1.4; }
.campus-method > div + div { margin-top: calc(0.45 * var(--sh)); }
.campus-hover-enter-active, .campus-hover-leave-active {
  transition: opacity 150ms cubic-bezier(0.22, 1, 0.36, 1), transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center left;
}
.campus-hover-enter-from, .campus-hover-leave-to {
  opacity: 0;
  transform: translateY(calc(0.55 * var(--sh))) scale(0.985);
}
@media (prefers-reduced-motion: reduce) {
  .campus-hover-enter-active, .campus-hover-leave-active { transition: none; }
}
@media print { .campus-tooltip { display: none; } }
</style>
