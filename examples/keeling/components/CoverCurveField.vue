<script setup lang="ts">
/**
 * The cover's field: the whole Mauna Loa monthly record, traced in on load.
 *
 * Drawn at exactly the geometry Slide 2 draws it, on a layer carrying
 * `vt-keeling-line`, so advancing to Slide 2 holds the line still while the
 * axes, headline and card arrive around it. The close slide reuses the field
 * as a ghost with no trace (`ghost`).
 *
 * The trace is enter only and plays on a fresh load or a deep link. Arriving
 * through a view transition (back from Slide 2) the morph is the entrance and
 * the line lands fully drawn. Reduced motion lands it drawn too.
 */
import { nextTick, onScopeDispose, ref, watch } from 'vue'
import {
  DUR,
  TRACE,
  gsap,
  prefersReducedMotion,
  useScriptedDemo,
  viewTransitionInFlight,
  type LineHandle,
} from 'slidev-addon-decks/story'
import { SERIES, X_DOMAIN, Y_DOMAIN } from '../data/record'
import { X_RANGE, Y_RANGE } from '../data/frame'

const props = withDefaults(defineProps<{ ghost?: boolean }>(), { ghost: false })

const line = ref<LineHandle | null>(null)
const { playCount, isActive } = useScriptedDemo()

let tl: gsap.core.Timeline | null = null

function play(): void {
  tl?.kill()
  tl = null
  const handle = line.value
  if (!handle || props.ghost) return
  if (viewTransitionInFlight() || prefersReducedMotion()) {
    handle.settle()
    return
  }
  tl = gsap.timeline()
  handle.addDraw(tl, `+=${DUR.opacity}`, { duration: DUR.trace, ease: TRACE })
}

watch(
  playCount,
  (n) => {
    if (!n || !isActive.value) return
    nextTick(play)
  },
  { immediate: true },
)

onScopeDispose(() => tl?.kill())
</script>

<template>
  <div class="od-stage-layer" :class="{ 'vt-keeling-line': !props.ghost }">
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <InkLine
        ref="line"
        :series="SERIES"
        :x-domain="X_DOMAIN"
        :y-domain="Y_DOMAIN"
        :x-range="X_RANGE"
        :y-range="Y_RANGE"
        hue="cyan"
        :step="3"
        :ghost="props.ghost ? 0.75 : 0"
        head
        seed="keeling-record"
      />
    </svg>
  </div>
</template>
