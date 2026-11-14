/**
 * Slide 2: two users. Sourced in data/sources/02-two-users.md.
 *
 * Everything shown is rr's own site fixture: `rr test` in the OpenData
 * monorepo, recorded on 2026-11-02 by ~/Projects/rr/site/scripts/capture-demo.sh
 * (rr commit 536948d, read 2026-11-13). That script runs the task twice, back
 * to back: once plain, with stderr saved as run.jsonl (the JSON events), then
 * again with --pretty, saved as raw/run.pretty.ansi (the bytes) and scrubbed
 * to run.pretty.txt (the text). So the two panes are the same command on the
 * same tree, 32 minutes apart, and their totals differ: the JSON run failed 3
 * of 8 tasks, the --pretty run 2 of 8.
 *
 * The lines live in ./fixtures/02-rr-run.json, copied from
 * ~/Projects/rr/site/fixtures/ with each line's 1-based number in its file:
 *   pretty: 10 of run.pretty.txt's 43 lines, in order. Where non-blank lines
 *           were dropped between two of them the pane shows a row that is
 *           only "…".
 *   ansi:   lines 6 to 13 of raw/run.pretty.ansi, every byte. The escape byte
 *           (0x1b) is written out as \e so it can be seen, and a line longer
 *           than the pane wraps at the pane's width, as a terminal wraps it.
 *           raw/ is gitignored in rr; these eight lines hold no local paths.
 *   events: all 4 lines of run.jsonl. The three phase events are cut at the
 *           pane's width with "…" (they are 155 to 407 characters long). The
 *           result event (2,286 characters) wraps at the pane's width and is
 *           cut with "…" after RESULT_ROWS rows.
 */
import type { TermLine } from './types'
import fixture from './fixtures/02-rr-run.json'

/** The date in the --pretty run's log directory (test-20261102-111320) and in every event's `ts`. */
export const RECORDED = '2026-11-02'

/** Characters per row in a pane on this slide, at the 26px terminal size. */
export const COLS = 70

/** How many wrapped rows of the result event the pane shows. */
export const RESULT_ROWS = 7

const ELLIPSIS = '…'

/** Break a line into rows of `cols` characters, the way a terminal wraps it. */
export function hardWrap(text: string, cols: number): string[] {
  const rows: string[] = []
  for (let i = 0; i < text.length; i += cols) rows.push(text.slice(i, i + cols))
  return rows.length ? rows : ['']
}

/** Cut a line to `cols` characters, ending in "…" only when something was cut. */
export function cut(text: string, cols: number): string {
  return text.length > cols ? text.slice(0, cols - 1) + ELLIPSIS : text
}

const toneOf = (text: string): TermLine['tone'] =>
  text.trimStart().startsWith('✕') ? 'fail' : text.trimStart().startsWith('◉ test') ? 'ok' : 'out'

/** What a person sees: `rr --pretty test`, the summary rr prints when the run ends. */
export const PRETTY_LINES: readonly TermLine[] = [
  { text: 'rr --pretty test', tone: 'cmd' },
  ...fixture.pretty.lines.flatMap((line): TermLine[] => [
    ...(line.dropped > 0 ? [{ text: ELLIPSIS, tone: 'muted' as const }] : []),
    { text: line.text, tone: toneOf(line.text) },
  ]),
]

/** The same output as bytes: eight lines of the capture with the escape byte written as \e. */
export const RAW_LINES: readonly TermLine[] = fixture.ansi.lines.flatMap((line) =>
  hardWrap(line.text.replaceAll('\u001b', '\\e'), COLS).map((text): TermLine => ({ text, tone: 'out' })),
)
/** Rows of RAW_LINES that hold an escape sequence. */
export const RAW_ESCAPE_ROWS: readonly number[] = RAW_LINES.flatMap((line, i) => (line.text.includes('\\e[') ? [i] : []))

const events = fixture.events.lines.map((line) => line.text)
const phases = events.filter((text) => !text.startsWith('{"type":"result"'))
const result = events.find((text) => text.startsWith('{"type":"result"')) ?? ''
const resultRows = hardWrap(result, COLS)
  .slice(0, RESULT_ROWS)
  .map((row, i, rows) => (i === rows.length - 1 ? cut(row + ELLIPSIS, COLS) : row))

/** What the agent reads: `rr test`, the JSON events rr writes to stderr by default. */
export const EVENT_LINES: readonly TermLine[] = [
  { text: 'rr test', tone: 'cmd' },
  ...phases.map((text): TermLine => ({ text: cut(text, COLS), tone: 'out' })),
  ...resultRows.map((text): TermLine => ({ text, tone: 'out' })),
]
/** Rows of EVENT_LINES that belong to the result event. */
export const RESULT_ROW_INDEXES: readonly number[] = resultRows.map((_, i) => 1 + phases.length + i)

/**
 * Totals the notes say aloud. PRETTY: run.pretty.txt line 34 ("6 passed, 2
 * failed, 8 total") and line 35 (three hosts). EVENTS: the result event's
 * `details.failed`, `details.passed` and `details.total` in run.jsonl line 4.
 * The task that differs is test-e2e-fast: in `details.failures` of the JSON
 * run, and passed on run.pretty.txt line 29.
 */
export const PRETTY_TOTALS = { passed: 6, failed: 2, total: 8, hosts: 3 } as const
export const EVENT_TOTALS = { passed: 5, failed: 3, total: 8 } as const
/** Minutes between the two runs: log directories test-20261102-104112 and test-20261102-111320. */
export const MINUTES_APART = 32
