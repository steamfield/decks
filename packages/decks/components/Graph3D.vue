<script setup lang="ts">
/**
 * Graph3D - the catalog's similarity graph rendered by openchart's WebGL
 * renderer, with a slow idle orbit.
 *
 * Three things are load-bearing and easy to break:
 *
 * 1. The 3D renderer registers itself as an import side effect of
 *    `@opendata-ai/openchart-vue/graph-3d`. If `<Graph>` mounts before that
 *    import resolves, openchart silently renders the 2D canvas renderer
 *    instead, so the whole thing is `v-if`-gated on the import landing.
 * 2. Only the live `/` slide view gets a WebGL context. Slidev keeps the
 *    presenter's next-slide preview and every overview thumbnail mounted, and
 *    each extra 3D mount is another WebGL context. Browsers cap those (around
 *    16) and evict the oldest, which kills the graph on stage. Hence the
 *    `$renderContext === 'slide'` plus `useIsSlideActive()` gate.
 * 3. The renderer auto-fits the camera on every engine tick until the
 *    simulation stops, at its own framing, and ANY camera call from outside
 *    (`flyTo`, `zoomToFit`, `zoomToNode`) permanently disables that auto-fit.
 *    A zoomed view could therefore only land once the simulation stopped,
 *    seconds after the graph was already on screen. So `fitOnLoad` is off and
 *    this component runs its own fit: every frame it asks the renderer for the
 *    fit, then stands the camera `zoom` times closer along the same line. The
 *    first painted frame is already the zoomed framing, and the framing
 *    follows the layout while it expands.
 *
 * The orbit itself is a plain rAF loop: no package `autoRotate` is used,
 * because the 3D renderer drives trackball-style controls whose own rotation
 * fights the fit and the label re-ranking.
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { Graph } from '@opendata-ai/openchart-vue'
import '@opendata-ai/openchart-vue/styles.css'
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import theme from '#decks/theme'
import { CATEGORICAL_COLORS } from '../story'

/** One full revolution of the idle orbit, in seconds. */
const ORBIT_SECONDS = 90

/**
 * Node ceiling for the WebGL renderer. Above this openchart falls back to the
 * 2D canvas path, which would quietly change what the slide shows, so the
 * graph is truncated to the first MAX_NODES instead.
 */
const MAX_NODES = 2000

/**
 * The fit has settled once its distance has drifted less than this fraction
 * over SETTLE_QUIET_MS. The refit stops there and the pose is frozen, so a
 * later drag is not fought.
 */
const SETTLE_DRIFT = 0.01

/** How long the fit distance has to hold within SETTLE_DRIFT. */
const SETTLE_QUIET_MS = 600

/** Floor under that quiet window, covering the first burst of layout expansion. */
const MIN_SETTLE_MS = 1600

/** Idle time after a drag or a wheel before the orbit picks back up. */
const RESUME_IDLE_MS = 4000

/**
 * How long the loop waits for a camera handle before it gives up. Without a
 * ceiling a renderer that never exposes one keeps the loop alive for the life
 * of the slide.
 */
const MAX_HANDLE_WAIT_MS = 12000

interface Graph3DNode {
  id: string
  label?: string
  category?: string
}

interface Graph3DEdge {
  source: string
  target: string
  confidence?: number
}

interface Vec3 {
  x: number
  y: number
  z: number
}

/** The slice of openchart's GraphHandle this component drives. */
interface CameraHandle {
  zoomToFit: (opts?: { duration?: number | 'auto'; padding?: number }) => void
  getCamera: () => { x: number; y: number; k: number; position?: Vec3; target?: Vec3 }
  flyTo: (
    target: { x: number; y: number; position?: Vec3; target?: Vec3 },
    opts?: { duration?: number | 'auto' },
  ) => void
}

const props = withDefaults(
  defineProps<{
    nodes: Graph3DNode[]
    edges: Graph3DEdge[]
    /** Idle orbit. Set false on beats that want a frozen frame to read against. */
    orbit?: boolean
    /** Host opacity, for beats where the graph is background rather than subject. */
    dim?: number
    /**
     * How much closer than the fitted view the camera settles, once the orbit
     * starts. 1 keeps the fit; 2.5 fills the frame with the dense middle.
     */
    zoom?: number
    /** Spec overrides, shallow-merged over the defaults below. */
    spec?: Record<string, unknown>
    legend?: boolean | { interactive?: boolean; counts?: boolean }
  }>(),
  { orbit: true, dim: 1, zoom: 1, spec: undefined, legend: false },
)

const { $renderContext } = useSlideContext()
const isActive = useIsSlideActive()

const inSlideView = computed(() => $renderContext.value === 'slide')
const rendererReady = ref(false)

/**
 * Load the WebGL renderer only where it can be used. The import is a module
 * side effect, so it is safe to await more than once; the flag just tracks
 * whether registration has landed.
 */
watch(
  inSlideView,
  (slideView) => {
    if (!slideView || rendererReady.value) return
    void import('@opendata-ai/openchart-vue/graph-3d')
      .then(() => {
        rendererReady.value = true
      })
      .catch((err: unknown) => {
        console.error('[Graph3D] WebGL renderer failed to load', err)
      })
  },
  { immediate: true },
)

const shouldMount = computed(() => rendererReady.value && inSlideView.value && isActive.value)

// Orbit state lives above the mount watcher below, which runs immediately and
// calls stopLoop() before the orbit section would otherwise have declared it.
let mountedAt = 0
let resumeTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null
let paused = false
let lastFrame = 0

/** Orbit pose, derived from the fit every frame until it settles. */
let radius = 0
let height = 0
let angle = 0
let center: Vec3 = { x: 0, y: 0, z: 0 }

/**
 * The fitted pose. The zoom is expressed against it, so pausing and resuming
 * never compounds the zoom. `settled` freezes it.
 */
let fitRadius = 0
let fitHeight = 0
let settled = false

/** Last fit distance that moved by more than SETTLE_DRIFT, and when. */
let driftAnchor: { distance: number; at: number } | null = null

// Remount on every re-entry so the entrance replays, the house playCount pattern.
const playCount = ref(0)
watch(
  shouldMount,
  (on) => {
    if (on) playCount.value++
    else stopLoop()
  },
  { immediate: true },
)

/** Truncated node set, plus the edges that still have both endpoints. */
const graphData = computed(() => {
  if (props.nodes.length <= MAX_NODES) return { nodes: props.nodes, edges: props.edges }
  console.warn(
    `[Graph3D] ${props.nodes.length} nodes exceeds the ${MAX_NODES} WebGL ceiling; truncating.`,
  )
  const nodes = props.nodes.slice(0, MAX_NODES)
  const kept = new Set(nodes.map((n) => n.id))
  return { nodes, edges: props.edges.filter((e) => kept.has(e.source) && kept.has(e.target)) }
})

/**
 * The snapshot in `data/graph-data.ts` carries id, label, category and edge
 * confidence and nothing else, so there is no importance to size or rank
 * labels by and no edgeType to colour edges by. Node stroke is omitted too:
 * the WebGL renderer draws no ring and warns once per mount when it is asked.
 */
const spec = computed(() => ({
  type: 'graph',
  dimensions: 3,
  nodes: graphData.value.nodes,
  edges: graphData.value.edges,
  // No entrance: its camera pull-back multiplies every fit for the first half
  // second, and the slide runs its own reveal. Camera and hover keep defaults.
  animation: { enter: false },
  encoding: {
    nodeColor: { field: 'category', type: 'nominal' },
    edgeWidth: { field: 'confidence', type: 'quantitative' },
    nodeLabel: { field: 'label' },
  },
  layout: {
    type: 'force',
    clustering: { field: 'category' },
    chargeStrength: -500,
    linkDistance: 100,
    linkStrength: 0.3,
    collisionPadding: 4,
    warmup: 30,
    seed: 42,
  },
  theme: {
    colors: {
      categorical: CATEGORICAL_COLORS,
      background: 'transparent',
      text: theme.chart['graph-label'],
    },
    spacing: { padding: 4 },
  },
  ...props.spec,
}))

// ---------------------------------------------------------------------------
// Orbit
// ---------------------------------------------------------------------------

const hostRef = ref<HTMLElement | null>(null)
const graphRef = shallowRef<CameraHandle | null>(null)

function stopLoop() {
  if (resumeTimer !== null) clearTimeout(resumeTimer)
  resumeTimer = null
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  paused = false
  settled = false
  driftAnchor = null
  fitRadius = 0
  fitHeight = 0
}

function startLoop() {
  if (rafId !== null) return
  angle = 0
  lastFrame = performance.now()
  rafId = requestAnimationFrame(tick)
}

/** Reads the current camera into the orbit pose. False if there is no 3D pose. */
function readPose(): boolean {
  const cam = graphRef.value?.getCamera()
  const position = cam?.position
  const target = cam?.target
  if (!position || !target) return false
  const dx = position.x - target.x
  const dz = position.z - target.z
  radius = Math.hypot(dx, dz)
  if (radius === 0) return false
  height = position.y - target.y
  angle = Math.atan2(dz, dx)
  center = { x: target.x, y: target.y, z: target.z }
  return true
}

/**
 * Ask the renderer for its fit from the current viewing angle and keep the
 * distance as the reference pose. Returns false until the layout has a
 * frame-able extent. Marks the fit settled once the distance stops drifting.
 */
function refit(handle: CameraHandle, now: number): boolean {
  // The first fit adopts the renderer's own viewing angle; later fits keep ours.
  const first = fitRadius === 0
  const keepAngle = angle
  handle.zoomToFit({ duration: 0 })
  if (!readPose()) return false
  if (!first) angle = keepAngle
  fitRadius = radius
  fitHeight = height
  const distance = Math.hypot(radius, height)
  if (
    !driftAnchor ||
    Math.abs(distance - driftAnchor.distance) > SETTLE_DRIFT * driftAnchor.distance
  ) {
    driftAnchor = { distance, at: now }
  } else if (now - driftAnchor.at > SETTLE_QUIET_MS && now - mountedAt > MIN_SETTLE_MS) {
    settled = true
  }
  return true
}

function placeCamera(handle: CameraHandle) {
  handle.flyTo(
    {
      x: center.x,
      y: center.y,
      position: {
        x: center.x + radius * Math.cos(angle),
        y: center.y + height,
        z: center.z + radius * Math.sin(angle),
      },
      target: center,
    },
    { duration: 0 },
  )
}

function tick(now: number) {
  rafId = requestAnimationFrame(tick)
  if (!shouldMount.value) return
  const handle = graphRef.value
  if (!handle) {
    if (now - mountedAt > MAX_HANDLE_WAIT_MS) {
      console.warn(
        `Graph3D: no camera handle after ${MAX_HANDLE_WAIT_MS}ms; giving up on the orbit.`,
      )
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = null
    }
    return
  }
  const dt = (now - lastFrame) / 1000
  lastFrame = now
  if (paused) return
  if (!settled && !refit(handle, now)) return
  if (fitRadius === 0) return
  if (props.orbit) angle += ((Math.PI * 2) / ORBIT_SECONDS) * dt
  const zoom = Math.max(props.zoom, 1)
  radius = fitRadius / zoom
  height = fitHeight / zoom
  placeCamera(handle)
}

/**
 * Hand the camera back on drag or wheel, then pick up again from wherever the
 * user left it. Listeners sit on the host in capture phase rather than on the
 * canvas: the renderer replaces its canvas on a context loss, and the host
 * outlives that.
 */
function onCameraInput() {
  paused = true
  if (resumeTimer !== null) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    resumeTimer = null
    if (!readPose()) return
    // Pick up from wherever the user left the camera: their distance becomes
    // the new reference, so the loop does not snap back.
    const zoom = Math.max(props.zoom, 1)
    fitRadius = radius * zoom
    fitHeight = height * zoom
    settled = true
    paused = false
  }, RESUME_IDLE_MS)
}

watch(playCount, () => {
  stopLoop()
  if (!shouldMount.value) return
  mountedAt = performance.now()
  startLoop()
})

onBeforeUnmount(stopLoop)
</script>

<template>
  <div
    ref="hostRef"
    class="od-graph3d-host"
    :style="{ opacity: String(props.dim) }"
    @pointerdown.capture="onCameraInput"
    @wheel.capture="onCameraInput"
  >
    <Graph
      v-if="shouldMount"
      :key="playCount"
      ref="graphRef"
      :spec="spec"
      dark-mode="force"
      :legend="props.legend"
      :tooltip="false"
      :fit-on-load="false"
      class="od-graph3d"
    />
  </div>
</template>

<style scoped>
.od-graph3d-host {
  width: 100%;
  height: 100%;
  min-height: 1px;
  transition: opacity var(--od-dur-card) var(--od-settle);
}
.od-graph3d {
  width: 100%;
  height: 100%;
}
</style>
