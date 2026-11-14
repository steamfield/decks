/**
 * Slide 10: rr's host locks. Sourced in data/sources/10-rr-locks.md.
 *
 * The diagram is rr's own simulation of its lock rules, ported from
 * ~/Projects/rr/site/src/lib/flow.ts (rr commit 536948d, read 2026-11-13).
 * `simulate`, `waitSpans`, `sceneAt`, `flowSteps`, FLOW_HOSTS, FLOW_RUNS and
 * the timing constants are that file's, restyled for this repo and otherwise
 * unchanged. Keep them in step with the source: rr's site draws the same
 * scenario in site/src/components/landing/FlowDiagram.tsx. The scenario is
 * made up (four agents, three hosts, runs shortened to seconds); the rules
 * are the ones in rr/internal/cli/loadbalance.go and rr/internal/parallel.
 *
 * The result strip is a recording: ./fixtures/10-rr-result.json is line 4 of
 * ~/Projects/rr/site/fixtures/run.jsonl, byte for byte (rr commit 9a0dab1),
 * the `result` event of one `rr test` run in OpenData on 2026-11-02.
 * RESULT_LINES quotes it; ./10-rr-locks.test.ts fails if a quoted line is
 * no longer a substring of the fixture.
 */
import type { TermLine } from './types'
import result from './fixtures/10-rr-result.json'

/* ── The simulation (rr/site/src/lib/flow.ts) ── */

export type FlowTask = { name: string; syncMs: number; testMs: number }
export type FlowRun = {
  agent: string
  /** What the agent typed. */
  command: string
  arrive: number
  /** One task is a plain run; several are a parallel task's subtasks, one per host. */
  tasks: FlowTask[]
  result: { ok: boolean; text: string }
}

export type SegmentKind = 'probe-locked' | 'probe-ok' | 'sync' | 'test' | 'hold' | 'result'
export type Segment = {
  run: number
  host: number
  kind: SegmentKind
  start: number
  end: number
  /** The subtask, for a parallel run. */
  task?: string
}

/** A run's first lock attempts are drawn slowly enough to follow. */
export const PROBE_MS = 600
/** Retries go back to back, the way roundRobinWait tries every locked host. */
export const RETRY_PROBE_MS = 250
/** The wait between retries: `time.NewTimer(2 * time.Second)`, rr/internal/cli/loadbalance.go line 477. */
export const POLL_MS = 2000
export const RESULT_MS = 600
const STEP_MS = 50

/** Host names in the simulation. Schematic: OpenData's real hosts are in RUN. */
export const FLOW_HOSTS = ['m4-mini', 'm1-linux', 'm1-mini']

/** The made-up scenario, as on rr's site. Counts and timings are illustrative. */
export const FLOW_RUNS: FlowRun[] = [
  {
    agent: 'Agent 1',
    command: 'rr test',
    arrive: 400,
    tasks: [
      { name: 'test-api', syncMs: 900, testMs: 8400 },
      { name: 'test-web', syncMs: 900, testMs: 8000 },
      { name: 'test-jobs', syncMs: 900, testMs: 8200 },
    ],
    result: { ok: true, text: '3/3 passed' },
  },
  {
    agent: 'Agent 2',
    command: 'rr run "pytest auth"',
    arrive: 4000,
    tasks: [{ name: 'pytest', syncMs: 800, testMs: 5600 }],
    result: { ok: true, text: '86 passed' },
  },
  {
    agent: 'Agent 3',
    command: 'rr run "bun test lib"',
    arrive: 5700,
    tasks: [{ name: 'bun test', syncMs: 800, testMs: 4800 }],
    result: { ok: false, text: '1 failed' },
  },
  {
    agent: 'Agent 4',
    command: 'rr run "go test ./..."',
    arrive: 15000,
    tasks: [{ name: 'go test', syncMs: 800, testMs: 3800 }],
    result: { ok: true, text: '214 passed' },
  },
]

type Worker =
  | { kind: 'probe'; host: number; start: number; ms: number }
  | { kind: 'waiting'; next: number }
  | { kind: 'busy'; host: number; until: number }
  | { kind: 'holding'; host: number; since: number }
  | { kind: 'done' }

/** Runs the scenario: every lock attempt, sync, test and result as timed segments. */
export function simulate(runs: FlowRun[], hostCount: number): Segment[] {
  const segments: Segment[] = []
  const holder: (number | undefined)[] = Array(hostCount).fill(undefined)
  // A plain run has one worker that walks the hosts; a parallel run has one per host.
  const workers: Worker[][] = runs.map(() => [])
  const horizon = Math.max(...runs.map((run) => run.arrive)) + 120_000
  const finished = () => workers.every((mine) => mine.length > 0 && mine.every((w) => w.kind === 'done'))

  for (let t = 0; t <= horizon && !finished(); t += STEP_MS) {
    runs.forEach((run, i) => {
      const parallel = run.tasks.length > 1
      const mine = workers[i] as Worker[]
      if (mine.length === 0 && t >= run.arrive) {
        const count = parallel ? Math.min(run.tasks.length, hostCount) : 1
        for (let w = 0; w < count; w++) {
          mine.push({ kind: 'probe', host: parallel ? w : 0, start: t, ms: PROBE_MS })
        }
      }
      mine.forEach((worker, w) => {
        if (worker.kind === 'probe' && t >= worker.start + worker.ms) {
          const free = holder[worker.host] === undefined
          segments.push({
            run: i,
            host: worker.host,
            kind: free ? 'probe-ok' : 'probe-locked',
            start: worker.start,
            end: t,
          })
          if (free) {
            const task = run.tasks[parallel ? w : 0] as FlowTask
            const name = parallel ? task.name : undefined
            const syncEnd = t + task.syncMs
            const until = syncEnd + task.testMs
            holder[worker.host] = i
            segments.push({ run: i, host: worker.host, kind: 'sync', start: t, end: syncEnd, task: name })
            segments.push({ run: i, host: worker.host, kind: 'test', start: syncEnd, end: until, task: name })
            mine[w] = { kind: 'busy', host: worker.host, until }
          } else if (!parallel && worker.host + 1 < hostCount) {
            mine[w] = { ...worker, host: worker.host + 1, start: t }
          } else {
            // A parallel worker waits for its own host; a plain run for any host.
            mine[w] = { kind: 'waiting', next: t + POLL_MS }
          }
        } else if (worker.kind === 'waiting' && t >= worker.next) {
          mine[w] = { kind: 'probe', host: parallel ? w : 0, start: t, ms: RETRY_PROBE_MS }
        } else if (worker.kind === 'busy' && t >= worker.until) {
          mine[w] = { kind: 'holding', host: worker.host, since: t }
        }
      })
      // Locks release when the run ends: a plain run's at once, a parallel task's
      // only when every subtask is done.
      if (mine.length > 0 && mine.every((w) => w.kind === 'holding')) {
        for (const [w, worker] of mine.entries()) {
          if (worker.kind !== 'holding') continue
          if (worker.since < t) {
            segments.push({ run: i, host: worker.host, kind: 'hold', start: worker.since, end: t })
          }
          holder[worker.host] = undefined
          segments.push({ run: i, host: worker.host, kind: 'result', start: t, end: t + RESULT_MS })
          ;(workers[i] as Worker[])[w] = { kind: 'done' }
        }
      }
    })
  }
  return segments.sort((a, b) => a.start - b.start || a.host - b.host)
}

export type ChipView = {
  /** The rr process exists from the agent's call until its exit code is back. */
  visible: boolean
  state: 'trying' | 'waiting' | 'running' | 'done'
  /** While waiting: milliseconds until it tries the locks again. */
  retryIn?: number
  /** 0 in the running column, 1 in the waiting column; eased between them. */
  slot: number
}
export type HostView = {
  holder?: number
  task?: string
  phase: 'free' | 'sync' | 'test' | 'hold'
  /** 0..1 through the current phase. */
  progress: number
}
export type Tag = { host: number; run: number; ok: boolean; age: number; ms: number }
export type Scene = {
  chips: ChipView[]
  hosts: HostView[]
  /** Segments in flight at this moment, with how far along (0..1) each is. */
  active: { segment: Segment; at: number }[]
  /** Lock attempts that just landed, shown at the host end of the line. */
  tags: Tag[]
  results: (FlowRun['result'] | undefined)[]
}

const covers = (s: Segment, t: number) => t >= s.start && t < s.end
const SLIDE_MS = 450
export const TAG_MS = 1100
const RETRY_TAG_MS = 600
/** The rr process lingers this long after its exit code is back. */
const LINGER_MS = 900

const ease = (u: number) => 1 - (1 - Math.max(0, Math.min(1, u))) ** 3

/** The spans a run spends waiting on the laptop: from giving up until a retry lands a lock. */
export function waitSpans(segments: Segment[], run: number): [number, number][] {
  const probes = segments.filter((s) => s.run === run && s.kind.startsWith('probe'))
  const spans: [number, number][] = []
  let since: number | undefined
  for (const [k, s] of probes.entries()) {
    const next = probes[k + 1]
    if (s.kind === 'probe-locked' && since === undefined && next && next.start > s.end) {
      since = s.end
    }
    if (s.kind === 'probe-ok' && since !== undefined) {
      spans.push([since, s.end])
      since = undefined
    }
  }
  return spans
}

export function sceneAt(segments: Segment[], runs: FlowRun[], hostCount: number, t: number): Scene {
  const active = segments
    .filter((s) => covers(s, t) && s.kind !== 'hold')
    .map((segment) => ({ segment, at: (t - segment.start) / (segment.end - segment.start) }))

  const hosts: HostView[] = Array.from({ length: hostCount }, (_, host) => {
    const lock = segments.find(
      (s) => s.host === host && (s.kind === 'sync' || s.kind === 'test' || s.kind === 'hold') && covers(s, t),
    )
    if (!lock) return { phase: 'free', progress: 0 }
    return {
      holder: lock.run,
      task: lock.task,
      phase: lock.kind as HostView['phase'],
      progress: (t - lock.start) / (lock.end - lock.start),
    }
  })

  // A quick retry's answer shows briefly; a first attempt's long enough to read.
  const tagMs = (s: Segment) => (s.end - s.start < PROBE_MS ? RETRY_TAG_MS : TAG_MS)
  const tags = segments
    .filter((s) => s.kind.startsWith('probe') && t >= s.end && t < s.end + tagMs(s))
    .map((s) => ({ host: s.host, run: s.run, ok: s.kind === 'probe-ok', age: t - s.end, ms: tagMs(s) }))

  const chips: ChipView[] = runs.map((run, i) => {
    const mine = segments.filter((s) => s.run === i)
    const lastResult = mine.filter((s) => s.kind === 'result').at(-1)
    const end = lastResult ? lastResult.end : Number.POSITIVE_INFINITY
    const visible = t >= run.arrive && t < end + LINGER_MS
    const spans = waitSpans(segments, i)
    // Slide toward the waiting column when a wait starts, back when it ends.
    let slot = 0
    for (const [from, to] of spans) {
      if (t >= from && t < to) slot = ease((t - from) / SLIDE_MS)
      else if (t >= to && t < to + SLIDE_MS) slot = 1 - ease((t - to) / SLIDE_MS)
    }
    if (t >= end) return { visible, state: 'done', slot }
    const busy = mine.some((s) => !s.kind.startsWith('probe') && covers(s, t))
    if (busy) return { visible, state: 'running', slot }
    const waiting = spans.some(([from, to]) => t >= from && t < to)
    const probing = mine.some((s) => s.kind.startsWith('probe') && covers(s, t))
    if (waiting && !probing) {
      const next = mine.find((s) => s.start > t)
      return { visible, state: 'waiting', retryIn: next ? next.start - t : 0, slot }
    }
    return { visible, state: waiting ? 'waiting' : 'trying', slot }
  })

  const results = runs.map((run, i) =>
    segments.some((s) => s.run === i && s.kind === 'result' && t >= s.end) ? run.result : undefined,
  )
  return { chips, hosts, active, tags, results }
}

export type FlowStep = { at: number; title: string; text: string }

/** The story's beats, each starting at a moment the simulation produced. */
export function flowSteps(segments: Segment[], runs: FlowRun[], hosts: string[]): FlowStep[] {
  const lockOf = (run: number) => segments.find((s) => s.run === run && s.kind === 'probe-ok')
  const release = segments.find((s) => s.run === 0 && s.kind === 'result')
  const second = lockOf(1)
  const third = lockOf(2)
  const fourth = lockOf(runs.length - 1)
  // Agent 3's retry that finds the second agent's new host taken.
  const bounce = segments.find((s) => s.run === 2 && s.kind === 'probe-locked' && s.start >= (second?.end ?? 0))
  const last = runs.length - 1
  const name = (host: number | undefined) => hosts[host ?? 0] ?? ''
  return [
    {
      at: 0,
      title: `${runs[0]?.agent} takes every host`,
      text: `${runs[0]?.agent} runs \`${runs[0]?.command}\`, a parallel task. Its rr locks all ${hosts.length} hosts and gives each one a subtask.`,
    },
    {
      at: runs[1]?.arrive ?? 0,
      title: `${runs[1]?.agent} and ${runs[2]?.agent} wait`,
      text: `${runs[1]?.agent} and ${runs[2]?.agent} run their own tests. Each one's rr tries the hosts top to bottom, finds every lock taken, and waits on your laptop.`,
    },
    {
      at: release?.start ?? 0,
      title: `${runs[1]?.agent} gets ${name(second?.host)}`,
      text: `${runs[0]?.agent}'s subtasks finish and all ${hosts.length} locks release together. Each waiting rr checks again every ${POLL_MS / 1000}s on its own timer, with no shared queue, and ${runs[1]?.agent} checks first and takes ${name(second?.host)}.`,
    },
    {
      at: bounce?.start ?? 0,
      title: `${runs[2]?.agent} gets ${name(third?.host)}`,
      text: `${runs[2]?.agent} checks next, finds ${name(second?.host)} taken, and moves down the list to ${name(third?.host)}.`,
    },
    {
      at: runs[last]?.arrive ?? 0,
      title: `${runs[last]?.agent} gets ${name(fourth?.host)}`,
      text: `${runs[last]?.agent} arrives while a host is free and takes it without waiting. Each agent gets its own output and exit code.`,
    },
  ]
}

/* ── What the slide shows of it ── */

export const SEGMENTS = simulate(FLOW_RUNS, FLOW_HOSTS.length)
export const STEPS = flowSteps(SEGMENTS, FLOW_RUNS, FLOW_HOSTS)

/** Counts printed on the card: the scenario's agents and hosts. */
export const AGENT_COUNT = FLOW_RUNS.length
export const HOST_COUNT = FLOW_HOSTS.length

const lockEnd = (run: number) => SEGMENTS.find((s) => s.run === run && s.kind === 'probe-ok')?.end ?? 0

/**
 * The moment each beat rests on, in simulation milliseconds. Each is derived
 * from the simulation, so a change to the scenario moves them with it.
 *   0  before any agent calls rr: every host free.
 *   1  agent 1 holds every host and its tests are running, just before agent
 *      2 arrives (STEPS[1]).
 *   2  agents 2 and 3 are both waiting: halfway between agent 3 giving up and
 *      agent 1 releasing (STEPS[2]).
 *   3  agents 2 and 3 run on the first two hosts and agent 4 has just locked
 *      the third and is syncing to it.
 */
export const STILLS = [
  0,
  (STEPS[1]?.at ?? 0) - 400,
  Math.round(((waitSpans(SEGMENTS, 2)[0]?.[0] ?? 0) + (STEPS[2]?.at ?? 0)) / 200) * 100,
  lockEnd(FLOW_RUNS.length - 1) + 200,
] as const

/**
 * The JSON event a waiting rr prints, reduced to the two fields the slide
 * names. Shape from rr/internal/cli/loadbalance.go lines 398 to 407 (phase
 * "connect", status "waiting", details.holders[].command) and the sample in
 * rr/plugins/rr/skills/rr/reference/machine-interface.md line 35. The holder
 * is the simulation's agent 1, so this label is part of the schematic.
 */
export const WAITING_EVENT = {
  status: '"status":"waiting"',
  holder: `"command":"${FLOW_RUNS[0]?.command}"`,
} as const

/* ── The recorded result (fixtures/10-rr-result.json) ── */

type Failure = { task: string; host: string; tests?: { file: string; message: string; name: string }[] }
const details = result.details as { failed: number; passed: number; total: number; failures: Failure[] }

/** The run the event came from. */
export const RUN = {
  /** The event's `ts`, as a date. */
  recorded: result.ts.slice(0, 10),
  /** details.total: the subtasks OpenData's `rr test` fanned out to in this run. */
  shards: details.total,
  passed: details.passed,
  failed: details.failed,
  /** The hosts named in details.failures: OpenData's real ones. */
  hosts: [...new Set(details.failures.map((f) => f.host))],
} as const

/** The one Vitest failure that carries a line number. */
const located = details.failures.flatMap((f) => f.tests ?? []).find((t) => /:\d+$/.test(t.file))
export const FAILURE_AT = located?.file ?? ''

/**
 * The strip's lines. Apart from a leading or trailing `…`, which marks where
 * the event has more than the strip shows, every line is a contiguous run of
 * bytes from the fixture. The message is one JSON string, shown over three
 * lines.
 */
export const RESULT_LINES: readonly TermLine[] = [
  { text: '{"type":"result","status":"failed","exit_code":1,"details":{"failed":3, …', tone: 'out' },
  { text: '{"file":"src/data/articles/charts-json.test.ts:74",', tone: 'fail' },
  { text: '"message":"Error: ./staar-sat-gap.charts.json#bigCityCampusPoverty failed ', tone: 'out' },
  { text: 'validateSpec: Spec error: encoding.tooltip[3].field \\"share\\" does not ', tone: 'out' },
  { text: 'exist in data. Available columns: district, band, campuses",', tone: 'out' },
  { text: '… "passed":5,"total":8},"ts":"2026-11-02T16:48:49Z"}', tone: 'out' },
]
/** The line the last beat is about: the failure's file and line. */
export const RESULT_HOT = RESULT_LINES.findIndex((line) => line.text.includes(FAILURE_AT))

/**
 * The test frameworks rr parses into file, line and message:
 * rr/internal/output/formatters/ has pytest.go, gotest.go and jest.go, and
 * jest.go's JestFormatter "parses Jest/Vitest test output" (line 31). The
 * README omits Vitest; the code has it.
 */
export const PARSERS = ['pytest', 'Go test', 'Jest', 'Vitest'] as const

/**
 * FLAG: author-reported. Riley says he usually has two to four agents running
 * at once. No repo records it. Used in the presenter notes only.
 */
export const AGENTS_AT_ONCE = { low: 2, high: 4 } as const
