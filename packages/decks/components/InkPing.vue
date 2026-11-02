<script setup lang="ts">
/**
 * InkPing: a one-shot focus ring around a mark the beat names.
 *
 * The ring starts at the mark's own outline, grows to about 1.8x its size on
 * SETTLE, and fades out as it goes. It owns no timeline and no keyframe: the
 * whole thing is a pure function of `progress`, a 0..1 field the parent's
 * beat script tweens. Both ends are invisible (nothing renders at 0 or at 1),
 * so a seek in either direction, a presenter view or an export never shows a
 * ring stuck mid flight.
 *
 * Two target shapes, in stage viewBox units:
 *
 * - circle: `x`, `y` (centre) and `r`
 * - rect: `x`, `y` (top left), `width`, `height`, optional `rx`; pass a
 *   `width` to pick this shape. A UnitGrid cell is one of these.
 *
 * Either way the ring scales about the mark's centre. The animated transform
 * and opacity sit on an unfiltered wrapper and the ring inside it is static,
 * the same split InkLine and UnitGrid use to keep the glow filter cached; the
 * stroke is non-scaling so it holds its weight as the ring grows. Clean style
 * gets the soft same-hue glow; marker style draws the same ring unfiltered.
 *
 * ```vue
 * <InkPing :x="c.x - 27" :y="c.y - 27" :width="54" :height="54" :rx="10" hue="rose" :progress="s.ping" />
 * ```
 *
 * Stagger several pings with `stagger(s.ping, i, n, step)` from the barrel.
 *
 * `beacon` swaps the focus ring for a quieter signal: a hairline stroke, a
 * lower peak, a smooth rise and a long eased tail instead of a linear fade,
 * and a fainter echo ring trailing the first. Use it where several marks ping
 * in one beat and a full-weight ring on each would read as a heavy pulse.
 */
import { computed } from 'vue'
import { FILTER_IDS, SETTLE, STROKE, filterUrl, gsap, ink, inkStyle, type Hue, type InkStep } from '../story'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    /** Circle radius. Ignored when `width` is set. */
    r?: number
    /** Rect target: width and height of the mark, `x`/`y` its top left. */
    width?: number
    height?: number
    rx?: number
    hue?: Hue
    step?: InkStep
    /** Explicit ink, overriding `hue`/`step`. */
    color?: string
    /** 0 and 1 are both invisible; the ring grows and fades in between. */
    progress?: number
    /** Hairline ring, soft envelope and a trailing echo. */
    beacon?: boolean
  }>(),
  {
    r: 10,
    width: undefined,
    height: undefined,
    rx: 0,
    hue: 'cyan',
    step: 3,
    color: '',
    progress: 0,
    beacon: false,
  },
)

/** How far past the mark the ring ends, as a share of its size. */
const GROW = 0.8
/** The ring fades up over this share of the progress, then fades out. */
const RISE_SHARE = 0.15
const PEAK = 0.9

/** Beacon envelope: wider reach (2.4x the mark), lower peak, a longer rise. */
const BEACON = { grow: 1.4, peak: 0.75, rise: 0.3, echoLag: 0.24, echoPeak: 0.55 }

const settle: (t: number) => number = gsap.parseEase(SETTLE) ?? ((t) => t)
const smooth = (t: number) => t * t * (3 - 2 * t)

const isRect = computed(() => props.width !== undefined)
const w = computed(() => props.width ?? 0)
const h = computed(() => props.height ?? props.width ?? 0)

const center = computed(() =>
  isRect.value
    ? { x: props.x + w.value / 2, y: props.y + h.value / 2 }
    : { x: props.x, y: props.y },
)

const visible = computed(() => props.progress > 0 && props.progress < 1)

const q = (n: number) => Math.round(n * 1000) / 1000

/** One ring's transform and opacity at local progress `p` (0 and 1 invisible). */
function ringAt(p: number, peak: number) {
  let k: number
  let opacity: number
  if (props.beacon) {
    k = 1 + BEACON.grow * settle(p)
    // Smooth rise, then an eased tail: the ring brightens gently and lingers
    // as it spreads instead of falling off in a straight line.
    opacity = peak * smooth(Math.min(1, p / BEACON.rise)) * Math.pow(1 - p, 1.4)
  } else {
    k = 1 + GROW * settle(p)
    opacity = peak * Math.min(1, p / RISE_SHARE) * (1 - p)
  }
  return {
    transform: `translate(${q(center.value.x)} ${q(center.value.y)}) scale(${q(k)})`,
    opacity: q(opacity),
  }
}

const frame = computed(() => ringAt(props.progress, props.beacon ? BEACON.peak : PEAK))

/** Beacon only: a fainter second ring a little behind the first. */
const echo = computed(() => {
  if (!props.beacon) return null
  const p = (props.progress - BEACON.echoLag) / (1 - BEACON.echoLag)
  if (p <= 0 || p >= 1) return null
  return ringAt(p, BEACON.echoPeak)
})

const strokeWidth = computed(() => (props.beacon ? STROKE.rule : STROKE.line))
const stroke = computed(() => props.color || ink(props.hue, props.step))
const filterAttr = computed(() => (inkStyle() === 'clean' ? filterUrl(FILTER_IDS.glow) : undefined))
</script>

<template>
  <template v-if="visible">
    <g
      v-for="(ring, i) in [frame, echo]"
      :style="{ opacity: ring?.opacity }"
      v-show="ring"
      :key="i"
      class="od-ink-ping"
      :transform="ring?.transform"
      aria-hidden="true"
    >
      <g :filter="filterAttr">
        <rect
          v-if="isRect"
          :x="-w / 2"
          :y="-h / 2"
          :width="w"
          :height="h"
          :rx="props.rx"
          fill="none"
          :stroke="stroke"
          :stroke-width="strokeWidth"
          vector-effect="non-scaling-stroke"
        />
        <circle
          v-else
          :r="props.r"
          fill="none"
          :stroke="stroke"
          :stroke-width="strokeWidth"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </g>
  </template>
</template>
