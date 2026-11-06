<script setup lang="ts">
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, stagger, useStage } from 'slidev-addon-decks/story'
import { billPath, toolLabels } from '../data/10-tools'
import { DIM, OFF, ON } from './design'

const COPY = [
  { lead: 'The governor can nominate a commissioner.', body: 'The nominee needs Senate confirmation.' },
  { lead: 'Changing these laws requires a bill.', body: 'The governor can ask lawmakers to revise the requirements.' },
  { lead: 'Both chambers must pass the same text.', body: 'The bill then goes to the governor.' },
]
const s = reactive({ executive: OFF, legislative: OFF, path: OFF, first: ON, second: ON })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { executive: ON, duration: DUR.scale, ease: DRAW }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { legislative: ON, first: DIM, duration: DUR.scale, ease: SETTLE })
    beat(1)
    tl.to(s, { path: ON, second: DIM, duration: DUR.grow, ease: DRAW })
    beat(2)
  },
})
const itemProgress = (progress: number, i: number) => stagger(progress, i, toolLabels.executive.length, 0.16)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">The governor can veto bills.</h2>
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
      <div class="bill-path" :aria-hidden="clicks < 2" :style="{ opacity: s.path }">
        <div class="chambers">
          <span v-for="chamber in billPath.chambers" :key="chamber">{{ chamber }}</span>
        </div>
        <div class="same-text">{{ toolLabels.sameText }}</div>
        <div class="governor">{{ toolLabels.governor }}</div>
      </div>
      <div class="tx-baseline" />
      <StoryLink :href="clicks === 0 ? toolLabels.executiveSource : toolLabels.source" label="Source: Texas Constitution; House legislative process" />
    </template>
    <template #card><StoryCard anchor="left" hue="slate" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.tools { position: absolute; top: calc(29 * var(--sh)); left: calc(43 * var(--sw)); right: var(--tx-margin-x); display: grid; grid-template-columns: 1fr 1fr; gap: calc(2 * var(--sw)); }
.column h3 { font-family: var(--od-font-sans); font-size: var(--tx-body-size); line-height: var(--tx-label-leading); font-weight: var(--tx-lead-weight); margin: var(--tx-zero) var(--tx-zero) calc(2 * var(--sh)); }
.tool { min-height: calc(7 * var(--sh)); padding: var(--tx-chip-pad-y) var(--tx-chip-pad-x); margin-bottom: calc(1 * var(--sh)); border: var(--tx-hairline) solid var(--od-border); border-radius: var(--tx-radius-card); background: var(--od-surface); font-size: var(--tx-body-size); line-height: var(--tx-label-leading); display: flex; flex-direction: column; justify-content: center; }
.tool small { display: block; margin-top: var(--tx-copy-gap); color: var(--od-text-muted); font-size: var(--tx-tag-size); }
.bill-path { position: absolute; top: calc(73 * var(--sh)); left: calc(45 * var(--sw)); right: var(--tx-margin-x); text-align: center; font-size: var(--tx-body-size); }
.chambers { display: flex; justify-content: space-around; border-bottom: var(--tx-hairline) solid var(--od-text-muted); padding-bottom: calc(1 * var(--sh)); }
.same-text { width: max-content; margin: var(--tx-zero) auto; padding: calc(1 * var(--sh)) var(--tx-chip-pad-x); font-size: var(--tx-small-size); color: var(--od-text-secondary); }
.governor { width: max-content; margin: var(--tx-zero) auto; border-top: var(--tx-hairline) solid var(--od-text-muted); padding-top: calc(1 * var(--sh)); }
</style>
