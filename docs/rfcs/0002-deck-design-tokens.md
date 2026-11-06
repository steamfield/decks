# RFC 0002: Scaffold per-deck design tokens and guard against literals

Status: Draft.

## Problem

`theme.json` covers colors, fonts and brand, but a deck with its own look needs more than that: radii, hairline weights, headline size, card width, baseline position, dim levels, and the JS-side numbers the beat scripts use. Without a home for those values, they end up hard-coded across stage components, and changing the look later means hunting through every file. The repo has the rule "no hex in deck code", but nothing equivalent for the rest, and nothing enforces it.

## Evidence (texas-2026)

The author asked that the deck's design be easy to change after it's built. The design run built three files to make that true:

- `theme.json` for colors and fonts;
- `styles/tokens.css` for `--tx-*` shape and layout properties;
- `components/design.ts` for JS-side constants and helpers like `changed()` and `risk()`, which return colors by meaning rather than by slot.

It also ran a "token drill": change one value in each file and confirm every slide followed. It worked. But every deck would have to rediscover this layout, and the "no literals" rule is currently a grep in a contract, not a check.

Fonts were similar. Moving off Inter meant adding two fontsource packages, an import, a `fonts.serif` key and a headmatter change, all found by hand.

## Proposal

1. Have `decks new --story` (and the conventional variant) scaffold `styles/tokens.css`, `components/design.ts` and a short `DESIGN.md`, pre-filled with the default values and comments. A deck that never customizes them looks the same as today.
2. Add a guard test, next to `durations.test.ts` and `frame-units.test.ts`, that fails on hex colors, `px` border radii and numeric opacity literals in deck `components/*.vue`, with `design.ts` exempt. Allow a `lint-allow` escape, as the prose lint does.
3. Add `--serif "<Family>"` and `--sans "<Family>"` to `decks new`. These install the fontsource package, write the import and set `fonts.*`. Document the two-line swap in `deck-patterns.md`.
4. Add meaning-level helpers to the addon, so a deck maps "changed", "risk" and "neutral" onto slots once, in its `design.ts`, and stages never name slots. This could stay deck-local until a second deck wants it.

## Scope

`packages/decks/templates/`, `packages/decks/scripts/deck.mjs` (`new`), a new guard in `packages/decks/story/`, `.claude/rules/deck-patterns.md` ("Theme and tokens"), and `render:agent` output.

## Open questions

- Is the prefix `--tx-*` (deck-chosen) or a fixed `--deck-*`? A fixed prefix lets the guard and the docs name it.
