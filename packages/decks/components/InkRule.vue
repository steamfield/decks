<script setup lang="ts">
/**
 * InkRule: one horizontal hairline in the stage.
 *
 * Axes on a story slide are hairline rules and two labels: no axis lines, no
 * ticks. The rule filter has the least grain and the least warp of the six,
 * so a rule reads as a ruled line rather than as a mark.
 */
import { computed, ref } from 'vue'
import {
  DRAW,
  DUR,
  FILTER_IDS,
  brushRibbon,
  filterUrl,
  gsap,
  ink,
  inkStyle,
  STROKE,
  type Hue,
  type InkStep,
} from '../story'

const props = withDefaults(
  defineProps<{
    x1: number
    x2: number
    y: number
    hue?: Hue
    step?: InkStep
    width?: number
    seed?: string
    opacity?: number
  }>(),
  { hue: 'slate', step: 1, width: 2.6, seed: 'ink-rule', opacity: 0.55 },
)

const root = ref<SVGGElement | null>(null)

const clean = computed(() => inkStyle() === 'clean')

const dabs = computed(() =>
  clean.value
    ? []
    : brushRibbon(
        [
          { x: props.x1, y: props.y },
          { x: props.x2, y: props.y },
        ],
        {
          seed: `${props.seed}:${props.y}`,
          width: props.width,
          taperIn: 0.02,
          taperOut: 0.02,
          startWidth: 0.7,
          endWidth: 0.7,
          wobble: 0.7,
          edge: 0.4,
        },
      ),
)

const color = computed(() => ink(props.hue, props.step))

function addDraw(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline {
  return tl.fromTo(
    root.value,
    { '--od-clip': '100%' },
    { '--od-clip': '0%', duration: DUR.draw, ease: DRAW },
    position,
  )
}

defineExpose({ root, addDraw })
</script>

<template>
  <g ref="root" class="od-ink-rule" :style="{ color, opacity: props.opacity }">
    <line
      v-if="clean"
      :x1="props.x1"
      :x2="props.x2"
      :y1="props.y"
      :y2="props.y"
      stroke="currentColor"
      :stroke-width="STROKE.rule"
      stroke-linecap="round"
    />
    <g v-else :filter="filterUrl(FILTER_IDS.rule)">
      <path
        v-for="(dab, i) in dabs"
        :style="{ fillOpacity: dab.fillOpacity }"
        :key="i"
        :d="dab.d"
        fill="currentColor"
      />
    </g>
  </g>
</template>

<style scoped>
.od-ink-rule {
  /* The clip animates on this unfiltered parent; the filtered inner group is
     static, so the filter output stays cached across the sweep. */
  clip-path: inset(0 var(--od-clip, 0%) 0 0);
}
</style>
