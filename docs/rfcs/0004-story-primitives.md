# RFC 0004: Promote parliament chart, track timeline and status tags to the addon

Status: Draft. Candidates are still being built in texas-2026, so this RFC grows until that deck lands.

## Problem

The story engine has strong primitives for data series (`InkLine`, `InkBars`, `UnitGrid`, `InkTimeline`), but civic and process stories need shapes it lacks. Each deck that needs one builds it deck-locally, and the repo's "promote on second use" rule means the second deck rebuilds it first. A few of these shapes are generic enough that the first good version should be promoted once it has proven itself.

## Evidence (texas-2026)

1. Seat charts. Slide 8 needs a 31-seat legislature with threshold lines, and slide 11 reuses it. The engine had nothing closer than `UnitGrid`, a rectangular waffle. The first attempt forced the deck's ballot-oval mark onto an arc and produced uneven rows, a slanted majority line through a seat, and hollow seats that contradicted the deck's own "hollow means not won" rule. The author asked for a properly designed parliament layout instead: concentric rows with seat counts proportional to radius, parties as contiguous wedges, and thresholds on seat boundaries. That geometry is the same for any legislature, board or jury.
2. Multi-track timelines. Slide 7 needs one date axis with several labelled rows (AISD and TEA, Governor, Commissioner), each lighting up separately, and slide 14 reuses the axis extended. `InkTimeline` is one row. The talks deck's `InkTimelineCursor` was ported into the addon for this deck (`2d0ca83`).
3. Evidence status. The deck prints "Pending", "Reported date" and "Scenario" on objects, with a matching line style (dashed, dotted, hatched). Any deck about live events needs this. Today it's deck-local CSS (`tx-tag`).

## Proposal

After texas-2026 lands, review its components and promote the ones whose APIs held up:

- `UnitArc` (from the deck's `SeatArc`): `total`, `groups: [{ count, label, hue|step }]`, `thresholds: [{ at, label, progress }]`, `highlight: { from, to, progress }`. The parliament layout math goes in `packages/decks/story/` with a unit test: equal spacing, contiguous wedges, and a threshold that never bisects a seat.
- `InkTimelineTracks`: `InkTimeline`'s axis plus N labelled rows, each with its own tick set and a per-row `lit` progress, with the domain end as a prop so a later slide can extend it.
- `StoryTag`: a small printed status word with `status: 'pending' | 'reported' | 'scenario' | 'confirmed'`, styled from theme tokens, plus matching SVG stroke presets for marks.
- Add each one to `examples/od-story-templates` as a gallery stage, and to the README's component list.

## Scope

`packages/decks/components/`, `packages/decks/story/` (geometry plus tests), the story templates gallery, the README, and `render:agent` output.

## Open questions

- Should `BallotOval`'s filled, empty and hatched states become a generic `InkMark` state, or stay this deck's motif?
