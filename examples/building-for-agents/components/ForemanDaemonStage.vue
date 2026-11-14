<script setup lang="ts">
/**
 * Slide 8: foreman is a short-lived CLI and a daemon.
 *
 * foreman's processes, left to right: Claude Code runs the `foreman` CLI, the
 * CLI talks to a daemon over a Unix socket, the daemon's supervisor drives one
 * `codex app-server`, and that serves a thread per run. A small tree of src/
 * at the right names the folder behind whatever is lit.
 *
 * Four beats. On entry one CLI call crosses to the daemon and the CLI drops
 * back while the daemon stays lit. Then the socket and its frames, then the
 * Codex side and its methods, then the protocol pin and the four binaries.
 * The tree's focus is a function of the click index.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, clamp01, ink, stagger, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, polyline, type Pt } from './design'
import {
  CODEX_ARGS,
  CODEX_COMMAND,
  CODEX_VERSION,
  IDLE_EXIT_MIN,
  REQUEST_FRAME,
  RESPONSE_FRAME,
  RPC_METHODS,
  SCHEMA_FILES,
  SOCKET_PATH,
  SRC_LINES,
  TARGETS,
  TREE,
} from '../data/08-foreman-daemon'

const COPY = [
  {
    lead: 'The CLI exits and the daemon keeps running.',
    body: `The daemon supervises every run and exits after ${IDLE_EXIT_MIN} idle minutes.`,
  },
  {
    lead: 'The CLI and daemon use a Unix socket.',
    body: 'Each message is one line of JSON. The CLI starts the daemon when the socket is missing.',
  },
  {
    lead: 'One codex app-server process runs every delegate.',
    body: 'The daemon sends it JSON-RPC over stdio and routes replies by thread id.',
  },
  {
    lead: 'foreman checks the Codex protocol by hash.',
    body: `The hash covers ${SCHEMA_FILES} schema files from Codex ${CODEX_VERSION}. foreman doctor prints whether it still matches.`,
  },
]

/** Tree focus per beat, in beat order. */
const STEPS = [
  { focus: 'commands', lit: ['daemon'] },
  { focus: 'daemon', lit: ['schemas'] },
  { focus: 'supervisor', lit: ['codex'] },
  { focus: 'codex', lit: [] },
] as const

/* ── Geometry, in stage viewBox units ── */
const MID = 370
const CLAUDE = { x: 110, y: 300, w: 210, h: 140 }
const CLI = { x: 360, y: 300, w: 170, h: 140 }
const SOCK = { x: 575, y: 320, w: 160, h: 100 }
const DAEMON = { x: 785, y: 280, w: 200, h: 180 }
const SUP = { x: DAEMON.x + 20, y: DAEMON.y + 64, w: DAEMON.w - 40, h: 56 }
const CODEX = { x: 1040, y: 300, w: 250, h: 140 }
const LANE = { x: 1100, y: 488, w: 190, h: 44, gap: 12, bus: 1070 }
const PIN = { x: 930, y: 668, w: 470, h: 44 }
const BIN = { x: 275, y: 590, w: 160, h: 40, gapX: 10, gapY: 10 }
const TREE_BOX = { x: 1340, y: 200, width: 470 }
const SOCK_MID = SOCK.x + SOCK.w / 2

const laneY = (i: number) => LANE.y + i * (LANE.h + LANE.gap)
const WIRES: Pt[][] = [
  [[CLAUDE.x + CLAUDE.w, MID], [CLI.x, MID]],
  [[CLI.x + CLI.w, MID], [SOCK.x, MID]],
  [[SOCK.x + SOCK.w, MID], [DAEMON.x, MID]],
  [[DAEMON.x + DAEMON.w, MID], [CODEX.x, MID]],
]
const CALL: Pt[] = [
  [CLAUDE.x + CLAUDE.w, MID],
  [DAEMON.x, MID],
]
const REQUEST: Pt[] = [
  [CLI.x + CLI.w, MID],
  [DAEMON.x, MID],
]
const RESPONSE: Pt[] = [...REQUEST].reverse()
const RPC: Pt[] = [
  [DAEMON.x + DAEMON.w, MID],
  [CODEX.x, MID],
]
const toLane = (i: number): Pt[] => [
  [LANE.bus, CODEX.y + CODEX.h],
  [LANE.bus, laneY(i) + LANE.h / 2],
  [LANE.x, laneY(i) + LANE.h / 2],
]
const lanes = [0, 1, 2].map((i) => ({ i, y: laneY(i), path: toLane(i), name: `thread ${i + 1}` }))
const bins = TARGETS.map((name, i) => ({
  name,
  x: BIN.x + (i % 2) * (BIN.w + BIN.gapX),
  y: BIN.y + Math.floor(i / 2) * (BIN.h + BIN.gapY),
}))
const TO_BINS: Pt[] = [
  [CLI.x + CLI.w / 2, CLI.y + CLI.h],
  [CLI.x + CLI.w / 2, BIN.y],
]

const PINK = ink('rose', 2)
const DATA = ink('cyan', 2)
const LOCKED = ink('amber', 2)
const PLUMB = ink('violet', 3)

const s = reactive({
  frame: OFF,
  call: OFF,
  sock: OFF,
  request: OFF,
  response: OFF,
  codex: OFF,
  rpc: OFF,
  lanes: OFF,
  pin: OFF,
  bins: OFF,
})

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /* Landing: the boxes settle, then one CLI call crosses to the daemon. */
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { call: ON, duration: DUR.scale, ease: DRAW })
  },
  beats: (tl, beat) => {
    beat(0)

    // The socket lights; a request goes over and a response comes back.
    tl.to(s, { sock: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { request: ON, duration: DUR.grow, ease: DRAW })
    tl.to(s, { response: ON, duration: DUR.grow, ease: DRAW })
    beat(1)

    // The Codex side lights: one process, a thread per run.
    tl.to(s, { codex: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { rpc: ON, duration: DUR.draw, ease: DRAW })
    tl.to(s, { lanes: ON, duration: DUR.grow, ease: DRAW })
    beat(2)

    // The pin under Codex, and the binaries the CLI ships as.
    tl.to(s, { pin: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { bins: ON, duration: DUR.grow, ease: SETTLE })
    beat(3)
  },
})

/* ── Derived marks ── */
const step = computed(() => STEPS[Math.min(Math.max(clicks.value, 0), STEPS.length - 1)])
const calling = computed(() => s.call > OFF && s.call < ON)
/** The CLI is on screen while it runs, and when a beat is about it. */
const cliOpacity = computed(() =>
  String(calling.value ? ON : DIM + (ON - DIM) * clamp01(s.sock - s.codex + s.pin)),
)
const daemonHot = computed(() => s.sock < 0.5)
const sockHot = computed(() => s.sock > 0.5 && s.codex < 0.5)
const codexHot = computed(() => s.codex > 0.5 && s.pin < 0.5)
const sockNotes = computed(() => String(s.sock * (ON - (ON - DIM) * s.codex)))
const methods = computed(() => String(s.codex * (ON - (ON - DIM) * s.pin)))
const laneProgress = (i: number) => stagger(s.lanes, i, lanes.length, 0.2)
const binProgress = (i: number) => stagger(s.bins, i, bins.length, 0.15)
const root = `claude-codex/src · ${SRC_LINES.toLocaleString('en-US')} lines`
const pinText = `Codex ${CODEX_VERSION} · ${SCHEMA_FILES} schema files, hashed`
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :style="{ opacity: String(s.frame) }">
        <path v-for="(w, i) in WIRES" :key="i" class="sf-wire" :d="polyline(w)" />

        <!-- Claude Code -->
        <rect class="sf-box" :x="CLAUDE.x" :y="CLAUDE.y" :width="CLAUDE.w" :height="CLAUDE.h" />
        <text class="sf-name" :x="CLAUDE.x + CLAUDE.w / 2" :y="CLAUDE.y + 64" text-anchor="middle">Claude Code</text>
        <text class="sf-mono is-small" :x="CLAUDE.x + CLAUDE.w / 2" :y="CLAUDE.y + 100" text-anchor="middle">runs a command</text>

        <!-- The CLI: one process per command -->
        <g :style="{ opacity: cliOpacity, color: PINK }">
          <rect class="sf-box" :class="{ 'is-lit': calling }" :x="CLI.x" :y="CLI.y" :width="CLI.w" :height="CLI.h" />
          <text class="sf-mono" :x="CLI.x + CLI.w / 2" :y="CLI.y + 64" text-anchor="middle">foreman</text>
          <text class="sf-mono is-small" :x="CLI.x + CLI.w / 2" :y="CLI.y + 100" text-anchor="middle">the CLI</text>
        </g>

        <!-- The socket -->
        <g :style="{ color: PLUMB }">
          <rect class="sf-box is-well" :class="{ 'is-lit': sockHot }" :x="SOCK.x" :y="SOCK.y" :width="SOCK.w" :height="SOCK.h" />
          <text class="sf-mono" :x="SOCK_MID" :y="SOCK.y + 58" text-anchor="middle" :style="{ fill: sockHot ? PLUMB : undefined }">Unix socket</text>
        </g>
        <g :style="{ opacity: sockNotes }">
          <text class="sf-mono is-small" :x="SOCK_MID" :y="SOCK.y + SOCK.h + 66" text-anchor="middle" :style="{ fill: PLUMB }">{{ SOCKET_PATH }}</text>
          <text class="sf-mono is-small" :x="SOCK_MID" :y="SOCK.y + SOCK.h + 104" text-anchor="middle">request {{ REQUEST_FRAME }}</text>
          <text class="sf-mono is-small" :x="SOCK_MID" :y="SOCK.y + SOCK.h + 132" text-anchor="middle">response {{ RESPONSE_FRAME }}</text>
        </g>

        <!-- The daemon, with the supervisor inside it -->
        <g :style="{ color: PINK }">
          <rect class="sf-box" :class="{ 'is-lit': daemonHot }" :x="DAEMON.x" :y="DAEMON.y" :width="DAEMON.w" :height="DAEMON.h" />
          <text class="sf-name" :x="DAEMON.x + DAEMON.w / 2" :y="DAEMON.y + 44" text-anchor="middle">daemon</text>
          <rect class="sf-box is-well" :x="SUP.x" :y="SUP.y" :width="SUP.w" :height="SUP.h" />
          <text class="sf-mono" :x="DAEMON.x + DAEMON.w / 2" :y="SUP.y + 36" text-anchor="middle">supervisor</text>
          <text class="sf-mono is-small" :x="DAEMON.x + DAEMON.w / 2" :y="DAEMON.y + 156" text-anchor="middle">keeps running</text>
        </g>

        <!-- codex app-server and a thread per run -->
        <g :style="{ color: DATA }">
          <rect class="sf-box" :class="{ 'is-lit': codexHot }" :x="CODEX.x" :y="CODEX.y" :width="CODEX.w" :height="CODEX.h" />
          <text class="sf-mono" :x="CODEX.x + CODEX.w / 2" :y="CODEX.y + 56" text-anchor="middle">{{ CODEX_COMMAND }}</text>
          <text class="sf-mono is-small" :x="CODEX.x + CODEX.w / 2" :y="CODEX.y + 92" text-anchor="middle">{{ CODEX_ARGS }}</text>
          <g v-for="lane in lanes" :key="lane.i" :style="{ opacity: String(DIM + (ON - DIM) * laneProgress(lane.i)) }">
            <path class="sf-wire" :d="polyline(lane.path)" />
            <rect class="sf-box" :class="{ 'is-lit': codexHot && laneProgress(lane.i) > 0.5 }" :x="LANE.x" :y="lane.y" :width="LANE.w" :height="LANE.h" />
            <text class="sf-mono is-small" :x="LANE.x + LANE.w / 2" :y="lane.y + 29" text-anchor="middle">{{ lane.name }}</text>
          </g>
        </g>
        <g :style="{ opacity: methods }">
          <text v-for="(m, i) in RPC_METHODS" :key="m" class="sf-mono is-small" :x="CODEX.x + 4" :y="CODEX.y - 72 + i * 27" :style="{ fill: DATA }">{{ m }}</text>
        </g>

        <!-- The pin -->
        <g :style="{ opacity: String(s.pin), color: LOCKED }">
          <rect class="sf-box is-lit" :x="PIN.x" :y="PIN.y" :width="PIN.w" :height="PIN.h" />
          <text class="sf-mono is-small" :x="PIN.x + PIN.w / 2" :y="PIN.y + 29" text-anchor="middle" :style="{ fill: LOCKED }">{{ pinText }}</text>
        </g>

        <!-- One binary per platform -->
        <path class="sf-wire" :d="polyline(TO_BINS)" stroke-dasharray="4 8" :style="{ opacity: String(s.bins) }" />
        <g v-for="(b, i) in bins" :key="b.name" :style="{ opacity: String(binProgress(i)), transform: `translate(0, ${(ON - binProgress(i)) * -12}px)` }">
          <rect class="sf-box is-well" :x="b.x" :y="b.y" :width="BIN.w" :height="BIN.h" />
          <text class="sf-mono is-small" :x="b.x + BIN.w / 2" :y="b.y + 27" text-anchor="middle">{{ b.name }}</text>
        </g>

        <!-- Packets -->
        <PacketPath :points="CALL" :progress="s.call" :color="PINK" />
        <PacketPath :points="REQUEST" :progress="s.request" :color="PLUMB" :label="REQUEST_FRAME" />
        <PacketPath :points="RESPONSE" :progress="s.response" :color="PLUMB" :label="RESPONSE_FRAME" />
        <PacketPath :points="RPC" :progress="s.rpc" :color="DATA" />
        <PacketPath v-for="lane in lanes" :key="lane.i" :points="lane.path" :progress="laneProgress(lane.i)" :color="DATA" :radius="7" />
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">foreman is a short-lived CLI and a daemon.</h2>
      <NamePlate id="foreman" chip-only />
      <EvidenceTag kind="schematic" :x="CLAUDE.x" :y="206" :progress="s.frame" />
      <RepoTree :nodes="TREE" :lit="step.lit" :focus="step.focus" :reveal="s.frame" :x="TREE_BOX.x" :y="TREE_BOX.y" :width="TREE_BOX.width" :root="root" />
      <ThreadRail current="foreman" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
