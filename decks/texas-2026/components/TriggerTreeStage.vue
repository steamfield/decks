<script setup lang="ts">
import { reactive } from 'vue'
import { DUR, DRAW, SETTLE, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import { triggeringCampuses } from '../data/05-two-campuses'
import { petition, trusteeRequest, triggerDisplay } from '../data/06-trigger-tree'

// Local tree geometry, kept clear of the fixed left-hand prose card.
const s = reactive({ branches: OFF, inputs: OFF, supplement: OFF, rootDim: ON, branchDim: ON, inputDim: ON })
const COPY = [
  { lead: 'The appeals determine whether this rule applies.', body: 'Final ratings and counted years are still pending.' },
  { lead: 'Replacing trustees or closing the campus becomes mandatory.', body: 'The commissioner orders the action under the petition rules.' },
  { lead: 'Petitions can determine which action is ordered.', body: 'Trustees may request an alternative; the commissioner may accept it.' },
  { lead: 'The commissioner can also appoint a monitor.', body: 'A monitor or conservator alone cannot satisfy the rule.' },
]
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { branches: ON, rootDim: DIM, duration: DUR.grow, ease: DRAW })
    beat(1)
    tl.to(s, { inputs: ON, branchDim: DIM, duration: DUR.grow, ease: DRAW })
    beat(2)
    tl.to(s, { supplement: ON, inputDim: DIM, duration: DUR.card, ease: SETTLE })
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: s.rootDim }">
        <text class="od-stage-name" x="1280" y="344" text-anchor="middle">{{ triggeringCampuses.map(c => c.name.replace(' Middle School', '')).join(' / ') }}</text>
        <path d="M1280 356 V380" class="wire" />
        <rect x="1040" y="380" width="480" height="96" class="tx-pending-box" />
        <text class="od-stage-name" x="1280" y="419" text-anchor="middle">{{ triggerDisplay.gate }}</text>
      </g>
      <g :style="{ opacity: s.branches * s.branchDim }">
        <path d="M1280 476 V540 H1060 V600 M1280 540 H1590 V600" class="wire"
          pathLength="1" stroke-dasharray="1" :stroke-dashoffset="ON - s.branches" />
        <rect x="842" y="600" width="436" height="120" class="node" />
        <text class="od-stage-name" x="1060" y="645" text-anchor="middle">{{ triggerDisplay.board }}</text>
        <text class="od-stage-note" x="1060" y="685" text-anchor="middle">{{ triggerDisplay.boardEffect }}</text>
        <rect x="1372" y="600" width="436" height="120" class="node" />
        <text class="od-stage-name" x="1590" y="668" text-anchor="middle">{{ triggerDisplay.closure }}</text>
      </g>
      <g :style="{ opacity: s.inputs * s.inputDim }">
        <path d="M1060 796 V760 H1324 V540 H1280 M1590 796 V760 H1324" class="wire is-pending" />
        <rect x="866" y="796" width="388" height="106" class="tx-pending-box" />
        <rect x="1396" y="796" width="388" height="106" class="tx-pending-box" />
        <text class="od-stage-name" x="1060" y="836" text-anchor="middle">{{ petition.label }}</text>
        <text class="od-stage-name" x="1590" y="836" text-anchor="middle">{{ trusteeRequest.label }}</text>
      </g>
      <g class="supplement" :style="{ opacity: s.supplement * DIM }">
        <text class="od-stage-note" x="1324" y="960" text-anchor="middle">{{ triggerDisplay.supplement }}</text>
        <text class="od-stage-note" x="1324" y="994" text-anchor="middle">{{ triggerDisplay.supplementLimit }}</text>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">After {{ triggerDisplay.countWord }} counted failing ratings, the commissioner must replace trustees or close the campus.</h2>
      <div class="vt-campus-pair campus-pair">
        <svg viewBox="0 0 102 46" aria-hidden="true"><rect width="46" height="46" /><rect x="56" width="46" height="46" /></svg>
      </div>
      <span class="tx-tag is-pending gate-tag" :style="{ opacity: s.rootDim }">{{ triggerDisplay.pending }}</span>
      <div class="input-tags" :style="{ opacity: s.inputs * s.inputDim }">
        <span class="tx-tag is-pending">{{ triggerDisplay.pending }}</span>
        <span class="tx-tag is-pending">{{ triggerDisplay.pending }}</span>
      </div>
      <StoryLink :href="triggerDisplay.sourceUrl" :label="triggerDisplay.source" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.campus-pair { position: absolute; left: calc(64.010417 * var(--sw)); top: calc(24.074074 * var(--sh)); width: calc(5.3125 * var(--sw)); height: calc(4.259259 * var(--sh)); color: var(--od-amber); }
.campus-pair svg { width: var(--tx-full); height: var(--tx-full); }
.campus-pair rect { fill: currentColor; rx: var(--tx-radius-mark); }
.wire { fill: none; stroke: var(--od-amber); stroke-width: var(--tx-oval-stroke); }
.wire.is-pending { stroke-dasharray: var(--tx-pending-dash); }
.node { fill: var(--od-surface); stroke: var(--od-amber); stroke-width: var(--tx-hairline); rx: var(--tx-radius-card); }
.gate-tag { position: absolute; left: calc(66.666667 * var(--sw)); top: calc(40 * var(--sh)); transform: translateX(-50%); will-change: opacity; }
.input-tags { position: absolute; top: calc(79.3 * var(--sh)); left: calc(55.208333 * var(--sw)); width: calc(27.604167 * var(--sw)); }
.input-tags > span { position: absolute; transform: translateX(-50%); }
.input-tags > span:first-child { left: var(--tx-zero); }
.input-tags > span:last-child { left: var(--tx-full); }
</style>
