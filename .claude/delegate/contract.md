# Contract: {TITLE}

<!-- Orchestrator: copy to a scratch file outside the worktree and fill every {placeholder}.
Remove this comment. Start with:
foreman start {RUN} --new-worktree --from main --setup "bun install" --contract <this file> --write --model {MODEL} --wait
Codex loads AGENTS.md itself. List under Read first only what this task needs. -->

## Goal

{The observable behaviour to add, why it exists, and which section of
`docs/architecture.md` it implements.}

## Read first

- `AGENTS.md`: the whole rulebook (boundaries, proportion, testing, React).
- `docs/architecture.md`, sections {N}
- {Existing files whose behaviour is being ported, with line ranges.}

Read anything else when the work reaches it, not up front.

## Skills to apply

`ce:architecting-systems` when adding or shaping a module; `ce:writing-tests` (with its `references/typescript-react.md` and `references/waiting-typescript.md`) for every test: behaviour through the public interface, real dependencies, integration by default, no mocks of this workspace's own code, no sleeps.
If a named skill is not installed, say so in the hand-off and continue with the repo's rules.
Say in the hand-off where skills changed your approach. The repo's rules win where they
differ.

## Interface

{Signatures and behaviour tables copied from the architecture document. The exports already
exist in `src/index.ts`; implement them, do not rename or add to them.}

## Before you code

Spend a few minutes trying to break the spec, not the code. Replay each situation in the
QA paragraph of Acceptance against the behaviour specified above, by hand, writing the
sequence of events and the result. For anything with more than one actor, also step through
the interleavings listed under Proportion in `AGENTS.md`. Keep the list; it goes
in the hand-off as "Spec concerns". If a concern means the feature would not work as a user
expects, ask the orchestrator before implementing.

## Scope

- May change:
  - `{packages/<pkg>/src/<files or dir/>}`
- Must not change: every other path, including `docs/`, every `package.json`,
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
bun run test {scoped path}
bun run lint
bun run typecheck
```

Run each new test file three times on its own, then `bun run test` once.
Do not run `check:isolated`; the orchestrator does. Report unrelated failures without
weakening or skipping tests.

Then QA as the first user. Replay these situations and record what happened in each:
{three to five concrete situations a user would hit, written as actions: "open the presenter
window mid-talk", "reload the audience window", "press next twice quickly". For a library
module with nothing to run, replay them by hand against the code.}

## Do not

- Commit or push; leave changes for review.
- Disable lint, weaken a test, add a cast or suppress a type error to get green.
- Add features, options, abstractions or exports the goal does not need.
- Hand-write generic infrastructure a library already does well. Use the libraries in
  section 1.1 of the architecture document; if another would fit, ask the orchestrator for it
  in a question and wait for the answer. Do not edit a `package.json`.
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
main. Read the contract at {ABSOLUTE CONTRACT PATH} first, then
docs/architecture.md and AGENTS.md. Your sandbox is
read-only; don't run tests or edit files. The author already ran the checks. Where the
change has behaviour a user sees, do not stop at reading the diff: reason through what
happens on screen frame by frame for each situation in the contract's QA list, and for each
library API the change calls, check the installed version's type declarations for
`@deprecated` and `@experimental` tags. Report every
real defect with a file:line reference: behaviour that differs from the contract's tables,
missing edge cases, tests that cannot fail or assert implementation details, boundary
violations, and code the contract did not ask for. Then review the spec itself: name any
realistic situation in which the behaviour the contract specifies would be wrong for a
user, even though the code implements it faithfully."

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
6. Look closer at: assumptions, edge cases or tests the orchestrator should examine, and any
   hardening you chose not to build.
   Spec concerns: every situation you found where the specified behaviour surprises a user,
   from your own pass and from the review, whether or not you think it matters.
7. Open: unfinished work, blockers, and any change needed in an orchestrator-owned file,
   given as the exact line.
