<script setup lang="ts">
/**
 * InkLabeledCard: the house card with a name and an optional note in it.
 *
 * Every architecture, tier and pipeline stage is the same object repeated:
 * a box with a name and a line of detail. `InkCardRect` draws the box;
 * this adds the two typeset lines and the padding they sit at, so a row of
 * boxes lines up without each stage inventing its own text offsets.
 *
 * Type comes from `od-stage-name` and `od-stage-note` in story-marks.css,
 * which is where a stage picks up `od-stage-tag` and `od-stage-value` too.
 * Geometry is in viewBox units of the 1920x1080 stage.
 *
 * The default slot draws on top of the card, in the same coordinate space,
 * for a stage that puts a mark inside the box.
 */
import type { Hue } from '../story'

const props = withDefaults(
  defineProps<{
    /** Card box, in stage viewBox units. */
    x: number
    y: number
    width: number
    height: number
    /** The one line that names the thing. */
    name: string
    /** One short line of detail under it. */
    note?: string
    /** Glow ink. Match the hue of the ink the card sits beside. */
    hue?: Hue
    /** Beat state for a card that lights up. Unset for one that never changes. */
    lit?: boolean
    /** Dash pattern, for a box that reads as not-built-yet. */
    dash?: string
    radius?: number
  }>(),
  { note: '', hue: undefined, lit: undefined, dash: undefined, radius: 12 },
)

/** Text inset, and the two baselines measured from the top of the box. */
const PAD = 30
const NAME_BASELINE = 58
const NOTE_BASELINE = 96
</script>

<template>
  <InkCardRect
    :x="props.x"
    :y="props.y"
    :width="props.width"
    :height="props.height"
    :radius="props.radius"
    :hue="props.hue"
    :lit="props.lit"
    :dash="props.dash"
  >
    <text class="od-stage-name" :x="props.x + PAD" :y="props.y + NAME_BASELINE">
      {{ props.name }}
    </text>
    <text v-if="props.note" class="od-stage-note" :x="props.x + PAD" :y="props.y + NOTE_BASELINE">
      {{ props.note }}
    </text>
    <slot />
  </InkCardRect>
</template>
