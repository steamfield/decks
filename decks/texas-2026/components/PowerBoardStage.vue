<script setup lang="ts">
/** Design sample for author approval. The slide 2 run will replace this stage. */
import { reactive } from 'vue'
import { DUR, useStage } from 'slidev-addon-decks/story'
import { BOARD, DIM, OFF, ON, OVAL, PING, neutral } from './design'
import BallotOval from './BallotOval.vue'

// FLAG: replace office results with data/02-power-board.ts when research lands.
// Filled, empty and hatched marks are provisional specimens, not verified outcomes.
const TILES = [
  { office: 'Governor', note: 'FLAG: winner and party', status: 'Won', state: 'filled', meaning: 'changed' },
  { office: 'Texas Senate', note: 'FLAG: chamber split', status: 'Not won', state: 'empty', meaning: 'neutral' },
  { office: 'State board', note: 'FLAG: District 8 result', status: 'Scenario', state: 'hatched', meaning: 'neutral' },
] as const
const COPY = [
  { lead: 'FLAG: Governor result.', body: 'Winner and party awaiting research.' },
  { lead: 'FLAG: Austin ISD decision.', body: 'Decision and responsible office awaiting research.' },
  { lead: 'FLAG: Texas House result.', body: 'Chamber split awaiting research.' },
  { lead: 'FLAG: Texas Senate result.', body: 'Chamber split awaiting research.' },
]
const s = reactive({ pending: OFF, earlier: ON, ping: OFF })
const tileX = (i: number) => BOARD.x + i * (BOARD.width + BOARD.gap)
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { pending: ON, duration: DUR.color })
    beat(1)
    tl.to(s, { earlier: DIM, duration: DUR.opacity })
    beat(2)
    tl.to(s, { ping: ON, duration: DUR.grow })
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g v-for="(tile, i) in TILES" :key="tile.office" class="tx-office"
        :style="{ opacity: i === 0 ? s.earlier : ON }">
        <rect class="tx-office-box" :x="tileX(i)" :y="BOARD.y" :width="BOARD.width" :height="BOARD.height" />
        <text class="od-stage-name" :x="tileX(i) + BOARD.pad" :y="BOARD.y + BOARD.nameY">{{ tile.office }}</text>
        <text class="od-stage-note" :x="tileX(i) + BOARD.pad" :y="BOARD.y + BOARD.noteY">{{ tile.note }}</text>
        <BallotOval :cx="tileX(i) + BOARD.ovalX" :cy="BOARD.y + BOARD.ovalY" :state="tile.state" :meaning="tile.meaning" />
        <text class="tx-office-status" :x="tileX(i) + BOARD.statusX" :y="BOARD.y + BOARD.statusY">{{ tile.status }}</text>
      </g>
      <g class="tx-pending-item" :style="{ opacity: s.pending }">
        <rect class="tx-pending-box" :x="BOARD.riskX" :y="BOARD.riskY" :width="BOARD.riskWidth" :height="BOARD.riskHeight" />
        <text class="tx-risk-label" :x="BOARD.riskTextX" :y="BOARD.riskTextY">AISD decision · Pending</text>
      </g>
      <ellipse class="tx-ping" :cx="tileX(1) + BOARD.ovalX" :cy="BOARD.y + BOARD.ovalY"
        :rx="OVAL.rx * (ON + PING.growth * s.ping)" :ry="OVAL.ry * (ON + PING.growth * s.ping)"
        :style="{ opacity: PING.peak * Math.sin(Math.PI * s.ping), stroke: neutral(3) }" />
    </template>
    <template #overlay>
      <h2 class="od-story-head">FLAG: Governor, House and Senate results.</h2>
      <div class="tx-baseline" />
      <div class="tx-sample-caption">
        <span>Design sample</span>
        <span class="tx-tag is-reported">Reported date</span>
        <span class="tx-tag is-pending">Pending</span>
        <span class="tx-tag is-scenario">Scenario</span>
      </div>
    </template>
    <template #card>
      <StoryCard anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
