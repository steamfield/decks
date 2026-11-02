<script setup lang="ts">
/**
 * OdCoverHead: cover/close brand row: logo + wordmark, URL right-aligned.
 */
withDefaults(defineProps<{ url?: string }>(), { url: 'tryopendata.ai' })
</script>

<template>
  <div class="od-cover-head">
    <div class="od-brand">
      <OdLogo :size="46" />
      <span class="od-brand-name">OpenData</span>
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
