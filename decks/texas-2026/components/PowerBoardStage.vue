<script setup lang="ts">
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, easedStagger, useStage } from 'slidev-addon-decks/story'
import { BOARD, DASH, DIM, FRAME, OFF, ON, OVAL, changed, neutral } from './design'
import { statewideOffices, house, senate, sboe, certification, electionSource, boardLabels, evidenceLabels } from '../data/02-power-board'
import BallotOval from './BallotOval.vue'

// Governor and Senate keep their positions in the ladder; the other offices cross-fade.
const G = { x: 832, width: FRAME.right - 832, height: 88, groupHeight: 128 }
const groupWidth = (G.width - BOARD.gap) / 2
const TILES = [
  { ...statewideOffices[0], x: G.x, y: 280, width: G.width, height: G.height, group: false },
  { ...statewideOffices[1], x: G.x, y: 380, width: G.width, height: G.height, group: false },
  { ...statewideOffices[2], x: G.x, y: 480, width: groupWidth, height: G.groupHeight, group: true },
  { ...statewideOffices[3], x: G.x + groupWidth + BOARD.gap, y: 480, width: groupWidth, height: G.groupHeight, group: true },
  { ...house, name: `${house.democratic} Democratic, ${house.republican} Republican`, x: G.x, y: 620, width: G.width, height: G.height, group: false },
  { ...senate, name: `${senate.republican} Republican, ${senate.democratic} Democratic`, x: G.x, y: 720, width: G.width, height: G.height, group: false },
  { ...sboe, name: `${sboe.democratic} Democratic, ${sboe.republican} Republican`, x: G.x, y: 820, width: G.width, height: 136, group: false },
]
const shared = (i: number) => i === 0 || i === 5
const COPY = [
  { lead: `Democrats won ${statewideOffices.length} statewide offices.`, body: 'The winners have yet to take office.' },
  { lead: 'The House has a Democratic majority.', body: 'The final House seat count is pending.' },
  { lead: 'Republicans kept the Senate.', body: `${senate.republican} Republican and ${senate.democratic} Democratic seats are expected next session.` },
  { lead: `The education-board majority depends on District ${sboe.district}.`, body: `A Democratic win there would give the party ${sboe.democratic} seats. A recount is possible.` },
]
const descriptions = [
  `${statewideOffices.map(office => `${office.name}, ${office.party}, won ${office.office}`).join('. ')}. ${certification.label}.`,
  `${house.office}: projected ${house.democratic} Democratic and ${house.republican} Republican seats. ${evidenceLabels.pending}.`,
  `${senate.office}: ${senate.republican} Republican and ${senate.democratic} Democratic seats expected next session.`,
  `${sboe.office}: ${sboe.democratic} Democratic and ${sboe.republican} Republican seats projected. ${evidenceLabels.pending}. District ${sboe.district}: ${sboe.recount}.`,
]
const tiles = reactive(TILES.map(() => ({ fill: OFF, emphasis: ON })))
const s = reactive({ senate: OFF, pending: OFF, ping: OFF })
const color = (i: number) => i === 5 ? neutral(3) : `color-mix(in srgb, ${changed()} ${tiles[i].fill * 100}%, ${neutral(2)})`
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => {
    statewideOffices.forEach((_, i) => {
      tl.to(tiles[i], { fill: ON, duration: DUR.color, ease: DRAW }, easedStagger(i, statewideOffices.length, DUR.grow))
    })
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(tiles.slice(0, statewideOffices.length), { emphasis: DIM, duration: DUR.opacity, ease: SETTLE })
    tl.to(tiles[4], { fill: ON, duration: DUR.color, ease: DRAW }, '<')
    beat(1)
    tl.to(tiles[4], { emphasis: DIM, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { senate: ON, ping: ON, duration: DUR.grow, ease: DRAW }, '<')
    beat(2)
    tl.to(tiles[5], { emphasis: DIM, duration: DUR.opacity, ease: SETTLE })
    tl.to(tiles[6], { fill: ON, duration: DUR.color, ease: DRAW }, '<')
    tl.to(s, { pending: ON, duration: DUR.color, ease: SETTLE }, '<')
    beat(3)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">Democrats won {{ statewideOffices.length }} statewide offices and the House.</h2>
      <p class="sr-only">{{ descriptions[clicks] }}</p>
      <div class="tx-baseline" />
      <StoryLayer v-for="morph in [false, true]" :key="String(morph)" :class="morph ? 'vt-power-board' : undefined">
        <template v-for="(tile, i) in TILES" :key="tile.office">
        <g v-if="shared(i) === morph" :data-office="tile.office" :style="{ opacity: tiles[i].emphasis }">
          <rect class="tx-office-box tile" :x="tile.x" :y="tile.y" :width="tile.width" :height="tile.height"
            :style="{ stroke: color(i) }" :stroke-dasharray="i === 6 ? DASH : undefined" />
          <BallotOval :cx="tile.x + BOARD.pad + OVAL.rx" :cy="tile.y + G.height / 2"
            state="filled" :meaning="i === 5 || tiles[i].fill === OFF ? 'neutral' : 'changed'" :fill="i === 5 ? s.senate : tiles[i].fill" :pending="i === 6" />
          <text :class="tile.group || i === 6 ? 'od-stage-note office' : 'od-stage-name'" :x="tile.x + 124" :y="tile.y + 33">
            {{ tile.office }}
          </text>
          <text :class="tile.group || i === 6 ? 'od-stage-note' : 'od-stage-name holder'" :x="tile.x + (tile.group || i === 6 ? 124 : 400)" :y="tile.y + (tile.group || i === 6 ? 64 : 33)">{{ tile.name }}</text>
          <text v-if="i < statewideOffices.length" class="od-stage-note" :x="tile.x + (tile.group ? 124 : 400)" :y="tile.y + (tile.group ? 100 : 64)">{{ tile.party }}</text>
          <foreignObject v-if="i === 4 || i === 6" :x="tile.x + 740" :y="tile.y + 43" width="180" height="42">
            <span class="tx-tag is-pending">{{ evidenceLabels.pending }}</span>
          </foreignObject>
          <text v-if="i === 6" class="od-stage-note result-note" :x="tile.x + 124" :y="tile.y + 108" :style="{ opacity: s.pending }">{{ `District ${sboe.district}: possible recount` }}</text>
        </g>
        </template>
        <InkPing v-if="morph" :x="G.x + BOARD.pad + OVAL.rx" :y="TILES[5].y + G.height / 2" :r="OVAL.rx" hue="slate" :progress="s.ping" />
      </StoryLayer>
      <StoryLink :href="[electionSource, boardLabels.houseSource, boardLabels.senateSource, boardLabels.educationSource][clicks]" :label="clicks ? boardLabels.reportingSource : boardLabels.officialSource" />
    </template>
    <template #card><StoryCard anchor="left" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.office { fill: var(--od-text); }
.tile { rx: var(--tx-radius-mark); }
.holder { font-weight: var(--tx-body-weight); }
.tx-tag { font-size: var(--tx-svg-note); }
.result-note { fill: var(--od-amber); }
</style>
