---
title: The decks CLI
description: Every decks command, from init and new to lint, shot and fact-extract, with its arguments and flags, plus the decks.json registry it reads.
group: reference
order: 1
sidebarLabel: decks CLI
---

The `decks` command is the package's bin. It reads the `decks.json` registry from the current directory: `new` creates it when it is missing, `init`, `lint` and `snap diff` run without one, and every other command stops without it. Run it as `bunx -p slidev-addon-decks decks ...` or `npx -p slidev-addon-decks decks ...`. The bare `decks` name on npm is an unrelated package.

```bash title="Terminal"
bunx -p slidev-addon-decks decks init [--force]
bunx -p slidev-addon-decks decks new <alias> [dir] [--story] [--author "Name"] [--brand "Name"] [--url example.com]
bunx -p slidev-addon-decks decks dev <alias> [--port 3031 ...]
bunx -p slidev-addon-decks decks build <alias>
bunx -p slidev-addon-decks decks build --all
bunx -p slidev-addon-decks decks export <alias>
bunx -p slidev-addon-decks decks list
bunx -p slidev-addon-decks decks check
bunx -p slidev-addon-decks decks lint [alias] [--strict] [--errors-only]
bunx -p slidev-addon-decks decks shot <alias> <slide> [clicks] [--port 3031] [--out DIR]
bunx -p slidev-addon-decks decks snap <alias> [outDir] [--port 3031]
bunx -p slidev-addon-decks decks fact-extract <alias>
```

## Commands

| Command | What it does |
| --- | --- |
| `decks init [--force]` | Install the Claude Code setup: agent, skills, rules, two hooks and an `AGENTS.md` block. Re-run to update; `--force` overwrites edited files `init` wrote. See [Writing decks with an agent](/docs/guides/writing-decks-with-an-agent/). |
| `decks new <alias> [dir]` | Scaffold a deck into `decksDir` (default `decks/`) and register it. `dir` defaults to the alias and must be a bare name. Creates `decks.json` if it is missing. |
| `decks dev <alias> [...]` | Start Slidev's dev server with `--open`. Flags after the alias go to Slidev as-is (`--port`, `--remote`, `--bind`). |
| `decks build <alias>` | Static build to `outDir` (default `dist/{name}`) with `base` (default `/`). |
| `decks build --all` | Run `check`, then build every registered deck except those with `skipAll`. |
| `decks export <alias>` | PDF export. Flags depend on `animated`; see [Exporting to PDF](/docs/guides/exporting-to-pdf/). |
| `decks list` | Show the registry: alias, entry, animated or static. |
| `decks check` | Pages on disk against each deck's `src:` manifest (orphaned, missing and unregistered decks), plus error-level `decks lint` hits. |
| `decks lint [alias\|file ...]` | AI-rhetoric scan of `slides.md`, `pages/*.md`, `components/*.vue` and story-stage `COPY` arrays; every deck when no target. Exits 1 on an error-level hit (any hit with `--strict`), 2 if the pattern file is missing. `--errors-only` hides warnings; `--stdin` scans piped text. |
| `decks shot <alias> <slide> [clicks]` | Screenshot one slide at each click. Prints card leads, chips and console errors. |
| `decks snap <alias> [outDir]` | Screenshot every slide and click (default `snaps/<alias>-<timestamp>`). `decks snap diff <dirA> <dirB> [threshold]` compares two walks frame by frame. |
| `decks fact-extract <alias\|deck-dir>` | List every figure in a deck as input for the fact-check. |
| `decks hook lint`, `decks hook prompt` | The Claude Code hooks `init` wires into `.claude/settings.json`. They read hook JSON on stdin; you don't run them by hand. |

`shot` and `snap` use a dev server already running on `--port`, or start one for the deck on a free port and stop it afterwards. They need `playwright-chromium`, an optional peer dependency (`bun add -d playwright-chromium`). `snap diff` also needs `pngjs` and `pixelmatch`.

## `new` flags

| Flag | Effect |
| --- | --- |
| `--story` | Story deck: a cover, one stage component, a `data/` module and `data-sources.md`. Sets `animated: true`. |
| `--author "Name"` | Byline on the cover (default `Your Name`). |
| `--brand "Name"` | Brand name in the deck's `theme.json`, for the cover and footer. |
| `--url example.com` | Brand URL in the deck's `theme.json`. |

## Runtime

The `decks` command runs on Node and starts Slidev under Node. Slidev's dev server watches files under Node; under Bun its file watcher reports no events, so slides and `theme.json` edits would not hot-reload.
