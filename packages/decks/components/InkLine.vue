<script setup lang="ts">
/**
 * InkLine: one data series as a stroked path (or, in marker style, a chain of
 * dab ribbons) inside the stage svg.
 *
 * Two structural rules, both from the teardown:
 *
 * - the filter sits on a static inner group and the clip animates on an
 *   unfiltered parent, so the expensive filter output stays cached while the
 *   draw on sweeps;
 * - a partial reveal truncates the series and rebuilds the ribbon rather than
 *   masking a full one, so the taper tip is always at the live end.
 *
 * The draw on is one reactive number, `draw.t`, that a caller's timeline
 * tweens through `addDraw`. The clip reads it, and so do the optional data
 * point dots, which pop in as the sweep front passes them rather than being
 * cut in half by the clip edge, and the optional `head`, a small glowing dot
 * riding the front while the sweep is under way. The head exists only while
 * `draw.t` is strictly between 0 and 1 and fades out over the last stretch of
 * the draw, so nothing of it is left on a settled beat or in an export.
 *
 * Geometry is in viewBox units of the 1920x1080 stage, and every seed comes
 * from data identity, so a resize never changes a stroke.
 */
import { computed, reactive, ref } from 'vue'
import theme from '#decks/theme'
import {
  BRUSH_DEFAULTS,
  DRAW,
  DUR,
  FILTER_IDS,
  brushRibbon,
  clamp01,
  filterUrl,
  gsap,
  ink,
  inkStyle,
  polylinePath,
  STROKE,
  xScale,
  yScale,
  type Hue,
  type InkStep,
  type DrawOptions,
  type Point,
} from '../story'

const props = withDefaults(
  defineProps<{
    /** Series in data units. */
    series: Point[]
    xDomain: [number, number]
    yDomain: [number, number]
    /** Pixel range in viewBox units, left to right. */
    xRange: [number, number]
    /** Pixel range in viewBox units, bottom first. */
    yRange: [number, number]
    interp?: 'linear' | 'step'
    hue?: Hue
    /** Ramp step, 1 is the floor and 4 the highlight. */
    step?: InkStep
    /** Fraction of the series to draw, 0 to 1. Truncate and redraw. */
    reveal?: number
    /**
     * Step the line back to slate. A boolean cuts (body and dots ease their
     * opacity in CSS); a 0..1 number is a beat-timeline value, so color and
     * opacity blend with it and seek exactly, with no CSS transition.
     */
    ghost?: boolean | number
    /** Explicit ink, for a parent timeline that recolors between beats. */
    color?: string
    /** Stable id the ink seeds derive from. */
    seed?: string
    /** Nominal ribbon width in viewBox units. */
    width?: number
    /** A dot on every data point, popping in behind the draw front. */
    dots?: boolean
    /**
     * A glowing dot on the draw front while the line sweeps. Off by default.
     * Suppressed while `reveal` is below 1: the front tracks the full series,
     * so on a truncated line it would float past the drawn end.
     */
    head?: boolean
  }>(),
  {
    interp: 'linear',
    hue: 'cyan',
    step: 3,
    reveal: 1,
    ghost: false,
    color: '',
    seed: 'ink-line',
    width: BRUSH_DEFAULTS.width,
    dots: false,
    head: false,
  },
)

/** Dot radius, and how far ahead of the front a dot starts to grow. */
const DOT_RADIUS = 7
const DOT_LEAD = 48

/** Head radius, and the share of the draw over which it fades out at the end. */
const HEAD_RADIUS = 6
const HEAD_FADE = 0.08

const root = ref<SVGGElement | null>(null)

/** 0 is nothing drawn, 1 is the whole line. Tweened by `addDraw`. */
const draw = reactive({ t: 1 })

const sx = computed(() => xScale(props.xDomain, props.xRange))
const sy = computed(() => yScale(props.yDomain, props.yRange))

/** Series projected onto the stage, with step risers inserted if asked. */
const projected = computed<Point[]>(() => {
  const raw = props.series.map((p) => ({ x: sx.value(p.x), y: sy.value(p.y) }))
  if (props.interp !== 'step') return raw

  const out: Point[] = []
  raw.forEach((p, i) => {
    if (i === 0) {
      out.push(p)
      return
    }
    out.push({ x: p.x, y: raw[i - 1].y })
    out.push(p)
  })
  return out
})

/** Cut the polyline at `fraction` of its arc length, interpolating the tip. */
function truncate(points: Point[], fraction: number): Point[] {
  if (fraction >= 1) return points
  if (fraction <= 0 || points.length < 2) return []

  let total = 0
  for (let i = 1; i < points.length; i++)
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)

  const target = total * fraction
  const out: Point[] = [points[0]]
  let walked = 0

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (walked + len >= target) {
      const u = len === 0 ? 0 : (target - walked) / len
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u })
      break
    }
    out.push(b)
    walked += len
  }

  return out.length < 2 ? [] : out
}

const revealed = computed(() => truncate(projected.value, Math.min(1, Math.max(0, props.reveal))))

const clean = computed(() => inkStyle() === 'clean')

const dabs = computed(() =>
  clean.value
    ? []
    : brushRibbon(revealed.value, { seed: `${props.seed}:${props.interp}`, width: props.width }),
)

const path = computed(() => (clean.value ? polylinePath(revealed.value) : ''))

const overpaints = computed(() => dabs.value.filter((d) => d.overpaint !== undefined))

/** A numeric `ghost` is timeline-owned: blended per frame, never transitioned. */
const ghostTweened = computed(() => typeof props.ghost === 'number')
const ghostT = computed(() => (typeof props.ghost === 'number' ? clamp01(props.ghost) : props.ghost ? 1 : 0))
/** Glow and head drop at the midpoint, as they did for the boolean. */
const isGhost = computed(() => ghostT.value >= 0.5)
/** Body and dot opacity at full ghost (`shape.dim`), matched by `.is-ghost` in CSS. */
const GHOST_OPACITY = Number(theme.shape.dim)

const color = computed(() => {
  if (props.color) return props.color
  const t = ghostT.value
  if (t <= 0) return ink(props.hue, props.step)
  if (t >= 1) return ink('slate', 1)
  return `color-mix(in oklab, ${ink('slate', 1)} ${(t * 100).toFixed(1)}%, ${ink(props.hue, props.step)})`
})
const rootStyle = computed(() =>
  ghostTweened.value
    ? { color: color.value, '--od-ink-ghost': String(1 - (1 - GHOST_OPACITY) * ghostT.value) }
    : { color: color.value },
)

/** The clip sweeps the line's own box, so the front is a plain lerp in x. */
const front = computed(() => {
  const pts = projected.value
  if (!pts.length) return 0
  const x0 = pts[0].x
  const x1 = pts[pts.length - 1].x
  return x0 + (x1 - x0) * draw.t
})

/**
 * Each dot grows over the last DOT_LEAD units before the front reaches it,
 * with a small overshoot, and sits at full size once the front is past.
 */
const dotMarks = computed(() => {
  // An undrawn line has no dots. The front starts at the first point, so
  // without this the first dot sits on screen at full size before the line
  // it belongs to has been drawn at all, which reads as stray debris on any
  // stage whose beat script draws the line later than the entrance.
  if (!clean.value || !props.dots || draw.t <= 0) return []
  return props.series.map((p, i) => {
    const x = sx.value(p.x)
    const y = sy.value(p.y)
    const u = clamp01((front.value - x + DOT_LEAD) / DOT_LEAD)
    const r = DOT_RADIUS * (u + 0.45 * Math.sin(Math.PI * u))
    return { key: i, x, y, r: Math.round(r * 100) / 100 }
  })
})

/**
 * The draw-front head: the point on the projected line at the clip's x, so
 * it sits exactly where the sweep has got to. The clip sweeps in x, so the
 * head follows the first segment that spans the front's x.
 */
const headMark = computed(() => {
  const t = draw.t
  const pts = projected.value
  if (!props.head || isGhost.value || props.reveal < 1 || t <= 0 || t >= 1 || pts.length < 2) return null
  const fx = front.value
  let y = pts[pts.length - 1].y
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    if ((fx - a.x) * (fx - b.x) <= 0) {
      y = b.x === a.x ? b.y : a.y + ((b.y - a.y) * (fx - a.x)) / (b.x - a.x)
      break
    }
  }
  const q = (n: number) => Math.round(n * 100) / 100
  return { x: q(fx), y: q(y), opacity: q(clamp01((1 - t) / HEAD_FADE)) }
})

const clipStyle = computed(() => ({ '--od-clip': `${(1 - draw.t) * 100}%` }))

/**
 * Draw on: the front sweeps from the first point to the last. Added to a
 * caller's timeline so beat pacing stays in one place. Defaults to the grow
 * beat rather than the shorter draw beat: DRAW is eased on both ends, and
 * under about half a second the acceleration is too brief to read, so the
 * sweep lands looking linear. A hero line can ask for a longer trace and its
 * own curve.
 */
function addDraw(
  tl: gsap.core.Timeline,
  position?: gsap.Position,
  opts: DrawOptions = {},
): gsap.core.Timeline {
  return tl.fromTo(
    draw,
    { t: 0 },
    { t: 1, duration: opts.duration ?? DUR.grow, ease: opts.ease ?? DRAW },
    position,
  )
}

/**
 * Erase never un-draws backwards. It fades after a hold, then silently
 * re-arms the front so the next entry redraws from scratch.
 */
function addErase(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline {
  tl.to(root.value, { opacity: 0, duration: DUR.opacity }, position ?? `+=${DUR.eraseDelay}`)
  tl.set(draw, { t: 0 }, `+=${DUR.eraseHold}`)
  tl.set(root.value, { opacity: 1 }, '<')
  return tl
}

/** Land on the fully drawn line with no tween. */
function settle(): void {
  draw.t = 1
}

defineExpose({ root, addDraw, addErase, settle })
</script>

<template>
  <g
    ref="root"
    class="od-ink-line-root"
    :class="{ 'is-ghost': !ghostTweened && isGhost, 'is-ghost-tweened': ghostTweened }"
    :style="rootStyle"
  >
    <g class="od-ink-line" :style="clipStyle">
      <g
        v-if="clean"
        class="od-ink-body"
        :filter="isGhost ? undefined : filterUrl(FILTER_IDS.glow)"
      >
        <path
          :d="path"
          fill="none"
          stroke="currentColor"
          :stroke-width="STROKE.line"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <g v-else class="od-ink-body" :filter="filterUrl(FILTER_IDS.marker)">
        <path
          v-for="(dab, i) in dabs"
          :style="{ fillOpacity: dab.fillOpacity }"
          :key="`d${i}`"
          :d="dab.d"
          fill="currentColor"
        />
        <path
          v-for="(dab, i) in overpaints"
          :style="{ fillOpacity: dab.overpaint }"
          :key="`o${i}`"
          :d="dab.d"
          fill="currentColor"
        />
      </g>
    </g>
    <g
      v-if="dotMarks.length"
      class="od-ink-dots"
      :filter="isGhost ? undefined : filterUrl(FILTER_IDS.glow)"
    >
      <circle
        v-for="dot in dotMarks"
        :key="dot.key"
        :cx="dot.x"
        :cy="dot.y"
        :r="dot.r"
        fill="currentColor"
      />
    </g>
    <!-- Moves on the unfiltered wrapper; the filtered dot inside is static. -->
    <g
      v-if="headMark"
      :style="{ opacity: headMark.opacity }"
      class="od-ink-head"
      :transform="`translate(${headMark.x} ${headMark.y})`"
    >
      <g :filter="filterUrl(FILTER_IDS.glow)">
        <circle :r="HEAD_RADIUS" fill="currentColor" />
      </g>
    </g>
  </g>
</template>

<style scoped>
.od-ink-line {
  /* The clip animates on this unfiltered parent; the filtered inner group is
     static, so the filter output stays cached across the sweep. */
  clip-path: inset(0 var(--od-clip, 0%) 0 0);
}
.od-ink-line-root .od-ink-body,
.od-ink-line-root .od-ink-dots {
  /* `ghost` is a boolean, so a stage that toggles it from beat state would
     otherwise cut at the tween midpoint. The CSS mirror of DUR.card eases it. */
  transition: opacity var(--od-dur-card) var(--od-settle);
}
.od-ink-line-root.is-ghost .od-ink-body,
.od-ink-line-root.is-ghost .od-ink-dots {
  opacity: var(--od-dim, 0.4);
}
/* A numeric `ghost` is a beat-timeline value: the root carries the blended
   color (every mark reads currentColor) and this opacity, so a seek lands on
   the exact frame instead of playing a time-based ease the timeline does not
   own. */
.od-ink-line-root.is-ghost-tweened .od-ink-body,
.od-ink-line-root.is-ghost-tweened .od-ink-dots {
  opacity: var(--od-ink-ghost, 1);
  transition: none;
}
</style>
