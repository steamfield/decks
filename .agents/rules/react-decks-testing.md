---
trigger: glob
description: "react-decks testing"
globs: "**/react-decks/**"
---
<!-- GENERATED from .claude/ for delegate agents from .claude/rules/react-decks/testing.md. Edit the source, then regenerate this copy to match. -->

# react-decks testing

Load the `ce:writing-tests` skill before writing or changing a test. Where it and this rule
differ, this rule wins.

## What a test asserts

Observable behaviour through the public interface: what a function returns, what a component
renders, what the URL becomes, what a second window shows. Not which internal function was
called, not private state, not a snapshot of markup.

A behaviour table in a contract or in `docs/architecture.md` is the test list: one test per
row, named after the row. Add the edge cases the table implies (empty input, boundaries,
invalid values). Do not add tests for behaviour nobody specified.

## Which kind of test

| Code under test | Test with | Environment |
| --- | --- | --- |
| `packages/core` | Plain unit tests. No mocks at all: core has no dependencies to mock. | `unit` project (node) |
| `packages/node` | Unit tests against real files in a temp directory (`fs.mkdtemp`), a real Vite server where a plugin is involved. | `unit` project (node) |
| `packages/runtime`, `motion`, `kit` components and hooks | React Testing Library. Render with a real store built from a real manifest and `createMemoryHub()`. Query by role and text, then by the DOM contract's data attributes. | `dom` project (jsdom) |
| Anything involving the real URL bar, two windows, view transitions, layout, or PDF output | Playwright against a fixture deck in `examples/`. | browser |

jsdom has no layout and no View Transitions API. Do not fake either in a jsdom test; write
the Playwright test.

## What may be faked

- `createMemoryHub()` in place of BroadcastChannel.
- Vitest fake timers for the sync join timeout and other timer-driven logic.
- A hand-written `DeckManifest` literal.

Nothing else. Do not mock a module from this workspace, a React hook, `gsap`, or the store.
If something is hard to test without a mock, the design is wrong: say so in the hand-off.

## Waiting

Never sleep. In jsdom, use `findBy*` and `waitFor`. In Playwright, wait on a locator, on the
URL, or on `window.__deck.settled()`. A fixed timeout in a test is a defect.

## Isolation

Each test builds its own manifest, store and hub. No module-level mutable state shared
between tests, no reliance on test order. Temp directories are created per test and removed
after. A test file must pass alone and in the full suite.

## Do not

- Weaken, skip or delete a test to get green. Report it.
- Assert on implementation details so a refactor breaks the test.
- Write a test that cannot fail. For a bug fix, see the test fail before the fix.
