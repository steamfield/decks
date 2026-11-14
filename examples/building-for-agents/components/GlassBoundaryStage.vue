<script setup lang="ts">
/**
 * Slide 12: Rust collects the data and TypeScript draws it.
 *
 * The repo breakaway for StatGlass. Rust crates on the left, the TypeScript
 * layers on the right, and between them the one generated file both sides
 * agree on. A bar under the headline shows the two languages by line count,
 * split at the seam.
 *
 * Five beats. On entry the columns draw and the bar grows from the seam. The
 * first click lights the seam and shows one command on both sides of it. The
 * second sends a sample from the sampler, through the ring, across the seam
 * as a frame message. The third carries it on through the reducer and the
 * store to a widget, whose chart slides one slot per tick, beside the one
 * animation call that does it. The fourth stops the sample at the seam: with
 * no window open only the menu bar item, drawn in Rust, is running.
 *
 * The diagram is a schematic and the chart's values are illustrative; the
 * chart's motion is the beat timeline's, so stepping back redraws the same
 * frame.
 */
import { computed, reactive } from 'vue'
import { DUR, SETTLE, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, polyline, type Pt } from './design'
import {
  CHART_START,
  CHART_WINDOW,
  COMMANDS,
  EVENTS,
  FRAME_MESSAGE,
  IDLE,
  RUST_BOXES,
  RUST_LINES,
  RUST_PERCENT,
  SEAM_FILE,
  TRAY_BOX,
  TS_BOXES,
  TS_LINES,
  TS_PERCENT,
  cpuAt,
} from '../data/12-glass-boundary'
import { SUBSCRIBE_LIVE_RUST, SUBSCRIBE_LIVE_TS, TICK_SCROLL } from '../data/code/12-glass-boundary'

const COPY = [
  {
    lead: `StatGlass is ${RUST_PERCENT} percent Rust by lines.`,
    body: 'Rust has the samplers, the SQLite store, remote hosts and the menu bar item. The React UI is TypeScript.',
  },
  {
    lead: 'tauri-specta generates bindings.ts.',
    body: `It writes ${COMMANDS} commands and ${EVENTS} events from the Rust source. A pre-push hook fails if the file is stale.`,
  },
  {
    lead: 'Rust sends samples over a Tauri Channel.',
    body: 'Each tick is one message whose values are an array, ordered by a layout sent earlier.',
  },
  {
    lead: 'Each tick runs one transform animation.',
    body: 'd3 computes the path and React renders it as SVG. The animation slides the redrawn chart one slot.',
  },
  {
    lead: `Idle CPU was ${IDLE.cpuPercent} percent of one core.`,
    body: `Rust draws the menu bar item. Measured once, ${IDLE.state}, on an ${IDLE.machine} in ${IDLE.month}.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
const SEAM_X = 960
/** The proportion bar: Rust runs left from the seam, TypeScript right. */
const BAR = { y: 196, h: 18, rust: 850, labelY: 242, gap: 16 }
const BAR_TS = (BAR.rust * TS_LINES) / RUST_LINES

const TOP = 276
const BOTTOM = 690
const RUST = { x: 110, w: 590, h: 104, gap: 51, text: 24, bus: 660 }
const TS = { x: 1220, w: 590, h: 64, gap: 16, text: 76, bus: 1260 }
const STORE_W = 320
const TRAY = { x: 450, w: 250 }
const RISER_X = 1180
const NODE = 6
/** Advance of one mono character at the box-title size, for placing notes. */
const MONO_ADVANCE = 12.6
/** Mirror of --sf-faint: the chart's area under its line. */
const FAINT = 0.22

const rustY = (i: number) => TOP + i * (RUST.h + RUST.gap)
const rustBoxes = RUST_BOXES.map((box, i) => ({
  ...box,
  x: RUST.x,
  y: rustY(i),
  w: box.id === 'store' ? STORE_W : RUST.w,
}))
const tray = { ...TRAY_BOX, x: TRAY.x, y: rustY(2), w: TRAY.w }
const tsBoxes = TS_BOXES.map((box, i) => {
  const y = TOP + i * (TS.h + TS.gap)
  return {
    ...box,
    y,
    h: box.id === 'widgets' ? BOTTOM - y : TS.h,
    noteX: TS.x + TS.text + box.name.length * MONO_ADVANCE + 20,
  }
})
const mid = (i: number) => rustY(i) + RUST.h / 2
const tsMid = (i: number) => TOP + i * (TS.h + TS.gap) + TS.h / 2

/** Sampler, ring, across the seam, into the transport. */
const TO_TRANSPORT: Pt[] = [
  [RUST.bus, mid(0)],
  [RUST.bus, mid(1)],
  [RISER_X, mid(1)],
  [RISER_X, tsMid(0)],
  [TS.bus, tsMid(0)],
]
/** Transport, reducer, store, widget. */
const TO_WIDGET: Pt[] = [
  [TS.bus, tsMid(0)],
  [TS.bus, tsMid(1)],
  [TS.bus, tsMid(2)],
  [TS.bus, tsMid(3)],
]
/** With no window open the sample gets as far as the seam. */
const TO_SEAM: Pt[] = [
  [RUST.bus, mid(0)],
  [RUST.bus, mid(1)],
  [SEAM_X, mid(1)],
]
const TO_STORE: Pt[] = [
  [RUST.x + STORE_W / 2, rustY(1) + RUST.h],
  [RUST.x + STORE_W / 2, rustY(2)],
]
const TO_TRAY: Pt[] = [
  [RUST.bus, rustY(1) + RUST.h],
  [RUST.bus, rustY(2)],
]
const nodes: Pt[] = [...TO_TRANSPORT.slice(0, 2), ...TO_WIDGET]

const TILE = { x: 785, y: TOP, w: 350, h: 46 }
const MSG = { x: 755, y: 408, w: 410, h: 46 }
const IDLE_CHIP = { x: 740, y: rustY(2), w: 430, h: RUST.h }
const CHART = { x: TS.x + TS.text, y: 582, w: 490, h: 94 }
const SLOT = CHART.w / (CHART_WINDOW - 1)

/** The two panes of the first click fill the right side under the seam tile. */
const CODE_RUST = { x: 840, y: 334, width: 970, height: 378 }
const CODE_TS = { x: 840, y: 722, width: 970, height: 228 }
/** A little wider than the others: its longest line is 74 characters. */
const CODE_TICK = { x: 816, y: 734, width: 994, height: 216 }

const DATA = ink('cyan', 2)
const RUST_INK = ink('cyan', 1)
const TS_INK = ink('slate', 2)
const PLUMB = ink('violet', 3)
const ACTOR = ink('rose', 2)
const FIGURE = ink('amber', 2)

/** Beat state. Every field is 0..1 except `t`, a (fractional) sample number. */
const s = reactive({
  frame: OFF,
  bar: OFF,
  rust: ON,
  ts: ON,
  seam: OFF,
  code1: OFF,
  toTransport: OFF,
  msg: OFF,
  toWidget: OFF,
  chart: OFF,
  code3: OFF,
  t: CHART_START,
  toSeam: OFF,
  idle: OFF,
})

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { bar: ON, duration: DUR.scale, ease: SETTLE }, `-=${DUR.card}`)
  },
  beats: (tl, beat) => {
    beat(0)

    // The seam lights; the right side gives way to one command, both sides.
    tl.to(s, { rust: DIM, ts: OFF, duration: DUR.card, ease: SETTLE })
    tl.to(s, { seam: ON, code1: ON, duration: DUR.card, ease: SETTLE })
    beat(1)

    // A sample leaves the sampler, passes the ring and crosses as a frame.
    tl.to(s, { code1: OFF, seam: OFF, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { rust: ON, ts: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { toTransport: ON, duration: DUR.scale, ease: 'none' })
    tl.to(s, { msg: ON, duration: DUR.card, ease: SETTLE }, `-=${DUR.grow}`)
    beat(2)

    // On through the reducer and the store to a widget; its chart ticks.
    tl.to(s, { rust: DIM, msg: DIM, duration: DUR.card, ease: SETTLE })
    tl.to(s, { toWidget: ON, duration: DUR.grow, ease: 'none' })
    tl.to(s, { chart: ON, code3: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { t: CHART_START + 4, duration: DUR.trace, ease: 'none' })
    beat(3)

    // No window: the stream stops at the seam and the menu bar item stays.
    tl.to(s, { code3: OFF, msg: OFF, ts: DIM, rust: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { toSeam: ON, duration: DUR.grow, ease: 'none' })
    tl.to(s, { idle: ON, duration: DUR.card, ease: SETTLE })
    beat(4)
  },
})

/* ── Derived marks ── */
const n = (value: number) => value.toLocaleString('en-US')
const op = (value: number) => String(value)
const route = computed(() => op(Math.min(s.rust, s.ts) * s.frame))
const awake = computed(() => s.idle < 0.5)
const REACHED = 0.999
const lit = computed<Record<string, boolean>>(() => ({
  collect: s.toTransport > OFF,
  engine: s.toTransport > 0.17,
  transport: s.toTransport > REACHED && awake.value,
  reducer: s.toWidget > 0.33 && awake.value,
  stores: s.toWidget > 0.66 && awake.value,
  widgets: s.toWidget > REACHED && awake.value,
}))
const isLit = (id: string) => lit.value[id] ?? false

/** The chart at sample `t`: one slot wider than its box on each side, clipped. */
const chart = computed(() => {
  const last = Math.floor(s.t) + 1
  const points: Pt[] = []
  for (let k = last - CHART_WINDOW - 1; k <= last; k++) {
    points.push([CHART.x + CHART.w - (s.t - k) * SLOT, CHART.y + CHART.h - (cpuAt(k) / 100) * CHART.h])
  }
  const base = CHART.y + CHART.h
  const line = polyline(points)
  return { line, area: `${line} L${points[points.length - 1][0]} ${base} L${points[0][0]} ${base} Z` }
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <defs>
        <clipPath id="glass-boundary-chart">
          <rect :x="CHART.x" :y="CHART.y - 4" :width="CHART.w" :height="CHART.h + 4" />
        </clipPath>
      </defs>

      <!-- ── Rust against TypeScript, by lines, split at the seam ── -->
      <g :style="{ opacity: op(s.frame) }">
        <rect :x="SEAM_X - BAR.rust * s.bar" :y="BAR.y" :width="BAR.rust * s.bar" :height="BAR.h" :fill="RUST_INK" />
        <rect :x="SEAM_X" :y="BAR.y" :width="BAR_TS * s.bar" :height="BAR.h" :fill="TS_INK" />
        <line :x1="SEAM_X" :x2="SEAM_X" :y1="BAR.y - 6" :y2="BAR.y + BAR.h + 6" :stroke="PLUMB" stroke-width="3" />
        <g :style="{ opacity: op(s.bar) }">
          <text class="sf-mono is-small" :x="SEAM_X - BAR.gap" :y="BAR.labelY" text-anchor="end">
            <tspan :fill="RUST_INK">Rust</tspan> · {{ n(RUST_LINES) }} lines · {{ RUST_PERCENT }}%
          </text>
          <text class="sf-mono is-small" :x="SEAM_X + BAR.gap" :y="BAR.labelY">
            {{ TS_PERCENT }}% · {{ n(TS_LINES) }} lines · <tspan :fill="TS_INK">TypeScript</tspan>
          </text>
        </g>
      </g>

      <!-- ── The route a sample takes ── -->
      <g :style="{ opacity: route }">
        <path class="sf-wire" :d="polyline(TO_TRANSPORT)" />
        <path class="sf-wire" :d="polyline(TO_WIDGET)" />
      </g>
      <g :style="{ opacity: op(s.rust * s.frame) }">
        <path class="sf-wire" :d="polyline(TO_STORE)" />
        <path class="sf-wire" :d="polyline(TO_TRAY)" />
      </g>

      <!-- ── The seam: a line, and the generated file on it ── -->
      <g :style="{ opacity: op(s.frame) }">
        <line
          :x1="SEAM_X"
          :x2="SEAM_X"
          :y1="TILE.y + TILE.h"
          :y2="BOTTOM"
          :stroke="PLUMB"
          stroke-width="2"
          stroke-dasharray="6 10"
          :style="{ opacity: op((ON - s.code1) * (ON - s.idle)) }"
        />
        <g :style="{ color: PLUMB }">
          <rect class="sf-box is-well" :class="{ 'is-lit': s.seam > 0.5 }" :x="TILE.x" :y="TILE.y" :width="TILE.w" :height="TILE.h" />
          <text class="sf-mono is-small" :x="SEAM_X" :y="TILE.y + 30" text-anchor="middle" :style="{ fill: s.seam > 0.5 ? PLUMB : undefined }">
            {{ SEAM_FILE }}
          </text>
        </g>
      </g>

      <!-- ── Rust ── -->
      <g :style="{ opacity: op(s.rust * s.frame), color: DATA }">
        <g v-for="box in rustBoxes" :key="box.id">
          <rect class="sf-box" :class="{ 'is-lit': isLit(box.id) }" :x="box.x" :y="box.y" :width="box.w" :height="RUST.h" />
          <text class="sf-mono" :x="box.x + RUST.text" :y="box.y + 44">{{ box.name }}</text>
          <text class="sf-mono is-small" :x="box.x + RUST.text" :y="box.y + 76">{{ box.note }}</text>
        </g>
      </g>
      <g :style="{ opacity: op(s.rust * s.frame), color: ACTOR }">
        <rect class="sf-box" :class="{ 'is-lit': s.idle > 0.5 }" :x="tray.x" :y="tray.y" :width="tray.w" :height="RUST.h" />
        <text class="sf-mono" :x="tray.x + RUST.text" :y="tray.y + 44">{{ tray.name }}</text>
        <text class="sf-mono is-small" :x="tray.x + RUST.text" :y="tray.y + 76">{{ tray.note }}</text>
      </g>

      <!-- ── TypeScript ── -->
      <g :style="{ opacity: op(s.ts * s.frame), color: DATA }">
        <g v-for="box in tsBoxes" :key="box.id">
          <rect class="sf-box" :class="{ 'is-lit': isLit(box.id) }" :x="TS.x" :y="box.y" :width="TS.w" :height="box.h" />
          <text class="sf-mono" :x="TS.x + TS.text" :y="box.y + 40">{{ box.name }}</text>
          <text class="sf-mono is-small" :x="box.noteX" :y="box.y + 40">{{ box.note }}</text>
        </g>
        <!-- The widget's chart: illustrative values, one slot per tick. -->
        <g :style="{ opacity: op(s.chart) }" clip-path="url(#glass-boundary-chart)">
          <path :d="chart.area" :fill="DATA" :style="{ opacity: op(FAINT) }" />
          <path :d="chart.line" fill="none" :stroke="DATA" stroke-width="3" stroke-linejoin="round" />
        </g>
        <line
          :x1="CHART.x"
          :x2="CHART.x + CHART.w"
          :y1="CHART.y + CHART.h"
          :y2="CHART.y + CHART.h"
          :stroke="TS_INK"
          stroke-width="2"
          :style="{ opacity: op(s.chart) }"
        />
      </g>

      <!-- Stops along the route -->
      <g :style="{ opacity: route }">
        <circle v-for="(p, i) in nodes" :key="i" :cx="p[0]" :cy="p[1]" :r="NODE" fill="none" :stroke="TS_INK" stroke-width="2" />
      </g>

      <!-- ── The frame message, as it crosses ── -->
      <g :style="{ opacity: op(s.msg) }">
        <rect class="sf-box is-well" :x="MSG.x" :y="MSG.y" :width="MSG.w" :height="MSG.h" />
        <text class="sf-mono is-small" :x="SEAM_X" :y="MSG.y + 30" text-anchor="middle" :style="{ fill: DATA }">{{ FRAME_MESSAGE }}</text>
      </g>

      <!-- ── Idle: the figure, beside the one thing still running ── -->
      <g :style="{ opacity: op(s.idle) }">
        <rect class="sf-box is-well" :x="IDLE_CHIP.x" :y="IDLE_CHIP.y" :width="IDLE_CHIP.w" :height="IDLE_CHIP.h" />
        <text class="sf-name" :x="IDLE_CHIP.x + 24" :y="IDLE_CHIP.y + 46" :style="{ fill: FIGURE }">{{ IDLE.cpuPercent }}% of one core</text>
        <text class="sf-mono is-small" :x="IDLE_CHIP.x + 24" :y="IDLE_CHIP.y + 80">{{ IDLE.state }} · one run · {{ IDLE.date }}</text>
        <circle :cx="SEAM_X" :cy="mid(1)" r="9" :fill="DATA" :style="{ opacity: op(s.toSeam > REACHED ? ON : OFF) }" />
      </g>

      <!-- Samples in flight -->
      <PacketPath :points="TO_TRANSPORT" :progress="s.toTransport" :color="DATA" />
      <PacketPath :points="TO_WIDGET" :progress="s.toWidget" :color="DATA" />
      <PacketPath :points="TO_SEAM" :progress="s.toSeam" :color="DATA" />
    </template>

    <template #overlay>
      <h2 class="od-story-head">Rust collects the data and TypeScript draws it.</h2>
      <NamePlate id="statglass" chip-only />
      <EvidenceTag kind="schematic" :x="TS.x + TS.w" :y="224" align="right" :progress="s.frame" />
      <EvidenceTag kind="illustrative" :x="TS.x + TS.w - 12" :y="tsBoxes[3].y + 12" align="right" :progress="s.chart * s.ts" />

      <CodePane :excerpt="SUBSCRIBE_LIVE_RUST" :progress="s.code1" :size="21" v-bind="CODE_RUST" />
      <CodePane :excerpt="SUBSCRIBE_LIVE_TS" :progress="s.code1" :size="21" v-bind="CODE_TS" />
      <CodePane :excerpt="TICK_SCROLL" :progress="s.code3" :size="21" v-bind="CODE_TICK" />
      <ThreadRail current="statglass" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
