<script setup lang="ts">
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, clamp01, useStage } from 'slidev-addon-decks/story'
import { BOARD, DASH, DIM, FRAME, OFF, ON, OVAL, changed, neutral } from './design'
import { outcomeLadder, ladderLabels, additionalOffices, reachedRung, senateMath, senateMarginSummary, senateMarginSummary2022, senateMargins2022, comparisonLabels } from '../data/03-outcome-ladder'
import { sboe, electionSource, evidenceLabels, boardLabels } from '../data/02-power-board'
import BallotOval from './BallotOval.vue'

// Read down the ladder. Only Governor and Senate retain the power board's geometry.
const G = { x: 832, width: FRAME.right - 832, height: 88, groupHeight: 128 }
const rowY = (rung: number) => 180 + (rung - 1) * 100 + (rung > 5 ? 40 : OFF)
const shared = (rung: number) => rung === 2 || rung === outcomeLadder.length
const groupWidth = (G.width - 2 * BOARD.gap) / 3
const margin = senateMarginSummary.fourthClosestMarginPp.toFixed(1)
const previousMargin = senateMarginSummary2022.fourthClosestMarginPp?.toFixed(1)
const previousSource = senateMargins2022.find(race => race.district === senateMarginSummary2022.fourthClosestDistrict)?.source
const COPY = [
  { lead: 'Each step adds offices or a chamber.', body: `Step ${outcomeLadder[0].rung} is no change. Step ${outcomeLadder[outcomeLadder.length - 1].rung} adds a Senate majority.` },
  { lead: 'Democrats won the governorship and the House.', body: 'The governor can veto bills and appoint officials. The House votes on school bills.' },
  { lead: 'Democrats also won the other statewide offices shown.', body: `The education-board majority depends on District ${sboe.district}.` },
  { lead: `Democrats needed to flip ${senateMath.netFlipsNeeded} Senate seats.`, body: `In District ${senateMarginSummary.fourthClosestDistrict}, the fourth-closest contest, the Republican won by ${margin} points.` },
  { lead: `In ${comparisonLabels.previousElection}, the fourth-closest gap was ${previousMargin} points.`, body: `Same ${senateMath.republicanDefenses} Republican-held districts. The fourth-closest was District ${senateMarginSummary2022.fourthClosestDistrict} then.` },
]
const descriptions = [
  outcomeLadder.map(rung => `${rung.rung}: ${rung.outcome}.`).join(' '),
  'The governor and House rungs are filled for Democratic wins.',
  `The lieutenant governor, attorney general and comptroller are also filled. The ${comparisonLabels.currentElection} result marker reaches rung ${reachedRung.provisional}, pending the education-board result.`,
  `Democrats won ${senateMarginSummary.democraticFlipsWon} of ${senateMath.republicanDefenses} Republican-held seats. They needed ${senateMath.netFlipsNeeded} flips. The fourth-closest Republican win was District ${senateMarginSummary.fourthClosestDistrict}, by ${margin} percentage points.`,
  `The comparison group is the ${senateMath.republicanDefenses} Republican-held districts on the ${comparisonLabels.currentElection} ballot. Only ${senateMarginSummary2022.contestedSeats} had Democratic challengers in ${comparisonLabels.previousElection}. The fourth-closest was District ${senateMarginSummary2022.fourthClosestDistrict}, at ${previousMargin} points, compared with District ${senateMarginSummary.fourthClosestDistrict} at ${margin} points in ${comparisonLabels.currentElection}.`,
]
// The entrance holds the previous slide's filled marks through the transition,
// then resets them and draws the grey comparison before the click-driven climb.
const s = reactive({ carry: ON, reveal: OFF, climb: OFF, ping: OFF, senate: OFF, history: OFF })
const outline = () => Math.max(s.carry, s.reveal)
const lit = (rung: number) => rung > 1 && rung <= reachedRung.provisional ? Math.max(s.carry, clamp01(s.climb - rung + 2)) : OFF
const emphasis = (rung: number) => {
  if (rung === 1) return s.reveal * (ON - (ON - DIM) * clamp01(s.climb))
  const earlier = rung < reachedRung.provisional ? clamp01(s.climb - rung + 1) : s.senate
  return outline() * (ON - (ON - DIM) * Math.max(s.carry, rung === outcomeLadder.length ? OFF : earlier))
}
const rowInk = (rung: number) => `color-mix(in srgb, ${changed()} ${lit(rung) * 100}%, ${neutral(2)})`
const cursorY = () => {
  const rung = Math.min(reachedRung.provisional, 1 + s.climb)
  const lower = Math.floor(rung)
  return rowY(lower) + (rowY(Math.ceil(rung)) - rowY(lower)) * (rung - lower) + G.height / 2
}
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => {
    tl.to(s, { carry: OFF, duration: DUR.color, ease: SETTLE })
    tl.to(s, { reveal: ON, duration: DUR.grow, ease: DRAW })
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { climb: 2, duration: DUR.grow, ease: DRAW })
    beat(1)
    tl.to(s, { climb: reachedRung.provisional - 1, ping: ON, duration: DUR.grow, ease: DRAW })
    beat(2)
    tl.to(s, { senate: ON, duration: DUR.color, ease: SETTLE })
    beat(3)
    tl.to(s, { history: ON, duration: DUR.color, ease: SETTLE })
    beat(4)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">Only a Senate majority would have done better.<span class="head-detail">Democrats fell {{ senateMath.netFlipsNeeded }} Senate seats short.</span></h2>
      <p class="sr-only">{{ descriptions[clicks] }}</p>
      <div class="tx-baseline" />
      <StoryLayer v-for="morph in [false, true]" :key="String(morph)" :class="morph ? 'vt-power-board' : undefined">
        <template v-for="(rung, i) in outcomeLadder" :key="rung.rung">
        <g v-if="shared(rung.rung) === morph" :data-rung="rung.rung" :style="{ opacity: emphasis(rung.rung) }">
          <template v-if="rung.rung === reachedRung.provisional">
            <g v-for="(office, j) in additionalOffices" :key="office.office" :transform="`translate(${G.x + j * (groupWidth + BOARD.gap)} ${rowY(rung.rung)})`" :style="{ opacity: j < additionalOffices.length - 1 ? ON - (ON - DIM) * s.carry : ON }">
              <rect class="tx-office-box rung" :width="groupWidth * outline()" :height="G.groupHeight" :style="{ stroke: rowInk(rung.rung) }" :stroke-dasharray="j === additionalOffices.length - 1 ? DASH : undefined" />
              <text v-if="j === additionalOffices.length - 1" class="od-stage-note office" x="112" y="32">
                <tspan v-for="(line, k) in boardLabels.education" :key="line" x="112" :dy="k ? 26 : OFF">{{ line }}</tspan>
              </text>
              <text v-else class="od-stage-note office" x="112" y="32">{{ office.office }}</text>
              <text class="od-stage-note" :x="BOARD.pad" y="100">{{ office.lever }}</text>
              <BallotOval :cx="BOARD.pad + OVAL.rx" :cy="G.height / 2" state="filled" :meaning="lit(rung.rung) === OFF ? 'neutral' : 'changed'" :fill="lit(rung.rung)" :pending="j === additionalOffices.length - 1" />
              <foreignObject v-if="j === additionalOffices.length - 1" x="160" y="80" width="144" height="42"><span class="tx-tag is-pending">{{ evidenceLabels.pending }}</span></foreignObject>
            </g>
          </template>
          <template v-else>
            <rect class="tx-office-box rung" :x="G.x" :y="rowY(rung.rung)" :width="G.width * outline()" :height="G.height + (rung.rung === outcomeLadder.length ? 120 * s.senate : OFF)" :style="{ stroke: rowInk(rung.rung) }" />
            <BallotOval :cx="G.x + BOARD.pad + OVAL.rx" :cy="rowY(rung.rung) + G.height / 2"
              :state="rung.rung === outcomeLadder.length && s.senate > OFF ? 'hatched' : 'filled'"
              :meaning="lit(rung.rung) > OFF ? 'changed' : 'neutral'"
              :fill="rung.rung === outcomeLadder.length ? Math.max(s.carry, s.senate) : lit(rung.rung)" />
            <text class="od-stage-name" :x="G.x + 124" :y="rowY(rung.rung) + 32">{{ ladderLabels[i].office }}</text>
            <text class="od-stage-note" :x="G.x + 124" :y="rowY(rung.rung) + 61">{{ rung.rung === outcomeLadder.length && s.senate > OFF ? `Democrats needed ${senateMath.netFlipsNeeded} Republican seats` : ladderLabels[i].lever }}</text>
            <foreignObject v-if="rung.rung === outcomeLadder.length" :x="G.x + 740" :y="rowY(rung.rung) + 4" width="180" height="42"><span class="tx-tag is-scenario">{{ evidenceLabels.scenario }}</span></foreignObject>
            <g v-if="rung.rung === outcomeLadder.length" :style="{ opacity: s.senate }">
              <text class="od-stage-note" :x="G.x + 124" :y="rowY(rung.rung) + 104">Fourth-closest Republican win over a Democrat</text>
              <text class="od-stage-name" :x="G.x + 124" :y="rowY(rung.rung) + 146">{{ `${comparisonLabels.currentElection}, District ${senateMarginSummary.fourthClosestDistrict}: ${margin} points` }}</text>
              <text class="od-stage-note" :x="G.x + 124" :y="rowY(rung.rung) + 184" :style="{ opacity: s.history }">{{ `${comparisonLabels.previousElection}, District ${senateMarginSummary2022.fourthClosestDistrict}: ${previousMargin} points` }}</text>
            </g>
          </template>
          <text class="od-stage-note rung-number" :x="G.x - BOARD.pad" :y="rowY(rung.rung) + G.height / 2 + 8">{{ rung.rung }}</text>
        </g>
        </template>
        <path v-if="!morph" class="cursor" :d="`M ${G.x - 12} ${cursorY() - 12} l 18 12 l -18 12`" :style="{ opacity: s.reveal }" />
        <foreignObject v-if="!morph" :x="G.x - 308" :y="rowY(reachedRung.provisional) + 24" width="280" height="48" :style="{ opacity: clamp01(s.climb - 2) }">
          <span class="tx-tag is-pending">{{ `${comparisonLabels.currentElection} result: ${evidenceLabels.pending}` }}</span>
        </foreignObject>
        <InkPing v-if="!morph" :x="G.x - 3" :y="rowY(reachedRung.provisional) + G.height / 2" :r="OVAL.ry" :progress="s.ping" />
      </StoryLayer>
      <StoryLink :href="clicks === COPY.length - 1 ? previousSource : electionSource" :label="clicks === COPY.length - 1 ? comparisonLabels.historicalSource : comparisonLabels.officialSource" />
    </template>
    <template #card><StoryCard anchor="left" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.head-detail { display: block; margin-top: var(--tx-copy-gap); font-family: var(--od-font-sans); font-size: var(--tx-body-size); font-weight: var(--tx-body-weight); line-height: var(--tx-body-leading); }
.rung { rx: var(--tx-radius-mark); }
.office { fill: var(--od-text); }
.tx-tag { font-size: var(--tx-svg-note); }
.rung-number { text-anchor: end; }
.cursor { fill: none; stroke: var(--od-cyan); stroke-width: var(--tx-oval-stroke); }
</style>
