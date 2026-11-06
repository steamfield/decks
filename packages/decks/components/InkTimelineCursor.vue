<script setup lang="ts">
/**
 * InkTimelineCursor: a quiet current-step marker for an `InkTimeline`.
 *
 * A filled run from the start of the range to the cursor, and a hollow dot at
 * the cursor. `position` is in the timeline's domain units and belongs to the
 * parent's seekable beat timeline (tween a reactive field, pass it here), so
 * forward, backward and direct entry all land on the same frame. Pass the same
 * `domain`, `range` and `y` the `InkTimeline` uses.
 */
import { computed } from 'vue'
import { STROKE, ink, xScale, type Hue } from '../story'

const props = defineProps<{
  position: number
  domain: [number, number]
  range: [number, number]
  y: number
  hue: Hue
}>()
const x = computed(() => xScale(props.domain, props.range)(props.position))
</script>

<template>
  <g class="timeline-cursor" :style="{ color: ink(props.hue, 3) }">
    <line
      :x1="props.range[0]"
      :x2="x"
      :y1="props.y"
      :y2="props.y"
      stroke="currentColor"
      :stroke-width="STROKE.faint"
    />
    <circle :cx="x" :cy="props.y" r="9" class="cursor-dot" stroke="currentColor" :stroke-width="STROKE.tick" />
  </g>
</template>

<style scoped>
.cursor-dot {
  fill: var(--od-canvas);
}
</style>
