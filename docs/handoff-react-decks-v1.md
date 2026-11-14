# Handoff: react-decks to `@steamfield/decks` 1.0.0-rc

Written 2026-11-14 for the next session. The React slide engine in `react-decks/` is
stabilizing. What is left is to move the remaining decks onto it, package it so an outside
repo can depend on it, remove Slidev, update the site, and publish a release candidate.

Read first, in this order: this file, `react-decks/AGENTS.md` (the rulebook for framework
code), `react-decks/docs/architecture.md` (the design; sections marked Final are contracts),
`react-decks/docs/guide/` (user docs), `docs/rfcs/0007-react-decks.md` (the original plan and
phases).

## Where things stand

Everything below is on local `main`, about 165 commits ahead of `origin/main` and not pushed.
Pushing needs Riley's go-ahead.

| Area | State |
| --- | --- |
| Packages | `react-decks/packages/{core,runtime,motion,node,kit}`, all private, named `@react-decks/*`, consumed as TypeScript source |
| CLI | `decks dev` and `decks build` only (`packages/node/src/cli.ts`, run through `tsx`) |
| Authoring | `deck.config.ts`, `slides/NN-slug.mdx`, `components/*.tsx`, `layers/{above,below,credit}.tsx`, `setup.ts`, `styles/`, `public/` |
| Runtime | adaptive canvas, play / presenter (own window, `p`) / overview (`o`), two-window sync, slide transitions, layouts, code blocks, error reporting |
| Motion | tokens, `Step`, `Steps`, `Stagger`, `TextReveal`, `Highlight`, `CountUp`, `Draw`, `Morph`, `useTween`, `useTimeline`, `settled()` |
| Kit | first slice only: theme, story stage, `StoryCard`, `StoryCover`, `StoryLink`, `OdQrCard`, `OdByline`, `OdCoverHead`, `OpenChart`, chart themes, `useScriptedDemo` |
| Decks ported | `react-decks/examples/building-for-agents` (alias `agents`); fixtures `basic`, `motion`, `tides-slide` |
| Added this session | Decks credit on every slide in a reserved footer band (`credit` option, `layers/credit.tsx`); Cmd/Ctrl `+` `-` `0` text sizing shared across windows; favicon, description and Open Graph tags (`info`, `url`, `public/og.png`); CRT glass and scenes fill non-16:9 windows in the agents deck; user guide |

Gate, from the repo root: `bun run --cwd react-decks check` (lint, typecheck, 935 unit and
integration tests) and `bunx playwright test` inside `react-decks/` (127 browser tests). Both
pass. On the cluster, `rr rd-test --repeat 12 --no-phases` and `rr rd-e2e --repeat 3` pass
(`.rr.yaml`; hosts `m4-mini`, `m1-mini`, `m1-linux`). Sync a committed tree: a run started
while files are mid-edit reports failures that are not real.

Parity tool for a ported deck: `node scripts/parity.mjs <alias> [slides] [--live sNN-cK,...]`
from `react-decks/`, reading baselines from `.parity/<alias>` at the repo root (gitignored, captured with `bun run snap <slidev alias> .parity/<alias>` at 1920x1080).
It hides the credit and its band, since the Slidev baseline has neither.

## How the work has been done

Claude orchestrates and reviews; Codex (`gpt-6.1-sol` through `foreman`) writes code against
contracts. The contract template is `.claude/delegate/react-decks-contract.md`. Lessons that
are not yet written down elsewhere:

- foreman stops a run at about 60 minutes. Size a contract well under that and give it a Time
  section.
- Watch a run for `waiting|idle|interrupted|failed|error`, not only `waiting|idle`.
- After each run, update `react-decks/AGENTS.md` if the run exposed a missing rule, and log
  the run in `react-decks/docs/delegation-log.md`. The log is behind: nothing after
  `rd-step-names` is recorded (rd-phase3-fix, rd-code, rd-mdx, rd-layers, rd-tests, rd-errors,
  rd-errfix-a/b, rd-kit, rd-bfa-g1..g4).
- Tests must not depend on machine speed, stay in the Vitest ecosystem, one feature per file
  under 300 lines. Error handling follows `ce:handling-errors`.
- Deck-specific effects stay in the deck (the CRT tube lives in
  `examples/building-for-agents`, not in the kit). Only what a second deck needs moves into
  the kit.

## Work to do, in dependency order

### 1. Finish the kit for the decks being ported

Only four decks move to React: `building-for-agents` (done), `opendata-pitch`,
`aisd-showcase`, `texas-2026`. The others (`agent-experience`, `tides`, `keeling`,
`opendata-showcase`, `state-of-js`, `od-templates`, `od-story-templates`) are not ported and
go away with Slidev.

The three remaining decks use these addon components that the kit does not have yet (counts
are uses across their pages and components): `InkNumber` 14, `InkCardRect` 12, `UnitGrid` 9,
`UnitGridItem` 7, `InkStep` 6, `InkPing` 5, `OdEyebrow` 4, `InkChip` 4, `CodeInk` 4,
`Graph3D` 3, `InkBars` 2, `InkBarRow` 2, `InkTimeline` and `InkTimelineCursor` 1 each,
`InkRule` 1, `InkLine` 1. Port those, their story modules and their tests from
`packages/decks/` and nothing else. `Graph3D` needs WebGL at `scale x devicePixelRatio` and
must render a still outside the `slide` context.

Sizes: `opendata-pitch` 13 pages and 11 Vue components; `aisd-showcase` 3 pages and 4;
`texas-2026` 13 pages, 17 Vue components and 14 TS modules, with its own fonts (Public Sans,
Source Serif 4) and `design.ts`.

### 2. Port the three decks

Follow what worked for `building-for-agents`: `examples/building-for-agents/PORT-BRIEF.md` is
the brief, the run was split into four groups of slides, and every frame was compared to a
Slidev capture. Capture Slidev baselines first. Each deck needs its `data-sources.md`, data
modules and `theme.json` carried over unchanged, and a fact-check after the port
(`fact-checking-a-deck` skill) because figures are computed at module load.

`building-for-agents` is signed off: Riley checked it by hand on 2026-11-14 and it is good to
go for the talk the week of 2026-11-16. Two content questions were left unanswered and can
wait: slide 17 shows the Vue stage's own source (keep, or switch to the React source), and
slide 10 keeps an invalid SVG `path-length` attribute.

### 3. Package it as `@steamfield/decks`

Target: an outside repo adds `@steamfield/decks` to `package.json`, creates decks locally,
runs `bun dev` and `bun build`, and it works. None of that is true yet.

- Decide the shape with Riley: one published package with subpath exports
  (`@steamfield/decks`, `/motion`, `/kit`, `/kit/styles.css`, `/node`) or several packages.
  One package is the simpler install and matches how the request was phrased. The internal
  boundaries (`kit -> motion -> runtime -> core <- node`) stay enforced either way.
- Add a build. Today every package exports `./src/index.ts` and the bin is a `.ts` file run
  by `tsx`. A published package needs compiled JS, `.d.ts`, a `bin` that runs under plain
  Node, `exports`, `files`, `peerDependencies` on `react` and `react-dom`, and the entry module
  (`packages/node/src/entry.ts`) importing by the published name.
- The consumer layout: `decks.json` at the project root, decks under `decks/`, package
  scripts `dev` and `build`. `react-decks/decks.json` has `_config.decksDir`, which the CLI
  does not read.
- `decks new` (conventional and story templates, and it should write `info` so the share
  tags are filled) and `decks init` (see 5).
- A tarball test like the Slidev one (`bun run test:tarball`): pack, install into a scratch
  project outside the repo, scaffold a deck, `dev`, `build`, and load the built site in a
  browser. This is the proof for the target above. `bun run --cwd react-decks check:isolated`
  already catches undeclared dependencies.
- Ship `docs/guide/` inside the package so agents can read docs for the installed version.

### 4. CLI and runtime gaps before Slidev can go

Not built: `export` (PDF, needs a print view; `#/print` parses but renders the play view),
`new`, `list`, `check`, `lint`, `fact-extract`, `review-prose`, `shot`, `snap`, `snap:diff`,
`init`, `hook`, the embed protocol the site's `DeckPlayer` uses, pinch zoom and pan,
`defineTheme`, Tailwind scaffolding. `lint`, `hook`, `fact-extract` and `review-prose` exist
for Slidev in `packages/decks/scripts/` and need their globs and parsers moved from
`pages/*.md` and `.vue` to `slides/*.mdx` and `.tsx`. Decide which of these the rc needs;
`new`, `check`, `lint`, `hook`, `export` and `init` are the minimum for an outside project
and for the agent setup.

Smaller items found this session:

- One intermittent browser test: `e2e/dev-error-state.spec.ts:57` ("An invalid config retains
  the previous deck and resends its overlay after reload until fixed") failed once in a full
  local suite run on 2026-11-14 and passed 25 of 25 when run alone. It is not diagnosed. It
  has not failed on the cluster. Diagnose it (suite-only failures are usually shared state or
  a wait armed too late), do not retry around it.
- Link previews: nothing generates `public/og.png`. A build step that screenshots slide 1 at
  1200x630 would do it once `shot` exists. Until then a deck supplies the file.
- Text sizing scales fonts only. Fixed compositions overflow after a step or two.
- `settled()` does not count a slide module that is still loading.
- `decks build` always passes a base, so `vite.base` in a deck config is ignored for builds.
- `info` used to be unused; it now feeds the description. `?decks-bridge` is parsed and has
  no bridge.
- `architecture.md` has drifted from the code in about twenty places. The list is in the
  guide author's report, summarized: sections 1.1, 3, 3.1, 4 and 6 outlines name things that
  do not exist (`#deck-print`, `registerCaptionProvider`, `embed.ts`, `viewer.ts`,
  `PrintView`, `defineTheme`, most CLI commands), and 7.1 under-reports `useStage`,
  `StoryCover` and the kit's exports. Bring the doc back in line before more contracts cite
  it.
- `react-decks/docs/guide/` was written by reading the source, not by running decks. Run its
  snippets once (the MDX plugin example and `useScriptedDemo` example in particular).

### 5. Agent guidance: a plugin and `decks init`

Decided with Riley: do both, and document them. The point is that an agent working in a
project that depends on Decks produces a good deck by default, which the library cannot
enforce by itself. Nothing is built yet beyond the user guide.

What to ship:

- A Claude Code plugin in this repo, listed by a marketplace manifest at the repo root.
- `decks init` in the React CLI: registers the marketplace and enables the plugin in the
  project's `.claude/settings.json`, copies the same skills to `.agents/skills/` for Codex,
  and adds a short section to the project's `AGENTS.md`.
- Skills, each small and loading its detail from references:
  - how to work with Decks: tells the agent to read `node_modules/@steamfield/decks/docs/guide/`
    for the installed version first, and the GitHub docs at the matching tag second;
  - building a deck (the workflow and definition of done, rewritten for MDX and React from
    `.claude/skills/building-a-deck/`);
  - slide writing (`.claude/rules/deck-writing.md` and `prose-patterns.md`);
  - deck design: visual and structural anti-slop. Port
    `~/Projects/opendata/.claude/skills/frontend-design-slop/SKILL.md` (the deletion test, the
    25% zoom test, eyebrows, uniform section anatomy, three identical cards, accent spread
    thin, icons, reveal-on-everything) and adapt it to slides. `ce:design` is the broader
    companion;
  - deck motion: when each preset fits, motion from tokens only, entrances for continuity and
    not decoration;
  - visualization: the `openchart` skill plus the chart rules in `deck-patterns.md`;
  - data provenance and fact-checking (`deck-data.md`, `fact-checking-a-deck`);
  - the `deck-author` subagent and the prose write hook (needs `decks hook`).
- `~/Projects/opendata/talks/.claude/` holds older copies of the same rules
  (`talks-patterns.md`, `story-stage.md`, `deck-writing.md`). Diff them against this repo's
  before porting; this repo's are newer.

Formats, checked against the current docs (re-check before publishing):

- Marketplace: `.claude-plugin/marketplace.json` at the repo root with `name`, `owner.name`
  and `plugins: [{ "name": "decks", "source": "./<plugin dir>" }]`.
- Plugin: `<plugin dir>/.claude-plugin/plugin.json` (only `name` required; set `version` to
  the npm version in the release script), `skills/<name>/SKILL.md`, `agents/<name>.md`,
  `hooks/hooks.json` with commands under `"${CLAUDE_PLUGIN_ROOT}/..."`. Skills are invoked as
  `decks:<name>`.
- Project settings: `extraKnownMarketplaces: { "<marketplace>": { "source": { "source":
  "github", "repo": "steamfield/decks", "ref": "v1.0.0-rc.0" } } }` and `enabledPlugins:
  { "decks@<marketplace>": true }`. The `ref` pins the plugin to the installed version;
  `decks init` should write it and a later `init` should move it.
- Enabling a plugin in project settings does not install it. Each collaborator runs
  `claude plugin install decks@<marketplace> --scope project` once. Say so in the docs and
  print it at the end of `init`.
- Claude Code does not load skills from `node_modules`. A `directory` marketplace source
  pointing into `node_modules` exists but takes an absolute path, so it does not travel.
- Codex reads `AGENTS.md` and `.agents/skills/<name>/SKILL.md`. It also has plugins with a
  marketplace at `.agents/plugins/marketplace.json`; that was read from one docs page and
  needs confirming before relying on it.

The existing pipeline (`.claude/` rendered to `packages/decks/agent/` by `bun run
render:agent`, installed by the Slidev `decks init`) is the precedent. At the swap the plugin
becomes the single source and this repo uses its own plugin; until then the Slidev rules in
`.claude/rules/` and the plugin's skills overlap.

### 6. Replace the Slidev infrastructure

After the three decks are ported and signed off:

- Remove `packages/decks/`, the Slidev examples, the root `decks.json` entries, Slidev and
  Vue dependencies, and the root scripts that drive them. Decide whether `react-decks/` moves
  to the repo root or stays a nested workspace; moving it simplifies every path in the docs.
- Rewrite the root `AGENTS.md`, `.claude/rules/*`, `.claude/skills/*`, `.claude/agents/`,
  `.codex/`, `.agents/` and `.claude/delegate.md` for MDX and React, or replace them with the
  plugin from 5.
- Port or retire the root tests and tools: the theme contrast test, story guard tests,
  `tools/content-lint.sh`, `tools/content-fact-extract.mjs`, hooks and `test:hooks`.
- Update `docs/rfcs/0007-react-decks.md` with what was built and what changed from the plan,
  and `docs/rfcs/README.md`.
- `OUTLINE.md` at the repo root is untracked and is Riley's. The session's branches and
  worktrees are already removed.

### 7. Update the site

`site/` (Astro, deployed with Wrangler) describes a Slidev addon throughout: install steps,
docs, the blog, `llms-full.txt`, and the demo player. Decks is now a Slidev alternative.
Rewrite the positioning and install guidance, generate the docs pages from
`react-decks/docs/guide/` so there is one source, and move `DeckPlayer` and the fixtures
(`site/fixtures/`, `site/demo/`) to a deck built by the React CLI, which needs the embed
protocol from 4. `site/src/content-drift.test.ts` pins content to the repo and will fail
until its sources are updated. The site already builds the mark, favicons and social card
from `site/src/lib/brand.ts`; the framework's default favicon uses the same geometry.

### 8. Release `@steamfield/decks` 1.0.0-rc

Needs Riley: publish rights on the `@steamfield` npm scope, and a choice between a granular
npm token in GitHub Actions and npm trusted publishing (OIDC, no stored token, gives
provenance). Nothing in `.github/workflows` publishes today.

- Version `1.0.0-rc.0`, published under the `rc` dist-tag so `latest` is untouched.
- A release workflow that runs both gates and the tarball test, builds, publishes, tags
  `v1.0.0-rc.0`, and stamps the plugin's `plugin.json` version.
- README for npm, LICENSE, `repository` and `homepage` fields, a changelog entry, and a
  migration note for the Slidev addon's users (`slidev-addon-decks` 0.1.0 gets a deprecation
  notice pointing at the new package).
- Before tagging: install the rc into a fresh repo, follow the published getting-started page
  word for word, and fix whatever it gets wrong.

## Questions for Riley

- One package with subpath exports, or several?
- Does `react-decks/` move to the repo root at the swap?
- Which CLI commands must be in the rc (4), and is PDF export one of them?
- npm publishing: token or trusted publishing, and who owns the scope?
- Are the seven unported example decks deleted, or kept somewhere as Slidev archives?
