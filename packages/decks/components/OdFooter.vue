<script setup lang="ts">
/**
 * Shared footer chrome for the slide templates: brand lockup (the theme's
 * `brand`) + page number.
 * Page numbering comes from Slidev's nav by default; pass `page` only to
 * override (e.g. a frozen export where the count is pinned).
 */
import { computed } from 'vue'
import { useNav } from '@slidev/client'
import theme from '#decks/theme'

const props = defineProps<{ page?: string }>()

const nav = useNav()
const pageText = computed(() => props.page ?? `${nav.currentSlideNo.value} / ${nav.total.value}`)
</script>

<template>
  <div class="od-footer">
    <div class="od-footer-brand">
      <OdLogo :size="20" />
      <span class="od-wordmark">{{ theme.brand.name }}</span>
    </div>
    <span class="od-footer-page">{{ pageText }}</span>
  </div>
</template>

<style scoped>
.od-footer-brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.78rem;
  font-weight: 510;
  color: var(--od-text-faint);
}
.od-footer-brand .od-wordmark {
  background-image: var(--od-wordmark-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.od-footer-page {
  font-family: var(--od-font-sans);
  font-size: 0.78rem;
  color: var(--od-text-dim);
}
</style>
