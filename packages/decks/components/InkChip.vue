<script setup lang="ts">
/**
 * InkChip: a small dark note beside a point on the stage.
 *
 * The house card surface at chip scale (one faint corner glow in the chip's
 * hue over the surface colour, a hairline border, no shadow), so a note reads
 * as part of the chart it sits on rather than a sticker over it. It replaced
 * the white callout chip deck-wide; there is no loud version.
 *
 * Anchored 10px right of `x`, vertically centred on `y`. `anchor="right"` puts
 * the chip's right edge at `x`, for a note that has to sit left of its point.
 * `progress` is 0..1 from the parent's timeline: opacity plus a short rise.
 *
 * `href` turns the chip into a link that opens in a new tab: the glow deepens
 * to a diagonal wash of the hue and the border takes the hue, so a row of
 * them reads as places to go rather than as labels. The overlay swallows
 * pointer events, so a linked chip opts back in once it is on screen.
 */
import { computed } from 'vue'
import { RISE, STAGE, ink, prefersReducedMotion, type Hue } from '../story'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    text: string
    hue?: Hue
    anchor?: 'left' | 'right'
    progress?: number
    href?: string
    /** Larger, and allowed to wrap: a note that has to be read on its own. */
    wide?: boolean
  }>(),
  { hue: 'cyan', anchor: 'left', progress: 1, href: undefined, wide: false },
)

/** The rise under the fade; dropped under reduced motion, where only the fade stays. */
const rise = prefersReducedMotion() ? 0 : RISE.card

const style = computed(() => ({
  ...(props.anchor === 'right'
    ? { right: `${((STAGE.width - props.x) / STAGE.width) * 100}%` }
    : { left: `calc(${(props.x / STAGE.width) * 100}% + 10px)` }),
  top: `${(props.y / STAGE.height) * 100}%`,
  opacity: String(props.progress),
  transform: `translateY(-50%) translateY(${(1 - props.progress) * rise}px)`,
  pointerEvents: props.href && props.progress > 0.5 ? 'auto' : 'none',
  '--od-chip-ink': ink(props.hue, 3),
}))
</script>

<template>
  <component
    :is="props.href ? 'a' : 'div'"
    class="od-inkchip"
    :class="{ 'is-link': !!props.href, 'is-wide': props.wide }"
    :style="style"
    :href="props.href"
    :target="props.href ? '_blank' : undefined"
    :rel="props.href ? 'noopener' : undefined"
  >
    {{ props.text }}
  </component>
</template>

<style scoped>
.od-inkchip {
  position: absolute;
  padding: calc(0.4 * var(--sw)) calc(0.7 * var(--sw));
  border: var(--od-hairline, 1px) solid var(--od-border);
  border-radius: 6px;
  background:
    radial-gradient(
      120% 140% at 0% 0%,
      color-mix(in srgb, var(--od-chip-ink) 14%, transparent),
      transparent 70%
    ),
    color-mix(in srgb, var(--od-surface) 92%, transparent);
  color: var(--od-text);
  font-family: var(--od-font-sans);
  font-size: calc(0.9 * var(--sw));
  font-weight: 590;
  letter-spacing: -0.012em;
  white-space: nowrap;
  pointer-events: none;
  /* Only `top` animates on a prop change, so a moving readout never slides sideways. */
  transition: top var(--od-dur-card) var(--od-settle);
}
.od-inkchip.is-wide {
  max-width: calc(16 * var(--sw));
  padding: calc(0.6 * var(--sw)) calc(0.9 * var(--sw));
  border-radius: 8px;
  font-size: calc(1.1 * var(--sw));
  line-height: 1.3;
  white-space: normal;
}
/* A linked chip: the hue washes across it and edges it. Slidev's layouts-base
   gives every `a` in a slide a dashed bottom border; the chip's own border
   is the frame here. */
.od-inkchip.is-link {
  padding: calc(0.55 * var(--sw)) calc(1 * var(--sw));
  border: var(--od-hairline, 1px) solid color-mix(in srgb, var(--od-chip-ink) 45%, var(--od-border));
  border-radius: 8px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--od-chip-ink) 26%, transparent) 0%,
      color-mix(in srgb, var(--od-chip-ink) 6%, transparent) 60%,
      transparent 100%
    ),
    var(--od-surface);
  color: var(--od-text);
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color var(--od-dur-card) var(--od-settle),
    background var(--od-dur-card) var(--od-settle);
}
.od-inkchip.is-link:hover,
.od-inkchip.is-link:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--od-chip-ink) 80%, var(--od-border));
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--od-chip-ink) 38%, transparent) 0%,
      color-mix(in srgb, var(--od-chip-ink) 12%, transparent) 60%,
      transparent 100%
    ),
    var(--od-surface);
}
</style>
