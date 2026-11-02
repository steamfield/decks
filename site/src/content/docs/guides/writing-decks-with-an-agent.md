---
title: Writing decks with an agent
description: The Claude Code setup in the Decks repository, the deck-author agent, two skills, the rules and the prose-lint hook, and how to use them from a clone.
group: guides
order: 2
---

The repository is set up for Claude Code. Antigravity and Codex read generated copies of the same guidance in `.agents/` and `.codex/`, and `AGENTS.md` is the entry point for any agent. The agent setup lives in the repository and is not in the npm package, so this workflow applies to decks you write in a clone.

```bash title="Terminal"
git clone https://github.com/steamfield/decks.git
cd decks
bun install
claude
```

## What's in `.claude/`

- **`deck-author` agent** (`.claude/agents/deck-author.md`) builds or revises one deck per session.
- **`building-a-deck` skill** covers the whole workflow: scaffold, sourcing data, verification, build, and when a deck counts as done.
- **`fact-checking-a-deck` skill** reruns the source behind each figure, using the query or source recorded in the deck's `data-sources.md`, and checks the data arrays, card copy and slide text against the results.
- **Rules** in `.claude/rules/` attach by path when you edit `examples/`, `decks/` or `packages/decks/`. They cover slide prose (`deck-writing.md`), layout, charts and theme (`deck-patterns.md`), story stages (`story-stage.md`), data provenance (`deck-data.md`) and a catalog of AI writing patterns to avoid (`prose-patterns.md`).
- **Hooks.** `lint-ai-rhetoric.sh` runs before every Edit or Write and rejects deck prose that matches an error-level pattern in `tools/ai-rhetoric-patterns.tsv`. `user-prompt-submit.sh` adds a reminder of the writing rules when a prompt asks for deck work. Both need `jq` on your PATH.

## Data provenance

Decks with data-driven charts keep `<deck>/data-sources.md`, mapping slide numbers to the queries behind each number. It is the fact-check's input: a figure on a slide must trace to a query in that file, a `data/*.ts` constant, or a `FLAG: author-reported` row.

## A real run

The tides deck on the home page started as one prompt, `make a 5-slide story deck about how ocean tides work`, run with `claude -p` at the repository root. The run loaded the `building-a-deck` skill, scaffolded with `bun run new tides ocean-tides --story`, fetched NOAA, US Naval Observatory and NASA sources, and finished with `check`, `test`, `lint` and `build` passing. The deck was then fact-checked and edited by hand. The home page shows an excerpt of that run's transcript.
