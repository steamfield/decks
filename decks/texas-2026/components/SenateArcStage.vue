<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { senate, confirmation, holdover, senateRules, arcLabels } from '../data/08-senate-arc'
import { BASELINE_Y, DIM, FRAME, OFF, ON, SEAT_ARC_RADIUS, risk } from './design'
import SeatArc from './SeatArc.vue'

const COPY = [
  { lead: `A majority takes ${senate.majority} seats.`, body: `The expected split is ${senate.republican} Republican and ${senate.democratic} Democratic senators.` },
  { lead: `${confirmation.otherVotesNeeded} Republican votes would be needed.`, body: `That assumes all ${confirmation.present} attend and all ${senate.democratic} Democrats support the nominee.` },
  { lead: `${holdover.name} can remain commissioner.`, body: `A successor must complete the legal steps to take office. Resignation or lawful removal could let ${holdover.name} leave sooner.` },
  { lead: 'Senators can change their chamber rules.', body: "The lieutenant governor's committee and agenda powers depend on rules senators can revise." },
]
const s = reactive({ enter: OFF, confirm: OFF, incumbent: OFF, rules: OFF, arc: ON, tenure: ON })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { enter: ON, duration: DUR.grow, ease: DRAW }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { confirm: ON, duration: DUR.grow, ease: DRAW })
    beat(1)
    tl.to(s, { incumbent: ON, arc: DIM, duration: DUR.color, ease: SETTLE })
    beat(2)
    tl.to(s, { rules: ON, tenure: DIM, duration: DUR.color, ease: SETTLE })
    beat(3)
  },
})
const groups = [
  { label: arcLabels.democratic, seats: senate.democratic, filled: senate.democratic, step: 4 },
  { label: arcLabels.republican, seats: senate.republican, filled: senate.republican, step: 2 },
] as const
const thresholds = computed(() => [
  { at: senate.majority, label: `${arcLabels.majority}: ${senate.majority}`, progress: ON },
  { at: confirmation.required, label: `${arcLabels.confirmation}: ${confirmation.required}`, progress: s.confirm },
])
const source = computed(() => clicks.value >= 3 ? arcLabels.rulesSource : clicks.value === 2 ? arcLabels.holdoverSource : arcLabels.source)
// Local layout keeps the full hemicycle clear of the left-anchored card.
const ARC = { x: 1344, y: BASELINE_Y, labelY: 42, gapY: 104 }
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <line class="tx-field-rule" :x1="FRAME.left" :x2="FRAME.right" :y1="BASELINE_Y" :y2="BASELINE_Y" />
      <g :transform="`translate(${ARC.x} ${ARC.y})`" :style="{ opacity: s.arc }">
        <SeatArc :groups="groups" :progress="s.enter" :thresholds="thresholds"
          :highlight="{ from: senate.democratic, to: confirmation.required, progress: s.confirm }" />
        <g :style="{ opacity: s.enter }">
          <text class="od-stage-name" :x="-SEAT_ARC_RADIUS" :y="ARC.labelY">{{ senate.democratic }} {{ arcLabels.democratic }}</text>
          <text class="od-stage-name" :x="SEAT_ARC_RADIUS" :y="ARC.labelY" text-anchor="end">{{ senate.republican }} {{ arcLabels.republican }}</text>
        </g>
        <text class="od-stage-name" :x="OFF" :y="ARC.gapY" text-anchor="middle" :style="{ opacity: s.confirm, fill: risk() }">{{ confirmation.otherVotesNeeded }} {{ arcLabels.gap }}</text>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">With all {{ confirmation.present }} senators present, confirming a commissioner takes {{ confirmation.required }} votes.</h2>
      <div class="attendance" :style="{ opacity: s.arc }">
        <div class="context">{{ arcLabels.expected }}</div>
        <span class="tx-tag is-pending">{{ arcLabels.certification }}</span>
      </div>
      <span class="scenario tx-tag is-scenario" :aria-hidden="clicks < 1" :style="{ opacity: s.confirm * s.arc }">{{ arcLabels.scenario }}</span>
      <div class="office" :aria-hidden="clicks < 2" :style="{ opacity: s.incumbent * s.tenure }">
        <strong>{{ holdover.name }}</strong>
        <span class="tx-tag is-pending">{{ arcLabels.pending }}: {{ holdover.name }}'s {{ arcLabels.tenure }}</span>
      </div>
      <div class="rules" :aria-hidden="clicks < 3" :style="{ opacity: s.rules }">
        <strong>{{ senateRules.affectedOffice }}</strong>
        <span>{{ arcLabels.rules }}</span>
        <span class="tx-tag is-pending">{{ arcLabels.pending }}</span>
      </div>
      <StoryLink :href="source" :label="clicks >= 3 ? 'Source: Texas Tribune, Senate rules' : 'Source: Texas Constitution'" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.attendance { position: absolute; left: var(--tx-margin-x); top: calc(30 * var(--sh)); width: calc(31 * var(--sw)); font-size: var(--tx-body-size); }
.context { margin-bottom: var(--tx-copy-gap); }
.scenario { position: absolute; left: calc(81 * var(--sw)); top: calc(74 * var(--sh)); }
.office, .rules { position: absolute; left: calc(45 * var(--sw)); right: var(--tx-margin-x); display: flex; align-items: center; gap: var(--tx-byline-gap); font-size: var(--tx-small-size); }
.office { top: calc(79 * var(--sh)); flex-wrap: wrap; }
.office strong { font-size: var(--tx-body-size); }
.rules { top: calc(87 * var(--sh)); padding-top: var(--tx-copy-gap); border-top: var(--tx-hairline) dashed var(--od-amber); }
</style>
