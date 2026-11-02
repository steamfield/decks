<template>
  <!-- OdByline: mono meta row for cover/close slides. Separate spans with
       <span class="od-dim">&bull;</span> between them. -->
  <div class="od-mono od-byline"><slot /></div>
</template>

<style scoped>
.od-byline {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 0.95rem;
  color: var(--od-text-faint);
}
</style>
