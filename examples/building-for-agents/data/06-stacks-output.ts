/**
 * Slide 6: Stacks output differs for people and agents. Sourced in
 * data/sources/06-stacks-output.md.
 *
 * The three panes are recordings made for this deck on 2026-11-13 with the
 * installed stacks 0.7.0, in a scratch project that was never built:
 *   stacks new typescript-cli proj --sandbox --no-launch --offline
 * then `stacks verify` three times in it (DO_NOT_TRACK=1), stdout and stderr
 * captured separately. Each run failed the same way: 6 steps passed, 16
 * failed, exit 5.
 *   PERSON  `stacks verify` on a pseudo-terminal (`script -q`) with every
 *           agent marker and CI removed from the environment.
 *   AGENT   `CLAUDECODE=1 stacks verify`, stdout and stderr redirected.
 *   SCRIPT  `stacks verify --json`, stdout and stderr redirected.
 * The lines kept are in ./fixtures/06-stacks-verify.json, byte for byte, with
 * the terminal run's colour codes still in them.
 *
 * How the panes show them (45 characters fit across one):
 *   - the terminal run's colour codes become the line's tone (green passed,
 *     pink failed) and are removed from the text;
 *   - a line longer than the pane either wraps between words or, for the step
 *     rows, is cut with "…";
 *   - a row that is only "…" stands for lines that are not shown (the report
 *     is 192 lines on a terminal);
 *   - the JSON is one 15,886-character line on stdout and a 44-event stream
 *     on stderr ending in the error envelope. The pane shows the object's
 *     first 44 characters and the first 211 of the envelope's 1,148, broken into rows by
 *     hand. `piece` throws at build time if a row is not in the capture.
 *   - AGENT prints stderr's `> step` lines before stdout's report, the order
 *     they reach one terminal.
 *
 * EXIT_CODES: ~/Projects/stacks/packages/cli/docs/reference/output.md lines
 *   74 to 83 (stacks commit a952e96). `action` is the opening words of the
 *   table's "Next action" cell, cut at a sentence or clause boundary.
 * AUDIENCE_RULE: src/services/output.ts lines 24 to 32, `resolveAudience`.
 * AGENT_MARKERS: src/config.ts lines 62 to 73, `AgentMarkers`. The slide
 *   prints one marker per agent plus the cross-agent AI_AGENT.
 */
import type { TermLine } from './types'
import { cut } from './02-two-users'
import fixture from './fixtures/06-stacks-verify.json'

export const RECORDED = fixture.recorded
export const CLI = fixture.cli
/** The exit status of all three runs. */
export const VERIFY_EXIT = fixture.human.exit

/** Characters per row in a pane on this slide, at the 26px terminal size. */
export const COLS = 45

const ELLIPSIS = '…'
const gap: TermLine = { text: ELLIPSIS, tone: 'muted' }
const SGR = /\u001b\[(\d+)m/g

/** A captured terminal line: its colour codes become a tone and leave the text. */
function fromTerminal(raw: string): TermLine {
  const codes = [...raw.matchAll(SGR)].map((m) => m[1])
  const tone = codes.includes('32') ? 'ok' : codes.includes('31') ? 'fail' : 'out'
  return { text: raw.replace(SGR, ''), tone }
}

/** Wrap between words at `cols`, as a browser wraps a paragraph. */
function wordWrap(text: string, cols: number): string[] {
  const rows: string[] = []
  let row = ''
  for (const word of text.split(' ')) {
    if (row && row.length + 1 + word.length > cols) {
      rows.push(row)
      row = word
    } else row = row ? `${row} ${word}` : word
  }
  return [...rows, row]
}

const wrapped = (line: TermLine): TermLine[] => wordWrap(line.text, COLS).map((text) => ({ ...line, text }))
const clipped = (line: TermLine): TermLine => ({ ...line, text: cut(line.text, COLS) })

/** A row of JSON, checked against the capture it is said to come from. */
function piece(source: string, text: string): TermLine {
  if (!source.includes(text)) throw new Error(`06-stacks-output: "${text}" is not in the capture`)
  return { text, tone: 'out' }
}

const [hHead, hInstall, hHooks, hLint, hDetail, hNext] = fixture.human.lines.map(fromTerminal)

/** PERSON: the report as a terminal shows it. */
export const PERSON_LINES: readonly TermLine[] = [
  { text: fixture.human.command, tone: 'cmd' },
  ...wrapped(hHead),
  clipped(hInstall),
  clipped(hHooks),
  clipped(hLint),
  hDetail,
  gap,
  ...wrapped(hNext),
]

const [aStep1, aStep2] = fixture.agent.stderr
const [aHead, aLint, aDetail, aNext] = fixture.agent.stdout.map((text): TermLine => ({ text, tone: 'out' }))

/** AGENT: the same report with an agent marker set. No colour codes were in the capture. */
export const AGENT_LINES: readonly TermLine[] = [
  { text: fixture.agent.command, tone: 'cmd' },
  { text: aStep1, tone: 'out' },
  { text: aStep2, tone: 'out' },
  gap,
  ...wrapped(aHead),
  clipped(aLint),
  aDetail,
  gap,
  ...wrapped(aNext),
]

const out = fixture.json.stdoutHead
const envelope = fixture.json.stderrLast
const next = [
  piece(envelope, '"next":"fix the code or config these steps '),
  piece(envelope, 'exercise, not the steps, then run stacks '),
  piece(envelope, 'verify again.",'),
]

/** SCRIPT: the result object on stdout, then the error envelope that ends stderr. */
export const SCRIPT_LINES: readonly TermLine[] = [
  { text: fixture.json.command, tone: 'cmd' },
  piece(out, '{"outcome":"failed","scope":"full","steps":['),
  gap,
  piece(envelope, '{"error":{"tag":"VerifyFailed","message":'),
  piece(envelope, '"Verify failed.","retryable":false,'),
  ...next,
  piece(envelope, '"details":{"failed":[{"name":"lint",'),
  gap,
]
/** Rows of SCRIPT_LINES that hold the envelope's `next` field. */
export const NEXT_ROWS: readonly number[] = next.map((line) => SCRIPT_LINES.indexOf(line))

/** One marker per agent, in the order config.ts checks them, then the cross-agent one. */
export const AGENT_MARKERS = ['CLAUDECODE', 'CODEX_SANDBOX', 'OPENCODE', 'CURSOR_AGENT', 'AI_AGENT'] as const

export interface ExitCode {
  code: number
  /** The opening words of the "Next action" cell in output.md's exit table. */
  action: string
}

/** Every row of the exit table, in its order. */
export const EXIT_CODES: readonly ExitCode[] = [
  { code: 0, action: 'Success' },
  { code: 1, action: 'A bug in stacks' },
  { code: 2, action: 'Fix the input' },
  { code: 3, action: 'Fix the configuration' },
  { code: 4, action: 'Retry later' },
  { code: 5, action: 'Read the verify report' },
  { code: 6, action: 'Ask a person' },
  { code: 130, action: 'The run was stopped' },
]
/** The two codes the last beat is about: a failed verify, and a refused step. */
export const READ_REPORT = 5
export const ASK_PERSON = 6
