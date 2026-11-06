<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue'
import { useNav } from '@slidev/client'
import { routeEmbedNavigation } from 'slidev-addon-decks/composables/embed-navigation'
import { DUR, DRAW, SETTLE, useStage, unitCellCenter, type UnitGridItem } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, neutral, risk } from './design'
import { accountabilitySource, campusDisplay, campusLabels, triggeringCampuses, waffleCampuses, waffleUniverse } from '../data/05-two-campuses'
import CampusHoverCard from './CampusHoverCard.vue'

// Preserve campus identity from the port; only the appealed pair receives a color.
const pairIds = new Set<string>(triggeringCampuses.map(campus => campus.campusNumber))
const campuses = [...waffleCampuses].sort((a, b) => Number(pairIds.has(b.campusNumber)) - Number(pairIds.has(a.campusNumber)))
const items: UnitGridItem[] = campuses.map(campus => ({ id: campus.campusNumber }))
// Local geometry: the approved system has no waffle spacing tokens.
const GRID = { origin: { x: 132, y: 310 }, cols: 17, cellWidth: 56, cellHeight: 56, gapX: 44, gapY: 14 }
const width = GRID.cols * (GRID.cellWidth + GRID.gapX) - GRID.gapX
const pairWidth = GRID.cellWidth * triggeringCampuses.length + GRID.gapX
const cell = (i: number) => unitCellCenter(i, GRID)
const chipX = (i: number) => 200 + i * 240
const s = reactive({ reveal: OFF, pair: OFF, ping: OFF, board: OFF, dim: ON })
const COPY = [
  { lead: `${waffleUniverse.visible} open campuses have a rating.`, body: 'The count excludes closed campuses and programs without a letter grade.' },
  { lead: 'The appeals could prevent board replacement.', body: 'Their final ratings and counted years remain pending.' },
  { lead: 'The elected board could be replaced.', body: 'A state-appointed board would govern the whole district.' },
]
const { clicks, copy, beats, isActive } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { reveal: ON, duration: DUR.scale, ease: SETTLE }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { pair: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { ping: ON, duration: DUR.scale, ease: DRAW }, '<')
    beat(1)
    tl.to(s, { board: ON, dim: DIM, duration: DUR.grow, ease: DRAW })
    beat(2)
  },
})
const pairColor = computed(() => `color-mix(in oklab, ${risk()} ${s.pair * 100}%, ${neutral()})`)
const colorBy = (item: UnitGridItem) => pairIds.has(String(item.id)) ? 'transparent' : neutral()
const hoveredId = ref<string | null>(null)
const focusedId = ref<string | null>(null)
const selectedId = computed(() => hoveredId.value ?? focusedId.value)
const selected = computed(() => campuses.find(campus => campus.campusNumber === selectedId.value))
const tooltipId = useId()
function dismiss() { hoveredId.value = null; focusedId.value = null }
watch([clicks, isActive], dismiss)
const { next, prev } = useNav()
const onNext = (event: KeyboardEvent) => { if (!routeEmbedNavigation(event)) next() }
const onPrev = (event: KeyboardEvent) => { if (!routeEmbedNavigation(event)) prev() }
const targetStyle = (i: number) => ({
  left: `${(cell(i).x - GRID.cellWidth / 2) / 19.2}%`, top: `${(cell(i).y - GRID.cellHeight / 2) / 10.8}%`,
  width: `${GRID.cellWidth / 19.2}%`, height: `${GRID.cellHeight / 10.8}%`,
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: s.dim }">
        <UnitGrid v-bind="GRID" :items="items" glyph="square" :color="neutral()" :color-by="colorBy"
          :recolor="ON" :reveal="s.reveal" seed="tx-campus-waffle" filter-id="none" />
      </g>
      <InkPing v-for="(_, i) in triggeringCampuses" :key="i" :x="cell(i).x - GRID.cellWidth / 2"
        :y="cell(i).y - GRID.cellHeight / 2" :width="GRID.cellWidth" :height="GRID.cellHeight"
        hue="amber" :progress="s.ping" />
      <g :style="{ opacity: s.board }">
        <path :d="`M ${GRID.origin.x} 732 v 20 h ${width * s.board} v -20`" class="board-bracket" />
        <text :x="GRID.origin.x + width / 2" y="794" text-anchor="middle" class="od-stage-name" :style="{ fill: risk() }">{{ campusLabels.board }}</text>
      </g>
      <g :style="{ opacity: s.pair }">
        <path v-for="(_, i) in triggeringCampuses" :key="i" :d="`M ${chipX(i)} 288 L ${cell(i).x} ${GRID.origin.y}`" class="board-bracket" />
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">{{ campusDisplay.countWord }} schools could cost {{ campusDisplay.city }} its elected board.</h2>
      <div class="vt-campus-pair campus-pair" :style="{ opacity: s.reveal, color: pairColor }">
        <svg :viewBox="`0 0 ${pairWidth} ${GRID.cellHeight}`" aria-hidden="true">
          <rect v-for="(_, i) in triggeringCampuses" :key="i" :x="i * (GRID.cellWidth + GRID.gapX)"
            :width="GRID.cellWidth" :height="GRID.cellHeight" />
        </svg>
      </div>
      <div v-for="(campus, i) in triggeringCampuses" :key="campus.campusNumber" class="campus-chip"
        :style="{ opacity: s.pair, left: `${chipX(i) / 19.2}%` }">
        <div>{{ campus.name.replace(' Middle School', '') }}</div>
        <span class="tx-tag is-pending">{{ campusDisplay.appeal }}</span>
      </div>
      <div class="campus-targets" @keydown.esc.stop.prevent="dismiss">
        <button v-for="(campus, i) in campuses" :key="campus.campusNumber" type="button" class="campus-target"
          :style="targetStyle(i)" :aria-label="campus.campus" :aria-describedby="selectedId === campus.campusNumber ? tooltipId : undefined"
          @pointerenter="hoveredId = campus.campusNumber" @pointerleave="hoveredId = null"
          @focus="focusedId = campus.campusNumber" @blur="focusedId = null" @click.stop="focusedId = campus.campusNumber"
          @keydown.enter.stop @keydown.space.stop
          @keydown.right.stop.prevent="onNext" @keydown.left.stop.prevent="onPrev" />
      </div>
      <CampusHoverCard v-if="selected" :id="tooltipId" :campus="selected" />
      <StoryLink :href="accountabilitySource" :label="campusDisplay.source" />
    </template>
    <template #card>
      <StoryCard v-show="!selected" anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
:deep(.od-unit-grid rect) { rx: var(--tx-radius-mark); }
.board-bracket { stroke: var(--od-amber); stroke-width: var(--tx-oval-stroke); fill: none; }
.campus-pair { position: absolute; left: calc(6.875 * var(--sw)); top: calc(28.703704 * var(--sh)); width: calc(8.125 * var(--sw)); height: calc(5.185185 * var(--sh)); }
.campus-pair svg { width: var(--tx-full); height: var(--tx-full); }
.campus-pair rect { fill: currentColor; rx: var(--tx-radius-mark); }
.campus-chip { position: absolute; top: calc(18.888889 * var(--sh)); transform: translateX(-50%); text-align: center; font-size: var(--tx-body-size); line-height: var(--tx-body-leading); color: var(--od-amber); }
.campus-target { position: absolute; pointer-events: auto; background: transparent; border: none; padding: var(--tx-zero); border-radius: var(--tx-radius-mark); cursor: help; }
.campus-target:focus-visible { outline: var(--tx-hairline) solid var(--od-text); }
@media print { .campus-targets { display: none; } }
</style>
