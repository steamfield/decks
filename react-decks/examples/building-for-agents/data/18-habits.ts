/**
 * Slide 18: six habits. Sourced in data/sources/18-habits.md.
 *
 * A matrix of six habits by the seven products. A cell is lit only where a
 * file in that product's repo shows the habit; `proof` names the file and
 * `mark` is the short word the cell prints. Every proof was opened on
 * 2026-11-13 at these commits:
 *   stacks a952e96 · foreman (~/Projects/claude-codex) 9413fa8 · rr 536948d ·
 *   statglass 5db8622a · opendata d9b5ee7c4 · openchart 26bd0ba6 ·
 *   decks 811fe91 (this repository)
 * Paths are relative to ~/Projects/<repo>, or to this repository for Decks.
 *
 * Cells OUTLINE.md section 10 lists that are left unlit here, and why:
 *   - rr, "Every exit code is documented": rr returns the remote command's exit
 *     code unchanged (docs/configuration.md lines 417 to 419). Its one-code,
 *     one-fix scheme is the string `error.code`, which is not an exit code.
 *   - OpenChart, "A command checks the work": validateSpec is a function a caller
 *     imports (packages/engine/src/compiler/validate.ts line 298), and the
 *     repo ships no command that runs it.
 *   - Stacks, "Several agents can run it": the state record outside the
 *     project guards the verify steps against edits. Nothing found in the
 *     repo is about two agents in one project.
 *   - OpenChart, "Docs ship with the tool": llms.txt is at the repo root, and
 *     the published package's `files` are only `dist` and `schema`
 *     (packages/core/package.json lines 34 to 37).
 */
import type { ProductId } from './products'

export interface Cell {
  /** The word the lit cell prints: a flag, a field or a command from the proof. */
  mark: string
  /** The file that shows it. */
  proof: string
}

export interface Habit {
  id: string
  /** The row label: five words at most. */
  label: string
  cells: Partial<Record<ProductId, Cell>>
}

export const HABITS: readonly Habit[] = [
  {
    id: 'output',
    label: 'Programs can parse the output',
    cells: {
      stacks: { mark: '--json', proof: 'stacks/packages/cli/src/commands/schema.ts line 38; docs/reference/output.md line 60' },
      foreman: { mark: '--json', proof: 'claude-codex/README.md line 67' },
      rr: { mark: 'JSON events', proof: 'rr/README.md line 104' },
      statglass: { mark: '--json', proof: 'statglass/crates/statglass-cli/src/cli.rs lines 297 to 315' },
      opendata: { mark: 'outputSchema', proof: 'opendata/mcp/src/tools/query-sql.ts line 75' },
      openchart: { mark: 'JSON Schema', proof: 'openchart/packages/core/package.json lines 29 to 32' },
    },
  },
  {
    id: 'next',
    label: 'The next step is printed',
    cells: {
      stacks: { mark: 'next', proof: 'stacks/packages/cli/tests/errors.test.ts lines 373 to 380' },
      foreman: { mark: 'next: or:', proof: 'claude-codex/src/core/command-output.ts lines 171 to 172' },
      rr: { mark: 'suggestion', proof: 'rr/internal/errors/errors.go lines 29 to 49; README.md line 118' },
      statglass: { mark: 'next', proof: 'statglass/crates/statglass-cli/src/failure.rs lines 123 to 125' },
      opendata: { mark: 'Retry after', proof: 'opendata/mcp/src/tools/error.ts lines 30 to 53' },
      openchart: { mark: 'suggestion', proof: 'openchart/packages/engine/src/compiler/validation/helpers.ts lines 91 to 96' },
    },
  },
  {
    id: 'exit',
    label: 'Every exit code is documented',
    cells: {
      stacks: { mark: '5 = report', proof: 'stacks/packages/cli/docs/reference/output.md lines 70 to 83' },
      foreman: { mark: '7 = not found', proof: 'claude-codex/README.md lines 119 to 134' },
      statglass: { mark: '6 = ask user', proof: 'statglass/crates/statglass-cli/src/cli.rs lines 20 to 22' },
    },
  },
  {
    id: 'done',
    label: 'A command checks the work',
    cells: {
      stacks: { mark: 'verify', proof: 'stacks/packages/cli/README.md line 35' },
      foreman: { mark: 'contract', proof: 'claude-codex/src/guide/contract.ts lines 57 to 62' },
      decks: { mark: 'check, lint', proof: 'packages/decks/scripts/deck.mjs lines 16 to 18' },
    },
  },
  {
    id: 'several',
    label: 'Several agents can run it',
    cells: {
      foreman: { mark: 'worktrees', proof: 'claude-codex/README.md lines 3 and 73' },
      rr: { mark: 'host locks', proof: 'rr/internal/lock/lock.go line 103; README.md lines 24 and 86' },
      decks: { mark: 'free ports', proof: 'packages/decks/scripts/deck.mjs lines 180 to 196' },
    },
  },
  {
    id: 'docs',
    label: 'Docs ship with the tool',
    cells: {
      stacks: { mark: 'guide', proof: 'stacks/packages/cli/README.md lines 46 to 59' },
      foreman: { mark: 'guide', proof: 'claude-codex/README.md lines 31 to 33' },
      rr: { mark: 'plugin skill', proof: 'rr/plugins/rr/skills/rr/SKILL.md; rr/.claude-plugin/marketplace.json' },
      statglass: { mark: 'guide', proof: 'statglass/crates/statglass-cli/src/guide.rs line 8; src/skill.rs line 10' },
      decks: { mark: 'decks init', proof: 'packages/decks/scripts/deck.mjs lines 8 to 9; packages/decks/agent/' },
    },
  },
]

/** Rows light this many at a time. */
export const ROWS_PER_BEAT = 2

/** Lit cells, for the notes and the source table. */
export const LIT_CELLS = HABITS.reduce((sum, habit) => sum + Object.keys(habit.cells).length, 0)

/** How many agents Riley runs at once, low and high. FLAG: author-reported (OUTLINE.md section 11). */
export const AGENTS_AT_ONCE = [2, 4] as const
