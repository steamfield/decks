<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { OFF, ON } from './design'
import { boardMeetings, collisionTimeline, decisionsToWatch, showQr, sourcesPage, watchCount, watchDisplay, watchLabels } from '../data/14-watch'

// Three beats: the decisions and who makes them, the December dates, the close.
const COPY = [
  { lead: 'Each decision names who makes it.', body: 'Some have legal deadlines. Others wait on a vote by elected officials.' },
  { lead: 'Trustees must meet before the request deadline.', body: 'Trustees need a public vote to request a different intervention.' },
  { lead: '' },
]
const petition = collisionTimeline.find(event => event.id === 'petitions')!
const request = collisionTimeline.find(event => event.id === 'trustees')!
const meeting = boardMeetings.find(event => event.date > request.date && event.kind === 'Regular voting meeting')!
const date = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
// Beat 0's resting state is the decisions grid, so it starts visible.
const s = reactive({ topics: ON, civic: OFF, dock: OFF, closing: OFF, collapse: OFF, qr: OFF })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { topics: OFF, civic: ON, duration: DUR.color, ease: SETTLE })
    beat(1)
    if (showQr) {
      // Move the date marks below the quote before it appears, then gather them into the QR footprint.
      tl.to(s, { dock: ON, duration: DUR.card, ease: SETTLE })
      tl.to(s, { closing: ON, duration: DUR.card, ease: SETTLE })
      tl.to(s, { collapse: ON, civic: OFF, duration: DUR.gather, ease: SETTLE })
      tl.to(s, { qr: ON, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`)
    } else {
      // With no QR to gather into, the dates clear and the close settles in alone.
      tl.to(s, { civic: OFF, duration: DUR.opacity, ease: SETTLE })
      tl.to(s, { closing: ON, duration: DUR.grow, ease: SETTLE })
    }
    beat(2)
  },
})
const ruleSource = { href: watchDisplay.rulesUrl, label: watchDisplay.rulesSource }
const sources = computed(() => clicks.value === 1
  ? [ruleSource, { href: meeting.source, label: watchDisplay.boardSource }]
  : [ruleSource, { href: watchDisplay.constitutionUrl, label: watchDisplay.constitution }, { href: watchDisplay.legislatureUrl, label: watchDisplay.legislature }])
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">{{ watchCount }} pending decisions will settle what changes.</h2>
      <div class="topics" :style="{ opacity: s.topics }" :aria-hidden="clicks !== 0">
        <div v-for="(decision, i) in decisionsToWatch" :key="decision.id" class="topic">
          <span class="tick" />
          <span class="tx-tag is-pending">{{ watchDisplay.pending }}</span>
          <strong>{{ watchLabels[i].name }}</strong>
          <span class="actor">{{ watchLabels[i].actor }}</span>
        </div>
      </div>
      <div class="civic" :style="{ opacity: s.civic, transform: s.dock === OFF && s.collapse === OFF ? 'none' : `translateY(calc(${s.dock * (ON - s.collapse) * 24} * var(--sh))) scale(${ON - s.collapse})` }" :aria-hidden="clicks !== 1">
        <div class="deadline"><strong>{{ date(petition.date) }}</strong><span>{{ watchDisplay.petition }}</span><span class="tx-tag is-pending">{{ watchDisplay.pending }}</span></div>
        <div class="deadline"><strong>{{ date(request.date) }}</strong><span>{{ watchDisplay.request }}</span><span class="tx-tag is-pending">{{ watchDisplay.pending }}</span></div>
        <div class="deadline"><strong>{{ date(meeting.date) }}</strong><span>{{ watchDisplay.meeting }}</span><span class="timing">{{ watchDisplay.timing }}</span></div>
      </div>
      <div class="closing" :class="{ 'is-solo': !showQr }" :style="{ opacity: s.closing }" :aria-hidden="clicks !== 2">{{ watchDisplay.closing }}</div>
      <div v-if="showQr" class="sources" :style="{ opacity: s.qr }" :aria-hidden="s.qr === OFF">
        <OdQrCard :url="sourcesPage.url ?? undefined" :label="watchDisplay.sources" :sublabel="watchDisplay.placeholder" :aria-label="sourcesPage.needed" />
        <span v-if="!sourcesPage.url" class="qr-placeholder">{{ watchDisplay.flag }}</span>
      </div>
      <div v-if="clicks !== 2" class="source-links">
        <StoryLink v-for="source in sources" :key="source.href" :href="source.href" :label="source.label" />
      </div>
    </template>
    <template #card>
      <Transition name="card"><StoryCard v-if="copy.lead" anchor="left" hue="slate" :lead="copy.lead" :body="copy.body" /></Transition>
    </template>
  </StoryStage>
</template>

<style scoped>
/* Local geometry for the decision rail, the December dates and the closing gather. */
.topics { position: absolute; top: calc(28 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(5, 1fr); border-top: var(--tx-hairline) dashed var(--od-amber); gap: calc(1.3 * var(--sw)); }
.topic { position: relative; padding-top: calc(3 * var(--sh)); display: flex; flex-direction: column; align-items: flex-start; gap: calc(1.7 * var(--sh)); }
.tick { position: absolute; top: calc(-1 * var(--sh)); left: var(--tx-zero); height: calc(3 * var(--sh)); border-left: var(--tx-hairline) dashed var(--od-amber); }
.topic strong { font-size: var(--tx-body-size); font-weight: var(--tx-lead-weight); line-height: var(--tx-label-leading); }
.actor { font-size: var(--tx-small-size); line-height: var(--tx-body-leading); }
.civic { position: absolute; top: calc(28 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(2 * var(--sw)); transform-origin: 90% 50%; }
.deadline { border-top: var(--tx-hairline) solid var(--od-border); padding-top: calc(2 * var(--sh)); display: flex; flex-direction: column; align-items: flex-start; gap: calc(2 * var(--sh)); font-size: var(--tx-body-size); }
.deadline strong { font-size: calc(3 * var(--sw)); font-weight: var(--tx-lead-weight); }
.timing { font-size: var(--tx-small-size); color: var(--od-amber); }
.closing { position: absolute; top: calc(24 * var(--sh)); left: var(--tx-margin-x); right: calc(27 * var(--sw)); font-family: var(--od-font-serif); font-size: calc(2.4 * var(--sw)); line-height: 1.4; }
/* Alone on the frame, the close sits on the cover title's centerline. */
.closing.is-solo { top: calc(50 * var(--sh));transform: translateY(-50%); }
/* The last beat has no card; it leaves on the same clock as the dates. */
.card-enter-active, .card-leave-active { transition: opacity var(--tx-vt-out) linear; }
.card-enter-from, .card-leave-to { opacity: var(--tx-off); }
.sources { position: absolute; top: calc(30 * var(--sh)); right: var(--tx-margin-x); width: calc(17 * var(--sw)); }
.sources :deep(.od-qr-frame) { width: calc(15 * var(--sw)); padding: calc(1 * var(--sw)); border-radius: var(--tx-radius-card); }
.sources :deep(.od-qr-label), .sources :deep(.od-qr-sublabel) { font-size: var(--tx-small-size); text-transform: none; letter-spacing: var(--tx-body-tracking); }
.sources :deep(.od-qr-card) { gap: calc(1.2 * var(--sh)); }
.qr-placeholder { position: absolute; top: calc(6 * var(--sh)); left: calc(2.5 * var(--sw)); right: calc(2.5 * var(--sw)); color: var(--od-canvas); font-size: var(--tx-body-size); text-align: center; }
.source-links { position: absolute; right: var(--tx-margin-x); bottom: var(--tx-rail-bottom); display: flex; gap: calc(1.5 * var(--sw)); }
.source-links :deep(.od-story-link) { position: static; }
</style>
