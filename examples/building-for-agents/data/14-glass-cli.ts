/**
 * Slide 14: the StatGlass agent CLI. Sourced in data/sources/14-glass-cli.md.
 * Read 2026-11-13 from ~/Projects/statglass at commit 5db8622a.
 *
 * The session is illustrative: nobody recorded it. Its parts come from here:
 * SUBCOMMANDS:  the `Command` enum in crates/statglass-cli/src/cli.rs.
 * HISTORY_TEXT: the exact stdout asserted by
 *   `history_agent_text_matches_the_rfc_shape`, crates/statglass-cli/tests/cli.rs
 *   lines 321 to 349. That test passes `--from 13:00 --to 16:00`; the slide's
 *   command uses `--since 3h` (cli.rs's own help example), the same range read
 *   at 16:00.
 * NOW_ANSWER:   made-up values in the real shape: `NowAnswer`, `NowHost`,
 *   `HostRef`, `Freshness` and `Reading` in crates/statglass-query/src/answer.rs
 *   lines 97 to 153, with field order and optional fields as serde writes
 *   them. The m1-linux id and the timestamp format are the test fixtures'
 *   (crates/statglass-query/src/tests.rs lines 16 to 21 and 88). The CLI prints
 *   --json as one line (`serde_json::to_string`, crates/statglass-cli/src/main.rs
 *   line 39); the slide wraps it where a terminal would.
 * BUSY_ENVELOPE: the value asserted by `cli_envelope_shape`,
 *   crates/statglass-query/src/tests.rs lines 383 to 399.
 * The reason for Rust is quoted through data/code/14-glass-cli.ts; the three
 * sizes below are the RFC's, plan/rfc-agent-cli.md lines 106 to 109.
 */
import type { TermLine } from './types'

/** Every subcommand the CLI has, in declaration order. */
export const SUBCOMMANDS = ['guide', 'hosts', 'now', 'metrics', 'history', 'events', 'top', 'doctor', 'schema', 'skill'] as const
/** The four the card names: the ones that read readings and history. */
export const READ_COMMANDS = ['now', 'history', 'events', 'top'] as const

/**
 * The RFC's sizes. The first is an estimate ("about 55 to 60 MB per
 * architecture"), not a measurement. Nothing here is the CLI's own size: the
 * RFC does not give one, and the slide must not.
 */
export const RFC_SIZES = {
  compiledTsBinaryMb: [55, 60],
  appMb: 36,
  helperBinaryKb: 550,
} as const

export const REQUEST = 'Which machine is least busy, and what was m1-linux doing for the last three hours?'
export const NOW_COMMAND = 'statglass now --all --json'
export const HISTORY_COMMAND = 'statglass history cpu.total --host m1-linux --since 3h'
export const EVENTS_COMMAND = 'statglass events --host m1-linux --since 3h --json'

const reading = (value: number) => ({ series: 'cpu.total', value, unit: 'percent', module: 'cpu' })
const FRAME_AT = '2026-11-03T16:00:00-08:00'

/** Illustrative values in the real `NowAnswer` shape. */
export const NOW_ANSWER = {
  hosts: [
    { host: { id: '2a7e', name: 'studio' }, frame_at: FRAME_AT, age_ms: 800, readings: [reading(41.2)] },
    {
      host: { id: '8c1f', name: 'm1-linux' },
      freshness: { state: 'connected' },
      frame_at: FRAME_AT,
      age_ms: 1200,
      readings: [reading(6.3)],
    },
  ],
}

/** Exact agent text from the CLI's test. */
export const HISTORY_TEXT = [
  'cpu.total on m1-linux, 13:00 to 16:00 (1 min buckets, 98% measured)',
  'min 2.1%  mean 18.4%  max 97.0% in the minute from 15:12  last 6.3% at 16:00  (mean approximate)',
  'gap 14:31 to 14:37: host offline',
] as const

/** The CLI's error envelope, exactly as the test asserts it. */
export const BUSY_ENVELOPE = {
  error: {
    tag: 'Busy',
    message: 'StatGlass is busy; retry shortly.',
    retryable: true,
    next: 'retry in a second',
  },
}

/** Terminal columns the pane shows. The longest history line is 96 wide. */
export const COLUMNS = 100

/** One printed line, cut where a terminal of `COLUMNS` columns would wrap it. */
function wrap(text: string): string[] {
  const rows: string[] = []
  for (let at = 0; at < text.length; at += COLUMNS) rows.push(text.slice(at, at + COLUMNS))
  return rows
}
const out = (text: string): TermLine[] => wrap(text).map((row) => ({ text: row, tone: 'out' }))

/** The first exchange: the request, two commands and what they print. */
export const SESSION: readonly TermLine[] = [
  { text: REQUEST, tone: 'user' },
  { text: NOW_COMMAND, tone: 'cmd' },
  ...out(JSON.stringify(NOW_ANSWER)),
  { text: HISTORY_COMMAND, tone: 'cmd' },
  ...HISTORY_TEXT.map((text): TermLine => ({ text, tone: 'out' })),
]
/** The second: a command that got the busy envelope. */
export const RETRY: readonly TermLine[] = [
  { text: EVENTS_COMMAND, tone: 'cmd' },
  ...out(JSON.stringify(BUSY_ENVELOPE)),
]
/** Index of the gap line within SESSION. */
export const GAP_LINE = SESSION.findIndex((line) => line.text.startsWith('gap '))
