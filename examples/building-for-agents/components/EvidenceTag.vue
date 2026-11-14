<script setup lang="ts">
/**
 * EvidenceTag: the status word printed on a figure.
 *
 * `recorded` replays a real artifact (solid border, yellow, carries its date).
 * `schematic` is a diagram of how something works (dashed). `illustrative` is
 * made-up sample values (dotted). Placed at `x`, `y` in stage viewBox units,
 * so it sits on the object it describes; `align="right"` anchors its right
 * edge there. Goes in a stage's `#overlay` slot.
 */
import { computed } from 'vue'
import { STAGE } from 'slidev-addon-decks/story'

const props = withDefaults(
  defineProps<{
    kind: 'recorded' | 'schematic' | 'illustrative'
    x: number
    y: number
    align?: 'left' | 'right'
    /** 0 hides it, 1 shows it; a beat can fade it with the figure. */
    progress?: number
  }>(),
  { align: 'left', progress: 1 },
)

const style = computed(() => ({
  left: `${(props.x / STAGE.width) * 100}%`,
  top: `${(props.y / STAGE.height) * 100}%`,
  opacity: String(props.progress),
}))
</script>

<template>
  <span class="sf-tag" :class="[`is-${props.kind}`, { 'is-right': props.align === 'right' }]" :style="style">
    <slot>{{ props.kind }}</slot>
  </span>
</template>
