<script setup lang="ts">
/**
 * OdEyebrow: eyebrow row: gradient rule + uppercase label.
 * `accent` maps to the .od-eyebrow color variants (amber, violet, emerald,
 * rose); the rule keeps the cyan-blue gradient in all variants.
 */
defineProps<{ accent?: string }>()
</script>

<template>
  <div class="od-eyebrow-row">
    <span class="od-eyebrow-rule"></span>
    <span class="od-eyebrow" :class="accent"><slot /></span>
  </div>
</template>

<style scoped>
.od-eyebrow-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.7rem;
}
</style>
