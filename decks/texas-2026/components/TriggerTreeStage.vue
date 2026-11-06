<script setup lang="ts">
import { reactive } from 'vue'
import { DUR, DRAW, SETTLE, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import { triggeringCampuses } from '../data/05-two-campuses'
import { appealGate, petition, trusteeRequest, triggerDisplay } from '../data/06-trigger-tree'

// The side inputs join the fork before either outcome, above the prose card.
const s = reactive({ branches: OFF, inputs: OFF, rootDim: ON, branchDim: ON, inputDim: ON })
const COPY = [
  { lead: 'The appeals could prevent mandatory intervention.', body: `The rule counts ${triggerDisplay.countWord} failing ratings, with unrated years pausing the count.` },
  { lead: 'A replacement board governs every campus.', body: 'Closure applies to the campus whose ratings triggered intervention.' },
  { lead: 'Parents petitioned to close both schools.', body: 'A valid petition generally sets the remedy. Trustees can ask the commissioner for the other one.' },
  { lead: 'A monitor alone does not satisfy the rule.', body: 'A monitor or conservator can accompany board replacement or campus closure.' },
]
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { branches: ON, rootDim: DIM, duration: DUR.grow, ease: DRAW })
    beat(1)
    tl.to(s, { inputs: ON, branchDim: DIM, duration: DUR.grow, ease: DRAW })
    beat(2)
    tl.to(s, { inputDim: DIM, duration: DUR.card, ease: SETTLE })
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: s.rootDim }">
        <text class="od-stage-name" x="960" y="304" text-anchor="middle">{{ triggeringCampuses.map(c => c.name.replace(' Middle School', '')).join(' / ') }}</text>
        <path d="M960 316 V340" class="wire" />
        <rect x="720" y="340" width="480" height="96" class="tx-pending-box" />
        <text class="od-stage-name" x="960" y="379" text-anchor="middle">{{ appealGate.label }}</text>
      </g>
      <g :style="{ opacity: s.branches * s.branchDim }">
        <path d="M960 436 V500 H650 V552 M960 500 H1270 V552" class="wire"
          pathLength="1" stroke-dasharray="1" :stroke-dashoffset="ON - s.branches" />
        <rect x="432" y="552" width="436" height="108" class="node" />
        <text class="od-stage-name" x="650" y="596" text-anchor="middle">{{ triggerDisplay.board }}</text>
        <text class="od-stage-note" x="650" y="634" text-anchor="middle">{{ triggerDisplay.boardEffect }}</text>
        <rect x="1052" y="552" width="436" height="108" class="node" />
        <text class="od-stage-name" x="1270" y="614" text-anchor="middle">{{ triggerDisplay.closure }}</text>
      </g>
      <g :style="{ opacity: s.inputs * s.inputDim }">
        <path d="M412 500 H650 M1508 500 H1270" class="wire is-pending" />
        <rect x="112" y="444" width="300" height="108" class="tx-pending-box" />
        <rect x="1508" y="444" width="300" height="108" class="tx-pending-box" />
        <!-- The petitions ask for closure, so the petition feeds the closure branch. -->
        <text class="od-stage-name" x="262" y="484" text-anchor="middle">{{ trusteeRequest.label }}</text>
        <text class="od-stage-name" x="1658" y="484" text-anchor="middle">{{ petition.label }}</text>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">{{ triggerDisplay.countWord[0].toUpperCase() + triggerDisplay.countWord.slice(1) }} failing ratings leave the state {{ triggerDisplay.remedyCountWord }} choices.</h2>
      <div class="vt-campus-pair campus-pair">
        <svg viewBox="0 0 156 56" aria-hidden="true"><rect width="56" height="56" /><rect x="100" width="56" height="56" /></svg>
      </div>
      <span class="tx-tag is-pending gate-tag" :style="{ opacity: s.rootDim }">{{ triggerDisplay.appealsPending }}</span>
      <div class="input-tags" :style="{ opacity: s.inputs * s.inputDim }">
        <span class="tx-tag is-pending">{{ triggerDisplay.pending }}</span>
        <span class="tx-tag is-pending">{{ triggerDisplay.validationPending }}</span>
      </div>
      <StoryLink :href="triggerDisplay.sourceUrl" :label="triggerDisplay.source" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.campus-pair { position: absolute; left: calc(45.9375 * var(--sw)); top: calc(19.62963 * var(--sh)); width: calc(8.125 * var(--sw)); height: calc(5.185185 * var(--sh)); color: var(--od-amber); }
.campus-pair svg { width: var(--tx-full); height: var(--tx-full); }
.campus-pair rect { fill: currentColor; rx: var(--tx-radius-mark); }
.wire { fill: none; stroke: var(--od-amber); stroke-width: var(--tx-oval-stroke); }
.wire.is-pending { stroke-dasharray: var(--tx-pending-dash); }
.node { fill: var(--od-surface); stroke: var(--od-amber); stroke-width: var(--tx-hairline); rx: var(--tx-radius-card); }
.gate-tag { position: absolute; left: calc(50 * var(--sw)); top: calc(36.296296 * var(--sh)); transform: translateX(-50%); will-change: opacity; }
.input-tags { position: absolute; top: calc(46.296296 * var(--sh)); left: calc(13.645833 * var(--sw)); width: calc(72.708333 * var(--sw)); }
.input-tags > span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.input-tags > span:first-child { left: var(--tx-zero); }
.input-tags > span:last-child { left: var(--tx-full); }
</style>
