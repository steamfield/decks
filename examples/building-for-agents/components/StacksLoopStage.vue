<script setup lang="ts">
/**
 * Slide 4: Stacks briefs the agent and checks its work.
 *
 * The loop is a schematic: a command writes files, one sentence hands them to
 * the agent, and `stacks verify` decides when the work is done. Under it, on a
 * CRT, is a recording: the verify runs of one real project (tea-dashboard,
 * built by Claude Code), in seconds since `stacks new`.
 *
 * Four beats. On entry the command types and the files drop out of it. The
 * first click shows the hand-off prompt and sends it to the agent. The second
 * turns the monitor on and runs the record: the cursor reaches the first
 * verify, five of fifteen steps fail and the work goes back to the agent, then
 * the next run is green. The third puts a lock on the manifest and the gate,
 * and a digest outside the project, and drops everything else back.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, clamp01, ink, stagger, useStage, xScale } from 'slidev-addon-decks/story'
import { DIM, LOOP, OFF, ON, along, polyline, type Pt } from './design'
import {
  AGENT,
  BRIEF_WORDS,
  CLI,
  COMMAND,
  FILES,
  FIRST_FAIL,
  FIRST_GREEN,
  HANDOFF_PROMPT,
  MANIFEST_FILE,
  PROJECT,
  RECORDED,
  RUNS,
  STEPS,
  TIMELINE_END,
} from '../data/04-stacks-loop'

const COPY = [
  {
    lead: 'One command writes the brief.',
    body: `It writes starter files, agent instructions and a ${BRIEF_WORDS.toLocaleString('en-US')}-word BRIEF.md.`,
  },
  {
    lead: 'The agent\u2019s prompt is two sentences.',
    body: 'It names the brief and says the work is done when stacks verify passes.',
  },
  {
    lead: 'The first verify run failed.',
    body: `${AGENT} ran it ${FIRST_FAIL.at} seconds in and ${FIRST_FAIL.failed.length} of ${STEPS.length} steps failed. The next run passed at ${FIRST_GREEN.at} seconds.`,
  },
  {
    lead: 'Stacks refuses to verify edited checks.',
    body: 'Stacks keeps a hash of the steps outside the project and refuses to run if one was edited.',
  },
]

/* ── Geometry, in stage viewBox units ── */
const { boundary, command, file, agent, gate, step, prompt, digest, crt, axis } = LOOP
const files = FILES.map((name, i) => ({ name, y: file.y + i * file.gap, manifest: name === MANIFEST_FILE }))
const midY = agent.y + agent.h / 2
const gateMidX = gate.x + gate.w / 2

const TO_AGENT: Pt[] = [
  [file.x + file.w, midY],
  [agent.x, midY],
]
const TO_GATE: Pt[] = [
  [agent.x + agent.w, midY],
  [gate.x, midY],
]
/** Back to the agent, over the top of the loop. */
const BACK: Pt[] = [
  [gateMidX, gate.y],
  [gateMidX, boundary.y + 22],
  [agent.x + agent.w / 2, boundary.y + 22],
  [agent.x + agent.w / 2, agent.y],
]
const TO_DIGEST: Pt[] = [
  [gate.x + gate.w - 34, gate.y + gate.h],
  [gate.x + gate.w - 34, digest.y],
]

const squares = STEPS.map((name, i) => ({
  name,
  x: gate.x + 22 + (i % step.cols) * (step.size + step.gap),
  y: gate.y + step.top + Math.floor(i / step.cols) * (step.size + step.gap),
  failed: FIRST_FAIL.failed.includes(name),
}))

const tx = xScale([0, TIMELINE_END], [axis.x0, axis.x1])
const ticks = [
  { at: 0, name: 'stacks new', tone: 'start' as const },
  ...RUNS.map((run) => ({ at: run.at, name: run.outcome, tone: run.outcome })),
]

const PINK = ink('rose', 2)
const GREEN = ink('emerald', 2)
const WAIT = ink('amber', 2)
const PLUMB = ink('violet', 3)
const DATA = ink('cyan', 2)
const NEUTRAL = ink('slate', 1)
const toneInk = { start: ink('slate', 2), failed: PINK, green: GREEN }

/** Beat state. Every field is 0..1 except `cursor`, which is seconds. */
const s = reactive({
  frame: OFF,
  cmd: OFF,
  files: OFF,
  prompt: OFF,
  toAgent: OFF,
  agent: OFF,
  crt: OFF,
  toGate: OFF,
  cursor: OFF,
  run1: OFF,
  back: OFF,
  run2: OFF,
  rest: OFF,
  lock: OFF,
  digest: OFF,
})

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /* Landing: the loop's boxes settle, the command types, the files drop. */
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { cmd: ON, duration: DUR.scale, ease: 'none' }, `-=${DUR.card}`)
    tl.to(s, { files: ON, duration: DUR.grow, ease: SETTLE })
  },
  beats: (tl, beat) => {
    beat(0)

    // The prompt appears, travels to the agent, and the agent lights.
    tl.to(s, { prompt: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { toAgent: ON, duration: DUR.grow, ease: DRAW })
    tl.to(s, { agent: ON, duration: DUR.color, ease: SETTLE }, `-=${DUR.opacity}`)
    beat(1)

    // The monitor comes on. The work goes to the gate as the cursor reaches
    // the first verify; it fails and goes back; the next run is green.
    tl.to(s, { crt: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { toGate: ON, duration: DUR.scale, ease: DRAW })
    tl.to(s, { cursor: FIRST_FAIL.at, duration: DUR.scale, ease: DRAW }, '<')
    tl.to(s, { run1: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { back: ON, duration: DUR.grow, ease: DRAW }, `+=${DUR.eraseDelay}`)
    tl.to(s, { cursor: FIRST_GREEN.at, duration: DUR.grow, ease: DRAW }, '<')
    tl.to(s, { run2: ON, duration: DUR.color, ease: SETTLE })
    beat(2)

    // Everything but the manifest and the gate drops back; both get a lock,
    // and the digest lands outside the project.
    tl.to(s, { rest: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { lock: ON, duration: DUR.card, ease: SETTLE }, '<')
    tl.to(s, { digest: ON, duration: DUR.card, ease: SETTLE })
    beat(3)
  },
})

/* ── Derived marks ── */
const typed = computed(() => COMMAND.slice(0, Math.round(s.cmd * COMMAND.length)))
const fileProgress = (i: number) => stagger(s.files, i, files.length, 0.18)
/** What drops back on the last beat. */
const rest = computed(() => String(ON - s.rest * (ON - DIM)))
const packet = (path: Pt[], t: number) => {
  const [x, y] = along(path, t)
  return { cx: x, cy: y, opacity: t > OFF && t < ON ? ON : OFF }
}
const gateInk = computed(() => (s.run2 > 0.5 ? GREEN : s.run1 > 0.5 ? PINK : NEUTRAL))
const gateStatus = computed(() =>
  s.run2 > 0.5
    ? `green · ${STEPS.length} of ${STEPS.length}`
    : s.run1 > 0.5
      ? `${FIRST_FAIL.failed.length} of ${STEPS.length} failed`
      : `${STEPS.length} steps`,
)
const tickProgress = (at: number) => (at === 0 ? ON : clamp01((s.cursor - at + 30) / 30))
/** A small padlock, drawn at its top left corner. */
const lockAt = (x: number, y: number) => {
  const w = LOOP.lock
  return {
    body: { x, y: y + w * 0.45, width: w, height: w * 0.7 },
    shackle: `M${x + w * 0.22} ${y + w * 0.45}V${y + w * 0.3}a${w * 0.28} ${w * 0.28} 0 0 1 ${w * 0.56} 0V${y + w * 0.45}`,
  }
}
const manifest = files.find((f) => f.manifest) ?? files[files.length - 1]
const manifestLock = lockAt(file.x + file.w - 38, manifest.y + 9)
const gateLock = lockAt(gate.x + gate.w - 42, gate.y + gate.h - 38)
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- ── The loop (schematic) ── -->
      <g :style="{ opacity: String(s.frame) }">
        <rect class="sf-boundary" :x="boundary.x" :y="boundary.y" :width="boundary.w" :height="boundary.h" />
        <text class="sf-mono is-small" :x="boundary.x + 4" :y="boundary.y - 14">{{ PROJECT }}/</text>

        <!-- Wires -->
        <g :style="{ opacity: rest }">
          <path class="sf-wire" :d="polyline([[command.x + command.w, command.y + command.h / 2], [boundary.x, command.y + command.h / 2]])" />
          <path class="sf-wire" :d="polyline(TO_AGENT)" />
        </g>
        <path class="sf-wire" :d="polyline(TO_GATE)" />
        <path class="sf-wire" :d="polyline(BACK)" stroke-dasharray="4 8" :style="{ opacity: String(s.run1) }" />
      </g>

      <!-- The command -->
      <g :style="{ opacity: rest }">
        <rect class="sf-box is-well" :x="command.x" :y="command.y" :width="command.w" :height="command.h" :style="{ opacity: String(s.frame) }" />
        <text class="sf-term" :x="command.x + 20" :y="command.y + 42">
          <tspan :fill="NEUTRAL">$ </tspan>{{ typed }}<tspan v-if="s.cmd < ON" :fill="GREEN">&#9608;</tspan>
        </text>
      </g>

      <!-- What it wrote -->
      <g
        v-for="(f, i) in files"
        :key="f.name"
        :style="{
          opacity: String(fileProgress(i) * (f.manifest ? ON : Number(rest))),
          transform: `translate(0, ${(ON - fileProgress(i)) * -16}px)`,
          color: WAIT,
        }"
      >
        <rect class="sf-box" :class="{ 'is-lit': f.manifest && s.lock > 0.5 }" :x="file.x" :y="f.y" :width="file.w" :height="file.h" />
        <text class="sf-mono" :x="file.x + 18" :y="f.y + 31">{{ f.name }}</text>
      </g>
      <g :style="{ opacity: String(s.lock), color: WAIT }">
        <rect v-bind="manifestLock.body" fill="currentColor" rx="2" />
        <path :d="manifestLock.shackle" fill="none" stroke="currentColor" stroke-width="3" />
      </g>

      <!-- The hand-off prompt -->
      <g :style="{ opacity: String(s.prompt * Number(rest)), transform: `translate(0, ${(ON - s.prompt) * 12}px)` }">
        <rect class="sf-box is-well" :x="prompt.x" :y="prompt.y" :width="prompt.w" :height="prompt.h" />
        <text class="sf-mono is-small" :x="prompt.x + 16" :y="prompt.y + 23">
          <tspan :fill="PINK">&gt; </tspan>{{ HANDOFF_PROMPT[0] }}
        </text>
        <text class="sf-mono is-small" :x="prompt.x + 38" :y="prompt.y + 45">{{ HANDOFF_PROMPT[1] }}</text>
      </g>

      <!-- The agent -->
      <g :style="{ opacity: String(s.frame * Number(rest)), color: PINK }">
        <rect class="sf-box" :class="{ 'is-lit': s.agent > 0.5 }" :x="agent.x" :y="agent.y" :width="agent.w" :height="agent.h" />
        <text class="sf-name" :x="agent.x + agent.w / 2" :y="agent.y + 52" text-anchor="middle">{{ AGENT }}</text>
        <text class="sf-mono is-small" :x="agent.x + agent.w / 2" :y="agent.y + 84" text-anchor="middle">builds the project</text>
      </g>

      <!-- The gate: one square per verify step -->
      <g :style="{ opacity: String(s.frame), color: gateInk }">
        <rect class="sf-box" :class="{ 'is-lit': s.run1 > 0.5 }" :x="gate.x" :y="gate.y" :width="gate.w" :height="gate.h" />
        <text class="sf-mono" :x="gate.x + 22" :y="gate.y + 40">stacks verify</text>
        <g v-for="sq in squares" :key="sq.name">
          <rect :x="sq.x" :y="sq.y" :width="step.size" :height="step.size" rx="2" fill="none" :stroke="NEUTRAL" />
          <rect
            :x="sq.x"
            :y="sq.y"
            :width="step.size"
            :height="step.size"
            rx="2"
            :fill="sq.failed ? PINK : GREEN"
            :style="{ opacity: String(s.run1 * (ON - s.run2)) }"
          />
          <rect :x="sq.x" :y="sq.y" :width="step.size" :height="step.size" rx="2" :fill="GREEN" :style="{ opacity: String(s.run2) }" />
        </g>
        <text class="sf-mono is-small" :x="gate.x + 22" :y="gate.y + gate.h + 28" :style="{ fill: gateInk }">{{ gateStatus }}</text>
      </g>
      <g :style="{ opacity: String(s.lock), color: WAIT }">
        <rect v-bind="gateLock.body" fill="currentColor" rx="2" />
        <path :d="gateLock.shackle" fill="none" stroke="currentColor" stroke-width="3" />
      </g>

      <!-- The digest, outside the project -->
      <g :style="{ opacity: String(s.digest), color: PLUMB }">
        <path class="sf-wire" :d="polyline(TO_DIGEST)" :style="{ stroke: PLUMB }" stroke-dasharray="4 8" />
        <rect class="sf-box is-lit" :x="digest.x" :y="digest.y" :width="digest.w" :height="digest.h" />
        <text class="sf-mono is-small" :x="digest.x + digest.w / 2" :y="digest.y + 29" text-anchor="middle" :style="{ fill: PLUMB }">
          step hash, outside the project
        </text>
      </g>

      <!-- Packets -->
      <circle :r="LOOP.packet" :fill="PINK" v-bind="packet(TO_AGENT, s.toAgent)" />
      <circle :r="LOOP.packet" :fill="DATA" v-bind="packet(TO_GATE, s.toGate)" />
      <circle :r="LOOP.packet" :fill="PINK" v-bind="packet(BACK, s.back)" />

      <!-- ── The record (a recording, so it plays on a monitor) ── -->
      <CrtFrame
        :x="crt.x"
        :y="crt.y"
        :width="crt.w"
        :height="crt.h"
        fig="Fig. 2"
        :tag="`Recorded ${RECORDED} · stacks ${CLI} · .stacks/state/runs.jsonl`"
        :progress="s.frame"
        :power="s.crt"
      >
        <text class="sf-pixel is-small" :x="axis.x0" :y="crt.y + 62">Seconds since stacks new</text>
        <line :x1="axis.x0" :x2="axis.x1" :y1="axis.y" :y2="axis.y" :stroke="NEUTRAL" stroke-width="2" />
        <line :x1="axis.x0" :x2="tx(s.cursor)" :y1="axis.y" :y2="axis.y" :stroke="DATA" stroke-width="4" stroke-linecap="round" />
        <g v-for="tick in ticks" :key="tick.at" :style="{ opacity: String(tickProgress(tick.at)) }">
          <line :x1="tx(tick.at)" :x2="tx(tick.at)" :y1="axis.y - axis.tick" :y2="axis.y + axis.tick" :stroke="toneInk[tick.tone]" stroke-width="4" stroke-linecap="round" />
          <text class="sf-mono" :x="tx(tick.at)" :y="axis.y - axis.labelUp" text-anchor="middle" :style="{ fill: toneInk[tick.tone] }">{{ tick.name }}</text>
          <text class="sf-pixel is-small" :x="tx(tick.at)" :y="axis.y + axis.labelDown" text-anchor="middle">{{ tick.at }} s</text>
        </g>
        <circle :cx="tx(s.cursor)" :cy="axis.y" r="9" :fill="DATA" />
      </CrtFrame>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Stacks briefs the agent and checks its work.</h2>
      <NamePlate id="stacks" />
      <EvidenceTag kind="schematic" :x="boundary.x + boundary.w" :y="boundary.y - 44" align="right" :progress="s.frame" />
      <ThreadRail current="stacks" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
