<script setup lang="ts">
/**
 * Clean-only parliament chart, centered at (0, 0) on its baseline. Position
 * with an SVG transform. Groups must total the chamber's 31 seats, in angular
 * order from left to right: { label, seats, filled, step?, progress?, color? }.
 * `color` overrides the neutral `step`; use design.ts party helpers for seats.
 * Group `progress` grows its fill count.
 * The top-level `progress` reveals the seats in angular order (all 0..1).
 * Thresholds are { at, label, progress }, with at a cumulative seat count.
 * `highlight` is { from, to, progress }: a zero-based, half-open seat range.
 * The caller owns direct group labels, evidence tags and the beat timeline.
 * For a unanimous vote, pass one group with seats and filled both the total.
 */
import { computed } from 'vue'
import { clamp01, parliament, type InkStep } from 'slidev-addon-decks/story'
import { ON, OFF, PARLIAMENT, SEAT_ARC_RADIUS, neutral } from './design'

const props = withDefaults(defineProps<{
  groups: readonly { label: string; seats: number; filled: number; step?: InkStep; progress?: number; color?: string }[]
  progress?: number
  thresholds?: readonly { at: number; label: string; progress: number }[]
  highlight?: { from: number; to: number; progress: number }
}>(), { progress: ON, thresholds: () => [] })

const positions = computed(() => parliament.layout(
  props.groups.reduce((sum, group) => sum + group.seats, OFF),
  { radius: SEAT_ARC_RADIUS, rows: PARLIAMENT.rowCount, rowGap: PARLIAMENT.rowGap },
).seats)
const seats = computed(() => {
  let start = OFF
  return props.groups.flatMap(group => {
    const groupStart = start
    start += group.seats
    return Array.from({ length: group.seats }, (_, i) => ({
      ...positions.value[groupStart + i], index: groupStart + i, label: group.label,
      color: group.color ?? neutral(group.step ?? 2),
      fill: clamp01(group.filled * clamp01(group.progress ?? ON) - i),
    }))
  })
})
const thresholdPoint = (at: number, radius: number) => {
  const angle = parliament.thresholdAngle(positions.value, at)
  return { x: Math.cos(angle) * radius, y: -Math.sin(angle) * radius }
}
const ruleStart = SEAT_ARC_RADIUS + PARLIAMENT.seatRadius + PARLIAMENT.rulePadding
const ruleEnd = ruleStart + PARLIAMENT.tickLength
const revealAt = (index: number) => clamp01(clamp01(props.progress) * positions.value.length - index)
const highlightAt = (index: number) => props.highlight && index >= props.highlight.from && index < props.highlight.to
  ? clamp01(props.highlight.progress) : OFF
</script>

<template>
  <g class="seat-arc">
    <g v-for="seat in seats" :key="seat.index" :data-seat="seat.index" :data-group="seat.label"
      :style="{ opacity: revealAt(seat.index) }">
      <circle class="seat" :cx="seat.x" :cy="seat.y" :r="PARLIAMENT.seatRadius * seat.fill" :fill="seat.color" />
      <circle class="seat-highlight" :cx="seat.x" :cy="seat.y" :r="PARLIAMENT.ringRadius"
        :style="{ opacity: highlightAt(seat.index), stroke: neutral(4) }" />
    </g>
    <g v-for="threshold in props.thresholds" :key="threshold.at"
      :style="{ opacity: clamp01(threshold.progress), color: neutral(3) }">
      <line class="threshold" :x1="thresholdPoint(threshold.at, ruleStart).x" :y1="thresholdPoint(threshold.at, ruleStart).y"
        :x2="thresholdPoint(threshold.at, ruleStart + (ruleEnd - ruleStart) * clamp01(threshold.progress)).x"
        :y2="thresholdPoint(threshold.at, ruleStart + (ruleEnd - ruleStart) * clamp01(threshold.progress)).y" />
      <text class="od-stage-note threshold-label" :x="thresholdPoint(threshold.at, PARLIAMENT.labelRadius).x"
        :y="thresholdPoint(threshold.at, PARLIAMENT.labelRadius).y" text-anchor="middle">{{ threshold.label }}</text>
    </g>
  </g>
</template>

<style scoped>
.seat-highlight { fill: none; stroke-width: var(--tx-oval-stroke); }
.threshold { stroke: currentColor; stroke-width: var(--tx-hairline); }
.threshold-label { fill: currentColor; }
</style>
