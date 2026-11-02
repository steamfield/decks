---
title: Add Decks to an existing Slidev deck
description: Install the addon next to an existing Slidev deck, enable it in the headmatter and register the deck with decks.json.
group: getting-started
order: 3
sidebarLabel: Add to an existing deck
---

Decks is a Slidev addon, so an existing deck can turn it on without moving files.

## Install

```bash title="Terminal"
bun add slidev-addon-decks slidev-theme-the-unnamed
```

The deck needs `@slidev/cli` as well, which an existing Slidev project already has.

## Enable the addon

Name the base theme and the addon in the deck's headmatter:

```yaml title="slides.md"
theme: the-unnamed
addons: ["slidev-addon-decks"]
```

The components (`Od*` chrome, `OpenChart`, `Story*`, `Ink*` marks) are then auto-imported in every slide. `Graph3D` needs `three`, `3d-force-graph` and `three-spritetext` installed alongside; other components don't.

## Story slides

Story slides need more headmatter than the two lines above: the transition the story engine runs, the `data-od-story` attribute, the canvas size and fonts. Scaffold a throwaway story deck with `bunx -p slidev-addon-decks decks new scratch --story` and copy its `slides.md` headmatter; the comments in it say what each key is for.

## Run it with the CLI

The `decks` command works from a `decks.json` registry. To run an existing deck through it, add an entry by hand:

```json title="decks.json"
{
  "talk": { "entry": "slides.md", "name": "talk" }
}
```

Then `bunx -p slidev-addon-decks decks dev talk`, `bunx -p slidev-addon-decks decks build talk` and `bunx -p slidev-addon-decks decks export talk` work. See [decks.json](/docs/reference/decks-json/) for the other fields.
