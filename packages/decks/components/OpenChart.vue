<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import type { ChartSpec, LayerSpec, MarkEvent } from '@opendata-ai/openchart-core'
import { Chart } from '@opendata-ai/openchart-vue'
import '@opendata-ai/openchart-vue/styles.css'
import { useIsSlideActive, useSlideContext } from '@slidev/client'

const props = defineProps<{
  spec: ChartSpec | LayerSpec
}>()

const emit = defineEmits<{
  'mark-hover': [event: MarkEvent]
  'mark-leave': []
}>()

const isActive = useIsSlideActive()
const { $clicks, $renderContext } = useSlideContext()
const playCount = ref(0)
const wasActive = ref(false)
/**
 * True when the slide was entered on a later click, which in the real slide
 * view means stepping back onto it. The chart then lands settled instead of
 * regrowing, the way an ink stage skips its entrance on a backward arrival.
 *
 * This reads `$clicks` at the activation edge, which is safe: Slidev derives
 * both the active slide and its click count from the same route, and a slide
 * behind the current one already reports its full click count while
 * inactive, so on a backward arrival the count is never 0 when `isActive`
 * flips. Presenter, overview and export keep the old behavior.
 */
const settled = ref(false)

watch(
  isActive,
  (active) => {
    if (active && !wasActive.value) {
      settled.value = unref($renderContext) === 'slide' && (unref($clicks) ?? 0) > 0
      playCount.value++
    }
    wasActive.value = active
  },
  { immediate: true },
)

// PDF export / SPA fallback: if the slide never becomes active after mount,
// render unconditionally so exported decks still show charts.
onMounted(() => {
  const timer = setTimeout(() => {
    if (playCount.value === 0) playCount.value = 1
  }, 500)
  onBeforeUnmount(() => clearTimeout(timer))
})

const animatedSpec = computed<ChartSpec | LayerSpec>(() => {
  const spec: ChartSpec | LayerSpec = { animation: true, ...props.spec }
  if (!settled.value) return spec
  // `enter: false` is openchart's own settled form (its export path uses it);
  // update stays on, so beat-to-beat recolors still transition.
  const anim = spec.animation
  if (anim === false) return spec
  const base = anim && typeof anim === 'object' ? anim : {}
  return { ...spec, animation: { ...base, enter: false } }
})
</script>

<template>
  <div class="oc-slide-chart" :class="{ 'is-ready': playCount > 0 }">
    <Chart
      v-if="playCount > 0"
      :key="playCount"
      :spec="animatedSpec"
      dark-mode="force"
      :auto-resize="true"
      @mark-hover="emit('mark-hover', $event)"
      @mark-leave="emit('mark-leave')"
    />
  </div>
</template>

<style scoped>
.oc-slide-chart {
  width: 100%;
  height: 100%;
  min-height: 1px;
  opacity: 0;
  transition: opacity 150ms ease;
}
.oc-slide-chart.is-ready {
  opacity: 1;
}
.oc-slide-chart :deep(.oc-root) {
  background: transparent;
}
</style>
