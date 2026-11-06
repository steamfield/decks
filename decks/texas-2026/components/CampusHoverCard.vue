<script setup lang="ts">
import { campusDisplay, type CampusRecord } from '../data/05-two-campuses'
defineProps<{ campus: CampusRecord }>()
</script>

<template>
  <aside class="campus-tooltip" role="tooltip">
    <strong>{{ campus.campus }}</strong>
    <div class="year">{{ campusDisplay.schoolYear }}</div>
    <dl>
      <div><dt>{{ campusDisplay.grade }}</dt><dd>{{ campus.rating }}</dd></div>
      <div><dt>{{ campusDisplay.score }}</dt><dd>{{ campus.score }}</dd></div>
    </dl>
    <span class="tx-tag is-pending">{{ campusDisplay.pending }}</span>
  </aside>
</template>

<style scoped>
.campus-tooltip { position: absolute; left: var(--tx-margin-x); bottom: var(--tx-card-bottom); width: var(--tx-card-width); padding: var(--tx-card-pad); border: var(--tx-hairline) solid var(--od-border); border-radius: var(--tx-radius-card); background: var(--od-surface); font-size: var(--tx-body-size); line-height: var(--tx-body-leading); }
.year { color: var(--od-text-muted); font-size: var(--tx-small-size); }
dl { margin: var(--tx-copy-gap) var(--tx-zero); }
dl > div { display: flex; justify-content: space-between; }
dt { color: var(--od-text-secondary); }
dd { margin: var(--tx-zero); font-variant-numeric: tabular-nums; }
</style>
