# Decks

This file provides guidance to coding agents (Claude Code, Antigravity, Codex) working in this repo.

## What this is

Decks is a Slidev addon and deck runner for data-storytelling presentations, published as one npm package, `slidev-addon-decks` (bin `decks`). This repo is a bun workspace holding that package, four example decks, and a `decks/` directory where new decks are scaffolded.

A deck is either **conventional** (bullets, tables, charts) or a **story** deck (one pinned visualization per slide, beats on arrow keys, prose inside the stage component rather than the page). `examples/agent-experience` and `examples/opendata-pitch` are the respective references.

## Structure

```
package.json          # workspace root: Slidev, the theme, runner scripts
decks.json            # deck registry: _config + alias -> entry, slug, animated flag
packages/decks/       # the addon (npm: slidev-addon-decks)
  components/         # Od* chrome, OpenChart, Story*, Ink* marks (auto-imported in every deck)
  story/              # the story engine (import from slidev-addon-decks/story) + guard tests
  theme/              # default.json (the one theme source), resolver, contrast test
  styles/             # base, layout, components, stats, story-frame, story-marks
  scripts/            # deck.mjs (the `decks` bin) + init, hook, lint, shot, snap, fact-extract, render-agent
  lint/               # scan.mjs and ai-rhetoric-patterns.tsv (the pattern list)
  agent/              # what `decks init` installs: rendered templates, instructions.md, exemplars/, INVENTORY.md
  templates/          # what `decks new` scaffolds
examples/             # shipped decks: opendata-pitch, agent-experience, od-templates, od-story-templates
decks/                # your decks (`bun run new` writes here)
tools/                # content-lint.sh and content-fact-extract.mjs (wrappers over `decks`); ai-rhetoric-patterns.tsv is a symlink to packages/decks/lint/
<deck>/
  slides.md           # headmatter + src: manifest
  pages/NN-slug.md    # one file per slide
  components/         # deck-local Vue components (auto-imported for that deck)
  data/               # provenance-commented figures and scripted-demo fixtures, one module per slide
  styles/             # deck-local CSS: Slidev auto-loads styles/index.css
  theme.json          # optional: partial override of packages/decks/theme/default.json
  data-sources.md     # slide -> source query map (data-driven decks)
```

Slidev resolves `components/`, `public/`, and `setup/` relative to the deck's `slides.md`. Cross-deck code lives in the addon, enabled per deck with headmatter `addons: ["slidev-addon-decks"]`.

## Commands

Run from the repo root:

```bash
bun run dev <alias>            # dev server (port 3030)
bun run build <alias>          # static build to dist/<name> (decks.json _config.outDir)
bun run export <alias>         # PDF export (flags picked per deck from decks.json)
bun run new <alias> <dir> [--story] [--author "Name"] [--brand "Name"] [--url example.com]
                               # scaffold decks/<dir> (conventional or story) + register it
bun run list                   # registered decks
bun run check                  # orphaned/missing pages vs src: manifests, plus error-level lint hits
bun run build:all              # build every registered deck except `skipAll` ones; runs check first
bun run typecheck              # tsc over .ts only; a stage's .vue script is not read
bun run test                   # unit suites, story guards, theme contrast, story-card COPY lint
bun run lint                   # AI-rhetoric lint over deck pages, slides.md, components and story-stage COPY
bun run fact-extract <alias>   # every figure in a deck, for the fact-check
bun run test:hooks             # tests for the two Claude Code hooks (`decks hook`, run through .claude/hooks/)
bun run render:agent           # render .claude/ into packages/decks/agent/ (what `decks init` installs)
bun run test:tarball           # pack the package; run init, lint, check and the hooks in scratch projects
bun run shot <n> [clicks]      # headless screenshots of slide n at each click (dev server on :3030)
bun run snap <dir> [port]      # whole-deck screenshot walk against the dev server
bun run snap:diff <a> <b>      # per-frame pixel diff between two snap walks
```

**Restart the dev server after adding a component file.** Slidev's auto-import
list and Vite's resolution cache are built at startup, so a `.vue` added under
`packages/decks/components/` or `<deck>/components/` (or a new
`packages/decks/story/*.ts` module that failed to resolve once) renders as an
empty slot with `Failed to resolve component` in the console until `bun run dev`
restarts. It looks like a bug in the new component; it is not. `bun run shot`
prints that console line so the cause is visible without opening the browser.
This rule lives here only; the story-authoring detail
(`.claude/rules/story-stage.md`) and the skill both point back to this
paragraph rather than restating it.

Set `"animated": true` in `decks.json` when the deck uses OpenChart or scripted demos (it switches export from `--with-clicks --with-toc` to `--with-clicks --wait 1500`); `--story` sets it for you.

## Theme

`packages/decks/theme/default.json` is the single theme source. A deck's own `theme.json` next to its `slides.md` overrides it partially: objects merge key by key, arrays (`ramps`, `categorical`) are replaced whole, and `{group.token}` / `{ramps.<hue>.<1-4>}` aliases resolve after the merge. The six hue slots (cyan, amber, rose, emerald, violet, slate) are recolored, never renamed; each ramp is four `#rrggbb` steps getting lighter, step 1 at least 3:1 against `surfaces.canvas`. Themes stay dark. `brand` sets the cover and footer name, URL and logo (`null` for none). Edits live-reload in dev. Deck code reads colors through `slidev-addon-decks/theme` or `ink()`, CSS through the `--od-*` vars, never hex literals. Full detail: "Theme and tokens" in `.claude/rules/deck-patterns.md`; worked example: `examples/od-templates/theme.json`.

## Conventions

Slide architecture, layout classes, typography, chart specs for the 1920x1080 canvas, the theme, and the conventional headmatter template all live in `.claude/rules/deck-patterns.md`, which auto-attaches when you edit files under `examples/`, `decks/` or `packages/decks/`. Authoring a story stage component is `.claude/rules/story-stage.md`; the story engine's library reference (import root, `useStage` API, lifecycle, component list) is `packages/decks/story/README.md`. The data contract (`data/*.ts` provenance, `data-sources.md` skeleton) is `.claude/rules/deck-data.md`. The end-to-end build workflow (scaffold, provenance, verification chain, definition of done) is `.claude/skills/building-a-deck/SKILL.md`. Read these before authoring slides rather than inferring patterns from an existing deck.

Terminology for data-driven decks (column names translated to prose) goes in `.claude/rules/project-glossary.md`, which starts empty.

The `od-` prefix on CSS vars, classes and `data-od-*` attributes is a legacy name kept on purpose; don't rename it.

## Data provenance

Decks with data-driven charts maintain `<deck>/data-sources.md` mapping slide numbers to the queries behind each number. This is the fact-check input. Never put a figure on a slide that isn't traceable to a query in that file, a `data/*.ts` constant, or a `FLAG: author-reported` row. The `fact-checking-a-deck` skill runs the check.

## Writing slides

Read `.claude/rules/deck-writing.md` before writing or revising any slide text. Slide prose is not article prose in miniature. The rules that trip people coming from articles: a headline is a claim ending in a period rather than a topic label, three single-sentence bullets is the ceiling, there are no paragraphs anywhere, and a normal conventional slide runs about 70 visible words (`agent-experience` is the exemplar deck; a story card's budget is eight/twenty words instead, per `.claude/rules/story-stage.md`).

The anti-slop pattern set is `packages/decks/lint/ai-rhetoric-patterns.tsv` (`tools/ai-rhetoric-patterns.tsv` links to it); `.claude/rules/prose-patterns.md` is the longer catalog behind it. `bun run lint` scans each deck's `pages/*.md`, `slides.md`, and `components/*.vue`; it also scans story-card `COPY`; and in Claude Code a write hook blocks error-level patterns as they are written.

## Agent ops

Claude Code is the primary agent. Its config is `.claude/`:

- `agents/deck-author.md`: builds or revises one deck per session.
- `skills/building-a-deck/`, `skills/fact-checking-a-deck/`.
- `rules/`: the files named above; each attaches by path.
- Hooks are Node: `node packages/decks/scripts/deck.mjs hook lint` (PreToolUse on Edit/Write/MultiEdit: denies error-level AI-rhetoric patterns in deck prose; refuses the write if the scanner can't run) and `hook prompt` (adds the deck-writing reminder when a prompt asks to write or revise a deck). They need no `jq`. Wired in `.claude/settings.json`; `hooks/*.sh` are thin wrappers kept for old paths; tested by `bun run test:hooks`.
- `decks init` installs this setup into user projects from `packages/decks/agent/`, which is rendered from `.claude/`. When a `.claude/` rule, skill or agent changes, run `bun run render:agent` (the drift test in `bun run test` fails otherwise).

Antigravity and Codex read the same guidance through generated copies: `.agents/rules/` (rules with Antigravity glob frontmatter), `.agents/skills/` (symlinks into `.claude/skills/`), and `.codex/agents/deck-author.toml`. They were generated once from `.claude/`; when you change a rule, skill or the agent, update the matching generated copy in the same commit. Never edit only the copy.
