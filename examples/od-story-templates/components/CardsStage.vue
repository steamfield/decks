<script setup lang="ts">
/**
 * A row of labelled cards: name, note, and one that lights up.
 *
 * The shape every architecture, tier and pipeline slide takes. `InkLabeledCard`
 * draws the box and its two text lines, so the stage only decides where the
 * boxes go and when each one arrives. The card's default slot draws in the same
 * coordinate space, which is where the other two stage text classes go: a tag
 * above the name and a value under the note, so the gallery shows all four of
 * `od-stage-tag`, `od-stage-name`, `od-stage-note` and `od-stage-value`.
 *
 * Arrival is a stagger rather than three tweens: one 0 to 1 field on the beat
 * timeline, and `stagger()` slices it per card. That keeps the pacing in the
 * duration table and stays seekable in both directions.
 */
import { computed, reactive } from 'vue'
import { DUR, RISE, stagger, useStage } from 'slidev-addon-decks/story'

/** Illustrative boxes. A real stage imports these from `data/*.ts`. */
const CARDS = [
  { tag: 'step one', name: 'Fetch', note: 'HTTP, one config per portal', value: '1.2 s' },
  { tag: 'step two', name: 'Parse', note: 'CSV, XLSX, PDF', value: '8.4 s' },
  { tag: 'step three', name: 'Serve', note: 'Parquet behind DuckDB', value: '40 ms', dashed: true },
]

/** Box geometry in viewBox units: three across the middle of the stage. */
const WIDTH = 420
const HEIGHT = 200
const GAP = 60
const TOP = 420
const LEFT = (1920 - (CARDS.length * WIDTH + (CARDS.length - 1) * GAP)) / 2

/**
 * The two extra text lines the card slot draws, measured from the top of the
 * box the way `InkLabeledCard` measures its own two. The inset matches the
 * card's, so all four lines share a left edge.
 */
const PAD = 30
const TAG_BASELINE = 28
const VALUE_BASELINE = 140

const COPY = [
  {
    lead: 'Three boxes, one row.',
    body: 'Each carries a name and one line of detail, nothing else.',
  },
  {
    lead: 'The third is not built yet.',
    body: 'A dashed box reads as planned without a word of copy saying so.',
  },
  { lead: 'Then it is.', body: 'The dash closes and the glow comes up over the card duration.' },
]

/** Beat state, every field 0 to 1. */
const s = reactive({ arrive: 0, built: 0 })

const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  /** Enter motion: the row is already on stage under the first card. */
  enter: (tl) => tl.fromTo(s, { arrive: 0 }, { arrive: 1, duration: DUR.grow }),
  beats: (tl, beat) => {
    beat(0)
    beat(1)
    tl.to(s, { built: 1, duration: DUR.card })
    beat(2)
  },
})

/** Cards ink in one after another, left to right. */
const progress = (i: number) => stagger(s.arrive, i, CARDS.length, 0.18)

/** The planned box keeps its dash until the last beat. */
const dashed = computed(() => s.built < 0.5)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <g
          v-for="(card, i) in CARDS"
          :key="card.name"
          :style="{ opacity: progress(i) }"
          :transform="`translate(0 ${(1 - progress(i)) * RISE.card})`"
        >
          <InkLabeledCard
            :x="LEFT + i * (WIDTH + GAP)"
            :y="TOP"
            :width="WIDTH"
            :height="HEIGHT"
            :name="card.name"
            :note="card.note"
            hue="cyan"
            :dash="card.dashed && dashed ? '10 8' : undefined"
            :lit="card.dashed ? !dashed : undefined"
          >
            <text class="od-stage-tag" :x="LEFT + i * (WIDTH + GAP) + PAD" :y="TOP + TAG_BASELINE">
              {{ card.tag }}
            </text>
            <text
              class="od-stage-value"
              :x="LEFT + i * (WIDTH + GAP) + PAD"
              :y="TOP + VALUE_BASELINE"
            >
              {{ card.value }}
            </text>
          </InkLabeledCard>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">A labelled card is a name and a note.</h2>
    </template>

    <template #card>
      <StoryCard anchor="right" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
