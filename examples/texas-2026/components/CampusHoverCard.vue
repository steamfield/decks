<script setup lang="ts">
import { computed } from 'vue'
import { campusDisplay, campusNameWords, type CampusRecord } from '../data/05-two-campuses'
const props = defineProps<{ campus: CampusRecord }>()
const name = computed(() => props.campus.campus.split(' ').map(word => campusNameWords[word]
  ?? word.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())).join(' '))
</script>

<template>
  <aside class="campus-tooltip" role="tooltip">
    <strong>{{ name }}</strong>
    <div class="metadata">
      <span>{{ campusDisplay.schoolYear }}</span>
      <dl>
        <div><dt>{{ campusDisplay.grade }}</dt><dd>{{ campus.rating }}</dd></div>
        <div><dt>{{ campusDisplay.score }}</dt><dd>{{ campus.score }}</dd></div>
      </dl>
    </div>
    <span class="tx-tag is-pending">{{ campusDisplay.finalRating }}</span>
  </aside>
</template>

<style scoped>
.campus-tooltip { position: absolute; left: var(--tx-margin-x); top: calc(70.740741 * var(--sh)); width: var(--tx-card-width); padding: calc(1.25 * var(--sw)); border: var(--tx-hairline) solid var(--od-border); border-radius: var(--tx-radius-card); background: var(--od-surface); font-size: var(--tx-body-size); line-height: var(--tx-label-leading); }
.metadata { display: flex; align-items: baseline; gap: var(--tx-byline-gap); margin: var(--tx-copy-gap) var(--tx-zero); color: var(--od-text-muted); font-size: var(--tx-small-size); }
dl { display: flex; gap: var(--tx-byline-gap); margin: var(--tx-zero); }
dl > div { display: flex; gap: var(--tx-copy-gap); }
dt { color: var(--od-text-secondary); }
dd { margin: var(--tx-zero); color: var(--od-text); font-variant-numeric: tabular-nums; }
</style>
