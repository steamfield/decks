# Changelog

## Unreleased

### Package (`@steamfield/decks`)

- A control tray in the play view, hidden until the pointer reaches the bottom-left corner or a tray button has focus: previous, next, a slide counter, overview, presenter, fullscreen and text size. Embedded decks have none.
- `g` opens a go-to dialog in the play and presenter views: type a number or part of a title, then Enter. The tray's counter opens it too. `<Toc />` lists every slide as a link, and `<Link to={n}>` goes to a slide.
- `<Mark kind="underline|circle|box|strike|cross|bracket" at={n}>` draws a hand-drawn mark (roughjs) around text on a click, and un-draws it going back.
- Code morphing: a four-backtick `md magic-move` fence holding several code fences morphs from one to the next on clicks, with each step's own line highlights (Shiki Magic Move).
- A live terminal: the kit's `LiveTerm` runs a real shell on a slide under `decks dev --live-term`, one command per click, shared by every window, with a deck-supplied fallback everywhere else. `deck.config.ts` gains `term: { dirs }`. macOS and Linux only. See `docs/guide/terminal.md`.

### Repo

- The `building-for-agents` deck runs its terminals on the framework's `LiveTerm`; its own `term/` server is gone, and `DECKS_LIVE_TERM=1` is now `--live-term`.
- CI installs `zsh` so the live-shell browser tests run on Linux.

## 1.0.0-rc.1

No changes to the package's code. This release is published by the release workflow through npm trusted publishing, so it is the first version with provenance; `1.0.0-rc.0` was published by hand to create the package.

### Repo

- The release workflow gates a `v*` tag on CI having passed for that commit, builds and packs once, and publishes the built tarball. CI runs in parallel shards.
- Browser capture tests compare against a screenshot from the same Chromium instead of stored images, and the Playwright suite has Linux baselines, so the gate passes on GitHub's runners.

## 1.0.0-rc.0

Decks is now its own React framework, published as `@steamfield/decks`. It replaces `slidev-addon-decks`, the Slidev addon this repo built before (never published to npm); the last Slidev version is the git tag `slidev-final`, and `docs/guide/migrating-from-slidev.md` maps a Slidev deck onto Decks.

### Package (`@steamfield/decks`)

- One package with subpath exports: `@steamfield/decks` (runtime hooks, layouts, views, types), `/motion`, `/kit`, `/kit/styles.css` and `/node`, built to ESM with type declarations, and a `decks` bin that runs under Node 22.12+. React 19 is a peer dependency.
- Decks are MDX slides (`slides/NN-slug.mdx`) with React components, `deck.config.ts`, optional `setup.ts`, `layers/` and `styles/`. A 1920x1080 canvas scales to the window; clicks step through `Step`, `Steps`, `Stagger`, `TextReveal`, `Highlight`, `CountUp`, `Draw` and `Morph`; slide transitions, code blocks with stepped highlights, a presenter window and overview, two-window sync, text sizing, and error reporting in dev.
- The kit: theme (`theme.json`, `installTheme`), story stages (`StoryStage`, `StoryCard`, `useStage`), the Ink marks (`InkLine`, `InkBars`, `InkTimeline`, `InkRule`, `InkNumber`, `InkChip`, `InkCardRect`, `InkPing`, `UnitGrid`, `Underline`, `CodeInk`), `OpenChart` with slide chart themes, and `Graph3D` (live WebGL on the slide, an SVG still elsewhere).
- CLI: `dev`, `build`, `new` (conventional and story templates), `check`, `lint` (AI-rhetoric patterns in MDX, JSX and story copy), `hook` (Claude Code and Codex write hooks), `export` (PDF through the print view, every click step or `--final`), `shot`, and `init`. `build` writes an `og.png` share image from slide 1 when a deck has none.
- Embed protocol: a built deck in a same-origin iframe with `?decks-bridge` takes `decks:cmd` commands and reports ready, meta and settled state, for the site's deck player.
- The user guide ships in the package under `docs/`.

### Agent setup

- A Claude Code plugin, `decks@steamfield` (marketplace at `.claude-plugin/marketplace.json`): seven skills (`working-with-decks`, `building-a-deck`, `writing-slides`, `deck-design`, `deck-motion`, `visualization`, `deck-data`), a `deck-author` agent, and hooks that deny error-level AI-rhetoric patterns in deck prose as it is written.
- `decks init` enables the plugin in a project's `.claude/settings.json`, pinned to the installed version, copies the skills to `.agents/skills/` for Codex, and adds a Decks section to `AGENTS.md`, never overwriting files the user edited. Each collaborator runs `claude plugin install decks@steamfield --scope project` once.

### Repo

- The four example decks (`building-for-agents`, `opendata-pitch`, `aisd-showcase`, `texas-2026`) were ported from Slidev and match their Slidev captures frame for frame. The other seven Slidev example decks were not ported and remain in `slidev-final`.
- `bun run test:tarball` packs the package, installs it outside the repo with bun and npm, and builds and serves a deck in Chromium.

## slidev-addon-decks, unreleased (superseded by 1.0.0-rc.0)

### Package (`slidev-addon-decks`)

- `decks init [--force]` installs the Claude Code setup into a project: the `deck-author` agent, the `building-a-deck` and `fact-checking-a-deck` skills, six rules, two hooks in `.claude/settings.json`, and a marked `decks:start` block in `AGENTS.md` (or `CLAUDE.md`). Files are rendered with the project's `decksDir`, the CLI command and the installed package path. `.claude/decks.json` records what `init` wrote with a content hash: a re-run updates unedited files, skips edited ones, leaves colliding files alone, and `--force` overwrites only edited files `init` wrote. A file an earlier version wrote and this one no longer ships is removed when unedited, kept and reported when edited; hashes are taken over LF text, so a CRLF checkout isn't an edit. Without the package installed, `init` skips the hooks and exits 1 with the install command. An unparseable `decks.json`, `.claude/decks.json` or `.claude/settings.json`, or a settings file of the wrong shape, is left untouched and `init` exits 1.
- New `decks` subcommands: `lint` (AI-rhetoric scan of pages, `slides.md`, components and story-stage `COPY` arrays; `--strict`, `--errors-only`, `--stdin`), `shot`, `snap` and `snap diff`, `fact-extract`, and `hook lint` and `hook prompt`. `check` now also fails on error-level lint hits.
- The Claude Code hooks are Node (`decks hook lint`, `decks hook prompt`) behind a POSIX `sh` wrapper `init` writes to `.claude/hooks/decks.sh`, so they need no `jq` or bash. The write hook refuses the write when the scanner can't run. Without the package installed, the wrapper refuses only writes to deck prose under `decksDir` and lets every other write through.
- The pattern list ships in the package as `lint/ai-rhetoric-patterns.tsv`.
- `playwright-chromium`, `pngjs` and `pixelmatch` are optional peer dependencies for `shot`, `snap` and `snap diff`.
- Two exemplar decks ship under `agent/exemplars/` for the skills to read: `tides` (story) and `agent-experience` (conventional, with neutral branding).
- Docs: every documented command uses `bunx -p slidev-addon-decks decks ...` or `npx -p slidev-addon-decks decks ...`, because the bare `decks` name on npm is an unrelated package.

### Repo

- `.claude/` stays the source of the agent setup. `bun run render:agent` renders it into `packages/decks/agent/`, and the drift test in `bun run test` fails when the two disagree. `bun run test:tarball` packs the package and runs `init`, `lint`, `check` and the hooks in scratch projects.
- `tools/ai-rhetoric-patterns.tsv` moved to `packages/decks/lint/` (no symlink, so Windows clones work), and `tools/content-lint.sh` and `tools/content-fact-extract.mjs` are wrappers around `decks lint` and `decks fact-extract`.
- `.claude/hooks/*.sh` are thin wrappers around `decks hook`, and the hook tests run as Node (`bun run test:hooks`).

## 0.1.0 (unreleased)

First version, extracted from a private presentation repo into a standalone package and repo.

### Package (`slidev-addon-decks`)

- Story engine (`slidev-addon-decks/story`): `useStage`, beat timelines driven by Slidev clicks, story cards, and visuals that carry over between slides.
- Ink mark components, slide chrome (`OdCoverHead`, `OdFooter`, `OdLogo`, `OdByline`, `OdQrCard`) and layout CSS.
- `OpenChart` wrapper and `Graph3D` for OpenChart 9.0.0-rc.2, with a shared slide chart theme (`slidev-addon-decks/chart-theme`).
- Audience-view viewer: text resizing on `Cmd/Ctrl +/-`, trackpad pinch zoom, reset on `Cmd/Ctrl 0`.
- Single theme source: `theme/default.json`, with a per-deck `theme.json` override merged at build time and exposed as `--od-*` CSS variables and as `slidev-addon-decks/theme` in JS. The default brand is neutral ("Decks", no URL, no logo).
- `decks` CLI: `new` (conventional or `--story`, with `--author`, `--brand`, `--url`), `dev` (extra flags such as `--port` go to Slidev), `build`, `build --all`, `export`, `list`, `check`. It reads a `decks.json` registry from the current directory; `new` creates one if missing, and its directory argument defaults to the alias.
- Embed control: inside a same-origin iframe, a built deck takes `decks:cmd` messages (`next`, `prev`, `nextSlide`, `prevSlide`, `go`) and posts `decks:ready`, `decks:meta` and `decks:state` (slide, beat, card lead and body, `settled`, direction). Inert anywhere else. `StoryCard` carries its copy as `data-lead`/`data-body`.
- Inter is self-hosted from `@fontsource-variable/inter`; the templates set `fonts.provider: none`, so decks make no Google Fonts request.
- The `decks` bin runs on Node (`#!/usr/bin/env node`), so `npx decks` works without Bun.

### Repo

- Example decks: `opendata-pitch` (story), `agent-experience` (conventional), and the two template galleries `od-templates` (with an alternate warm `theme.json`) and `od-story-templates`.
- `tides` example deck: drafted by Claude Code in one headless run, committed as raw output, then fact-checked against its NOAA, USNO and NASA sources (four copy fixes) and given an honest byline.
- Every example deck uses `routerMode: hash`, so its static build works under any path; `shot` and `snap` follow hash URLs.
- Agent configuration for Claude Code: the `deck-author` agent, the `building-a-deck` and `fact-checking-a-deck` skills, path-scoped rules, and two hooks (an AI-rhetoric write lint and a deck-writing prompt reminder). Generated copies for Antigravity and Codex.
- Tools: `bun run lint` (AI-rhetoric prose lint), `bun run fact-extract <alias>`, `bun run test:hooks`, `bun run test:embed` (embed contract against built decks), and the `shot` and `snap` screenshot scripts with a pixel diff between two `snap` walks (repo scripts needing Playwright, not package bins).
