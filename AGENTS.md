# Talks

This file provides guidance to coding agents (Claude Code, Antigravity, Codex) working in `talks/`.

## What this is

`talks/` is a single bun package holding Slidev decks for tech talks. It's one subdirectory of the OpenData monorepo (the parent `../` is the full repo: backend, frontend, opendata OSS library, blog, shared design system).

Deck work is self-contained here: you should not need monorepo context to write or revise slides. For anything spanning subdirectories (worktrees, commit conventions, cross-package refactors), run the session from the repo root instead, where `../AGENTS.md` loads.

A deck is either **conventional** (bullets, tables, charts) or a **story** deck (one pinned visualization per slide, beats on arrow keys, prose inside the stage component rather than the page). `aisd-takeover` and `opendata-pitch` are the respective references.

## Structure

```
talks/
  package.json          # One Slidev install + parameterized runner scripts
  decks.json             # Deck registry: alias -> entry, slug, animated flag
  scripts/                # Runner (deck.mjs) + verification (shot, snap, browser, frames); content-fact-extract is in the repo root scripts/
  shared/                 # Slidev addon: components, styles, composables, story engine
    story/                # The story engine: TS modules (imported by relative path) + guard tests
    styles/                # tokens, base, layout, components, stats, demo, story-frame, story-marks
  references/              # Gallery/template decks (od-templates, od-story-templates); not canonical
  <deck>/
    slides.md             # Headmatter + src: manifest
    pages/NN-slug.md      # One file per slide
    components/            # Deck-local Vue components (auto-imported for that deck)
    data/                  # Provenance-commented figures and scripted-demo fixtures, one module per slide
    styles/                # Deck-local CSS: Slidev auto-loads styles/index.css, which @imports the rest
    public/                # Deck-local assets
    data-sources.md        # Slide -> source query map (data-driven decks)
```

Slidev resolves `components/`, `public/`, and `setup/` relative to the deck's `slides.md`, not from `talks/`. Cross-deck code lives in the `shared/` addon, enabled per deck via headmatter `addons:`.

Current decks (aliases in `decks.json`, `bun run list` to print): `aisd-takeover`, `ai-ops-harness`, `agent-experience`, `opendata-pitch`, `mcp-vs-custom-agent`, `autonomous-datasets`, `canary-in-the-codebase`, `austin-js/*` (self-contained, own conventions, don't touch unless asked), `references/od-templates`, `references/od-story-templates` (gallery decks).

## Commands

Run from inside `talks/`:

```bash
bun run dev <alias>            # Dev server with --open
bun run build <alias>          # Build to ../blog/public/talks/<name>
bun run export <alias>         # PDF export (flags picked per deck from decks.json)
bun run new <alias> <dir> [--story]   # Scaffold a deck (conventional or story) + register it
bun run check                  # Orphaned/missing pages vs src: manifests
bun run build:all              # Build every registered deck except the `skipAll` ones (remix, story-templates); runs check first
bun run typecheck              # tsc over .ts only; a stage's .vue script is not read
bun run test                   # Unit suites + story guards (bunx vitest run shared/story scripts)
bun run shot <n> [clicks]       # Headless screenshots of slide n at each click (dev server on :3030)
bun run snap <dir> [port]       # Whole-deck screenshot walk against the dev server (default :3030)
bun run snap:diff <a> <b>       # Per-frame pixel diff between two snap walks
```

**Restart the dev server after adding a component file.** Slidev's auto-import
list and Vite's resolution cache are built at startup, so a `.vue` added under
`shared/components/` or `<deck>/components/` (or a new `shared/story/*.ts`
module that failed to resolve once) renders as an empty slot with
`Failed to resolve component` in the console until `bun run dev` restarts. It
looks like a bug in the new component; it is not. `bun run shot` prints that
console line so the cause is visible without opening the browser. This rule
lives here only; the story-authoring detail (`.claude/rules/story-stage.md`)
and the skill both point back to this paragraph rather than restating it.

**Build output leaves this directory.** Every build writes to `$(cd .. && pwd)/blog/public/talks/<name>` so the Labs Cloudflare Pages deploy picks the decks up. A deck build therefore dirties `blog/public/`. That's expected, not a mistake.

Set `"animated": true` in `decks.json` when the deck uses OpenChart or scripted demos (it switches export from `--with-clicks --with-toc` to `--with-clicks --wait 1500`); `--story` sets it for you.

## Conventions

Slide architecture, layout classes, typography, chart specs for the 1920x1080 canvas, and the conventional headmatter template all live in `.claude/rules/talks-patterns.md`, which auto-attaches when you edit files here. Authoring a story stage component is `.claude/rules/story-stage.md`; the story engine's library reference (import root, `useStage` API, lifecycle, component list) is `shared/story/README.md`. The data contract (`data/*.ts` provenance, `data-sources.md` skeleton) is `.claude/rules/deck-data.md`. The end-to-end build workflow (scaffold, provenance, verification chain, definition of done) is `.claude/skills/building-a-deck/SKILL.md`. Read these before authoring slides rather than inferring patterns from an existing deck.

Terminology for data-driven decks (column names translated to prose) is in `.claude/rules/blog-terminology.md`. A `lint-ai-rhetoric.sh` hook enforces part of that glossary on write.

## Data provenance

Decks with data-driven charts maintain `<deck>/data-sources.md` mapping slide numbers to the queries behind each number. This is the fact-check input. Never put a figure on a slide that isn't traceable to a query in that file, a `data/*.ts` constant, or a `FLAG: founder-reported` row.

## Writing slides

Read `.claude/rules/deck-writing.md` before writing or revising any slide text. Slide prose is not article prose in miniature. The rules that trip people coming from `blog/`: a headline is a claim ending in a period rather than a topic label, three single-sentence bullets is the ceiling, there are no paragraphs anywhere, and a normal conventional slide runs about 70 visible words (`agent-experience` is the exemplar deck; a story card's budget is eight/twenty words instead, per `.claude/rules/story-stage.md`). Several of these deliberately invert the blog's rules, so do not carry article habits across.

What does carry across unchanged is the anti-slop pattern set. `make content-lint` scans `*/pages/*.md`, `*/slides.md`, and `*/components/*.vue`, and the decks currently pass clean.

The `talks-deck` agent lives here at `.claude/agents/talks-deck.md` (moved from the repo root on 2026-08-31, so that backend and frontend sessions are not handed deck guidance). Agent discovery walks up from the session root and never down, so it resolves here and not from the repo root.

`content-pipeline` and `content-fact-check` both moved to `blog/.claude/skills/` on 2026-08-31, when all blog authoring config was consolidated there to keep the root config clean for backend and frontend work. Skill discovery walks up from the session root and never down, so neither this directory nor the repo root sees them. Two things follow for deck work:

- **Fact-checking a deck now starts in `blog/`** (`cd blog && claude`). The skill still handles decks via `bun scripts/content-fact-extract.mjs --deck talks/<deck-dir>` and still reads `talks/<deck>/data-sources.md`; only its discovery location changed. Its paths stay repo-root relative, so run `cd "$(git rev-parse --show-toplevel)"` first.
- **The pipeline's Talks Variant is likewise reachable only from `blog/`.**

Deck work that needs neither uses the `building-a-deck` skill here, unchanged.
