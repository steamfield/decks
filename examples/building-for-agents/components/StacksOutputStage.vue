<script setup lang="ts">
/**
 * Slide 6: Stacks output differs for people and agents.
 *
 * One failed `stacks verify`, recorded three times in the same scratch
 * project: on a terminal, with an agent marker set, and with --json. Three
 * monitors, one per reader. Under them, from the last beat, the exit table:
 * one tile per code with the action it means.
 *
 * Four beats. Each of the first three switches one monitor on and drops the
 * one before it back; the second also lists the environment markers Stacks
 * looks for. The last drops all three back and raises the exit tiles, with
 * the two codes a failed verify can end in lit.
 */
import { computed, reactive } from 'vue'
import { DUR, SETTLE, ink, stagger, useStage } from 'slidev-addon-decks/story'
import { DIM, FRAME, OFF, ON } from './design'
import {
  AGENT_LINES,
  AGENT_MARKERS,
  ASK_PERSON,
  CLI,
  EXIT_CODES,
  NEXT_ROWS,
  PERSON_LINES,
  READ_REPORT,
  RECORDED,
  SCRIPT_LINES,
} from '../data/06-stacks-output'

const COPY = [
  {
    lead: 'On a terminal, verify prints colour.',
    body: 'Stacks uses this format only when stdout is a terminal, no agent is detected and CI is unset.',
  },
  {
    lead: 'Run by an agent, verify prints plain text.',
    body: 'Stacks finds an agent marker in the environment and prints no colour codes and no live step output.',
  },
  {
    lead: 'With --json, stdout is one object.',
    body: 'The last line of stderr is an error envelope whose next field says what to do.',
  },
  {
    lead: 'Each exit code has one meaning.',
    body: `${READ_REPORT} means read the verify report, and ${ASK_PERSON} means ask a person.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
const GAP = 22
const PANE = { y: 196, width: (FRAME.right - FRAME.left - 2 * GAP) / 3, height: 470, size: 26 }
const paneX = (i: number) => FRAME.left + i * (PANE.width + GAP)
/** Right of the card: the marker list, then the exit tiles. */
const SIDE = { x: 842, y: 716, width: FRAME.right - 842 }
const TILE = { cols: 4, gap: 18, height: 108 }
const tileWidth = (SIDE.width - (TILE.cols - 1) * TILE.gap) / TILE.cols
/** An action wraps inside its tile at this many characters. */
const ACTION_COLS = 17

const wrapAction = (text: string) =>
  text.split(' ').reduce<string[]>((rows, word) => {
    const last = rows[rows.length - 1]
    if (last !== undefined && last.length + 1 + word.length <= ACTION_COLS) rows[rows.length - 1] = `${last} ${word}`
    else rows.push(word)
    return rows
  }, [])

const PINK = ink('rose', 2)
const WAIT = ink('amber', 2)
const NEUTRAL = ink('slate', 2)
const ACTION_INK = ink('slate', 3)
/** Terminal type at the deck's smallest size, in viewBox units. */
const ACTION_SIZE = 26

const tiles = EXIT_CODES.map((exit, i) => ({
  ...exit,
  x: SIDE.x + (i % TILE.cols) * (tileWidth + TILE.gap),
  y: SIDE.y + Math.floor(i / TILE.cols) * (TILE.height + TILE.gap),
  rows: wrapAction(exit.action),
  color: exit.code === READ_REPORT ? PINK : exit.code === ASK_PERSON ? WAIT : NEUTRAL,
  lit: exit.code === READ_REPORT || exit.code === ASK_PERSON,
}))

const s = reactive({ frame: OFF, person: OFF, agent: OFF, markers: OFF, script: OFF, exits: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { person: ON, duration: DUR.grow, ease: SETTLE })
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { agent: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { markers: ON, duration: DUR.card, ease: SETTLE })
    beat(1)
    tl.to(s, { markers: OFF, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { script: ON, duration: DUR.grow, ease: SETTLE })
    beat(2)
    tl.to(s, { exits: ON, duration: DUR.scale, ease: 'none' })
    beat(3)
  },
})

/** A monitor is at full strength on its own beat and at the dim level after it. */
const paneLevel = (next: number) => s.frame * (ON - next * (ON - DIM))
const personLevel = computed(() => paneLevel(s.agent))
const agentLevel = computed(() => paneLevel(s.script))
const scriptLevel = computed(() => paneLevel(s.exits))
const tag = `Recorded ${RECORDED} · stacks ${CLI}`
const tileProgress = (i: number) => stagger(s.exits, i, tiles.length, 0.1)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- The markers Stacks looks for (second beat only) -->
      <g :style="{ opacity: String(s.markers) }">
        <text class="sf-pixel" :x="SIDE.x" :y="SIDE.y + 24">Agent markers in the environment</text>
        <text class="sf-mono" :x="SIDE.x" :y="SIDE.y + 68">{{ AGENT_MARKERS.slice(0, 3).join('  ') }}</text>
        <text class="sf-mono" :x="SIDE.x" :y="SIDE.y + 102">{{ AGENT_MARKERS.slice(3).join('  ') }}</text>
        <text class="sf-mono is-small" :x="SIDE.x" :y="SIDE.y + 146">src/config.ts · checked in order</text>
      </g>

      <!-- The exit table (last beat) -->
      <g
        v-for="(tile, i) in tiles"
        :key="tile.code"
        :style="{
          opacity: String(tileProgress(i)),
          transform: `translate(0, ${(ON - tileProgress(i)) * 16}px)`,
          color: tile.color,
        }"
      >
        <rect class="sf-box" :class="{ 'is-lit': tile.lit }" :x="tile.x" :y="tile.y" :width="tileWidth" :height="TILE.height" />
        <text class="sf-name" :x="tile.x + 18" :y="tile.y + 38" :style="{ fill: tile.lit ? tile.color : undefined }">{{ tile.code }}</text>
        <text
          v-for="(row, n) in tile.rows"
          :key="row"
          class="sf-term"
          :x="tile.x + 18"
          :y="tile.y + 68 + n * 27"
          :style="{ fontSize: `${ACTION_SIZE}px`, fill: tile.lit ? tile.color : ACTION_INK }"
        >{{ row }}</text>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Stacks output differs for people and agents.</h2>
      <NamePlate id="stacks" chip-only />

      <TermPane
        :lines="PERSON_LINES"
        :x="paneX(0)"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="PANE.size"
        :progress="personLevel"
        :power="s.person"
        label="Person"
        :tag="tag"
      />
      <TermPane
        :lines="AGENT_LINES"
        :x="paneX(1)"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="PANE.size"
        :progress="agentLevel"
        :power="s.agent"
        label="Agent"
        :tag="tag"
      />
      <TermPane
        :lines="SCRIPT_LINES"
        :highlight="NEXT_ROWS"
        :x="paneX(2)"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="PANE.size"
        :progress="scriptLevel"
        :power="s.script"
        label="Script"
        :tag="tag"
      />
      <ThreadRail current="stacks" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
