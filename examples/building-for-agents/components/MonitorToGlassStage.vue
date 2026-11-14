<script setup lang="ts">
/**
 * Slide 11: StatGlass started as the rr monitor command.
 *
 * Three host cards, twice. First as `rr monitor` draws them, on a terminal:
 * a recording of three hosts during one `rr test` run, played to its busiest
 * frame. Then the terminal goes and the same three hosts are redrawn the way
 * StatGlass shows a host, under a menu bar.
 *
 * Under the cards is how far back each one remembers. The first click fills
 * rr monitor's ring buffer. The second extends the line left, on a log scale,
 * through StatGlass's retention tiers.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON } from './design'
import {
  AXIS_TICKS,
  BUSIEST,
  GRAPH_COLS,
  HISTORY_MINUTES,
  HISTORY_SAMPLES,
  RECORDED,
  RETENTION,
  RETENTION_DAYS,
  THRESHOLDS,
  cardsAt,
  formatLockDuration,
  formatPercent,
  resample,
  severity,
  type Severity,
} from '../data/11-monitor-to-glass'

const COPY = [
  {
    lead: 'rr monitor shows each host in a terminal.',
    body: "Each card has CPU, memory, latency and the command holding the host's lock, read over SSH.",
  },
  {
    lead: `rr monitor keeps ${HISTORY_SAMPLES} samples per metric.`,
    body: `That is ${HISTORY_MINUTES} minutes at one sample a second, held in memory until rr monitor exits.`,
  },
  {
    lead: `StatGlass keeps up to ${RETENTION_DAYS} days.`,
    body: "It is a menu bar app for Apple Silicon Macs that stores each host's history in SQLite.",
  },
]

/* ── Geometry, in stage viewBox units ── */
const TERM = { x: 110, y: 196, w: 1700, h: 404 }
const CARD = { x: 148, y: 224, w: 528, h: 304, gap: 20, pad: 20 }
/** Baselines and rules inside a monitor card, from its top. */
const LINE = { host: 40, command: 74, rule1: 92, cpu: 126, plot: 196, rule2: 212, ram: 246, lat: 280 }
/** One braille dot: its row pitch and its drawn size. */
const DOT = { pitch: 7, size: 4.4 }
const MENU = { x: 110, y: 196, w: 1700, h: 38 }
const GLASS = { y: 250, h: 302, pad: 22, name: 44, row: 66, rowPitch: 76, chart: 42, points: 64 }
/** The history line: rr monitor's buffer at the right end, StatGlass's tiers to its left. */
const AXIS = { x0: 110, x1: 1510, x2: 1810, y: 646, h: 14, label: 632, note: 690 }
const TAG_Y = 562

const cardX = (i: number) => CARD.x + i * (CARD.w + CARD.gap)

const PINK = ink('rose', 2)
const DATA = ink('cyan', 2)
const PLUMB = ink('violet', 3)
const WAIT = ink('amber', 2)
const NEUTRAL = ink('slate', 1)
const QUIET = ink('slate', 2)
const BRIGHT = 'var(--od-text)'
/** The monitor's own colors for a reading: cyan, purple, pink. */
const SEVERITY: Record<Severity, string> = { healthy: DATA, warning: PLUMB, critical: PINK }

/** Beat state. `frame` is an index into the recording; the rest are 0..1. */
const s = reactive({ shell: OFF, frame: OFF, buffer: OFF, chip: OFF, glass: OFF, cards: OFF, reach: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /* Landing: the terminal comes up and the recording plays to its busiest frame. */
  enter: (tl) => {
    tl.to(s, { shell: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { frame: BUSIEST, duration: DUR.scale, ease: 'none' }, '<')
  },
  beats: (tl, beat) => {
    beat(0)

    // The ring buffer fills to its end and stops.
    tl.to(s, { buffer: ON, duration: DUR.scale, ease: 'none' })
    tl.to(s, { chip: ON, duration: DUR.card, ease: SETTLE })
    beat(1)

    // The terminal goes, the same hosts come back as StatGlass cards, and the
    // history line runs left through thirty days.
    tl.to(s, { glass: ON, duration: DUR.color, ease: SETTLE })
    tl.to(s, { cards: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { reach: ON, duration: DUR.scale, ease: DRAW })
    beat(2)
  },
})

/* ── The monitor cards at the current frame ── */
const cards = computed(() => cardsAt(s.frame))

const plotWidth = CARD.w - CARD.pad * 2
const subPitch = plotWidth / (GRAPH_COLS * 2)

const monitor = computed(() =>
  cards.value.map((card, i) => {
    const x = cardX(i)
    const f = card.frame
    // One dashed vertical line per sub-column, grouped by color: the dash is the dot.
    const paths = new Map<string, string>()
    card.plot.heights.forEach((height, sub) => {
      if (height === 0) return
      const color = SEVERITY[severity(card.plot.columnMax[Math.floor(sub / 2)] ?? 0, THRESHOLDS.cpu)]
      const px = x + CARD.pad + (sub + 0.5) * subPitch
      const bottom = CARD.y + LINE.plot
      paths.set(color, `${paths.get(color) ?? ''}M${px} ${bottom}V${bottom - height * DOT.pitch}`)
    })
    return {
      name: card.name,
      x,
      alias: f.alias,
      running: f.status === 'running',
      status: f.status === 'running' ? ` - running ${formatLockDuration(f.heldMs)}` : ` - ${f.status}`,
      command: f.command,
      cpu: { text: formatPercent(f.cpu).trim(), color: SEVERITY[severity(f.cpu, THRESHOLDS.cpu)] },
      load: `1m:${f.load1.toFixed(1)}`,
      ram: { text: formatPercent(f.ram).trim(), color: SEVERITY[severity(f.ram, THRESHOLDS.ram)] },
      latency: f.latency > 0 ? `${f.latency.toFixed(0)}ms` : '',
      plot: [...paths].map(([color, d]) => ({ color, d })),
    }
  }),
)

/* ── The same hosts as StatGlass draws a host ── */
const chartWidth = CARD.w - GLASS.pad * 2
function area(values: readonly number[], x: number, baseline: number) {
  const points = resample(values.length > 1 ? values : [0, 0], GLASS.points)
  const step = chartWidth / (points.length - 1)
  const line = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(x + i * step).toFixed(1)} ${(baseline - (Math.min(100, v) / 100) * GLASS.chart).toFixed(1)}`)
    .join('')
  return { line, fill: `${line}L${x + chartWidth} ${baseline}L${x} ${baseline}Z` }
}

const glass = computed(() =>
  cards.value.map((card, i) => {
    const x = cardX(i)
    const rows = [
      { label: 'CPU', value: card.frame.cpu, values: card.cpu, color: DATA },
      { label: 'Memory', value: card.frame.ram, values: card.ram, color: PLUMB },
      { label: 'GPU', value: card.frame.gpu ?? 0, values: card.gpu, color: PINK },
    ].map((row, k) => {
      const top = GLASS.y + GLASS.row + k * GLASS.rowPitch
      return { ...row, top, text: `${Math.round(row.value)}%`, ...area(row.values, x + GLASS.pad, top + 24 + GLASS.chart) }
    })
    return { name: card.name, x, holder: card.frame.command ? `rr: ${card.frame.command}` : '', rows }
  }),
)

/** The menu bar item: this machine's CPU, as a few bars and a number. */
const menuItem = computed(() => {
  const local = cards.value.find((card) => card.frame.latency === 0) ?? cards.value[0]
  const recent = resample(local?.cpu.slice(-12) ?? [0], 5)
  return { text: `${Math.round(local?.frame.cpu ?? 0)}%`, bars: recent.map((v) => Math.max(2, (v / 100) * 18)) }
})

/* ── The history line ── */
const span = AXIS.x1 - AXIS.x0
const lastMinutes = RETENTION.at(-1)?.minutes ?? 1
/** A log scale from rr monitor's ten minutes, at x1, back to the last tier, at x0. */
const axisX = (minutes: number) =>
  AXIS.x1 - (Math.log(minutes / HISTORY_MINUTES) / Math.log(lastMinutes / HISTORY_MINUTES)) * span
const ticks = AXIS_TICKS.map((tick) => ({ ...tick, x: axisX(tick.minutes) }))
const TIER_LEVEL = [ON, 0.72, DIM]
const tiers = RETENTION.map((tier, i) => {
  const right = i === 0 ? AXIS.x1 : axisX(RETENTION[i - 1]?.minutes ?? HISTORY_MINUTES)
  const left = axisX(tier.minutes)
  return { ...tier, left, right, mid: (left + right) / 2, level: TIER_LEVEL[i] ?? DIM }
})
/** How much of a tier the reach has uncovered, growing leftward from x1. */
const reachX = computed(() => AXIS.x1 - s.reach * span)
const tierShown = (tier: { left: number; right: number }) => {
  const from = Math.max(tier.left, reachX.value)
  return { x: from, width: Math.max(0, tier.right - from) }
}
const passed = (x: number) => (reachX.value <= x + 1 ? ON : OFF)

const terminal = computed(() => String(s.shell * (ON - s.glass)))
/** The buffer's segment is what the last beat is no longer about. */
const bufferLevel = computed(() => String(ON - s.reach * (ON - DIM)))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- ── rr monitor, on a terminal (a recording) ── -->
      <CrtFrame
        :x="TERM.x"
        :y="TERM.y"
        :width="TERM.w"
        :height="TERM.h"
        :tag="`Recorded ${RECORDED} · rr monitor, during one rr test run · rr/site/fixtures/monitor.jsonl`"
        :progress="Number(terminal)"
      >
        <g v-for="m in monitor" :key="m.name">
          <rect class="mg-card" :x="m.x" :y="CARD.y" :width="CARD.w" :height="CARD.h" />
          <circle :cx="m.x + CARD.pad + 8" :cy="CARD.y + LINE.host - 10" r="8" :fill="m.running ? WAIT : DATA" />
          <text class="sf-term" :x="m.x + CARD.pad + 26" :y="CARD.y + LINE.host">
            <tspan :style="{ fill: BRIGHT }">{{ m.name }}</tspan><tspan :style="{ fill: m.running ? WAIT : QUIET }">{{ m.status }}</tspan>
          </text>
          <text class="sf-term" :x="m.x + CARD.w - CARD.pad" :y="CARD.y + LINE.host" text-anchor="end" :style="{ fill: QUIET }">{{ m.alias }}</text>
          <text class="sf-term" :x="m.x + CARD.pad + 26" :y="CARD.y + LINE.command" :style="{ fill: QUIET }">&gt; {{ m.command }}</text>
          <line class="mg-rule" :x1="m.x + CARD.pad" :x2="m.x + CARD.w - CARD.pad" :y1="CARD.y + LINE.rule1" :y2="CARD.y + LINE.rule1" />

          <text class="sf-term" :x="m.x + CARD.pad" :y="CARD.y + LINE.cpu">CPU</text>
          <text class="sf-term" :x="m.x + CARD.w - CARD.pad" :y="CARD.y + LINE.cpu" text-anchor="end">
            <tspan :style="{ fill: m.cpu.color }">{{ m.cpu.text }}</tspan><tspan :style="{ fill: QUIET }" dx="14">{{ m.load }}</tspan>
          </text>
          <path
            v-for="p in m.plot"
            :key="p.color"
            :d="p.d"
            fill="none"
            :stroke="p.color"
            :stroke-width="DOT.size"
            :stroke-dasharray="`${DOT.size} ${DOT.pitch - DOT.size}`"
          />
          <line class="mg-rule" :x1="m.x + CARD.pad" :x2="m.x + CARD.w - CARD.pad" :y1="CARD.y + LINE.rule2" :y2="CARD.y + LINE.rule2" />

          <text class="sf-term" :x="m.x + CARD.pad" :y="CARD.y + LINE.ram">RAM</text>
          <text class="sf-term" :x="m.x + CARD.w - CARD.pad" :y="CARD.y + LINE.ram" text-anchor="end" :style="{ fill: m.ram.color }">{{ m.ram.text }}</text>
          <g v-if="m.latency">
            <text class="sf-term" :x="m.x + CARD.pad" :y="CARD.y + LINE.lat">LAT</text>
            <text class="sf-term" :x="m.x + CARD.w - CARD.pad" :y="CARD.y + LINE.lat" text-anchor="end" :style="{ fill: DATA }">{{ m.latency }}</text>
          </g>
        </g>
      </CrtFrame>

      <!-- ── The same hosts in StatGlass (illustrative) ── -->
      <g :style="{ opacity: String(s.cards), transform: `translate(0, ${(ON - s.cards) * 12}px)` }">
        <rect class="sf-box is-well" :x="MENU.x" :y="MENU.y" :width="MENU.w" :height="MENU.h" />
        <text class="sf-mono is-small" :x="MENU.x + 20" :y="MENU.y + 25">menu bar</text>
        <text class="sf-mono is-small" :x="MENU.x + MENU.w - 132" :y="MENU.y + 25" text-anchor="end" :style="{ fill: BRIGHT }">StatGlass</text>
        <g :style="{ color: DATA }">
          <rect class="sf-box is-lit" :x="MENU.x + MENU.w - 120" :y="MENU.y + 5" width="108" :height="MENU.h - 10" />
          <rect
            v-for="(bar, k) in menuItem.bars"
            :key="k"
            :x="MENU.x + MENU.w - 110 + k * 7"
            :y="MENU.y + MENU.h - 9 - bar"
            width="5"
            :height="bar"
            :fill="DATA"
          />
          <text class="sf-mono is-small" :x="MENU.x + MENU.w - 20" :y="MENU.y + 25" text-anchor="end" :style="{ fill: DATA }">{{ menuItem.text }}</text>
        </g>

        <g v-for="g in glass" :key="g.name">
          <rect class="sf-box mg-glass" :x="g.x" :y="GLASS.y" :width="CARD.w" :height="GLASS.h" />
          <text class="sf-name" :x="g.x + GLASS.pad" :y="GLASS.y + GLASS.name">{{ g.name }}</text>
          <text class="sf-mono is-small" :x="g.x + CARD.w - GLASS.pad" :y="GLASS.y + GLASS.name - 2" text-anchor="end" :style="{ fill: WAIT }">{{ g.holder }}</text>
          <g v-for="row in g.rows" :key="row.label">
            <text class="sf-mono is-small" :x="g.x + GLASS.pad" :y="row.top + 16">{{ row.label }}</text>
            <text class="sf-mono is-small" :x="g.x + CARD.w - GLASS.pad" :y="row.top + 16" text-anchor="end" :style="{ fill: row.color }">{{ row.text }}</text>
            <path class="mg-area" :d="row.fill" :fill="row.color" />
            <path :d="row.line" fill="none" :stroke="row.color" stroke-width="2" stroke-linejoin="round" />
          </g>
        </g>
      </g>

      <!-- ── How far back each one remembers ── -->
      <g :style="{ opacity: String(s.buffer > OFF ? ON : OFF) }">
        <g :style="{ opacity: bufferLevel }">
          <text class="sf-mono is-small" :x="AXIS.x1" :y="AXIS.label">rr monitor</text>
          <rect class="mg-track" :x="AXIS.x1" :y="AXIS.y" :width="AXIS.x2 - AXIS.x1" :height="AXIS.h" rx="2" />
          <rect :x="AXIS.x1" :y="AXIS.y" :width="(AXIS.x2 - AXIS.x1) * s.buffer" :height="AXIS.h" rx="2" :fill="DATA" />
          <text class="sf-mono is-small" :x="AXIS.x2" :y="AXIS.note" text-anchor="end">{{ HISTORY_MINUTES }} min, in memory</text>
          <text class="sf-pixel is-fig" :x="AXIS.x2" :y="AXIS.label - 2" text-anchor="end" :style="{ opacity: String(s.chip) }">
            {{ HISTORY_SAMPLES }} samples
          </text>
        </g>
      </g>
      <g :style="{ opacity: String(s.reach > OFF ? ON : OFF) }">
        <rect class="mg-track" :x="reachX" :y="AXIS.y" :width="Math.max(0, AXIS.x1 - reachX - 4)" :height="AXIS.h" rx="2" />
        <g v-for="tier in tiers" :key="tier.through">
          <rect v-bind="tierShown(tier)" :y="AXIS.y" :height="AXIS.h" :fill="DATA" :style="{ opacity: String(tier.level) }" />
          <text class="sf-mono is-small" :x="tier.mid" :y="AXIS.note" text-anchor="middle" :style="{ opacity: String(passed(tier.left)) }">
            {{ tier.bucket }}
          </text>
        </g>
        <g v-for="(tick, k) in ticks" :key="tick.label" :style="{ opacity: String(passed(tick.x)) }">
          <line :x1="tick.x" :x2="tick.x" :y1="AXIS.y - 6" :y2="AXIS.y + AXIS.h + 6" :stroke="NEUTRAL" stroke-width="2" />
          <text
            class="sf-mono is-small"
            :x="tick.x"
            :y="AXIS.label"
            :text-anchor="k === ticks.length - 1 ? 'start' : 'middle'"
            :style="{ fill: BRIGHT }"
          >
            {{ tick.label }}
          </text>
        </g>
        <text class="sf-mono is-small" :x="AXIS.x1 - 16" :y="AXIS.note" text-anchor="end" :style="{ opacity: String(s.reach) }">log scale</text>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">StatGlass started as the rr monitor command.</h2>
      <NamePlate id="statglass" />
      <EvidenceTag kind="illustrative" :x="TERM.x + TERM.w" :y="TAG_Y" align="right" :progress="s.cards">
        Illustrative · the recording's readings, drawn as StatGlass cards
      </EvidenceTag>
      <ThreadRail current="statglass" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.mg-card {
  fill: none;
  stroke: var(--od-border-rule);
  stroke-width: var(--sf-hairline);
  rx: var(--sf-radius-control);
}
.mg-rule {
  stroke: var(--od-border-rule);
  stroke-width: var(--sf-hairline);
}
rect.sf-box.mg-glass { rx: calc(var(--sf-radius-card) * 2); }
.mg-area { fill-opacity: var(--sf-faint); }
.mg-track {
  fill: var(--od-border-rule);
  opacity: var(--sf-dim);
}
</style>
