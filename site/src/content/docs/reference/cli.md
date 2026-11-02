---
title: The decks CLI
description: Every decks command (new, dev, build, export, list, check), its arguments and flags, and the decks.json registry it reads.
group: reference
order: 1
sidebarLabel: decks CLI
---

The `decks` command is the package's bin. It reads the `decks.json` registry from the current directory: `new` creates it when it is missing, and every other command stops without one. Run it with `bunx decks`, `npx decks` or `pnpm exec decks` after installing `slidev-addon-decks`.

```bash title="Terminal"
bunx decks new <alias> [dir] [--story] [--author "Name"] [--brand "Name"] [--url example.com]
bunx decks dev <alias> [--port 3031 ...]
bunx decks build <alias>
bunx decks build --all
bunx decks export <alias>
bunx decks list
bunx decks check
```

## Commands

| Command | What it does |
| --- | --- |
| `decks new <alias> [dir]` | Scaffold a deck into `decksDir` (default `decks/`) and register it. `dir` defaults to the alias and must be a bare name. Creates `decks.json` if it is missing. |
| `decks dev <alias> [...]` | Start Slidev's dev server with `--open`. Flags after the alias go to Slidev as-is (`--port`, `--remote`, `--bind`). |
| `decks build <alias>` | Static build to `outDir` (default `dist/{name}`) with `base` (default `/`). |
| `decks build --all` | Run `check`, then build every registered deck except those with `skipAll`. |
| `decks export <alias>` | PDF export. Flags depend on `animated`; see [Exporting to PDF](/docs/guides/exporting-to-pdf/). |
| `decks list` | Show the registry: alias, entry, animated or static. |
| `decks check` | Pages on disk against each deck's `src:` manifest: orphaned, missing and unregistered decks. |

## `new` flags

| Flag | Effect |
| --- | --- |
| `--story` | Story deck: a cover, one stage component, a `data/` module and `data-sources.md`. Sets `animated: true`. |
| `--author "Name"` | Byline on the cover (default `Your Name`). |
| `--brand "Name"` | Brand name in the deck's `theme.json`, for the cover and footer. |
| `--url example.com` | Brand URL in the deck's `theme.json`. |

## Runtime

The `decks` command runs on Node and starts Slidev under Node. Slidev's dev server watches files under Node; under Bun its file watcher reports no events, so slides and `theme.json` edits would not hot-reload.
