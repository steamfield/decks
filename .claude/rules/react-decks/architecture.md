---
paths:
  - "react-decks/**"
---

# react-decks architecture

Load the `ce:architecting-systems` skill before designing or changing a module. Where it and
this rule differ, this rule wins.

## The design is written down

`react-decks/docs/architecture.md` holds the package boundaries, the public signatures and
the DOM contract. Sections marked Final are contracts. If the code needs something the
document does not give it, stop and ask the orchestrator; do not invent a signature, widen a
type or add an export.

## Dependency rule

```
kit -> motion -> runtime -> core <- node
```

- `core` is pure: no React, no DOM globals, no Node built-ins, no imports from other
  packages. If a core function needs the window size, the hash or a timer source, the caller
  passes it in. This is what lets core be tested without a browser and reused by the Node
  tooling.
- `runtime` never imports `motion` or `kit`. When runtime needs something from them, it
  exposes a registry they call into (`registerSettleProbe`, `registerCaptionProvider`).
- Client packages (`runtime`, `motion`, `kit`) never import `node:*` or `@react-decks/node`.
  The node package never imports React.
- Imports across packages use the bare name (`@react-decks/core`). No subpaths, no relative
  path that leaves the package.

`tests/boundaries.test.ts` enforces all of this. Never edit that test or `biome.json` to make
an import pass.

## Shape of a package

- Group by feature, one concept per file, test beside it.
- A package's public API is its `src/index.ts`, and only the orchestrator edits it. Everything
  else is private and free to change.
- No `utils/`, `shared/`, `helpers/`, `types/`, `constants/` directories.
- Do not add an interface, a factory, an options object or a generic parameter until a second
  real caller needs it. `Transport` in `core/sync.ts` exists because tests use an in-memory
  one and the browser uses BroadcastChannel; that is the bar.

## Libraries before hand-written code

Prefer an established, maintained library over writing the same thing by hand. Section 1.1
of the architecture document lists the library chosen for each concern: use it. Before
writing more than a few dozen lines of generic infrastructure (argument parsing, gesture
math, a store, a debounce, a glob walker, text splitting, an escaping routine), stop and
check whether a library in that table, a dependency already installed, or a browser or Node
built-in does it.

If a library fits and is not installed, ask the orchestrator for it by name and version
through a question, and wait. Do not hand-roll a substitute to avoid asking, and do not edit
a `package.json` yourself. `core` stays dependency-free: it is small deck-specific logic.

A good candidate is widely used, maintained in the last year, typed, and does one job. Do not
ask for a library to save five lines.

## The DOM contract

Tests, CSS and tooling select on the hooks in section 3 of the architecture document
(`data-deck-slide`, `data-deck-view`, and so on). Do not select on class names the framework
generates, and do not add a hook without asking.
