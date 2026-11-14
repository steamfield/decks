<script setup lang="ts">
/**
 * Slide 10: rr runs each agent's tests on its own machine.
 *
 * rr's "How runs share hosts" diagram, redrawn as a stage. The model is rr's
 * own simulation of its lock rules (data/10-rr-locks.ts, ported from
 * rr/site/src/lib/flow.ts); the layout follows the wide geometry of
 * rr/site/src/components/landing/FlowDiagram.tsx: a laptop holding four agent
 * rows and a waiting column, three hosts at the right, and each agent's rr
 * process as a chip that moves between them.
 *
 * One reactive `t`, in simulation milliseconds. Each beat tweens it to that
 * beat's still moment and the template draws `sceneAt(t)`, so every frame is
 * a moment the simulation produced. The last beat leaves `t` alone, dims the
 * diagram and shows the result event of a real run.
 */
import { computed, reactive } from 'vue'
import { DUR, SETTLE, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import {
  AGENT_COUNT,
  FLOW_HOSTS,
  FLOW_RUNS,
  HOST_COUNT,
  PARSERS,
  POLL_MS,
  RESULT_HOT,
  RESULT_LINES,
  RUN,
  SEGMENTS,
  STILLS,
  WAITING_EVENT,
  sceneAt,
  type ChipView,
  type HostView,
  type Scene,
  type Segment,
} from '../data/10-rr-locks'

const COPY = [
  {
    lead: 'Each rr call is a separate process.',
    body: 'The only state they share is a lock on each host. rr has no server.',
  },
  {
    lead: 'A parallel task locks every host.',
    body: 'Its shards are tasks the config lists under parallel. rsync copies the files and SSH runs the command.',
  },
  {
    lead: 'A run waits when every host is locked.',
    body: `It retries every ${POLL_MS / 1000} seconds and prints a waiting event with the command that holds the lock.`,
  },
  {
    lead: 'A retry locks the first free host.',
    body: 'Each git worktree syncs to its own remote directory unless the config turns that off.',
  },
  {
    lead: 'The result event gives file and line.',
    body: `rr parses ${PARSERS.slice(0, -1).join(', ')} and ${PARSERS.at(-1)} output and reports each failed test's file, line and message.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
type Rect = { x: number; y: number; w: number; h: number }
type Point = { x: number; y: number }
type Port = Point & { dx: number; dy: number }

const LAPTOP: Rect = { x: 110, y: 226, w: 960, h: 454 }
const ROW = { y: 268, pitch: 102, h: 92 }
const AGENT = { x: 126, w: 316 }
const WAITING: Rect = { x: 456, y: 262, w: 290, h: 410 }
/** The rr process's box. `slot` 0 is the working column, 1 the waiting one. */
const CHIP = { x: 782, slide: 316, w: 270, h: 64, top: 14 }
const HOST = { x: 1400, y: 258, w: 410, h: 131, pitch: 141, pad: 18 }
const LABEL_Y = 214
const HEAD_Y = 252
const TAG_Y = 178
const STRIP: Rect = { x: 840, y: 686, w: 970, h: 272 }
const STRIP_TYPE = 26
/** Monospace advance at the small label size, for sizing a pill to its text. */
const MONO_SMALL_ADVANCE = 10.8
const WIRE = 0.4
const DOT = 4
/** Made-up process ids, as on rr's site: one per agent. */
const PID_BASE = 48210
const PID_STEP = 37

const row = (i: number) => ROW.y + i * ROW.pitch
const agentBox = (i: number): Rect => ({ x: AGENT.x, y: row(i), w: AGENT.w, h: ROW.h })
const chipBox = (i: number, slot: number): Rect => ({
  x: CHIP.x - slot * CHIP.slide,
  y: row(i) + CHIP.top,
  w: CHIP.w,
  h: CHIP.h,
})
const hostBox = (i: number): Rect => ({ x: HOST.x, y: HOST.y + i * HOST.pitch, w: HOST.w, h: HOST.h })
const chipPort = (box: Rect): Port => ({ x: box.x + box.w, y: box.y + box.h / 2, dx: 1, dy: 0 })
const hostPort = (i: number): Port => ({ x: HOST.x, y: HOST.y + i * HOST.pitch + HOST.h / 2, dx: -1, dy: 0 })

/** A cubic from one port to another, and a function for points along it. */
function curve(a: Port, b: Port) {
  const reach = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 0.5
  const c1 = { x: a.x + a.dx * reach, y: a.y + a.dy * reach }
  const c2 = { x: b.x + b.dx * reach, y: b.y + b.dy * reach }
  const at = (u: number): Point => {
    const v = 1 - u
    return {
      x: v * v * v * a.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * b.x,
      y: v * v * v * a.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * b.y,
    }
  }
  return { d: `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`, at }
}

/** A 12x14 padlock, scaled: shackle closed into the body when locked. */
const LOCK_SCALE = 1.7
const shackle = (locked: boolean) => (locked ? 'M3 6V4a3 3 0 0 1 6 0v2' : 'M3 6V4a3 3 0 0 1 6 0')
const lockAt = (x: number, y: number) => `translate(${x} ${y}) scale(${LOCK_SCALE})`

const PINK = ink('rose', 2)
const DATA = ink('cyan', 2)
const PLUMB = ink('violet', 3)
const WAIT = ink('amber', 2)
const GREEN = ink('emerald', 2)
const NEUTRAL = ink('slate', 1)
const QUIET = ink('slate', 2)
/** Commands and code: the secondary text color, brighter than a small label. */
const CODE = 'var(--od-text-secondary)'

/** Beat state: `t` is simulation milliseconds; the rest are 0..1. */
const s = reactive({ frame: OFF, t: STILLS[0] as number, dim: OFF, strip: OFF, lines: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
  },
  beats: (tl, beat) => {
    beat(0)

    // Agent 1's parallel run: lock every host, rsync, then tests.
    tl.to(s, { t: STILLS[1], duration: DUR.gather, ease: 'none' })
    beat(1)

    // Agents 2 and 3 arrive, find every lock held, and wait.
    tl.to(s, { t: STILLS[2], duration: DUR.trace, ease: 'none' })
    beat(2)

    // Agent 1 releases; 2 and 3 take the first two hosts; 4 takes the third.
    tl.to(s, { t: STILLS[3], duration: DUR.bloom, ease: 'none' })
    beat(3)

    // The diagram drops back and the recorded result comes up.
    tl.to(s, { dim: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { strip: ON, duration: DUR.card, ease: SETTLE }, '<')
    tl.to(s, { lines: RESULT_LINES.length, duration: DUR.grow, ease: 'none' })
    beat(4)
  },
})

/* ── The scene at `t`, as things to draw ── */
const scene = computed<Scene>(() => sceneAt(SEGMENTS, FLOW_RUNS, HOST_COUNT, s.t))
const diagram = computed(() => String(s.frame * (ON - s.dim * (ON - DIM))))

type Tone = { text: string; color: string }

const agents = computed(() =>
  FLOW_RUNS.map((run, i) => {
    const result = scene.value.results[i]
    const chip = scene.value.chips[i] as ChipView
    const status: Tone = result
      ? { text: result.ok ? result.text : `✕ ${result.text}`, color: result.ok ? GREEN : PINK }
      : chip.visible
        ? { text: 'waiting on rr', color: QUIET }
        : { text: 'writing code', color: QUIET }
    return { run, box: agentBox(i), status, lit: result ? (result.ok ? GREEN : PINK) : '' }
  }),
)

function chipStatus(i: number, chip: ChipView): Tone {
  const run = FLOW_RUNS[i]
  const held = scene.value.hosts.flatMap((host, h) => (host.holder === i ? [{ host, h }] : []))
  if (chip.state === 'done') return run?.result.ok ? { text: 'exit 0', color: GREEN } : { text: 'exit 1', color: PINK }
  if (chip.state === 'waiting' && chip.retryIn !== undefined) {
    return { text: `retry in ${(chip.retryIn / 1000).toFixed(1)}s`, color: WAIT }
  }
  const probes = scene.value.active.filter((a) => a.segment.run === i && a.segment.kind.startsWith('probe'))
  const probe = probes[0]
  if (probes.length > 1) return { text: `locking ${probes.length} hosts`, color: QUIET }
  if (probe) return { text: `trying ${FLOW_HOSTS[probe.segment.host]}`, color: QUIET }
  if (held.length > 1) {
    const syncing = held.some(({ host }) => host.phase === 'sync')
    return { text: `${held.length} subtasks ${syncing ? 'syncing' : 'running'}`, color: syncing ? PLUMB : DATA }
  }
  const first = held[0]
  if (first) {
    const name = FLOW_HOSTS[first.h]
    return first.host.phase === 'sync'
      ? { text: `rsync to ${name}`, color: PLUMB }
      : { text: `running on ${name}`, color: DATA }
  }
  return { text: 'collecting results', color: QUIET }
}

const chips = computed(() =>
  scene.value.chips.flatMap((chip, i) => {
    if (!chip.visible) return []
    const box = chipBox(i, chip.slot)
    const agent = agentBox(i)
    const waiting = chip.state === 'waiting'
    return [
      {
        i,
        box,
        pid: `pid ${PID_BASE + i * PID_STEP}`,
        status: chipStatus(i, chip),
        stroke: waiting ? WAIT : chip.state === 'done' ? NEUTRAL : PINK,
        ring: waiting && chip.retryIn !== undefined ? 1 - chip.retryIn / POLL_MS : undefined,
        enter: Math.min(1, (s.t - (FLOW_RUNS[i]?.arrive ?? 0)) / 300),
        call: `M${agent.x + agent.w} ${agent.y + agent.h / 2}H${box.x}`,
      },
    ]
  }),
)

function hostView(view: HostView, i: number) {
  const holder = view.holder === undefined ? undefined : FLOW_RUNS[view.holder]
  const phase: Tone =
    view.phase === 'sync'
      ? { text: 'rsync', color: PLUMB }
      : view.phase === 'test'
        ? { text: `tests ${Math.round(view.progress * 100)}%`, color: DATA }
        : view.phase === 'hold'
          ? { text: 'done, lock held', color: QUIET }
          : { text: 'idle', color: QUIET }
  return {
    name: FLOW_HOSTS[i],
    box: hostBox(i),
    locked: !!holder,
    who: holder ? `${holder.agent}${view.task ? ` · ${view.task}` : ''}` : 'free',
    phase,
    fill: view.phase === 'sync' || view.phase === 'test' ? Math.min(1, view.progress) : view.phase === 'hold' ? 1 : 0,
    fillColor: view.phase === 'sync' ? PLUMB : view.phase === 'test' ? DATA : NEUTRAL,
  }
}
const hosts = computed(() => scene.value.hosts.map(hostView))

const pill = (at: Point, text: string, color: string) => {
  const w = text.length * MONO_SMALL_ADVANCE + 20
  return { x: at.x - w / 2, y: at.y - 19, w, h: 30, tx: at.x, ty: at.y + 3, text, color }
}

function link(segment: Segment, at: number, label: boolean) {
  const slot = scene.value.chips[segment.run]?.slot ?? 0
  const { d, at: point } = curve(chipPort(chipBox(segment.run, slot)), hostPort(segment.host))
  const ok = FLOW_RUNS[segment.run]?.result.ok ?? true
  const key = `${segment.run}-${segment.host}-${segment.kind}-${segment.start}`
  if (segment.kind === 'probe-ok' || segment.kind === 'probe-locked') {
    // A lock attempt draws out from rr to the host; its head is a padlock.
    const head = point(at)
    return {
      key,
      d,
      color: QUIET,
      wire: ON,
      draw: at,
      dots: [] as Point[],
      head,
      pill: label && at > 0.15 ? pill(point(Math.min(at, 0.5) * 0.6), 'try lock', QUIET) : undefined,
    }
  }
  if (segment.kind === 'result') {
    const dot = point(1 - at)
    const color = ok ? GREEN : PINK
    return {
      key,
      d,
      color,
      wire: 0.6 * (1 - at),
      draw: 1,
      dots: [dot],
      head: undefined,
      pill: label ? pill({ x: dot.x, y: dot.y - 28 }, ok ? 'exit 0' : 'exit 1', color) : undefined,
    }
  }
  // Files go out over rsync; test output comes back.
  const sync = segment.kind === 'sync'
  const period = sync ? 700 : 1100
  const count = sync ? 4 : 3
  const color = sync ? PLUMB : DATA
  return {
    key,
    d,
    color,
    wire: WIRE,
    draw: 1,
    dots: Array.from({ length: count }, (_, k) => {
      const u = (s.t / period + k / count) % 1
      return point(sync ? u : 1 - u)
    }),
    head: undefined,
    pill: label ? pill(point(0.5), sync ? 'rsync' : 'output', color) : undefined,
  }
}

const links = computed(() => {
  // One label per run and kind: a parallel run's three lines share it.
  const labelled = new Set<string>()
  return scene.value.active.map(({ segment, at }) => {
    const kind = `${segment.run}-${segment.kind.startsWith('probe') ? 'probe' : segment.kind}`
    const label = !labelled.has(kind)
    labelled.add(kind)
    return link(segment, at, label)
  })
})

/** "lock taken" or "locked" at the host end of a lock attempt that just landed. */
const tags = computed(() =>
  scene.value.tags.map((tag) => {
    const port = hostPort(tag.host)
    const text = tag.ok ? 'lock taken' : 'locked'
    const at = { x: port.x - (text.length * MONO_SMALL_ADVANCE + 20) / 2 - 14, y: port.y - 30 }
    return {
      key: `${tag.run}-${tag.host}-${tag.ok}`,
      fade: Math.min(1, (tag.ms - tag.age) / 200),
      pill: pill(at, text, tag.ok ? GREEN : WAIT),
    }
  }),
)

/** The waiting event, shown in the waiting column's free row while a run waits. */
const waitingNote = computed(() => {
  const anyone = scene.value.chips.some((chip) => chip.visible && chip.state === 'waiting' && chip.slot > 0.99)
  return { box: chipBox(AGENT_COUNT - 1, 1), opacity: anyone ? ON : OFF }
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: diagram }">
        <!-- ── Captions ── -->
        <text class="rr-cap" :x="LAPTOP.x" :y="LABEL_Y">Laptop, one rr process per call</text>
        <text class="rr-cap" :x="HOST.x" :y="HOST.y - 14">Hosts, tried in config order</text>
        <text class="sf-mono is-small" :x="(LAPTOP.x + LAPTOP.w + HOST.x) / 2" :y="HOST.y - 14" text-anchor="middle">SSH</text>

        <!-- ── The laptop ── -->
        <rect class="sf-box" :x="LAPTOP.x" :y="LAPTOP.y" :width="LAPTOP.w" :height="LAPTOP.h" />
        <text class="sf-mono is-small" :x="AGENT.x" :y="HEAD_Y">agents</text>
        <text class="sf-mono is-small" :x="WAITING.x + WAITING.w / 2" :y="HEAD_Y" text-anchor="middle" :style="{ fill: WAIT }">
          waiting for a host
        </text>
        <text class="sf-mono is-small" :x="CHIP.x + CHIP.w / 2" :y="HEAD_Y" text-anchor="middle">rr running</text>
        <rect
          class="rr-waiting"
          :x="WAITING.x"
          :y="WAITING.y"
          :width="WAITING.w"
          :height="WAITING.h"
          :style="{ stroke: WAIT, opacity: String(DIM) }"
        />

        <!-- ── Hosts ── -->
        <g v-for="host in hosts" :key="host.name" :style="{ color: host.locked ? WAIT : NEUTRAL }">
          <rect class="sf-box is-well" :class="{ 'is-lit': host.locked }" :x="host.box.x" :y="host.box.y" :width="host.box.w" :height="host.box.h" />
          <text class="sf-name" :x="host.box.x + HOST.pad" :y="host.box.y + 38">{{ host.name }}</text>
          <g :transform="lockAt(host.box.x + host.box.w - HOST.pad - 20, host.box.y + 14)" fill="none" stroke="currentColor" stroke-width="1.4">
            <path :d="shackle(host.locked)" />
            <rect x="1" y="6" width="10" height="8" rx="1.5" :fill="host.locked ? 'currentColor' : 'none'" />
          </g>
          <text class="sf-mono" :x="host.box.x + HOST.pad" :y="host.box.y + 68" :style="{ fill: host.locked ? undefined : QUIET }">{{ host.who }}</text>
          <text class="sf-mono is-small" :x="host.box.x + HOST.pad" :y="host.box.y + 97" :style="{ fill: host.phase.color }">{{ host.phase.text }}</text>
          <rect class="rr-track" :x="host.box.x + HOST.pad" :y="host.box.y + 109" :width="host.box.w - HOST.pad * 2" height="6" rx="2" :style="{ opacity: String(DIM) }" />
          <rect :x="host.box.x + HOST.pad" :y="host.box.y + 109" :width="(host.box.w - HOST.pad * 2) * host.fill" height="6" rx="2" :fill="host.fillColor" />
        </g>

        <!-- ── What crosses SSH: lock attempts, rsync, output, exit codes ── -->
        <g fill="none">
          <g v-for="l in links" :key="l.key">
            <path :d="l.d" :stroke="l.color" stroke-width="2.5" path-length="1" stroke-dasharray="1 1" :stroke-dashoffset="1 - l.draw" :style="{ opacity: String(l.wire) }" />
            <circle v-for="(dot, k) in l.dots" :key="k" :cx="dot.x" :cy="dot.y" :r="DOT" :fill="l.color" />
            <g v-if="l.head" :transform="lockAt(l.head.x - 10, l.head.y - 13)" :stroke="l.color" stroke-width="1.4">
              <path :d="shackle(false)" />
              <rect x="1" y="6" width="10" height="8" rx="1.5" />
            </g>
            <g v-if="l.pill">
              <rect class="rr-pill" :x="l.pill.x" :y="l.pill.y" :width="l.pill.w" :height="l.pill.h" rx="2" />
              <text class="sf-mono is-small" :x="l.pill.tx" :y="l.pill.ty" text-anchor="middle" :style="{ fill: l.pill.color }">{{ l.pill.text }}</text>
            </g>
          </g>
        </g>

        <!-- ── Agents ── -->
        <g v-for="a in agents" :key="a.run.agent" :style="{ color: a.lit }">
          <rect class="sf-box is-well" :class="{ 'is-lit': a.lit }" :x="a.box.x" :y="a.box.y" :width="a.box.w" :height="a.box.h" />
          <text class="sf-name" :x="a.box.x + 16" :y="a.box.y + 33">{{ a.run.agent }}</text>
          <text class="sf-mono is-small" :x="a.box.x + 16" :y="a.box.y + 58" :style="{ fill: CODE }">{{ a.run.command }}</text>
          <text class="sf-mono is-small" :x="a.box.x + 16" :y="a.box.y + 80" :style="{ fill: a.status.color }">{{ a.status.text }}</text>
        </g>

        <!-- ── The waiting event ── -->
        <g class="rr-fade" :style="{ opacity: String(waitingNote.opacity), color: WAIT }">
          <rect class="sf-box is-well is-lit" :x="waitingNote.box.x" :y="waitingNote.box.y" :width="waitingNote.box.w" :height="waitingNote.box.h" />
          <text class="sf-mono is-small" :x="waitingNote.box.x + 14" :y="waitingNote.box.y + 27" :style="{ fill: WAIT }">{{ WAITING_EVENT.status }}</text>
          <text class="sf-mono is-small" :x="waitingNote.box.x + 14" :y="waitingNote.box.y + 51" :style="{ fill: CODE }">{{ WAITING_EVENT.holder }}</text>
        </g>

        <!-- ── One rr process per call ── -->
        <g v-for="c in chips" :key="c.i" :style="{ opacity: String(c.enter), color: c.stroke }">
          <path :d="c.call" fill="none" :stroke="PINK" stroke-width="1.5" :style="{ opacity: String(DIM) }" />
          <rect class="sf-box is-lit" :x="c.box.x" :y="c.box.y" :width="c.box.w" :height="c.box.h" />
          <text class="sf-mono rr-bold" :x="c.box.x + 14" :y="c.box.y + 27" :style="{ fill: PINK }">rr</text>
          <text class="sf-mono is-small" :x="c.box.x + 50" :y="c.box.y + 26">{{ c.pid }}</text>
          <g v-if="c.ring !== undefined" :transform="`translate(${c.box.x + c.box.w - 24} ${c.box.y + 21})`" fill="none" stroke-width="3">
            <circle r="10" :stroke="NEUTRAL" />
            <circle r="10" :stroke="WAIT" path-length="1" :stroke-dasharray="`${c.ring} 1`" transform="rotate(-90)" />
          </g>
          <text class="sf-mono is-small" :x="c.box.x + 14" :y="c.box.y + 52" :style="{ fill: c.status.color }">{{ c.status.text }}</text>
        </g>

        <!-- ── Lock answers at the host ── -->
        <g v-for="tag in tags" :key="tag.key" :style="{ opacity: String(tag.fade) }">
          <rect class="rr-pill" :x="tag.pill.x" :y="tag.pill.y" :width="tag.pill.w" :height="tag.pill.h" rx="2" />
          <text class="sf-mono is-small" :x="tag.pill.tx" :y="tag.pill.ty" text-anchor="middle" :style="{ fill: tag.pill.color }">{{ tag.pill.text }}</text>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">rr runs each agent's tests on its own machine.</h2>
      <NamePlate id="rr" />
      <EvidenceTag kind="schematic" :x="HOST.x + HOST.w" :y="TAG_Y" align="right" :progress="s.frame">
        Schematic · rr's own simulation of its lock rules
      </EvidenceTag>
      <TermPane
        :lines="RESULT_LINES"
        :shown="s.lines"
        :highlight="[RESULT_HOT]"
        :x="STRIP.x"
        :y="STRIP.y"
        :width="STRIP.w"
        :height="STRIP.h"
        :size="STRIP_TYPE"
        :tag="`Recorded ${RUN.recorded} · rr test in OpenData · rr/site/fixtures/run.jsonl`"
        :progress="s.strip"
      />
      <ThreadRail current="rr" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.rr-cap {
  font-family: var(--od-font-sans);
  font-size: 28px;
  fill: var(--od-text-muted);
}
.rr-bold { font-weight: 700; }
.rr-waiting {
  fill: none;
  stroke-width: var(--sf-marker);
  stroke-dasharray: 6 6;
  rx: var(--sf-radius-card);
}
.rr-track { fill: var(--od-border-rule); }
.rr-pill {
  fill: var(--od-canvas);
  stroke: var(--od-border-rule);
  stroke-width: var(--sf-hairline);
}
.rr-fade { transition: opacity var(--od-dur-card) var(--od-settle); }
</style>
