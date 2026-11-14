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
`tsconfig.json`, `vitest.config.ts`, `decks.json`. If your task needs one changed (a new
export, a dependency), say so in the hand-off with the exact line; do not make the change.

## Conventions

- One concept per file, its test beside it: `navigation.ts`, `navigation.test.ts`.
- No `utils/`, `shared/`, `helpers/` or `types/` directories. A type lives with the code that
  owns it.
- Named exports only. No default exports except where a tool requires one (Vite config, MDX).
- No abstraction with one implementation, no options nobody asked for, no speculative
  parameters. Three similar lines beat a helper.
- Errors: throw an `Error` whose message names the offending value. Never swallow one.
- Comments say why, when the why is not obvious. No comment restates the code.
