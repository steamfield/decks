<script setup lang="ts">
/**
 * Slide 17: A Decks hook blocks AI-sounding sentences.
 *
 * The slide is about the tool it is built with. Left: this file's own
 * `useStage` call, read from the file at build time, then a recorded denial
 * from the write hook. Right: a scrubber for this slide's three beats whose
 * cursor is the timeline's own state, the lint's patterns as one square each,
 * and a count of the deck's sourced figures.
 *
 * The excerpt is the lines between the two marker comments below. It is read
 * with a `?raw` import of this file, so it cannot drift from the code.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, clamp01, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import source from './DecksStage.vue?raw'
import {
  DENIAL,
  DENIAL_RECORDED,
  DENIAL_RULES,
  DENIAL_SOURCE,
  DENIED,
  PATTERNS,
  PATTERN_ROWS,
  SOURCED_FIGURES as FIGURES,
} from '../data/17-decks'
import type { Excerpt } from '../data/code/types'

const COPY = [
  {
    lead: 'Each click seeks the timeline to a beat.',
    body: 'The slide is a Vue component with a GSAP timeline. Stepping back plays the same tweens in reverse.',
  },
  {
    lead: `The write hook enforces ${DENIED} lint patterns.`,
    body: `The lint has ${PATTERNS} patterns. A write matching one of the ${DENIED} errors is refused with the pattern's id.`,
  },
  {
    lead: 'This deck lists a source for each figure.',
    body: 'Each row names the file or command that produces the figure.',
  },
]

/** `at` is the beat the timeline is on, as a number it tweens. */
const s = reactive({ at: OFF, count: OFF })

// excerpt:start
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { at: 1, duration: DUR.card, ease: SETTLE })
    beat(1)
    tl.to(s, { at: 2, duration: DUR.card, ease: SETTLE })
    tl.to(s, { count: FIGURES, duration: DUR.scale, ease: DRAW })
    beat(2)
  },
})
// excerpt:end

/* ── This file, quoting itself ── */
const sourceLines = source.split('\n')
const first = sourceLines.findIndex((line) => line.trim() === '// excerpt:start') + 1
const last = sourceLines.findIndex((line) => line.trim() === '// excerpt:end')
const OWN_SOURCE: Excerpt = {
  repo: 'this deck',
  path: 'components/DecksStage.vue',
  start: first + 1,
  end: last,
  commit: 'the build you are watching',
  lang: 'ts',
  code: sourceLines.slice(first, last).join('\n'),
}

/* ── Geometry, in stage viewBox units ── */
const LEFT = { x: 110, y: 196, width: 900, height: 500 }
const RIGHT = { x: 1060, x1: 1810 }
const TRACK = { y: 306, x0: RIGHT.x + 50, x1: RIGHT.x1 - 50, dot: 10, cursor: 20, label: 54 }
const GRID = { y: 470, size: 22, gap: 6 }
const COUNT = { y: 800 }

const stops = COPY.map((_, i) => ({
  n: i,
  x: TRACK.x0 + (i * (TRACK.x1 - TRACK.x0)) / (COPY.length - 1),
}))
const cursorX = computed(() => TRACK.x0 + (s.at * (TRACK.x1 - TRACK.x0)) / (COPY.length - 1))
const squares = PATTERN_ROWS.map((row, i) => ({ ...row, x: RIGHT.x + i * (GRID.size + GRID.gap) }))
const denied = PATTERN_ROWS.filter((row) => row.denied).map((row) => ({
  id: row.id,
  hit: DENIAL_RULES.includes(row.id),
}))
const idLines = [denied.slice(0, 3), denied.slice(3)]

const PINK = ink('rose', 2)
const DATA = ink('cyan', 2)
const COUNTED = ink('amber', 2)
const NEUTRAL = ink('slate', 1)

/** The denial arrives on beat 1 and drops back on beat 2, when the count is the subject. */
const denial = computed(() => clamp01(s.at) * (ON - clamp01(s.at - 1) * (ON - DIM)))
const counter = computed(() => clamp01(s.at - 1))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- ── The beat scrubber: this slide's timeline ── -->
      <text class="sf-pixel is-small" :x="RIGHT.x" :y="226">This slide's timeline</text>
      <text class="sf-mono" :x="RIGHT.x1" :y="230" text-anchor="end" :style="{ fill: DATA }">clicks = {{ clicks }}</text>
      <line :x1="TRACK.x0" :x2="TRACK.x1" :y1="TRACK.y" :y2="TRACK.y" :stroke="NEUTRAL" stroke-width="2" />
      <line :x1="TRACK.x0" :x2="cursorX" :y1="TRACK.y" :y2="TRACK.y" :stroke="DATA" stroke-width="4" stroke-linecap="round" />
      <g v-for="stop in stops" :key="stop.n">
        <circle :cx="stop.x" :cy="TRACK.y" :r="TRACK.dot" :fill="s.at >= stop.n ? DATA : NEUTRAL" />
        <text class="sf-mono" :x="stop.x" :y="TRACK.y + TRACK.label" text-anchor="middle">beat({{ stop.n }})</text>
      </g>
      <circle :cx="cursorX" :cy="TRACK.y" :r="TRACK.cursor" fill="none" :stroke="DATA" stroke-width="3" />

      <!-- ── The lint's patterns, one square each ── -->
      <g :style="{ opacity: String(denial) }">
        <text class="sf-pixel is-small" :x="RIGHT.x" :y="GRID.y - 22">{{ PATTERNS }} lint patterns · the hook denies {{ DENIED }}</text>
        <rect
          v-for="sq in squares"
          :key="sq.id"
          :x="sq.x"
          :y="GRID.y"
          :width="GRID.size"
          :height="GRID.size"
          rx="2"
          :fill="sq.denied ? PINK : 'none'"
          :stroke="sq.denied ? PINK : NEUTRAL"
          stroke-width="2"
        />
        <text v-for="(ids, row) in idLines" :key="row" class="sf-mono is-small" :x="RIGHT.x" :y="GRID.y + 66 + row * 32">
          <tspan v-for="(rule, i) in ids" :key="rule.id" :style="{ fill: rule.hit ? PINK : undefined }">{{ i ? ' · ' : '' }}{{ rule.id }}</tspan>
        </text>
      </g>

      <!-- ── The deck's sourced figures ── -->
      <g :style="{ opacity: String(counter) }">
        <text class="dk-count" :x="RIGHT.x" :y="COUNT.y" :style="{ fill: COUNTED }">{{ Math.round(s.count) }}</text>
        <text class="dk-count-label" :x="RIGHT.x" :y="COUNT.y + 54">source rows for this deck's figures and claims</text>
        <text class="sf-mono is-small" :x="RIGHT.x" :y="COUNT.y + 92">data-sources.md and data/sources/*.md, counted at build</text>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">A Decks hook blocks AI-sounding sentences.</h2>
      <NamePlate id="decks" />

      <CodePane
        v-if="clicks < 1"
        :excerpt="OWN_SOURCE"
        :x="LEFT.x"
        :y="LEFT.y"
        :width="LEFT.width"
        :height="LEFT.height"
        :size="21"
      />
      <TermPane
        v-else
        :lines="DENIAL"
        :x="LEFT.x"
        :y="LEFT.y"
        :width="LEFT.width"
        :height="LEFT.height"
        :size="28"
        :tag="`Recorded ${DENIAL_RECORDED} · test input · ${DENIAL_SOURCE}`"
        :progress="ON - clamp01(s.at - 1) * (ON - DIM)"
        :power="clamp01(s.at)"
      />
      <ThreadRail current="decks" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.dk-count {
  font-family: var(--sf-font-pixel);
  font-size: 84px;
  text-shadow: var(--sf-fringe);
}
.dk-count-label {
  font-family: var(--od-font-sans);
  font-size: var(--sf-svg-term);
  fill: var(--od-text-secondary);
}
</style>
