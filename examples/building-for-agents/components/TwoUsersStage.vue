<script setup lang="ts">
/**
 * Slide 2: my tools have two users, me and a coding agent.
 *
 * One rr command, recorded, on two monitors. The left is what a person sees:
 * the summary `rr --pretty test` prints. The right is what an agent reads.
 * It starts dark, then shows the bytes of that same pretty output with the
 * escape codes written out, then cross-fades to the JSON events rr writes by
 * default, with the result event in pink.
 *
 * Three beats. Both panes are recordings, so each carries its own tag.
 */
import { reactive } from 'vue'
import { DRAW, DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { OFF, ON } from './design'
import {
  EVENT_LINES,
  PRETTY_LINES,
  RAW_ESCAPE_ROWS,
  RAW_LINES,
  RECORDED,
  RESULT_ROW_INDEXES,
} from '../data/02-two-users'

const COPY = [
  {
    lead: 'rr --pretty prints a summary for a person.',
    body: 'One line per task with its host and time, then totals. Designing this view is developer experience, DX.',
  },
  {
    lead: 'A coding agent receives every byte.',
    body: 'The colour codes are part of the text, and each one uses space in the agent’s context.',
  },
  {
    lead: 'Without the flag, rr prints JSON events.',
    body: 'The last event lists each failing test. Designing this output is agent experience, AX.',
  },
]

/* ── Geometry, in stage viewBox units ── */
const PANE = { y: 196, width: 838, height: 494, size: 26 }
const LEFT_X = 110
const RIGHT_X = 972

const s = reactive({ frame: OFF, pretty: OFF, right: OFF, raw: OFF, json: OFF, events: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { pretty: PRETTY_LINES.length, duration: DUR.scale, ease: 'none' })
  },
  beats: (tl, beat) => {
    beat(0)

    // The second monitor comes on and prints the bytes.
    tl.to(s, { right: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { raw: RAW_LINES.length, duration: DUR.scale, ease: 'none' })
    beat(1)

    // The bytes give way to the JSON events for the same command.
    tl.to(s, { json: ON, duration: DUR.grow, ease: DRAW })
    tl.to(s, { events: EVENT_LINES.length, duration: DUR.grow, ease: 'none' }, '<')
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">My tools have two users: me and a coding agent.</h2>

      <TermPane
        :lines="PRETTY_LINES"
        :shown="s.pretty"
        :x="LEFT_X"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="PANE.size"
        :progress="s.frame"
        label="What I see"
        :tag="`Recorded ${RECORDED} · rr --pretty test`"
      />
      <TermPane
        :lines="RAW_LINES"
        :shown="s.raw"
        :highlight="RAW_ESCAPE_ROWS"
        :x="RIGHT_X"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="PANE.size"
        :progress="s.frame"
        :power="s.right"
        label="What the agent reads"
        :tag="`Recorded ${RECORDED} · the same output, as bytes`"
      />
      <TermPane
        :lines="EVENT_LINES"
        :shown="s.events"
        :highlight="RESULT_ROW_INDEXES"
        :x="RIGHT_X"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="PANE.size"
        :progress="s.json"
        label="What the agent reads"
        :tag="`Recorded ${RECORDED} · rr test, JSON events on stderr`"
      />
      <ThreadRail />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
