---
title: Checking a deck
description: The manifest check, the prose lint and its hook, the fact extractor, and the shot and snap screenshot scripts.
group: guides
order: 3
---

## From the npm package

`decks check` compares the pages on disk with each deck's `src:` manifest and reports orphaned or missing pages.

```bash title="Terminal"
bunx decks check
```

`decks build --all` runs the same check first and stops on drift.

## From a clone of the repository

These live in the repository, not the npm package. Run them from the repo root:

```bash
bun run lint                  # AI-rhetoric lint over deck pages, slides.md and components
bun run test                  # unit and guard tests, theme contrast, and the same lint over story-card copy
bun run test:hooks            # tests for the two hooks
bun run fact-extract <alias>  # list every figure in a deck as input for the fact-check
```

The lint scans each deck's `pages/*.md`, `slides.md` and `components/*.vue`. Story card copy lives in a `<script>` block the lint skips, so `bun run test` runs the same error patterns over it. In Claude Code, the `lint-ai-rhetoric.sh` hook blocks error-level patterns as they are written.

## Screenshots: `shot` and `snap`

Both run against a dev server and need Playwright's Chromium.

```bash
bun run shot <n> [clicks]      # headless screenshots of slide n at each click (dev server on :3030)
bun run snap <dir> [port]      # whole-deck screenshot walk against the dev server
bun run snap:diff <a> <b>      # per-frame pixel diff between two snap walks
```

`shot` writes `slide-<n>-c<k>.png` per click into `SHOT_DIR` (default: the current directory), prints the card lead per click, and lists console errors. A `Failed to resolve component` error means the dev server predates a component file and needs a restart.
