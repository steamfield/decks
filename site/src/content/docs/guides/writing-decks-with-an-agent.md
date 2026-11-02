---
title: Writing decks with an agent
description: What decks init installs for Claude Code (the deck-author agent, two skills, six rules, two hooks and two exemplar decks), how to re-run it, and how to ask for a deck.
group: guides
order: 2
---

Claude Code is the supported agent. `decks init` installs the setup into your project, so the workflow below applies to any project that has the package, not only a clone of the Decks repository. Other agents can read the `AGENTS.md` block, but `init` doesn't install or test a setup for them.

```bash title="Terminal"
bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed
bunx -p slidev-addon-decks decks init
bunx -p slidev-addon-decks decks new my-talk --story
claude
```

With npm, use `npx -p slidev-addon-decks decks ...`. Then ask Claude Code for the deck in plain language, for example `make a 5-slide story deck about how ocean tides work`. The bare `decks` name on npm is an unrelated package, which is why every command uses `-p slidev-addon-decks`.

## What `init` installs

- **`deck-author` agent** (`.claude/agents/deck-author.md`) builds or revises one deck per session.
- **`building-a-deck` skill** covers the whole workflow: scaffold, sourcing data, verification, build, and when a deck counts as done.
- **`fact-checking-a-deck` skill** reruns the source behind each figure, using the query or source recorded in the deck's `data-sources.md`, and checks the data arrays, card copy and slide text against the results.
- **Rules** in `.claude/rules/` attach by path when you edit files under your decks directory. They cover slide prose (`deck-writing.md`), layout, charts and theme (`deck-patterns.md`), story stages (`story-stage.md`), data provenance (`deck-data.md`), a catalog of AI writing patterns to avoid (`prose-patterns.md`) and your own terminology (`project-glossary.md`, which starts empty).
- **Hooks** in `.claude/settings.json`. `decks hook lint` runs before every Edit, Write and MultiEdit and denies deck prose that matches an error-level pattern from the package's pattern list. It also checks the `COPY` arrays in story stages. If the scanner can't run, it refuses the write instead of letting it through. `decks hook prompt` adds a reminder of the writing rules when a prompt asks for deck work. Both run on Node, so they need no `jq` and no shell.
- **Instructions block.** A section between `<!-- decks:start -->` and `<!-- decks:end -->` in `AGENTS.md` (or `CLAUDE.md`) lists the `decks` commands for the agent. With neither file present, `init` creates `AGENTS.md` and a `CLAUDE.md` that imports it.
- **Exemplars.** The skills point the agent at two decks inside the package to read and not edit: `node_modules/slidev-addon-decks/agent/exemplars/tides` (story) and `.../agent-experience` (conventional).

The files are the repository's own agent setup with your decks directory (`decksDir` in `decks.json`, default `decks`), the right runner (`bunx` when you have a bun lockfile, else `npx`) and the installed package path filled in.

## Re-running `init`

`.claude/decks.json` records each file `init` wrote and its content hash. When you upgrade the package, run `init` again:

- A file you haven't edited is updated.
- A file you edited is skipped and reported. `--force` overwrites it.
- A file at one of those paths that `init` didn't write is a collision. It is reported and left alone, even with `--force`. Rename or move it and re-run.
- Settings are merged: nothing you have is removed, and an entry is never added twice.
- The `decks:start` block is replaced in place.

To keep a file as your own, delete its entry from `.claude/decks.json`.

If the package isn't installed when you run `init`, it warns that the hook and exemplar paths point at `node_modules/slidev-addon-decks`, which doesn't exist yet. Install the package and the paths resolve.

## Data provenance

Decks with data-driven charts keep `<deck>/data-sources.md`, mapping slide numbers to the queries behind each number. It is the fact-check's input: a figure on a slide must trace to a query in that file, a `data/*.ts` constant, or a `FLAG: author-reported` row. `decks fact-extract <alias>` lists every figure in a deck.

## A real run

The tides deck on the home page started as one prompt, `make a 5-slide story deck about how ocean tides work`, run with `claude -p` in the Decks repository, which uses the same setup as `init`. The run loaded the `building-a-deck` skill, scaffolded with `bun run new tides ocean-tides --story`, fetched NOAA, US Naval Observatory and NASA sources, and finished with `check`, `test`, `lint` and `build` passing. The deck was then fact-checked and edited by hand. The home page shows an excerpt of that run's transcript.
