<script setup lang="ts">
/**
 * Slide 7: the tier ladder on the left, two market comps on the right.
 *
 * The comps are two figures rather than two bars. They are in different units,
 * a company's annual revenue and a per-seat list price, so there is no scale
 * that holds both and any pair of bars had to be faked with an axis break.
 * Typeset figures say the same thing without the apparatus.
 *
 * Tier prices are on the ladder and marked as target list prices, because a
 * pricing question comes up in every one of these conversations and a ladder
 * with no numbers on it invites the question instead of answering it.
 *
 * The timeline is built in onMounted because it drives InkNumber through the
 * component's exposed API, and that instance does not exist during setup.
 */
import { reactive, ref } from 'vue'
import { DUR, ink, SETTLE, useStage, type GrowHandle } from 'slidev-addon-decks/story'

/* ── Tier ladder ── */
const BLOCK_X = 110
const BLOCK_W = 770
const BLOCK_H = 82
const BLOCK_GAP = 20
const BLOCK_TOP = 300

/** Names, buyers and target list prices. The footnote qualifies all four. */
const TIERS = [
  { name: 'Open source', buyer: 'Anyone', price: 'free', paid: false },
  { name: 'Pro', buyer: 'Analysts and quants', price: '$19/mo', paid: true },
  { name: 'Team', buyer: 'Data teams', price: '$99/seat/mo · 5+ seats', paid: true },
  {
    name: 'Private instance',
    buyer: 'Regulated verticals',
    price: 'from $50K/yr · roadmap',
    paid: true,
  },
]

const PAID_INK = ink('emerald', 3)
const FREE_INK = ink('slate', 2)

const blocks = TIERS.map((tier, i) => ({
  ...tier,
  y: BLOCK_TOP + i * (BLOCK_H + BLOCK_GAP),
  color: tier.paid ? PAID_INK : FREE_INK,
}))

const LADDER_BOTTOM = BLOCK_TOP + TIERS.length * (BLOCK_H + BLOCK_GAP) + 4

const COPY = [
  {
    lead: 'Four tiers, three of them paid.',
    body: 'The engine is open source. The API, the agent interface and the charts are what we sell.',
  },
  {
    lead: 'AccuWeather makes $225M a year on free feeds.',
    body: 'The National Weather Service data underneath it costs nothing to download.',
  },
  {
    lead: 'GovWin charges $12K to $42K a seat.',
    body: 'The bid notices underneath are public. Both companies charge for making free data usable.',
  },
]

const margin = ref<GrowHandle | null>(null)
const accu = ref<GrowHandle | null>(null)
const govwin = ref<GrowHandle | null>(null)

const s = reactive({ blocks: 0, foot: 0 })

/**
 * Enter motion: the ladder and the margin figure grow when the slide opens.
 * The build runs after mount, so the InkNumber refs are there to drive.
 */
const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { blocks: 1, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { foot: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.opacity}`)
    margin.value?.addGrow(tl, '<')
  },
  beats: (tl, beat) => {
    beat(0)

    // Each figure is one tween (a currency string scales rather than counts),
    // so a relative position here does not cascade.
    accu.value?.addGrow(tl, `+=${DUR.opacity}`)
    beat(1)

    govwin.value?.addGrow(tl, `+=${DUR.opacity}`)
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <!-- Tier ladder -->
        <g v-for="(block, i) in blocks" :key="block.name" :style="{ color: block.color }">
          <g
            :style="{
              opacity: String(Math.min(1, Math.max(0, s.blocks * 4 - i))),
            }"
          >
            <InkCardRect
              :x="BLOCK_X"
              :y="block.y"
              :width="BLOCK_W"
              :height="BLOCK_H"
              :glow-r="0.8"
              :glow-edge="0.6"
              :stroke-opacity="0.75"
              :stroke-width="2"
              :glow-filter="block.paid"
            />
            <text class="od-tier-name" :x="BLOCK_X + 36" :y="block.y + 38">{{ block.name }}</text>
            <text class="od-tier-buyer" :x="BLOCK_X + 36" :y="block.y + 66">{{ block.buyer }}</text>
            <text
              class="od-tier-price"
              :x="BLOCK_X + BLOCK_W - 36"
              :y="block.y + 50"
              text-anchor="end"
              :style="{ fill: block.color }"
            >
              {{ block.price }}
            </text>
          </g>
        </g>

        <text
          class="od-tier-foot"
          :x="BLOCK_X"
          :y="LADDER_BOTTOM + 20"
          :style="{ opacity: String(s.foot) }"
        >
          target list prices, pre-revenue
        </text>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Companies already sell usable public data.</h2>

      <!-- Two comps, two units, no shared scale: figures rather than bars. -->
      <div class="od-comp-host">
        <InkNumber
          ref="accu"
          value="$225M"
          label="AccuWeather annual revenue, on free NWS feeds"
          hue="cyan"
          :step="3"
          :size="5.4"
        />
        <InkNumber
          ref="govwin"
          value="$12K to $42K"
          label="GovWin IQ, per seat per year, on free bid notices"
          hue="cyan"
          :step="3"
          :size="3.6"
        />
      </div>

      <div class="od-margin-host">
        <InkNumber ref="margin" value="~90%" label="modeled gross margin" hue="emerald" :step="3" />
      </div>
    </template>

    <template #card>
      <StoryCard anchor="right" hue="emerald" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.od-tier-name {
  font-family: var(--od-font-sans);
  font-size: 30px;
  font-weight: 590;
  letter-spacing: -0.015em;
  fill: var(--od-text);
}
.od-tier-buyer {
  font-family: var(--od-font-mono);
  font-size: 22px;
  font-weight: 500;
  fill: var(--od-text-faint);
}
.od-tier-price {
  font-family: var(--od-font-mono);
  font-size: 24px;
  font-weight: 510;
  font-variant-numeric: tabular-nums;
}
.od-tier-foot {
  font-family: var(--od-font-mono);
  font-size: 17px;
  letter-spacing: 0.06em;
  fill: var(--od-text-dim);
}
.od-comp-host {
  position: absolute;
  left: calc(56.25 * var(--sw));
  top: calc(27 * var(--sh));
  width: calc(40 * var(--sw));
  display: flex;
  flex-direction: column;
  gap: calc(7 * var(--sh));
}
.od-margin-host {
  /* Clear of the ladder footnote: the footnote reads as the ladder's caption
     only if it sits nearer the last tier block than this figure. */
  position: absolute;
  left: calc(5.7 * var(--sw));
  top: calc(74 * var(--sh));
}
</style>
