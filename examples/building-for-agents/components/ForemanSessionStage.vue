<script setup lang="ts">
/**
 * Slide 7: foreman runs each Codex task in its own worktree.
 *
 * foreman's landing-page session, redrawn as an SVG stage: Claude at the left,
 * the daemon's board in the centre on a monitor (its contents are recorded),
 * one card per delegate at the right, each titled with its worktree and
 * branch. The model is data/07-foreman-session.ts, a port of the site's
 * `sceneAt`.
 *
 * Five beats over one reactive `t`, the model's clock in milliseconds. Each
 * beat tweens `t` to a still moment and the template draws `sceneAt(t)`, so a
 * frame is a pure function of `t` and stepping back lands on the same picture.
 */
import { computed, reactive } from 'vue'
import { DUR, SETTLE, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, polyline, type Pt } from './design'
import {
  ANSWER,
  ANSWER_DELAY_S,
  BRANCH_PREFIX,
  QUESTION,
  RECORDED,
  SESSION,
  STILLS,
  WORKTREE_DIR,
  claudeStatus,
  sceneAt,
  short,
  worktreeOf,
  wrap,
  type Endpoint,
  type SessionState,
} from '../data/07-foreman-session'

const COPY = [
  {
    lead: 'Claude writes one contract per task.',
    body: 'Each contract is a Markdown file. foreman reads its May change line for the paths the delegate may edit.',
  },
  {
    lead: 'foreman creates a worktree and branch per delegate.',
    body: `The worktree is ${WORKTREE_DIR}/<name> and the branch is ${BRANCH_PREFIX}<name>.`,
  },
  {
    lead: `${SESSION.question.run} asked Claude a question.`,
    body: 'The daemon leaves the tool call open until Claude answers, and the other two delegates keep running.',
  },
  {
    lead: `Claude answered after ${ANSWER_DELAY_S} seconds.`,
    body: 'The answer is returned inside the same Codex turn, so the delegate continues with its context.',
  },
  {
    lead: 'Claude reviews each diff and commits it.',
    body: 'foreman leaves the work uncommitted. Its digest lists every file changed outside May change.',
  },
]

/* ── Geometry, in stage viewBox units ── */
const CLAUDE = { x: 110, y: 240, w: 410, h: 440 }
const BOARD = { x: 600, y: 240, w: 580, h: 440 }
const AGENT = { x: 1280, y: 196, w: 530, h: 234, gap: 16 }
const CONTRACT = { x: CLAUDE.x + 20, y: CLAUDE.y + 112, w: CLAUDE.w - 40, h: 84, gap: 10 }
const WIRE_Y = 460
/** Where each delegate's wire leaves the board, and the column it turns in. */
const PORT_Y = [400, 460, 520]
const TURN_X = [1230, 1245, 1215]
const agentY = (i: number) => AGENT.y + i * (AGENT.h + AGENT.gap)

const CLAUDE_TO_BOARD: Pt[] = [
  [CLAUDE.x + CLAUDE.w, WIRE_Y],
  [BOARD.x, WIRE_Y],
]
const boardToAgent = (i: number): Pt[] => {
  const mid = agentY(i) + AGENT.h / 2
  return [
    [BOARD.x + BOARD.w, PORT_Y[i]],
    [TURN_X[i], PORT_Y[i]],
    [TURN_X[i], mid],
    [AGENT.x, mid],
  ]
}
/** The polyline a packet travels, in its direction of travel. */
function route(from: Endpoint, to: Endpoint): Pt[] {
  if (from === 'claude') return CLAUDE_TO_BOARD
  if (to === 'claude') return [...CLAUDE_TO_BOARD].reverse()
  if (typeof to === 'number') return boardToAgent(to)
  return [...boardToAgent(from as number)].reverse()
}

const PINK = ink('rose', 2)
const WORK = ink('cyan', 2)
const HELD = ink('amber', 2)
const PASSED = ink('emerald', 2)
const PLUMB = ink('violet', 3)
const NEUTRAL = ink('slate', 2)
const stateInk: Record<SessionState, string> = {
  queued: NEUTRAL,
  starting: WORK,
  running: WORK,
  waiting: HELD,
  done: PASSED,
  archived: NEUTRAL,
}

/** `t` is the model's clock in milliseconds; `frame` is the entrance. */
const s = reactive({ frame: OFF, t: STILLS[0] as number })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE }),
  beats: (tl, beat) => {
    beat(0)
    // Starts go out, worktrees appear, commands tick.
    tl.to(s, { t: STILLS[1], duration: DUR.gather, ease: 'none' })
    beat(1)
    // site-commands asks; the call reaches the daemon and stops there.
    tl.to(s, { t: STILLS[2], duration: DUR.scale, ease: 'none' })
    beat(2)
    // The wait returns to Claude, the answer goes back down the same path.
    tl.to(s, { t: STILLS[3], duration: DUR.gather, ease: 'none' })
    beat(3)
    // Everything finishes and each result comes back for review.
    tl.to(s, { t: STILLS[4], duration: DUR.bloom, ease: 'none' })
    beat(4)
  },
})

/* ── Derived marks ── */
const scene = computed(() => sceneAt(SESSION, s.t))
const status = computed(() => claudeStatus(SESSION, s.t))
const reviewing = computed(() => scene.value.step >= 6)
/** Lit while Claude is doing something; idle on a background wait it is not. */
const busy = computed(() => scene.value.claudeActive && !status.value.startsWith('Idle'))

const contracts = SESSION.delegates.map((d, i) => ({
  file: d.contract,
  line: short(d.mayChange, 32),
  y: CONTRACT.y + i * (CONTRACT.h + CONTRACT.gap),
  sent: d.start,
}))

const cards = computed(() =>
  SESSION.delegates.map((d, i) => {
    const now = scene.value.delegates[i]
    const latest = now.latest
    return {
      name: d.name,
      model: d.model,
      worktree: worktreeOf(d.name),
      branch: d.branch,
      y: agentY(i),
      color: stateInk[now.state],
      word: now.state,
      queued: now.state === 'queued',
      lit: now.state !== 'queued' && now.state !== 'archived',
      commands: now.commands,
      counts: `${now.commands} commands · ${now.files} files`,
      latest: !latest
        ? ''
        : latest.kind === 'command'
          ? `$ ${short(latest.command, 40)}`
          : `wrote ${short(latest.paths[0].split('/').pop() ?? '', 34)}`,
    }
  }),
)

const packets = computed(() =>
  scene.value.packets.map((p) => {
    const ambient = p.label === 'events'
    return {
      key: `${p.label}-${p.from}-${p.to}-${ambient ? 'a' : p.at}`,
      points: route(p.from, p.to),
      // A packet that has all but arrived is drawn as arrived.
      progress: p.progress > 0.98 ? ON : p.progress,
      color: p.attention ? HELD : p.label === 'done' ? PASSED : ambient ? WORK : PLUMB,
      radius: ambient ? 5 : 9,
      // The daemon sends Claude nothing: the background wait returns.
      label: ambient ? '' : p.to === 'claude' ? `wait returns · ${p.label}` : p.label,
    }
  }),
)

const QUESTION_LINES = wrap(SESSION.question.text, 46, 4)
const asked = computed(() => s.t > QUESTION)
const answered = computed(() => s.t >= ANSWER)
const questionTag = computed(() =>
  answered.value
    ? `${SESSION.question.id} answered after ${ANSWER_DELAY_S} s`
    : `Held · ${SESSION.question.id} · ${SESSION.question.run}`,
)
const SCREEN_X = BOARD.x + 38
const rowY = (i: number) => BOARD.y + 108 + i * 40
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: String(s.frame) }">
        <!-- Wires -->
        <path class="sf-wire" :d="polyline(CLAUDE_TO_BOARD)" />
        <path v-for="(c, i) in cards" :key="c.name" class="sf-wire" :d="polyline(boardToAgent(i))" :style="{ opacity: String(c.queued ? DIM : ON) }" />

        <!-- Claude -->
        <g :style="{ color: PINK }">
          <rect class="sf-box" :class="{ 'is-lit': busy }" :x="CLAUDE.x" :y="CLAUDE.y" :width="CLAUDE.w" :height="CLAUDE.h" />
          <text class="sf-name" :x="CLAUDE.x + 24" :y="CLAUDE.y + 48">Claude Code</text>
          <text class="sf-mono is-small" :x="CLAUDE.x + 24" :y="CLAUDE.y + 86" :style="{ fill: PINK }">{{ status }}</text>
          <g v-for="c in contracts" :key="c.file" :style="{ opacity: String(s.t < c.sent ? ON : DIM) }">
            <rect class="sf-box is-well" :x="CONTRACT.x" :y="c.y" :width="CONTRACT.w" :height="CONTRACT.h" />
            <text class="sf-mono" :x="CONTRACT.x + 16" :y="c.y + 34">{{ c.file }}</text>
            <text class="sf-mono is-small" :x="CONTRACT.x + 16" :y="c.y + 64">{{ c.line }}</text>
          </g>
          <text
            class="sf-pixel is-small"
            :x="CLAUDE.x + CLAUDE.w / 2"
            :y="CLAUDE.y + CLAUDE.h - 18"
            text-anchor="middle"
            :style="{ opacity: String(reviewing ? ON : OFF), fill: PASSED }"
          >
            review · test · commit
          </text>
        </g>

        <!-- Delegates, one worktree each -->
        <g v-for="c in cards" :key="c.name" :style="{ opacity: String(c.queued ? DIM : ON), color: c.color }">
          <rect class="sf-box" :class="{ 'is-lit': c.lit }" :x="AGENT.x" :y="c.y" :width="AGENT.w" :height="AGENT.h" />
          <text class="sf-name" :x="AGENT.x + 24" :y="c.y + 46">{{ c.name }}</text>
          <text class="sf-pixel is-small" :x="AGENT.x + AGENT.w - 24" :y="c.y + 42" text-anchor="end" :style="{ fill: c.color }">{{ c.word }}</text>
          <text class="sf-mono" :x="AGENT.x + 24" :y="c.y + 86">{{ c.worktree }}</text>
          <text class="sf-mono is-small" :x="AGENT.x + 24" :y="c.y + 116">branch {{ c.branch }} · {{ c.model }}</text>
          <g :style="{ opacity: String(c.queued ? OFF : ON) }">
            <line :x1="AGENT.x + 24" :x2="AGENT.x + AGENT.w - 24" :y1="c.y + 138" :y2="c.y + 138" class="sf-wire" />
            <text class="sf-mono" :x="AGENT.x + 24" :y="c.y + 174" :style="{ fill: c.color }">{{ c.counts }}</text>
            <text class="sf-mono is-small" :x="AGENT.x + 24" :y="c.y + 208">{{ c.latest }}</text>
          </g>
        </g>
      </g>

      <!-- The daemon's board: recorded, so it is a monitor -->
      <CrtFrame :x="BOARD.x" :y="BOARD.y" :width="BOARD.w" :height="BOARD.h" :tag="`Recorded ${RECORDED} · timeline shortened`" :progress="s.frame">
        <text class="sf-name" :x="SCREEN_X" :y="BOARD.y + 58">foreman daemon</text>
        <g v-for="(r, i) in cards" :key="r.name">
          <rect :x="SCREEN_X" :y="rowY(i) - 15" width="16" height="16" rx="2" :fill="r.color" />
          <text class="sf-mono" :x="SCREEN_X + 30" :y="rowY(i)">{{ r.name }}</text>
          <text class="sf-mono" :x="SCREEN_X + 250" :y="rowY(i)" :style="{ fill: r.color }">{{ r.word }}</text>
          <text class="sf-mono is-small" :x="BOARD.x + BOARD.w - 38" :y="rowY(i)" text-anchor="end">{{ r.queued ? '' : `${r.commands} cmds` }}</text>
        </g>
        <g :style="{ opacity: String(asked ? ON : OFF) }">
          <text class="sf-pixel is-small" :x="SCREEN_X" :y="BOARD.y + 250" :style="{ fill: answered ? PASSED : HELD }">{{ questionTag }}</text>
          <text
            v-for="(line, i) in QUESTION_LINES"
            :key="i"
            class="sf-term"
            :x="SCREEN_X"
            :y="BOARD.y + 288 + i * 30"
            :style="{ fill: HELD, fontSize: '27px', opacity: String(answered ? DIM : ON) }"
          >
            {{ line }}
          </text>
        </g>
      </CrtFrame>

      <!-- Packets -->
      <g :style="{ opacity: String(s.frame) }">
        <PacketPath v-for="p in packets" :key="p.key" :points="p.points" :progress="p.progress" :color="p.color" :radius="p.radius" :label="p.label" />
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">foreman runs each Codex task in its own worktree.</h2>
      <NamePlate id="foreman" />
      <ThreadRail current="foreman" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
