---
title: Theming with theme.json
description: Restyle a deck with a theme.json next to its slides.md that overrides only the keys you name in packages/decks/theme/default.json.
group: guides
order: 1
---

All colors, fonts and brand fields come from one file, `packages/decks/theme/default.json`. To restyle a deck, put a `theme.json` next to its `slides.md` and include only the keys you want to change:

```json title="theme.json"
{
  "brand": { "name": "Acme", "url": "acme.example", "logo": null },
  "ramps": { "cyan": ["#2f8f83", "#3fae9f", "#62c7b8", "#9be0d4"] }
}
```

## Merge rules

- Objects merge key by key; arrays (`ramps.<hue>`, `categorical`) are replaced whole.
- Aliases use `{group.token}` and `{ramps.<hue>.<1-4>}`, as in `"glows": { "secondary": "{ramps.amber.2}" }`. They resolve after the merge, so an alias in the default follows your override.
- The six hue names (`cyan`, `amber`, `rose`, `emerald`, `violet`, `slate`) are fixed slots: recolor them, don't rename or add. Each ramp is four `#rrggbb` colors getting lighter, and step 1 must reach 3:1 contrast against `surfaces.canvas`.
- Glows must be hex. Themes stay dark: `the-unnamed` forces a dark color schema.

In dev, edits to `theme.json` reload live. They apply at build time too.

## Brand

`brand` is `{ name, url, "wordmark-gradient", logo }`. `logo` is `{ "view-box", "svg" }` or `null` for no mark, and `url: null` hides the cover URL. `bunx decks new <alias> --brand "Name" --url example.com` writes this block for you.

## Using the colors

The theme becomes `--od-*` CSS variables for stylesheets. JavaScript, such as chart specs, reads it through `import { theme } from 'slidev-addon-decks/theme'` or `ink(hue, step)` from `slidev-addon-decks/story`. Hex literals in deck code ignore the deck's theme. Every variable is listed in [theme.json tokens](/docs/reference/theme-json-tokens/).

`examples/od-templates/theme.json` is a complete alternate palette and brand; `examples/opendata-pitch/theme.json` overrides only the brand. The NORMAL and WARM stills on the home page are the same tides slide built with the default theme and with a short `theme.json` taken from the od-templates palette.

> [!NOTE]
> The `od-` prefix on CSS variables and classes is a leftover from the project Decks was extracted from. It stays to avoid a rename across hundreds of selectors.
