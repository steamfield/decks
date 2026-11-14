<script setup lang="ts">
/**
 * PixelIcon: a product's 12x12 pixel icon, one rect per pixel.
 *
 * The rows come from data/products.ts. Each letter is a palette class
 * (`sf-px-p`, `-c`, `-y`, `-v`, `-w` in styles/index.css), so the icon follows
 * the theme. Decorative: the product's name is always printed beside it.
 */
import { computed } from 'vue'
import { product, type ProductId } from '../data/products'

const props = defineProps<{ id: ProductId }>()

const pixels = computed(() =>
  product(props.id).icon.flatMap((row, y) =>
    Array.from(row).flatMap((ch, x) => (ch === '.' ? [] : [{ x, y, ch }])),
  ),
)
</script>

<template>
  <svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">
    <rect
      v-for="p in pixels"
      :key="`${p.x}-${p.y}`"
      :class="`sf-px-${p.ch}`"
      :x="p.x"
      :y="p.y"
      width="1"
      height="1"
    />
  </svg>
</template>
