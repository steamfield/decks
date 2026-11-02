<script setup lang="ts">
/**
 * OdCoverHead: cover/close brand row: logo + wordmark, URL right-aligned.
 * Name and default URL come from the theme's `brand`.
 */
import theme from '#decks/theme'

withDefaults(defineProps<{ url?: string }>(), { url: theme.brand.url })
</script>

<template>
  <div class="od-cover-head">
    <div class="od-brand">
      <OdLogo :size="46" />
      <span class="od-brand-name">{{ theme.brand.name }}</span>
    </div>
    <span class="od-mono od-cover-url">{{ url }}</span>
  </div>
</template>

<style scoped>
.od-cover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.od-cover-url {
  font-size: 1rem;
  color: var(--od-text-dim);
  letter-spacing: 0.02em;
}
</style>
