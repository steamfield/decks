---
title: Checking a deck
description: The manifest check, the prose lint and its hook, the fact extractor, and the shot and snap screenshot commands.
group: guides
order: 3
---

## Manifest and prose checks

`decks check` compares the pages on disk with each deck's `src:` manifest and reports orphaned or missing pages. It also fails on error-level `decks lint` hits. `decks build --all` runs the same check first and stops on drift.

```bash title="Terminal"
bunx -p slidev-addon-decks decks check
```

`decks lint` scans each deck's `pages/*.md`, `slides.md` and `components/*.vue`, and the `COPY` arrays of story stages, which sit in a `<script>` block. It reads the AI-rhetoric pattern list shipped in the package.

```bash title="Terminal"
bunx -p slidev-addon-decks decks lint
bunx -p slidev-addon-decks decks lint my-talk
bunx -p slidev-addon-decks decks fact-extract my-talk
```

`lint` exits 1 on an error-level hit and 0 on warnings alone; `--strict` fails on any hit. `fact-extract` lists every figure in a deck as input for the fact-check. In Claude Code, the `decks hook lint` hook that `decks init` installs applies the same error-level patterns as the agent writes.

## Screenshots: `shot` and `snap`

Both need `playwright-chromium`, an optional peer dependency (`bun add -d playwright-chromium`). They use a dev server already running on `--port`, or start one for the deck and stop it afterwards.

```bash title="Terminal"
bunx -p slidev-addon-decks decks shot my-talk 3 2
bunx -p slidev-addon-decks decks snap my-talk
bunx -p slidev-addon-decks decks snap diff snaps/a snaps/b
```

`shot` writes `slide-<n>-c<k>.png` per click into `--out` (default: `SHOT_DIR`, else the current directory), prints the card lead per click, and lists console errors. A `Failed to resolve component` error means the dev server predates a component file and needs a restart. `snap diff` also needs `pngjs` and `pixelmatch`.
