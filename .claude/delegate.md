# Delegating deck work to Codex

This is the repo overlay that `codex-delegate` and `foreman` read before they start. It has two
parts. "For the orchestrator" is for the Claude session that writes contracts, starts runs,
reviews and commits. "For the delegate" is for the Codex run doing the work in its worktree;
`AGENTS.md` points Codex here, so a run reads it whichever tool started it.

## For the orchestrator

### What to delegate

Deck builds go through the wave plan and contract templates in
`.claude/skills/building-a-deck/contracts/` (start at its `README.md`). Fill a template per run;
don't write a deck contract from the generic one. Keep these yourself: scaffolding and wave 0,
edits to the agent harness (`.claude/`, `.codex/`, `packages/decks/agent/`), and any change to
`packages/decks/` that a deck run turns up (that gets an RFC in `docs/rfcs/`, per `AGENTS.md`).

### Files only the orchestrator edits

- A deck's `slides.md` (headmatter and the `src:` manifest with each slide's `clicks:`).
- `decks.json` and the root `package.json` (a font or other dependency goes in during wave 0).
- The deck's brief (`OUTLINE.md` or whatever the deck calls its spec).

A run that needs one of these changed says so in its hand-off, and you make the change.

### Worktrees and setup

One worktree per run, under `.claude/worktrees/<name>`, cut from the branch that holds wave 0
and every run the new one depends on. Every worktree needs `bun install` before any `bun run`
works:

- `foreman`: `foreman start <name> --new-worktree --from <branch> --setup "bun install" ...`.
- `codex-delegate`: run `bun install` in the new worktree before the runner.

### Hook trust

The repo's Codex hooks (`.codex/hooks.json`) are reviewed and safe to trust: a `PreToolUse` hook
on `apply_patch` that runs `node packages/decks/scripts/deck.mjs hook lint` and denies deck prose
with an error-level pattern, and a `UserPromptSubmit` hook that adds the deck-writing reminder.
Both only read their hook JSON and the repo's pattern file. Without them, a run writes prose the
lint would have refused and finds out only at `bun run lint`.

- `codex-delegate`: Codex trusts hooks per absolute path, and every worktree is a new path, so
  always start the runner with `DELEGATE_TRUST_REPO_HOOKS=1` in front
  (`env DELEGATE_TRUST_REPO_HOOKS=1 <runner> <contract> --write --worktree <path>`).
- `foreman`: worktrees under `.claude/worktrees/` inherit the approval given in the main checkout
  (`codex`, then `/hooks`; `foreman doctor` reports it). If `foreman start` refuses for untrusted
  hooks, ask the user to approve them; don't work around it.

### Filling a contract

- Replace every `{placeholder}`. `{deckDir}` is the deck directory relative to the repo root
  (`decks/<dir>` or `examples/<dir>`), `{alias}` its `decks.json` alias.
- `{reviewModel}` is the model the review step runs. With `foreman`, the literal model name you
  pass to `foreman start --model`. With `codex-delegate`, write `$DELEGATE_MODEL`: the runner
  exports the model it picked.
- `{contractPath}` is the filled contract's absolute path, outside the worktree, and
  `{worktree}` the worktree's absolute path. Both are needed only by the review step.
- Keep the "May change" list in the shape the template has (one backticked path per nested
  bullet, no blank line inside the list): `codex-delegate` parses it to report out-of-scope
  edits.

### After a run

Read the hand-off, then the diff. Check every touched path is in the contract's scope, run the
gate from "The gate" below in the run's worktree yourself, and commit there. Merge it before
starting any run that the contract's "Waits on" names it for.

## For the delegate

You are a Codex run working on one part of a deck in a git worktree. Your contract says which
files are yours. Leave your work uncommitted.

### Setup

If `node_modules/` is missing at the worktree root, run `bun install` before anything else. Run
every command from the worktree root.

### Rules Codex doesn't load on its own

`AGENTS.md` has a table, in its Codex section, of the `.claude/rules/` files and the paths each
covers. Before you edit a file, read every rule that covers it. Your contract lists them too.

### The write hook

The repo's `apply_patch` hook lints deck prose as you write it. A deny means rewrite the prose.
Never route a write around it with a shell heredoc, `sed` or a script: that skips the hook, and
`bun run lint` fails the deck later anyway.

### Screenshots

Take them with `bun run shot {alias} <slide> <clicks>`, which shoots clicks 0 through `<clicks>`
of one slide. With no `--port` it starts a dev server for the deck on a free port and stops it
after, so parallel runs never collide; don't pick a port for it. To shoot repeatedly against one
server, start `bun run dev {alias} --no-open --port N` in the background, read the port it
reports, and pass `--port N` to each `shot`; `shot` refuses a server that isn't this deck's in
this checkout. Restart that server after adding, moving or deleting a component file.

Look at every PNG yourself. Each run must print `errors: none` and no headline-wrap warning.

### The gate

Iterate on these from the worktree root until all pass:

```bash
bun run check
bun run typecheck
bun run test
bun run lint
bun run build {alias}
```

`bun run test` includes the story guards (beats and notes, durations, frame units, view
transition names, hex colors), which scan every story deck. The orchestrator runs the same gate
again before it commits.

### Don't

- commit, push, merge, or remove a worktree
- edit `slides.md`, `decks.json`, `package.json` or the deck's brief; ask for the change in the
  hand-off
- add a dependency
- mention a repository outside this one, or an absolute path, in a tracked file

## react-decks

Work under `react-decks/` (RFC 0007) follows this section in place of the deck-specific parts
above. The hook-trust and worktree notes above still apply.

### For the orchestrator

- Contracts come from `.claude/delegate/react-decks-contract.md`. Copy the signatures and
  behaviour tables a run needs out of `react-decks/docs/architecture.md` into the contract's
  Interface section; a run implements what its contract says.
- Setup: `foreman start <name> --new-worktree --from react-decks --setup "bun install && bun install --cwd react-decks" ...`.
- Parallel runs get disjoint May-change paths. Before starting runs that share a package,
  write that package's `src/index.ts` exports and any shared type yourself and commit them.
- Only you edit `react-decks/docs/`, any `package.json`, any `packages/*/src/index.ts`,
  `biome.json`, `tsconfig.json`, `vitest.config.ts`, `react-decks/decks.json`, and the agent
  harness. A run asks for such a change in its hand-off.
- After a run: read the hand-off and the diff, refactor with Edit, then run
  `bun run --cwd react-decks check` and `bun run --cwd react-decks check:isolated` in the
  worktree before committing. Merge into the `react-decks` branch.

### For the delegate

- Read `react-decks/AGENTS.md`, `react-decks/docs/architecture.md` and the three rules under
  `.claude/rules/react-decks/` before the first edit. Load `ce:architecting-systems` and
  `ce:writing-tests`.
- If `react-decks/node_modules/` is missing, run `bun install --cwd react-decks`.
- Iterate on the scoped test command in your contract, then `bun run --cwd react-decks lint`
  and `bun run --cwd react-decks typecheck`. Run each new test file three times alone, then
  `bun run --cwd react-decks test` once.
- Do not edit the files listed as the orchestrator's in `react-decks/AGENTS.md`, or commit.
  When a maintained library would do a job better than hand-written code and is not
  installed, ask the orchestrator for it in a question; do not edit a `package.json`.
