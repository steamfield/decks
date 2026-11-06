<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DUR, DRAW, SETTLE, useStage, type TickState } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import CollisionTimeline from './CollisionTimeline.vue'
import { collisionTimeline, reportedAppealEstimate, timelineDisplay, timelineStatus } from '../data/07-collision-timeline'

// The third speaking beat uses the reported response estimate. Publication is
// a separate event, qualified in its card and notes rather than conflated.
const events = collisionTimeline.map(event => event.id === 'ratings'
  ? { ...event, date: reportedAppealEstimate.date, label: timelineDisplay.appeal, status: reportedAppealEstimate.status }
  : event)
const ratings = collisionTimeline.find(event => event.id === 'ratings')!
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const COPY = [
  { lead: 'The incumbent can still nominate a commissioner.', body: 'The governor-elect takes office at inauguration.' },
  { lead: "Petitions are due before the governor's inauguration.", body: 'The superintendent must validate signatures before submitting the petitions.' },
  { lead: 'Successful appeals could prevent board replacement.', body: `Final ratings are scheduled for ${dateLabel(ratings.date)}.` },
  { lead: 'Trustees can request closure or appointed managers.', body: 'The request needs approval at a public board meeting.' },
  { lead: 'The new governor can nominate a commissioner.', body: 'The nominee needs Senate confirmation.' },
  { lead: `${timelineDisplay.question}`, body: 'After a valid petition, the commissioner must order board replacement or campus closure.' },
]
const state = reactive<TickState[]>(events.map((_, i) => ({ ink: i === 0 ? ON : OFF, lift: OFF })))
const s = reactive({ position: Date.parse(events[0].date), governor: OFF })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    for (let i = 1; i < events.length; i++) {
      const at = tl.duration()
      tl.to(s, { position: Date.parse(events[i].date), duration: DUR.scale, ease: DRAW }, at)
      tl.to(state[i - 1], { ink: DIM, duration: DUR.color, ease: SETTLE }, at)
      tl.to(state[i], { ink: ON, duration: DUR.draw, ease: DRAW }, at + DUR.scale - DUR.draw)
      if (events[i].id === 'inauguration') tl.to(s, { governor: ON, duration: DUR.color, ease: SETTLE }, at + DUR.scale - DUR.color)
      beat(i)
    }
  },
})
const current = computed(() => events[Math.min(clicks.value, events.length - 1)])
const source = computed(() => {
  if (current.value.id === 'election') return { href: timelineDisplay.electionUrl, label: timelineDisplay.electionSource }
  if (current.value.id === 'inauguration') return { href: timelineDisplay.inaugurationUrl, label: timelineDisplay.constitutionSource }
  if (current.value.status === 'reported') return { href: timelineDisplay.reportUrl, label: timelineDisplay.estimateSource }
  return { href: timelineDisplay.ruleUrl, label: timelineDisplay.deadlineSource }
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <CollisionTimeline :domain-end="events[events.length - 1].date" :ticks="events" :state="state"
        :position="s.position" :governor-progress="s.governor" />
    </template>
    <template #overlay>
      <h2 class="od-story-head">{{ timelineDisplay.deadlineMonth }} deadlines come before inauguration.</h2>
      <div class="sr-only">
        {{ timelineDisplay.commissioner }}: {{ timelineDisplay.commissionerName }}.
        {{ current.status === 'reported' ? 'Approximately ' : '' }}{{ dateLabel(current.date) }}, {{ current.date.slice(0, 4) }}.
        {{ current.label }}. {{ current.actor }}.
        {{ current.status === 'reported' ? timelineDisplay.reported : timelineStatus[current.id] ?? timelineDisplay.pending }}.
      </div>
      <div class="timeline-sources">
        <StoryLink :href="source.href" :label="source.label" />
        <StoryLink v-if="current.status === 'reported'" :href="timelineDisplay.appealsUrl" :label="timelineDisplay.appealsSource" />
      </div>
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.timeline-sources { position: absolute; right: var(--tx-margin-x); bottom: var(--tx-rail-bottom); display: flex; gap: var(--tx-byline-gap); }
.timeline-sources :deep(.od-story-link) { position: static; }
</style>
