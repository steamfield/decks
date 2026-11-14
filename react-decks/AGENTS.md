# react-decks

A React slide framework that will replace Slidev in this repo. It is a self-contained bun
workspace with its own `package.json`, lockfile and `node_modules`, outside the outer repo's
workspace. Run commands with `--cwd react-decks` from the repo root.

This file is the whole rulebook for code under `react-decks/`, for every agent. Codex loads
it automatically only when started inside this directory, so a contract also lists it under
"Read first". Keep it under 14 KB: Codex caps project instructions at 32 KB in total and the
repo root's file takes about 14.

`docs/architecture.md` is the design. A section marked Final is a contract: implement it as
written, and ask before deviating. Load the `ce:architecting-systems` skill before adding or
moving a module and `ce:writing-tests` (with its TypeScript and waiting references) before
writing a test. This file wins where a skill differs.

## Packages

```
kit -> motion -> runtime -> core <- node
```

| Package | What it is | Environment |
| --- | --- | --- |
| `packages/core` | Pure deck logic: navigation, clicks, URL codec, notes, sync, canvas fit | none |
| `packages/runtime` | React client: store, hooks, canvas, views, transitions | browser |
| `packages/motion` | Motion tokens, step primitives, timelines | browser |
| `packages/node` | Vite plugins, the `decks` CLI, export, tooling | Node |
| `packages/kit` | The ported addon: components, story engine, theme | browser |

- `core` is pure: no React, no DOM or Node globals, no imports from other packages. What it
  needs from the environment, the caller passes in. `setTimeout`, `clearTimeout` and
  `URLSearchParams` are the exceptions.
- `runtime` never imports `motion` or `kit`; it exposes registries they call into.
- Browser packages never import `node:*` or `@react-decks/node`. `node` never imports React.
- Cross-package imports use the bare name (`@react-decks/core`): no subpaths, no relative
  path out of a package.
- A package's public API is its `src/index.ts`. Everything else is private.

`tests/boundaries.test.ts`, Biome and the type checker enforce this. Never edit them to make
an import pass.

## Commands

```bash
bun install --cwd react-decks              # once per worktree
bun run --cwd react-decks lint             # biome
bun run --cwd react-decks typecheck        # tsc
bun run --cwd react-decks test [path]      # vitest
bun run --cwd react-decks check            # the gate: lint, typecheck, test
bun run --cwd react-decks check:isolated   # the gate in a copy outside the repo
bun run --cwd react-decks decks dev|build <deck>
```

## Files only the orchestrator edits

`docs/`, every `package.json`, every `packages/*/src/index.ts` unless the contract says
otherwise, `biome.json`, every `tsconfig.json`, `vitest.config.ts`, `decks.json`, this file.
Need a new export? Give the exact line in the hand-off. Need a dependency? Ask.

## Proportion

These come from mistakes made here. They outrank a wish to be thorough.

- Build what the contract's acceptance asks for and stop. Hardening beyond it is a note
  under "Look closer at", not code.
- Generic infrastructure passing about 150 lines means stop and ask: there is probably a
  library, or the task is bigger than the contract thought.
- Never import an API whose path or docs call it unstable, experimental, internal or private.
- If something only works with a workaround (a custom resolver, an alias, a cast, a copied
  type), the design is probably wrong. Ask before keeping it.
- A finding from your own review that asks for more than the contract does goes to the
  orchestrator. Do not expand scope to satisfy it.
- When a case turns out to be uncovered, ask whether it should exist before supporting it.
  Forbidding a file type, an input or a state is usually cheaper than handling it.
- The spec can be wrong. Replay the contract's QA situations against the spec before you
  code, and for anything with several actors (windows, tabs, timers, client and server) step
  through the interleavings: both start at once, one restarts, a third joins mid-change, a
  message arrives late. Report what you find as "Spec concerns". If a flaw would make the
  feature not work for a user, ask before implementing.
- Ask once, completely. One question carries everything you need decided, each with the
  answer you recommend. A run waits idle while a question is open.

## Structure

- Group by feature, one concept per file, its test beside it (`navigation.ts`,
  `navigation.test.ts`). No `utils/`, `shared/`, `helpers/`, `types/` or `constants/`.
- No interface, factory, options object or generic parameter until a second real caller
  needs it. No options nobody asked for. Three similar lines beat a helper.
- Named exports only, except where a tool requires a default (Vite config, MDX).
- Throw an `Error` whose message names the offending value. Never swallow one.
- Comments say why, when it is not obvious. None restates the code.
- Tests, CSS and tooling select on the DOM contract in architecture section 3
  (`data-deck-slide`, `data-deck-view`, ...). Do not add a hook without asking.

## Libraries before hand-written code

Use the library architecture section 1.1 names for a concern, an installed dependency, or a
browser or Node built-in, before writing generic infrastructure (argument parsing, gesture
math, a store, a glob walker, text splitting, an escaper). If a maintained, typed,
single-purpose library would fit and is not installed, ask for it by name. Do not hand-roll
around asking, and do not ask to save five lines. `core` stays dependency-free.

## Testing

Test what a user or caller can observe, with real dependencies, so a test survives a refactor
and fails only when behaviour breaks.

| Code | Kind | How |
| --- | --- | --- |
| `core` | Unit: every function is pure | `unit` project. Inputs in, values and thrown errors out. |
| `runtime`, `motion`, `kit` | Integration | `dom` project (jsdom). Render the real tree with a real store from a real manifest and real child components. |
| `node` | Integration | `unit` project. Real files in a fresh directory under `.tmp/`, a real Vite server or build, a port the OS picks. |
| A user workflow: arrow keys, two windows, reload, resize, transitions, PDF | E2E | Playwright against a fixture deck in `examples/`. |

jsdom has no layout and no View Transitions; a behaviour that needs either is a Playwright
test. Never test a component by stubbing what it depends on.

- Fake only time (Vitest fake timers, async APIs, real timers restored after) and
  randomness. Never `vi.mock` this workspace's code, a hook, a child component, `gsap` or the
  store. `createMemoryHub()` is the in-process `Transport`; it delivers asynchronously like
  BroadcastChannel, so drive it with fake timers and write races as explicit interleavings.
- A browser API jsdom lacks (wake lock, fullscreen, `window.open`) is an environment
  boundary: a test may install a small fake of it that records calls in a plain array.
- No test-only method, flag or export in production code. Helpers live in the test file or a
  `*.test-support.ts` beside it.
- Assert outcomes: return values and thrown errors; visible text, roles and accessible
  names; files written and HTML served; the URL. Never that a spy was called, never a CSS
  class, component state or a markup snapshot. For a callback API, record what it received
  in a plain array and assert on the array.
- Query by role, then label, then text. `findBy*` for async, `queryBy*` only for absence.
  No `getByTestId` or CSS selectors, except in a test whose subject is the DOM contract.
- Drive components with `@testing-library/user-event`. In Playwright use role and text
  locators and web-first assertions (`await expect(locator).toBeVisible()`).
- Never sleep. Wait on a condition: `findBy*`, `waitFor` with an assertion, a locator, the
  URL, `window.__deck.settled()`.
- Each test builds and tears down its own manifest, store, hub and temp directory. Run a new
  test file three times alone and once in the suite. A test that fails only in the suite is
  diagnosed (skill: `references/flaky-tests.md`), never retried or delayed.
- Name a test after the behaviour, as a sentence. A behaviour table is the test list: one
  test per row, plus the boundaries either side. Cover error paths. See a bug-fix test fail
  before the fix. Never weaken, skip or delete a test to get green.

Tests not to write, each of which was written here and removed:

- An input the domain cannot produce (a round-trip for slide `1e21`).
- Scheduler internals (`expect(vi.getTimerCount()).toBe(0)`).
- Clearing recorded evidence before asserting on it (`received.length = 0`).
- Dozens of near-identical cases for one rule.
- A multi-actor scenario that only runs the orderly sequence.

## React

Applies to `runtime`, `motion`, `kit` and `examples`.

- React 19 function components in TypeScript. No `React.FC`, no default-exported components.
- Deck state lives in the zustand store from `createDeckStore`, read through `useDeck()` and
  `useSlide()` with selectors. No second state library, no context that re-renders the tree
  on every click. The URL hash is the source of truth; never keep a second copy in state.
- No `useEffect` to derive state: compute it in render. An effect synchronizes with
  something outside React and returns its cleanup. Read the DOM in `useLayoutEffect` or a
  handler, never in render.
- A slide can render in five contexts at once (`slide`, `presenter`, `preview`, `overview`,
  `print`). A component never assumes it is the only instance, never uses a global id, never
  touches `window.location`. Outside the `slide` context, or when motion is `instant`, it
  renders the end state for its click with no animation and no WebGL.
- Styles: a co-located CSS Module for local rules; global classes only where the DOM
  contract or the kit's `od-*` vocabulary names them. No hex colors or raw durations: use
  theme and motion tokens.
- No `any`, no non-null `!`, no `as` cast except at a validated boundary.
