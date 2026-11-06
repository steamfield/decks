<script setup lang="ts">
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { replaceManager, earlyRemoval, undoLabels } from '../data/09-undo'
import { BASELINE_Y, DIM, FRAME, OFF, ON, changed, risk, neutral } from './design'
import BallotOval from './BallotOval.vue'

const COPY = [
  { lead: 'The commissioner may replace individual board managers.', body: 'The commissioner chooses who serves on the appointed board.' },
  { lead: 'Early removal depends on campus ratings.', body: 'The campus that triggered the appointment must earn acceptable ratings in consecutive school years.' },
  { lead: "Early removal remains the commissioner's decision.", body: 'The ratings condition must be met first. The law sets no fixed return date.' },
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
const LANE = { x: 864, right: 1776, quick: 1184, top: 416, ratingStart: 1080, ratingGap: 400 }
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <line class="tx-field-rule" :x1="FRAME.left" :x2="FRAME.right" :y1="BASELINE_Y" :y2="BASELINE_Y" />
      <g :style="{ opacity: s.earlier }">
        <text class="od-stage-name" :x="LANE.x" :y="LANE.top - 80">{{ replaceManager.label }}</text>
        <line class="lane" :x1="LANE.x" :x2="LANE.quick" :y1="LANE.top" :y2="LANE.top" :stroke="neutral()" />
        <line class="lane active" :x1="LANE.x" :x2="LANE.x + (LANE.quick - LANE.x) * s.replace" :y1="LANE.top" :y2="LANE.top" :stroke="changed()" />
        <BallotOval :cx="LANE.quick" :cy="LANE.top" state="filled" meaning="changed" :fill="s.replace" />
        <text class="od-stage-name" :x="LANE.quick + 72" :y="LANE.top + 9" :style="{ opacity: s.replace }">{{ replaceManager.timing }}</text>
        <text class="od-stage-note" :x="LANE.x" :y="LANE.top + 70">{{ replaceManager.actor }}</text>
      </g>
      <g :style="{ opacity: s.removal }">
        <text class="od-stage-name" :x="LANE.x" :y="BASELINE_Y - 116">{{ earlyRemoval.label }}</text>
        <line class="lane" :x1="LANE.x" :x2="LANE.right" :y1="BASELINE_Y" :y2="BASELINE_Y" :stroke="neutral()" />
        <line class="lane active" :x1="LANE.x" :x2="LANE.x + (LANE.right - LANE.x) * s.removal" :y1="BASELINE_Y" :y2="BASELINE_Y" :stroke="risk()" />
        <g v-for="(_, i) in earlyRemoval.acceptableRatings" :key="i" :style="{ opacity: s.ratings }">
          <BallotOval :cx="LANE.ratingStart + i * LANE.ratingGap" :cy="BASELINE_Y" state="empty" meaning="risk" />
          <text class="od-stage-name" :x="LANE.ratingStart + i * LANE.ratingGap" :y="BASELINE_Y + 68" text-anchor="middle">{{ undoLabels.acceptable }}</text>
        </g>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">Ending a takeover early requires {{ earlyRemoval.acceptableRatings }} consecutive acceptable campus ratings.</h2>
      <div class="ratings-label" :aria-hidden="clicks < 2" :style="{ opacity: s.ratings }">{{ undoLabels.consecutive }}</div>
      <div class="decision" :aria-hidden="clicks < 2" :style="{ opacity: s.ratings }">
        <div>{{ undoLabels.decision }}</div>
        <span class="tx-tag is-pending">{{ undoLabels.pending }}: {{ undoLabels.outcome }}</span>
      </div>
      <StoryLink :href="undoLabels.source" label="Source: Texas Education Code, appointed boards" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.lane { stroke-width: var(--tx-hairline); }
.lane.active { stroke-width: var(--tx-oval-stroke); }
.ratings-label { position: absolute; left: calc(45 * var(--sw)); top: calc(60 * var(--sh)); color: var(--od-amber); font-size: var(--tx-small-size); }
.decision { position: absolute; left: calc(45 * var(--sw)); top: calc(79 * var(--sh)); font-size: var(--tx-body-size); line-height: var(--tx-body-leading); }
.decision .tx-tag { margin-top: var(--tx-copy-gap); }
</style>
