# Fix brittle and false-green tests

Status: done (lanes A-E merged; Phase 6, optional, not done). Written 2026-11-15 from a four-part audit of the whole test suite.

## Why this exists

`packages/node/src/cli/commands/init.test.ts` simulated a package upgrade by writing the literal version `1.0.0-rc.1` into a fixture, on the assumption that the repo's real version was something else. When the repo was bumped to `1.0.0-rc.1` for the second release, the "upgrade" became a no-op and CI failed with no code change. (Fixed: it now uses `99.0.0`.) The same week, CI on GitHub's Linux runner failed on three other kinds of test:

- Screenshot tests compared against baselines rendered on a Mac (fixed: browser-capture tests now compare against a live screenshot from the same Chromium; the e2e `toHaveScreenshot` specs got `-chromium-linux.png` baselines taken from the runner).
- A test that ran three CLI processes in a 30s limit when each process took about 11s on a loaded 2-vCPU runner (patched with a 120s timeout on that one test).
- An e2e test that saved a file immediately after the previous save and lost the second save on a loaded runner (worked around with a retry, which is itself on the list below).

This plan is the rest of that class, found by reading every test file. The aim is tests that fail only when behaviour breaks and pass only when it works.

## How the audit was done and how far to trust it

Four read-only reviewers read about 230 test files: core and runtime; motion, kit and `tests/`; node and decks packages; e2e, site and examples. They reported by reading, without running tests. Items marked **[checked]** were confirmed against the code by the orchestrator. Everything else is a reviewer's reading: confirm it yourself (read the lines, reproduce the failure scenario) before changing it, and drop an item that does not hold.

## Rules for whoever does this

Read these first; they win over anything here:

- `AGENTS.md`, "Testing" and "Proportion". `.claude/rules/testing.md`. Load the `ce:writing-tests` skill (with `references/flaky-tests.md` and `references/waiting-typescript.md`).
- Never weaken, skip or delete a test to get green, except where an item below says a test is redundant and why. A fix keeps the behaviour covered, only on a sturdier assertion.
- See a changed test fail for the right reason before trusting it: break the behaviour (or the value it pins) temporarily and watch it go red, then restore.
- Run a changed Vitest file three times alone and once in the suite. Run a changed Playwright spec with `--repeat-each=5`; a motion spec also once under 6x CPU throttling (testing.md "Diagnosing a flaky test").
- A test file stays under 300 lines (`tests/test-files.test.ts`). Group by feature, name the file after its module.
- Files only the orchestrator edits: `docs/`, every `package.json`, every `packages/*/src/index.ts`, `biome.json`, every `tsconfig.json`, `vitest.config.ts`, `decks.json`, `AGENTS.md`. An item that needs a new export or a dependency is a question: ask once, with a recommendation, and give the exact line.
- Never mock this workspace's code. No test-only methods or flags in production code. Helpers live in a test file or a `*.test-support.ts` beside it.

## How to verify on the platform that matters

CI is GitHub `ubuntu-latest` (2 vCPUs, x64), sharded: `.github/workflows/check.yml` runs lint and typecheck, unit/dom in 3 shards (`bun run test --shard=N/3`), e2e in 3 shards (`bun run test:e2e --shard=N/3`) and the tarball test. A failed e2e shard uploads `test-results-N` (actual screenshots, traces, error contexts); download with `gh run download <id> -n test-results-N`. A push to `main` runs it; the release workflow requires CI to have passed on the tagged commit. Pushing `main` is the user's call: ask before pushing, and never push a tag or delete a remote tag.

`rr rd-e2e --host m1-linux -- <spec> --repeat-each=10` runs on an arm64 Ubuntu box (`linux-tailscale` is an SSH alias for it) with a fallback Chromium build. It reproduces Linux behaviour but not GitHub's rendering, so never take screenshot baselines from it. Saturating local cores (`yes > /dev/null` per core) did not reproduce the CI-only failures; the CI trace was what showed them.

Useful numbers: on a loaded CI runner one CLI process took about 11s, so the unit project's 30s `testTimeout` (`vitest.config.ts`) holds two CLI processes at most. `vi.waitFor` defaults to 1s. Playwright's `expect` defaults to 5s.

## Suggested order and lanes

Phase 1 (small, concrete, false-green or broken today) and phase 2 (possible product bug) first. Phases 3 to 5 can run as parallel lanes because they touch disjoint files: node package tests, kit/motion/runtime/core tests, e2e/site/examples. Phase 6 is optional and large; do a handful that someone touches often and leave the rest.

---

## Phase 1: tests that cannot fail, or are broken now

### 1.1 `toHaveTextContent` substring matches in kit motion tests [checked]

Files: `packages/kit/src/story/entrance.test.ts` lines 35, 37, 39, 60, 63, 71, 80, 97, 147; `packages/kit/src/story/stage.test.tsx` lines 39, 43, 54, 62, 70, 79, 82-85.

Pattern: the pose is rendered as `"${a}/${b}"` and asserted with `toHaveTextContent("1/0")`. jest-dom matches a string argument as a substring, so `"1/0"` also matches `"0.1/0"` (an entrance replay one tenth in) and `"1/0.4"` (a beat tween left mid-flight); `"0/0"` matches `"0/0.5"` or `"10/0"`. At `entrance.test.ts:36-37` the "without replaying" probe, after `tick(DUR.draw/10)`, passes even if the entrance did replay; at `stage.test.tsx:62` the overview "settles" check passes with `"1/0.3"`.

Fix: assert the whole text, `toHaveTextContent(/^1\/0$/)` or compare `textContent` with `toBe`. Then grep for the same shape elsewhere: `git grep -nE 'toHaveTextContent\("[0-9./ -]+"\)' -- packages`.

### 1.2 Kit guard tests that do not guard what they claim [checked]

- `tests/kit-guard-svg-opacity.test.ts` lines 12-16 and 40-53: only inspects JSX elements named `g`, `rect`, `path`, `text`, but the title says "throughout the kit". `packages/kit/src/ink/graph-3d.tsx:183` has `<circle cx={node.x} cy={node.y} r={node.r} fill={node.fill} opacity={node.opacity} />`, the exact attribute-opacity pattern the guard forbids, and it passes. Fix: match every intrinsic SVG element (or every lowercase JSX element), then fix that line or allow it explicitly with a reason.
- `tests/kit-guard-durations.test.ts` lines 42-46: globs `**/*.tsx` only. `packages/kit/src/theme/easings.ts` says "there are no numeric duration literals outside this file (a unit test scans for them)", but `packages/kit/src/theme/chart-theme.ts:66` has `enter: { duration: 900, ease: "smooth" }`, and a `duration: 0.6` in any kit `.ts` module (story, ink) is never seen. Fix: glob `**/*.{ts,tsx}`, exclude `easings.ts` and tests, and decide chart-theme's 900 explicitly (move it to a token, or allow it with a reason).
- `tests/kit-guard-frame-units.test.ts` lines 7-13: the `ALLOW` regexes exempt a whole line. Only the `translateY(±1.4vh)` entry matches any current source; the other four (`--od-f[wh]:`, the glow rgba, `var(--s[wh], 1v[wh])`, `--od-bleed-x`) match no viewport unit anywhere in `kit/src`. Any `64vw` added to a line containing one of those strings passes. Fix: delete the unused entries, keep the one in use, and (for the one in use) anchor it tighter than a whole line.
- Check the other two guards in `tests/` the same way: make each fail on a deliberately planted violation before trusting it.

### 1.3 `site/tests/deploy.test.mjs` is broken today [checked]

Line 133: `readdirSync("dist/demo")`. The built example decks moved to `dist/d/<slug>/` (commit 2057647); `dist/demo` does not exist, so "embedded decks are noindex while pages remain indexable" throws ENOENT in `make deploy-check` even though the headers are fine. It is outside the CI gate, so nobody noticed. Fix: read `dist/d`. Also consider whether `make deploy-check` belongs in CI (ask).

### 1.4 Assertions that cannot fail

- `packages/node/src/mdx/component-check.test.ts:17`: `await expect(processor.run(processor.parse(source))).resolves.toBeDefined()` is the only assertion, and `run()` always resolves with a tree. A no-op `checkComponents` passes. Fix: pair each accepted source with a rejected one (the same source with the local binding removed must throw "is not defined").
- `packages/runtime/src/navigation/deck-keys.presenter-window.test.tsx:6-14` ("Space on Reset timer uses native button activation") and `e2e/presenter.spec.ts:143-145`: both assert the timer reads `00:00` after Space, but nothing has started the timer, so it reads `00:00` whether or not Space activated the button. Fix: start the talk, advance the clock (`tick` / `page.clock`), then press Space on Reset and assert `00:00`.
- `packages/motion/src/morph.test.tsx:65-76` ("an active Morph carries its name inside a hidden step even with instant motion"): sets `data-deck-motion=instant` after mount and nothing re-renders, and `morph.tsx` never reads motion mode. Fix: set the attribute before `setupMotion`, or drive a re-render as `steps.test.tsx` does with `view.next()`.
- `packages/runtime/src/slides/slide-host.fallback.test.tsx:106-108`: `not.toContain("FirstFailure")` only means something if the fallback renders the component stack, which `slide-host.tsx:93` does only under `import.meta.env.DEV && componentStack`, and the test never asserts a stack was shown. Fix: assert the later stack is present (contains `LaterFailure`) before asserting the old one is absent; drop the dependence on `DEV`.
- `packages/runtime/src/slides/slide-host.layers.test.tsx:52, 58, 69`: `style.viewTransitionName ?? ""` turns "absent" into `""`, so the "no transition name" expectations pass vacuously. Fix: read with `getPropertyValue("view-transition-name")` and a non-null guard on the element.
- `packages/runtime/src/deck.motion-mode.test.tsx:13` ("missing matchMedia means live"): never removes `matchMedia`; relies on jsdom lacking it. Add a polyfill to `vitest.setup.ts` and the expectation can flip. Fix: `install(window, "matchMedia", undefined)` inside the test.
- `packages/kit/src/ink/graph-3d.test.tsx:107-116`: named "shallow-merges spec overrides into both graph renderings" but asserts only `fill`; `radius: 12` is supplied and never asserted. Fix: assert the radius, or rename.
- `examples/building-for-agents/data/code/excerpts.test.ts`: `expect(Array.isArray(excerpts)).toBe(true)` cannot fail; if `import.meta.glob` finds nothing the file passes. Fix: `expect(excerpts.length).toBeGreaterThan(0)`.
- `packages/kit/src/theme/filters.test.tsx:46-50`: the `for (stage of querySelectorAll(".od-slide"))` loop passes vacuously if nothing matches. Assert `stages.length === 2` first.

### 1.5 Mocking the module under test, then asserting a spy

`site/src/scripts/site.test.ts` lines 12-13 (`vi.mock("../lib/analytics", ...)`), 107, 120, 155 and `site/src/components/landing/islands.characterization.test.tsx` lines 9-10, 55, 59 mock the site's own analytics module and assert `track` was called with `("install_copied", { method })`. If `track` were broken, renamed or unwired from PostHog they still pass; nothing observable is asserted, and the repo rule forbids mocking workspace code. Fix: use the real analytics module with the fake SDK from `analytics.test.ts`'s `fakeSdk()` and assert on the captured events. `islands.characterization.test.tsx` also duplicates `InstallTabs.test.tsx`; delete the duplicate coverage after porting. Also `site/src/scripts/site.test.ts:51, 97` spy on `window.matchMedia` and `document.addEventListener`: browser-API fakes are allowed when installed and restored in a small helper, spying on `addEventListener` to capture handlers is not; read the file and judge.

---

## Phase 2: do not retry away a possible product bug

### 2.1 `e2e/dev-error-state.spec.ts` (the MDX recovery test), lines 98-109

Context: this test failed on every full CI run. The Playwright trace showed the browser got one HMR update for the broken edit (a 500, then the overlay) and none for the fix; the fix is written within milliseconds of the overlay appearing, and the server never delivered it. It passes locally (5 of 5), on the Linux host (10 of 10) and with all cores saturated (12 of 12). The current code works around it with `expect(async () => { await app.put(...); await expect(heading).toBeVisible({ timeout: 3_000 }); }).toPass({ timeout: 20_000 })`, which re-saves until the page recovers.

Problem: if the dev server really drops a save that arrives right after an error, this test now retries the bug away and passes, while a user (or an agent writing twice, or format-on-save) would hit it. Decide which it is:

1. Reproduce on the runner: save once, wait for a recovery signal (the HMR message or `load`) with a generous timeout, and read the trace (`trace: "retain-on-failure"`; CI uploads `test-results-N`). Look at `packages/node/src/dev/plugins.ts` `hotUpdate` (around lines 283-370) for a path that returns without sending, and at Vite's watcher handling of two writes in a few milliseconds.
2. If the server drops the save, fix the server and keep a single-save test. If the loss is Vite's or the filesystem watcher's, say so in a comment and keep a test that proves the page recovers on the next save, named for that behaviour, not "recovers".

Ask before changing server behaviour.

### 2.2 `e2e/editing.spec.ts` lines 111-112

Two `writeFile` calls to `deck.config.ts` back to back ("First title edit", then "Second title edit"), then `toHaveTitle("Second title edit")` on the default 5s timeout. A config edit restarts the dev server, so on a loaded runner the second write can land mid-restart: the title stays "First title edit" and the test times out with no regression. [checked] Even when it passes, the first write proves nothing. Fix: write once; if rapid saves are the point, arm `page.waitForEvent("load")` between them and give the final wait a long timeout (testing.md: waits on watchers and restarts pass an explicit timeout, `{ timeout: 10_000 }` in Vitest).

---

## Phase 3: node package tests (`packages/node/src`, `packages/decks/src`)

Reviewer read 50 of 51 files. One lane.

### 3.1 Per-test timeouts shorter than the work (the cli-capture-defaults class)

Each CLI child process took about 11s on a loaded CI runner; the unit project default is 30s. Candidates (confirm each by counting processes and reading the time in a CI log, `gh run view <id> --log` with ANSI stripped):

- `cli/commands/init.test.ts:59-96`: runs `installedInit` 4 times, no override.
- `cli/commands/hook.test.ts:136-163`: per case, a recursive copy of `packages/node/src` plus 3 `tsx` spawns, 5 cases.
- `cli/commands/new-templates.test.ts:9` (tsc over the kit source) and `:37` (a CLI process plus a full Vite build).
- `cli/commands/lint.test.ts:41`: 3 sequential `tsx` spawns.
- `cli/commands/new.test.ts:186`: a CLI process plus a `sh` process.
- `cli/cli-capture-defaults.test.ts:7` and `:45`: each launches Chromium through a CLI process; only `:22` got `{ timeout: 120_000 }` (already patched with a comment).

Fix: prefer fewer processes per test (call the command in process, as `browser.test.ts` does with `runCommand(exportDeck, ...)`, or split a test into focused ones). Where a test legitimately needs several processes, give it an explicit `{ timeout }` with a comment, in the same style as the `{ timeout: 60_000 }` in `plugins-*.test.ts`. A timeout only bounds a hang; it is never an assertion.

### 3.2 `cli/commands/check.test.ts:182-188` [checked]

"passes against this repository's registry without modifying it" runs `decks check` on the real repo (`run(process.cwd())`), so it depends on `decks.json`, every `examples/*` deck and their prose. Adding an unregistered example, or an example slide that trips an error-level lint pattern, fails a CLI test while `check` is correct; it also runs the full check on every example inside a 30s test. The fixture tests above it cover the behaviour and `bun run check` plus CI cover the repo. Recommended: delete this test (ask first, since it removes a test).

### 3.3 `new.test.ts:167-175` [checked]

"reports an unwritable registry before creating an unregistered deck" uses `chmod(decks.json, 0o444)` and assumes the process cannot write it. As root (Docker CI, some hosts) the write succeeds and the test fails. Only `dev/server-build-out-dir.test.ts:62` guards with `it.skipIf(process.getuid?.() === 0)`. Fix: make the registry unwritable another way (make `decks.json` a directory) so it holds as root, instead of a skip.

### 3.4 Hardcoded contents of `examples/basic`

- `dev/browser.test.ts` line 131 `.count()).toBe(9)` (the sum of clicks+1 across the five visible slides; the PDF test at lines 66-68 computes the same number dynamically), line 136 (the hidden slide's heading), line 150 ("Basic fixture deck"), lines 86-102 ("Second point"/"Third point") [checked: the 9 and the strings are literals].
- `mdx/slides.test.ts:91-101` "numbers the five visible basic fixture slides" hardcodes `["01-cover","02-steps","03-component","05-one-click","06-end"]`.

Editing `examples/basic` (adding a slide or click, renaming a file) breaks these while the framework is unchanged. Fix: build a fixture deck under `.tmp/` for these assertions, or derive counts and names from `scanSlides` as the PDF test does. `examples/basic` is also used by `e2e/` fixtures and the tarball test; changing it is a decision (ask).

### 3.5 Bare `vi.waitFor` over browser state [checked]

`dev/browser.test.ts` lines 99-104, 130-153 (including the wait after `page.goto(...?motion=instant#/1)`) use `vi.waitFor` with the default 1000 ms timeout over Playwright page state. On a loaded runner the page takes over a second to render. Fix: `expect(locator).toBeVisible()` / `toHaveCount(...)` (web-first, retried), or `{ timeout: 30_000 }`. Grep for the same: `git grep -n 'vi.waitFor(' -- packages | head -50` and check each wait's subject (file, watcher, server, browser need an explicit timeout per `AGENTS.md`).

### 3.6 Copied third-party text and internal key lists

`dev/errors-messages.test.ts` lines 17 (the full "Known keys: title, author, info, url, canvas, transition, htmlAttrs, credit, vite, mdx." list), 61 (yaml's "unexpected end of the stream within a flow collection"), 66 (micromark's "Unexpected end of file in name, expected a name character such as letters, digits, `$`, or `_`; whitespace before attributes; or the end of the tag"), 141 (oxc's "Expected `}` but found `EOF`"). Bumping `yaml`, `micromark-extension-mdx-jsx` or `oxc-parser`, or adding a config key, fails the test; the position and remedy the code adds are unchanged. Fix: assert the code's own part (`slides/01-first.mdx:3:5:`, "Check the slide and its MDX plugins.") and `toContain`/`stringMatching` for library text. Same idea for the many `process.output().stderr).toBe(\`decks build: ...\n\`)` exact-equality assertions in this file, `plugins-error-state.test.ts` lines 18, 56, 72, 74, `cli-usage.test.ts:9`, `capture-failures.test.ts:26`: `cli()` inherits `process.env`, so a `NODE_OPTIONS` warning or a Node deprecation line (its text depends on the Node version) breaks them. Filter known warning lines or use `toContain` plus "no extra error-level line".

### 3.7 The "This is a bug" marker [checked]

`dev/error-reporting-classification.test.ts:42-44` pins classification to the literal text "This is a bug in react-decks." (a bare literal at `dev/error-reporting.ts:53`) and to the internal filename `code-blocks.ts`, which is a stack-trace frame asserted as the visible file. About 12 tests assert `not.toContain("This is a bug")` (init, new, check, hook, errors tests). If the wording changes those pass vacuously and author errors misclassified as bugs go unnoticed everywhere except line 44. Fix: share one marker constant (an export from the module, which needs an orchestrator-owned `index.ts` only if it is public; a non-index internal module export is enough for the tests), assert against it, and assert `/at .*\.ts:\d+:\d+/` for the stack instead of a filename.

### 3.8 Pinned compiled-JSX formatting

`mdx/code-blocks.test.ts:41-44, 51` asserts the printed formatting of compiled JSX (`"data-line": "1"`, `"data-max-height": "420"`, `JSON.stringify(JSON.stringify(options.steps))`); `plugins-mdx.test.ts:72/74` pins `/at:\s*9/`, `/clicks:\s*2/`. A Vite or oxc upgrade changing object-key quoting or spacing fails them (the `(?:-expression)?` hedge at line 40 shows it already happened once). Fix: execute the compiled module (`ssrLoadModule`, then render) and assert the rendered props or DOM.

### 3.9 Counts and severities from the shipped lint TSV

Tests pin results from `packages/node/lint/ai-rhetoric-patterns.tsv`: `cli/commands/lint.test.ts:29-30` (`errors: 4, warnings: 2`), `:63` (`warn  colon-reveal`), `prose-scan.test.ts:69, 76-77, 93-96`, `hook.test.ts:33-37`, `hook-replay.test.ts:56-58`, and fixtures built on "At its core", "seamless", "Let that sink in". Retuning the TSV (promoting a pattern to error, dropping a word, splitting a pattern) fails about ten tests with the scanner fine. Fix: drive these from a small fixture patterns file via `loadPatterns(path)` (the test file already supports it) and keep one test on the real TSV.

### 3.10 Git in fixtures inherits the user's environment

`cli/commands/hook-prompt.test.ts:59-112` (three tests) run `git init/add/commit/mv` with the inherited environment and the user's global config. A global `commit.gpgsign=true`, `core.hooksPath` or `init.templateDir` breaks `git commit`; if the suite runs under a git hook, an inherited `GIT_DIR` or `GIT_INDEX_FILE` makes `git init`/`git add -A` hit the real repo. Fix: pass an env with `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_DIR` and `GIT_INDEX_FILE` removed, and `-c commit.gpgsign=false`. The same applies to `tests/release-bump.test.ts` (see 4.8).

### 3.11 Tests that only work from the repo root

`resolve("node_modules/.bin/tsx")` and `resolve("packages/...")` appear in `dev/server.test-support.ts:21-22, 36-44`, `init.test.ts:251-258`, `lint.test.ts:9-10`, `hook*.test.ts`, `new-templates.test.ts:10`, `browser.test.ts:79, 235` (the last runs `cli(process.cwd(), ["shot","examples/basic",...])`). Fixtures live under `.tmp/` in the repo; `remark-math` (`lint.test.ts:111`, `hook.test.ts:187`) and `react` resolve only because Node walks up to the root `node_modules`; `hook.test.ts:141-142` symlinks `packages/node/node_modules`, which may not exist under bun hoisting. `cd packages/node && vitest`, a different `--root` or a layout change breaks them with a missing-path or spawn error. Fix: derive the repo root once from `import.meta.url` in `server.test-support.ts` and use it everywhere; make fixtures link their own dependencies. Do the root derivation first; it is cheap and removes a whole class.

### 3.12 Smaller node items

- `dev/server.test.ts:14`: `toBeGreaterThanOrEqual(3030)` mirrors the default-port constant; import the constant.
- `dev/browser.test.ts:51`, `cli/cli-capture-defaults.test.ts:6`, `dev/capture-failures.test.ts:9`: `describe.skipIf(process.env.DECKS_SKIP_BROWSER_TESTS === "1")`. If the variable leaks into CI config or a shell, a whole browser group is skipped and reported green with zero assertions. Fix: make the skip explicit about its cause (skip only when Chromium is not installed) or fail when the variable is set under `CI`.
- `mdx/read-source.test.ts:14`, `mdx/notes-module.test.ts:16` shell out to `mkfifo` (fails on Windows or an image without it); `cli.test.ts:30`, `config.test.ts:52, 74`, `entry-html.test.ts:28` use `dir.split("/").at(-1)` (use `basename`). Low priority: Windows is not a supported platform here (ask before spending time).
- `plugins-structure-changes.test.ts:62-65` asserts exactly one `full-reload` for a rename; the count depends on the watcher's event shape (fsevents versus inotify) and `config-restart.test.ts:139` admits a save can arrive as two events. Fix: wait for a sentinel event and assert the end state, not a count (`AGENTS.md`: a "nothing else happened" assertion is made after a later sentinel).
- `dev/plugins-error-state.test.ts:138, 156` and `plugins-scan-recovery.test.ts:24`: `await expect(fetch(server.url)).rejects.toThrow()` after close assumes the OS has not reassigned the freed ephemeral port to another worker's server. Low probability. Fix: assert on the server's own `close()` having resolved.

---

## Phase 4: kit, motion, runtime and core tests (`packages/kit`, `motion`, `runtime`, `core`, `tests/`)

Reviewers found core and runtime in good shape; most work here is kit and `tests/`. One lane.

### 4.1 Mirrored output literals in kit ink tests

Expected values are copied from current output and encode internal pitch, gap, radius, label-height and easing constants. Changing one by design decision fails dozens of tests with no behaviour change.

- `ink/unit-grid.test.tsx:84-97` ("translate(8 32)", "translate(83 25)", `rx` "9"), `:107` (path "M0 0L35 0L50 15L50 66L0 66Z"), `:133`, `:166` (scale 0.62, 0.4), and `:58` (`toHaveLength(1000)` is an input, acceptable, but the Waffle fixture's `body(999)` couples to it, and 1000 `getComputedStyle` calls per assertion is heavy under CPU load)
- `ink/ink-ping.test.tsx:54-55, 103` (scale 1.764 and 2.337, opacity "0.45")
- `ink/ink-bars.test.tsx:97-99, 117-118, 188-189` ("258.64", "213.64", gap 36)
- `ink/ink-timeline.test.tsx:127, 172-178, 207, 252` (446/484/506, scale 0.625 and 0.25)
- `ink/ink-chip.test.tsx:23` ("calc(25% + 0.520833 * var(--sw))")
- `theme/theme-install.test.tsx:171, 178-179` (12px, 10, 26)
- `ink/ink-style.test.ts:12` (STROKE copied)

Fix: derive from the exported helpers, as `unit-grid.test.tsx:79` already does with `unitCellCenter`, or assert relations (a is below b by the row height, width proportional to value, a mark is the same size at every step). Keep literals only where the value is itself the contract (a public API default documented in `docs/guide/`).

### 4.2 Expected values computed by re-running the code's own recipe

`ink/ink-rule.test.tsx:114-129` rebuilds the `brushRibbon` call with every tuning parameter copied (taperIn 0.02, startWidth 0.7, wobble 0.7, edge 0.4, seed `${seed}:100`); `chrome/od-qr-card.test.tsx:73-75` re-calls `renderSVG(url, { ecc: "M", border: 0 })`; `ink/ink-line.test.tsx:148` re-implements the opacity blend. A change to taper, ECC level or the blend maths breaks them while the rule still draws a ribbon, the QR still encodes the URL and the ghost still dims, and a wrong shared helper cannot be noticed. Fix: assert properties (paths exist, differ by seed and width, `filter` is set); for the QR assert the SVG changes with the URL or decode it.

### 4.3 Duration table, easing twins, count literals

- `theme/easings.test.ts:15-34, 37-44`: `EXPECTED` is a verbatim copy of the 13-entry `DUR` table compared with `toEqual`, and the CSS twins are pinned as string literals but never compared with the registered curves (`TRACE_CSS` is never compared with `TRACE_PATH`). Retuning a duration fails with no behaviour change; changing `TRACE_PATH` without `TRACE_CSS` passes, which is the real drift risk. Fix: drop the table (keep a unit sanity check) and compare `gsap.parseEase(TRACE)(t)` with `gsap.parseEase(TRACE_CSS)(t)` at sample points, as `tests/motion-tokens.test.ts` already does.
- `theme/filters.test.tsx:23, 44-46`: `toHaveLength(7)`, `toHaveLength(14)`, `Set.size toBe(14)` mirror the current filter count. Fix: `ids.length === 2 * Object.keys(FILTER_IDS).length`, `Set.size === ids.length`.
- `ink/graph-3d.test.tsx:154-167`: the truncation test hardcodes `2001` and nodes "2000"/"1999", mirroring `MAX_NODES = 2000` at `graph-3d.tsx:15`. Export the ceiling (orchestrator-owned if public) or derive the count from it.
- `geometry/scales.test.ts:98` recomputes the stagger formula in the expectation; `:135` uses `toBe(0.5)` for `0.3/0.6`, exact only for one operation order; `:119`, `:121` pin d3's `invert` and `ticks(2)` (`[2000,2010,2020]`), so a d3-array upgrade changes output; `:20-27` duplicates `:115-128`. Fix: `toBeCloseTo`, do not test d3's tick algorithm, delete the duplicate. `geometry/parliament.test.ts:199-203` requires a float-equality tie to exist in the 31-seat layout, so an equivalent angle expression (`π*(i+.5)/n`) removes the tie and fails the "refusal exercised" test with no behaviour change; pick an input where the tie is structural or test the tie-break rule directly.

### 4.4 Magic fake-timer amounts that mirror private constants

- `motion/src/steps.test.tsx:245, 249` (`tick(0.15)` then `tick(1)`) assume CountUp's duration (`duration.slow`, 0.6 in `tokens.ts`) lies between them.
- `kit/src/story/story-card.test.tsx:53` (`tick(0.1)`, expects opacity < 1) and its `tick(1)` calls assume the swap fade is longer than 0.1s (it uses `DUR.opacity`, 0.14) and that everything finishes within 1s.
- `kit/src/ink/chart-entrance.test.tsx:49-51` (`advance(1.249)`, `0.04`, `0.041`) mixes the declared 900+350 ms with the settle probe's private poll cadence; the static case needs the poll interval under 40 ms.
- `runtime/src/store/store.window-aspect.test.tsx:20-55, 57-81, 96-114`, `store.presented-state.test.tsx:191, 200, 218`, `deck.test-support.tsx:108`: `deliver(100)`, `149`, `11`, `160`, `260` encode the private 250 ms throttle at `store.ts:148`. A 200 ms throttle fails the `149/11` boundary test; a longer one leaves the `260` waits short so negative assertions pass without reaching the publish.

Fix: use `duration.slow` and `DUR.*` in the tick arguments, a fraction of the declared duration for chart-entrance, and one local `const THROTTLE = 250` (or an exported constant: ask) in the store tests; add a sentinel event before every "nothing else published" assertion.

### 4.5 Hardcoded sync-channel ids and storage keys

`runtime/src/navigation/deck-keys.presenter-window.test.tsx:31`, `runtime/src/canvas/text-scale.test.tsx:46` and `runtime/src/views/overview-view.test.tsx:104` copy the sync-channel id format (`react-decks-presenter:react-decks:fixture:/`, `react-decks:text-scale:react-decks:fixture:/`); the overview test uses a third shape, `"react-decks-presenter:fixture"`, which works only because `deck.tsx:50` checks `startsWith("react-decks-presenter:")` and would also pass if the code wrongly treated another deck's presenter window as its own. The repo is mid-rename (`@react-decks/*` source packages, published as `@steamfield/decks`), so a prefix change fails these with behaviour intact. Fix: derive the id with `syncChannelId(source.manifest.name, "/")` and set `window.name` from the real id in the overview test; read the storage key from the module's helper or write through one window and read through a second.

`runtime/src/canvas/text-scale.test.tsx:17-23, 29-32`: expected `"1.21"`, `"1.1"`, `"0.91"` are the output of the private `STEP = 1.1` plus 2-decimal rounding, and the clamp test depends on press counts 15 and 30 happening to exceed the limits. Fix: assert direction and order (larger after plus, smaller after minus, zero restores 1, clamp reached after a very large press count).

### 4.6 `runtime/src/views/presenter-view.test.tsx:55-57, 114`

`toHaveTextContent("2 / 5click 0 of 3")` and `"Start here.First point.Third point."` assert concatenated `textContent`, which only holds with no whitespace between sibling elements. Adding a separator fails them with identical behaviour. Fix: assert each fragment separately with `within(status).getByText(...)`.

### 4.7 Core tests

- `core/src/memory-hub.test.ts:21, 42, 54, 57, 69` call `vi.runAllTimersAsync()` but never install fake timers; they work only because importing `connect` from `./sync.test-support` registers a global `beforeEach(vi.useFakeTimers)` as an import side effect. Fix: call `vi.useFakeTimers()` in this file's own `beforeEach`/`afterEach`, or export an explicit `useFakeSyncTimers()` and call it.
- `core/src/sync-joining.test.ts:165-175` and `sync-ordering.test.ts:107-120` ("known limit: ..."): assert the currently wrong outcome (tabs left split `{slide: 8}` vs `{slide: 1}`, an early navigation moving the talk). A fix of the documented limit goes red and the test cannot tell a deliberate fix from a regression. Fix: `it.fails`/`it.todo` with the desired behaviour, or move the limit into a docs note and delete the tests (ask which).

### 4.8 `tests/release-*.test.ts` (written this week, also on the list)

- `tests/release-bump.test.ts:8,13`; `release-publish.test.ts:24,72,83`; `release-verify-ci.test.ts:13,21` use `resolve("scripts/...")`, `resolve(".tmp")` and `readFile(".github/workflows/release.yml")` relative to the process cwd. Build paths from `import.meta.url`.
- `release-bump.test.ts:32-36` runs a real `git commit` in a fixture without disabling `commit.gpgsign` or hooks (same fix as 3.10).
- `release-publish.test.ts:72-83` and `release-verify-ci.test.ts` extract a step by slicing the workflow text on `"      - name: Publish to npm"`, `"        run: |\n"`, the first `"\n\n"` and a 10-space indent. A blank line or comment inside the `run:` block truncates the script; the child PATH (line 94) is only the fake bin plus node's directory, so adding a coreutils command to the step fails with "command not found" (verify-ci adds `/usr/bin:/bin`, so the two tests are inconsistent). Fix: parse the workflow with a YAML parser (needs a dependency: ask by name, `yaml` is already installed as a transitive dependency of other packages; check `bun pm ls`) and use one PATH policy. The step names and `run: |` shape are otherwise a stable contract; do not rename them without updating the tests.
- `release-publish.test.ts:158,160`: `expect(views).toBe(4)` and `"gave up after 4 attempts"` hardcode the script's default `RELEASE_VIEW_ATTEMPTS`. Pass `RELEASE_VIEW_ATTEMPTS: "3"` and assert against it.

### 4.9 Shared state left behind

- `kit/src/story/timeline-position.test.ts:81` sets `data-deck-motion="instant"` on the document and never restores it; `kit.test-support.tsx` does not reset it. Safe only because it is the last test in the file.
- `kit/src/theme/theme-install.test.tsx:157` asserts `theme()` throws "No kit theme installed", depending on no earlier test having installed a theme; the test also leaves the recolored theme installed. `theme-palette.test.ts:108` restores the theme without `finally`.
- `motion/src/use-tween.test.tsx:108-113` calls `tween.kill()` only on the success path; the global gsap timeline keeps the tween if an assertion throws.

Fix: register cleanups with `onTestFinished`, as the other tests in those files do.

---

## Phase 5: e2e, site and examples

One lane.

### 5.1 `e2e/source-resolution.spec.ts:39-137`

No `test.setTimeout`, and `playwright.config.ts` sets none, so the limit is the 30s default. The second test spawns `bun run decks dev` cold, waits for font load, then runs `bun run decks build` as a second child process; the first cold-starts the CLI against the `agents` deck; `open()` carries its own `{ timeout: 30_000 }` waits, longer than the test's own limit. Fix: `test.setTimeout(120_000)` on these tests, or warm the CLI in `e2e/fixtures/global-setup`.

### 5.2 `e2e/kit-parity.spec.ts:13-16, 54-70`

`test.skip(process.platform !== "darwin")` and `if (process.platform === "darwin")`. On Linux CI the Slidev-parity test is always skipped and the cover pixel comparison is dropped, so the suite is green while parity could be broken; only an annotation notes it. It also asserts the literal byline "Edited by Riley Hilliard" (line 45). Fix: commit Linux baselines taken from the CI runner (download `test-results-N` from a failing run, copy `*-actual.png` to `*-chromium-linux.png` in the spec's `-snapshots` dir; see how `layers.spec.ts` and `kit-navigation.spec.ts` did it), or fail loudly on Linux instead of skipping. Read the byline from the deck instead of retyping it.

### 5.3 Hardcoded motion-gallery slide numbers

The `gallery` list is scanned from `examples/motion`, yet specs hardcode indexes: `layers.spec.ts:28, 44, 59-63` (`#/17`, `18 / total`, "Keep moving."), `layouts.spec.ts` (`#/30`, `[27,"cover"],[28,"section"]`), `transition-loading.spec.ts:45` and `transition-presets.spec.ts` (`open(page, 19/17/2/22)`), `motion-gallery.spec.ts:79, 95-99`, `motion-timeline.spec.ts` (15, 16), `print.spec.ts:19-35` (13, 15, 16), `fixtures/motion-gallery.ts:17-31`, `code.spec.ts:10, 31` (`#/24`, `#/25`), `motion-text.spec.ts:5` (`#/11`), `motion-span.spec.ts:5` (5). Inserting or reordering one slide in `examples/motion` fails about 15 specs with no behaviour change. Fix: look slides up by file name or title from the scanned `gallery` (for example `slideNo("17-layers")`). Related: `settle-graph.spec.ts:23-26` and `site/e2e/graph.spec.ts:8-24` pin `examples/opendata-pitch` (heading copy, `#/4`); `site/e2e/demo.spec.ts:30` special-cases `"aisd-showcase"` and silently skips that branch if the example is renamed.

### 5.4 Site content-coupled tests

- `site/src/lib/content-commands.test.ts:74-75, 130-131, 140-143`: `shown.filter(file === "cli.md")...toEqual(["new","check","lint","hook","export","shot","init"])` needs an edit per new CLI command and pins heading order; every file in `src/content/blog` must contain "Decks has moved to its own React framework" (also asserted in `tests/blog.test.ts:45`), so a new non-historical post fails with nothing broken; `engines.node toBe(">=22.12.0")` plus the copy "Node 22.12+" mirror `package.json`. Fix: derive the subcommand list from `subcommands`, apply the blog-note rule only to posts flagged historical, compare the requirements copy to `pkg.engines.node`.
- `site/tests/build.test.ts:227` ("Build animated presentations with coding agents.") and `:238` ("Animated presentations with coding agents | Decks") are retyped while neighbouring assertions use `site.heroDescription`; `:648` copies the full consent-banner sentence from `@steamfield/ui`; `site/src/lib/guide.test.ts:34-35` asserts `href="/docs/config/"` and `"bun add @steamfield/decks react react-dom"` in rendered guide copy; `build.test.ts:~150` repeats the install line against `llms-full.txt`. Fix: read the expected value from `site.*` or the source file.
- `site/src/content-drift.test.ts:72-81` and `site/src/data/examples.test.ts:9-19` assert the exact set and order of the four examples plus `featured.label === "Austin schools"` and an `attribution.label` containing "AISD". Fix: drop the list assertions or compare against `src/data/examples.json` itself; the per-example checks below them already cover the properties that matter (hero has a loop, posters, provenance, recordings).

### 5.5 `site/e2e/analytics.spec.ts:207-213 (and 288-295)`

"records nothing ... after Decline": the waiting signal is `$pageview > 1`, then `expect(named(sent, "$snapshot")).toEqual([])` and the same for `$$heatmap` immediately. Recordings and heatmaps go out on their own timers or a later flush; if Decline stopped suppressing recordings the test passes whenever they would arrive after the poll. The sibling test (lines 191-200) correctly waits for `$web_vitals` first as its flush sentinel. Fix: wait for `$web_vitals` (or a snapshot on a control run) before asserting the empties (`AGENTS.md`: a "nothing happened" assertion follows a later sentinel).

### 5.6 `site/src/lib/analytics.test.ts:67, 463` and `site/src/lib/brand.test.ts:52-86`

- `vi.waitFor(() => live.only("$pageview"))` waits on a timer inside posthog-js at the default 1s. Pass `{ timeout: 10_000 }`.
- `brand.test.ts:52-86`: one test cold-starts a Vite dev server, launches Chromium and loads a page inside a 30s `it`, and reads `resolve("../node_modules")` relative to cwd, so it only works from `site/`. Raise the limit to match `build.test.ts` (180s) or warm the server; derive the path from `import.meta.url`.
- `site/e2e/site.spec.ts:66-84`: the axe tests run immediately after `goto`, before the client islands hydrate, so axe audits only the server-rendered player; contrast problems in the hydrated transport bar are not caught. Wait for hydration (a visible interactive control) before auditing.

### 5.7 `examples/building-for-agents/data/**` tests that read sibling repositories

`data/code/excerpts.test.ts:36-42`, `data/10-rr-locks.test.ts`, `data/11-monitor-to-glass.test.ts` (`RR = ~/Projects/rr`, other repos `stacks`, `statglass`, `claude-codex`, `opendata`) with `skipIf(!existsSync(...))`. Four problems: each excerpt records a pinned `commit` (for example `a952e96`) but the test reads the sibling repo's current working tree, so the result depends on whatever branch or uncommitted edits sit there; wherever those repos are absent (CI, another machine) every case is skipped and counted as passing, so rot is invisible; the root `vitest.config.ts` says these "are run by hand, not in the gate", so they effectively never run; the `Array.isArray` assertion in 1.4. Fix: read `git show <commit>:<path>` and fail when the repo or commit is missing, or gate the whole group behind an explicit env flag (`DECKS_SOURCE_REPOS=1`) that fails loudly when set and a repo is absent. Ask which policy before choosing.

---

## Phase 6 (optional): wide but low-urgency

- Replace remaining hardcoded `examples/basic` and `examples/motion` literals not listed above (grep: `git grep -n 'examples/basic\|examples/motion' -- packages e2e tests`).
- `od-eyebrow.test.tsx` and `underline.test.tsx` assert only that text stays visible; match their names or tighten.
- Collect the repeated retry/timeout policy into the testing rules once phases 1-5 settle (`.claude/rules/testing.md` is read by agents; keep it short). Candidates: "a test that spawns N child processes states N in its timeout comment", "an `expect` on a watcher/HMR-driven state passes an explicit timeout", "a guard test is proven by a planted violation".

## Reviewed and cleared (do not change)

- `init.test.ts` version coupling (fixed: `upgradedVersion = "99.0.0"`); `init.test.ts:36, 88-90, 258` read the version from the package rather than a literal. `dependencies.test.ts` reads `package.json` legitimately.
- `server-build-out-dir.test.ts:62` handles root correctly. `embed.test.ts` is deterministic. Presenter-clock test is timezone-independent. Timers in core/runtime are restored through `onTestFinished`.
- `tests/boundaries.test.ts:19` fails on a stray directory under `packages/` on purpose. `tests/motion-tokens.test.ts` is a good guard (its `seconds * 1000` float products are fine for current tokens).
- `unit-grid.test.tsx:57` `count: 1000` as an input.
- Browser-capture tests (`dev/browser.test.ts`) now compare against a live screenshot from the same Chromium, and `layers`/`kit-navigation` have Linux baselines from the CI runner.

## Done means

- Each item above is fixed, or consciously dropped with a one-line reason in the commit message.
- For every behaviour test changed: it was seen to fail against a deliberately broken behaviour before it was trusted.
- `bun run lint`, `bun run typecheck` and `bun run test` pass locally; changed Vitest files pass three times alone and once in the suite; changed Playwright specs pass `--repeat-each=5`.
- CI is green on the pushed commit, and a second CI run on a no-op commit is also green (a one-off pass proves little for a flake).
- Nothing in `.github/workflows/`, `scripts/release*.mjs` or the release flow changed without being asked.
