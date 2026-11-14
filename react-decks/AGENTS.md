# react-decks

A React slide framework that will replace Slidev in this repo. It is a self-contained bun
workspace: it has its own `package.json`, lockfile and `node_modules`, and is not part of the
outer repo's workspace. Run its commands with `--cwd react-decks` from the repo root, or from
inside this directory.

## Read before you edit

- `docs/architecture.md` is the design. A section marked Final is a contract. Ask before
  deviating from it; do not "improve" a signature.
- The rules in `.claude/rules/react-decks/` at the repo root: `architecture.md`, `testing.md`
  and `react.md`. Codex does not load them on its own. Read all three before the first edit.
- Load the `ce:architecting-systems` skill before adding or moving a module and the
  `ce:writing-tests` skill before writing or changing a test. The rule files win where they
  differ from a skill.

## Packages

```
kit -> motion -> runtime -> core <- node
```

| Package | What it is | Environment |
| --- | --- | --- |
| `packages/core` | Pure deck logic: navigation, clicks, URL codec, notes, sync protocol, canvas fit | none: no React, no DOM, no Node |
| `packages/runtime` | React client: store, hooks, canvas, views, transitions | browser |
| `packages/motion` | Motion tokens, step primitives, timelines | browser |
| `packages/node` | Vite plugins, the `decks` CLI, export, tooling | Node |
| `packages/kit` | The ported addon: components, story engine, theme | browser |

A package imports only what the table in `docs/architecture.md` section 1 allows, by bare
package name. `tests/boundaries.test.ts` fails the build otherwise.

## Commands

```bash
bun install --cwd react-decks          # once per worktree
bun run --cwd react-decks lint         # biome
bun run --cwd react-decks typecheck    # tsc --noEmit
bun run --cwd react-decks test         # vitest, both projects
bun run --cwd react-decks test <path>  # one file
bun run --cwd react-decks check        # the gate: lint, typecheck, test
bun run --cwd react-decks check:isolated   # the gate in a copy outside the repo
```

## Files only the orchestrator edits

`docs/`, every `package.json`, every `packages/*/src/index.ts`, `biome.json`,
`tsconfig.json`, `vitest.config.ts`, `decks.json`. If your task needs a new export, say so in the
hand-off with the exact line. If it needs a dependency, ask the orchestrator in a question
before writing a substitute.

## Proportion

These come from mistakes made in this workspace. They outrank a wish to be thorough.

- Build what the contract's acceptance asks for and stop. Hardening beyond it (closing every
  bypass, handling inputs the domain cannot produce) is a note under "Look closer at", not
  code.
- If a piece of generic infrastructure is passing about 150 lines, stop and ask: there is
  probably a library, or the task is bigger than the contract thought.
- Never import an API whose path or docs call it unstable, experimental, internal or
  private. Ask instead.
- If something only works with a workaround (a custom resolver, an alias, a cast, a
  re-implemented copy of a type), the design is probably wrong. Ask before keeping it.
- A finding from your own review that asks for more than the contract does goes to the
  orchestrator as a question or a hand-off note. Do not expand scope to satisfy it.
- The spec can be wrong. Before coding, walk it through the situations a real user would
  hit and write down any where it gives a surprising result. For anything with more than one
  actor (windows, tabs, timers, a server and a client), step through the interleavings: both
  start at once, one restarts mid-way, a third joins during a change, a message arrives late.
  Implement the contract as written, and report what you found under "Spec concerns" in the
  hand-off. If the flaw would make the feature not work, ask first.

## Conventions

- One concept per file, its test beside it: `navigation.ts`, `navigation.test.ts`.
- No `utils/`, `shared/`, `helpers/` or `types/` directories. A type lives with the code that
  owns it.
- Named exports only. No default exports except where a tool requires one (Vite config, MDX).
- Reach for the library named in `docs/architecture.md` section 1.1, an installed dependency
  or a platform API before writing generic infrastructure by hand. If a library would fit and
  is not installed, ask for it; do not hand-roll around it.
- No abstraction with one implementation, no options nobody asked for, no speculative
  parameters. Three similar lines beat a helper.
- Errors: throw an `Error` whose message names the offending value. Never swallow one.
- Comments say why, when the why is not obvious. No comment restates the code.
