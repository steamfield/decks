<script setup lang="ts">
import { computed } from 'vue'
import { xScale, type TickState, type TimelineTick } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, changed, neutral } from './design'
import { collisionTimeline, timelineDisplay, timelineStatus } from '../data/07-collision-timeline'

/** Shared timeline for the collision and watch stages. Dates are ISO calendar dates. */
const props = withDefaults(defineProps<{
  domainEnd: string
  ticks: readonly { id: string; date: string; label: string; status: string }[]
  position?: number
  state?: TickState[]
  governorProgress?: number
}>(), { governorProgress: OFF })

// Separate district event lines keep the closely spaced December dates readable.
const RANGE: [number, number] = [400, 1740]
const DISTRICT_ROWS = [310, 400, 490]
// The lower two rows stop short of the card's tallest state (top edge at 718).
const GOVERNOR_Y = 580
const COMMISSIONER_Y = 672
const start = Date.parse(collisionTimeline[0].date)
const inauguration = Date.parse(collisionTimeline.find(event => event.id === 'inauguration')!.date)
const domain = computed<[number, number]>(() => [start, Date.parse(props.domainEnd)])
const scale = computed(() => xScale(domain.value, RANGE))
const position = computed(() => props.position ?? start)
const states = computed(() => props.state ?? props.ticks.map(() => ({ ink: ON, lift: OFF })))
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const row = (id: string) => id === 'election' || id === 'inauguration' ? GOVERNOR_Y
  : id === 'order' ? COMMISSIONER_Y : id === 'petitions' ? DISTRICT_ROWS[0]
    : id === 'ratings' ? DISTRICT_ROWS[1] : DISTRICT_ROWS[2]
const marks = computed(() => props.ticks.map((tick, i) => ({
  ...tick, x: scale.value(Date.parse(tick.date)), y: row(tick.id), ink: states.value[i]?.ink ?? ON,
  left: Date.parse(tick.date) > domain.value[0] + (domain.value[1] - domain.value[0]) * 0.7,
  dateLabel: `${tick.status === 'reported' ? '≈ ' : ''}${dateLabel(tick.date)}`,
  statusLabel: tick.status === 'reported' ? timelineDisplay.reported
    : timelineStatus[tick.id] ?? timelineDisplay.pending,
})))
const cursorY = computed(() => {
  const ordered = [...props.ticks].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  const next = ordered.findIndex(tick => Date.parse(tick.date) >= position.value)
  if (next <= 0) return row((next === 0 ? ordered[0] : ordered.at(-1))?.id ?? 'election')
  const before = ordered[next - 1]
  const after = ordered[next]
  const progress = (position.value - Date.parse(before.date)) / (Date.parse(after.date) - Date.parse(before.date))
  return row(before.id) + (row(after.id) - row(before.id)) * progress
})
const months = computed<TimelineTick[]>(() => {
  const date = new Date(start)
  date.setUTCDate(1)
  const ticks: TimelineTick[] = []
  while (date.getTime() <= domain.value[1]) {
    ticks.push({ id: date.toISOString(), at: Math.max(start, date.getTime()),
      label: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) })
    date.setUTCMonth(date.getUTCMonth() + 1)
  }
  return ticks
})
const monthStates = computed(() => months.value.map(() => ({ ink: ON, lift: OFF })))
const yearLabel = computed(() => [...new Set([collisionTimeline[0].date.slice(0, 4), props.domainEnd.slice(0, 4)])].join(' / '))
</script>

<template>
  <g class="collision-timeline">
    <text class="od-stage-note" :x="RANGE[1]" y="186" text-anchor="end">{{ yearLabel }}</text>
    <InkTimeline :ticks="months" :state="monthStates" :domain="domain" :range="RANGE" :y="206"
      hue="slate" :label-size="26" :label-rows="1" :label-offset="36" :tick-height="20" />
    <g :style="{ opacity: DIM }">
      <line v-for="y in [...DISTRICT_ROWS, GOVERNOR_Y, COMMISSIONER_Y]" :key="y"
        :x1="RANGE[0]" :x2="RANGE[1]" :y1="y" :y2="y" :stroke="neutral()" class="row" />
      <path d="M378 310 H366 V490 H378" class="district-bracket" />
    </g>
    <text class="od-stage-name" x="112" y="409">{{ timelineDisplay.district }}</text>
    <text class="od-stage-name" x="112" :y="GOVERNOR_Y + 9">{{ timelineDisplay.governor }}</text>
    <text class="od-stage-name" x="112" :y="COMMISSIONER_Y + 9">{{ timelineDisplay.commissioner }}</text>
    <text class="od-stage-note" :x="RANGE[0]" :y="COMMISSIONER_Y - 18">{{ timelineDisplay.commissionerName }}</text>
    <line :x1="scale(inauguration)" :x2="RANGE[1]" :y1="GOVERNOR_Y" :y2="GOVERNOR_Y"
      :stroke="changed()" :style="{ opacity: props.governorProgress }" class="row" />
    <g v-for="mark in marks" :key="mark.id" :style="{ opacity: mark.ink }">
      <line :x1="mark.x" :x2="mark.x" :y1="mark.y - 14" :y2="mark.y + 14"
        class="event-tick" :class="{ 'is-reported': mark.status === 'reported' }" />
      <text class="od-stage-note" :x="mark.left ? mark.x : mark.x - 18" :y="mark.y - (mark.left ? 40 : 8)"
        :text-anchor="mark.left ? 'middle' : 'end'">{{ mark.dateLabel }}</text>
      <text class="od-stage-name" :x="mark.x + (mark.left ? -18 : 18)" :y="mark.y - 8"
        :text-anchor="mark.left ? 'end' : 'start'">{{ mark.id === 'order' ? timelineDisplay.orderTick : mark.label }}</text>
      <foreignObject :x="mark.left ? mark.x - 278 : mark.x + 18" :y="mark.y + 10" width="260" height="42">
        <div class="evidence" :class="{ 'align-end': mark.left }">
          <span class="tx-tag" :class="mark.status === 'reported' ? 'is-reported' : 'is-pending'">{{ mark.statusLabel }}</span>
        </div>
      </foreignObject>
    </g>
    <InkTimelineCursor :position="position" :domain="domain" :range="RANGE" :y="cursorY" hue="amber" />
  </g>
</template>

<style scoped>
.row { stroke-width: var(--tx-oval-stroke); }
.district-bracket { fill: none; stroke: var(--od-text-muted); stroke-width: var(--tx-hairline); }
.event-tick { stroke: var(--od-text-muted); stroke-width: var(--tx-oval-stroke); }
.event-tick.is-reported { stroke-dasharray: 0 5; stroke-linecap: round; }
.evidence.align-end { text-align: right; }
/* SVG coordinates use SVG type tokens rather than a second frame scaling. */
.collision-timeline foreignObject .tx-tag { font-size: var(--tx-svg-tag); padding: 0.15em 0.35em; }
:deep(.od-stage-label) { font-family: var(--od-font-sans); fill: var(--od-text-secondary); letter-spacing: var(--tx-body-tracking); }
/* The cursor moves between actors; its progress run must not recolor their rows. */
:deep(.timeline-cursor > line) { display: none; }
</style>
