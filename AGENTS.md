# Decks

This file is the rulebook for every coding agent working in this repo (Claude Code, Codex,
Antigravity). Codex loads it from the repo root; Claude Code reads it through `CLAUDE.md`.

## What this is

Decks is a React slide framework for animated, data-storytelling presentations, published as
one npm package, `@steamfield/decks` (bin `decks`). It replaced a Slidev addon
(`slidev-addon-decks`); the last Slidev state is the git tag `slidev-final`.

```
packages/{core,runtime,motion,node,kit}   the framework, private workspaces (@react-decks/*)
packages/decks/                           the published package: bundles the five, subpath exports
examples/                                 decks: building-for-agents, opendata-pitch, aisd-showcase,
                                          texas-2026, and the basic, motion and tides-slide fixtures
plugins/decks/                            the Claude Code plugin (skills, agent, hooks); marketplace
                                          at .claude-plugin/marketplace.json
site/                                     decks.steamfield.io (Astro); its own AGENTS.md
docs/                                     architecture.md (the design), guide/ (user docs, shipped
                                          in the package), rfcs/, delegation-log.md
e2e/, tests/, scripts/                    browser tests, repo-wide tests, tooling
```

Writing or revising a deck follows the plugin's skills, which this repo uses directly
(`.claude/skills` and `.agents/skills` link to `plugins/decks/skills`): start with
`working-with-decks`, then `building-a-deck`; slide prose follows `writing-slides`, and a
figure on a slide follows `deck-data`. The prose hooks in `.claude/settings.json` deny
error-level AI-rhetoric patterns in deck prose as it is written. Framework code follows the
rest of this file.

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
bun install                          # once per checkout or worktree
bun run lint                         # biome
bun run typecheck                    # tsc
bun run test [path]                  # vitest (unit, dom, examples projects)
bun run test:e2e [spec]              # playwright
bun run check                        # the gate: lint, typecheck, test, test:e2e
bun run check:isolated               # the gate in a copy outside the repo
bun run test:tarball                 # pack @steamfield/decks, install it outside the repo, build and serve a deck
bun run decks dev|build|new|check|lint|export|shot|init <deck>   # the CLI, from source
node scripts/parity.mjs <alias>      # compare a ported deck with its Slidev baseline in .parity/
bun run release <x.y.z[-rc.N]>       # bump every place the version lives; never commits, tags or pushes
```

`rr rd-test`, `rr rd-e2e` and `rr rd-check` run the same on the hosts in `.rr.yaml`; sync a
committed tree.

A `bun.lock` changes only through `bun add`, `bun update` or `bun install`; never edit it, and
never delete lines to force a re-resolve (that re-resolves unrelated packages). Every
Playwright in the repo (root, `packages/node`, `site/`) stays on one version: a
`playwright install` from another version deletes the other's Chromium.

## Files only the orchestrator edits

`docs/`, every `package.json`, every `packages/*/src/index.ts` unless the contract says
otherwise, `biome.json`, every `tsconfig.json`, `vitest.config.ts`, `decks.json`, this file.
Need a new export? Give the exact line in the hand-off. Need a dependency? Ask.

CI (`.github/workflows/ci.yml`, on pushes to `main` and pull requests) calls
`.github/workflows/check.yml`: `bun run check` split into parallel jobs, namely lint and
typecheck, unit/dom tests in 3 shards (`bun run test --shard=N/3`), browser tests in 3 shards
(`bun run test:e2e --shard=N/3`) and the tarball test. A failed e2e shard uploads its
`test-results/` (actual screenshots, traces) as an artifact. Playwright's Linux screenshot
baselines (`*-chromium-linux.png`) come from that artifact, because the runner's rendering is
the one that has to match; the `-darwin` ones come from a Mac.

## Releasing

Releases are tag-driven and CI publishes; agents never run `npm publish`, push a tag or touch
npm credentials. `.github/workflows/release.yml` runs on a `v*` tag as jobs: `verify` (the tag
equals `packages/decks/package.json`'s version and the plugin manifest's, the commit is on
`main`, and CI passed on that exact commit; the gate is not run a second time) and `build`
(packs `@steamfield/decks` once into a workflow artifact) in parallel, then `publish`, which
publishes that tarball through `scripts/release-publish.mjs` with provenance, then
`github-release`. Only `publish` gets
`id-token: write` and it runs one release at a time. Auth is npm trusted publishing (OIDC);
there is no npm token or `NPM_TOKEN` secret, and none is to be added.

To cut `X.Y.Z` (a prerelease `X.Y.Z-rc.N` publishes under the `rc` dist-tag):

1. Add a `## X.Y.Z` section to `CHANGELOG.md`.
2. `bun run release X.Y.Z` rewrites the version in `packages/decks/package.json`,
   `plugins/decks/.claude-plugin/plugin.json` and `bun.lock`. It refuses a dirty tree (a
   modified `CHANGELOG.md` is allowed), a branch other than `main`, an existing tag, the
   current version or a missing changelog section.
3. `bun run check`, then `git add -A && git commit -m "chore(release): X.Y.Z"`.
4. `git push origin main` and wait for CI on that commit to pass. Then, with that commit
   checked out, `git tag vX.Y.Z && git push origin vX.Y.Z`. A tag pushed before the bump fails
   the version check, one pushed before CI passes fails the CI check, and the stale remote
   tag then blocks the real one.
5. `gh run watch <id> --exit-status` (id from `gh run list --workflow Release`), then
   `npm view @steamfield/decks version dist.integrity`.

If a run fails partway, fix the cause and rerun the failed job (`gh run rerun <id> --failed`):
a failed `publish` reruns alone with the same artifact, and `release-publish.mjs` skips a
version already on npm with the same integrity. Every npm call has a timeout, and `npm view`
retries 429, 5xx, timeouts and network drops with backoff (never auth errors, a 404 or
`npm publish`). The registry takes 3-5 minutes to show a new version; if it still does not
when the wait ends, the run passes with a warning annotation, so check `npm view` a few
minutes later. Never move or reuse a published version; bump the patch. A bad tag is
deleted by the user (`git push origin :refs/tags/vX.Y.Z`); a hook blocks agents from doing it.

The first release (`1.0.0-rc.0`) needs a one-time human bootstrap, because a Trusted Publisher
can only be added to a package that already exists on npm: push the tag, let CI build and
upload the artifact (its publish step fails with E404, which is expected), `gh run download
<id> -n release-package`, then the user runs `npm publish <tgz> --tag rc --access public` with
their OTP. Publishing the CI-built tarball keeps the registry integrity equal to what a rerun
expects. That release has no provenance. Then, on npmjs.com for `@steamfield/decks`: Settings,
Trusted Publisher, GitHub Actions, `steamfield`, `decks`, workflow `release.yml`, environment
blank; set Publishing access to "Require two-factor authentication and disallow tokens".

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

Where things live:

| Looking for | Path |
| --- | --- |
| A CLI command (`new`, `check`, `lint`, `hook`, `export`, `shot`, `init`) | `packages/node/src/cli/commands/<name>.ts`; `dev` and `build` are `packages/node/src/dev/server.ts`; argument parsing is `cli/cli-command.ts`, `decks.json` is `cli/registry.ts` |
| The Vite plugin, virtual modules, config loading, browser capture | `packages/node/src/dev/` |
| MDX slides, click counting, code blocks, notes | `packages/node/src/mdx/` |
| The prose lint and its patterns | `packages/node/src/prose/`, `packages/node/lint/ai-rhetoric-patterns.tsv` |
| `decks new` templates | `packages/node/templates/{conventional,story}/` |
| A runtime view (play, presenter, overview, print) | `packages/runtime/src/views/` |
| The store, navigation keys, canvas, layouts, transitions, `settled()`, the embed protocol | `packages/runtime/src/{store,navigation,canvas,layouts,transitions,settle,embed}/` |
| Motion primitives and tokens | `packages/motion/src/` |
| A kit component | `packages/kit/src/ink/` (marks, charts, `Graph3D`), `story/` (stages, cards, `useStage`), `chrome/` (`Od*`), with its `.css` beside it |
| The theme, eases, filters | `packages/kit/src/theme/`; global stylesheets in `packages/kit/src/styles/` |
| The published package and its build | `packages/decks/` (`build.mjs`, `src/` re-exports) |
| Browser tests and their helpers | `e2e/*.spec.ts`, `e2e/fixtures/` |
| Repo-wide tests (boundaries, kit guards, the shared package build) | `tests/` |
| The user guide (ships in the package) | `docs/guide/` |
| The Claude Code plugin | `plugins/decks/` (skills, agent, hooks) |

- Group by feature, one concept per file, its test beside it and named after its module
  (`navigation.ts`, `navigation.test.ts`, `navigation-keys.test.ts`). No `utils/`, `shared/`,
  `helpers/`, `types/` or `constants/`.
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
and fails only when behaviour breaks. Before writing or changing a test, load `ce:writing-tests`
and read `.claude/rules/testing.md`: how to control time, which completion signals to wait on,
how to test motion without timing it, and the banned patterns with their replacements.

| Code | Kind | How |
| --- | --- | --- |
| `core` | Unit: every function is pure | `unit` project. Inputs in, values and thrown errors out. |
| `runtime`, `motion`, `kit` | Integration | `dom` project (jsdom). Render the real tree with a real store from a real manifest and real child components. |
| `node` | Integration | `unit` project. Real files in a fresh directory under `.tmp/`, a real Vite server or build, a port the OS picks. |
| A user workflow: arrow keys, two windows, reload, resize, transitions | E2E | Playwright against a fixture deck in `examples/`. |

jsdom has no layout and no View Transitions; a behaviour that needs either is a Playwright
test, never a hand-built fake of the browser. Never test a component by stubbing what it
depends on. The dom project does not process CSS either: a prop that only changes styling is
checked in a browser. A port keeps the source's mechanism (an inline style stays an inline
style), because the kit guards in `tests/` police those mechanisms.

Each behaviour is asserted at one layer, the cheapest that can show it. Which file change
causes a reload or a hot update is decided and tested in `node`; the browser suite keeps one
hot-update and one reload workflow. A rule the memory hub can interleave is not forced again
in two real windows. A branch only jsdom takes (a missing browser API) is not a behaviour.

- Fake only time (Vitest fake timers, async APIs, real timers restored after) and
  randomness. Never `vi.mock` this workspace's code, a hook, a child component, `gsap` or the
  store. `createMemoryHub()` is the in-process `Transport`; it delivers asynchronously like
  BroadcastChannel, so drive it with fake timers and write races as explicit interleavings.
- A browser API jsdom lacks (wake lock, fullscreen, `window.open`, `matchMedia`,
  `visibilityState`) is an environment boundary: a test may install a small fake of it that
  records calls in a plain array, and restores it. View Transitions are not on this list.
- Motion tests own gsap's clock: `motion.test-support.tsx` takes `gsap.updateRoot` off the
  ticker and only `tick(seconds)` moves time, so values mid-tween are exact (`toBe`, no
  tolerance).
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
- Nothing may depend on how fast the machine is. No wall-clock comparison
  (`performance.now()` deltas), no frame-count threshold, and no polling for a state that is
  only true mid-animation: record it in the page (a MutationObserver log) and assert the log
  after `settled()`, or pause and seek the animation. `vi.waitFor` defaults to one second:
  a wait on the filesystem, a watcher or a server restart passes `{ timeout: 10_000 }`.
- A "nothing else happened" assertion (no reload after an update) is made after a later
  sentinel event, not at the instant the first event arrives.
- In Playwright, arm the wait before the action that causes it
  (`const loaded = page.waitForEvent("load")`, then write the file), and never
  `page.evaluate` across a navigation. Close a Vite server with its own `close()`.
- Each test builds and tears down its own manifest, store, hub and temp directory. Run a new
  test file three times alone and once in the suite; a new or changed Playwright spec with
  `--repeat-each=5`. Do not edit the checkout while Playwright runs: its dev servers watch
  the source. A test that fails only in the suite is
  diagnosed (skill: `references/flaky-tests.md`), never retried or delayed.
- A test file covers one feature and stays under 300 lines, so an agent working on that
  feature loads only its tests: `plugins.test.ts` is not a place, `slide-hmr.test.ts` and
  `config-restart.test.ts` are. Split by behaviour area, name the file after it, and keep
  shared setup in one `*.test-support.ts` per package. In `e2e/`, one spec per workflow
  area with fixtures in `e2e/fixtures/`. `tests/test-files.test.ts` enforces the limit.
- Name a test after the behaviour, as a sentence. A behaviour table is the test list: one
  test per row, plus the boundaries either side. Cover error paths. See a bug-fix test fail
  before the fix. Never weaken, skip or delete a test to get green.

Tests not to write, each of which was written here and removed:

- An input the domain cannot produce (a round-trip for slide `1e21` or `MAX_SAFE_INTEGER`).
- A test of test tooling longer than the rule it guards.
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
