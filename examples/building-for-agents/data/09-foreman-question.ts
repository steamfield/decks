/**
 * Slide 9: the held question. Sourced in data/sources/09-foreman-question.md.
 * Read 2026-11-13 from ~/Projects/claude-codex at commit 9413fa8. The code on
 * the slide is in data/code/09-foreman-question.ts.
 */
import type { TermLine } from './types'

/**
 * Minutes a question is held before the daemon answers it itself:
 * src/supervisor/turns.ts line 304, `body.questionTimeoutMs ?? 900_000`.
 */
export const QUESTION_TIMEOUT_MIN = 900_000 / 60_000

/** `wc -l tests/fixtures/fake-app-server/main.mjs`. */
export const FAKE_SERVER_LINES = 117

/** The method Codex calls: src/schemas/codex.ts line 36, `toolCall: "item/tool/call"`. */
export const TOOL_CALL_METHOD = 'item/tool/call'
/** The tool's name: src/supervisor/questions.ts line 109. */
export const TOOL_NAME = 'ask_orchestrator'

/**
 * What `foreman wait` prints for a pending question. These are the first and
 * fourth lines of the example in docs/rfcs/0001-foreman.md, lines 281 to 285,
 * with the question cut short. No recorded wait that returned a question is
 * in the repo's fixtures, so the doc's own example is quoted.
 */
export const WAIT_OUTPUT: readonly TermLine[] = [
  { text: 'question  unit-a q2 (blocked): lint rejects the CLI-help…', tone: 'warn' },
  { text: 'next: foreman answer unit-a q2 "<answer>"', tone: 'out' },
]
export const WAIT_OUTPUT_SOURCE = 'docs/rfcs/0001-foreman.md'
