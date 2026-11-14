/**
 * Slide 4: the Stacks loop. Sourced in data-sources.md under "Slide 4".
 *
 * Everything here is one real project: tea-dashboard, scaffolded with
 * `stacks new sveltekit` (stacks 0.5.0) on 2026-10-29 and built by Claude
 * Code. It lives at ~/Projects/stacks-tests/tea-dashboard and is not a git
 * repository, so there is no commit to cite; the files were read on
 * 2026-11-13.
 *
 * RUNS: .stacks/state/runs.jsonl, one line per `stacks verify` run. Reread:
 *   python3 -c "import json;[print(r['secondsSinceCreated'],r['outcome'],[s['status'] for s in r['steps']]) for r in map(json.loads,open('.stacks/state/runs.jsonl'))]"
 * BRIEF_WORDS: `wc -w .stacks/BRIEF.md`.
 * STEPS, STACK, CLI, CREATED_AT, FRAGMENTS: .stacks/manifest.json
 *   (`verify[].name`, `stack.id`, `cli`, `createdAt`, `fragments[].id`).
 * HANDOFF_PROMPT: ~/Projects/stacks/packages/cli/src/core/handoff.ts line 114
 *   (stacks commit a952e96), with BRIEF_PATH and the invocation filled in.
 */

export const PROJECT = 'tea-dashboard'
export const STACK = 'sveltekit'
export const CLI = '0.5.0'
export const AGENT = 'Claude Code'
/** manifest.json createdAt, UTC. */
export const CREATED_AT = '2026-10-29T17:11:35Z'
export const RECORDED = '2026-10-29'
export const FRAGMENTS = ['agent-ops', 'ci-github', 'claude-harness', 'git-hooks'] as const

/** `wc -w .stacks/BRIEF.md`. */
export const BRIEF_WORDS = 4481

/** The command that scaffolded it. The directory name is the project's. */
export const COMMAND = `stacks new ${STACK} ${PROJECT}`

/** What `stacks new` wrote that the slide names. All four exist in the project. */
export const FILES = ['AGENTS.md', '.claude/', '.stacks/BRIEF.md', '.stacks/manifest.json'] as const
export const MANIFEST_FILE = '.stacks/manifest.json'

/** The whole prompt the agent is launched with, split where the slide wraps it. */
export const HANDOFF_PROMPT = [
  'Read .stacks/BRIEF.md and carry it out. It’s your full task',
  'for this project; you’re done when stacks verify passes.',
] as const

/** The manifest's verify steps, in run order (setup, check, serve). */
export const STEPS = [
  'install',
  'git-hooks-install',
  'lint',
  'typecheck',
  'test',
  'build',
  'e2e',
  'readme-filled',
  'agents-md-filled',
  'claude-readme-filled',
  'harness-hooks',
  'harness-doc-filled',
  'git-hooks-validate',
  'git-hooks-configured',
  'web',
] as const

export interface VerifyRun {
  /** Seconds since `stacks new`, from the run record's secondsSinceCreated. */
  at: number
  outcome: 'failed' | 'green'
  /** Names of the steps that failed. Every other step passed. */
  failed: readonly string[]
}

/** The three recorded runs, all full runs, all by Claude Code. */
export const RUNS: readonly VerifyRun[] = [
  {
    at: 393,
    outcome: 'failed',
    failed: ['lint', 'readme-filled', 'agents-md-filled', 'claude-readme-filled', 'harness-doc-filled'],
  },
  { at: 501, outcome: 'green', failed: [] },
  { at: 623, outcome: 'green', failed: [] },
]

/** The first failed run and the first green one: the two the cursor stops on. */
export const FIRST_FAIL = RUNS[0]
export const FIRST_GREEN = RUNS[1]

/** Timeline domain in seconds since scaffold; a little past the last run. */
export const TIMELINE_END = 660
