# Changelog

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
