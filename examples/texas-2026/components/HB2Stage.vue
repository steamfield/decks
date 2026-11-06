<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { DRAW, DUR, SETTLE, useStage, type GrowHandle } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import SeatArc from './SeatArc.vue'
import { hb2, hb2SenateVote, aisdBudget, recapture, hb2Labels, sameSession } from '../data/11-hb2'

const billions = (hb2.additionalFunding / 1e9).toFixed(1)
const gap = `$${aisdBudget.preReductionGap / 1e6}M`
const returned = `$${recapture.displayMillions}M`
const shortYear = (year: string) => year.slice(0, 4) + '–' + year.slice(-2)
const COPY = [
  { lead: `${hb2.bill} added $${billions}B for public schools.`, body: `It pays for teacher pay and special education in the ${hb2.period.replace('state fiscal biennium', 'state budget')}.` },
  { lead: `Every senator voted yes, ${hb2SenateVote.yes} to ${hb2SenateVote.no}.`, body: `That session also passed vouchers. ${sameSession.governor2025} and ${sameSession.ltGovernor2025}, who set its agenda, have now lost.` },
  { lead: `${hb2Labels.district} still had to cut its budget.`, body: `It faced a ${gap} gap before ${shortYear(aisdBudget.schoolYear)} cuts and budgeted ${returned} in property taxes for the state in ${shortYear(recapture.schoolYear)}.` },
]
const amount = ref<GrowHandle | null>(null)
// Local compact position retains the vote above the final budget figures.
const VOTE = { x: 1330, y: 660, compactY: 400, compactScale: 0.5 }
const s = reactive({ funding: ON, vote: OFF, seats: OFF, budget: OFF, voteY: VOTE.y, voteScale: ON })
// TODO: Split the unanimous vote into sourced party groups using democrat()
// and republican() once SeatArc accepts group.color. The vote module has no
// party counts; the later election's chamber split cannot describe this vote.
const groups = [{ label: hb2Labels.senate, seats: hb2SenateVote.yes, filled: hb2SenateVote.yes }]
const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: tl => amount.value?.addGrow(tl),
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { funding: DIM, vote: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { seats: ON, duration: DUR.scale, ease: DRAW }, '<')
    beat(1)
    tl.to(s, { vote: DIM, voteY: VOTE.compactY, voteScale: VOTE.compactScale, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { budget: ON, duration: DUR.color, ease: SETTLE }, '<')
    beat(2)
  },
})
const source = computed(() => [
  { href: 'https://www.senate.texas.gov/news.php?id=20250523a', label: hb2Labels.fundingSource },
  { href: 'https://capitol.texas.gov/tlodocs/89R/billtext/html/HB00002F.htm', label: hb2Labels.voteSource },
  { href: 'https://www.austinisd.org/budget/process', label: hb2Labels.budgetSource },
][clicks.value])
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :transform="`translate(${VOTE.x} ${s.voteY})`" :style="{ opacity: s.vote }">
        <g :transform="`scale(${s.voteScale})`"><SeatArc :groups="groups" :progress="s.seats" /></g>
        <text class="od-stage-name" x="0" y="50" text-anchor="middle">{{ hb2Labels.senate }}<tspan v-if="clicks < beats - 1">: {{ hb2SenateVote.yes }} yes · {{ hb2SenateVote.no }} no</tspan></text>
      </g>
    </template>
    <template #overlay>
      <h2 class="od-story-head">Both parties already vote for school funding.</h2>
      <div class="funding" :style="{ opacity: s.funding }">
        <InkNumber ref="amount" :value="billions" prefix="$" suffix="B" hue="slate" :label="`${hb2Labels.state} school funding added`" />
        <div class="period">{{ hb2.period.replace('state fiscal biennium', 'state budget') }}</div>
      </div>
      <div class="budget" :style="{ opacity: s.budget }">
        <div class="budget-item">
          <div class="figure">{{ gap }}</div>
          <div class="label">Gap before reductions</div>
          <div class="period">{{ hb2Labels.district }} · {{ shortYear(aisdBudget.schoolYear) }}</div>
        </div>
        <div class="budget-item">
          <div class="figure">{{ returned }}</div>
          <div class="label">Property taxes budgeted for return</div>
          <div class="period">{{ shortYear(recapture.schoolYear) }} budget estimate</div>
          <span v-if="recapture.actualPaymentStatus === 'pending'" class="tx-tag is-pending">Actual payment pending</span>
        </div>
      </div>
      <StoryLink :href="source.href" :label="source.label" />
      <StoryLink v-if="clicks === beats - 1" class="gap-source" href="https://www.austinisd.org/announcements/2026/06/23/superintendents-update-approved-2026-27-budget-en-espanol" label="Budget reductions" />
    </template>
    <template #card>
      <StoryCard anchor="left" :hue="clicks === beats - 1 ? 'amber' : 'slate'" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* Local figure placement spans the frame; shared design tokens own type and surfaces. */
.funding { position: absolute; left: var(--tx-margin-x); top: calc(35 * var(--sh)); }
.period { margin-top: var(--tx-copy-gap); font-size: var(--tx-small-size); color: var(--od-text-muted); }
.budget { position: absolute; left: calc(44 * var(--sw)); right: var(--tx-margin-x); top: calc(47 * var(--sh)); display: grid; grid-template-columns: 1fr 1.25fr; gap: calc(2 * var(--sw)); }
.budget-item { border-top: var(--tx-hairline) solid var(--od-amber); padding-top: var(--tx-card-pad); }
.figure { font-size: calc(4.5 * var(--sw)); font-weight: var(--tx-lead-weight); font-variant-numeric: tabular-nums; line-height: var(--tx-figure-leading); color: var(--od-amber); }
.label { font-size: var(--tx-body-size); line-height: var(--tx-label-leading); margin-top: var(--tx-copy-gap); }
.tx-tag { margin-top: var(--tx-byline-gap); }
.gap-source { right: calc(23 * var(--sw)); }
</style>
