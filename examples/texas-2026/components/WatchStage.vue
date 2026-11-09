<script setup lang="ts">
import { computed, reactive } from 'vue'
import { DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { OFF, ON } from './design'
import { boardMeetings, collisionTimeline, decisionsToWatch, watchCount, watchDisplay, watchLabels } from '../data/14-watch'

// Two beats: the decisions and who makes them, then the December dates.
const COPY = [
  { lead: 'Each decision names who makes it.', body: 'Some have legal deadlines. Others wait on a vote by elected officials.' },
  { lead: 'Trustees must meet before the request deadline.', body: 'Trustees need a public vote to request a different intervention.' },
]
const petition = collisionTimeline.find(event => event.id === 'petitions')!
const request = collisionTimeline.find(event => event.id === 'trustees')!
const meeting = boardMeetings.find(event => event.date > request.date && event.kind === 'Regular voting meeting')!
const date = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
// Beat 0's resting state is the decisions grid, so it starts visible.
const s = reactive({ topics: ON, civic: OFF })
const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { topics: OFF, civic: ON, duration: DUR.color, ease: SETTLE })
    beat(1)
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
      <div class="civic" :style="{ opacity: s.civic }" :aria-hidden="clicks !== 1">
        <div class="deadline"><strong>{{ date(petition.date) }}</strong><span>{{ watchDisplay.petition }}</span><span class="tx-tag is-pending">{{ watchDisplay.pending }}</span></div>
        <div class="deadline"><strong>{{ date(request.date) }}</strong><span>{{ watchDisplay.request }}</span><span class="tx-tag is-pending">{{ watchDisplay.pending }}</span></div>
        <div class="deadline"><strong>{{ date(meeting.date) }}</strong><span>{{ watchDisplay.meeting }}</span><span class="timing">{{ watchDisplay.timing }}</span></div>
      </div>
      <div class="source-links">
        <StoryLink v-for="source in sources" :key="source.href" :href="source.href" :label="source.label" />
      </div>
    </template>
    <template #card><StoryCard anchor="left" hue="slate" :lead="copy.lead" :body="copy.body" /></template>
  </StoryStage>
</template>

<style scoped>
/* Local geometry for the decision rail, and the December dates. */
.topics { position: absolute; top: calc(28 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(5, 1fr); border-top: var(--tx-hairline) dashed var(--od-amber); gap: calc(1.3 * var(--sw)); }
.topic { position: relative; padding-top: calc(3 * var(--sh)); display: flex; flex-direction: column; align-items: flex-start; gap: calc(1.7 * var(--sh)); }
.tick { position: absolute; top: calc(-1 * var(--sh)); left: var(--tx-zero); height: calc(3 * var(--sh)); border-left: var(--tx-hairline) dashed var(--od-amber); }
.topic strong { font-size: var(--tx-body-size); font-weight: var(--tx-lead-weight); line-height: var(--tx-label-leading); }
.actor { font-size: var(--tx-small-size); line-height: var(--tx-body-leading); }
.civic { position: absolute; top: calc(28 * var(--sh)); left: var(--tx-margin-x); right: var(--tx-margin-x); display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(2 * var(--sw)); }
.deadline { border-top: var(--tx-hairline) solid var(--od-border); padding-top: calc(2 * var(--sh)); display: flex; flex-direction: column; align-items: flex-start; gap: calc(2 * var(--sh)); font-size: var(--tx-body-size); }
.deadline strong { font-size: calc(3 * var(--sw)); font-weight: var(--tx-lead-weight); }
.timing { font-size: var(--tx-small-size); color: var(--od-amber); }
.source-links { position: absolute; right: var(--tx-margin-x); bottom: var(--tx-rail-bottom); display: flex; gap: calc(1.5 * var(--sw)); }
.source-links :deep(.od-story-link) { position: static; }
</style>
