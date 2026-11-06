<script setup lang="ts">
import { reactive } from 'vue'
import { DUR, DRAW, useScriptedDemo, useStageEntrance } from 'slidev-addon-decks/story'
import { FIELD, FRAME, OFF, ON } from './design'
import BallotOval from './BallotOval.vue'

// FLAG: replace with data/02-power-board.ts. Contract-supplied outcomes, pending research.
const OFFICES = [
  { name: 'Governor', won: true },
  { name: 'Lt. Governor', won: true },
  { name: 'Attorney General', won: true },
  { name: 'Comptroller', won: true },
  { name: 'Texas House', won: true },
  { name: 'Texas Senate', won: false },
]

/** One public fill progress per row; the cover's entrance owns its settle. */
const fills = reactive(OFFICES.map(() => ({ fill: OFF })))
const { clicks, isActive } = useScriptedDemo()
useStageEntrance((tl) => {
  OFFICES.forEach((office, i) => {
    if (office.won) tl.to(fills[i], { fill: ON, duration: DUR.color, ease: DRAW })
  })
}, { clicks, isActive })
defineExpose({ fills })
</script>

<template>
  <svg class="tx-ballot-field" :viewBox="FRAME.viewBox" role="img"
    aria-label="Governor, Lieutenant Governor, Attorney General, Comptroller and Texas House changed hands; Texas Senate did not.">
    <g v-for="(office, i) in OFFICES" :key="office.name" :transform="`translate(0 ${FIELD.y + i * FIELD.gap})`">
      <text class="tx-field-label" :x="FIELD.x" :y="FIELD.labelDy">{{ office.name }}</text>
      <line class="tx-field-rule" :x1="FIELD.x" :x2="FRAME.right" :y1="FIELD.ruleY" :y2="FIELD.ruleY" />
      <BallotOval :cx="FIELD.ovalX" :cy="OFF" :state="office.won ? 'filled' : 'empty'"
        :meaning="office.won ? 'changed' : 'neutral'" :fill="fills[i].fill" />
    </g>
  </svg>
</template>
