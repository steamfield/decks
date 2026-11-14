<script setup lang="ts">
/**
 * ThreadRail: the seven products along the bottom of every content slide, in
 * the order work flows through them. It is steamfield.io's stage rail, moved
 * under the card.
 *
 * Products before the current one sit at full strength, the current one gets
 * the pink marker and a yellow verb, the rest sit at the dim level. Goes in a
 * stage's `#overlay` slot.
 */
import { computed } from 'vue'
import { PRODUCTS, type ProductId } from '../data/products'

const props = defineProps<{
  /** The product this slide is about. Omit on framing slides. */
  current?: ProductId
  /** Light every product (the closing slides). */
  all?: boolean
}>()

const currentIndex = computed(() => PRODUCTS.findIndex((p) => p.id === props.current))
</script>

<template>
  <nav class="sf-rail" aria-label="Where this slide is in the talk">
    <div
      v-for="(p, i) in PRODUCTS"
      :key="p.id"
      class="sf-rail-item"
      :class="{
        'is-current': i === currentIndex,
        'is-done': props.all || (currentIndex >= 0 && i < currentIndex),
      }"
      :aria-current="i === currentIndex ? 'step' : undefined"
    >
      <PixelIcon class="sf-rail-icon" :id="p.id" />
      <span class="sf-rail-text">
        <span class="sf-rail-verb">{{ p.verb }}</span>
        <span class="sf-rail-name">{{ p.name }}</span>
      </span>
    </div>
  </nav>
</template>
