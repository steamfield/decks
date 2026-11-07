# RFC 0001: Tooling that works with parallel agent runs

Status: Ready (reviewed). Item 1 landed in `29bea71`.

## Problem

The repo's commands were written for one person in one checkout. texas-2026 was built by several Codex runs at once, each in a worktree under `.claude/worktrees/`, and four commands failed quietly or cost a run its time: the test filter matched other worktrees, the screenshot shorthand assumed port 3030, deck-local tests were never discovered, and a new deck's theme went unchecked until someone edited a hard-coded list. A fifth, the alias-versus-directory mix-up, isn't about parallelism but bit two runs the same way.

## Evidence (texas-2026)

1. `bun run test` on main ran 941 tests instead of 324, because Vitest's positional filters match substrings and every worktree's copy matched. Fixed in `29bea71`.
2. The design run stopped because port 3030 was taken, and later contracts hand-assigned ports 3040 to 3045. `decks shot <alias>` and `decks snap <alias>` already pick a free port (`withDevServer`, `deck.mjs:151`). The runs hit 3030 because `bun run shot` and `bun run snap` (`package.json:18-19`) call `shot.mjs` and `snap.mjs` directly, which default to `localhost:3030`, and that shorthand is what `.claude/rules/story-stage.md` (its screenshot section) and `AGENTS.md` teach.
3. `examples/texas-2026/styles/tokens.test.ts` and `components/seat-arc.test.ts` never run, because the `test` script (`package.json:17`) lists fixed paths. `tokens.test.ts` launches Chromium.
4. `packages/decks/theme/theme.test.ts:16-20` enrolls two of the five decks that have a `theme.json`. The design run widened its own scope to add texas-2026.
5. `bun run fact-extract texas-2026` failed: `resolveDeckDir` (`fact-extract.mjs:24`) and `deckFor` (`deck.mjs:103`) accept the alias (`tx26`) or a path, not the registry `name`.

## Plan

1. Done.
2. Route the shorthand through the CLI, and close a race in it.
   - Point the `shot` and `snap` scripts at `deck.mjs shot` and `deck.mjs snap`. Drop the old positional form (slide number first, server assumed on 3030): it screenshots whatever answers on 3030 with no check that it's the right deck or checkout, which is the hazard this item removes. A human with a server open passes `--port 3030`, which `existingServer` already checks against the deck entry.
   - Fix the race in `startServer` (`server.mjs:122-126`). `freePort` only probes, so two runs started together both pick 3030, Slidev bumps the second, and until it prints its URL the second run polls 3030 and gets the first run's server. Once something answers, confirm it with `existingServer(actual, entry)` before returning, and log the origin it actually used instead of the probed port (`deck.mjs:168`).
   - Make it cheap to reuse one server: document "start one server, then pass `--port`" for agents that shoot after every edit, and add `--no-open` to `decks dev` (it always adds `--open` today, `deck.mjs:288`).
   - Update every place that teaches the old form: `.claude/rules/story-stage.md` and its `.agents/rules/` copy (including the "worktree passes 3031" line), `AGENTS.md`, the building-a-deck skill, `packages/decks/agent/INVENTORY.md`, and the now-dead rewrite rules at `render-agent.mjs:42-43`.
   - Done when: two worktrees, each with a different visible change on slide 1, run `bun run shot <alias> 1` at the same moment, and each PNG shows its own worktree's change.
3. Discover deck-local tests with an explicit `include` in `vitest.config.ts`: `packages/decks/{story,scripts,theme,lint}/**/*.test.ts`, `examples/*/**/*.test.ts`, `decks/*/**/*.test.ts`. Not `packages/decks/**`, which would also run the rendered exemplar copy under `packages/decks/agent/exemplars/`. Drop the positional paths from the `test` script. Make browser tests skip with a message when `chromium.executablePath()` doesn't exist, so a machine without the browser download doesn't fail the suite.
   - Done when: `bun run test` reports the two texas-2026 tests, the exemplar copy of `ToolCallCard.test.ts` doesn't run, and a new `decks/x/components/foo.test.ts` runs with no script edit.
4. Enroll themes from the registry. In `theme.test.ts`, read `decks.json` (root from `test-decks.ts`) and test every `theme.json` next to a registered deck's `slides.md`. Key the map by deck `name`, not alias (lines 43 and 51 look up `THEMES['od-templates']`, whose alias is `templates`). Resolve each deck inside its own `it`, so one bad theme reports by name instead of aborting the file. Update the repo-only note in `deck-patterns.md` that says the test covers "the default and the example".
   - Done when: all five themed decks are tested, and a deliberately broken `theme.json` in a scratch deck fails with that deck's name.
5. Name the right alias instead of guessing. Keep `deckFor` and `resolveDeckDir` alias-first; when the argument matches a registry `name` instead, exit with `"texas-2026" is the deck name; its alias is tx26`. `decks check` reports an error when one deck's alias equals another deck's `name`.
   - Done when: `bun run fact-extract texas-2026` prints that line and exits 1, and alias and path forms behave as before.

Not in scope: the contrast test and `theme.test.ts` are repo-only (tests are excluded from the package), so `decks init` users get no contrast check. Running it from `decks check` would fix that and is worth its own RFC.

## Alternatives considered

Running agent gates through `rr`. `rr` rsyncs a checkout to a remote host, gives each worktree its own remote directory, and serializes runs with a per-host lock. It fixes none of the five items: item 1 is already fixed, item 2 is a shorthand bypassing existing free-port code, and items 3 to 5 are discovery and naming bugs that fail the same way on any host. The per-host lock would also serialize the parallel runs, `shot` PNGs would need syncing back to be looked at, and syncing the main checkout would carry `.claude/worktrees/` along unless excluded. The repo has no `.rr.yaml`. Moving heavy runs (`build:all`, `snap`) to another machine is a separate decision.

## Scope

`package.json`, `vitest.config.ts`, `packages/decks/scripts/{deck,server,shot,snap,fact-extract,render-agent}.mjs`, `packages/decks/theme/theme.test.ts`, `examples/texas-2026/styles/tokens.test.ts`, `.claude/rules/story-stage.md`, `.claude/rules/deck-patterns.md` and their `.agents/rules/` copies, `AGENTS.md`, `.claude/skills/building-a-deck/SKILL.md`, `packages/decks/agent/INVENTORY.md`, and `bun run render:agent` output.

## Verification

`bun run test`, `bun run test:hooks`, `bun run test:tarball`, and the checks above.
