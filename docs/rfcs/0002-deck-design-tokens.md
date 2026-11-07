# RFC 0002: Shape tokens in the theme, a hex guard, and a serif font slot

Status: Ready (reviewed). Reworked after review: the first draft scaffolded per-deck token files, which would have copied addon defaults into every deck with nothing reading them.

## Problem

`theme.json` covers colors, fonts and brand. A deck with its own look also needs shape values (corner radius, hairline weight, card width, dim level), and today those are hard-coded in the addon's CSS (for example `border-radius: 12px` at `styles/story-marks.css:24`), so a deck can change them only by overriding addon selectors. The "no hex in deck code" rule exists only as prose. And the theme has no serif slot, so a serif headline takes an `!important` rule.

## Evidence (texas-2026)

The author asked for a design that's easy to change after the build. The design run built `styles/tokens.css` with `--tx-*` properties and `components/design.ts` for JS constants, then overrode addon selectors with them (`examples/texas-2026/styles/index.css:50,55,115,197,204`) and kept hand-written CSS mirrors of JS values (`tokens.css:18,25,26`) with no guard. A token drill passed. It took a design run to invent, and the next deck would invent it again.

Literals: a grep for hex colors, `px` radii and fractional opacity finds about 41 hits in 11 example components (mostly aisd-showcase and opendata-pitch) and about 17 in `packages/decks/components/`. texas-2026's components have none.

Fonts: `default.json` has only `fonts.sans` and `fonts.mono`, and nothing in the addon reads `--od-font-serif`. texas-2026 gets serif headings from its own `!important` rule (`index.css:11`) after adding two `@fontsource-variable` packages, an import, a `fonts.serif` key, and headmatter changes (`webfonts: []` and removing the template's `sans/serif/mono: Inter` lines), all found by hand.

Layout: every slide run left the left third of the frame empty and squeezed the visual into the right half, because nothing says where the headline band and card sit. The card's height depends on its copy and its width differs per deck (texas uses `34sw`, the addon `36lw`), so a computed box would be wrong; this is a documentation gap.

## Plan

1. Add a `shape` group to `packages/decks/theme/default.json` (`radius`, `hairline`, `cardWidth`, `dim`), rendered as `--od-*` variables the way colors are and exposed in JS through `slidev-addon-decks/theme`. Change the addon CSS that hard-codes those values to read the variables, with the current values as the defaults, so nothing moves. A deck's `theme.json` overrides them like any other group. texas-2026 keeps its own tokens; migrating it is optional.
   - Done when: `bun run snap:diff` shows no change on od-story-templates and agent-experience, and setting `shape.radius` in a scratch deck's `theme.json` changes its card corners.
2. Add a hex guard, `packages/decks/story/design-literals.test.ts`, walking `packages/decks/components/` and every registered deck's `components/*.vue`. It fails on hex colors in color contexts (`fill`, `stroke`, `color`, `background`, and color-valued CSS properties), so `url(#id)` and `href="#..."` don't match. It honors a `lint-allow` comment on the line (needed for `OdQrCard.vue`'s QR white) and pins today's offenders by file and count, addon included, so it fails only on new ones. Radii and opacity stay out: after item 1 there's a token for radius, and flagging `opacity: 0/1` would force tokens for on and off.
   - Done when: it passes on main, and adding `fill="#fff"` to a texas-2026 stage fails it.
3. Add `fonts.serif` to `default.json`, defaulting to `{fonts.sans}`, and have the story headline and cover title read `--od-font-serif`. A deck that never sets it looks the same. Then document the font swap in "Theme and tokens" in `.claude/rules/deck-patterns.md`: install the `@fontsource-variable/<slug>` package, import it in `styles/index.css`, set `fonts.*` in `theme.json` using the `'<Family> Variable'` name, and set `webfonts: []` and remove the template's font lines in headmatter. No `decks new` flags: many families have no variable package, and a wrong import breaks the build.
   - Done when: setting `fonts.serif` in a scratch deck changes its story headlines with no deck CSS, and the shipped decks snap unchanged.
4. Document the reserved regions in `.claude/rules/story-stage.md`: the headline band, and the card column for each card anchor at its maximum height, with a pointer to the variables that set them. Add one line to deck-patterns: deck-only JS constants go in a deck `design.ts`, as in texas-2026.

Not doing: scaffolding `tokens.css`/`design.ts`/`DESIGN.md` into new decks, `cardBox()`/`freeRegion()` helpers, or meaning-level color helpers (`changed()`, `risk()`), which have one user. Cleaning the pinned literals in aisd-showcase and opendata-pitch waits until those decks are next touched.

Repo-only caveat: like every test here, the guard is excluded from the package, so `decks init` users don't get it.

## Scope

`packages/decks/theme/{default.json,default.ts,resolve.ts,index.ts}`, addon CSS under `packages/decks/styles/` and the story headline and cover components, a new guard in `packages/decks/story/`, `.claude/rules/deck-patterns.md` and `story-stage.md` with their `.agents/rules/` copies, and `bun run render:agent` output.

## Verification

`bun run test` (the contrast test still passes), `bun run snap:diff` on the shipped story decks before and after, and `bun run test:tarball`.
