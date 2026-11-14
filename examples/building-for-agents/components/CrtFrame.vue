<script setup lang="ts">
/**
 * CrtFrame: the monitor a recording plays on.
 *
 * Anything that replays a real artifact sits in one of these, so "this really
 * happened" is a visible property of the frame. A bezel in the card color, a
 * recessed screen, faint static scanlines over the screen, and a band along
 * the bezel's lower edge for the figure number and the recording's source.
 * Schematics are drawn straight on the canvas, with no bezel.
 *
 * An svg group for a stage's `#stage` slot. The default slot is the screen's
 * content, in the same viewBox units as everything else on the stage; the
 * scanlines are drawn over it. Nothing here moves.
 */
import { computed, useId } from 'vue'
import { CRT } from './design'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    width: number
    height: number
    /** "FIG. 2" and the like, in yellow at the left of the tag band. */
    fig?: string
    /** The recording's date and source, after the figure number. */
    tag?: string
    /** 0 hides the frame, 1 shows it. */
    progress?: number
    /** 0 is a dark screen, 1 is the picture: a beat can switch the monitor on. */
    power?: number
  }>(),
  { fig: '', tag: '', progress: 1, power: 1 },
)

const id = useId()
const screen = computed(() => ({
  x: props.x + CRT.pad,
  y: props.y + CRT.pad,
  width: props.width - CRT.pad * 2,
  height: props.height - CRT.pad - CRT.tagBand,
}))
const tagY = computed(() => props.y + props.height - CRT.tagBand / 2 + 5)
</script>

<template>
  <g class="sf-crt" :style="{ opacity: String(props.progress) }">
    <defs>
      <pattern :id="`${id}-scan`" :width="CRT.scanPeriod" :height="CRT.scanPeriod" patternUnits="userSpaceOnUse">
        <rect class="sf-crt-scanline" :width="CRT.scanPeriod" :height="CRT.scanHeight" />
      </pattern>
      <clipPath :id="`${id}-clip`">
        <rect class="sf-crt-screen" v-bind="screen" />
      </clipPath>
    </defs>
    <rect class="sf-crt-bezel" :x="props.x" :y="props.y" :width="props.width" :height="props.height" />
    <rect class="sf-crt-screen" v-bind="screen" />
    <g :clip-path="`url(#${id}-clip)`">
      <g :style="{ opacity: String(props.power) }"><slot /></g>
      <rect v-bind="screen" :fill="`url(#${id}-scan)`" />
    </g>
    <text class="sf-pixel is-small is-fig" :x="screen.x + 6" :y="tagY">{{ props.fig }}</text>
    <text class="sf-pixel is-small" :x="screen.x + screen.width - 6" :y="tagY" text-anchor="end" :style="{ opacity: String(props.power) }">
      {{ props.tag }}
    </text>
  </g>
</template>
