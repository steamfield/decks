<script setup lang="ts">
/** Clean-only ballot mark: the fill grows radially inside a fixed outline. */
import { computed, useId } from 'vue'
import { changed, risk, neutral, OVAL, HATCH, DASH, ON, OFF } from './design'

const props = withDefaults(defineProps<{
  cx: number
  cy: number
  size?: number
  state?: 'empty' | 'filled' | 'hatched'
  meaning?: 'changed' | 'risk' | 'neutral'
  fill?: number
  pending?: boolean
}>(), { size: OVAL.size, state: 'empty', meaning: 'neutral', fill: ON, pending: false })

const patternId = `tx-hatch-${useId()}`
const color = computed(() => ({ changed, risk, neutral })[props.meaning]())
const progress = computed(() => Math.max(OFF, Math.min(ON, props.fill)))
const rx = computed(() => OVAL.rx * props.size)
const ry = computed(() => OVAL.ry * props.size)
</script>

<template>
  <g class="tx-oval" :transform="`translate(${props.cx} ${props.cy})`" :style="{ color }">
    <defs v-if="props.state === 'hatched'">
      <pattern :id="patternId" patternUnits="userSpaceOnUse" :width="HATCH.spacing" :height="HATCH.spacing">
        <path :d="HATCH.path" class="tx-hatch" />
      </pattern>
    </defs>
    <ellipse v-if="props.state !== 'empty'" class="tx-oval-fill" :rx="rx" :ry="ry"
      :fill="props.state === 'hatched' ? `url(#${patternId})` : color"
      :transform="`scale(${progress})`" />
    <ellipse class="tx-oval-outline" :rx="rx" :ry="ry" :stroke-dasharray="props.pending ? DASH : undefined" />
  </g>
</template>
