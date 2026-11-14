<script setup lang="ts">
/**
 * NightDriveField: the cover's picture, steamfield.io's hero in miniature.
 *
 * Back to front: sky, stars, the Steamfield mark as the sun, a ridgeline, and
 * a neon grid floor running to the horizon. The ridgeline is data, as it is on
 * the site: the seven-day mean of commits per day across the product repos
 * (data/01-cover.ts). Stars and grid are decoration and say nothing.
 *
 * The entrance is a one-shot settle: the grid light builds, the ridge line
 * draws, and the sun rises a short way into place. After that the cross lines
 * drift toward the viewer. The drift is ambient: it runs only in the real
 * slide view, stops when the slide is not active and under reduced motion, and
 * nothing depends on it. Presenter, overview and export show the settled
 * picture at a fixed phase.
 *
 * Goes in a StoryCover `#field` slot, or behind any cover-style stage.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, unref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import {
  DUR,
  FILTER_IDS,
  SETTLE,
  TRACE,
  filterUrl,
  gsap,
  lerp,
  prefersReducedMotion,
  useScriptedDemo,
  useStageEntrance,
} from 'slidev-addon-decks/story'
import { FIELD, FRAME, OFF, ON, noise } from './design'
import { MARK_PATH, MARK_SIZE, SUNSET_STOPS } from '../data/brand'
import { RIDGE, RIDGE_WINDOW } from '../data/01-cover'

const props = withDefaults(defineProps<{ /** Sit the sun lower, for the close. */ low?: boolean }>(), {
  low: false,
})

const s = reactive({ grid: OFF, ridge: OFF, sun: OFF })
/** Phase of the cross lines, 0..1 of one line spacing. */
const drift = reactive({ p: OFF })

const { clicks, isActive } = useScriptedDemo()
useStageEntrance(
  (tl) => {
    tl.to(s, { grid: ON, duration: DUR.scale, ease: SETTLE })
    tl.to(s, { ridge: ON, duration: DUR.trace, ease: TRACE }, '<')
    tl.to(s, { sun: ON, duration: DUR.bloom, ease: TRACE }, `<+=${DUR.opacity}`)
  },
  { clicks, isActive },
)

const { $renderContext } = useSlideContext()
const inSlideView = unref($renderContext) === 'slide'

/* ── The live scene ──
   In the real slide view, with motion allowed and WebGL2 present, the picture
   is the three.js scene from scene/night-drive.ts, loaded on demand while the
   slide is active and released when it is not (a browser allows only a few
   WebGL contexts, and Slidev keeps neighbouring slides mounted). Until its
   first frame the still picture stays hidden, so two renderings of the same
   scene are never shown together; if it has not drawn within three seconds,
   or fails, the still picture takes over for good, as on the site. */
type Mode = 'still' | 'pending' | 'live'
const canvas = ref<HTMLCanvasElement | null>(null)
const mode = ref<Mode>('still')
/** Bumped per attempt: releasing the scene loses the canvas's WebGL context for
    good, so every start gets a new canvas element. */
const canvasKey = ref(0)
const LIVE_TIMEOUT_MS = 3000
let live: { dispose(): void } | null = null
let liveFailed = false
let visits = 0
let attempt = 0
let fallback: ReturnType<typeof setTimeout> | undefined

function canRunLive(): boolean {
  if (!inSlideView || liveFailed || prefersReducedMotion()) return false
  return typeof WebGL2RenderingContext !== 'undefined'
}

function stopLive(): void {
  attempt++
  clearTimeout(fallback)
  try {
    live?.dispose()
  } finally {
    live = null
    mode.value = 'still'
  }
}

async function startLive(): Promise<void> {
  if (!canRunLive() || live) return
  const mine = ++attempt
  canvasKey.value++
  await nextTick()
  if (mine !== attempt || !canvas.value) return
  mode.value = 'pending'
  fallback = setTimeout(() => {
    if (mine !== attempt || mode.value === 'live') return
    liveFailed = true
    stopLive()
  }, LIVE_TIMEOUT_MS)
  try {
    const { mountNightDrive } = await import('../scene/night-drive')
    if (mine !== attempt || !canvas.value) return
    const el = canvas.value
    live = mountNightDrive(el, RIDGE, {
      horizon: FIELD.horizon / FRAME.height,
      sunX: FIELD.sunX / FRAME.width,
      // The tube overlay's scanline period at this size (--sf-tube-line).
      crtLine: Math.max(3, Math.round((el.clientWidth * 4) / FRAME.width)),
      settled: visits > 1,
      onFirstFrame: () => {
        if (mine !== attempt) return
        clearTimeout(fallback)
        mode.value = 'live'
      },
    })
  } catch (error) {
    // The still picture is the finished figure, so the slide stays whole.
    // Say why once, where a developer will see it.
    console.warn('NightDriveField: live scene unavailable, showing the still picture.', error)
    liveFailed = true
    stopLive()
  }
}

let ambient: gsap.core.Tween | null = null
onMounted(() => {
  if (isActive.value) {
    visits++
    void startLive()
  }
  if (!inSlideView || prefersReducedMotion()) return
  ambient = gsap.to(drift, { p: ON, duration: DUR.bloom, ease: 'none', repeat: -1, paused: !isActive.value })
})
watch(isActive, (active) => {
  if (active) {
    visits++
    ambient?.play()
    void startLive()
  } else {
    ambient?.pause()
    stopLive()
  }
})
onBeforeUnmount(() => {
  ambient?.kill()
  stopLive()
})

/** The still picture shows unless the live scene is loading or drawing. */
const stillOpacity = computed(() => (mode.value === 'still' ? ON : OFF))

const floor = FRAME.height - FIELD.horizon

/* ── Sun ── */
const sink = computed(() => FIELD.sunSink + (props.low ? FIELD.sunSize / 4 : 0))
const sunTransform = computed(() => {
  const top = FIELD.horizon - FIELD.sunSize + sink.value + (ON - s.sun) * FIELD.sunRise
  return `translate(${FIELD.sunX - FIELD.sunSize / 2} ${top}) scale(${FIELD.sunSize / MARK_SIZE})`
})

/* ── Ridge: one point per day, across the whole frame ── */
const ridgePoints = RIDGE.map(
  (h, i) =>
    `${((i / (RIDGE.length - 1)) * FRAME.width).toFixed(1)} ${(FIELD.horizon - h * FIELD.ridgeHeight).toFixed(1)}`,
)
const ridgeLine = `M${ridgePoints.join('L')}`
const ridgeArea = `M0 ${FIELD.horizon}L${ridgePoints.join('L')}L${FRAME.width} ${FIELD.horizon}Z`

/* ── Stars: fixed positions from a seed, never from time ── */
const stars = Array.from({ length: FIELD.stars }, (_, i) => ({
  x: noise(1, i) * FRAME.width,
  y: noise(2, i) * (FIELD.horizon - FIELD.ridgeHeight),
  r: FIELD.starMin + noise(3, i) * FIELD.starSpan,
  o: noise(4, i) * FIELD.starOpacity,
}))

/* ── Grid floor ── */
const fan = Array.from({ length: FIELD.fanCount }, (_, i) => {
  const offset = (i - (FIELD.fanCount - 1) / 2) * FIELD.fanSpacing
  return `M${FIELD.sunX} ${FIELD.horizon}L${FIELD.sunX + offset} ${FRAME.height}`
})
const cross = computed(() =>
  Array.from({ length: FIELD.crossCount }, (_, k) => {
    const t = (k + drift.p) / FIELD.crossCount
    return { y: FIELD.horizon + floor * Math.pow(t, FIELD.crossPower), o: lerp(FIELD.gridFar, FIELD.gridNear, t) }
  }),
)

const label = `Night drive: the Steamfield mark as a setting sun over a ridgeline drawn from ${RIDGE_WINDOW.days} days of commits across ${RIDGE_WINDOW.repos} product repositories.`
</script>

<template>
  <div class="sf-night" :class="{ 'is-live': mode === 'live' }">
  <canvas :key="canvasKey" ref="canvas" class="sf-night-canvas" aria-hidden="true" />
  <svg class="sf-night-drive" :viewBox="FRAME.viewBox" preserveAspectRatio="xMidYMid slice" role="img" :aria-label="label">
    <defs>
      <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
        <stop class="sf-sky-top" offset="0" :stop-opacity="OFF" />
        <stop class="sf-sky-mid" :offset="FIELD.skyMidAt" :stop-opacity="FIELD.skyMidOpacity" />
        <stop class="sf-sky-haze" offset="1" :stop-opacity="FIELD.skyHazeOpacity" />
      </linearGradient>
      <linearGradient id="sf-sunset" x1="0" y1="0" x2="0" y2="1">
        <stop class="sf-sun-1" :offset="SUNSET_STOPS[0]" />
        <stop class="sf-sun-2" :offset="SUNSET_STOPS[1]" />
        <stop class="sf-sun-3" :offset="SUNSET_STOPS[2]" />
        <stop class="sf-sun-4" :offset="SUNSET_STOPS[3]" />
      </linearGradient>
      <radialGradient id="sf-halo">
        <stop class="sf-sun-halo" offset="0" :stop-opacity="FIELD.haloOpacity" />
        <stop class="sf-sun-halo" offset="1" :stop-opacity="OFF" />
      </radialGradient>
      <linearGradient id="sf-floor-fade" x1="0" y1="0" x2="0" y2="1">
        <stop class="sf-fade-0" offset="0" />
        <stop class="sf-fade-1" offset="1" />
      </linearGradient>
    </defs>

    <g :style="{ opacity: String(stillOpacity) }">
    <!-- Sky and stars -->
    <rect x="0" y="0" :width="FRAME.width" :height="FIELD.horizon" fill="url(#sf-sky)" />
    <circle v-for="(star, i) in stars" :key="i" class="sf-star" :cx="star.x" :cy="star.y" :r="star.r" :style="{ opacity: String(star.o) }" />

    <!-- The mark as the sun, with a broad halo -->
    <circle
      :cx="FIELD.sunX"
      :cy="FIELD.horizon - FIELD.sunSize / 2 + sink"
      :r="FIELD.haloRadius"
      fill="url(#sf-halo)"
      :style="{ opacity: String(s.sun) }"
    />
    <g :transform="sunTransform" :style="{ opacity: String(s.sun) }">
      <path :d="MARK_PATH" fill="url(#sf-sunset)" />
    </g>

    <!-- Ground, then the commit ridge in front of the sun -->
    <rect class="sf-ground" x="0" :y="FIELD.horizon" :width="FRAME.width" :height="floor" />
    <path class="sf-ridge-fill" :d="ridgeArea" />
    <path
      class="sf-ridge-line"
      :d="ridgeLine"
      pathLength="1"
      stroke-dasharray="1"
      :stroke-dashoffset="ON - s.ridge"
      :filter="filterUrl(FILTER_IDS.glow)"
    />

    <!-- Grid floor -->
    <g :style="{ opacity: String(s.grid) }">
      <path v-for="(d, i) in fan" :key="`f${i}`" class="sf-grid-line" :d="d" :style="{ opacity: String(FIELD.gridFar + FIELD.gridFar) }" />
      <line
        v-for="(line, k) in cross"
        :key="`c${k}`"
        class="sf-grid-line"
        x1="0"
        :x2="FRAME.width"
        :y1="line.y"
        :y2="line.y"
        :style="{ opacity: String(line.o) }"
      />
      <line class="sf-horizon" x1="0" :x2="FRAME.width" :y1="FIELD.horizon" :y2="FIELD.horizon" :style="{ opacity: String(FIELD.horizonOpacity) }" />
    </g>
    <rect
      x="0"
      :y="FIELD.horizon + floor * FIELD.fadeFrom"
      :width="FRAME.width"
      :height="floor * (ON - FIELD.fadeFrom)"
      fill="url(#sf-floor-fade)"
    />

    </g>

  </svg>
  </div>
</template>
