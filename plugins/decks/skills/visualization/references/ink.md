# Story marks

Use the public marks from `@steamfield/decks/kit` for a scene that must remain pinned and evolve over beats. For a conventional statistical chart, prefer `OpenChart` rather than rebuilding axes, legends and accessibility yourself. Read the installed kit declarations for exact props and handle signatures.

| Mark | Fits |
| --- | --- |
| `InkLine` | A sourced series drawn into explicit x/y domains and ranges |
| `InkBars` | Comparable rows that grow, recolor, exit or reorder across beats |
| `InkRule` | A baseline or reference rule |
| `InkNumber` | One sourced magnitude, optionally grown through a parent timeline |
| `InkChip` | A short label tied to a mark, not another prose card |
| `InkTimeline`, `InkTimelineCursor` | Dated events and a moving position on a common time scale |
| `UnitGrid`, `InkPing` | Tangible individual units and a selected unit needing attention |
| `InkCardRect`, `Underline` | Meaningful grouping or emphasis in the same scene |

`InkStep` is a public ramp-step type, not a component. `UnitGridItem` is a data type, not a component. Do not invent JSX tags from type names.

## Data and geometry

Import observed values and factual labels from `data/*.ts`; keep geometry separate. Explicit domains/ranges determine the quantitative meaning. Bars need a zero baseline; line positions can use a justified tighter domain. Unit grids must define what one unit represents and disclose any aggregation or rounding. A square must not silently switch population between beats.

`InkLine` takes `series`, `xDomain`, `yDomain`, `xRange`, `yRange` and optional hue/style controls. `InkBars` takes `rows`, `domain`, `xRange`, `yBand`; each `InkBarRow` has `id`, `label`, `value`, with optional display and hue fields. Use stable ids across reorderings. `InkRule` uses `x1`, `x2`, `y`.

`UnitGrid` can take explicit items or a count; its `reveal`, `recolor`, `scatter` and `collapse` are progress props driven by parent state, not autonomous story clocks. Use stable item identity for seeds, not geometry that changes on resize. Where a count is sampled or symbolic, disclose it.

Colors come from `ink(hue, step)` and `theme()`. Use neutral ink for context and one saturated subject when possible. Do not add independent animation or another scale system inside a mark to avoid learning the parent timeline.

## Timeline ownership

Use `useStage` with `useTween` for seekable state. Imperative marks append to the parent's timeline through public handles: `LineHandle.addDraw`, `BarsHandle.addGrow`/`addReorder`/`addExit`/`addRecolor`, `RuleHandle.addDraw`, `GrowHandle.addGrow`, `TimelineHandle.addInk`/`addLift`. The stage decides which click owns the change. Import handle types from the kit.

Omitted positions append; `"<"` explicitly overlaps with the last inserted tween. Keep ref-driven marks outside any subtree keyed by `playCount`. A timeline must not retain a destroyed instance. Use the deck-motion reference for entrance versus beat state and context behavior.

## Frame and text

`StoryStage` SVG is 1920x1080; `StoryLayer` supplies overlay SVG in the same coordinates. Use `STAGE`, frame units `--sw`/`--sh`/`--lw`, or data-to-range scales so labels stay aligned. `InkChip` is HTML positioned against the frame; put it in the overlay rather than inside SVG. Inspect its placement after reflow.

Keep ink out of the actual headline and card rectangles. `StoryCard` is the one prose surface; at most one chip or end label should compete for active reading. Render every beat in both directions, instant mode, presenter, preview, overview and print. Custom marks must keep the same settled meaning without timers or WebGL outside the active live slide, and must provide understandable labels/source context for their data.
