# Delegating work to Codex

How Claude Code hands framework, deck and site work to Codex runs (`foreman` or
`codex-delegate`) in this repo. `AGENTS.md` is the rulebook both sides follow; this file is the
procedure around it.

## For the orchestrator

- Guidance for Codex lives in `AGENTS.md`: Codex has no path-glob rules. After each run, add
  what its diff and hand-off taught you to that file's Proportion or Testing section (keep it
  under 20 KB) and add a row to `docs/delegation-log.md`.
- Contracts come from `.claude/delegate/contract.md`. Fill its QA section with three to five
  concrete situations a user would hit; runs find spec flaws by replaying those. Copy the
  signatures and behaviour tables a run needs out of `docs/architecture.md` into the
  contract's Interface section. Write QA situations against the real data and code, not the
  shape you remember.
- Parallel runs get disjoint May-change paths. Registration lines (an `index.ts` export, a
  stylesheet `@import`) go in their sorted place, imports before rules; say so in the
  contract, and expect to resolve those merges yourself.
- Only you edit `docs/`, any `package.json`, any `packages/*/src/index.ts`, `biome.json`,
  `tsconfig.json`, `vitest.config.ts`, `decks.json`, and the agent harness. A run asks for such
  a change in its hand-off.
- After a run: read the hand-off and the diff, refactor with Edit, run `bun run check` in the
  worktree, merge with `--no-ff`, archive the run. After merging several runs, run the whole
  gate on a cold Vite cache (`find . -path '*/node_modules/.vite' -prune -exec rm -rf {} +`)
  and `bun run check:isolated` and `bun run test:tarball`: integration faults surface there.
- Run gates in a worktree, not the main checkout, when anyone may be editing the checkout:
  Playwright's dev servers watch the source.

### Worktrees and setup

One worktree per run, under `.claude/worktrees/<name>`, cut from the branch that holds every
run the new one depends on: `foreman start <name> --new-worktree --from <branch> --setup "bun
install" ...`. For `codex-delegate`, run `bun install` in the new worktree before the runner.

### Hook trust

The repo's Codex hooks (`.codex/hooks.json`) are reviewed and safe to trust: a `PreToolUse` hook
on `apply_patch` that runs `decks hook lint` from source and denies deck prose with an
error-level pattern, and a `UserPromptSubmit` hook that adds the deck-writing reminder. Both only
read their hook JSON and the repo's pattern file.

- `foreman`: worktrees under `.claude/worktrees/` inherit the approval given in the main checkout
  (`codex`, then `/hooks`; `foreman doctor` reports it). After `.codex/hooks.json` changes the
  approval must be given again. If `foreman start` refuses for untrusted hooks, ask the user to
  approve them; don't work around it.
- `codex-delegate`: start the runner with `DELEGATE_TRUST_REPO_HOOKS=1` in front.

## For the delegate

- Read `AGENTS.md` (the whole rulebook) and `docs/architecture.md` before the first edit. Load
  `ce:architecting-systems`, `ce:writing-tests` and `ce:handling-errors`.
- If `node_modules/` is missing, run `bun install`.
- Iterate on the scoped test command in your contract, then `bun run lint` and `bun run
  typecheck`. Run the whole gate as `rr run --local "bun run check"`: rr takes a machine-wide
  lock, so parallel runs queue their gates instead of starving each other's build and browser
  tests. Run each new test file three times alone, then `bun run test` once; a new or
  changed Playwright spec with `--repeat-each=5`.
- Deck work: read `plugins/decks/skills/working-with-decks/SKILL.md` and the skills it routes
  to. A hook deny means rewrite the prose; never route the write around it.
- Do not edit the orchestrator's files listed above, or commit. When a maintained library would
  do a job better than hand-written code and is not installed, ask for it in a question; do not
  edit a `package.json`.
