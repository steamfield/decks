---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.test-support.ts"
  - "**/*.test-support.tsx"
  - "e2e/**"
  - "tests/**"
  - "scripts/tarball-e2e.mjs"
  - "site/**/*.test.ts"
  - "site/**/*.test.tsx"
  - "site/e2e/**"
---

# Writing deterministic tests

Load the `ce:writing-tests` skill (with its `references/typescript-react.md` and
`references/waiting-typescript.md`) before writing or changing a test. `AGENTS.md` "Testing" is
the base rulebook: what to test at which layer, what to assert, what never to mock. This file
adds the rules that keep tests reliable in a framework whose whole job is motion: gsap
timelines, CSS transitions, View Transitions between slides, WebGL scenes and lazy slides.

A test that passes on a fast machine and fails under load is encoding timing. The suite runs on
a laptop that is also running dev servers and agents, so every rule below exists because a test
here broke that way.

## The helpers

Use these before writing anything of your own; add to them rather than beside them.

| Need | Helper |
| --- | --- |
| Go to a slide and click, press keys, wait for motion to finish | `deckDriver(page)` (`goto`, `press`, `settled`) and `settled(page)` in `e2e/fixtures/deck-driver.ts` |
| A warmed dev server for a deck, port 0, colour-safe URL | `deckServer(browser, dir)` in `e2e/fixtures/deck-server.ts` |
| Prove motion happened and check its shape | `record(...)` then `log()`, `expectMonotone(values, start, end)` in `e2e/fixtures/motion-recorder.ts` |
| Prove no blank frame between two slides | `noBlankFrame(page, from, to, key)` in the same file |
| Step gsap in the browser | `motionClock(page)` in `e2e/fixtures/motion-clock.ts` |
| Sample a View Transition at fixed points | `seekTransition(page, name, points)` in `e2e/fixtures/transition-seek.ts` |
| Step gsap (and timers) in jsdom | `tick(seconds)`, `advance(seconds)` in `packages/motion/src/motion.test-support.tsx` and `packages/kit/src/kit.test-support.tsx` |
| Run the CLI as a child process and read its URL | `cliProcess(command, args, options)` in `packages/node/src/cli/cli-process.test-support.ts` |
| The built package | the shared build from `tests/package.global-setup.ts` |

## The rule for time

A test touches time only by **controlling** it, and only when time is the subject (an
interruption mid-tween, a value at 40% of a move, a debounce). Every other test waits on a
completion signal and asserts the end state. Real sleeps are never allowed; a timeout only bounds
a failure, it never orders events.

| Layer | How time is controlled |
| --- | --- |
| Vitest + jsdom | `motion.test-support.tsx` / `kit.test-support.tsx`: gsap's `updateRoot` is off the ticker and `tick(seconds)` moves it, so mid-tween values are exact (`toBe`). Timers: `vi.useFakeTimers()`, advanced with `vi.advanceTimersByTimeAsync` inside `act`, restored after the test. |
| Playwright, gsap | `page.clock.install()` before `goto`, `pauseAt`, then `runFor` in steps of 250 ms or less, so a recorder sees the intermediate frames (lag smoothing is off, `packages/motion/src/tokens.ts`, so one long step jumps straight to the end pose rather than compressing). Under a paused clock `settled()` never resolves on its own: step it. |
| Playwright, CSS / WAAPI / View Transitions | These run on the document timeline, which `page.clock` does not drive. Seek them through `document.getAnimations()`: `pause()`, set `currentTime`, read the pose, `finish()`. |

## Completion signals, in order of preference

1. A web-first assertion on the end state (`await expect(locator).toHaveText(...)`).
2. `window.__deck.settled()`: fonts loaded, no slide transition, no busy settle probe, no running
   finite animation. It is the deck's public "motion is done" signal; use the fixture helper, do
   not inline `page.evaluate` calls to it.
3. The DOM contract: `data-deck-active`, `data-deck-slide`, `html[data-deck-transition]` being
   removed, `data-deck-motion`.
4. For node tests: the event the code under test emits (the HMR message, the server's
   `resolvedUrls`, the file written), waited on with `vi.waitFor({ timeout })`.

If the behaviour you need to wait for has no observable signal, that is a missing feature of the
code, not a reason to sleep: add the signal to the public contract (and ask first, per
`AGENTS.md`) rather than a test-only hook.

## Testing motion without timing it

- **Assert the end pose exactly**, after settle.
- **Show the motion happened** by recording, not sampling: a `MutationObserver` (or a per-frame
  read inside the page) pushes values into an in-page array from the action until settle; assert
  its shape: monotone, first value equals the start pose, last equals the end pose, at least one
  value strictly between. Never assert how many frames there were.
- **A mid-animation value is valid only at a time the test set**: a `tick`, a `page.clock`
  step, or an animation `currentTime` seek. A value read whenever a frame happened to fire is not.
- **Interruption and reversal**: step to a known point, read the pose, send the second input,
  assert the pose did not jump, then settle and assert the destination exactly.
- **Nothing blank**: to prove a transition never shows an empty frame, record visibility on every
  frame from the key press until settle and assert every entry; a first-frame-only check misses
  frame two.

## Pixels

Use pixel comparison only for paint-level claims (theme, layout parity, no blank frame). Compare
the same render path against a stored baseline (`toHaveScreenshot`, which waits for two equal
frames and stops finite animations) with a small `maxDiffPixelRatio`, and mask live canvases
(WebGL, force graphs). Never require exact equality between two separate live renders.

## Servers and processes

- Start servers on port 0 and read the bound URL (`server.resolvedUrls`). For a child process,
  strip terminal colour codes (`util.stripVTControlCharacters`) before matching the URL, then
  wait for a 200.
- A cold Vite start is slow under load: warm it (global setup or `server.warmup`) instead of
  raising a test's timeout.
- Tests that need the built package use the one build from `tests/package.global-setup.ts`;
  never build `packages/decks` from a test.
- "A command ran once" across windows or reloads is asserted on a side effect outside the
  terminal (a file the command appends to), never on the visible rows, which scroll.

## Banned, with the replacement

| Banned | Use instead |
| --- | --- |
| `waitForTimeout`, `setTimeout` sleeps, `delay(n)` | a completion signal above |
| frame-count or "N distinct values" thresholds | a recorded log asserted for shape after settle |
| sampling a View Transition per frame with pixel tolerances | seek its animations to fixed progress points |
| asserting visibility on the "first frame" | a per-frame log until settle |
| pixel equality between two live renders | a stored baseline, canvases masked |
| raising a timeout to get a cold start through | warm-up, port 0, the bound URL |
| regex over coloured stdout | strip VT codes, or read the in-process URL |
| synthetic `dispatchEvent(new KeyboardEvent(...))` in a browser test | `page.keyboard.press` |
| `expect(await read())` on live DOM | a locator assertion or `expect.poll` |
| CSS-class selectors | role, label, text; `data-deck-*` where the DOM contract is the subject |

## Resource timing

A wait that counts loaded modules through `performance.getEntriesByType("resource")` must raise
the buffer first (`page.addInitScript(() => performance.setResourceTimingBufferSize(5000))`):
Chromium keeps 250 entries by default, and a large deck's modules, styles and images outrun it,
so the count never reaches its target.

## Diagnosing a flaky test

1. Reproduce: `bun run test:e2e <spec> --repeat-each=30 --workers=8 --retries=0`, or a Vitest
   file in a loop.
2. Add load: in Chromium, `Emulation.setCPUThrottlingRate` with `rate: 6` through a CDP session.
   A test that fails at 6x encodes timing; fix the test or the missing signal, never the timeout.
3. Read the trace (`trace: "retain-on-failure"`, `npx playwright show-trace`): compare what the
   assertion read with the DOM snapshot at that moment.
4. A test that fails only alongside others shares state: find it (ports, temp dirs, the package
   build, global gsap), do not retry it.

New or changed browser specs run with `--repeat-each=5`; a spec about motion or transitions also
runs once under 6x CPU throttling before it merges.
