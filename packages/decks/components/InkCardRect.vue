<script setup lang="ts">
/**
 * InkCardRect: the house card, drawn in the stage's viewBox.
 *
 * The frontend's `.doc-card` reproduced in SVG, which is what every box on a
 * story stage is: a flat surface rect, one corner-anchored radial glow over
 * it, and a hairline stroke. Elevation comes from the glow and the stroke, not
 * from a shadow. Four stages had written this out three rects at a time, each
 * with its own hand-numbered gradient id.
 *
 * The gradient id comes from Vue's `useId`, so two instances on one slide
 * cannot collide and no caller has to invent a naming scheme.
 *
 * Nothing but SVG comes out of here: it lives in `StoryStage`'s `#stage` slot.
 * The default slot draws on top of the card, in the same coordinate space.
 */
import { computed, useId } from 'vue'
import { FILTER_IDS, STROKE, filterUrl, ink, type Hue } from '../story'

const props = withDefaults(
  defineProps<{
    /** Card box, in stage viewBox units. */
    x: number
    y: number
    width: number
    height: number
    radius?: number
    /** Fill of the flat rect under the glow. */
    surface?: string
    /** Glow ink. Defaults to `currentColor`, so a parent `g` can drive it. */
    hue?: Hue
    /** Corner the glow is anchored in, in bounding box units. */
    glowCx?: number
    glowCy?: number
    /** Glow radius and the offset it has faded out by, in bounding box units. */
    glowR?: number
    glowEdge?: number
    /** Opacity of the glow at its anchor. */
    glowOpacity?: number
    /**
     * Beat state for a card that lights up: `false` hides the glow, `true`
     * shows it, and both ease the glow and the stroke over the card duration.
     * Leave it unset for a card that never changes.
     */
    lit?: boolean
    stroke?: string
    strokeWidth?: number
    strokeOpacity?: number
    /** Dash pattern, for a box that reads as not-built-yet. */
    dash?: string
    /** Put the soft same-hue glow filter on the stroke. */
    glowFilter?: boolean
  }>(),
  {
    radius: 12,
    surface: 'var(--od-surface)',
    hue: undefined,
    glowCx: 0,
    glowCy: 0,
    glowR: 1,
    glowEdge: 1,
    glowOpacity: 0.12,
    lit: undefined,
    stroke: 'currentColor',
    strokeWidth: STROKE.rule,
    strokeOpacity: 1,
    dash: undefined,
    glowFilter: false,
  },
)

const gradientId = `od-card-glow-${useId()}`
const glowInk = computed(() => (props.hue ? ink(props.hue, 3) : 'currentColor'))
</script>

<template>
  <g :class="{ 'is-lit': props.lit === true, 'is-unlit': props.lit === false }">
    <defs>
      <radialGradient
        :id="gradientId"
        :cx="props.glowCx"
        :cy="props.glowCy"
        :r="props.glowR"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0" :stop-color="glowInk" :stop-opacity="props.glowOpacity" />
        <stop :offset="props.glowEdge" :stop-color="glowInk" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect
      :x="props.x"
      :y="props.y"
      :width="props.width"
      :height="props.height"
      :rx="props.radius"
      :fill="props.surface"
    />
    <rect
      :x="props.x"
      :y="props.y"
      :width="props.width"
      :height="props.height"
      :rx="props.radius"
      :fill="`url(#${gradientId})`"
      class="od-card-glow"
    />
    <rect
      :x="props.x"
      :y="props.y"
      :width="props.width"
      :height="props.height"
      :rx="props.radius"
      fill="none"
      :stroke="props.stroke"
      :stroke-width="props.strokeWidth"
      :stroke-opacity="props.strokeOpacity"
      :stroke-dasharray="props.dash"
      :filter="props.glowFilter ? filterUrl(FILTER_IDS.glow) : undefined"
      class="od-card-stroke"
    />
    <slot />
  </g>
</template>

<style scoped>
/* A card with a `lit` state eases its glow and stroke between the two. */
.is-lit .od-card-glow,
.is-unlit .od-card-glow {
  transition: opacity var(--od-dur-card) var(--od-settle);
}
.is-unlit .od-card-glow {
  opacity: 0;
}
.is-lit .od-card-stroke,
.is-unlit .od-card-stroke {
  transition: stroke-opacity var(--od-dur-card) var(--od-settle);
}
</style>
