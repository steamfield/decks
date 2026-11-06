<script setup lang="ts">
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, stagger, useStage } from 'slidev-addon-decks/story'
import { billPath, toolLabels } from '../data/10-tools'
import { DIM, OFF, ON } from './design'

const COPY = [
  { lead: 'The governor can nominate a commissioner.', body: 'The nominee needs Senate confirmation.' },
  { lead: 'Lawmakers must vote to change these requirements.', body: 'The governor can ask lawmakers to revise the requirements.' },
  { lead: `${billPath.chambers.join(' and ')} must agree.`, body: 'Both must pass identical bill text before it goes to the governor.' },
]
const s = reactive({ executive: OFF, legislative: OFF, first: ON, second: ON })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { executive: ON, duration: DUR.scale, ease: DRAW }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { legislative: ON, first: DIM, duration: DUR.scale, ease: SETTLE })
    beat(1)
    tl.to(s, { second: DIM, duration: DUR.color, ease: SETTLE })
    beat(2)
  },
})
const itemProgress = (progress: number, i: number) => stagger(progress, i, toolLabels.executive.length, 0.16)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">Changing school law takes both chambers.</h2>
      <div class="tools">
        <section class="column" :style="{ opacity: s.first }">
          <h3 :style="{ opacity: s.executive }">{{ toolLabels.initiate }}</h3>
          <div v-for="(label, i) in toolLabels.executive" :key="label" class="tool"
            :style="{ opacity: itemProgress(s.executive, i), transform: `translateX(${(ON - itemProgress(s.executive, i)) * 2}%)` }">
            <span>{{ label }}</span>
            <small v-if="i === 0">{{ toolLabels.confirmation }}</small>
          </div>
        </section>
        <section class="column" :aria-hidden="clicks < 1" :style="{ opacity: s.second }">
          <h3 :style="{ opacity: s.legislative }">{{ toolLabels.legislation }}</h3>
          <div v-for="(label, i) in toolLabels.legislative" :key="label" class="tool"
            :style="{ opacity: itemProgress(s.legislative, i), transform: `translateX(${(ON - itemProgress(s.legislative, i)) * -2}%)` }">{{ label }}</div>
        </section>
      </div>
      <div class="tx-baseline" />
      <StoryLink :href="clicks === 0 ? toolLabels.executiveSource : toolLabels.source" label="Source: Texas Constitution; House legislative process" />
    </template>
    <template #card><StoryCard anchor="left" hue="slate" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.tools { position: absolute; top: calc(24 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: 1fr 1fr; gap: calc(5 * var(--sw)); }
.column h3 { font-family: var(--od-font-sans); font-size: var(--tx-body-size); line-height: var(--tx-label-leading); font-weight: var(--tx-lead-weight); margin: var(--tx-zero) var(--tx-zero) calc(2 * var(--sh)); }
.tool { min-height: calc(7 * var(--sh)); padding: var(--tx-chip-pad-y) var(--tx-chip-pad-x); margin-bottom: calc(1 * var(--sh)); border: var(--tx-hairline) solid var(--od-border); border-radius: var(--tx-radius-card); background: var(--od-surface); font-size: var(--tx-body-size); line-height: var(--tx-label-leading); display: flex; flex-direction: column; justify-content: center; }
.tool small { display: block; margin-top: var(--tx-copy-gap); color: var(--od-text-muted); font-size: var(--tx-tag-size); }
</style>
