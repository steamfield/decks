# Contract: {TITLE}

<!-- Orchestrator: copy to a scratch file outside the worktree and fill every {placeholder}.
Remove this comment. Start with:
foreman start {RUN} --new-worktree --from react-decks --setup "bun install && bun install --cwd react-decks" --contract <this file> --write --model {MODEL} --wait
Codex loads AGENTS.md itself. List under Read first only what this task needs. -->

## Goal

{The observable behaviour to add, why it exists, and which section of
`react-decks/docs/architecture.md` it implements.}

## Read first

- `react-decks/AGENTS.md`
- `react-decks/docs/architecture.md`, sections {N}
- `.claude/rules/react-decks/architecture.md`
- `.claude/rules/react-decks/testing.md`
- {`.claude/rules/react-decks/react.md` for runtime, motion, kit or examples work}
- {Existing files whose behaviour is being ported, with line ranges.}

Read anything else when the work reaches it, not up front.

## Skills to apply

`ce:architecting-systems` when adding or shaping a module; `ce:writing-tests` for every test.
If a named skill is not installed, say so in the hand-off and continue with the repo's rules.
Say in the hand-off where skills changed your approach. The repo's rules win where they
differ.

## Interface

{Signatures and behaviour tables copied from the architecture document. The exports already
exist in `src/index.ts`; implement them, do not rename or add to them.}

## Scope

- May change:
  - `{react-decks/packages/<pkg>/src/<files or dir/>}`
- Must not change: every other path, including `react-decks/docs/`, every `package.json`,
  every `packages/*/src/index.ts`, `biome.json`, `tsconfig.json`, `vitest.config.ts`,
  `tests/boundaries.test.ts`.
- Locked: {tests another run wrote, or none}.

Edit no file outside May change. If the task cannot be done inside it, ask the orchestrator
before expanding scope. Do not commit, merge, remove worktrees or clean up the orchestrator's
scratch files.

## Acceptance

{One test per row of each behaviour table, named after the row, plus the edge cases listed.}

Run from the worktree root and iterate until the checks pass:

```sh
bun run --cwd react-decks test {scoped path}
bun run --cwd react-decks lint
bun run --cwd react-decks typecheck
```

Run each new test file three times on its own, then `bun run --cwd react-decks test` once.
Do not run `check:isolated`; the orchestrator does. Report unrelated failures without
weakening or skipping tests.

Then QA as the first user: {what to exercise by hand, or "nothing new to run: this is a
library module; QA is reading each exported function's behaviour against the table"}.

## Do not

- Commit or push; leave changes for review.
- Disable lint, weaken a test, add a cast or suppress a type error to get green.
- Add features, options, abstractions, exports or dependencies the goal does not need.
- Create `utils`, `shared`, `helpers` or `types` files or directories.
- Edit `~/.codex` config, hooks, trust or auth.
- Mention any repository outside this one in a tracked file.

## Review before hand-off

Once acceptance checks pass, get one independent review in a fresh Codex process and resolve
its findings. Use separate simple commands and the file-writing tool, not a shell function,
grouped command, heredoc or generated script. Run from the worktree root:

```sh
mktemp -d
```

Keep the printed absolute directory as the review directory. With the file-writing tool,
write `<review-directory>/prompt.md` containing:

"Review uncommitted changes and new files in {ABSOLUTE WORKTREE PATH} against base
react-decks. Read the contract at {ABSOLUTE CONTRACT PATH} first, then
react-decks/docs/architecture.md and the rules in .claude/rules/react-decks/. Your sandbox is
read-only; don't run tests or edit files. The author already ran the checks. Report every
real defect with a file:line reference: behaviour that differs from the contract's tables,
missing edge cases, tests that cannot fail or assert implementation details, boundary
violations, and code the contract did not ask for."

Then run, replacing `<review-directory>`:

```sh
codex exec --ephemeral --sandbox read-only -m "{MODEL}" -c 'model_reasoning_effort="high"' -c 'service_tier="priority"' -o "<review-directory>/review.md" - < "<review-directory>/prompt.md"
```

Read `review.md`. Fix every finding or explain in the hand-off why it is wrong. A bug finding
gets a regression test that fails without the fix. Rerun affected checks. One review only. If
the review cannot run, ask the orchestrator rather than claiming it passed.

## Hand-off

Finish when findings are resolved and acceptance passes, or when blocked. Leave everything
uncommitted and end with this report, naming files and symbols:

1. Summary: what you built, in two or three sentences.
2. Files: each file created or changed and why.
3. Decisions: choices the contract left open, deviations and why, where skills changed the
   approach, and every mechanism the contract did not name with the test that needed it.
4. Checks: each command and result with test counts; each new test file's three isolated runs
   and the full-suite result; QA.
5. Review: the review file's absolute path, each finding and its resolution or dispute.
6. Look closer at: assumptions, edge cases or tests the orchestrator should examine.
7. Open: unfinished work, blockers, and any change needed in an orchestrator-owned file,
   given as the exact line.
