---
trigger: glob
description: "react-decks testing"
globs: "**/react-decks/**"
---
<!-- GENERATED from .claude/ for delegate agents from .claude/rules/react-decks/testing.md. Edit the source, then regenerate this copy to match. -->

# react-decks testing

Load the `ce:writing-tests` skill, and its `references/typescript-react.md` and
`references/waiting-typescript.md`, before writing or changing a test. This rule applies the
skill to this workspace. Where they differ, this rule wins.

## The principle

Test what a user or caller can observe, using real dependencies, so a test survives a
refactor and fails only when behaviour breaks. A test that would still pass with the feature
broken, or fail after a rename with the behaviour intact, is a defect.

## Which kind of test (Testing Trophy)

Integration is the default: several real modules working together give the most confidence
per test. An isolated unit test is for a pure function. E2E is for a complete user workflow.

| Code under test | Kind | How |
| --- | --- | --- |
| `packages/core` | Unit. Every function is pure, so this is the one place unit tests are the right default. | `unit` project (node). Inputs in, values and thrown errors out. |
| `packages/runtime`, `motion`, `kit` | Integration. | `dom` project (jsdom). Render the real component tree with a real store built by `createDeckStore` from a real manifest, real `@react-decks/core`, real child components. |
| `packages/node` | Integration. | `unit` project (node). Real files in a per-test temp directory, a real Vite dev server or build where a plugin is involved, on a port the OS picks. |
| A user workflow: presenting with arrow keys, two windows in sync, reload keeping position, resizing, view transitions, PDF export | E2E. | Playwright against a fixture deck in `examples/`. |

jsdom has no layout and no View Transitions API. Do not fake either. If the behaviour needs
layout, real navigation, two windows or a transition, it is a Playwright test.

Do not write an isolated unit test for a component or hook by stubbing what it depends on.
That tests the stubs.

## Mocking

Mock only what this workspace does not own or cannot control. Here that is exactly:

- Time: Vitest fake timers, for the sync join timeout and timer-driven logic. Use the async
  APIs (`await vi.advanceTimersByTimeAsync(300)`), and restore real timers in `afterEach`.
- Randomness, if a test ever needs it.

Never `vi.mock` a module from this workspace, a React hook, a child component, `gsap` or the
store. There is no network in this codebase to stub.

`createMemoryHub()` from `@react-decks/core` is the in-process implementation of the
`Transport` interface. Use it wherever a test needs two participants in one process. It
delivers asynchronously through `setTimeout(fn, 0)`, as BroadcastChannel does, so drive it
with fake timers (`await vi.runAllTimersAsync()`) and write races as explicit interleavings.
The real BroadcastChannel path is covered by the Playwright two-window test.

No test-only method, flag or export in production code. If a test needs a helper, it lives in
the test file or a `*.test-support.ts` file beside it.

## Assertions

| Context | Assert on | Not on |
| --- | --- | --- |
| Library function (`core`) | Return values and thrown errors | Private helpers, call counts |
| Component (`runtime`, `motion`, `kit`) | Visible text, roles, accessible names, and what the user would see change | CSS class names, component state, props passed to children |
| Callback-based API (`createSyncSession`) | The states a participant ends up with: record what `onRemote` received in a plain array and assert on the array | `toHaveBeenCalledTimes` on a spy |
| Node tooling | Files written, the module a virtual id resolves to, the HTML or PDF produced, exit code and stderr | Which internal function ran |
| Browser (Playwright) | What is on screen, the URL, the other window | Internal store state read through `page.evaluate` |

Never assert that a mock or spy was called. Assert the outcome the call produced.

The DOM contract in `docs/architecture.md` section 3 (`data-deck-slide`, `data-deck-view`,
`data-step-state` and the rest) is public API that CSS and tooling depend on. A test whose
subject is that contract asserts on those attributes. Every other test finds elements the way
a user does and never uses `getByTestId`, a class name or a CSS selector.

## Queries and interaction

Query in this order: `getByRole` with a name, `getByLabelText`, `getByText`. Use `findBy*`
for anything that appears asynchronously, `queryBy*` only to assert absence.

Drive components with `@testing-library/user-event` (`const user = userEvent.setup()`), not
`fireEvent`: a real key press or click, as a presenter would make it.

Take expected strings from the source they come from (the manifest literal the test built,
an exported constant), not a second hard-coded copy.

In Playwright, use role and text locators and web-first assertions
(`await expect(locator).toBeVisible()`, `await expect(page).toHaveURL(...)`). Never
`expect(await locator.isVisible()).toBe(true)`: it does not retry.

## Waiting

Never sleep. A fixed delay before an assertion is a defect.

- jsdom: `await screen.findByText(...)`, or `waitFor` with an assertion inside that throws.
  No side effects inside `waitFor`; no empty `waitFor`.
- Playwright: auto-waiting locators, web-first assertions, `page.waitForFunction`, or
  `await page.evaluate(() => window.__deck.settled())` once motion exists.
- Timers under test: fake timers, advanced explicitly.

## Isolation

Each test builds its own manifest, store, hub and temp directory, and tears them down. No
module-level mutable state shared between tests, no reliance on order. Servers listen on port
0. A test file passes alone and in the full suite; a new test file is run three times alone
and once in the suite before hand-off. For a test that fails only in the suite, follow the
skill's `references/flaky-tests.md`: diagnose first, do not add a retry or a delay.

## Naming and coverage

Name a test after the behaviour it checks, as a sentence a user of the code would say:
`prev on the first click lands on the previous slide's last click`. A behaviour table in a
contract or in `docs/architecture.md` is the test list: one test per row, named after the
row, plus the edge cases it implies. Cover the error paths (invalid input, thrown errors) as
well as the happy path. Do not test behaviour nobody specified.

## Tests not to write

Each of these was written in this workspace and removed in review.

- A test for an input the domain cannot produce: a round-trip for slide number `1e21`. If no
  deck can reach it, it is not behaviour.
- An assertion on scheduler internals: `expect(vi.getTimerCount()).toBe(0)`. Assert what the
  timer would have changed.
- Clearing recorded evidence before asserting on it: `received.length = 0` half-way through
  a scenario hid a real bug. If the array holds something unexpected, that is the finding.
- Dozens of near-identical cases for one rule. One test per specified behaviour, plus the
  boundaries either side of it. Seventy tests for a small parser means the cases are not
  earning their place.
- A scenario for a multi-actor protocol that only runs the orderly sequence. Write the races
  as explicit interleavings and assert every participant ends in the same state.

## Do not

- Weaken, skip or delete a test to get green. Report it.
- Write a test that cannot fail. For a bug fix, see the test fail before the fix.
- Snapshot markup.
