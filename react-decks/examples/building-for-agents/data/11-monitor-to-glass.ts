/**
 * Slide 11: from rr monitor to StatGlass. Sourced in
 * data/sources/11-monitor-to-glass.md.
 *
 * The monitor cards replay a recording: ./fixtures/11-monitor.json holds the
 * 193 snapshots of ~/Projects/rr/site/fixtures/monitor.jsonl (rr commit
 * 9a0dab1, read 2026-11-13), one `rr monitor --once --json` snapshot per
 * line there and per array element here, otherwise unchanged. They were taken
 * during one `rr test` run in OpenData on 2026-11-02 (the same run as slide
 * 10's result event).
 *
 * The timeline functions are ported from
 * ~/Projects/rr/site/src/lib/monitor/timeline.ts (`buildTimeline`,
 * `busiestFrame`, `history`) and the text rendering from
 * ~/Projects/rr/site/src/lib/monitor/render.ts (`severity`, `resample`,
 * `sparkline`, `formatLockDuration`, `formatPercent`), rr commit 536948d.
 * Those in turn port rr/internal/monitor (graphs.go, card.go). Keep them in
 * step with the source; the packing and thinning helpers are not needed here
 * and were left behind.
 *
 * The StatGlass cards on the last beat redraw the same three hosts' readings
 * from this recording in the app's style. StatGlass did not record them, so
 * that beat is tagged Illustrative.
 *
 * FLAG: author-reported. That StatGlass came from keeping `rr monitor` open
 * is Riley's account. No repo records it; the notes say "I".
 */
import snapshots from './fixtures/11-monitor.json'

/* ── The timeline (rr/site/src/lib/monitor/timeline.ts) ── */

export type HostSample = {
  name: string
  alias?: string
  online: boolean
  error?: string
  latency_ms: number
  cpu?: { percent: number; cores: number; load: number[]; per_core?: number[] }
  ram?: { percent: number; used_bytes: number; total_bytes: number }
  gpu?: { name?: string; percent: number }
  disk?: { percent: number }
  net?: { rx_bytes_per_sec: number; tx_bytes_per_sec: number }
  lock?: { command: string; started?: string }
}

export type Snapshot = { timestamp: string; hosts: HostSample[] }

export type HostStatus = 'idle' | 'running' | 'offline'

export type HostFrame = {
  status: HostStatus
  alias: string
  /** The lock holder's command while running. */
  command: string
  /** How long the lock has been held at this frame, in ms. */
  heldMs: number
  cpu: number
  load1: number
  /** Per-core CPU, when the host reports it (Linux); absent on macOS hosts. */
  perCore?: number[]
  ram: number
  gpu: number | null
  disk: number | null
  latency: number
  rx: number
  tx: number
}

export type Frame = { atMs: number; hosts: Record<string, HostFrame> }

export type Timeline = {
  hosts: string[]
  frames: Frame[]
  /** Wall-clock length of the recording. */
  durationMs: number
}

function hostFrame(sample: HostSample | undefined, at: number): HostFrame {
  if (!sample?.online) {
    return {
      status: 'offline',
      alias: sample?.alias ?? '',
      command: '',
      heldMs: 0,
      cpu: 0,
      load1: 0,
      perCore: [],
      ram: 0,
      gpu: null,
      disk: null,
      latency: 0,
      rx: 0,
      tx: 0,
    }
  }
  const started = sample.lock?.started ? Date.parse(sample.lock.started) : Number.NaN
  return {
    status: sample.lock ? 'running' : 'idle',
    alias: sample.alias ?? '',
    command: sample.lock?.command ?? '',
    heldMs: Number.isNaN(started) ? 0 : Math.max(0, at - started),
    cpu: sample.cpu?.percent ?? 0,
    load1: sample.cpu?.load[0] ?? 0,
    perCore: sample.cpu?.per_core ?? [],
    ram: sample.ram?.percent ?? 0,
    gpu: sample.gpu ? sample.gpu.percent : null,
    disk: sample.disk ? sample.disk.percent : null,
    latency: sample.latency_ms,
    rx: sample.net?.rx_bytes_per_sec ?? 0,
    tx: sample.net?.tx_bytes_per_sec ?? 0,
  }
}

/** Host order: the order the first snapshot lists them, which the stage keeps fixed. */
export function buildTimeline(snaps: readonly Snapshot[], hostOrder?: readonly string[]): Timeline {
  if (snaps.length === 0) return { hosts: [], frames: [], durationMs: 0 }
  const start = Date.parse(snaps[0]?.timestamp ?? '')
  const hosts = hostOrder ? [...hostOrder] : (snaps[0]?.hosts.map((host) => host.name) ?? [])
  const frames = snaps.map((snap) => {
    const at = Date.parse(snap.timestamp)
    const byName = new Map(snap.hosts.map((host) => [host.name, host]))
    return {
      atMs: at - start,
      hosts: Object.fromEntries(hosts.map((name) => [name, hostFrame(byName.get(name), at)])),
    }
  })
  return { hosts, frames, durationMs: frames.at(-1)?.atMs ?? 0 }
}

/**
 * The frame shown without motion (server render, reduced motion): among frames
 * with the most hosts running, the one nearest 60% through the recording, so the
 * graphs have history behind them.
 */
export function busiestFrame(timeline: Timeline): number {
  const running = timeline.frames.map(
    (frame) => timeline.hosts.filter((host) => frame.hosts[host]?.status === 'running').length,
  )
  const most = Math.max(0, ...running)
  const target = timeline.durationMs * 0.6
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  timeline.frames.forEach((frame, i) => {
    if (running[i] !== most) return
    const distance = Math.abs(frame.atMs - target)
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  })
  return best
}

export type Metric = 'cpu' | 'ram' | 'gpu' | 'latency'

/** A host's metric history up to and including frame `index`, for its sparkline. */
export function history(timeline: Timeline, host: string, metric: Metric, index: number): number[] {
  const values: number[] = []
  for (const frame of timeline.frames.slice(0, index + 1)) {
    const value = frame.hosts[host]?.[metric]
    if (typeof value === 'number' && frame.hosts[host]?.status !== 'offline') values.push(value)
  }
  return values
}

/* ── The monitor's text rendering (rr/site/src/lib/monitor/render.ts) ── */

export type Severity = 'healthy' | 'warning' | 'critical'
export type Thresholds = { warning: number; critical: number }

/** The monitor's default thresholds for CPU and RAM (rr's config defaults). */
export const THRESHOLDS = {
  cpu: { warning: 70, critical: 90 },
  ram: { warning: 70, critical: 90 },
} satisfies Record<string, Thresholds>

/** MetricColorWithThresholds: cyan, purple, pink in the TUI. */
export function severity(percent: number, t: Thresholds): Severity {
  if (percent >= t.critical) return 'critical'
  if (percent >= t.warning) return 'warning'
  return 'healthy'
}

/** ResampleDataWithMode(ResampleMax): bucket max when shrinking, linear when growing. */
export function resample(data: readonly number[], target: number): number[] {
  if (data.length === 0 || target <= 0) return []
  if (data.length === target) return [...data]
  if (data.length === 1) return Array(target).fill(data[0])
  const result: number[] = []
  if (data.length > target) {
    const bucket = data.length / target
    for (let i = 0; i < target; i++) {
      let start = Math.trunc(i * bucket)
      const end = Math.min(Math.trunc((i + 1) * bucket), data.length)
      if (start >= end) start = end - 1
      if (start < 0) start = 0
      let max = data[start] ?? 0
      for (let j = start + 1; j < end; j++) max = Math.max(max, data[j] ?? 0)
      result.push(max)
    }
    return result
  }
  const scale = (data.length - 1) / (target - 1)
  for (let i = 0; i < target; i++) {
    const pos = i * scale
    const idx = Math.trunc(pos)
    const frac = pos - idx
    result.push(
      idx >= data.length - 1
        ? (data[data.length - 1] ?? 0)
        : (data[idx] ?? 0) * (1 - frac) + (data[idx + 1] ?? 0) * frac,
    )
  }
  return result
}

/**
 * The braille sparkline of RenderBrailleSparklineWithOptions, as the dots it
 * lights instead of the characters: two sub-columns per character, four dot
 * levels per row, right-aligned when there is less data than width. The deck's
 * fonts have no braille glyphs, so the stage draws the dots itself, as rr's
 * site does (site/src/components/landing/monitor/Dots.tsx).
 */
export type Sparkline = {
  /** Lit dots in each sub-column, counted from the bottom; `width * 2` entries. */
  heights: number[]
  /** The max value plotted in each character column, for coloring. */
  columnMax: number[]
  /** Dot rows in the plot: `height * 4`. */
  dots: number
}

export function sparkline(data: readonly number[], width: number, height: number, forceZeroMin = false): Sparkline {
  const totalDots = height * 4
  const targetPoints = width * 2
  const heights = Array<number>(Math.max(0, targetPoints)).fill(0)
  const columnMax = Array<number>(Math.max(0, width)).fill(0)
  if (data.length === 0 || width <= 0 || height <= 0) return { heights, columnMax, dots: totalDots }
  let min = Math.min(...data)
  let max = Math.max(...data)
  const isPercentage = max <= 100 && min >= 0
  if (isPercentage) {
    min = 0
    max = 100
  }
  if (forceZeroMin && !isPercentage) min = 0
  const points = data.length > targetPoints ? resample(data, targetPoints) : data
  const offset = Math.max(0, targetPoints - points.length)

  points.forEach((value, i) => {
    const normalized = max > min ? (value - min) / (max - min) : 0.5
    const dotHeight = Math.min(Math.max(Math.trunc(normalized * totalDots), 0), totalDots)
    const col = Math.trunc((i + offset) / 2)
    if (col >= width) return
    if (value > (columnMax[col] ?? 0)) columnMax[col] = value
    heights[i + offset] = dotHeight
  })
  return { heights, columnMax, dots: totalDots }
}

/** Go's %.Nf: like toFixed, except an exact tie rounds to even (7.25 → "7.2"). */
function goFixed(value: number, digits: number): string {
  const scale = 10 ** digits
  const scaled = value * scale
  const floor = Math.floor(scaled)
  if (scaled - floor === 0.5 && floor % 2 === 0) return (floor / scale).toFixed(digits)
  return value.toFixed(digits)
}

/** HostLockInfo.FormatDuration: "0s", "41s", "2m", "2m30s". */
export function formatLockDuration(ms: number): string {
  if (ms < 1000) return '0s'
  const minutes = Math.trunc(ms / 60_000)
  const seconds = Math.trunc(ms / 1000) % 60
  if (minutes > 0) return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`
  return `${seconds}s`
}

/** The card's "%5.1f%%" percentage. */
export const formatPercent = (percent: number) => `${goFixed(percent, 1).padStart(5)}%`

/* ── What the slide shows ── */

export const TIMELINE = buildTimeline(snapshots as Snapshot[])
/** The frame the replay rests on. */
export const BUSIEST = busiestFrame(TIMELINE)
/** The first snapshot's timestamp, as a date: when the recording was made. */
export const RECORDED = (snapshots as Snapshot[])[0]?.timestamp.slice(0, 10) ?? ''
/** Snapshots in the recording, and how many of them the resting frame has behind it. */
export const SNAPSHOT_COUNT = TIMELINE.frames.length

/** Characters across a card's graph, as the TUI counts them. */
export const GRAPH_COLS = 40
/** Braille rows in a graph (GRAPH_ROWS in rr's MonitorCard.tsx). */
export const GRAPH_ROWS = 2

export interface HostCard {
  name: string
  frame: HostFrame
  cpu: number[]
  ram: number[]
  gpu: number[]
  plot: Sparkline
}

/** One card per host at frame `index`, with the history its graphs draw. */
export function cardsAt(index: number): HostCard[] {
  const i = Math.max(0, Math.min(TIMELINE.frames.length - 1, Math.round(index)))
  return TIMELINE.hosts.map((name) => {
    const cpu = history(TIMELINE, name, 'cpu', i)
    return {
      name,
      frame: TIMELINE.frames[i]?.hosts[name] as HostFrame,
      cpu,
      ram: history(TIMELINE, name, 'ram', i),
      gpu: history(TIMELINE, name, 'gpu', i),
      plot: sparkline(cpu, GRAPH_COLS, GRAPH_ROWS),
    }
  })
}

/**
 * rr monitor's history: a ring buffer of 600 samples per metric.
 * `const DefaultHistorySize = 600`, rr/internal/monitor/history.go line 7.
 */
export const HISTORY_SAMPLES = 600
/**
 * How long that is at the default refresh interval of one second
 * (`Interval: "1s"`, rr/internal/config/types.go line 629): ten minutes, as
 * history.go's own comment says.
 */
export const HISTORY_MINUTES = HISTORY_SAMPLES / 60

/**
 * StatGlass's retention tiers, from ~/Projects/statglass/README.md lines 213
 * to 222 (statglass commit 5db8622a): resource aggregates "in 10-second
 * buckets for 24 hours, one-minute buckets through 7 days and 15-minute
 * buckets through 30 days". The same paragraph says the size limit decides
 * how much fits, "so 30 days is not guaranteed": the card says "up to".
 */
export const RETENTION = [
  { bucket: '10 s buckets', through: '24 h', minutes: 24 * 60 },
  { bucket: '1 min buckets', through: '7 d', minutes: 7 * 24 * 60 },
  { bucket: '15 min buckets', through: '30 d', minutes: 30 * 24 * 60 },
] as const
/** The longest tier, in days. */
export const RETENTION_DAYS = (RETENTION.at(-1)?.minutes ?? 0) / (24 * 60)

/** Marks on the history axis, in minutes before now. "1 h" is only a mark; the tiers end at the others. */
export const AXIS_TICKS = [
  { label: '1 h', minutes: 60 },
  ...RETENTION.map((tier) => ({ label: tier.through, minutes: tier.minutes })),
] as const
