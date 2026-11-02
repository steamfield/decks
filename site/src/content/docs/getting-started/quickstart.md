---
title: Quickstart
description: Install slidev-addon-decks with Slidev and its base theme, scaffold a story deck and start the dev server.
group: getting-started
order: 1
---

Decks is one npm package, `slidev-addon-decks`, with a `decks` command. It runs on top of [Slidev](https://sli.dev) and the `slidev-theme-the-unnamed` base theme, which you install alongside it.

## Install and scaffold

In a new project:

```bash title="Terminal"
bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed
bunx decks new my-talk --story --author "Your Name"
bunx decks dev my-talk
```

With npm, run `npm i slidev-addon-decks @slidev/cli slidev-theme-the-unnamed`, then `npx decks new my-talk --story`. With pnpm, `pnpm add` the same packages, then `pnpm exec decks new my-talk --story`.

> [!NOTE]
> Run `decks` only after installing the package. The unscoped npm name `decks` belongs to an unrelated library, so without a local install `bunx decks` fetches that package and fails.

## What `new` does

`decks` reads the `decks.json` registry from the current directory. `new` creates it when it is missing; every other command stops without one. `new` takes an alias and an optional directory name, which defaults to the alias. The alias is what you pass to `dev`, `build` and `export`. The directory is created under `decks/`.

| Flag | Effect |
| --- | --- |
| `--story` | Scaffold a story deck: a cover, one stage component, a `data/` module and `data-sources.md`. Without it you get a conventional deck with one cover page. |
| `--author "Name"` | Byline on the cover (default `Your Name`). |
| `--brand "Name"`, `--url example.com` | Write a `theme.json` for the deck with that brand name and URL for the cover and footer. |

## Next

- [Your first story deck](/docs/getting-started/your-first-story-deck/) walks through the files `new --story` writes.
- [The decks CLI](/docs/reference/cli/) lists every command.
