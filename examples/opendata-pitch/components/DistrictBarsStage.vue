<script setup lang="ts">
/**
 * Slide 6: ten districts on STAAR, then the seven with a comparable SAT score.
 *
 * The beat machine lives here and the geometry lives in InkBars, which is why
 * both timelines are built after mount rather than in setup: their tweens
 * target the child's row state, and the child does not exist until it has
 * mounted. useStage owns that, and disposes both with this component.
 *
 * Beat 1 underlines a word inside the lead, which is what StoryCard's `lead`
 * slot is for; every other beat is the plain string. Beats 0 and 1 carry
 * different copy: beat 0 names the finding, beat 1 names the row the recolor
 * just picked out.
 */
import { computed, reactive, ref } from 'vue'
import { DUR, ink, SETTLE, useStage, type BarsHandle, type InkBarRow } from 'slidev-addon-decks/story'
import { BARS_BASELINE_Y, BASELINE_X } from '../data/baseline'
import {
  ARTICLE_URL,
  BAR_BAND,
  BAR_X,
  NO_SAT_IDS,
  SAT_DOMAIN,
  SAT_ROWS,
  STAAR_DOMAIN,
  STAAR_ROWS,
} from '../data/tea-districts'

const bars = ref<BarsHandle | null>(null)

/** Austin is the comparison, so it is the one row that leaves the series hue. */
const AUSTIN_INK = ink('rose', 3)

/** Axis labels swap with the metric. Thresholded so a seek lands on one or the other. */
const s = reactive({ metric: 0, chip: 0, underline: 0, finding: 0 })
const onSat = computed(() => s.metric >= 0.5)

const axis = computed(() =>
  onSat.value
    ? { metric: 'Mean SAT total, Class of 2024', start: '800', end: '1000' }
    : { metric: 'STAAR math, 2024-25', start: '0', end: '70%' },
)

/**
 * The chip explains the row that left. It sits in the empty space to the
 * right of the three shortest SAT bars (PSJA, Point Isabel, Mission all land
 * under 880 on an 800 to 1000 axis), between the fourth and fifth rows of the
 * seven that remain, clear of their end labels.
 */
const SAT_PITCH = (BAR_BAND[1] - BAR_BAND[0]) / SAT_ROWS.length

/** Austin's rank on each metric, highest value first, derived from the rows. */
const rankOf = (rows: InkBarRow[], id: string) =>
  [...rows].sort((a, b) => b.value - a.value).findIndex((r) => r.id === id) + 1
const AUSTIN_STAAR_RANK = rankOf(STAAR_ROWS, 'austin')
const AUSTIN_SAT_RANK = rankOf(SAT_ROWS, 'austin')
const ordinal = (n: number) => {
  const teen = n % 100 > 10 && n % 100 < 14
  const suffix = teen ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
  return `${n}${suffix}`
}
const FINDING_CHIP = `Austin: ${ordinal(AUSTIN_STAAR_RANK)} of ${STAAR_ROWS.length} on STAAR, ${ordinal(AUSTIN_SAT_RANK)} of ${SAT_ROWS.length} on the SAT`
const CHIP_X =
  BAR_X[0] + ((BAR_X[1] - BAR_X[0]) * (875 - SAT_DOMAIN[0])) / (SAT_DOMAIN[1] - SAT_DOMAIN[0]) + 90
const CHIP_Y = BAR_BAND[0] + SAT_PITCH * 5

const COPY = [
  {
    lead: 'Roma is 90% low-income and triples Austin.',
    body: 'Economically disadvantaged students meeting grade level on STAAR math, 2024-25.',
  },
  {
    lead: 'Austin is last of the ten.',
    body: `22% of Austin's low-income students met grade level; Roma's 64% is nearly triple.`,
  },
  {
    lead: 'The SAT flips it.',
    body: 'Same low-income students, same year. Three Valley districts beat Austin on the SAT, three trail it.',
  },
  {
    lead: 'STAAR and the SAT disagree.',
    body: 'One of these tests is measuring something that college readiness does not follow from.',
  },
]

/** Enter motion: the bars grow when the slide opens. */
const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => bars.value?.addGrow(tl),
  beats: (tl, beat) => {
    beat(0)

    bars.value?.addRecolor(tl, 'austin', AUSTIN_INK, `+=${DUR.opacity}`)
    tl.to(s, { underline: 1, duration: DUR.card, ease: SETTLE }, '<')
    beat(1)

    bars.value?.addExit(tl, NO_SAT_IDS)
    bars.value?.addReorder(tl, SAT_ROWS, SAT_DOMAIN, `+=${DUR.opacity}`)
    tl.to(s, { metric: 1, duration: DUR.scale, ease: SETTLE }, '<')
    tl.to(s, { chip: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`)
    beat(2)

    // The finding: the Roma chip gives way to the rank chip in the same spot.
    tl.to(s, { chip: 0, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { finding: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.opacity}`)
    beat(3)
  },
})

/** Beat 1 is the only stop that marks up a word inside the lead. */
const marked = computed(() => clicks.value === 1)

/** The lead split around the word the underline lands on. */
const LEAD_PARTS = ['Austin is ', 'last', ' of the ten.']
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <text class="od-stage-label" :x="BAR_X[0] - 40" :y="BARS_BASELINE_Y - 28" text-anchor="end">
          {{ axis.metric }}
        </text>
        <text class="od-stage-label" :x="BAR_X[0]" :y="BARS_BASELINE_Y - 28" text-anchor="start">
          {{ axis.start }}
        </text>
        <text class="od-stage-label" :x="BAR_X[1]" :y="BARS_BASELINE_Y - 28" text-anchor="end">
          {{ axis.end }}
        </text>
      </g>

      <!-- Deliberately outside the playCount key. The timeline built in
           onMounted tweens this instance's row state, so a remount on slide
           re-entry would leave it animating an orphan. Nothing here needs a
           replay anyway: every beat is a seek. -->
      <InkBars
        ref="bars"
        seed="tea-districts"
        hue="emerald"
        :step="3"
        :rows="STAAR_ROWS"
        :domain="STAAR_DOMAIN"
        :x-range="BAR_X"
        :y-band="BAR_BAND"
        :thickness="24"
        sort="desc"
      />
    </template>

    <template #overlay>
      <StoryLayer class="vt-baseline">
        <InkRule
          :x1="BASELINE_X[0]"
          :x2="BASELINE_X[1]"
          :y="BARS_BASELINE_Y"
          seed="story-baseline"
        />
      </StoryLayer>

      <h2 class="od-story-head">They had the data. They could not get at it.</h2>

      <InkChip
        :x="CHIP_X"
        :y="CHIP_Y"
        text="Roma drops out: 0.7% take the SAT"
        hue="rose"
        wide
        :progress="s.chip"
      />

      <InkChip :x="CHIP_X" :y="CHIP_Y" :text="FINDING_CHIP" hue="rose" wide :progress="s.finding" />

      <StoryLink :href="ARTICLE_URL" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="emerald" :lead="copy.lead" :body="copy.body">
        <template v-if="marked" #lead>
          {{ LEAD_PARTS[0] }}<Underline hue="amber" :step="3">{{ LEAD_PARTS[1] }}</Underline
          >{{ LEAD_PARTS[2] }}
        </template>
      </StoryCard>
    </template>
  </StoryStage>
</template>
