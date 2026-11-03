---
title: Quickstart
description: Install slidev-addon-decks with Slidev and its base theme, run decks init for the Claude Code setup, scaffold a story deck and start the dev server.
group: getting-started
order: 1
---

Decks is one npm package, `slidev-addon-decks`, with a `decks` command. It runs on top of [Slidev](https://sli.dev) and the `slidev-theme-the-unnamed` base theme, which you install alongside it. Claude Code is the supported agent.

## Install, init and scaffold

In a new project:

```bash title="Terminal"
bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed
bunx -p slidev-addon-decks decks init
bunx -p slidev-addon-decks decks new my-talk --story --author "Your Name"
bunx -p slidev-addon-decks decks dev my-talk
```

With npm, install with `npm i slidev-addon-decks @slidev/cli slidev-theme-the-unnamed` and run the same commands with `npx` in place of `bunx`: `npx -p slidev-addon-decks decks init`. With pnpm, `pnpm add` the same packages and run the `npx` form.

> [!NOTE]
> Every command uses `-p slidev-addon-decks`. The unscoped npm name `decks` belongs to an unrelated package, so running the bare name through bunx or npx can fetch and run that package instead of this one. With `-p`, the runner installs `slidev-addon-decks` and runs its `decks` bin.

Requirements: Node 20.19+ or 22.12+. Bun is optional.

## What `init` does

`init` installs the Claude Code setup into the project. It writes:

- `.claude/agents/deck-author.md`, the `building-a-deck` and `fact-checking-a-deck` skills, and six rules in `.claude/rules/`.
- Two hooks in `.claude/settings.json`. Your existing settings and hooks stay; `init` prints a diff and never adds an entry twice.
- A block between `<!-- decks:start -->` and `<!-- decks:end -->` in `AGENTS.md`, or in `CLAUDE.md` if that is the only instructions file. With neither, it creates `AGENTS.md` and a `CLAUDE.md` containing `@AGENTS.md`.
- `.claude/decks.json`, a list of the files it wrote with a content hash for each.

Run it again after upgrading the package. Files you haven't edited are updated, files you edited are skipped and reported, and `--force` overwrites the edited ones. A file of yours at one of those paths that `init` never wrote is left alone even with `--force`: rename it and re-run. See [Writing decks with an agent](/docs/guides/writing-decks-with-an-agent/) for what each piece does.

## What `new` does

`decks` reads the `decks.json` registry from the current directory. `new` creates it when it is missing; `init` and `lint` run without one, and every other command stops without it. `new` takes an alias and an optional directory name, which defaults to the alias. The alias is what you pass to `dev`, `build` and `export`. The directory is created under `decks/`.

| Flag | Effect |
| --- | --- |
| `--story` | Scaffold a story deck: a cover, one stage component, a `data/` module and `data-sources.md`. Without it you get a conventional deck with one cover page. |
| `--author "Name"` | Byline on the cover (default `Your Name`). |
| `--brand "Name"`, `--url example.com` | Write a `theme.json` for the deck with that brand name and URL for the cover and footer. |

## Next

- [Writing decks with an agent](/docs/guides/writing-decks-with-an-agent/) shows how to ask Claude Code for a deck once `init` has run.
- [Your first story deck](/docs/getting-started/your-first-story-deck/) walks through the files `new --story` writes.
- [The decks CLI](/docs/reference/cli/) lists every command.
