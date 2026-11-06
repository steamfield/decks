<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { senate, confirmation, holdover, senateRules, arcLabels } from '../data/08-senate-arc'
import { BASELINE_Y, DIM, FRAME, OFF, ON, SEAT_ARC_RADIUS, democrat, republican, risk } from './design'
import SeatArc from './SeatArc.vue'

const COPY = [
  { lead: 'Republicans are expected to keep their majority.', body: `The confirmation threshold assumes all ${confirmation.present} senators attend.` },
  { lead: "A nominee would need both parties' votes.", body: `That assumes all ${confirmation.present} attend and all ${senate.democratic} Democrats support the nominee.` },
  { lead: `${holdover.name} serves until a successor qualifies.`, body: 'Lawful removal or another applicable vacancy rule could alter his tenure.' },
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
  { label: arcLabels.democratic, seats: senate.democratic, filled: senate.democratic, color: democrat() },
  { label: arcLabels.republican, seats: senate.republican, filled: senate.republican, color: republican() },
] as const
const thresholds = computed(() => [
  { at: senate.majority, label: `${arcLabels.majority}: ${senate.majority}`, progress: ON },
  { at: confirmation.required, label: `${arcLabels.confirmation}: ${confirmation.required}`, progress: s.confirm },
])
const source = computed(() => clicks.value >= 3 ? arcLabels.rulesSource : clicks.value === 2 ? arcLabels.holdoverSource : arcLabels.source)
// Enlarge the shared intrinsic geometry above the card; slide 11 keeps its scale.
const ARC = { x: 960, y: BASELINE_Y, scale: 1, labelGap: 40, labelY: -50, gapY: 72 }
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <line class="tx-field-rule" :x1="FRAME.left" :x2="FRAME.right" :y1="BASELINE_Y" :y2="BASELINE_Y" />
      <g :transform="`translate(${ARC.x} ${ARC.y})`" :style="{ opacity: s.arc }">
        <g :transform="`scale(${ARC.scale})`">
          <SeatArc :groups="groups" :progress="s.enter" :thresholds="thresholds"
            :highlight="{ from: senate.democratic, to: confirmation.required, progress: s.confirm }" />
        </g>
        <g :style="{ opacity: s.enter }">
          <text class="od-stage-name" :x="-SEAT_ARC_RADIUS * ARC.scale - ARC.labelGap" :y="ARC.labelY" text-anchor="end">{{ senate.democratic }} {{ arcLabels.democratic }}</text>
          <text class="od-stage-name" :x="SEAT_ARC_RADIUS * ARC.scale + ARC.labelGap" :y="ARC.labelY">{{ senate.republican }} {{ arcLabels.republican }}</text>
        </g>
        <text class="od-stage-name" :x="OFF" :y="ARC.gapY" text-anchor="middle" :style="{ opacity: s.confirm, fill: risk() }">{{ confirmation.otherVotesNeeded }} {{ arcLabels.gap }}</text>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">With {{ confirmation.present }} present, confirmation takes {{ confirmation.required }} votes.</h2>
      <span class="scenario tx-tag is-scenario" :aria-hidden="clicks < 1" :style="{ opacity: s.confirm * s.arc }">{{ arcLabels.scenario }}</span>
      <div class="office" :aria-hidden="clicks < 2" :style="{ opacity: s.incumbent * s.tenure }">
        <strong>{{ holdover.name }}</strong>
        <span class="tx-tag is-pending">{{ arcLabels.departureStatus }}</span>
      </div>
      <div class="rules" :aria-hidden="clicks < 3" :style="{ opacity: s.rules }">
        <strong>{{ senateRules.affectedOffice }}</strong>
        <span>{{ arcLabels.rules }}</span>
        <span class="tx-tag is-pending">{{ arcLabels.ruleStatus }}</span>
      </div>
      <StoryLink :href="source" :label="clicks >= 3 ? 'Source: Texas Tribune, Senate rules' : 'Source: Texas Constitution'" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.scenario { position: absolute; left: calc(60.6 * var(--sw)); top: calc(70.4 * var(--sh)); }
.office, .rules { position: absolute; left: calc(45 * var(--sw)); right: var(--tx-margin-x); display: flex; align-items: center; gap: var(--tx-byline-gap); font-size: var(--tx-small-size); }
.office { top: calc(79 * var(--sh)); flex-wrap: wrap; }
.office strong { font-size: var(--tx-body-size); }
.rules { top: calc(87 * var(--sh)); padding-top: var(--tx-copy-gap); border-top: var(--tx-hairline) dashed var(--od-amber); }
</style>
