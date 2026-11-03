<script setup lang="ts">
/**
 * Slide 10: every AISD campus open in 2026-27 as one square, colored by its
 * 2025-26 rating and inherited F history. Six receivers have their own violet
 * group; the final beat singles out the three own-record counts at four too.
 *
 * Cells run chronic (the two that crossed), then the nine one F from the
 * trigger, then the other D/F campuses, then C or better. Each square has a
 * stable campus identity. Visible groups stay contiguous per beat. Beat 3 re-lights
 * the nine outward from the rose pair: `rippleProgress` gives each cell its
 * own slice of the `nine` field by distance, inside `colorBy`, so the recolor
 * seeks like every other beat. The pings are pure functions of their fields
 * too, so they land invisible at every settled beat. They run as slow,
 * hairline beacons, each starting as the wave reaches its cell plus a small
 * hashed offset, so the nine light in an uneven sequence rather than on a beat.
 */
import CampusHoverCard from './CampusHoverCard.vue'
import { computed, reactive, ref, useId, watch } from 'vue'
import { useNav } from '@slidev/client'
import { routeEmbedNavigation } from 'slidev-addon-decks/composables/embed-navigation'
import {
  CANVAS,
  DUR,
  SETTLE,
  gsap,
  ink,
  clamp01,
  hashRange,
  hashSigned,
  rippleProgress,
  unitCellCenter,
  useStage,
  type UnitGridItem,
} from 'slidev-addon-decks/story'
import {
  waffleCampuses,
  waffleBaseGroup,
  waffleDisplayCampuses,
  waffleCounts,
  waffleOpenDf,
  waffleOpenDfThreeYears,
} from '../data/07-waffle'
import { accountabilitySourceUrl } from '../data/campuses'
const FINAL_ITEMS: UnitGridItem[] = waffleCampuses.map(campus => ({
  id: campus.campusNumber, category: campus.tier,
}))
/** Grid geometry: bound onto UnitGrid below and read by the cell-centre math. */
const GEOM = { origin: { x: 960, y: 215 }, cols: 12, cellWidth: 54, cellHeight: 54, gapX: 14, gapY: 14 }
const CELL = GEOM.cellWidth
const CELL_RX = 10
const corner = (i: number) => {
  const c = unitCellCenter(i, GEOM)
  return { x: c.x - CELL / 2, y: c.y - CELL / 2 }
}
const CHRONIC_IDX = FINAL_ITEMS.flatMap((it, i) => (it.category === 'chronic' ? [i] : []))
const FOUR_IDX = FINAL_ITEMS.flatMap((it, i) => (it.category === 'atFour' ? [i] : []))
/** The six of the nine carrying a closed school's record (own 2025-26 rating C or better). */
const RECEIVERS = waffleCampuses.filter(campus => campus.inheritedFrom).length
/** The three of the nine at four on their own record, already D or F. */
const OWN_RECORD = waffleCounts.atFour - RECEIVERS
/** The ripple starts between the two rose cells. */
const FROM = (() => {
  const cs = CHRONIC_IDX.map((i) => unitCellCenter(i, GEOM))
  return { x: cs.reduce((a, c) => a + c.x, 0) / cs.length, y: cs.reduce((a, c) => a + c.y, 0) / cs.length }
})()
const dist = (i: number) => {
  const c = unitCellCenter(i, GEOM)
  return Math.hypot(c.x - FROM.x, c.y - FROM.y)
}
const REACH = Math.max(...FOUR_IDX.map(dist))
/** Share of the `nine` field spent spreading the ripple. */
const RIPPLE = 0.5
/** The recolor wave across the nine, slow enough for the beacons to trail it. */
const NINE_DUR = DUR.morph * 2
/** One beacon, rise to fade. */
const PING_DUR = DUR.grow * 2
const NINE_SEED = 'aisd-waffle-nine'
/**
 * When each of the nine starts its beacon, in seconds into the beat: the moment
 * the ripple reaches it (the same lead `rippleProgress` computes, jitter
 * included), plus a hashed offset so neighbours never fire in lockstep.
 */
const NINE_START = new Map(
  FOUR_IDX.map((i) => {
    const lead = clamp01(dist(i) / REACH + hashSigned(NINE_SEED, i, 0.08))
    return [i, lead * RIPPLE * NINE_DUR + hashRange(NINE_SEED + '-ping', i, 0, DUR.card)]
  }),
)
const NINE_SPAN = Math.max(...NINE_START.values()) + PING_DUR
/** The crossed pair: the second beacon trails the first by a beat. */
const PAIR_START = CHRONIC_IDX.map((_, k) => k * DUR.card * 0.6)
const PAIR_SPAN = Math.max(...PAIR_START) + PING_DUR
/** A beacon's local progress inside a shared field running over `span` seconds. */
const beaconAt = (field: number, span: number, start: number) => clamp01((field * span - start) / PING_DUR)
/** Each cell eases through its own slice of the linear `nine` field. */
const settle: (t: number) => number = gsap.parseEase(SETTLE) ?? ((t) => t)

const s = reactive({ reveal: 0, recolor: 0, crossed: 0, pingPair: 0, nine: 0, pingNine: 0 })
const displayCampuses = computed(() => waffleDisplayCampuses(s.nine > 0))
const ITEMS = computed<UnitGridItem[]>(() => displayCampuses.value.map(campus => ({
  id: campus.campusNumber, category: campus.tier,
})))
const TOTAL = waffleCampuses.length
const COPY = [
  { lead: `${TOTAL} open campuses, rated by TEA.`, body: 'Every square is an AISD campus open this year, by its 2025-26 rating.' },
  { lead: `${waffleOpenDf} are rated D or F.`, body: `${waffleOpenDfThreeYears} of them for three straight years.` },
  { lead: 'Burnet and Webb crossed.', body: 'District-wide, 36 gained a grade; D/F fell from 41 to 31.' },
  { lead: 'Nine more are one F away.', body: "Six carry a closed school's record. Last year only three were at four." },
]
const { clicks, isActive, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => { tl.to(s, { reveal: 1, duration: DUR.scale, ease: SETTLE }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { recolor: 1, duration: DUR.color, ease: SETTLE })
    beat(1)
    // Beat 2 is the two campuses that crossed: the other D/F squares step back
    // to a dim amber so the rose pair is the only bright color on the grid,
    // while D/F still reads apart from C or better.
    tl.to(s, { crossed: 1, duration: DUR.color, ease: SETTLE })
    tl.to(s, { pingPair: 1, duration: PAIR_SPAN, ease: 'none' }, '<')
    beat(2)
    // Beat 3: the nine re-light outward from the rose pair, each pinged as
    // the wave reaches it.
    tl.to(s, { nine: 1, duration: NINE_DUR, ease: 'none' })
    tl.to(s, { pingNine: 1, duration: NINE_SPAN, ease: 'none' }, '<')
    beat(3)
  },
})
const colorBy = computed(() => {
  if (s.recolor < 0.5) return undefined
  const crossed = (s.crossed * 100).toFixed(1)
  // Blended rather than switched at a threshold: UnitGrid nests this string
  // inside its own color-mix, so the squares ease between inks across the
  // beat instead of snapping at the tween midpoint.
  const fallen = `color-mix(in oklab, ${DIM_AMBER} ${crossed}%, ${ink('amber', 2)})`
  return (item: UnitGridItem, index: number) => {
    if (item.category === 'chronic') return ink('rose', 3)
    if (item.category === 'dfOther') return fallen
    if (item.category === 'atFour') {
      const inherited = waffleBaseGroup(displayCampuses.value[index]) === 'inherited'
      const base = inherited ? `color-mix(in oklab, ${DIM_VIOLET} ${crossed}%, ${ink('violet', 2)})` : fallen
      const local = rippleProgress(s.nine, unitCellCenter(index, GEOM), FROM, RIPPLE, {
        reach: REACH,
        seed: NINE_SEED,
        index,
      })
      if (local <= 0) return base
      return `color-mix(in oklab, ${ink(inherited ? 'violet' : 'amber', 3)} ${(settle(local) * 100).toFixed(1)}%, ${base})`
    }
    return ink('slate', 1)
  }
})
/** Legend rows dim with the squares they name. */
const DIM = 0.62
/** Where the D/F squares step back to at beat 2: the legend swatch's dimmed amber. */
const DIM_AMBER = `color-mix(in oklab, ${ink('amber', 2)} ${((1 - DIM) * 100).toFixed(0)}%, ${CANVAS})`
const DIM_VIOLET = `color-mix(in oklab, ${ink('violet', 2)} ${((1 - DIM) * 100).toFixed(0)}%, ${CANVAS})`
/**
 * Until the nine light (beat 3) there is no nine tier on the grid: the three
 * own-record cells read as other D/F. The receivers always have their own
 * violet tier; the final beat separates the three own-record counts too.
 */
const nineLit = computed(() => s.nine > 0)
const nineKey = computed(() => String(clamp01(s.nine / RIPPLE)))
const otherKey = computed(() => String(1 - DIM * s.crossed))
const dfOtherCount = computed(() => waffleCounts.dfOther + (nineLit.value ? 0 : OWN_RECORD))
const receiverKey = computed(() => String(1 - DIM * s.crossed * (1 - s.nine)))
const hoverCampus = ref<string | null>(null)
const focusCampus = ref<string | null>(null)
const activeCampus = computed(() => hoverCampus.value ?? focusCampus.value)
const selected = computed(() => waffleCampuses.find(c => c.campusNumber === activeCampus.value))
const tooltipId = useId()
const { next, prev } = useNav()
const onNext = (event: KeyboardEvent) => { if (!routeEmbedNavigation(event)) next() }
const onPrev = (event: KeyboardEvent) => { if (!routeEmbedNavigation(event)) prev() }
const cellStyle = (i: number) => ({
  left: `${corner(i).x / 19.2}%`, top: `${corner(i).y / 10.8}%`,
  width: `${CELL / 19.2}%`, height: `${CELL / 10.8}%`,
})
function dismiss() {
  hoverCampus.value = null
  focusCampus.value = null
}
watch([clicks, isActive], dismiss)
</script>
<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <UnitGrid v-bind="GEOM" :items="ITEMS" glyph="square" :color="ink('slate', 1)" :color-by="colorBy" seed="aisd-waffle" :reveal="s.reveal" :recolor="s.recolor" />
      </g>
      <InkPing
        v-for="(i, k) in CHRONIC_IDX"
        :key="'pair-' + i"
        :x="corner(i).x"
        :y="corner(i).y"
        :width="CELL"
        :height="CELL"
        :rx="CELL_RX"
        hue="rose"
        beacon
        :progress="beaconAt(s.pingPair, PAIR_SPAN, PAIR_START[k])"
      />
      <InkPing
        v-for="i in FOUR_IDX"
        :key="'nine-' + i"
        :x="corner(i).x"
        :y="corner(i).y"
        :width="CELL"
        :height="CELL"
        :rx="CELL_RX"
        :hue="waffleCampuses[i].inheritedFrom ? 'violet' : 'amber'"
        beacon
        :progress="beaconAt(s.pingNine, NINE_SPAN, NINE_START.get(i) ?? 0)"
      />
    </template>
    <template #overlay>
      <!-- Verbatim headline preserved from the October 2026 AISD talk. -->
      <h2 class="od-story-head">It is not just two schools.</h2> <!-- lint-allow: not-just-reveal -->
      <!-- One legend block rather than three floating chips: the tiers are a
           key to the grid, so they read as one zone beside the card. -->
      <div v-show="!selected" class="waffle-key" :style="{ opacity: String(s.recolor) }">
        <div class="waffle-key-row is-chronic">
          <span class="waffle-swatch rose" />
          <span class="waffle-key-label">{{ waffleCounts.chronic }} crossed the fifth F</span>
        </div>
        <div v-if="nineLit" class="waffle-key-row is-own" :style="{ opacity: nineKey }">
          <span class="waffle-swatch amber" />
          <span class="waffle-key-label">{{ OWN_RECORD }} at four Fs on their own record</span>
        </div>
        <div class="waffle-key-row" :style="{ opacity: otherKey, order: nineLit ? 4 : 3 }">
          <span class="waffle-swatch amber" />
          <span class="waffle-key-label">{{ dfOtherCount }} other D or F</span>
        </div>
        <div class="waffle-key-row" :style="{ opacity: receiverKey, order: nineLit ? 3 : 4 }">
          <span class="waffle-swatch violet" />
          <span class="waffle-key-label">{{ RECEIVERS }} inherited four Fs</span>
        </div>
        <div class="waffle-key-row is-other">
          <span class="waffle-swatch slate" />
          <span class="waffle-key-label">{{ waffleCounts.other }} other C or better</span>
        </div>
      </div>
      <div class="campus-targets" @keydown.esc.stop.prevent="dismiss">
        <button
          v-for="(campus, i) in displayCampuses"
          :key="campus.campusNumber"
          type="button"
          class="campus-target"
          :class="{ 'is-selected': activeCampus === campus.campusNumber }"
          :style="cellStyle(i)"
          :data-campus="campus.campusNumber"
          :aria-label="`${campus.campus}: grade ${campus.rating}, ${campus.consecutiveFs} consecutive F ratings${campus.inheritedFrom ? ', inherited count' : ''}`"
          :aria-describedby="activeCampus === campus.campusNumber ? tooltipId : undefined"
          @pointerenter="hoverCampus = campus.campusNumber"
          @pointerleave="hoverCampus = null"
          @focus="focusCampus = campus.campusNumber"
          @blur="focusCampus = null"
          @click.stop="focusCampus = campus.campusNumber"
          @keydown.enter.stop
          @keydown.space.stop
          @keydown.right.stop.prevent="onNext"
          @keydown.left.stop.prevent="onPrev"
        />
        <Transition name="campus-hover">
        <CampusHoverCard v-if="selected" :id="tooltipId" :key="selected.campusNumber"
          :campus="selected" :consecutive-fs="selected.consecutiveFs"
          :inherited-from="selected.inheritedFrom?.campus" :own-consecutive-fs="selected.ownConsecutiveFs" />
        </Transition>
      </div>
      <div class="hover-hint">Hover or focus a square for campus details.</div>
      <StoryLink :href="accountabilitySourceUrl" label="Source: TEA 2026 accountability data · F counts derived" />
    </template>
    <template #card>
      <StoryCard v-show="!selected" anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* The key sits in the left column, under the headline and above the card. */
.waffle-key {
  position: absolute;
  left: calc(5.7 * var(--sw));
  top: calc(34 * var(--sh));
  display: flex;
  flex-direction: column;
  gap: calc(2.4 * var(--sh));
}
.waffle-key-row {
  display: flex;
  align-items: center;
  gap: calc(1 * var(--sw));
}
.waffle-key-row.is-chronic { order: 1; }
.waffle-key-row.is-own { order: 2; }
.waffle-key-row.is-other { order: 5; }
.waffle-swatch {
  width: calc(1.1 * var(--sw));
  height: calc(1.1 * var(--sw));
  border-radius: 3px;
}
.waffle-swatch.rose { background: var(--od-rose); }
.waffle-swatch.amber { background: var(--od-amber); }
.waffle-swatch.violet { background: var(--od-violet); }
.waffle-swatch.slate { background: var(--od-slate); }
.waffle-key-label {
  font-size: calc(1.2 * var(--sw));
  color: var(--od-text-secondary);
}
.campus-target {
  position: absolute;
  padding: 0;
  border: 2px solid transparent;
  border-radius: calc(0.52 * var(--sw));
  background: transparent;
  pointer-events: auto;
  cursor: help;
}
.campus-target.is-selected,
.campus-target:focus-visible {
  border-color: var(--od-text);
  outline: 2px solid var(--od-canvas);
  outline-offset: 2px;
}
.campus-tooltip {
  position: absolute;
  left: calc(5.7 * var(--sw));
  top: calc(22 * var(--sh));
  width: calc(38 * var(--sw));
}
.hover-hint { position: absolute; left: calc(50 * var(--sw)); top: calc(78 * var(--sh)); font-size: calc(1 * var(--sw)); color: var(--od-text-muted); }
@media print {
  .campus-targets, .hover-hint { display: none; }
}
</style>
