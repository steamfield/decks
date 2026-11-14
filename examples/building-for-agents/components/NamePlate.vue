<script setup lang="ts">
/**
 * NamePlate: a product's plate at the top right of its slides.
 *
 * On the product's first slide: pixel icon, name in Orbitron, and the language
 * chip under it. On its later slides pass `chip-only` and only the chip shows.
 * The chip is how the deck stays honest about which parts are TypeScript.
 */
import { computed } from 'vue'
import { product, type ProductId } from '../data/products'

const props = withDefaults(defineProps<{ id: ProductId; chipOnly?: boolean }>(), { chipOnly: false })
const p = computed(() => product(props.id))
</script>

<template>
  <div class="sf-plate">
    <div v-if="!props.chipOnly" class="sf-plate-row">
      <PixelIcon class="sf-plate-icon" :id="p.id" />
      <span class="sf-plate-name">{{ p.name }}</span>
    </div>
    <LangChip :id="p.id" />
  </div>
</template>
