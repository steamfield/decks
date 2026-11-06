<script setup lang="ts">
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { replaceManager, earlyRemoval, undoLabels } from '../data/09-undo'
import { BASELINE_Y, DIM, FRAME, OFF, ON, changed, risk, neutral } from './design'
import BallotOval from './BallotOval.vue'

const COPY = [
  { lead: 'The commissioner may replace individual board managers.', body: "Elected trustees' authority stays suspended while the appointed board serves." },
  { lead: 'The ratings must come from the same campus.', body: `The campus that triggered the appointment must earn ${earlyRemoval.acceptableRatings} acceptable ratings in consecutive school years.` },
  { lead: 'The commissioner can then consider early removal.', body: 'The ratings condition must be met first. The law sets no fixed return date.' },
]
const s = reactive({ replace: OFF, removal: OFF, ratings: OFF, earlier: ON })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { replace: ON, duration: DUR.draw, ease: DRAW }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { removal: ON, earlier: DIM, duration: DUR.grow, ease: DRAW })
    beat(1)
    tl.to(s, { ratings: ON, duration: DUR.scale, ease: SETTLE })
    beat(2)
  },
})
// Local lane geometry. The lower rule encodes a condition, not elapsed time.
const LANE = { x: FRAME.left, right: FRAME.right, quick: 976, top: 340, bottom: 590, ratingStart: 800, ratingGap: 648 }
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <line class="tx-field-rule" :x1="FRAME.left" :x2="FRAME.right" :y1="BASELINE_Y" :y2="BASELINE_Y" />
      <g :style="{ opacity: s.earlier }">
        <text class="od-stage-name" :x="LANE.x" :y="LANE.top - 80">{{ replaceManager.label }}</text>
        <line class="lane" :x1="LANE.x" :x2="LANE.quick" :y1="LANE.top" :y2="LANE.top" :stroke="neutral()" />
        <line class="lane active" :x1="LANE.x" :x2="LANE.x + (LANE.quick - LANE.x) * s.replace" :y1="LANE.top" :y2="LANE.top" :stroke="changed()" />
        <BallotOval :cx="LANE.quick" :cy="LANE.top" state="filled" meaning="changed" :fill="s.replace" knockout />
        <text class="od-stage-name" :x="LANE.quick + 72" :y="LANE.top + 9" :style="{ opacity: s.replace }">{{ replaceManager.timing }}</text>
        <text class="od-stage-note" :x="LANE.x" :y="LANE.top + 70">{{ replaceManager.actor }}</text>
      </g>
      <g>
        <text class="od-stage-name" :x="LANE.x" :y="LANE.bottom - 90">{{ earlyRemoval.label }}</text>
        <text class="od-stage-note" :x="LANE.x" :y="LANE.bottom - 48">{{ earlyRemoval.scope }}</text>
        <line class="lane" :x1="LANE.x" :x2="LANE.right" :y1="LANE.bottom" :y2="LANE.bottom" :stroke="neutral()" />
        <line class="lane active" :x1="LANE.x" :x2="LANE.x + (LANE.right - LANE.x) * s.removal" :y1="LANE.bottom" :y2="LANE.bottom" :stroke="risk()" />
        <g v-for="(_, i) in earlyRemoval.acceptableRatings" :key="i" :style="{ opacity: s.ratings }">
          <BallotOval :cx="LANE.ratingStart + i * LANE.ratingGap" :cy="LANE.bottom" state="empty" meaning="risk" knockout />
          <text class="od-stage-name" :x="LANE.ratingStart + i * LANE.ratingGap" :y="LANE.bottom + 68" text-anchor="middle">{{ undoLabels.acceptable }}</text>
        </g>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">Early removal needs consecutive acceptable ratings.</h2>
      <div class="ratings-label" :aria-hidden="clicks < 2" :style="{ opacity: s.ratings }">{{ undoLabels.consecutive }}</div>
      <div class="decision" :aria-hidden="clicks < 2" :style="{ opacity: s.ratings }">
        <span class="tx-tag is-pending">{{ undoLabels.removalStatus }}</span>
      </div>
      <StoryLink :href="undoLabels.source" label="Source: Texas Education Code, appointed boards" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.lane { stroke-width: var(--tx-hairline); }
.lane.active { stroke-width: var(--tx-oval-stroke); }
.ratings-label { position: absolute; left: calc(50 * var(--sw)); top: calc(48 * var(--sh)); color: var(--od-amber); font-size: var(--tx-small-size); }
.decision { position: absolute; right: var(--tx-margin-x); top: calc(48 * var(--sh)); }
.decision .tx-tag { margin-top: var(--tx-copy-gap); }
</style>
