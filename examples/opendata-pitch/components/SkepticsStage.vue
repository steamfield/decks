<script setup lang="ts">
/**
 * Slide 8: where we are, told as a finding rather than as traction.
 *
 * There is no revenue to show, so the slide does not pretend to. Three beats:
 * the reach the data stories earned, the conversations that reach opened, and
 * the thing every one of those conversations taught us: the people who need
 * this do not trust AI with numbers yet, so a rerunnable query behind every
 * figure is the product, not a feature.
 *
 * The reach figure is enter motion rather than beat motion: it grows as the
 * slide arrives, so beat 0 is not an empty stage under a card that already
 * claims the number. useStage builds it after mount, which is where a ref to
 * the InkNumber it drives first exists.
 */
import { reactive, ref } from 'vue'
import { DRAW, DUR, stagger, useStage, type GrowHandle } from 'slidev-addon-decks/story'
import { CONVERSATIONS, REACH_FIGURE, REACH_LABEL } from '../data/signals'

const COPY = [
  {
    lead: '1M+ reads, and none of them engineers.',
    body: 'Data stories built on the catalog pulled 1M+ views. The readers were journalists, economists and researchers.',
  },
  {
    lead: 'Every conversation lands on the same worry.',
    body: 'State agencies, newsrooms, enterprises. Interest everywhere, and one question each time: does the AI make numbers up?',
  },
  {
    lead: 'So verifiability is the product.',
    body: 'Every answer traces to a query you can rerun. That is what a skeptic will trust.',
  },
]

/** Beat state, every field 0 to 1. */
const s = reactive({ rows: 0, answer: 0 })

const reach = ref<GrowHandle | null>(null)

/* ── Enter motion: the reach figure grows as the slide arrives ── */
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => reach.value?.addGrow(tl, 0),
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { rows: 1, duration: DUR.scale, ease: DRAW })
    beat(1)
    tl.to(s, { answer: 1, duration: DUR.card }, `+=${DUR.opacity}`)
    beat(2)
  },
})

/** Rows ink in one after another, top to bottom. */
const rowProgress = (i: number) => stagger(s.rows, i, CONVERSATIONS.length, 0.16)

/**
 * The rows recede on the last beat so the live text zones stay at two: the card
 * and the one end label beside it.
 */
const rowsOpacity = (i: number) => rowProgress(i) * (1 - 0.55 * s.answer)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">Verifiability is what converts the skeptics.</h2>

      <div class="od-signals">
        <div class="od-signal-figure" :style="{ opacity: String(1 - 0.6 * s.rows) }">
          <InkNumber
            ref="reach"
            :value="REACH_FIGURE"
            :label="REACH_LABEL"
            :size="5.6"
            hue="cyan"
            :step="3"
          />
        </div>

        <ul class="od-signal-rows">
          <li
            v-for="(row, i) in CONVERSATIONS"
            :key="row.who"
            class="od-signal-row"
            :style="{
              opacity: String(rowsOpacity(i)),
              transform: `translateY(${(1 - rowProgress(i)) * 10}px)`,
            }"
          >
            <span class="od-signal-who">{{ row.who }}</span>
            <!-- Only the tag that says something: three rows in a row reading
                 DISCOVERY is a column of noise. -->
            <span v-if="row.tag !== 'discovery'" class="od-mono od-signal-tag">{{ row.tag }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template #card>
      <StoryCard anchor="right" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.od-signals {
  position: absolute;
  left: calc(5.7 * var(--sw));
  top: calc(26 * var(--sh));
  width: calc(44 * var(--sw));
}
.od-signal-rows {
  list-style: none;
  margin: calc(3.4 * var(--sh)) 0 0;
  padding: 0;
  border-top: 1px solid var(--od-border);
}
.od-signal-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: calc(1.6 * var(--sw));
  padding: calc(1.1 * var(--sh)) 0;
  border-bottom: 1px solid var(--od-border);
  font-family: var(--od-font-sans);
  font-size: calc(1.25 * var(--sw));
  font-weight: 510;
  letter-spacing: -0.01em;
  color: var(--od-text-secondary);
}
.od-signal-tag {
  flex: none;
  font-size: calc(0.86 * var(--sw));
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--od-text-faint);
}
/* The reach figure recedes as the rows arrive, so a beat is never carrying
   three live text zones at once. */
.od-signal-figure {
  transition: opacity var(--od-dur-card) var(--od-settle);
}
</style>
