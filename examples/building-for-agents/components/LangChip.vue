<script setup lang="ts">
/** LangChip: the language a product is written in, from data/products.ts. */
import { computed } from 'vue'
import { product, type ProductId } from '../data/products'

const props = defineProps<{ id: ProductId }>()
const lang = computed(() => product(props.id).lang)
</script>

<template>
  <span class="sf-lang">{{ lang }}</span>
</template>
