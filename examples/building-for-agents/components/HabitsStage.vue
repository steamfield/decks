<script setup lang="ts">
/**
 * Slide 18: all seven tools share the same six habits.
 *
 * A matrix: six habits down the side, the seven products across the top. A
 * cell is lit where that product's repo shows the habit, and prints the flag,
 * field or command that shows it. The proof for each cell is in
 * data/18-habits.ts.
 *
 * Four beats. Rows light two at a time, and the pair before drops back. The
 * last beat drops every cell back and leaves the six labels.
 */
import { reactive } from 'vue'
import { DUR, SETTLE, ink, stagger, useStage } from 'slidev-addon-decks/story'
import { DIM, FRAME, OFF, ON } from './design'
import { PRODUCTS } from '../data/products'
import { HABITS, ROWS_PER_BEAT } from '../data/18-habits'
import { countWord } from '../data/03-thread'

const count = (id: string) => Object.keys(HABITS.find((habit) => habit.id === id)?.cells ?? {}).length

const COPY = [
  {
    lead: `${countWord(count('output'))} tools print JSON a program can parse.`,
    body: `The same ${countWord(count('next')).toLowerCase()} also print the next step, as a field or a line of text.`,
  },
  {
    lead: 'A command checks when work is finished.',
    body: `Stacks has verify, and Decks has check and lint. ${countWord(count('exit'))} tools document one action per exit code.`,
  },
  {
    lead: 'Agents run in parallel and read bundled docs.',
    body: `rr locks a host and foreman uses a worktree per task. ${countWord(count('docs'))} tools ship their own guide or skill.`,
  },
  {
    lead: 'Any CLI or library can adopt these habits.',
    body: 'The six habits are output formats, exit codes, locks and bundled docs. None of them calls a model.',
  },
]

/* ── Geometry, in stage viewBox units ── */
const COLS_X = 612
const COL = (FRAME.right - COLS_X) / PRODUCTS.length
const HEAD = { icon: 40, iconY: 198, nameY: 270, nameSize: 22 }
const ROW = { y: 292, height: 68 }
const CELL = { width: COL - 12, height: 50 }

const PAIRS = Math.ceil(HABITS.length / ROWS_PER_BEAT)
const columns = PRODUCTS.map((p, i) => ({ ...p, x: COLS_X + (i + 0.5) * COL }))
const rows = HABITS.map((habit, i) => ({
  ...habit,
  pair: Math.floor(i / ROWS_PER_BEAT),
  y: ROW.y + i * ROW.height,
  mid: ROW.y + i * ROW.height + ROW.height / 2,
}))

const LIT = ink('cyan', 2)

/** `pairs.pK` is how far pair k has lit, 0..1; `end` is the last beat. */
const key = (k: number) => `p${k}`
const s = reactive({
  frame: OFF,
  pairs: Object.fromEntries(Array.from({ length: PAIRS }, (_, k) => [key(k), OFF])) as Record<string, number>,
  end: OFF,
})
const lit = (k: number) => s.pairs[key(k)] ?? OFF

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s.pairs, { [key(0)]: ON, duration: DUR.scale, ease: 'none' })
  },
  beats: (tl, beat) => {
    beat(0)
    for (let k = 1; k < PAIRS; k++) {
      tl.to(s.pairs, { [key(k)]: ON, duration: DUR.scale, ease: 'none' })
      beat(k)
    }
    tl.to(s, { end: ON, duration: DUR.color, ease: SETTLE })
    beat(PAIRS)
  },
})

/** How far the pair after `k` has lit: the thing that drops pair k back. */
const after = (k: number) => (k + 1 < PAIRS ? lit(k + 1) : s.end)
const cellLevel = (k: number) => ON - after(k) * (ON - DIM)
const labelLevel = (k: number) =>
  DIM + (ON - DIM) * Math.max(lit(k) * (ON - (k + 1 < PAIRS ? lit(k + 1) : OFF)), s.end)
const cellProgress = (k: number, col: number) => stagger(lit(k), col, columns.length, 0.1)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: String(s.frame) }">
        <!-- Column heads: the seven products -->
        <g v-for="col in columns" :key="col.id" :style="{ opacity: String(ON - s.end * (ON - DIM)) }">
          <PixelIcon :id="col.id" :x="col.x - HEAD.icon / 2" :y="HEAD.iconY" :width="HEAD.icon" :height="HEAD.icon" />
          <text class="sf-name" :x="col.x" :y="HEAD.nameY" text-anchor="middle" :style="{ fontSize: `${HEAD.nameSize}px` }">{{ col.name }}</text>
        </g>

        <g v-for="row in rows" :key="row.id">
          <line class="sf-wire" :x1="FRAME.left" :x2="FRAME.right" :y1="row.y" :y2="row.y" :style="{ opacity: String(DIM) }" />
          <text class="sf-name" :x="FRAME.left" :y="row.mid + 9" :style="{ opacity: String(labelLevel(row.pair)) }">{{ row.label }}</text>

          <g v-for="(col, c) in columns" :key="col.id">
            <g
              v-if="row.cells[col.id]"
              :style="{ opacity: String(cellProgress(row.pair, c) * cellLevel(row.pair)), color: LIT }"
            >
              <rect class="sf-box is-lit" :x="col.x - CELL.width / 2" :y="row.mid - CELL.height / 2" :width="CELL.width" :height="CELL.height" />
              <text class="sf-mono is-small" :x="col.x" :y="row.mid + 6" text-anchor="middle" :style="{ fill: LIT }">{{ row.cells[col.id]?.mark }}</text>
            </g>
          </g>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Each tool has some of the same six habits.</h2>
      <ThreadRail all />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

