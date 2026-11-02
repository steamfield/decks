<script setup lang="ts">
/**
 * Slide 3: twenty nine unlabeled ISBE files become one clean dataset.
 *
 * Two beats. On entry the sheets ink in and, once they have landed, the raw
 * row the publisher ships draws itself over them: one enter only sequence,
 * outside the beat timeline, because it has to replay on every revisit and
 * must not sit between two labels. The click collapses the sheets into a
 * single dataset card with the query beside it.
 *
 * The dataset card carries `vt-seed-square`, and slide 4 opens with the same
 * card in the same box, so the card morphs across and then joins the field.
 */
import { computed, reactive, ref } from 'vue'
import { DRAW, DUR, STAGE, ink, useStage, useStageMap } from 'slidev-addon-decks/story'
import {
  DATASET_CARD_BOX,
  DATASET_NAME,
  DATASET_URL,
  FILE_COUNT,
  FILE_SHEETS,
  FILE_YEARS,
  RAW_LABEL,
  RAW_ROWS,
  RAW_FIELD_COUNT,
  RECONCILED_SQL,
  RECONCILED_SQL_URL,
  SQL_LABEL,
  datasetMeta as datasetMetaLine,
} from '../data/isbe-files'
import { DISTINCT_POSITIONS } from '../data/isbe-column-drift'

/* ── Stage geometry, in 1920x1080 viewBox units ── */
/**
 * Two rows of fifteen and fourteen, not three of ten: at three rows the field
 * ran into the raw row panel below it, and the panel covered the middle row's
 * year labels at every beat. Fifteen columns fit the frame width with the same
 * gutters and leave the panel a clear band under the field.
 */
const GRID = {
  origin: { x: 136, y: 272 },
  cols: 15,
  cellWidth: 80,
  cellHeight: 106,
  gapX: 32,
  gapY: 56,
}
/**
 * The code column: the right half of the bottom band, opposite the prose card
 * and sharing its floor. Both beats put their block here, so the raw row is
 * replaced by the query in place rather than moving across the slide. It is
 * narrower than the row it holds on purpose: the row is cut at the frame edge
 * and scrolls sideways, which says the row does not fit better than an
 * ellipsis does. Its height is the prose card's height too: the two sit on
 * the same floor and read as a pair, claim on the left and evidence on the
 * right, so the card is given this box rather than sized by its own copy.
 */
const CODE_COL = { x: 872, y: 658, width: 918, height: 292 }

/**
 * The query's box on the second beat: the same column, lifted into the band
 * and centred on the dataset card's centre line, so the card and the query
 * read as one row with the prose card underneath.
 */
const SQL_COL = { x: CODE_COL.x, y: 277, width: CODE_COL.width, height: 224 }

/** The code column's height, as a length the prose card can take. */
const CARD_HEIGHT = `calc(${(CODE_COL.height / STAGE.height) * 100} * var(--sh))`

const PITCH_X = GRID.cellWidth + GRID.gapX
const PITCH_Y = GRID.cellHeight + GRID.gapY

/**
 * Centre and size of the dataset card in stage units, where the sheets
 * collapse to and dissolve. The card is placed by overlay percentages and the
 * sheets live in the sliced stage svg, so both go through the stage map.
 */
const { toStageCenter, toStageSize } = useStageMap()
const cardCenter = computed(() => toStageCenter(DATASET_CARD_BOX))
const cardSize = computed(() => toStageSize(DATASET_CARD_BOX))

const SHEET_INK = ink('slate', 2)
const RAW_LABEL_INK = ink('amber', 3)

/** Year labels on the first, middle and last sheet only. */
const LABELLED = [0, Math.floor(FILE_COUNT / 2), FILE_COUNT - 1]
const yearLabels = LABELLED.map((i) => {
  const col = i % GRID.cols
  const row = Math.floor(i / GRID.cols)
  return {
    year: FILE_YEARS[i],
    x: GRID.origin.x + col * PITCH_X + GRID.cellWidth / 2,
    y: GRID.origin.y + row * PITCH_Y + GRID.cellHeight + 34,
  }
})

const COPY = [
  {
    lead: 'Twenty-nine files. No headers. No changelog.',
    body: `About ${RAW_FIELD_COUNT.toLocaleString('en-US')} unnamed fields per row, and the salary field alone has sat in ${DISTINCT_POSITIONS} different columns.`,
  },
  {
    lead: 'We reconcile it once. One dataset, one query.',
    body: 'Every file mapped onto one schema and published as a single dataset.',
  },
]

/* ── Beat state ── */
const s = reactive({
  reveal: 0,
  dim: 0,
  raw: 0,
  collapse: 0,
  /** The card, surface and name, up before the first sheet moves. */
  frame: 0,
  /** One accent settle on the border as the gather completes. */
  land: 0,
  sql: 0,
})

const grid = ref<{ arrived: number } | null>(null)

/** Files in the dataset so far: the grid's own landings, or all of them once settled. */
const filesIn = computed(() =>
  s.collapse >= 1 ? FILE_COUNT : Math.min(FILE_COUNT, grid.value?.arrived ?? 0),
)
const datasetMeta = computed(() => datasetMetaLine(filesIn.value))

/**
 * Enter only: sheets ink in, then the raw row draws over them. The composable
 * waits for an in flight view transition, so the sequence starts on a settled
 * frame rather than into the transition's snapshot.
 */
const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { reveal: 1, duration: DUR.scale, ease: DRAW })
    tl.to(s, { dim: 1, duration: DUR.color }, `+=${DUR.card}`)
    tl.to(s, { raw: 1, duration: DUR.grow, ease: DRAW }, '<')
  },
  beats: (tl, beat) => {
    beat(0)

    // The raw row clears first, and the sheets brighten as they start to move:
    // the field is what gathers, so it gets its ink back before it goes.
    tl.to(s, { raw: 0, duration: DUR.opacity })
    const gatherAt = tl.duration()
    // The destination first: the card is up, opaque, before any sheet moves,
    // so the sheets fly into something and disappear under it.
    tl.to(s, { frame: 1, duration: DUR.card }, gatherAt)
    tl.to(s, { dim: 0, duration: DUR.color }, gatherAt)
    // Linear on the timeline: the wave and the TRACE curve are per sheet,
    // inside UnitGrid, so each sheet has its own trip instead of one lerp.
    tl.to(s, { collapse: 1, duration: DUR.gather, ease: 'none' }, gatherAt)
    // The border settles once as the last sheets land, and the query draws
    // off the finished card.
    const landAt = gatherAt + DUR.gather
    tl.to(s, { land: 1, duration: DUR.opacity }, landAt - DUR.opacity)
    tl.to(s, { land: 0, duration: DUR.color }, landAt)
    tl.to(s, { sql: 1, duration: DUR.grow, ease: DRAW }, landAt)
    beat(1)
  },
})

const fieldStyle = computed(() => ({ opacity: String(1 - 0.82 * s.dim) }))

const labelOpacity = computed(() => {
  const inked = Math.max(0, (s.reveal - 0.7) / 0.3)
  return String(Math.min(1, inked) * (1 - 0.82 * s.dim) * (1 - s.collapse))
})

const pct = (n: number) => `${Math.round(n * 100)}%`

/**
 * The card is one element through the whole beat, on the shared opaque
 * surface, so a sheet that reaches it goes under it. It comes in on `frame`
 * and `land` lifts the border to the accent for one settle.
 */
const cardStyle = computed(() => ({
  left: `${DATASET_CARD_BOX.left}%`,
  top: `${DATASET_CARD_BOX.top}%`,
  width: `${DATASET_CARD_BOX.width}%`,
  height: `${DATASET_CARD_BOX.height}%`,
  opacity: String(s.frame),
  transform: `scale(${0.98 + 0.02 * s.frame})`,
  borderColor: `color-mix(in srgb, var(--od-emerald) ${pct(0.7 * s.land)}, var(--od-border))`,
  // The card is a link to the dataset page. It only takes a click once it is
  // actually on screen, the same opt-in StoryLink makes over the overlay.
  pointerEvents: s.frame > 0.5 ? 'auto' : 'none',
}))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <g :style="fieldStyle">
          <UnitGrid
            ref="grid"
            glyph="sheet"
            seed="isbe-files"
            :items="FILE_SHEETS"
            :cols="GRID.cols"
            :cell-width="GRID.cellWidth"
            :cell-height="GRID.cellHeight"
            :gap-x="GRID.gapX"
            :gap-y="GRID.gapY"
            :origin="GRID.origin"
            :color="SHEET_INK"
            glow
            :reveal="s.reveal"
            :collapse="s.collapse"
            :collapse-stagger="0.45"
            :collapse-to="cardCenter"
            :collapse-into="cardSize"
          />
        </g>

        <g :style="{ opacity: labelOpacity }">
          <text
            v-for="label in yearLabels"
            :key="label.year"
            class="od-stage-label"
            :x="label.x"
            :y="label.y"
            text-anchor="middle"
          >
            {{ label.year }}
          </text>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head is-wide">Twenty-nine files became one dataset.</h2>

      <StoryLink href="https://labs.tryopendata.ai/what-opendata-is-building" />

      <CodeInk
        :lines="RAW_ROWS"
        :label="RAW_LABEL"
        hue="slate"
        :step="2"
        :label-color="RAW_LABEL_INK"
        surface
        scroll-x
        :x="CODE_COL.x"
        :y="CODE_COL.y"
        :width="CODE_COL.width"
        :height="CODE_COL.height"
        :font-size="1.05"
        :reveal="s.raw"
        seed="isbe-raw-row"
      />

      <a
        class="od-dataset-card vt-seed-square"
        :href="DATASET_URL"
        target="_blank"
        rel="noopener"
        :style="cardStyle"
      >
        <span class="od-dataset-kicker">dataset</span>
        <span class="od-dataset-name">{{ DATASET_NAME }}</span>
        <span class="od-dataset-meta">{{ datasetMeta }}</span>
      </a>

      <CodeInk
        :lines="RECONCILED_SQL"
        :label="SQL_LABEL"
        hue="emerald"
        :step="2"
        center
        :x="SQL_COL.x"
        :y="SQL_COL.y"
        :width="SQL_COL.width"
        :height="SQL_COL.height"
        :font-size="1.05"
        :reveal="s.sql"
        lang="sql"
        :href="RECONCILED_SQL_URL"
        seed="isbe-sql"
      />
    </template>

    <template #card>
      <StoryCard
        class="is-filled"
        anchor="left"
        :lead="copy.lead"
        :body="copy.body"
        :style="{ height: CARD_HEIGHT }"
      />
    </template>
  </StoryStage>
</template>
