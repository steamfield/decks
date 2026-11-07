<script setup lang="ts">
/**
 * The addon's bottom global layer: Slidev merges `global-bottom.vue` from the
 * theme, each addon and the deck, and draws every one on every slide. It shows
 * the "Created with Decks" credit only for a deck whose headmatter sets
 * `decksCredit: true` (headmatter keys reach `$slidev.configs`), so a deck
 * without the key draws nothing here.
 */
import DecksCredit from './components/DecksCredit.vue'
</script>

<template>
  <DecksCredit v-if="$slidev.configs.decksCredit === true" />
</template>
