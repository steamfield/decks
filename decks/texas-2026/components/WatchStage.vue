<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DUR, SETTLE, useStage, xScale } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import CollisionTimeline from './CollisionTimeline.vue'
import { boardMeetings, collisionTimeline, decisionsToWatch, petitionProcessDates, sessionMilestones, sourcesPage, watchCount, watchDisplay, watchLabels } from '../data/14-watch'

const COPY = [
  { lead: 'Lawmakers meet beyond the intervention order deadline.', body: 'The governor’s deadline for action on bills follows the end of the legislative session.' },
  { lead: 'Each decision names who makes it.', body: 'Some have legal deadlines. Others wait on a vote by elected officials.' },
  { lead: 'Trustees must meet before the request deadline.', body: 'Trustees need a public vote to request a different intervention.' },
  { lead: '' },
]
const end = sessionMilestones[sessionMilestones.length - 1]
const sessionEnd = sessionMilestones[sessionMilestones.length - 2]
const petition = collisionTimeline.find(event => event.id === 'petitions')!
const request = collisionTimeline.find(event => event.id === 'trustees')!
const meeting = boardMeetings.find(event => event.date > request.date && event.kind === 'Regular voting meeting')!
const date = (value: string, year = false) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' as const } : {}), timeZone: 'UTC' })
const calendarTicks = [collisionTimeline[0], petition, collisionTimeline.find(event => event.id === 'inauguration')!, collisionTimeline[collisionTimeline.length - 1]]
const calendarLabels = [watchDisplay.election, watchDisplay.petitionTick, watchDisplay.inauguration, watchDisplay.order]
// The shared axis has a fixed range. Leaders attach full-size labels without changing that component.
const calendarScale = xScale([Date.parse(collisionTimeline[0].date), Date.parse(end.date)], [360, 1060])
const labelX = (i: number) => 240 + i * 256
const s = reactive({ arrive: OFF, calendar: ON, topics: OFF, civic: OFF, dock: OFF, closing: OFF, collapse: OFF, qr: OFF })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => { tl.to(s, { arrive: ON, duration: DUR.grow, ease: SETTLE }) },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { calendar: OFF, topics: ON, duration: DUR.color, ease: SETTLE })
    beat(1)
    tl.to(s, { topics: OFF, civic: ON, duration: DUR.color, ease: SETTLE })
    beat(2)
    // Move the date marks below the quote before it appears, then gather them into the QR footprint.
    tl.to(s, { dock: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { closing: ON, duration: DUR.card, ease: SETTLE })
    // Gather the existing date marks; the quote remains readable at the resting beat.
    tl.to(s, { collapse: ON, civic: OFF, duration: DUR.gather, ease: SETTLE })
    tl.to(s, { qr: ON, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`)
    beat(3)
  },
})
const ruleSource = { href: watchDisplay.rulesUrl, label: watchDisplay.rulesSource }
const constitutionSource = { href: watchDisplay.constitutionUrl, label: watchDisplay.constitution }
const sources = computed(() => clicks.value === 2
  ? [ruleSource, { href: meeting.source, label: watchDisplay.boardSource }]
  : clicks.value === 1
    ? [ruleSource, constitutionSource, { href: watchDisplay.legislatureUrl, label: watchDisplay.legislature }]
    : [ruleSource, constitutionSource, { href: watchDisplay.calendarUrl, label: watchDisplay.calendarSource }])
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- Reuse the collision axis at its natural text size; the session endpoint fills the adjoining space. -->
      <g transform="translate(-680 -40)" :style="{ opacity: s.arrive * s.calendar }" aria-hidden="true">
        <CollisionTimeline :domain-end="end.date" :ticks="calendarTicks" :position="Date.parse(end.date)" :governor-progress="ON" />
        <text class="od-stage-note" x="1040" y="574">{{ watchDisplay.districtGloss }}</text>
      </g>
      <g :style="{ opacity: s.arrive * s.calendar }" aria-hidden="true">
        <path v-for="(event, i) in calendarTicks" :key="event.id" class="label-leader"
          :d="`M ${labelX(i)} ${i % 2 ? 286 : 260} L ${calendarScale(Date.parse(event.date))} 282`" />
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">{{ watchCount }} pending decisions will settle what changes.</h2>
      <div class="calendar-labels" :style="{ opacity: s.arrive * s.calendar }" :aria-hidden="clicks !== 0">
        <div v-for="(event, i) in calendarTicks" :key="event.id">
          <strong>{{ date(event.date) }}</strong><span>{{ calendarLabels[i] }}</span>
        </div>
      </div>
      <div class="session" :style="{ opacity: s.arrive * s.calendar }" :aria-hidden="clicks !== 0">
        <div class="window">{{ watchDisplay.window }} {{ date(end.date, true) }}</div>
        <div class="milestone"><strong>{{ date(sessionEnd.date) }}</strong><span>{{ watchDisplay.sessionEnd }}</span></div>
        <div class="milestone"><strong>{{ date(end.date) }}</strong><span>{{ watchDisplay.governorAction }}</span></div>
      </div>
      <div class="topics" :style="{ opacity: s.topics }" :aria-hidden="clicks !== 1">
        <div v-for="(decision, i) in decisionsToWatch" :key="decision.id" class="topic">
          <span class="tick" />
          <span class="tx-tag is-pending">{{ watchDisplay.pending }}</span>
          <strong>{{ watchLabels[i].name }}</strong>
          <span class="actor">{{ watchLabels[i].actor }}</span>
          <span class="detail">{{ watchLabels[i].detail }}</span>
        </div>
        <span class="undated">{{ watchDisplay.calendar }}</span>
      </div>
      <div class="civic" :style="{ opacity: s.civic, transform: s.dock === OFF && s.collapse === OFF ? 'none' : `translateY(calc(${s.dock * (ON - s.collapse) * 24} * var(--sh))) scale(${ON - s.collapse})` }" :aria-hidden="clicks !== 2">
        <div class="deadline"><strong>{{ date(petition.date) }}</strong><span>{{ watchDisplay.petition }}</span><span class="tx-tag is-pending">{{ watchDisplay.pending }}</span></div>
        <div class="deadline"><strong>{{ date(request.date) }}</strong><span>{{ watchDisplay.request }}</span><span class="tx-tag is-pending">{{ watchDisplay.pending }}</span></div>
        <div class="deadline"><strong>{{ date(meeting.date) }}</strong><span>{{ watchDisplay.meeting }}</span><span class="timing">{{ watchDisplay.timing }}</span></div>
        <div class="collection" :style="{ opacity: DIM }">{{ watchDisplay.collection }}: {{ date(petitionProcessDates[0].date) }}</div>
      </div>
      <div class="closing" :style="{ opacity: s.closing }" :aria-hidden="clicks !== 3">{{ watchDisplay.closing }}</div>
      <div class="sources" :style="{ opacity: s.qr }" :aria-hidden="s.qr === OFF">
        <OdQrCard :url="sourcesPage.url ?? undefined" :label="watchDisplay.sources" :sublabel="watchDisplay.placeholder" :aria-label="sourcesPage.needed" />
        <span v-if="!sourcesPage.url" class="qr-placeholder">{{ watchDisplay.flag }}</span>
      </div>
      <div v-if="clicks !== 3" class="source-links">
        <StoryLink v-for="source in sources" :key="source.href" :href="source.href" :label="source.label" />
      </div>
    </template>
    <template #card><StoryCard v-if="copy.lead" anchor="left" hue="slate" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
/* Local geometry for the calendar, undated decision rail and closing gather. */
:deep(.collision-timeline > text), :deep(.collision-timeline .od-stage-label) { display: none; }
.label-leader { stroke: var(--od-border); stroke-width: var(--tx-hairline); fill: none; }
.calendar-labels { position: absolute; left: var(--tx-margin-x); top: calc(16 * var(--sh)); width: calc(53.333333 * var(--sw)); display: grid; grid-template-columns: repeat(4, 1fr); }
.calendar-labels > div { text-align: center; display: flex; flex-direction: column; gap: var(--tx-copy-gap); padding: 0 calc(0.6 * var(--sw)); }
.calendar-labels strong { font-size: var(--tx-body-size); }
.calendar-labels span { font-size: var(--tx-small-size); line-height: var(--tx-label-leading); }
.session { position: absolute; top: calc(26 * var(--sh)); left: calc(62 * var(--sw)); right: var(--tx-margin-x); padding: calc(2 * var(--sw)); border: var(--tx-hairline) solid var(--od-border); border-radius: var(--tx-radius-card); }
.window { font-size: var(--tx-small-size); color: var(--od-text-muted); margin-bottom: calc(2 * var(--sh)); }
.milestone { display: flex; flex-direction: column; gap: var(--tx-copy-gap); padding: calc(1.5 * var(--sh)) 0; border-top: var(--tx-hairline) solid var(--od-border); font-size: var(--tx-body-size); }
.milestone strong { font-size: calc(2.2 * var(--sw)); }
.topics { position: absolute; top: calc(28 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(5, 1fr); border-top: var(--tx-hairline) dashed var(--od-amber); gap: calc(1.3 * var(--sw)); }
.topic { position: relative; padding-top: calc(3 * var(--sh)); display: flex; flex-direction: column; align-items: flex-start; gap: calc(1.7 * var(--sh)); }
.tick { position: absolute; top: calc(-1 * var(--sh)); left: var(--tx-zero); height: calc(3 * var(--sh)); border-left: var(--tx-hairline) dashed var(--od-amber); }
.topic strong { font-size: var(--tx-body-size); font-weight: var(--tx-lead-weight); line-height: var(--tx-label-leading); }
.actor { font-size: var(--tx-small-size); line-height: var(--tx-body-leading); }
.detail { font-size: var(--tx-small-size); color: var(--od-text-muted); line-height: var(--tx-body-leading); }
.undated { grid-column: 1 / -1; margin-top: calc(3 * var(--sh)); font-size: var(--tx-small-size); color: var(--od-text-muted); }
.civic { position: absolute; top: calc(28 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(2 * var(--sw)); transform-origin: 90% 50%; }
.deadline { border-top: var(--tx-hairline) solid var(--od-border); padding-top: calc(2 * var(--sh)); display: flex; flex-direction: column; align-items: flex-start; gap: calc(2 * var(--sh)); font-size: var(--tx-body-size); }
.deadline strong { font-size: calc(3 * var(--sw)); font-weight: var(--tx-lead-weight); }
.timing { font-size: var(--tx-small-size); color: var(--od-amber); }
.collection { grid-column: 1 / -1; padding-top: calc(3 * var(--sh)); font-size: var(--tx-small-size); }
.closing { position: absolute; top: calc(24 * var(--sh)); left: var(--tx-margin-x); right: calc(27 * var(--sw)); font-family: var(--od-font-serif); font-size: calc(2.4 * var(--sw)); line-height: 1.4; }
.sources { position: absolute; top: calc(30 * var(--sh)); right: var(--tx-margin-x); width: calc(17 * var(--sw)); }
.sources :deep(.od-qr-frame) { width: calc(15 * var(--sw)); padding: calc(1 * var(--sw)); border-radius: var(--tx-radius-card); }
.sources :deep(.od-qr-label), .sources :deep(.od-qr-sublabel) { font-size: var(--tx-small-size); text-transform: none; letter-spacing: var(--tx-body-tracking); }
.sources :deep(.od-qr-card) { gap: calc(1.2 * var(--sh)); }
.qr-placeholder { position: absolute; top: calc(6 * var(--sh)); left: calc(2.5 * var(--sw)); right: calc(2.5 * var(--sw)); color: var(--od-canvas); font-size: var(--tx-body-size); text-align: center; }
.source-links { position: absolute; right: var(--tx-margin-x); bottom: var(--tx-rail-bottom); display: flex; gap: calc(1.5 * var(--sw)); }
.source-links :deep(.od-story-link) { position: static; }
</style>
