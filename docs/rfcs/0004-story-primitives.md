# RFC 0004: Promote the parliament layout math, and gate the credit from the addon

Status: Ready (reviewed). Narrowed after review: the component API stays deck-local until a second deck uses it.

## Problem

The story engine has primitives for data series, but civic and process stories need shapes it lacks. The repo's rule is to promote a component on its second use, which is the right default. This RFC asks for one narrow exception, for geometry that's generic and was hard to get right, and fixes the hand-wiring every deck does to show the Decks credit.

## Evidence (texas-2026)

1. Seat chart. Slides 8 and 11 show a 31-seat Senate with threshold ticks. Two runs produced uneven rows and a threshold line slanting through a seat before the third was handed the algorithm: rows with seat counts proportional to radius by largest-remainder rounding, seats sorted by angle, thresholds at the mean angle of the seats either side. It lives in `examples/texas-2026/components/SeatArc.vue` (plain circles, not the deck's ballot ovals) with spacing constants in `design.ts:17-32` and a test in `components/seat-arc.test.ts`. The constants are tuned for 31 seats over three rows; `design.ts` says so, and the inner-radius formula goes negative for small totals. Sorting every seat by angle also ties at the top of the arc when two rows both have an odd count. 31 seats (rows of 7, 10 and 14) avoids that by luck.
2. Multi-track timeline and status tags. `CollisionTimeline.vue` builds rows on `InkTimelineCursor` (ported in `2d0ca83`), but hard-codes the deck's event ids and hides the cursor's progress line. The `tx-tag` status CSS is used by 12 components. Both are tied to this deck; neither has a second user.
3. Credit and favicon. `DecksCredit` is in the addon, but each deck opts in by hand with its own `global-bottom.vue`, a copied `public/favicon.svg` and a `favicon:` headmatter key.

## Plan

1. Promote the layout math only. Add `packages/decks/story/parliament.ts`, exported from `slidev-addon-decks/story`: `layout(total, { rows?, radius })` returns seat positions, row and angle, choosing the row count and seat size from the total so spacing along a row matches the gap between rows; and `thresholdAngle(seats, at)`. Break angle ties by row, so the order is total and a threshold never lands between two tied seats. Move and extend `seat-arc.test.ts`: totals from 5 to 200, rows proportional to radius, contiguous wedges, no seat overlap, and no threshold bisecting a seat or splitting tied seats. `SeatArc.vue` imports it and stays deck-local; `UnitArc.vue` waits for the second deck.
   - Done when: the extended test passes, and `bun run snap:diff` shows slides 8 and 11 unchanged after `SeatArc` switches to the shared module.
2. Gate the credit from the addon. Slidev merges global layers from addons, so ship `packages/decks/global-bottom.vue` rendering `DecksCredit` only when headmatter sets `decksCredit: true`. It defaults to off, so existing decks and `decks init` users see no change. Ship the favicon in the addon's `public/` (add `public` to `files` in `packages/decks/package.json`), and document `favicon: /theme/favicon.svg`. (As landed: Slidev 52.20.1 copies an addon's `public/` under its source path, not `/theme/`, and writes `favicon:` without the base, so a small `decksPublic()` plugin in `packages/decks/vite.config.mts` serves and emits those files at `<base>theme/<file>`.) Remove texas-2026's own `global-bottom.vue` and copied favicon in the same commit, or the credit draws twice. Keep the mark geometry where it is, with a site test asserting `DecksCredit.vue` uses the same constants as `site/src/lib/brand.ts`, rather than adding a cross-package import that `site/AGENTS.md` lists as debt.
   - Done when: texas-2026 shows one credit and the Decks favicon, a deck without `decksCredit` shows neither, both hold in a build with a non-root `base`, and `bun run test:tarball` finds the favicon in the package.
3. Decide separately whether `decks new` writes `decksCredit: true` into new decks. That puts a "Created with Decks" badge on every user's new deck by default, which is a product call. Until then it writes nothing, and the README documents the key. `DecksCredit` has only been placed on story slides, so check a conventional scaffold against `OdFooter` before defaulting it on anywhere.

Not promoting: the timeline tracks and status tags (one user each, tied to this deck), and `BallotOval`.

## Scope

`packages/decks/story/parliament.ts` and test, `packages/decks/story/index.ts`, `packages/decks/global-bottom.vue`, `packages/decks/public/favicon.svg`, `packages/decks/package.json` (`files`), `examples/texas-2026/components/SeatArc.vue`, `seat-arc.test.ts`, `global-bottom.vue`, `public/` and `slides.md`, a test in `site/`, and `packages/decks/story/README.md`.

## Verification

`bun run test`, `bun run snap:diff` on texas-2026 before and after, `bun run build tx26` with a non-root `base`, the `site/` tests, and `bun run test:tarball`.
