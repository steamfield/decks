<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DUR, DRAW, SETTLE, useStage, type TickState } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import CollisionTimeline from './CollisionTimeline.vue'
import { collisionTimeline, reportedAppealEstimate, timelineDisplay } from '../data/07-collision-timeline'

// The third speaking beat uses the reported response estimate. Publication is
// a separate event, qualified in its card and notes rather than conflated.
const events = collisionTimeline.map(event => event.id === 'ratings'
  ? { ...event, date: reportedAppealEstimate.date, label: timelineDisplay.appeal, status: reportedAppealEstimate.status }
  : event)
const ratings = collisionTimeline.find(event => event.id === 'ratings')!
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const COPY = [
  { lead: 'Voters have elected the next governor.', body: 'The incumbent remains in office until inauguration.' },
  { lead: 'Validated petitions go to the commissioner.', body: 'The superintendent submits petitions after checking their validity.' },
  { lead: 'The district expects an appeal response.', body: `The response date is reported; final ratings are scheduled for ${dateLabel(ratings.date)}.` },
  { lead: 'Trustees can request an alternative action.', body: 'The request needs approval at a public board meeting.' },
  { lead: 'The new governor takes office.', body: 'The commissioner’s appointment remains unresolved.' },
  { lead: `${timelineDisplay.question}`, body: 'The deadline applies after a valid petition; implementation may follow in the next school year.' },
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
  if (current.value.id === 'inauguration') return { href: timelineDisplay.inaugurationUrl, label: timelineDisplay.inaugurationSource }
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
      <h2 class="od-story-head">The district’s {{ timelineDisplay.deadlineMonth }} deadlines come before the new governor takes office.</h2>
      <div class="event-detail">
        <span class="sr-only">{{ current.status === 'reported' ? 'Approximately ' : '' }}{{ dateLabel(current.date) }}, {{ current.date.slice(0, 4) }}.</span>
        <div class="event-name">{{ current.id === 'order' ? timelineDisplay.order : current.label }}</div>
        <div class="actor">{{ current.actor }}</div>
        <span class="tx-tag" :class="current.status === 'reported' ? 'is-reported' : 'is-pending'">
          {{ current.status === 'reported' ? timelineDisplay.reported : current.id === 'election' ? timelineDisplay.electionStatus : timelineDisplay.pending }}
        </span>
      </div>
      <StoryLink :href="source.href" :label="source.label" />
    </template>
    <template #card><StoryCard anchor="left" hue="amber" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
.event-detail { position: absolute; left: calc(47.916667 * var(--sw)); right: var(--tx-margin-x); top: calc(75 * var(--sh)); font-size: var(--tx-body-size); line-height: var(--tx-body-leading); }
.event-name { color: var(--od-text); font-weight: var(--tx-lead-weight); }
.actor { color: var(--od-text-muted); margin-bottom: var(--tx-copy-gap); }
</style>
