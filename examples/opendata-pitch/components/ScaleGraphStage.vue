<script setup lang="ts">
/**
 * Slide 4: the catalog as a field of squares, then as the graph it forms.
 *
 * Four beats. On entry the dataset card from slide 3 (same box, same
 * `vt-seed-square` name, so the view transition carries it across) shrinks
 * into the first cell of the field and the field inks in around it: one new
 * dataset joining the catalog. Then the field recolors by category, cross
 * fades into the 3D graph, and freezes while a July to today comparison is
 * drawn beside it.
 *
 * The squares do not fly into the nodes one by one. Node positions come out
 * of the force layout inside the WebGL renderer and are not readable from
 * here until it settles, so a per node flight would be animating toward
 * coordinates that are still moving. The beat is a cross fade over DUR.morph
 * between the field and the canvas instead, with the graph mounted a beat
 * early so its layout has already settled when the fade starts.
 */
import { computed, reactive } from 'vue'
import {
  CANVAS,
  clamp01,
  DRAW,
  DUR,
  ink,
  lerp,
  TRACE,
  useStage,
  useStageMap,
} from 'slidev-addon-decks/story'
import {
  JULY_EDGES,
  JULY_NODES,
  TOTAL_AGENCIES,
  TOTAL_DATASETS,
  TOTAL_ROWS,
} from '../data/catalog-totals'
import { categoryCounts, graphEdges, graphNodes } from '../data/graph-data'
import { colorForCategory } from '../data/graph-palette'
import { GRAPH_ZOOM } from '../data/graph-view'
import { DATASET_CARD_BOX, DATASET_META, DATASET_NAME } from '../data/isbe-files'

const NODE_COUNT = graphNodes.length
const EDGE_COUNT = graphEdges.length

/* ── Field geometry, in 1920x1080 viewBox units ── */
const COLS = 56
const CELL = 15
const GAP = 7
const PITCH = CELL + GAP
const FIELD_WIDTH = COLS * PITCH - GAP
const ORIGIN = { x: Math.round((1920 - FIELD_WIDTH) / 2), y: 300 }

const fmt = (n: number) => n.toLocaleString('en-US')

const BASE_INK = ink('slate', 2)
/** What a field cell actually paints: the base ink at the grid's fill opacity over the canvas. */
const CELL_FILL = `color-mix(in srgb, ${BASE_INK} 92%, ${CANVAS})`

/**
 * Cells are ordered by cluster size, largest first, so the recolor beat
 * produces contiguous blocks that a label can actually point at. The graph
 * itself reads the snapshot in its published order.
 */
const orderedNodes = computed(() =>
  [...graphNodes].sort(
    (a, b) =>
      (categoryCounts[b.category] ?? 0) - (categoryCounts[a.category] ?? 0) ||
      a.category.localeCompare(b.category) ||
      a.id.localeCompare(b.id),
  ),
)

const cells = computed(() =>
  orderedNodes.value.map((node) => ({ id: node.id, category: node.category })),
)

const TOP_FOUR = Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 4)
  .map(([category]) => category)
const CATEGORY_COUNT = Object.keys(categoryCounts).length
const TOP_FOUR_TOTAL = TOP_FOUR.reduce((n, category) => n + (categoryCounts[category] ?? 0), 0)
const REST_COUNT = CATEGORY_COUNT - TOP_FOUR.length
const REST_TOTAL = NODE_COUNT - TOP_FOUR_TOTAL

const LABEL_X = ORIGIN.x + FIELD_WIDTH + 26
const labelY = (first: number, count: number) =>
  ORIGIN.y + Math.floor((first + count / 2) / COLS) * PITCH + CELL / 2 + 10

/**
 * End labels for the four largest clusters, plus one legend row standing for
 * every band below them: thirteen unlabelled colours read as decoration, and
 * thirteen labels do not fit beside a field this tall.
 */
const clusterLabels = computed(() => {
  const top = TOP_FOUR.map((category) => {
    const first = cells.value.findIndex((cell) => cell.category === category)
    const count = categoryCounts[category] ?? 0
    return {
      category,
      text: `${category} ${count}`,
      color: colorForCategory(category),
      x: LABEL_X,
      y: labelY(first, count),
    }
  })

  return [
    ...top,
    {
      category: 'rest',
      text: `${REST_COUNT} others ${fmt(REST_TOTAL)}`,
      color: ink('slate', 3),
      x: LABEL_X,
      y: labelY(TOP_FOUR_TOTAL, REST_TOTAL),
    },
  ]
})

/* ── Comparison bars: July snapshot against today, drawn on the frozen graph ── */
const BARS = {
  x: 1270,
  /** Short enough that the longest end label still clears the card's edge. */
  width: 300,
  height: 22,
  gap: 14,
  rows: [
    { key: 'datasets', y: 400, july: JULY_NODES, now: NODE_COUNT },
    { key: 'relationships', y: 560, july: JULY_EDGES, now: EDGE_COUNT },
  ],
}
/** The bars sit on the house card, so they read as a panel over the graph. */
const BARS_CARD = { x: 1230, y: 340, w: 610, h: 320 }
const NOW_INK = ink('cyan', 3)
const JULY_INK = ink('slate', 2)

const COPY = [
  {
    lead: `${TOTAL_DATASETS} datasets. ${TOTAL_AGENCIES} agencies. ${TOTAL_ROWS} rows.`,
    body: 'Every square is one dataset OpenData agents cleaned and published.',
  },
  {
    lead: `${CATEGORY_COUNT} categories, four of them most of the catalog.`,
    body: `Education, government, health and economics are ${fmt(TOP_FOUR_TOTAL)} of the ${fmt(NODE_COUNT)}.`,
  },
  {
    lead: `${NODE_COUNT} datasets. ${fmt(EDGE_COUNT)} relationships.`,
    body: `${NODE_COUNT} of the ${TOTAL_DATASETS} are ready and linked. The graph is how an agent sees the connections.`,
  },
  {
    lead: 'Seven weeks, and the graph grew by half.',
    body: `${fmt(JULY_NODES)} datasets and ${fmt(JULY_EDGES)} links in July; ${fmt(NODE_COUNT)} and ${fmt(EDGE_COUNT)} today.`,
  },
]

/* ── Beat state ── */
const s = reactive({
  join: 0,
  reveal: 0,
  recolor: 0,
  labels: 0,
  field: 1,
  /** The grid loosening into a cloud: cells drift toward the centre and jitter. */
  scatter: 0,
  graph: 0,
  graphDim: 1,
  bars: 0,
})

const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  /**
   * Enter only: the card shrinks into its cell, then the field inks in. The
   * composable waits for an in flight view transition, so the card has landed
   * before it moves.
   */
  enter: (tl) => {
    tl.to(s, { join: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`)
    tl.to(s, { reveal: 1, duration: DUR.bloom, ease: DRAW }, `-=${DUR.card}`)
  },
  beats: (tl, beat) => {
    beat(0)

    tl.to(s, { recolor: 1, duration: DUR.color })
    tl.to(s, { labels: 1, duration: DUR.card }, '<')
    beat(1)

    // The grid does not cut to the graph. It loosens first: every square
    // drifts in toward the centre and off its row on a hashed jitter, so the
    // field reads as a node cloud, the graph comes up underneath it, and the
    // cloud fades quickly once the nodes are showing through it.
    tl.to(s, { labels: 0, duration: DUR.opacity })
    const loosenAt = tl.duration()
    tl.to(s, { scatter: 1, duration: DUR.bloom, ease: TRACE }, loosenAt)
    tl.to(s, { graph: 1, duration: DUR.scale }, loosenAt + DUR.card)
    // The cloud fades all the way out while it is still drifting: the fade
    // is most of the beat, so the squares are gone before the drift settles.
    tl.to(s, { field: 0, duration: DUR.gather }, loosenAt + DUR.grow)
    beat(2)

    tl.to(s, { bars: 1, duration: DUR.grow, ease: DRAW })
    tl.to(s, { graphDim: 0.45, duration: DUR.color }, '<')
    beat(3)
  },
})

/** Mounted a beat before it is needed, so the layout is settled by the fade. */
const graphMounted = computed(() => clicks.value >= 1)
/** Orbits from the graph beat on. The comparison beat dims it but keeps it turning. */
const orbiting = computed(() => clicks.value >= 2)

const fieldStyle = computed(() => ({ opacity: String(s.field) }))

const graphStyle = computed(() => ({
  opacity: String(s.graph),
  pointerEvents: s.graph > 0.9 ? ('auto' as const) : ('none' as const),
}))

const barsStyle = computed(() => ({
  opacity: String(Math.min(1, s.bars * 3)),
}))

/**
 * The seed card starts in slide 3's box and ends on the first cell of the
 * field, so moving the field moves the join target with it. The cell is a
 * stage svg mark and the card is an overlay element, so the cell's box goes
 * through the stage map. The card's text fades over the first stretch of the move, and
 * its surface, border and radius lerp to the cell's, so what lands is a
 * square. It stays as the first square through the bloom and fades onto the
 * identical cell beneath it only once the field is fully in.
 */
const { toPctBox } = useStageMap()
const cellBox = computed(() => toPctBox(ORIGIN.x, ORIGIN.y, CELL, CELL))

const pct = (n: number) => `${Math.round(clamp01(n) * 100)}%`

const seedStyle = computed(() => ({
  left: `${lerp(DATASET_CARD_BOX.left, cellBox.value.left, s.join)}%`,
  top: `${lerp(DATASET_CARD_BOX.top, cellBox.value.top, s.join)}%`,
  width: `${lerp(DATASET_CARD_BOX.width, cellBox.value.width, s.join)}%`,
  height: `${lerp(DATASET_CARD_BOX.height, cellBox.value.height, s.join)}%`,
  borderRadius: `${lerp(12, 3, s.join)}px`,
  // The card's padding and border are part of its box, so they have to go
  // too, or the box bottoms out at the padding and never reaches cell size.
  padding: `calc(${lerp(1.1, 0, s.join)} * var(--sw)) calc(${lerp(1.5, 0, s.join)} * var(--sw))`,
  gap: `calc(${lerp(0.35, 0, s.join)} * var(--sw))`,
  borderWidth: `${lerp(1, 0, s.join)}px`,
  borderColor: `color-mix(in srgb, var(--od-border) ${pct(1 - s.join)}, transparent)`,
  background: [
    `radial-gradient(ellipse 80% 100% at 0% 0%, color-mix(in srgb, var(--od-emerald) ${pct(0.12 * (1 - s.join))}, transparent) 0%, transparent 60%)`,
    `color-mix(in srgb, ${CELL_FILL} ${pct(s.join)}, var(--od-surface))`,
  ].join(', '),
  opacity: String(1 - clamp01((s.reveal - 0.85) / 0.15)),
}))
const seedTextStyle = computed(() => ({
  opacity: String(1 - clamp01(s.join * 2.5)),
}))

/** Hoisted, so the grid is not handed a fresh function on every render. */
const colorByCategory = (cell: { category: string }) => colorForCategory(cell.category)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <g :style="fieldStyle">
          <UnitGrid
            glyph="square"
            seed="catalog-field"
            :items="cells"
            :cols="COLS"
            :cell-width="CELL"
            :cell-height="CELL"
            :gap-x="GAP"
            :gap-y="GAP"
            :origin="ORIGIN"
            :color="BASE_INK"
            :color-by="colorByCategory"
            :reveal="s.reveal"
            :stagger="0.72"
            :recolor="s.recolor"
            :scatter="s.scatter"
            filter-id="none"
          />

          <g :style="{ opacity: s.labels }">
            <text
              v-for="label in clusterLabels"
              :key="label.category"
              class="od-stage-label"
              :x="label.x"
              :y="label.y"
              :fill="label.color"
              text-anchor="start"
            >
              {{ label.text }}
            </text>
          </g>
        </g>
      </g>
    </template>

    <template #overlay>
      <div class="od-graph-layer" :style="graphStyle">
        <Graph3D
          v-if="graphMounted"
          :nodes="graphNodes"
          :edges="graphEdges"
          :orbit="orbiting"
          :zoom="GRAPH_ZOOM"
          :dim="s.graphDim"
        />
      </div>

      <StoryLayer>
        <g :style="barsStyle">
          <InkCardRect
            :x="BARS_CARD.x"
            :y="BARS_CARD.y"
            :width="BARS_CARD.w"
            :height="BARS_CARD.h"
            hue="cyan"
            :glow-r="0.8"
            :glow-edge="0.6"
            stroke="var(--od-border)"
            :stroke-width="1"
          />
          <g v-for="row in BARS.rows" :key="row.key">
            <text class="od-stage-label" :x="BARS.x" :y="row.y - 26" text-anchor="start">
              {{ row.key }}
            </text>
            <rect
              :x="BARS.x"
              :y="row.y"
              :width="BARS.width * (row.july / row.now) * s.bars"
              :height="BARS.height"
              rx="3"
              :fill="JULY_INK"
            />
            <text
              class="od-stage-label is-end"
              :x="BARS.x + BARS.width * (row.july / row.now) * s.bars + 18"
              :y="row.y + BARS.height - 4"
              text-anchor="start"
            >
              {{ fmt(row.july) }} in July
            </text>
            <rect
              :x="BARS.x"
              :y="row.y + BARS.height + BARS.gap"
              :width="BARS.width * s.bars"
              :height="BARS.height"
              rx="3"
              :fill="NOW_INK"
            />
            <text
              class="od-stage-label is-end"
              :x="BARS.x + BARS.width * s.bars + 18"
              :y="row.y + BARS.height * 2 + BARS.gap - 4"
              text-anchor="start"
            >
              {{ fmt(row.now) }} today
            </text>
          </g>
        </g>
      </StoryLayer>

      <StoryLink href="https://tryopendata.ai/graph" :opacity="s.graph" />

      <h2 class="od-story-head">Every dataset we clean joins the Dataset Graph.</h2>

      <div class="od-dataset-card vt-seed-square" :style="seedStyle">
        <span class="od-dataset-kicker" :style="seedTextStyle">dataset</span>
        <span class="od-dataset-name" :style="seedTextStyle">{{ DATASET_NAME }}</span>
        <span class="od-dataset-meta" :style="seedTextStyle">{{ DATASET_META }}</span>
      </div>
    </template>

    <template #card>
      <StoryCard anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* The graph sits behind the overlay chrome and above the stage svg. */
.od-graph-layer {
  position: absolute;
  inset: 0;
  transition: opacity var(--od-dur-card) var(--od-settle);
}
</style>
