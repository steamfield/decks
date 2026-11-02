<script setup lang="ts">
/**
 * Slide 6d: thirty questions, two arms, as two rows of thirty marks, then the
 * time and the effort those two rows cost.
 *
 * Five beats, four clicks. On entry the web arm's row inks in, one mark per
 * question, so beat 0 already has its figure on stage under the card that
 * claims it. The first click lays the connector arm's row under it. The
 * second grows the two totals: three hours of chat against half an hour. The
 * third breaks that time into what each arm did with it, which is where the
 * sandbox, the downloads and the capped chats live. The fourth cross-fades
 * the totals and the effort table out for Phase 0, a different model and a
 * different run, and holds the two rows of marks back at a third opacity so
 * the swap reads as leaving the Sonnet run rather than adding to it.
 *
 * Marks are `InkCardRect`, not `UnitGrid`. UnitGrid's square means "one
 * dataset" everywhere else in this deck, and it has no hollow state: its
 * cells are filled glyphs whose only variable is hue, so a wrong answer would
 * have to be encoded as a second colour. `InkCardRect` takes a `surface` and
 * a `stroke` separately, which is exactly the filled/hollow split this slide
 * needs on one hue, and it is the house box recipe so the marks read as part
 * of the deck.
 */
import { computed, reactive, ref } from 'vue'
import {
  DRAW,
  DUR,
  ink,
  SETTLE,
  stagger,
  STROKE,
  useStage,
  type GrowHandle,
} from 'slidev-addon-decks/story'
import {
  BENCHMARK_URL,
  MCP_CORRECT,
  MCP_MEDIAN_S,
  MCP_OPENDATA_CALLS,
  MCP_CAP_HITS,
  MCP_SANDBOX_CALLS,
  MCP_TOOL_CALLS,
  MCP_TOTAL_MIN,
  N,
  OUTCOMES,
  type Outcome,
  WEB_CAP_HITS,
  WEB_CORRECT,
  WEB_MEDIAN_S,
  WEB_OPENDATA_CALLS,
  WEB_SANDBOX_CALLS,
  WEB_SANDBOX_CHATS,
  WEB_TOOL_CALLS,
  WEB_TOTAL_MIN,
  PHASE0_CORRECT,
  PHASE0_MODEL,
  PHASE0_N,
  PHASE0_PER_CORRECT,
  phase0Dollars,
} from '../data/benchmark-v5'

/* ── Geometry, in stage viewBox units ── */
const GRID = { x: 300, cell: 34, pitch: 42 }
const ROW = { web: 330, mcp: 440 }

const cellX = (i: number) => GRID.x + i * GRID.pitch
const rowMid = (y: number) => y + GRID.cell / 2

/**
 * One column per question, easy to hard and then by id. This is the order the
 * benchmark page lays the same thirty out in (`byDifficultyThenId` in
 * `frontend/app/routes/benchmarks/_data/registry.ts`), so a viewer who opens
 * the link at the bottom of this slide sees the marks in the same arrangement
 * rather than a reshuffle of the same data. Nothing on this slide reads a
 * column's position: the nine rewritten items are keyed off `rewritten` in the
 * data module and are not drawn here at all.
 */
const DIFFICULTY_ORDER: Record<Outcome['difficulty'], number> = { easy: 0, medium: 1, hard: 2 }
const COLUMNS = [...OUTCOMES].sort(
  (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.id.localeCompare(b.id),
)

/* ── Ink: one hue, and fill state carries the outcome ── */
const FILLED = ink('cyan', 3)
const HOLLOW = ink('cyan', 1)

/** Beat 3: what the time bought, per arm. */
const EFFORT = [
  { name: 'tool calls', web: WEB_TOOL_CALLS, mcp: MCP_TOOL_CALLS },
  { name: 'sandbox commands', web: WEB_SANDBOX_CALLS, mcp: MCP_SANDBOX_CALLS },
  { name: 'OpenData calls', web: WEB_OPENDATA_CALLS, mcp: MCP_OPENDATA_CALLS },
  { name: 'chats past ten minutes', web: WEB_CAP_HITS, mcp: MCP_CAP_HITS },
]

const COPY = [
  {
    lead: `${WEB_CORRECT} of ${N}, without OpenData.`,
    body: 'Sonnet 5, one fresh chat per question, web search and a sandbox. Single run.',
  },
  {
    lead: `${MCP_CORRECT} of ${N}, with it.`,
    body: 'Same model, same questions, same day. Single run per arm.',
  },
  {
    lead: 'The clock went the same way.',
    body: `Median ${WEB_MEDIAN_S} seconds per chat without it, ${MCP_MEDIAN_S} with. ${N} chats, totalled on stage.`,
  },
  {
    lead: 'Without it, the model rebuilds the pipeline.',
    body: `It spun up a sandbox in ${WEB_SANDBOX_CHATS} of ${N} chats, downloading source files to re-implement the work.`,
  },
  {
    lead: 'The same shape in a bare API agent.',
    body: 'Same model, same prompt, only the tool list differs. This run billed per token.',
  },
]

/** Beat state, every field 0 to 1. */
const s = reactive({ web: 0, mcp: 0, time: 0, effort: 0, phase0: 0 })

const webTotal = ref<GrowHandle | null>(null)
const mcpTotal = ref<GrowHandle | null>(null)
const webPerCorrect = ref<GrowHandle | null>(null)
const mcpPerCorrect = ref<GrowHandle | null>(null)

/** Beat 4: the no-tool arm is a label, not a figure. */
const PHASE0_NONE = `no tools at all: ${PHASE0_CORRECT.none} of ${PHASE0_N} correct, $${phase0Dollars(PHASE0_PER_CORRECT.none)} each`

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => tl.to(s, { web: 1, duration: DUR.scale, ease: DRAW }),
  beats: (tl, beat) => {
    beat(0)

    tl.to(s, { mcp: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`)
    beat(1)

    tl.to(s, { time: 1, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`)
    // Explicit positions: the two figures ride the label in rather than
    // queueing behind it.
    webTotal.value?.addGrow(tl, `-=${DUR.card}`)
    mcpTotal.value?.addGrow(tl, `-=${DUR.grow}`)
    beat(2)

    tl.to(s, { effort: 1, duration: DUR.scale, ease: SETTLE }, `+=${DUR.opacity}`)
    beat(3)

    // Phase 0 takes the stage over: the waffle recedes and the Phase 1 figures
    // give way, so the two runs are never on screen as one number.
    tl.to(s, { phase0: 1, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`)
    webPerCorrect.value?.addGrow(tl, `-=${DUR.opacity}`)
    mcpPerCorrect.value?.addGrow(tl, `-=${DUR.grow}`)
    beat(4)
  },
})

/**
 * Each mark inks in on its own slice of the row's reveal. The step has to
 * leave `1 - (N - 1) * step` positive or the last marks never reach full.
 */
const REVEAL_STEP = 0.02
const reveal = (progress: number, i: number) => stagger(progress, i, N, REVEAL_STEP)

/** The Phase 1 waffle recedes when Phase 0 takes the stage. */
const held = () => 1 - 0.7 * s.phase0

const webCells = computed(() =>
  COLUMNS.map((row, i) => ({
    id: row.id,
    x: cellX(i),
    filled: row.web === 'CORRECT',
    opacity: reveal(s.web, i) * held(),
  })),
)

const mcpCells = computed(() =>
  COLUMNS.map((row, i) => ({
    id: row.id,
    x: cellX(i),
    filled: row.mcp === 'CORRECT',
    opacity: reveal(s.mcp, i) * held(),
  })),
)

/** Effort rows arrive one after another, and leave together on beat 4. */
const effortRow = (i: number) => stagger(s.effort, i, EFFORT.length, 0.16) * (1 - s.phase0)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- Row labels sit left of each row: thirty columns take the width. -->
      <text class="od-bench-row" :x="GRID.x - 24" :y="rowMid(ROW.web)" text-anchor="end">
        Web search only
      </text>
      <text class="od-bench-row" :x="GRID.x - 24" :y="rowMid(ROW.mcp)" text-anchor="end">
        With OpenData
      </text>

      <!-- Thirty marks per arm. Filled is a correct answer, hollow is not. -->
      <g v-for="cell in webCells" :key="`web-${cell.id}`" :style="{ opacity: cell.opacity }">
        <InkCardRect
          :x="cell.x"
          :y="ROW.web"
          :width="GRID.cell"
          :height="GRID.cell"
          :radius="7"
          hue="cyan"
          :surface="cell.filled ? FILLED : 'none'"
          :glow-opacity="cell.filled ? 0.22 : 0"
          :stroke="cell.filled ? FILLED : HOLLOW"
          :stroke-width="STROKE.rule"
        />
      </g>
      <g v-for="cell in mcpCells" :key="`mcp-${cell.id}`" :style="{ opacity: cell.opacity }">
        <InkCardRect
          :x="cell.x"
          :y="ROW.mcp"
          :width="GRID.cell"
          :height="GRID.cell"
          :radius="7"
          hue="cyan"
          :surface="cell.filled ? FILLED : 'none'"
          :glow-opacity="cell.filled ? 0.22 : 0"
          :stroke="cell.filled ? FILLED : HOLLOW"
          :stroke-width="STROKE.rule"
        />
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Thirty questions.</h2>

      <div class="od-bench-figures" :style="{ opacity: String(1 - s.phase0) }">
        <p class="od-bench-figures-head" :style="{ opacity: String(s.time) }">
          total chat time, {{ N }} questions
        </p>
        <div class="od-bench-figures-row">
          <InkNumber
            ref="webTotal"
            :value="String(WEB_TOTAL_MIN)"
            suffix=" min"
            label="web search only"
            hue="slate"
            :step="3"
            :size="3.4"
          />
          <InkNumber
            ref="mcpTotal"
            :value="String(MCP_TOTAL_MIN)"
            suffix=" min"
            label="with OpenData"
            hue="cyan"
            :step="3"
            :size="3.4"
          />
        </div>
      </div>

      <div class="od-bench-effort">
        <div class="od-bench-effort-row is-head" :style="{ opacity: String(effortRow(0)) }">
          <span class="name">what the time bought</span>
          <span class="value">web only</span>
          <span class="value is-mcp">with OpenData</span>
        </div>
        <div
          v-for="(row, i) in EFFORT"
          :key="row.name"
          class="od-bench-effort-row"
          :style="{
            opacity: String(effortRow(i)),
            transform: `translateY(${(1 - effortRow(i)) * 10}px)`,
          }"
        >
          <span class="name">{{ row.name }}</span>
          <span class="value">{{ row.web.toLocaleString('en-US') }}</span>
          <span class="value is-mcp">{{ row.mcp.toLocaleString('en-US') }}</span>
        </div>
      </div>

      <!-- Beat 4: Phase 0, billed per token. -->
      <div class="od-bench-phase0">
        <p class="od-bench-figures-head" :style="{ opacity: String(s.phase0) }">
          per correct answer · {{ PHASE0_MODEL }}, API agent
        </p>
        <div class="od-bench-figures-row">
          <InkNumber
            ref="webPerCorrect"
            :value="phase0Dollars(PHASE0_PER_CORRECT.web)"
            prefix="$"
            :label="`web search and a sandbox · ${PHASE0_CORRECT.web} of ${PHASE0_N}`"
            hue="slate"
            :step="3"
            :size="3.4"
            :count="false"
          />
          <InkNumber
            ref="mcpPerCorrect"
            :value="phase0Dollars(PHASE0_PER_CORRECT.mcp)"
            prefix="$"
            :label="`with OpenData · ${PHASE0_CORRECT.mcp} of ${PHASE0_N}`"
            hue="cyan"
            :step="3"
            :size="3.4"
            :count="false"
          />
        </div>
        <p class="od-bench-phase0-none" :style="{ opacity: String(s.phase0) }">
          {{ PHASE0_NONE }}
        </p>
      </div>

      <StoryLink :href="BENCHMARK_URL" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* Row names are smaller than a stage label so the two of them fit the margin
   left of a thirty column grid. */
.od-bench-row {
  font-family: var(--od-font-mono);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.02em;
  fill: var(--od-text-muted);
  dominant-baseline: middle;
}
.od-bench-figures {
  position: absolute;
  left: calc(56 * var(--sw));
  top: calc(48 * var(--sh));
}
.od-bench-figures-head {
  margin: 0 0 calc(1.4 * var(--sh));
  font-family: var(--od-font-mono);
  font-size: calc(1.05 * var(--sw));
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--od-text-faint);
  transition: opacity var(--od-dur-card) var(--od-settle);
}
.od-bench-figures-row {
  display: flex;
  /* First-baseline alignment: the figures sit on one line and their labels
     hang below at whatever length they take. */
  align-items: baseline;
  gap: calc(3.2 * var(--sw));
}
/* Phase 0 sits where the Phase 1 figures were: the two runs cross-fade in the
   same place so they are never read as one number. */
.od-bench-phase0 {
  position: absolute;
  left: calc(56 * var(--sw));
  top: calc(48 * var(--sh));
}
.od-bench-phase0-none {
  margin: calc(2.4 * var(--sh)) 0 0;
  font-family: var(--od-font-mono);
  font-size: calc(1.05 * var(--sw));
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--od-text-faint);
  transition: opacity var(--od-dur-card) var(--od-settle);
}
/* What the time bought. Three columns: the measure, then one value per arm,
   both right aligned so the digits line up under each other. */
.od-bench-effort {
  position: absolute;
  left: calc(56 * var(--sw));
  top: calc(63 * var(--sh));
  width: calc(38 * var(--sw));
}
/* Every row is its own grid, so the two value tracks are fixed rather than
   `auto`: under `auto` each row sized its columns to its own content and the
   header labels landed off the numbers they name. The widths hold the longest
   header, `WITH OPENDATA`, at the 0.92sw mono the header row uses. */
.od-bench-effort-row {
  display: grid;
  grid-template-columns: 1fr calc(8 * var(--sw)) calc(9.6 * var(--sw));
  align-items: baseline;
  gap: calc(1.2 * var(--sw));
  padding: calc(0.8 * var(--sh)) 0;
  border-bottom: 1px solid var(--od-border);
}
.od-bench-effort-row .name {
  font-family: var(--od-font-sans);
  font-size: calc(1.1 * var(--sw));
  font-weight: 400;
  color: var(--od-text-muted);
}
.od-bench-effort-row .value {
  text-align: right;
  font-family: var(--od-font-mono);
  font-size: calc(1.25 * var(--sw));
  font-weight: 510;
  font-variant-numeric: tabular-nums;
  color: var(--od-text-secondary);
}
.od-bench-effort-row .value.is-mcp {
  color: var(--od-cyan);
}
/* The header names the two columns, in the same grid, at label weight. */
.od-bench-effort-row.is-head .name,
.od-bench-effort-row.is-head .value {
  font-family: var(--od-font-mono);
  font-size: calc(0.92 * var(--sw));
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--od-text-faint);
}
</style>
