# Changelog

## Unreleased

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
