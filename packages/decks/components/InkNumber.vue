<script setup lang="ts">
/**
 * InkNumber: one large tabular figure growing off a baseline.
 *
 * Named Ink rather than Big because `Bi` is an iconify collection prefix and
 * Slidev's icon resolver claims any component whose name starts with it.
 *
 * It sits in the HTML overlay rather than the stage svg, because it is
 * typeset: the deck never filters text, and a number this size has to hold
 * lining tabular figures so a count up does not shift its own width.
 *
 * Two growth modes. A purely numeric value counts up; anything else (a
 * qualified figure like "~90%", a currency string) scales up off its own
 * baseline, because counting through the intermediate values of a modeled
 * number would read as precision the number does not have.
 */
import { computed, reactive } from 'vue'
import { DUR, gsap, ink, resolvePosition, type GrowHandle, type Hue, type InkStep } from '../story'

const props = withDefaults(
  defineProps<{
    /** The figure itself. Numeric strings count up; anything else scales in. */
    value: string
    /** Small label under the figure. */
    label?: string
    hue?: Hue
    step?: InkStep
    /** Figure size in vw, so it tracks the stage rather than the viewport. */
    size?: number
    /** Count up rather than scale in, when the value is numeric. */
    count?: boolean
    prefix?: string
    suffix?: string
  }>(),
  { label: '', hue: 'emerald', step: 3, size: 6.4, count: true, prefix: '', suffix: '' },
)

/**
 * The figure as a number, if it is one. Thousands separators are stripped
 * first: without that, `Number('8,000')` is NaN, the figure falls back to
 * scaling in, and one number in a row scales while its neighbours count.
 */
const numeric = computed(() => {
  const bare = props.value.replace(/,/g, '')
  const n = Number(bare)
  return Number.isFinite(n) && bare.trim() !== '' ? n : null
})

/** The source value carries its own grouping, so the count keeps it. */
const grouped = computed(() => props.value.includes(','))

const countable = computed(() => props.count && numeric.value !== null)

/** Decimal places to hold steady while counting. */
const places = computed(() => {
  const dot = props.value.indexOf('.')
  return dot === -1 ? 0 : props.value.length - dot - 1
})

const s = reactive({ n: 0, grow: 0 })

const shown = computed(() => {
  if (!countable.value) return props.value
  if (!grouped.value) return s.n.toFixed(places.value)
  return s.n.toLocaleString('en-US', {
    minimumFractionDigits: places.value,
    maximumFractionDigits: places.value,
  })
})

const color = computed(() => ink(props.hue, props.step))

const figureStyle = computed(() => ({
  color: color.value,
  fontSize: `calc(${props.size} * var(--sw))`,
  opacity: String(s.grow),
  transform: countable.value ? 'none' : `scaleY(${0.3 + 0.7 * s.grow})`,
}))

/**
 * Grow the figure. Add it to the caller's beat timeline.
 *
 * Appends by default (`resolvePosition` explains why `'<'` is the wrong
 * default for a beat script), and resolves to an absolute time so the count
 * rides alongside the grow rather than queueing behind it.
 */
function addGrow(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline {
  const at = resolvePosition(tl, position ?? '>')
  tl.to(s, { grow: 1, duration: DUR.grow }, at)
  if (countable.value) {
    tl.to(s, { n: numeric.value as number, duration: DUR.grow }, at)
  }
  return tl
}

defineExpose({ addGrow } satisfies GrowHandle)
</script>

<template>
  <div class="od-bignum">
    <div class="od-bignum-figure" :style="figureStyle">
      <span v-if="props.prefix">{{ props.prefix }}</span
      >{{ shown }}<span v-if="props.suffix">{{ props.suffix }}</span>
    </div>
    <div v-if="props.label" class="od-bignum-label" :style="{ opacity: String(s.grow) }">
      {{ props.label }}
    </div>
  </div>
</template>

<style scoped>
.od-bignum {
  display: block;
}
.od-bignum-figure {
  /* The baseline is the bottom edge: the figure grows off the rule it sits on. */
  transform-origin: left bottom;
  font-family: var(--od-font-sans);
  font-weight: 590;
  font-size: calc(6.4 * var(--sw));
  line-height: 0.92;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings:
    'tnum' 1,
    'lnum' 1;
}
.od-bignum-label {
  margin-top: calc(0.7 * var(--sh));
  font-size: calc(1.1 * var(--sw));
  font-weight: 400;
  letter-spacing: 0.01em;
  color: var(--od-text-muted);
}
</style>
