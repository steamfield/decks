<script setup lang="ts">
/**
 * PacketPath: a message travelling from one box to another in a system
 * diagram. Every "A sends B something" in the deck moves this way.
 *
 * `points` is a polyline in stage viewBox units and `progress` (0..1) is how
 * far along it the packet is; the dot shows only while it is in flight, so a
 * beat tweens progress from 0 to 1 and the packet arrives and is gone. With
 * `wire`, the path itself is drawn as a faint line. An optional `label` rides
 * above the dot. An svg group for a stage's `#stage` slot.
 */
import { computed } from 'vue'
import { along, polyline, type Pt } from './design'

const props = withDefaults(
  defineProps<{
    points: readonly Pt[]
    progress: number
    /** A CSS color, from ink(). */
    color: string
    radius?: number
    wire?: boolean
    dashed?: boolean
    label?: string
  }>(),
  { radius: 9, wire: false, dashed: false, label: '' },
)

const at = computed(() => along(props.points, props.progress))
const flying = computed(() => props.progress > 0 && props.progress < 1)
</script>

<template>
  <g>
    <path v-if="props.wire" class="sf-wire" :d="polyline(props.points)" :stroke-dasharray="props.dashed ? '4 8' : undefined" />
    <g :style="{ opacity: flying ? '1' : '0' }">
      <circle :cx="at[0]" :cy="at[1]" :r="props.radius" :fill="props.color" />
      <text v-if="props.label" class="sf-mono is-small" :x="at[0]" :y="at[1] - props.radius - 10" text-anchor="middle" :style="{ fill: props.color }">
        {{ props.label }}
      </text>
    </g>
  </g>
</template>
