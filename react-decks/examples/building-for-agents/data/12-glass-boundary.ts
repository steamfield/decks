/**
 * Slide 12: the StatGlass boundary. Sourced in data/sources/12-glass-boundary.md.
 * Read 2026-11-13 from ~/Projects/statglass at commit 5db8622a (version 0.12.0).
 *
 * RUST_LINES:  `find crates src-tauri -name '*.rs' -print0 | xargs -0 cat | wc -l`
 *              (inline tests included; no target/ directory sits under either root)
 * TS_LINES:    `find src \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 cat | wc -l`
 *              (tests and src/core/generated included)
 * COMMANDS:    `grep -o '__TAURI_INVOKE[<(]' src/core/generated/bindings.ts | wc -l`.
 *              `grep -c __TAURI_INVOKE` prints 93 because it also counts the import
 *              line; `grep -c '__TAURI_INVOKE("'` prints 81 because it misses the 11
 *              calls written `__TAURI_INVOKE<T>(`. The `collect_commands!` block in
 *              src-tauri/src/lib.rs (from line 79) lists the same 92.
 * EVENTS:      the `collect_events!` block, src-tauri/src/lib.rs lines 143 to 154.
 * IDLE:        plan/competitor-benchmarks.md line 17 and README.md lines 184 to 196.
 * The boxes' names are real paths: AGENTS.md's architecture map, lines 28 to 40.
 * The chart's values are made up: see `cpuAt` below.
 */

export const REPO_COMMIT = '5db8622a'

/** Lines of Rust under crates/ and src-tauri/. */
export const RUST_LINES = 153401
/** Lines of TypeScript and TSX under src/. */
export const TS_LINES = 111644
/** Rust's share of the two, as a whole percent. */
export const RUST_PERCENT = Math.round((RUST_LINES / (RUST_LINES + TS_LINES)) * 100)
export const TS_PERCENT = 100 - RUST_PERCENT

/** Tauri commands in the generated bindings. */
export const COMMANDS = 92
/** Typed events in the `collect_events!` block. */
export const EVENTS = 10

/**
 * The idle figure. One run, 120 s after a 30 s warm-up, on a machine busy with
 * other builds (load average 4.8 to 7.8), before remote monitoring existed and
 * with Docker monitoring off. The benchmark file's own caveat: "One run each."
 */
export const IDLE = {
  /** Percent of one core, app plus helper processes. The file records 0.672. */
  cpuPercent: 0.67,
  /** Physical footprint, MB. Not shown on the slide; kept for the notes. */
  memoryMb: 104.9,
  state: 'menu bar only',
  machine: 'M3 Max',
  date: '2026-10-07',
  month: 'October 2026',
  /** Engine tick while no window is visible, seconds (decision D-094). */
  backgroundTickS: 2,
} as const

export interface Box {
  id: string
  /** A real path or crate name in the statglass repo. */
  name: string
  note: string
}

export const RUST_BOXES: readonly Box[] = [
  { id: 'collect', name: 'statglass-collect', note: 'samplers' },
  { id: 'engine', name: 'statglass-engine', note: 'the one-hour ring' },
  { id: 'store', name: 'statglass-store', note: 'SQLite tiers' },
]
/** The menu bar item's code: src-tauri/src/tray/. */
export const TRAY_BOX: Box = { id: 'tray', name: 'src-tauri/tray', note: 'menu bar item' }

export const TS_BOXES: readonly Box[] = [
  { id: 'transport', name: 'core/transport', note: 'Channel in' },
  { id: 'reducer', name: 'core/live-state.ts', note: 'reducer' },
  { id: 'stores', name: 'app/stores', note: 'zustand' },
  { id: 'widgets', name: 'app/widgets', note: 'SVG' },
]

export const SEAM_FILE = 'src/core/generated/bindings.ts'

/**
 * A live frame, abridged: the real variant of `LiveMsg` also carries ts_ms,
 * layout_no, timeline and held (src/core/generated/bindings.ts line 1951).
 */
export const FRAME_MESSAGE = '{ kind: "frame", values: [ … ], … }'

/* ── The widget's chart: illustrative values ──
   Ported from ~/Projects/steamfield/src/lib/statglass-demo.ts (steamfield
   commit 1b001f9): `hash`, `drift`, `episode` and the CPU total of `cpuAt`.
   Every value is a pure function of the sample number, so a beat can seek to
   any tick and draw the same chart. Keep it in step with that file. */

/** Samples the chart shows. */
export const CHART_WINDOW = 30
/** Samples in one loop of the usage script. */
const CYCLE = 120
/** The build episode, in samples: [start, end). */
const BUILD = [10, 28] as const
/** The sample at the chart's right edge on entry: just after a build. */
export const CHART_START = CYCLE * 5 + 35

function hash(seed: number, n: number): number {
  const x = Math.sin(seed * 9283.17 + n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function drift(seed: number, n: number, period: number): number {
  const u = n / period
  const i = Math.floor(u)
  const f = u - i
  const s = f * f * (3 - 2 * f)
  const a = hash(seed, i)
  return a + (hash(seed, i + 1) - a) * s
}

function build(n: number): number {
  const [start, end] = BUILD
  const p = ((n % CYCLE) + CYCLE) % CYCLE
  if (p < start || p >= end + 3) return 0
  if (p < start + 2) return (p - start + 1) / 3
  if (p < end) return 1
  return 1 - (p - end + 1) / 4
}

/** Total CPU percent at sample `n`: idle drift, the odd blip, one build. */
export function cpuAt(n: number): number {
  const busy = build(n)
  const idle = 3 + 4 * drift(1, n, 6) + 2 * hash(2, n)
  const blip = hash(3, n) < 0.07 ? hash(53, n) : 0
  return Math.min(99, idle + (1 - busy) * 28 * blip + busy * (68 + 26 * hash(4, n)))
}
