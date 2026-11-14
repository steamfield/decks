/**
 * Slide 7: the foreman session. Sourced in data/sources/07-foreman-session.md.
 *
 * A port of foreman's landing-page session model, read 2026-11-13 from
 * ~/Projects/claude-codex at commit 9413fa8:
 *   site/src/data/session.ts (`buildSession`, `sceneAt`, `stepAt`), drawn there
 *   by site/src/components/landing/session/SessionCanvas.tsx.
 * `sceneAt` and `stepAt` below follow that file line for line, and the timing
 * constants are its own; keep them in step with it. Two things differ: the
 * Claude status line is `claudeStatus` here (the site's strings use an arrow
 * glyph and say "Question q1" before the wait has returned), and a step keeps
 * only its time and title.
 *
 * The data is data/fixtures/07-foreman-session.json, which
 * data/fixtures/07-foreman-session.gen.mjs writes by calling the site's own
 * `buildSession` exactly as site/src/pages/index.astro line 134 does:
 * question from site-commands, lanes site-console, site-commands, site-e2e.
 * Those are three of the four `site-*` runs in site/fixtures/runs/, all
 * recorded 2026-11-06. No `fix-*` run is used, so no figure here comes from
 * that batch.
 *
 * What is recorded: each delegate's commands and file writes, in their real
 * order; the question and its answer, word for word; the 18 seconds between
 * them. What is scripted by the site's model: the 54-second timeline the
 * events are spread over, the start order, the steer and the follow-up. In
 * the recordings site-e2e started 23 minutes after the other two
 * (`createdAt` 09:47:40 against 09:24:19 and 09:24:25 UTC), which is why the
 * tag says the timeline is shortened.
 */
import fixture from './fixtures/07-foreman-session.json'

export type SessionState = 'queued' | 'starting' | 'running' | 'waiting' | 'done' | 'archived'
export type Activity =
  | { kind: 'command'; command: string; exitCode: number | null }
  | { kind: 'files'; paths: string[] }
export interface Delegate {
  name: string
  model: string
  work: string
  branch: string
  contract: string
  /** The contract's `- May change:` line, backticks removed. */
  mayChange: string
  start: number
  done: number
  activity: { at: number; event: Activity }[]
}
export interface SessionStep {
  at: number
  title: string
}
export type Endpoint = 'claude' | 'daemon' | number
export interface Packet {
  from: Endpoint
  to: Endpoint
  label: string
  at: number
  attention: boolean
}
export interface Session {
  delegates: Delegate[]
  steps: SessionStep[]
  packets: Packet[]
  question: { id: string; text: string; answer: string; run: string; askedMs: number; answeredMs: number }
  duration: number
  stillAt: number
}
export interface DelegateScene {
  state: SessionState
  turn: number
  commands: number
  files: number
  latest?: Activity
}
export interface Scene {
  step: number
  held: boolean
  /** Claude is doing something rather than idling on a background wait. */
  claudeActive: boolean
  delegates: DelegateScene[]
  packets: (Packet & { progress: number })[]
}

/* Timeline constants, in the model's milliseconds: session.ts lines 61 to 66. */
export const QUESTION = 16_500
export const ANSWER = 22_000
const FOLLOWUP = 38_000
const FOLLOWUP_DONE = 41_500
const ARCHIVE = 48_500
export const FLIGHT = 1500

export const SESSION = fixture as Session

export function stepAt(session: Session, t: number): number {
  return Math.max(
    0,
    session.steps.findLastIndex((step) => step.at <= t),
  )
}

export function sceneAt(session: Session, time: number): Scene {
  const t = Math.max(0, Math.min(session.duration, time))
  const held = t >= QUESTION && t < ANSWER
  const delegates = session.delegates.map((d, i): DelegateScene => {
    const followup = i === 0 && t >= FOLLOWUP
    const state: SessionState =
      t >= ARCHIVE
        ? 'archived'
        : t < d.start
          ? 'queued'
          : t < d.start + 2000
            ? 'starting'
            : held && i === 1
              ? 'waiting'
              : followup
                ? t < FOLLOWUP_DONE
                  ? 'running'
                  : 'done'
                : t >= d.done
                  ? 'done'
                  : 'running'
    const seen = d.activity.filter((a) => a.at <= t)
    return {
      state,
      turn: t < d.start ? 0 : followup ? 2 : 1,
      commands: seen.filter((a) => a.event.kind === 'command').length,
      files: new Set(seen.flatMap((a) => (a.event.kind === 'files' ? a.event.paths : []))).size,
      latest: seen.at(-1)?.event,
    }
  })
  const packets = session.packets
    .filter((p) => t >= p.at && t < p.at + FLIGHT)
    .map((p) => ({ ...p, progress: (t - p.at) / FLIGHT }))
  if (t >= 11_000 && !packets.length)
    delegates.forEach((d, i) => {
      if (d.state === 'running')
        packets.push({
          from: i,
          to: 'daemon',
          label: 'events',
          attention: false,
          at: t,
          progress: ((t + i * 500) % 2400) / 2400,
        })
    })
  const step = stepAt(session, t)
  return { step, held, claudeActive: step !== 2, delegates, packets }
}

/**
 * What Claude is doing, one line per step of the model. During step 3 the
 * question is held at the daemon for two packet flights before the background
 * wait has returned to Claude; until then Claude is still idle.
 */
export function claudeStatus(session: Session, t: number): string {
  const step = stepAt(session, t)
  if (step === 3 && t < QUESTION + 2 * FLIGHT) return 'Idle: wait --all in background'
  return (
    [
      'Writing contracts',
      'Starting delegates',
      'Idle: wait --all in background',
      `Reading question ${session.question.id}`,
      'Answered, waiting again',
      'Steering site-e2e',
      'Reviewing site-console',
      'Follow-up to site-console',
      'Reviewing the last two diffs',
      'Archiving merged branches',
    ][step] ?? ''
  )
}

/* ── Figures ── */

/** The runs' `createdAt` date (all three: 2026-11-06, UTC), from the fixture's `runs`. */
export const RECORDED = fixture.runs[0].createdAt.slice(0, 10)
/** Delegates in the session: the three lanes index.astro passes to `buildSession`. */
export const DELEGATES = SESSION.delegates.length
/**
 * Seconds from question q1 asked to answered in site-commands: `questions[].t`
 * 31,410 ms and 49,673 ms in site/fixtures/runs/site-commands.json, rounded.
 */
export const ANSWER_DELAY_S = Math.round((SESSION.question.answeredMs - SESSION.question.askedMs) / 1000)

/**
 * Where foreman puts a delegate: ~/Projects/claude-codex/src/core/managed-worktree.ts
 * lines 117 and 118 (`path.join(main, ".claude/worktrees", name)` and
 * `foreman/${name}`), commit 9413fa8.
 */
export const WORKTREE_DIR = '.claude/worktrees'
export const BRANCH_PREFIX = 'foreman/'
export const worktreeOf = (name: string) => `${WORKTREE_DIR}/${name}`

/** The still moment each beat tweens `t` to, in the model's milliseconds. */
export const STILLS = [
  2_500, // contracts written, nothing started
  14_000, // all three running
  QUESTION + FLIGHT, // the ask has reached the daemon and gone no further
  ANSWER + 2 * FLIGHT + 500, // the answer has reached the delegate
  ARCHIVE - 10, // every delegate done, the last result back with Claude
] as const

/** Cut to `max` characters with an ellipsis. */
export const short = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** Greedy word wrap to `width` characters, at most `lines` lines, ending in an ellipsis when cut. */
export function wrap(text: string, width: number, lines: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) out.push(line)
  if (out.length <= lines) return out
  const kept = out.slice(0, lines)
  kept[lines - 1] = `${kept[lines - 1].slice(0, width - 1)}…`
  return kept
}
