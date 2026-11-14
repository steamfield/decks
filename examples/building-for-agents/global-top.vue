<script setup lang="ts">
/**
 * The tube: one CRT's glass over every slide of this deck.
 *
 * Slidev draws a deck's `global-top.vue` once, above all slides, so this is
 * the same glass from the cover to the close. It is steamfield.io's home page
 * overlay (`.crt-overlay` in that repo's global.css and home.css): scanlines,
 * an RGB phosphor mask, a glass reflection, rounded tube corners with black
 * past them, a dark falloff along the edges, grain stepped eight times a
 * second, a hum bar that crosses the screen, and a power-on the first time the
 * deck opens in a browser session.
 *
 * It also owns the barrel warp. Each slide's frame takes `filter:
 * url(#sf-barrel)` (styles/index.css), an SVG displacement filter whose map
 * comes from scene/warp.ts, so type, diagrams and the cover's live scene all
 * bend with the glass by the same formula the site's shader uses. The overlay
 * itself is not warped: the glass stays straight and the picture curves.
 *
 * What is deliberately absent: the heavy tape tracking faults. Nothing here or
 * in scene/tape.ts draws a noise bar.
 *
 * Only the real slide view gets the tube. The presenter view, the notes
 * viewer, an embedded deck and print/export draw slides plain: the overlay is
 * fixed to the window, and there it would cover the presenter's own controls
 * or sit across stacked pages. Ambient layers stop under reduced motion.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNav } from '@slidev/client'
import { warpMapUrl, warpScale } from './scene/warp'

const { isPlaying, isPrintMode, isEmbedded } = useNav()
const on = computed(() => isPlaying.value && !isPrintMode.value && !isEmbedded.value)

const tube = ref<HTMLElement | null>(null)
const map = ref('')
const size = ref({ width: 0, height: 0 })
const scale = computed(() => warpScale(size.value.width))
const power = ref(false)

const POWER_KEY = 'sf-tube-power'
/** A little longer than the power-on animation (--sf-tube-power in tokens.css). */
const POWER_MS = 700

let observer: ResizeObserver | null = null
let powerTimer: ReturnType<typeof setTimeout> | undefined

function measure(): void {
  const el = tube.value
  if (el) size.value = { width: el.clientWidth, height: el.clientHeight }
}

/** The slides read this class to know the filter exists and is sized. */
watch(
  () => on.value && size.value.width > 0 && map.value !== '',
  (ready) => document.documentElement.classList.toggle('sf-tube-on', ready),
  { immediate: true },
)

watch(tube, (el) => {
  observer?.disconnect()
  if (!el) return
  observer = new ResizeObserver(measure)
  observer.observe(el)
  measure()
})

onMounted(() => {
  map.value = warpMapUrl()
  // Power-on plays once per browser session, as on the site.
  let seen = true
  try {
    seen = sessionStorage.getItem(POWER_KEY) === '1'
    sessionStorage.setItem(POWER_KEY, '1')
  } catch {
    // Storage blocked: skip the power-on rather than replay it on every load.
  }
  if (!seen && on.value) {
    power.value = true
    powerTimer = setTimeout(() => (power.value = false), POWER_MS)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(powerTimer)
  document.documentElement.classList.remove('sf-tube-on')
})
</script>

<template>
  <!-- `od-slide is-story` gives this host the addon's frame variables
       (--od-fw, --od-fh, --sw), so the glass is exactly the slides' 16:9 box. -->
  <div v-if="on" class="od-slide is-story sf-tube-host" aria-hidden="true">
    <svg class="sf-tube-defs" width="0" height="0">
      <defs>
        <filter id="sf-barrel" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
          <feImage
            :href="map"
            x="0"
            y="0"
            :width="size.width"
            :height="size.height"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap in="SourceGraphic" in2="map" :scale="scale" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    <div ref="tube" class="sf-tube" :class="{ 'is-power': power }">
      <span class="sf-tube-grain" />
      <span class="sf-tube-hum" />
      <span class="sf-tube-power">
        <span class="sf-tube-power-top" />
        <span class="sf-tube-power-bottom" />
        <span class="sf-tube-power-line" />
        <span class="sf-tube-power-wash" />
      </span>
    </div>
  </div>
</template>
