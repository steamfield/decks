<script setup lang="ts">
import { reactive } from 'vue'
import { DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import { futureColumns, futureDimensions, futureRows, futureDisplay } from '../data/13-futures'

const COPY = [
  { lead: 'The commissioner appointment could remain unresolved.', body: 'Author scenarios based on public-school priorities; no estimated probabilities.' },
  { lead: 'An intervention can proceed after the election.', body: 'The middle scenario assumes an intervention with terms still undecided.' },
  { lead: 'Additional funding requires legislative agreement.', body: 'The middle scenario assumes some additional school funding.' },
  { lead: 'Families may disagree about state intervention.', body: '“Most likely” is the author’s judgment. No probabilities have been estimated.' },
]
const rows = reactive(futureRows.map((_, i) => ({ reveal: i === 0 ? ON : OFF, emphasis: ON })))
const s = reactive({ arrive: OFF, middle: OFF })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { arrive: ON, duration: DUR.grow, ease: SETTLE }) },
  beats: (tl, beat) => {
    beat(0)
    for (let i = 1; i < COPY.length; i++) {
      tl.to(rows[i], { reveal: ON, duration: DUR.card, ease: SETTLE })
      tl.to(rows[i - 1], { emphasis: DIM, duration: DUR.color, ease: SETTLE }, '<')
      if (i === COPY.length - 1) tl.to(s, { middle: ON, duration: DUR.color, ease: SETTLE })
      beat(i)
    }
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">An intervention remains possible.</h2>
      <div class="futures" :style="{ opacity: s.arrive }">
        <div v-for="(column, c) in futureColumns" :key="column.label" class="future"
          :style="{ '--emphasis': c === 1 ? ON : ON - s.middle * (ON - DIM) }">
          <header>
            <strong>{{ column.label }}</strong>
            <span class="tx-tag is-scenario">{{ futureDisplay.scenario }}</span>
          </header>
          <div v-for="(dimension, r) in futureDimensions" :key="dimension" class="future-row"
            :aria-hidden="r > clicks"
            :style="{ opacity: rows[r].reveal * (c === 1 ? rows[r].emphasis + s.middle * (ON - rows[r].emphasis) : Math.min(rows[r].emphasis, ON - s.middle * (ON - DIM))) }">
            <span class="dimension">{{ dimension }}</span>
            <span class="outcome">{{ futureRows[r][c] }}</span>
          </div>
        </div>
      </div>
      <StoryLink :href="futureDisplay.sourceUrl" :label="futureDisplay.source" />
    </template>
    <template #card><StoryCard anchor="left" hue="slate" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
/* Local comparison geometry keeps all rows above the bottom-left card. */
.futures { position: absolute; top: calc(20 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(2 * var(--sw)); }
.future { border: var(--tx-hairline) dotted var(--od-border); border-radius: var(--tx-radius-card); padding: calc(1.4 * var(--sw)); background: var(--od-surface); }
.future header { display: flex; align-items: center; justify-content: space-between; padding-bottom: calc(1.4 * var(--sh)); border-bottom: var(--tx-hairline) dotted var(--od-border); opacity: var(--emphasis); }
.future strong { font-size: calc(1.8 * var(--sw)); font-weight: var(--tx-lead-weight); }
.future-row { display: flex; align-items: baseline; gap: calc(1.1 * var(--sw)); padding-top: calc(1 * var(--sh)); height: calc(8 * var(--sh)); box-sizing: border-box; }
.dimension { flex: 0 0 calc(6.5 * var(--sw)); font-size: var(--tx-small-size); color: var(--od-text-muted); }
.outcome { font-size: var(--tx-body-size); line-height: var(--tx-label-leading); color: var(--od-text); }
</style>
