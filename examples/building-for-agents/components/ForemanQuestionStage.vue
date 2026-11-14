<script setup lang="ts">
/**
 * Slide 9: Codex waits until Claude answers its question.
 *
 * A sequence diagram across the top: Claude, a background `foreman wait`, the
 * daemon and Codex. Under it, real code for the step each beat is about, and
 * at the lower left what the wait prints.
 *
 * Four beats. On entry Codex's tool call reaches the daemon and nothing goes
 * back. The first click returns the wait, which exits, and that is what wakes
 * Claude. The second sends the answer down as the response to the stored
 * request. The third drops the diagram back for the timeout test. Which
 * excerpt shows is a function of the click index.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, type Pt } from './design'
import {
  FAKE_SERVER_LINES,
  QUESTION_TIMEOUT_MIN,
  TOOL_CALL_METHOD,
  TOOL_NAME,
  WAIT_OUTPUT,
  WAIT_OUTPUT_SOURCE,
} from '../data/09-foreman-question'
import { HOLD_QUESTION, RESPOND, TIMEOUT_TEST, WAKE } from '../data/code/09-foreman-question'
import type { Excerpt } from '../data/code/types'

const COPY = [
  {
    lead: `Codex asks by calling the ${TOOL_NAME} tool.`,
    body: 'The daemon stores the request id and sends no response, so the Codex turn stays blocked.',
  },
  {
    lead: 'A background foreman wait exits with the question.',
    body: 'Claude Code reports the finished background task to Claude, which reads the question from its output.',
  },
  {
    lead: "Claude's answer is returned as the tool result.",
    body: `After ${QUESTION_TIMEOUT_MIN} minutes without an answer, the daemon returns a message telling Codex to continue.`,
  },
  {
    lead: 'The timeout test advances a test clock.',
    body: `Effect's TestClock moves time by one second. A ${FAKE_SERVER_LINES}-line script replaces Codex in the tests.`,
  },
]

/** The excerpt and its bright lines, one entry per beat. */
const CODE: readonly { excerpt: Excerpt; lines: readonly (readonly [number, number])[] }[] = [
  { excerpt: HOLD_QUESTION, lines: [[3, 3], [10, 10]] },
  { excerpt: WAKE, lines: [[2, 6]] },
  { excerpt: RESPOND, lines: [[2, 5]] },
  { excerpt: TIMEOUT_TEST, lines: [[3, 3], [5, 5], [10, 10]] },
]

/* ── Geometry, in stage viewBox units ── */
const X = { claude: 300, wait: 700, daemon: 1100, codex: 1500 }
const HEAD = { y: 196, w: 280, h: 78 }
const LIFE = { top: HEAD.y + HEAD.h, bottom: 522 }
const ROW = { ask: 322, wake: 370, exit: 418, answer: 466, reply: 508 }
const BAR = 16
const TERM = { x: 110, y: 556, w: 690, h: 132 }
/** Right of the card and under the lifelines, so neither is covered. */
const CODE_BOX = { x: 840, y: 530, width: 970, height: 420 }
const HEAD_PT = 12

const PINK = ink('rose', 2)
const DATA = ink('cyan', 2)
const HELD = ink('amber', 2)
const PASSED = ink('emerald', 2)
const PLUMB = ink('violet', 3)

const heads = [
  { id: 'claude', x: X.claude, name: 'Claude', sub: 'orchestrator', mono: false },
  { id: 'wait', x: X.wait, name: 'foreman wait', sub: 'background task', mono: true },
  { id: 'daemon', x: X.daemon, name: 'daemon', sub: 'foreman', mono: false },
  { id: 'codex', x: X.codex, name: 'Codex', sub: 'the delegate', mono: false },
] as const

const s = reactive({
  frame: OFF,
  code: OFF,
  ask: OFF,
  wake: OFF,
  exit: OFF,
  out: OFF,
  answer: OFF,
  reply: OFF,
  rest: OFF,
})

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /* Landing: the lifelines settle, then Codex's call reaches the daemon and stops. */
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { code: ON, duration: DUR.card, ease: SETTLE }, '<')
    tl.to(s, { ask: ON, duration: DUR.scale, ease: DRAW })
  },
  beats: (tl, beat) => {
    beat(0)

    // The daemon answers the parked wait; the wait prints, exits, and Claude sees a finished task.
    tl.to(s, { wake: ON, duration: DUR.grow, ease: DRAW })
    tl.to(s, { out: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { exit: ON, duration: DUR.grow, ease: DRAW }, '<')
    beat(1)

    // Claude answers; the daemon responds to the request it stored; Codex resumes.
    tl.to(s, { answer: ON, duration: DUR.scale, ease: DRAW })
    tl.to(s, { reply: ON, duration: DUR.grow, ease: DRAW })
    beat(2)

    // The diagram drops back for the test.
    tl.to(s, { rest: ON, duration: DUR.color, ease: SETTLE })
    beat(3)
  },
})

/* ── Derived marks ── */
const code = computed(() => CODE[Math.min(Math.max(clicks.value, 0), CODE.length - 1)])
/** Full strength until `by` reaches 1, then the dim level. */
const dimBy = (by: number) => ON - (ON - DIM) * by

interface Message {
  id: string
  from: number
  to: number
  y: number
  label: string
  /** Where the label is centred. */
  at: number
  color: string
  dashed: boolean
  p: number
  opacity: number
}
const messages = computed<Message[]>(() => [
  {
    id: 'ask',
    from: X.codex,
    to: X.daemon,
    y: ROW.ask,
    label: `${TOOL_CALL_METHOD} ${TOOL_NAME}`,
    at: (X.codex + X.daemon) / 2,
    color: HELD,
    dashed: false,
    p: s.ask,
    opacity: dimBy(s.wake),
  },
  {
    id: 'wake',
    from: X.daemon,
    to: X.wait,
    y: ROW.wake,
    label: 'wait request returns',
    at: (X.daemon + X.wait) / 2,
    color: PLUMB,
    dashed: false,
    p: s.wake,
    opacity: dimBy(s.answer),
  },
  {
    id: 'exit',
    from: X.wait,
    to: X.claude,
    y: ROW.exit,
    label: 'process exits',
    at: (X.wait + X.claude) / 2,
    color: DATA,
    dashed: true,
    p: s.exit,
    opacity: dimBy(s.answer),
  },
  {
    id: 'answer',
    from: X.claude,
    to: X.daemon,
    y: ROW.answer,
    label: 'foreman answer',
    at: (X.claude + X.wait) / 2,
    color: PINK,
    dashed: false,
    p: s.answer,
    opacity: dimBy(s.rest),
  },
  {
    id: 'reply',
    from: X.daemon,
    to: X.codex,
    y: ROW.reply,
    label: 'response to the stored request id',
    at: (X.daemon + X.codex) / 2,
    color: PASSED,
    dashed: false,
    p: s.reply,
    opacity: dimBy(s.rest),
  },
])
const tip = (m: Message) => m.from + (m.to - m.from) * m.p
const arrow = (m: Message) => {
  const dir = m.to > m.from ? 1 : -1
  const x = tip(m)
  return `M${x} ${m.y} L${x - dir * HEAD_PT} ${m.y - HEAD_PT / 2} L${x - dir * HEAD_PT} ${m.y + HEAD_PT / 2} Z`
}
const flight = (m: Message): Pt[] => [
  [m.from, m.y],
  [m.to, m.y],
]

const frame = computed(() => s.frame * dimBy(s.rest))
const held = computed(() => s.ask > 0.5 && s.reply < 0.5)
const woken = computed(() => s.exit > 0.5 && s.rest < 0.5)
const headInk = (id: string) =>
  id === 'claude' ? PINK : id === 'daemon' ? HELD : id === 'codex' ? DATA : PLUMB
const headLit = (id: string) =>
  id === 'claude' ? woken.value : id === 'daemon' ? held.value : id === 'codex' ? s.wake < 0.5 || s.reply > 0.5 : s.exit < 0.5
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- Lifelines and their heads -->
      <g :style="{ opacity: String(frame) }">
        <g v-for="h in heads" :key="h.id" :style="{ color: headInk(h.id) }">
          <line
            class="sf-wire"
            :x1="h.x"
            :x2="h.x"
            :y1="LIFE.top"
            :y2="h.id === 'wait' ? ROW.exit : LIFE.bottom"
            stroke-dasharray="4 8"
          />
          <rect class="sf-box" :class="{ 'is-lit': headLit(h.id) && s.rest < 0.5 }" :x="h.x - HEAD.w / 2" :y="HEAD.y" :width="HEAD.w" :height="HEAD.h" />
          <text :class="h.mono ? 'sf-mono' : 'sf-name'" :x="h.x - HEAD.w / 2 + 20" :y="HEAD.y + 34">{{ h.name }}</text>
          <text class="sf-mono is-small" :x="h.x - HEAD.w / 2 + 20" :y="HEAD.y + 62">{{ h.sub }}</text>
        </g>
        <!-- The wait runs until it exits; after that its lifeline stops. -->
        <line class="sf-wire" :x1="X.wait" :x2="X.wait" :y1="ROW.exit" :y2="LIFE.bottom" stroke-dasharray="4 8" :style="{ opacity: String(ON - s.exit) }" />
        <rect :x="X.wait - BAR / 2" :y="LIFE.top + 14" :width="BAR" :height="ROW.exit - LIFE.top - 14" rx="3" :fill="PLUMB" />
        <line :x1="X.wait - 18" :x2="X.wait + 18" :y1="ROW.exit + 2" :y2="ROW.exit + 2" :stroke="PLUMB" stroke-width="4" stroke-linecap="round" :style="{ opacity: String(s.exit) }" />

        <!-- The daemon holds the request: one bar from the call to the response -->
        <g :style="{ opacity: String(s.ask) }">
          <rect :x="X.daemon - BAR / 2" :y="ROW.ask" :width="BAR" :height="ROW.reply - ROW.ask" rx="3" :fill="HELD" />
          <g :style="{ opacity: String(dimBy(s.wake)) }">
            <text class="sf-mono is-small" :x="X.daemon + 24" :y="ROW.ask + 30" :style="{ fill: HELD }">id stored, no response</text>
          </g>
          <text class="sf-mono is-small" :x="X.codex + 22" :y="ROW.ask + 96" :style="{ fill: HELD, opacity: String(ON - s.reply) }">turn blocked</text>
        </g>
        <text class="sf-mono is-small" :x="X.codex + 22" :y="ROW.reply + 6" :style="{ fill: DATA, opacity: String(s.reply) }">turn resumes</text>
      </g>

      <!-- Messages -->
      <g v-for="m in messages" :key="m.id" :style="{ opacity: String(s.frame * (m.p > OFF ? m.opacity : OFF)) }">
        <line :x1="m.from" :x2="tip(m)" :y1="m.y" :y2="m.y" :stroke="m.color" stroke-width="3" :stroke-dasharray="m.dashed ? '10 8' : undefined" />
        <path :d="arrow(m)" :fill="m.color" />
        <text class="sf-mono is-small" :x="m.at" :y="m.y - 12" text-anchor="middle" :style="{ fill: m.color, opacity: String(m.p) }">{{ m.label }}</text>
        <PacketPath :points="flight(m)" :progress="m.p" :color="m.color" :radius="7" />
      </g>

      <!-- What the wait printed before it exited -->
      <g :style="{ opacity: String(s.out * dimBy(s.answer)) }">
        <rect class="sf-box is-well" :x="TERM.x" :y="TERM.y" :width="TERM.w" :height="TERM.h" />
        <text class="sf-mono is-small" :x="TERM.x + 20" :y="TERM.y + 32">foreman wait prints · {{ WAIT_OUTPUT_SOURCE }}</text>
        <text
          v-for="(line, i) in WAIT_OUTPUT"
          :key="i"
          class="sf-term"
          :x="TERM.x + 20"
          :y="TERM.y + 72 + i * 34"
          :style="{ fontSize: '27px', fill: line.tone === 'warn' ? HELD : undefined }"
        >
          {{ line.text }}
        </text>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">Codex waits until Claude answers its question.</h2>
      <NamePlate id="foreman" chip-only />
      <EvidenceTag kind="schematic" :x="110" :y="490" :progress="s.frame" />
      <CodePane
        :excerpt="code.excerpt"
        :focus="code.lines"
        :progress="s.code"
        :x="CODE_BOX.x"
        :y="CODE_BOX.y"
        :width="CODE_BOX.width"
        :height="CODE_BOX.height"
        :size="22"
      />
      <ThreadRail current="foreman" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
