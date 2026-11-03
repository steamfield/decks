---
title: decks.json
description: The deck registry the decks command reads, its _config entry (decksDir, outDir, base) and the fields of a deck entry.
group: reference
order: 2
---

`decks.json` sits in the directory you run `decks` from. `decks new` creates it when it is missing.

```json title="decks.json"
{
  "_config": {
    "decksDir": "decks",
    "outDir": "dist/{name}",
    "base": "/"
  },
  "pitch": {
    "entry": "examples/opendata-pitch/slides.md",
    "name": "opendata-pitch",
    "animated": true
  }
}
```

## `_config`

| Key | Default | Meaning |
| --- | --- | --- |
| `decksDir` | `decks` | Where `decks new` scaffolds. |
| `outDir` | `dist/{name}` | Where `decks build` writes. May contain `{name}`. |
| `base` | `/` | The base path for `decks build`. May contain `{name}`. |

Keys starting with `_` are not decks: the repository's own `decks.json` has a `_readme` that documents every field.

## Deck entries

Each other key is an alias, the name you pass to `dev`, `build` and `export`.

| Field | Meaning |
| --- | --- |
| `entry` | Path to the deck's `slides.md`. |
| `name` | Slug used in `outDir` and `base`. |
| `animated` | `true` when the deck uses OpenChart or scripted demos. Switches export to `--with-clicks --wait 1500`. |
| `skipAll` | `true` to leave the deck out of `decks build --all`. |
| `outDir`, `base` | Override the `_config` values for this deck. |
