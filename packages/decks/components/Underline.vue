<script setup lang="ts">
/**
 * Underline: a hand drawn underline under one word.
 *
 * The mark is an HTML overlay rather than stage ink, because it has to track
 * a typeset word whose width depends on font loading and viewport size. A
 * ResizeObserver re-measures the host; the seed comes from the word itself,
 * so the same word is always underlined the same way.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  FILTER_IDS,
  brushRibbon,
  filterUrl,
  hashSigned,
  ink,
  inkStyle,
  type Hue,
  type InkStep,
} from '../story'

const props = withDefaults(
  defineProps<{
    hue?: Hue
    step?: InkStep
    /** Mark height in css pixels. */
    thickness?: number
  }>(),
  { hue: 'amber', step: 3, thickness: 5 },
)

const host = ref<HTMLElement | null>(null)
const width = ref(0)
const word = ref('')

const height = computed(() => Math.max(props.thickness * 3, 12))

const clean = computed(() => inkStyle() === 'clean')

/** Clean mode: one gently bowed stroke under the word. */
const cleanPath = computed(() => {
  if (width.value < 4) return ''
  const mid = height.value / 2
  const w = width.value
  return `M1 ${mid} Q${w / 2} ${mid + props.thickness * 0.6} ${w - 1} ${mid}`
})

const dabs = computed(() => {
  if (clean.value || width.value < 4) return []
  const seed = `underline:${word.value}`
  const mid = height.value / 2
  const lift = hashSigned(seed, 1, props.thickness)
  return brushRibbon(
    [
      { x: 1, y: mid + lift },
      { x: width.value / 2, y: mid + hashSigned(seed, 2, props.thickness) },
      { x: width.value - 1, y: mid - lift },
    ],
    {
      seed,
      width: props.thickness,
      taperIn: 0.14,
      taperOut: 0.22,
      wobble: props.thickness * 0.22,
      edge: props.thickness * 0.16,
      samples: 9,
    },
  )
})

const color = computed(() => ink(props.hue, props.step))

let observer: ResizeObserver | null = null

function measure(): void {
  const el = host.value
  if (!el) return
  width.value = el.offsetWidth
  word.value = (el.textContent ?? '').trim()
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'undefined' || !host.value) return
  observer = new ResizeObserver(measure)
  observer.observe(host.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <span ref="host" class="od-underline">
    <slot />
    <svg
      v-if="dabs.length || cleanPath"
      class="od-underline-mark"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      aria-hidden="true"
      :style="{ color }"
    >
      <path
        v-if="clean"
        :d="cleanPath"
        fill="none"
        stroke="currentColor"
        :stroke-width="props.thickness * 0.6"
        stroke-linecap="round"
      />
      <g v-else :filter="filterUrl(FILTER_IDS.dry)">
        <path
          v-for="(dab, i) in dabs"
          :style="{ fillOpacity: dab.fillOpacity }"
          :key="i"
          :d="dab.d"
          fill="currentColor"
        />
      </g>
    </svg>
  </span>
</template>

<style scoped>
.od-underline {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}
.od-underline-mark {
  position: absolute;
  left: 0;
  bottom: -0.32em;
  pointer-events: none;
  overflow: visible;
}
</style>
