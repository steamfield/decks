# Build: react-decks to `@steamfield/decks` 1.0.0-rc

## Context

`docs/handoff-react-decks-v1.md` lists the work left to replace Slidev with the React engine in `react-decks/` and ship it as one npm package. Riley asked for the whole of it through Slidev removal, the site and release prep, orchestrated by me with Codex (`gpt-6.1-sol` through `foreman`) writing the code, no timebox. On approval this plan is copied to `plans/build-react-decks-rc.md` on the landing branch.

## Decisions (from the grill)

- One published package, `@steamfield/decks`, subpath exports `.`, `/motion`, `/kit`, `/kit/styles.css`, `/node`, bin `decks`.
- rc CLI: `dev`, `build`, `new`, `check`, `lint`, `hook`, `init`, `export` (PDF through a real print view), `shot` (also generates `og.png`). `list`, `snap`, `fact-extract`, `review-prose` are deferred unless the agent tooling needs them.
- Scope: everything through Slidev removal, agent config, site and release prep. I stop at npm publish and hand Riley the commands (publish, dist-tag, deprecate, tag, push).
- Parity sign-off for the three ports is mine: pixel parity against Slidev baselines, a frame-by-frame eye check of motion, and a fact-check. No pause for Riley.
- `react-decks/` moves to the repo root after Slidev is deleted.
- The seven unported decks: tag the last Slidev commit `slidev-final`, then delete.
- Landing branch `build/react-decks-rc` from `main`, tags `phase-N`. Nothing pushed, nothing merged to main without Riley.

## Assumptions (override any of these)

1. The five source packages stay private workspaces with their `@react-decks/*` names and the existing boundary lint/test. A new publish package `packages/decks` (name `@steamfield/decks`) bundles them with `tsdown` (Rolldown, matches Vite 8) into one entry per subpath, shared chunks so each module is a single instance, plus `.d.ts`. `entry.ts` and `server.ts` import a `PUBLIC_SPECIFIERS` constant instead of literal `@react-decks/*` names, resolved to the source packages in the repo and to `@steamfield/decks/*` when installed.
2. Codex delegates write the tests their contract's acceptance table lists (the repo's existing pattern), instead of me writing every test in the scaffold. I write the table rows; a run that changes them gets sent back.
3. Gate for every landing: `rr run "bun run --cwd react-decks check"` (lint, typecheck, unit, Playwright). `check:isolated` at each phase tag. Site gate `make -C site build` once the site phase starts.
4. Parallel Codex runs: at most four at a time, each contract sized for about 40 minutes with `--budget 50m` (foreman's hard stop is about 60).
5. Slidev baselines live in `.parity/<alias>/` at the repo root, gitignored, so they survive the swap and branch changes.

## Delegation loop (every lane)

Contract from `.claude/delegate/react-decks-contract.md` (Goal, Read first incl. `react-decks/AGENTS.md`, Interface, 3-5 QA situations, Scope with owned files, acceptance table, Time). Start with `foreman start <run> --new-worktree --from build/react-decks-rc --setup "bun install && bun install --cwd react-decks" --contract <abs path> --write --model gpt-6.1-sol --budget 50m --wait` in the background. Watch for `waiting|idle|interrupted|failed|error`; defer person-level questions. On hand-off: check the diff is inside owned files, no test weakening, no `package.json`/`index.ts`/biome/tsconfig edits; run the gate in the worktree; refactor; merge `--no-ff`; archive the run. After each run, add a row to `react-decks/docs/delegation-log.md` and update `react-decks/AGENTS.md` if the run exposed a missing rule. Orchestrator-owned files (docs, every `package.json`, `src/index.ts`, biome, tsconfig, vitest config, `decks.json`, `styles/index.css`) are edited only by me, in scaffold commits.

## Phases

Two tracks run side by side and touch disjoint files: decks (kit and ports) and product (package, CLI, plugin). They join at phase 6.

### Phase 0: scaffold (inline)

- Branch `build/react-decks-rc`; copy plan; add `.parity/` to `.gitignore`.
- Capture Slidev baselines at 1920x1080: `bun run snap pitch .parity/pitch`, `aisd-showcase`, `tx26`, and `agents` again.
- Generalize `examples/building-for-agents/scripts/parity.mjs` into `react-decks/scripts/parity.mjs <alias> [slides]` reading `.parity/<alias>` (keeps the credit-hiding and the WebGL-by-eye list per deck).
- Backfill `delegation-log.md` for rd-phase3-fix through rd-bfa-g4 from git history; archive the stale `rd-errors` foreman run.
- Bring `docs/architecture.md` back in line with the code (the twenty drift points from the handoff), since contracts cite it.
- Stub kit exports in `packages/kit/src/index.ts` and `styles/index.css` for every phase 1-2 module so lanes never touch them.

### Phase 1

Decks track:
- K0 story foundations (one run): port to `packages/kit/src/` the story modules the components need: `style` (STROKE, inkStyle, polylinePath), `brush`, `hash`, `grid`, `code-tokens`, `timeline` (resolvePosition, prefersReducedMotion), `scales.stackEndLabels`, palette `CATEGORICAL_COLORS`, `RISE`, `CANVAS`, shared `types`, `InkStep`, with their existing unit tests ported from `packages/decks/story/*.test.ts`.

Product track (parallel, disjoint files):
- P1 publish package: `packages/decks/` with `tsdown` config, `exports`, `files`, `bin` compiled to plain Node ESM, `peerDependencies` react/react-dom, `docs/guide/` copied in at build; `PUBLIC_SPECIFIERS` in node; fix `decks build` ignoring `vite.base`; CLI reads `decksDir`.
- P2 tarball test: `scripts/tarball-e2e.mjs` modelled on the Slidev one: pack, install into a temp project outside the repo with a dead fallback registry, write a minimal deck by hand, `decks dev` (HTTP 200 and a mounted slide in Playwright), `decks build`, load the built `index.html` in Chromium.

Demo: kit foundations tested; `bun run --cwd react-decks test:tarball` builds and serves a deck from the packed tarball.

### Phase 2

Decks track, four lanes (components have no cross-imports):
- K1 InkNumber, InkChip, InkRule, InkCardRect, OdEyebrow
- K2 InkLine, InkBars (InkBarRow), InkTimeline, InkTimelineCursor
- K3 UnitGrid (UnitGridItem), InkPing
- K4 CodeInk, Graph3D (WebGL at `scale x devicePixelRatio`, still image outside the `slide` context)

Each follows the StoryCard pattern (`useSlide`, gsap timeline killed on cleanup, settled state when inactive/static/instant, frame-unit CSS) with component tests on `kit.test-support.tsx`. Port the guard tests that apply (`durations`, `design-literals`, `frame-units`, `svg-opacity`, `ripple`, `handle-refs`) as kit-wide tests in one of these lanes (K1).

Product track:
- C1 `decks new` (conventional and story templates, writes `info`) and `decks check` (orphaned slides, alias collisions, config errors, error-level lint hits).
- C2 `decks lint` and `decks hook lint|prompt`: move scanners from `packages/decks/{scripts,lint}` into node, globs to `slides/*.mdx`, `components/*.tsx`, `layers/*.tsx`, story COPY; the `.tsv` pattern list moves with it.
- C3 print view (`#/print` renders every slide at every final click, settled) and `decks export` (Playwright PDF), `decks shot`, and `og.png` generated at build from slide 1 at 1200x630 when the deck supplies none. Also make `settled()` wait for slide modules still loading.

Demo: a deck using every new kit component (fixture `examples/ink`); `decks new demo && decks check && decks export demo` from the tarball.

### Phase 3: port opendata-pitch and aisd-showcase

Inline first: deck skeletons (`deck.config.ts`, `setup.ts`, `styles/`, `theme.json`, `data/`, `data-sources.md` copied unchanged, `decks.json` aliases `pitch`, `aisd`). Then lanes by slide group following `PORT-BRIEF.md` (one brief per deck, adapted):
- pitch-g1 slides 01-04, pitch-g2 05-07, pitch-g3 08-09 (split by component line counts, about 950 each)
- aisd (all three slides, four components)

Product track alongside: C4 `decks init` (marketplace + `enabledPlugins` with `ref` pin in `.claude/settings.json`, skills copied to `.agents/skills/`, `AGENTS.md` section, prints the `claude plugin install` line), and the embed protocol the site's `DeckPlayer` needs (`?decks-bridge`, ported from `site/src/lib/player/protocol.ts`).

Landing: parity diff per slide under 0.002 except WebGL frames judged by eye; I watch each beat in the preview; `fact-checking-a-deck` on each deck.

### Phase 4: port texas-2026

Skeleton inline including Public Sans and Source Serif 4 and `design.ts`. Lanes: tx-g1 slides 01-05, tx-g2 06-10, tx-g3 11-14, owning the stages each group uses (shared pieces BallotField, BallotOval, SeatArc go to g1 and the others import them). Port `styles/tokens.test.ts`. Same parity and fact-check landing.

Product track alongside: the Claude Code plugin (P3 lane, Codex writes the files, I write the skill content rules): `.claude-plugin/marketplace.json`, `plugin/.claude-plugin/plugin.json`, skills `working-with-decks`, `building-a-deck`, `writing-slides`, `deck-design` (ported from `~/Projects/opendata/.claude/skills/frontend-design-slop`, adapted to slides), `deck-motion`, `visualization` (openchart + chart rules), `deck-data` (provenance + fact-check), `agents/deck-author.md`, `hooks/hooks.json` calling `decks hook`. Re-check the plugin and marketplace formats against current Claude Code docs before writing; confirm the Codex `.agents/plugins` format or drop it.

### Phase 5: site (one or two lanes plus inline copy)

Rewrite positioning as a Slidev alternative and install guidance for `@steamfield/decks`; docs pages generated from `react-decks/docs/guide/`; `DeckPlayer` and `site/demo` built by the React CLI over the embed protocol; blog Slidev posts kept as history with a note; `content-drift.test.ts` repointed to the new CLI and package. Run every guide snippet once (MDX plugin and `useScriptedDemo` examples) and fix the guide.

### Phase 6: Slidev removal and move to root (inline, mostly mechanical)

Tag `slidev-final`. Delete `packages/decks/`, all Slidev `examples/`, root Slidev/Vue deps and scripts, root `decks.json` entries, `tools/` wrappers, `.agents/rules`, `.codex` copies. `git mv react-decks/* .` and fix every path (grep for `react-decks/`). Repo uses its own plugin; rewrite root `AGENTS.md`, `.claude/delegate.md`, contract template; theme contrast and story guard tests already live in the kit by then. Update RFC 0007 and `docs/rfcs/README.md`. Housekeeping: delete merged branches `react-decks`, `bfa-react`, `spike/parity`, remove `.claude/worktrees/bfa-react`. Leave `OUTLINE.md` alone.

### Phase 7: release prep

Version `1.0.0-rc.0`; README for npm, LICENSE, `repository`/`homepage`, CHANGELOG, migration note for `slidev-addon-decks` users; `bun run release:prepare` (both gates, tarball test, build, stamp `plugin.json` version, `npm pack`). Install the packed rc into a fresh repo and follow the getting-started page word for word, fixing what it gets wrong. Then hand Riley the commands: `npm publish <tgz> --tag rc --access public`, `npm deprecate slidev-addon-decks@0.1.0 "..."`, `git tag v1.0.0-rc.0`, and the push.

### Final review

`ce:code-reviewer` on opus over scaffold-parent..HEAD, naming `architecting-systems`, `handling-errors`, `writing-tests`. Fix every finding, full gate, `final` tag, report.

## Verification

Per landing: `rr run "bun run --cwd react-decks check"` (and `make -C site build` from phase 5). Per phase tag: `check:isolated`, `test:tarball`. Per port: `node scripts/parity.mjs <alias>` under threshold, beat-by-beat screenshots in the preview, fact-check report clean. End: the getting-started walkthrough from a fresh repo against the packed rc, plus `decks dev`, `build`, `export`, `init` there.

## Questions still open for later phases (defaults taken)

- building-for-agents slide 17 shows the Vue stage source and slide 10 keeps an invalid `path-length`: left as is.
- Text sizing overflow on fixed compositions: not fixed in rc; noted in the guide.
