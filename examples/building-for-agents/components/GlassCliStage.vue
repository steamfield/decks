<script setup lang="ts">
/**
 * Slide 14: agents read StatGlass history through a CLI.
 *
 * An agent session on a terminal pane, then the reason this CLI is Rust.
 * Three beats. On entry the session plays: a request, `statglass now` for
 * every host, and `statglass history` for one of them. The first click turns
 * the gap line yellow and adds a command that got the busy envelope. The
 * second dims the session and shows the RFC's paragraph on why the CLI is not
 * TypeScript.
 *
 * The session is illustrative. The history text and the envelope are exactly
 * what the CLI's tests assert, and the `now` output is made-up values in the
 * real shape. The quote is the RFC's text through a checked excerpt.
 */
import { computed, reactive } from 'vue'
import { DUR, SETTLE, STAGE, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import { GAP_LINE, READ_COMMANDS, RETRY, RFC_SIZES, SESSION } from '../data/14-glass-cli'
import { WHY_RUST } from '../data/code/14-glass-cli'
import type { TermLine } from '../data/types'

const [TS_LOW, TS_HIGH] = RFC_SIZES.compiledTsBinaryMb
const COMMAND_LIST = `${READ_COMMANDS.slice(0, -1).join(', ')} and ${READ_COMMANDS[READ_COMMANDS.length - 1]}`

const COPY = [
  {
    lead: 'The statglass CLI reads recorded history.',
    body: `${COMMAND_LIST} work on this Mac or on any remote host StatGlass mirrors.`,
  },
  {
    lead: 'History output lists gaps in the samples.',
    body: 'The gap line gives the time range and the cause. Errors come back as JSON with a next step.',
  },
  {
    lead: 'The CLI is written in Rust.',
    body: `The RFC estimates a compiled TypeScript binary at ${TS_LOW} to ${TS_HIGH} MB, for a ${RFC_SIZES.appMb} MB app.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
const PANE = { x: 110, y: 190, width: 1150, height: 510 }
const QUOTE = { x: 1300, y: 190, w: 510 }

/** `typed` is the entrance's and `more` the first click's: no field has two drivers. */
const s = reactive({ pane: OFF, typed: OFF, more: OFF, session: ON, quote: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { pane: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { typed: SESSION.length, duration: DUR.scale, ease: 'none' })
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { more: RETRY.length, duration: DUR.grow, ease: 'none' })
    beat(1)
    tl.to(s, { session: DIM, duration: DUR.card, ease: SETTLE })
    tl.to(s, { quote: ON, duration: DUR.card, ease: SETTLE })
    beat(2)
  },
})

/** From the first click the gap line is yellow: the one line that beat is about. */
const lines = computed<TermLine[]>(() => [
  ...SESSION.map((line, i): TermLine => (i === GAP_LINE && clicks.value >= 1 ? { ...line, tone: 'warn' } : line)),
  ...RETRY,
])
const shown = computed(() => Math.floor(s.typed + 1e-6) + Math.floor(s.more + 1e-6))

/** The RFC's paragraph, with its one command set apart as code. */
const quote = WHY_RUST.code
  .split('\n')
  .join(' ')
  .split('`')
  .map((text, i) => ({ text, code: i % 2 === 1 }))
const source = `${WHY_RUST.repo}/${WHY_RUST.path}`
const sourceLines = `lines ${WHY_RUST.start} to ${WHY_RUST.end}`
const quoteBox = computed(() => ({
  left: `${(QUOTE.x / STAGE.width) * 100}%`,
  top: `${(QUOTE.y / STAGE.height) * 100}%`,
  width: `${(QUOTE.w / STAGE.width) * 100}%`,
  opacity: String(s.quote),
  transform: `translateY(calc(${(ON - s.quote) * 0.6} * var(--sw)))`,
}))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">Agents read StatGlass history through a CLI.</h2>
      <NamePlate id="statglass" chip-only />

      <TermPane
        :lines="lines"
        :shown="shown"
        :size="26"
        :follow="false"
        :progress="s.pane"
        :power="s.session"
        tag="Illustrative session · output format from the CLI's tests"
        v-bind="PANE"
      />

      <figure class="glass-quote" :style="quoteBox">
        <div class="glass-quote-label">From the agent CLI RFC</div>
        <div class="glass-quote-text">
          <template v-for="(part, i) in quote" :key="i"><code v-if="part.code">{{ part.text }}</code><template v-else>{{ part.text }}</template></template>
        </div>
        <figcaption class="glass-quote-source">{{ source }}<br />{{ sourceLines }}</figcaption>
      </figure>

      <ThreadRail current="statglass" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="emerald" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.glass-quote {
  position: absolute;
  margin: var(--sf-zero);
  padding: calc(1.2 * var(--sw)) calc(1.4 * var(--sw)) calc(1.3 * var(--sw));
  border: var(--sf-hairline) solid var(--od-border-rule);
  border-left: var(--sf-marker) solid var(--od-amber);
  border-radius: var(--sf-radius-card);
  background: var(--od-surface);
}
.glass-quote-label {
  margin-bottom: calc(0.9 * var(--sw));
  font-family: var(--sf-font-pixel);
  font-size: var(--sf-pixel-size);
  line-height: var(--sf-pixel-leading);
  text-transform: uppercase;
  color: var(--od-amber);
  text-shadow: var(--sf-fringe);
}
.glass-quote-text {
  display: block;
  font-family: var(--od-font-sans);
  font-size: calc(1.5625 * var(--sw));
  line-height: 1.12;
  color: var(--od-text);
}
.glass-quote-text code {
  padding: var(--sf-zero);
  background: none;
  font-family: var(--od-font-mono);
  font-size: calc(1.09375 * var(--sw));
  color: var(--od-cyan);
}
.glass-quote-source {
  margin-top: calc(1 * var(--sw));
  font-family: var(--od-font-mono);
  font-size: calc(0.9375 * var(--sw));
  line-height: 1.45;
  color: var(--od-text-muted);
}
</style>
