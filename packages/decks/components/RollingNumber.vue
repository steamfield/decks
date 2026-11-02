<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Animated stat number for the big-metric template. Rolls from 0 up to the
 * target value with an organic ease-out when the slide scrolls into view, and
 * replays on every revisit (same IntersectionObserver pattern as OpenChart.vue).
 *
 * Pass the display value as a string: the leading number animates, any prefix
 * (e.g. "+") and suffix (e.g. "M", "%", "k") are preserved and the decimal
 * precision is inferred from the target so "99.9%" counts up with one decimal.
 *
 * Respects prefers-reduced-motion: snaps straight to the final value.
 */
const props = withDefaults(
  defineProps<{
    value: string | number
    /** Animation duration in ms. */
    duration?: number
  }>(),
  { duration: 1100 },
)

// Split "1.1M" -> prefix "", number 1.1, suffix "M"; "+18k" -> "+", 18, "k".
const parsed = computed(() => {
  const m = String(props.value).match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/)
  if (!m) return null
  const [, prefix, rawNum, suffix] = m
  const target = parseFloat(rawNum.replace(/,/g, ''))
  const dot = rawNum.indexOf('.')
  const decimals = dot === -1 ? 0 : rawNum.length - dot - 1
  const grouped = rawNum.includes(',')
  return { prefix, target, suffix, decimals, grouped }
})

const host = ref<HTMLElement | null>(null)
const display = ref(String(props.value))
let observer: IntersectionObserver | null = null
let raf = 0
let wasVisible = false

function format(n: number) {
  const p = parsed.value!
  const fixed = n.toFixed(p.decimals)
  const withGroups = p.grouped
    ? Number(fixed).toLocaleString('en-US', {
        minimumFractionDigits: p.decimals,
        maximumFractionDigits: p.decimals,
      })
    : fixed
  return `${p.prefix}${withGroups}${p.suffix}`
}

// Ease-out cubic: fast start, organic settle: no overshoot (data, not toys).
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function play() {
  const p = parsed.value
  if (!p) return
  cancelAnimationFrame(raf)

  const reduce =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    display.value = props.value
    return
  }

  let start = 0
  const step = (ts: number) => {
    if (!start) start = ts
    const t = Math.min((ts - start) / props.duration, 1)
    display.value = format(p.target * easeOut(t))
    if (t < 1) raf = requestAnimationFrame(step)
    else display.value = props.value // exact final string
  }
  display.value = format(0)
  raf = requestAnimationFrame(step)
}

onMounted(() => {
  if (!host.value || typeof IntersectionObserver === 'undefined') {
    display.value = props.value
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting ?? false
      if (visible && !wasVisible) play()
      wasVisible = visible
    },
    { threshold: 0.4 },
  )
  observer.observe(host.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(raf)
})
</script>

<template>
  <span ref="host">{{ display }}</span>
</template>
