<script setup lang="ts">
/**
 * Slide 5a: a dataset is a YAML file, the pipeline is six stages and one
 * gate, and agents now write most of the files.
 *
 * Four beats. On entry the YAML block and the six stage boxes settle in
 * (enter motion, outside the beat timeline, same pattern as the business
 * model slide). The first click runs one dataset through the pipeline: a
 * pulse slides stage to stage behind the boxes, one eased hop per stage with
 * a breath between, and the gate holds it amber before letting it through.
 * The five boxes either side of the gate then drop back to slate, so the beat
 * ends on the one box the card is about. The second draws the cumulative
 * count of datasets added, week by week from git, with the peak week chipped.
 * The third clears the chart and hangs two new nodes off the row, Request and
 * Agent, feeding Fetch through links dashed in amber because neither exists
 * yet. The six stages stay where they are: the roadmap is two steps in front
 * of the pipeline, not a different diagram.
 *
 * The velocity curve stands where slide 4's last card left off ("the first
 * 10 took weeks, the last 100 took days"): this is that claim, measured.
 */
import { computed, reactive } from 'vue'
import {
  clamp01,
  DRAW,
  DUR,
  FILTER_IDS,
  filterUrl,
  ink,
  SETTLE,
  stagger,
  STROKE,
  TRACE,
  useStage,
  xScale,
  yScale,
} from 'slidev-addon-decks/story'
import {
  CUMULATIVE,
  DATASET_YAML_URL,
  DAYS_TO_FIRST,
  DEPLOY_MINUTES,
  LAST_FOUR_WEEKS,
  PEAK_WEEK,
  STAGES,
  YAML_LINES,
  daysSince,
} from '../data/pipeline-velocity'

/* ── Geometry, in stage viewBox units ── */
const ROW = { y: 300, h: 72, w: 214, x0: 110, x1: 1810 }
const GAP = (ROW.x1 - ROW.x0 - ROW.w * STAGES.length) / (STAGES.length - 1)
const stages = STAGES.map((stage, i) => ({
  ...stage,
  x: ROW.x0 + i * (ROW.w + GAP),
  cx: ROW.x0 + i * (ROW.w + GAP) + ROW.w / 2,
}))
const RULE_Y = ROW.y + ROW.h / 2
const GATE_INDEX = STAGES.findIndex((s) => s.id === 'gate')

const CODE = { x: 1240, y: 440, width: 570, height: 470 }

/*
 * The last beat: two nodes that do not exist yet, hung off the row below the
 * stages and wired into Fetch. Same box geometry as a stage, so they read as
 * two more of the same thing rather than as a second diagram.
 */
const ASK = [
  { id: 'request', label: 'Request', note: 'filed by anyone' },
  { id: 'agent', label: 'Agent', note: 'authors the YAML' },
]
const ASK_Y = 560
const ask = ASK.map((step, i) => ({
  ...step,
  x: ROW.x0 + i * (ROW.w + GAP),
  cx: ROW.x0 + i * (ROW.w + GAP) + ROW.w / 2,
}))
const ASK_MID_Y = (ROW.y + ROW.h + ASK_Y) / 2
/**
 * Request to Agent, then Agent up and back into Fetch. The riser enters Fetch
 * left of centre, because dead centre runs it straight through the stage's
 * own note line.
 */
const FEED_X = ROW.x0 + 20
const ASK_LINK = `M ${ask[0].x + ROW.w} ${ASK_Y + ROW.h / 2} H ${ask[1].x}`
const ASK_FEED = `M ${ask[1].cx} ${ASK_Y} V ${ASK_MID_Y} H ${FEED_X} V ${ROW.y + ROW.h}`
const ASK_TAG = { x: (FEED_X + ask[1].cx) / 2, y: ASK_MID_Y - 12 }
const WIRE_INK = ink('amber', 3)

/*
 * Velocity curve: days since the repo began on x, datasets added on y. It
 * takes the right half once the YAML block has left, clear of the prose card
 * at bottom left.
 */
const CURVE = { x: [880, 1780] as [number, number], y: [950, 480] as [number, number] }
/** The axis starts at the first dataset; the three empty weeks before it are the card's line. */
const X_DOMAIN: [number, number] = [DAYS_TO_FIRST, CUMULATIVE[CUMULATIVE.length - 1].x]
/** The series the axis shows: from the first dataset on, so nothing draws left of the origin. */
const SERIES = [{ x: DAYS_TO_FIRST, y: 0 }, ...CUMULATIVE.filter((p) => p.x > DAYS_TO_FIRST)]
const Y_DOMAIN: [number, number] = [0, 1100]
const sx = xScale(X_DOMAIN, CURVE.x)
const sy = yScale(Y_DOMAIN, CURVE.y)

const PEAK_DAY = daysSince(PEAK_WEEK.week) + 7
const peakPoint = CUMULATIVE.find((p) => p.x === PEAK_DAY) ?? CUMULATIVE[CUMULATIVE.length - 1]
const peakMark = { x: sx(peakPoint.x), y: sy(peakPoint.y) }

const STAGE_INK = ink('slate', 2)
const LIVE_INK = ink('cyan', 3)
const GATE_HOLD = ink('amber', 3)
const GATE_PASS = ink('emerald', 3)
const RULE_INK = ink('slate', 1)
/** Where the five non-gate boxes land once the run is over. */
const DIM_INK = ink('slate', 1)

const COPY = [
  {
    lead: 'A dataset is a YAML file in git.',
    body: `Source, schema, transforms, checks, refresh schedule, reviewed like code. Push to main, live in about ${DEPLOY_MINUTES} minutes.`,
  },
  {
    lead: 'One gate decides if the new file ships.',
    body: 'Every check runs against the staged file. A failure leaves yesterday’s data serving and tells us why.',
  },
  {
    lead: `Agents wrote ${PEAK_WEEK.count} of them in one week.`,
    body: `The first dataset landed ${Math.round(DAYS_TO_FIRST / 7)} weeks in. Claude Code agents wrote most of the ${LAST_FOUR_WEEKS} added in the last four weeks.`,
  },
  {
    lead: 'Two steps still need a person.',
    body: 'Someone starts the agent and pushes its YAML. Wire those two links and a request lands unattended.',
  },
]

/** Beat state, every field 0..1 except `pulse`, which is a stage index. */
const s = reactive({
  frame: 0,
  boxes: 0,
  pulse: 0,
  gate: 0,
  dim: 0,
  hide: 0,
  chart: 0,
  curve: 0,
  peak: 0,
  ask: 0,
})

/* ── Enter motion: the YAML block and the stage row settle in ── */
const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: 1, duration: DUR.grow, ease: DRAW })
    tl.to(s, { boxes: 1, duration: DUR.scale, ease: SETTLE }, `-=${DUR.card}`)
  },
  beats: (tl, beat) => {
    beat(0)

    // One dataset runs the pipeline: one eased hop per stage, a breath at each
    // box, and a longer hold at the gate while it decides (amber) before it
    // lets the pulse through (emerald). Sequential appends, so the relative
    // positions here are meant to cascade.
    for (let i = 1; i < STAGES.length; i++) {
      tl.to(s, { pulse: i, duration: DUR.card, ease: TRACE }, `+=${DUR.opacity}`)
      if (i === GATE_INDEX)
        tl.to(s, { gate: 1, duration: DUR.color, ease: SETTLE }, `+=${DUR.eraseHold}`)
    }
    // The run is over: everything but the gate drops back to slate, so the
    // beat ends on the one box the card is about.
    tl.to(s, { dim: 1, duration: DUR.color, ease: SETTLE }, `+=${DUR.opacity}`)
    beat(1)

    // The YAML block leaves, the chart frame settles in where it was, then the
    // curve draws over it.
    tl.to(s, { hide: 1, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`)
    tl.to(s, { chart: 1, duration: DUR.grow, ease: SETTLE }, `-=${DUR.opacity}`)
    // The long one: the curve draws and both figures tick with its front.
    tl.to(s, { curve: 1, duration: DUR.bloom, ease: DRAW }, `-=${DUR.card}`)
    tl.to(s, { peak: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`)
    beat(2)

    // The chart leaves and the two missing nodes hang themselves off the
    // row. Linear master: each box and each wire carries its own cue, so an
    // eased master would only bunch them together at the end.
    tl.to(s, { chart: 0, peak: 0, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`)
    tl.to(s, { ask: 1, duration: DUR.gather, ease: 'none' }, `-=${DUR.opacity}`)
    beat(3)
  },
})

/** Each box rises on its own slice of the enter beat, left to right. */
const boxProgress = (i: number) => stagger(s.boxes, i, STAGES.length, 0.12)
const smooth = (t: number) => t * t * (3 - 2 * t)
/** Each roadmap box rises on its own cue, right to left, then its wire lands. */
const askProgress = (i: number) => smooth(clamp01((s.ask - (1 - i) * 0.18) / 0.42))
const askDy = (i: number) => 14 * (1 - askProgress(i))
const askWire = (i: number) => smooth(clamp01((s.ask - 0.4 - i * 0.18) / 0.42))
/**
 * A stage is lit once the pulse has arrived at it. Boolean on purpose: the
 * box's glow and border ease in over `--od-dur-card` in CSS, so the light
 * comes up as one smooth event when the pulse lands rather than tracking it.
 */
const arrived = (i: number) => (i === 0 ? s.pulse > 0 : s.pulse >= i - 0.01)
/**
 * The pulse travels edge to edge, not centre to centre: it is hidden under a
 * box either side, so a centre-to-centre tween would spend two thirds of its
 * time out of sight and the visible slide would be the fastest slice of the
 * ease. Mapping the hop onto the gap makes the whole eased hop visible.
 */
const PULSE_R = 10
const pulseX = computed(() => {
  const i = Math.floor(s.pulse)
  const f = s.pulse - i
  const a = stages[Math.min(i, stages.length - 1)]
  const b = stages[Math.min(i + 1, stages.length - 1)]
  if (a === b) return a.cx
  const from = a.x + ROW.w - PULSE_R
  const to = b.x + PULSE_R
  // Smoothstep on top of the tween's ease: over a 300ms hop the curve alone
  // reads as linear, so the slide leaves and lands more slowly than it travels.
  const eased = f * f * (3 - 2 * f)
  return from + (to - from) * eased
})
/** The pulse sits behind the boxes, so at rest (index 0) it is hidden under the first one. */
const pulseVisible = computed(() => s.pulse > 0)
/** Lit is what carries the glow: after the run, only the gate does. */
const lit = (i: number) => (i === GATE_INDEX ? arrived(i) : arrived(i) && s.dim < 0.5)
const stageInk = (i: number) => {
  if (i === GATE_INDEX && arrived(i)) return s.gate >= 0.5 ? GATE_PASS : GATE_HOLD
  if (s.dim >= 0.5) return DIM_INK
  return arrived(i) ? LIVE_INK : STAGE_INK
}

const xLabels = [
  { x: CURVE.x[0], text: 'first dataset, 3 weeks in', anchor: 'start' },
  { x: CURVE.x[1], text: 'Sep 2026', anchor: 'end' },
] as const

/** The peak chip sits up and left of its point, with a short leader down to it. */
const PEAK_CHIP = { right: peakMark.x - 30, cy: peakMark.y - 46 }
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <!-- Pipeline: six stages on one rule -->
        <line
          :x1="stages[0].cx"
          :x2="stages[stages.length - 1].cx"
          :y1="RULE_Y"
          :y2="RULE_Y"
          :stroke="RULE_INK"
          :stroke-width="STROKE.rule"
          :style="{ opacity: String(s.boxes) }"
        />
        <!-- The stretch of rule the pulse has covered, and the pulse itself.
             Both sit under the boxes, so the pulse slips behind each stage
             and out the other side. -->
        <g v-if="pulseVisible" :style="{ opacity: String(1 - s.dim) }">
          <line
            :x1="stages[0].cx"
            :x2="pulseX"
            :y1="RULE_Y"
            :y2="RULE_Y"
            :stroke="LIVE_INK"
            :stroke-width="STROKE.rule"
            stroke-opacity="0.7"
          />
          <circle
            :cx="pulseX"
            :cy="RULE_Y"
            r="10"
            :fill="LIVE_INK"
            :filter="filterUrl(FILTER_IDS.glow)"
          />
        </g>
        <g
          v-for="(stage, i) in stages"
          :key="stage.id"
          class="od-pipe-stage"
          :style="{
            color: stageInk(i),
            opacity: String(boxProgress(i)),
            transform: `translate(0, ${(1 - boxProgress(i)) * 22}px)`,
          }"
        >
          <!-- The lit surface: the house card glow, eased in when the pulse lands. -->
          <InkCardRect
            :x="stage.x"
            :y="ROW.y"
            :width="ROW.w"
            :height="ROW.h"
            :radius="10"
            surface="var(--od-canvas)"
            :glow-cx="stage.glow.cx"
            :glow-cy="stage.glow.cy"
            :lit="lit(i)"
            :stroke-opacity="lit(i) ? 0.75 : 0.45"
            :dash="i === GATE_INDEX ? '8 8' : undefined"
            :glow-filter="lit(i)"
          />
          <text class="od-pipe-name" :x="stage.cx" :y="ROW.y + 44" text-anchor="middle">
            {{ stage.label }}
          </text>
          <text class="od-pipe-note" :x="stage.cx" :y="ROW.y + ROW.h + 30" text-anchor="middle">
            {{ stage.note }}
          </text>
        </g>

        <!-- The roadmap: two nodes that do not exist yet, feeding Fetch.
             Both wires are dashed amber and tagged, so nothing here reads as
             something we already ship. -->
        <g v-if="s.ask > 0">
          <path
            :d="ASK_LINK"
            fill="none"
            :stroke="WIRE_INK"
            :stroke-width="STROKE.faint"
            stroke-dasharray="8 8"
            stroke-linecap="round"
            :style="{ opacity: String(askWire(0)) }"
          />
          <path
            :d="ASK_FEED"
            fill="none"
            :stroke="WIRE_INK"
            :stroke-width="STROKE.faint"
            stroke-dasharray="8 8"
            stroke-linecap="round"
            :style="{ opacity: String(askWire(1)) }"
          />
          <text
            class="od-pipe-tag"
            :x="ASK_TAG.x"
            :y="ASK_TAG.y"
            text-anchor="middle"
            :style="{ fill: WIRE_INK, opacity: String(askWire(1)) }"
          >
            roadmap
          </text>
          <g
            v-for="(step, i) in ask"
            :key="step.id"
            :style="{
              color: WIRE_INK,
              opacity: String(askProgress(i)),
              transform: `translate(0, ${askDy(i)}px)`,
            }"
          >
            <InkCardRect
              :x="step.x"
              :y="ASK_Y"
              :width="ROW.w"
              :height="ROW.h"
              :radius="10"
              surface="var(--od-canvas)"
              :glow-cx="0.5"
              :glow-opacity="0.1"
              :stroke-opacity="0.7"
              dash="8 8"
            />
            <text class="od-pipe-name" :x="step.cx" :y="ASK_Y + 44" text-anchor="middle">
              {{ step.label }}
            </text>
            <text class="od-pipe-note" :x="step.cx" :y="ASK_Y + ROW.h + 30" text-anchor="middle">
              {{ step.note }}
            </text>
          </g>
        </g>

        <!-- Velocity: datasets added, cumulative, from git. The frame settles
             in from below before the line draws. -->
        <g
          :style="{
            opacity: String(s.chart),
            transform: `translate(0, ${(1 - s.chart) * 18}px)`,
          }"
        >
          <g>
            <line
              :x1="CURVE.x[0]"
              :x2="CURVE.x[1]"
              :y1="CURVE.y[0]"
              :y2="CURVE.y[0]"
              :stroke="RULE_INK"
              :stroke-width="STROKE.rule"
            />
            <text
              v-for="label in xLabels"
              :key="label.text"
              class="od-pipe-axis"
              :x="label.x"
              :y="CURVE.y[0] + 34"
              :text-anchor="label.anchor"
            >
              {{ label.text }}
            </text>
          </g>
          <line
            :x1="PEAK_CHIP.right - 6"
            :y1="PEAK_CHIP.cy + 16"
            :x2="peakMark.x - 4"
            :y2="peakMark.y - 6"
            :stroke="RULE_INK"
            :stroke-width="STROKE.rule"
            stroke-linecap="round"
            :style="{ opacity: String(s.peak) }"
          />
          <InkLine
            :series="SERIES"
            :x-domain="X_DOMAIN"
            :y-domain="Y_DOMAIN"
            :x-range="CURVE.x"
            :y-range="CURVE.y"
            interp="step"
            hue="cyan"
            :step="3"
            :reveal="s.curve"
            seed="datasets-added"
          />
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Infrastructure as code, written by agents.</h2>

      <div
        class="od-pipe-code"
        :style="{
          opacity: String(1 - s.hide),
          transform: `translateY(${s.hide * -14}px)`,
          visibility: s.hide >= 1 ? 'hidden' : 'visible',
        }"
      >
        <CodeInk
          :lines="YAML_LINES"
          :x="CODE.x"
          :y="CODE.y"
          :width="CODE.width"
          :height="CODE.height"
          label="datasets/tea/staar-accountability/dataset.yaml"
          hue="cyan"
          :step="2"
          lang="yaml"
          :reveal="s.frame"
          :font-size="0.86"
          :href="DATASET_YAML_URL"
          scroll
          seed="dataset-yaml"
        />
      </div>

      <InkChip
        :x="PEAK_CHIP.right"
        :y="PEAK_CHIP.cy"
        anchor="right"
        :text="`${PEAK_WEEK.count} in one week`"
        :progress="s.peak"
      />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* A stage box recolors as the pulse reaches it. */
.od-pipe-stage {
  transition: color var(--od-dur-card) var(--od-settle);
}
/* A wrapper the beat can fade: CodeInk positions its own two layers inside it. */
.od-pipe-code {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.od-pipe-name {
  font-family: var(--od-font-sans);
  font-size: 24px;
  font-weight: 590;
  letter-spacing: -0.012em;
  fill: var(--od-text);
}
.od-pipe-note {
  font-family: var(--od-font-mono);
  font-size: 17px;
  fill: var(--od-text-faint);
}
.od-pipe-tag {
  font-family: var(--od-font-mono);
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.od-pipe-axis {
  font-family: var(--od-font-mono);
  font-size: 18px;
  fill: var(--od-text-faint);
}
</style>
