<script setup lang="ts">
/**
 * AxErrorCards — the three recovery-hint cards on slide 7, revealed one per
 * click so the error path gets narrated instead of skimmed.
 *
 * Pacing comes from the shared useScriptedDemo composable (clicks, not
 * timers); the page declares `clicks: 3` in the slides.md manifest.
 * Card chrome lives in the deck's styles/index.css (.ax-err*).
 */
import { useScriptedDemo } from 'slidev-addon-decks/composables/scripted-demo'

const { shown, playCount } = useScriptedDemo()

const cards = [
  {
    code: 'PARAM_COUNT_MISMATCH',
    hint: '"Each ? in the SQL requires exactly one parameter in the params array."',
  },
  {
    code: 'unknown column',
    hint: 'Error appends the real column list, so the agent fixes the query in one step.',
  },
  {
    code: 'leaked REST verb',
    hint: '"GET .../columns" gets rewritten to "Call get_dataset_info to see the columns."',
  },
]
</script>

<template>
  <div :key="playCount" class="ax-errors">
    <div
      v-for="(card, i) in cards"
      :key="card.code"
      class="ax-err"
      :class="{ 'is-in': shown(i + 1) }"
    >
      <div class="ax-err-k od-mono">{{ card.code }}</div>
      <div class="ax-err-v">{{ card.hint }}</div>
    </div>
  </div>
</template>
