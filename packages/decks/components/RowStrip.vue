<script setup lang="ts">
/**
 * RowStrip: one clean labelled table row.
 *
 * The payoff shape for the reconciliation slides: mono column headers over a
 * single row of values, with the field under discussion highlighted. Carries
 * `vt-clean-row`, so it is the element that morphs from slide to slide.
 */
import { computed } from 'vue'
import type { RowStripColumn } from '../story'

const props = defineProps<{
  columns: RowStripColumn[]
}>()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns.length}, minmax(0, 1fr))`,
}))
</script>

<template>
  <div class="od-rowstrip vt-clean-row">
    <div class="od-rowstrip-grid" :style="gridStyle">
      <div v-for="col in props.columns" :key="`h-${col.header}`" class="od-rowstrip-head">
        {{ col.header }}
      </div>
      <div
        v-for="col in props.columns"
        :key="`v-${col.header}`"
        class="od-rowstrip-cell"
        :class="{ 'is-hi': col.highlight }"
      >
        {{ col.value }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.od-rowstrip-grid {
  display: grid;
}
.od-rowstrip-head,
.od-rowstrip-cell {
  font-family: var(--od-font-mono);
  padding: calc(0.8 * var(--sw)) calc(1 * var(--sw));
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.od-rowstrip-head {
  font-size: calc(0.85 * var(--sw));
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--od-text-faint);
  border-bottom: 1px solid var(--od-border-subtle);
}
.od-rowstrip-cell {
  font-size: calc(1.15 * var(--sw));
  font-weight: 500;
  color: var(--od-text-secondary);
}
.od-rowstrip-cell.is-hi {
  color: var(--od-surface-raised);
  background: var(--od-cyan-soft);
}
</style>
