<script setup lang="ts">
import { computed } from 'vue'
import { xScale, type TickState, type TimelineTick } from 'slidev-addon-decks/story'
import { BASELINE_Y, DIM, OFF, ON, changed, neutral } from './design'
import { collisionTimeline, timelineDisplay } from '../data/07-collision-timeline'

/** Shared axis for the collision and watch stages. Dates are ISO calendar dates. */
const props = withDefaults(defineProps<{
  domainEnd: string
  ticks: readonly { id: string; date: string; label: string; status: string }[]
  position?: number
  state?: TickState[]
  governorProgress?: number
}>(), { governorProgress: OFF })

// Local timeline geometry; the Commissioner row shares the deck's chalk baseline.
const RANGE: [number, number] = [1040, 1740]
const AXIS_Y = 354
const ROWS = [
  { label: timelineDisplay.district, y: BASELINE_Y - 184 },
  { label: timelineDisplay.governor, y: BASELINE_Y - 92 },
  { label: timelineDisplay.commissioner, y: BASELINE_Y },
]
const start = Date.parse(collisionTimeline[0].date)
const inauguration = Date.parse(collisionTimeline.find(event => event.id === 'inauguration')!.date)
const domain = computed<[number, number]>(() => [start, Date.parse(props.domainEnd)])
const scale = computed(() => xScale(domain.value, RANGE))
const position = computed(() => props.position ?? start)
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const ticks = computed<TimelineTick[]>(() => props.ticks.map(tick => ({
  id: tick.id, at: Date.parse(tick.date), label: `${tick.status === 'reported' ? '≈ ' : ''}${dateLabel(tick.date)}`,
  projected: tick.status === 'reported',
})))
const states = computed(() => props.state ?? props.ticks.map(() => ({ ink: ON, lift: OFF })))
const yearLabel = computed(() => [...new Set([collisionTimeline[0].date.slice(0, 4), props.domainEnd.slice(0, 4)])].join(' / '))
</script>

<template>
  <g class="collision-timeline">
    <text class="od-stage-note" :x="RANGE[0]" :y="AXIS_Y - 84">{{ yearLabel }}</text>
    <InkTimeline :ticks="ticks" :state="states" :domain="domain" :range="RANGE" :y="AXIS_Y"
      hue="slate" :label-size="26" :label-rows="3" :row-height="34" :label-offset="36" :tick-height="54" />
    <InkTimelineCursor :position="position" :domain="domain" :range="RANGE" :y="AXIS_Y" hue="amber" />
    <g v-for="(row, i) in ROWS" :key="row.label">
      <text class="od-stage-name" :x="RANGE[0] - 36" :y="row.y + 9" text-anchor="end">{{ row.label }}</text>
      <line :x1="RANGE[0]" :x2="RANGE[1]" :y1="row.y" :y2="row.y" :stroke="neutral()" class="row" />
      <line v-if="i === 1" :x1="scale(inauguration)" :x2="RANGE[1]" :y1="row.y" :y2="row.y"
        :stroke="changed()" :style="{ opacity: props.governorProgress }" class="row" />
    </g>
    <line :x1="scale(position)" :x2="scale(position)" :y1="AXIS_Y + 164" :y2="BASELINE_Y + 22"
      class="date-guide" :style="{ opacity: DIM }" />
    <g v-for="(tick, i) in props.ticks" :key="tick.id" :style="{ opacity: states[i].ink }">
      <circle :cx="scale(Date.parse(tick.date))" :cy="tick.id === 'inauguration' ? ROWS[1].y : ROWS[0].y"
        r="6" :fill="tick.id === 'inauguration' ? changed() : neutral(3)" />
      <foreignObject v-if="tick.status === 'reported'" :x="scale(Date.parse(tick.date)) - 84" :y="AXIS_Y + 126" width="168" height="42">
        <span class="tx-tag is-reported">{{ timelineDisplay.reported }}</span>
      </foreignObject>
    </g>
  </g>
</template>

<style scoped>
.row { stroke-width: var(--tx-oval-stroke); }
.date-guide { stroke: var(--od-amber); stroke-width: var(--tx-hairline); stroke-dasharray: var(--tx-pending-dash); }
:deep(.od-stage-label) { font-family: var(--od-font-sans); fill: var(--od-text-secondary); letter-spacing: var(--tx-body-tracking); }
/* foreignObject is already in SVG coordinates, so use the SVG type token. */
foreignObject .tx-tag { font-size: var(--tx-svg-tag); padding: var(--tx-zero); border: none; }
</style>
