# Parity spike

## Commands

Run from the repository root after the worktree's existing `bun install` and `bun install --cwd react-decks` setup. Each measurement command starts its own development servers on free ports, launches headless Chromium, writes raw JSON and PNGs to `react-decks/examples/spike/.out/`, and stops its servers. Chromium must be installed through the workspace's Playwright installation. The machine helper `wait-for` must be on PATH, as required by the repository instructions.

```sh
node react-decks/examples/spike/scripts/snapshots.mjs
node react-decks/examples/spike/scripts/frame-time.mjs
node react-decks/examples/spike/scripts/qa.mjs

bun run --cwd react-decks lint
bun run --cwd react-decks typecheck
bun run --cwd react-decks check
bun run --cwd react-decks decks build spike
```

`REACT_URL` and `VUE_URL` optionally reuse existing servers. The final measurements use the commands above without those overrides. The Vue server is started with `bun run dev aisd-showcase --no-open --port <free port>`. Its running DOM identifies the waffle as **slide 1**, despite the source filename and older comments. It uses `/1?clicks=0`, not a hash route. React uses `#/3?clicks=0`.

The JSON writer runs the workspace's installed Biome formatter before saving. Biome's current configuration scans git-ignored `.out/` files too; this keeps a measurement run from making the subsequent gate fail on JSON formatting. The large raw frame files still produce two file-size warnings in Biome; the data is retained.

Environment: macOS arm64, Apple M3 Max, Node v24.21.0; Chromium from the installed Playwright 1.65.1; React 19.3.1, GSAP 3.15.0, OpenChart React 9.0.0. Viewport 1920×1080, device scale factor 1, unless a table says otherwise. Both performance subjects use development servers. React profiling stays enabled during measurement.

## Decisions

- Preserve the existing copy and data. The AISD data and tide predictions are copied fixtures, not newly researched or refreshed claims.
- Port the clean mark variants and only the props these four slides use. Do not infer the cost of the unused marker, scatter, collapse, sheet, or cross-slide transition paths from these files.
- The cited Agent Experience slide 09 contains a **printed spec**, not a rendered chart or dataset. Slide 4 instantiates its `bar`, `year`, `spending_per_capita`, and `country` schema with six explicitly synthetic observations. This tests the adapter and pointer geometry; it is not a port of an existing chart image.
- Preserve the interview footer's original `3 / 10` for comparison. Freeze and simplify its logo instead of porting the unrelated perpetual logo animation. The resulting pixel difference remains visible in the diff.
- Use the scaled frame's size container for CSS lengths. Do not undo `SlideFrame`'s transform or multiply JS lengths by the screen scale.
- Retain the `useTween` API but publish through GSAP's public ticker after its updates. A separate requestAnimationFrame queue produced a measured half-rate visual update.
- No dependency was added. No framework file was changed.

## Snapshot parity

`snapshots.mjs` loads each requested click directly, waits for fonts, GSAP completion and 250 ms without stage mutations, and captures the whole viewport. It uses `pixelmatch` with `threshold: 0.1` and the default antialias exclusion, matching the existing snapshot tool. The fraction denominator is 2,073,600 pixels. Diff images and raw counts are in `.out/snapshots.json` and `.out/*-diff.png`.

| Frame | Differing pixels | Fraction | Target < 0.002 | Cause |
| --- | ---: | ---: | --- | --- |
| tides-s02-c0 | 0 | 0 | Pass | Exact settled match. |
| tides-s02-c1 | 0 | 0 | Pass | Exact settled match, including line and glow. |
| tides-s02-c2 | 0 | 0 | Pass | Exact settled match, including dots and chip. |
| ax-s03-c0 | 127 | 0.00006124614197530864 | Pass | Simplified static footer logo only, in the 20×20 logo region. |

No frame remains over target. The initial Tide difference was 98 pixels along the source link: dropping Vue's scoped attribute lowered the port's selector specificity, allowing the layout's dashed link border to win. Restoring equivalent specificity made those pixels match. The initial interview difference was 1,929 pixels: 1,802 came from supplying a real italic Inter font where Slidev synthesizes italic from its normal variable font; the remaining 127 are the logo. Removing the extra italic face restored the source's font behavior. No geometry or pixelmatch threshold was adjusted to conceal a difference.

All four final frames and the non-16:9 screenshots were inspected visually.

## Frame time

`frame-time.mjs` runs five full forward/backward walks per framework per throttle level. Every run reloads at click 0 and lets the entrance settle. Before each real ArrowRight/ArrowLeft it starts recording rAF timestamps and observes mutations only inside the visible waffle stage. Recording ends after 250 ms without mutations and, for React, no active GSAP work. The idle tail is trimmed at the last mutation plus 17 ms. Adjacent timestamps supply frame intervals; the first timestamp is not treated as an interval. Median uses the middle ordered sample; p95 uses nearest rank. The tables pool the five runs' intervals per transition; counts are sums, not averages.

The Vue subject retains its existing invisible hover targets and hover-card wiring; the contract removes these from React. Neither run hovers the grid. The measurements therefore compare the requested slides, not perfectly identical component trees. Profiler overhead is present only on React. These are local headless measurements on one computer, not a guarantee for slower GPUs or other browsers.

### 1x CPU

| Transition | React median / p95 (ms) | Vue median / p95 (ms) | Frames >20 ms R / V | Intervals R / V | React stage commits, runs 1–5 |
| --- | --- | --- | --- | --- | --- |
| 0→1 | 16.7 / 16.7 | 16.7 / 16.7 | 0 / 0 | 105 / 105 | 22, 22, 22, 22, 22 |
| 1→2 | 16.7 / 16.7 | 16.7 / 16.8 | 0 / 0 | 391 / 391 | 80, 79, 79, 79, 79 |
| 2→3 | 16.7 / 16.8 | 16.7 / 16.7 | 0 / 0 | 590 / 590 | 119, 119, 119, 119, 119 |
| 3→2 | 16.7 / 16.7 | 16.7 / 16.7 | 0 / 0 | 590 / 590 | 119, 119, 119, 119, 119 |
| 2→1 | 16.7 / 16.8 | 16.7 / 16.7 | 0 / 0 | 392 / 390 | 79, 79, 80, 79, 79 |
| 1→0 | 16.7 / 16.8 | 16.7 / 16.7 | 0 / 0 | 107 / 105 | 22, 22, 22, 22, 22 |

### 4x CPU

| Transition | React median / p95 (ms) | Vue median / p95 (ms) | Frames >20 ms R / V | Intervals R / V | React stage commits, runs 1–5 |
| --- | --- | --- | --- | --- | --- |
| 0→1 | 16.7 / 16.8 | 16.7 / 16.7 | 4 / 0 | 101 / 105 | 21, 21, 22, 22, 20 |
| 1→2 | 16.7 / 16.7 | 16.7 / 16.7 | 1 / 0 | 390 / 392 | 79, 79, 79, 79, 79 |
| 2→3 | 16.7 / 16.8 | 16.7 / 16.7 | 0 / 0 | 590 / 590 | 119, 119, 119, 119, 119 |
| 3→2 | 16.7 / 16.8 | 16.7 / 16.7 | 0 / 0 | 590 / 590 | 119, 119, 119, 119, 119 |
| 2→1 | 16.7 / 16.7 | 16.7 / 16.8 | 0 / 0 | 392 / 391 | 79, 79, 79, 79, 79 |
| 1→0 | 16.7 / 16.8 | 16.7 / 16.7 | 0 / 0 | 105 / 105 | 22, 22, 22, 22, 22 |

UnitGrid commit arrays equal the stage commit arrays in every final run.

Per-run raw summaries below are `(median ms, p95 ms, >20 ms count, interval count)`, in run order 1 through 5. The JSON preserves the unrounded timestamps.

| Framework | CPU | Transition | Runs 1–5 |
| --- | --- | --- | --- |
| react | 1x | 0→1 | (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21) |
| react | 1x | 1→2 | (16.7, 16.7, 0, 79); (16.7, 16.8, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.7, 0, 78) |
| react | 1x | 2→3 | (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118) |
| react | 1x | 3→2 | (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118) |
| react | 1x | 2→1 | (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 79); (16.7, 16.8, 0, 79); (16.7, 16.7, 0, 78); (16.7, 16.7, 0, 78) |
| react | 1x | 1→0 | (16.7, 16.8, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 22); (16.7, 16.7, 0, 22); (16.7, 16.8, 0, 21) |
| react | 4x | 0→1 | (16.7, 16.8, 1, 20); (16.7, 16.8, 1, 20); (16.7, 16.8, 0, 21); (16.7, 16.7, 0, 21); (16.7, 33.3, 2, 19) |
| react | 4x | 1→2 | (16.7, 16.7, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.8, 1, 78) |
| react | 4x | 2→3 | (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118) |
| react | 4x | 3→2 | (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118) |
| react | 4x | 2→1 | (16.7, 16.8, 0, 79); (16.7, 16.7, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 78); (16.7, 16.8, 0, 79) |
| react | 4x | 1→0 | (16.7, 16.8, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.8, 0, 21); (16.7, 16.8, 0, 21) |
| vue | 1x | 0→1 | (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.8, 0, 21) |
| vue | 1x | 1→2 | (16.7, 16.8, 0, 78); (16.7, 16.8, 0, 78); (16.7, 16.8, 0, 78); (16.7, 16.8, 0, 79); (16.7, 16.8, 0, 78) |
| vue | 1x | 2→3 | (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118) |
| vue | 1x | 3→2 | (16.7, 16.8, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118) |
| vue | 1x | 2→1 | (16.7, 16.8, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 78); (16.7, 16.8, 0, 78) |
| vue | 1x | 1→0 | (16.7, 16.8, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.8, 0, 21) |
| vue | 4x | 0→1 | (16.7, 16.7, 0, 21); (16.7, 16.8, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21) |
| vue | 4x | 1→2 | (16.7, 16.7, 0, 79); (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 79); (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 78) |
| vue | 4x | 2→3 | (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118) |
| vue | 4x | 3→2 | (16.7, 16.8, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.7, 0, 118); (16.7, 16.8, 0, 118); (16.7, 16.7, 0, 118) |
| vue | 4x | 2→1 | (16.7, 16.8, 0, 78); (16.7, 16.8, 0, 78); (16.7, 16.7, 0, 78); (16.7, 16.8, 0, 79); (16.7, 16.8, 0, 78) |
| vue | 4x | 1→0 | (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21); (16.7, 16.7, 0, 21) |

React's Profiler wraps the stage subtree and separately wraps UnitGrid. A stage commit includes reconciliation of StoryStage, UnitGrid, the ping instances, the legend, StoryLink and StoryCard. UnitGrid rebuilds the 102 rect descriptors on each parent render; it does not have its own subscription. The two profiler counts describe nested subtrees and must not be added together. The click itself also contributes a commit. The stage does not render while idle. The Tide draw updates InkLine locally; the dots/chip phase updates TideDayStage and its children.

The first bridge version, using an independent requestAnimationFrame notification, produced about 40 stage commits during a roughly 78-frame transition and 60 during a roughly 119-frame transition. Its browser rAF numbers still looked healthy. This is why frame intervals alone did not establish visual parity. The initial run is retained locally as `.out/frame-time-initial.json`; the final script output is `.out/frame-time.json` with every timestamp, interval, profiler timestamp, and per-run summary.

Vue logs `Wake Lock permission request denied` in headless Chromium. Those errors are recorded rather than filtered. They occur on navigation/reload, outside the recorded settled transition. React's four slides produced no console or page errors.

## Tween bridge verdict

Keep the stable mutable object and `useSyncExternalStore` design, with notifications on GSAP's public ticker after its global update. Change the scheduling detail: an independent requestAnimationFrame queue gave roughly 30 visible updates per second on a 60 Hz rAF stream. The corrected uninterrupted InkLine sweep changed on all 34 of its 34 active animation frames, with at most one InkLine commit per rAF interval; its 35 total commits include the navigation update. No commits occurred in the following 500 ms idle check. A rapid second click retained the same 81.8955% clip value immediately before and after retargeting, and the subsequent samples advanced monotonically to the settled state. The retargeting probe can contain two commits in a frame because a click update and a tween update are separate events. This is not a claim that arbitrary ancestor updates are capped by `useTween`.

At 4x CPU, the final pooled React median/p95 is 16.7/16.7–16.8 ms on every transition, within 0.6% of Vue at worst. React has five intervals over 20 ms versus Vue's zero; four occur on 0→1. One 0→1 run has a 33.3 ms p95 with two slow intervals, and that run is included in the raw table. The fallback rule is applied to each transition's pooled five-run interval distribution, whose p95 remains 16.8 ms. No transition crosses the 20% threshold, so no refs fallback was built. This supports the declarative bridge for this 102-cell waffle, with the single-run outlier still visible.

The hook schedules no polling work of its own when fields are unchanged. Its pending ticker callback is removed on publication or the final unsubscribe. Both entrance and beat timelines are killed on unmount. Builders run in layout effects, after the child imperative handles exist. First render, inactive slides, non-slide render contexts, reduced/instant motion and jumps of more than one beat seek; adjacent active clicks tween. A rapid click kills the previous tween and starts from the visible timeline time, bounded by the next step's duration, matching the Vue rule.

## Canvas

The smallest CSS change was replacing `vw` with `cqw` and `vh` with `cqh` in the copied layout and story-frame CSS, and in the interview's inline maximum width. `SlideFrame` already establishes a size container. The old Slidev full-screen overrides and `transform: none !important` rules were omitted; applying them would bypass the adaptive canvas. The port maps `.slidev-layout` typography selectors to `[data-deck-slide]`.

Rule for the port: viewport-sized layout inside a slide uses the **logical canvas container**, through `cqw`/`cqh` or `--deck-w`/`--deck-h`. Fixed SVG scenes and their overlays share fitted frame units `--sw`/`--sh`; these derive from `min(100cqw, 177.7778cqh)` and `min(100cqh, 56.25cqw)`. Existing design-pixel SVG geometry stays unchanged. Raw browser `vw`/`vh` is reserved for elements intentionally outside the scaled slide.

| Window | Logical canvas | Canvas scale | Story frame on screen | Conventional slide |
| --- | --- | ---: | --- | --- |
| 1920×1080 | 1920×1080 | 1 | 1920×1080 at (0,0) | Baseline dimensions. |
| 1024×768, 4:3 | 1920×1440 | 0.5333333333333333 | 1024×576 at (0,96) | Fills 1024×768; more vertical breathing room; columns retain their design width. |
| 2560×1080, approximately 21:9 | 2560×1080 | 1 | 1920×1080 at (320,0) | Fills 2560×1080; columns, gaps and quote maximum width expand horizontally. |

The story composition remains fitted 16:9 and centered. The surrounding area has the same canvas background, so there are no visible letterbox bars. It does not stretch the SVG scene to occupy the extra area. Measured boxes for the headline, card, chip, quote, columns and footer remain within the viewport in all four resize checks. Visual inspection found no clipping or overlaps. Conventional type remains in design pixels/rem and is scaled once by the canvas; it consequently becomes smaller in screen pixels on the 1024px window.

### Canvas verdict

Use container units for slide layout and keep fixed story geometry in design units. The adaptive canvas worked for the two tested aspect ratios without a framework patch. `useFrameScale` should become a constant 1 for these fixed 1920-unit story frames, or be removed from these callers. Multiplying chart fonts or mark geometry by `useSlideScale()` would shrink them twice. A future fluid story frame would need a logical frame-width ratio, not `window.innerWidth / 1920`.

## Compat CSS

Only rules exercised by the interview and Tide slides are represented in `styles/compat.css`. Unused Slidev utilities, code styling, cover layouts, theme backgrounds, heading decorations and global full-screen rules were not imported.

| Rules in compat.css | Origin | What depends on them |
| --- | --- | --- |
| `box-sizing: border-box; border-width: 0; border-style: solid` on elements/pseudo-elements | `@unocss/reset/tailwind.css`, imported by `@slidev/client/styles/index.ts` | Card/quote/slide dimensions include padding and borders; pseudo-element bullet dimensions. |
| Root line-height 1.5, text-size-adjust 100%, tab-size 4; body margin 0 and inherited line-height | Same reset | Browser defaults and inherited inline arrow/footer rhythm. Text-size-adjust and tab-size were copied with the reset block; their effect was not separately isolated on desktop Chromium. |
| Zero heading/paragraph/list margins; inherited heading font size/weight; list reset | Same reset | Story card spacing and list placement. |
| Inherited link color/text decoration | Same reset | Source link's inherited decoration. |
| Block SVG display and middle vertical alignment | Same reset | Footer icon alignment and SVG line-box removal. |
| `h2` 1.875rem and 2.25rem line-height under the slide | `@slidev/client/styles/layouts-base.css` (`text-3xl`), also repeated by `slidev-theme-the-unnamed/styles/layout.css` | The interview heading is 30px, even though the kit's `.od-h2` requests 46.4px. The kit's more specific/important line-height remains 1.12. Story heading has a stronger selector and keeps its frame-unit size. |
| List-item left margin 1.1em, right margin/padding reset, base padding 0.2em and line-height 1.8em | `@slidev/client/styles/layouts-base.css`, LTR block | The inherited left margin survives; the kit's `.od-bullets li` overrides padding and line-height with 2rem and 1.6. Removing the margin shifts the interview bullets. |
| Dashed 1px link bottom border | `@slidev/client/styles/layouts-base.css` | The source link overrides it with a solid border. The React selector must recover the specificity previously supplied by Vue's scoped attribute. |
| Inherited link color on hover | `slidev-theme-the-unnamed/styles/layout.css` | Preserves the theme's hover rule. Its desktop settled-frame contribution was not isolated; the source-link component supplies its own more specific hover color. |

The defaults are intentionally scoped to the DOM contract where Slidev scoped them to `.slidev-layout`. The kit's existing `!important` typography declarations are retained, and Biome reports warnings about them; lint exits successfully. The specificity warning on the copied bullet modifiers is also retained.

### Compat CSS verdict

A small compatibility sheet is sufficient for these two slides, but its heading and list spacing are fragile dependencies on Slidev's cascade. Vue scoped styles also contribute specificity that a plain React class loses. Preserve that deliberately during the first port; then give the kit explicit typography and link rules before attempting to remove compat.css. This spike does not establish compatibility for the other Slidev layouts or the full unnamed theme.

## OpenChart

The probe renders SVG, with no canvas element at either viewport. The paths and text remain vector-sharp under the transform, with antialiasing at fractional pixel boundaries. There is no raster backing resolution to increase for this bar chart. The React `ChartProps` exposes a renderer choice (`auto`, `svg`, `canvas`, for point marks), but no pixel-ratio or transform-scale option. Export-scale options elsewhere in the package are not display-scale options. The public chart spec does expose `width` and `height`; a future wrapper could supply logical dimensions explicitly. That workaround was not installed or measured here.

| Load | Host logical size | Host screen size | SVG viewBox | SVG screen height |
| --- | --- | --- | --- | ---: |
| Cold 1920×1080 | 1701×877 (rounded client dimensions) | 1701.125×876.6875 | 1701.125×876.6875 | 876.6875 |
| Resize that chart to 1280×720 | 1701×877 | 1134.083374×584.458374 | Still 1701.125×876.6875 | 584.458374 |
| Cold/reload at 1280×720 | 1701×877 | 1134.083374×584.458374 | 1134.083374×584.458374 | 389.635406 |

The cold adapter reads `getBoundingClientRect()`, which returns screen dimensions. The generated SVG's pixel height is then scaled again by the deck, leaving unused vertical space and horizontal SVG fitting margins. Resizing only the outer transform leaves the logical host size unchanged, so the chart's ResizeObserver does not recompile it; the result depends on whether it first mounted before or after the resize. This is a chart sizing problem, not a blurry bitmap or a `useFrameScale` problem. The package's compiled dimension reader and ResizeObserver code support that explanation.

| Viewport | Mark and value | Pointer (screen px) | Settled tooltip top-left (screen px) | Result |
| --- | --- | --- | --- | --- |
| 1920×1080 | 2000, A, 4.4k | (377.643333, 807.025708) | (376.984375, 819) | Correct mark; approximately 12px below pointer. |
| 1920×1080 | 2010, A, 7.9k | (877.792358, 703.013086) | (876.984375, 715) | Correct mark; approximately 12px below pointer. |
| 1280×720 | 2000, A, 4.4k | (389.541855, 382.758557) | (388.989594, 390) | Correct mark; approximately 8px below pointer after scaling. |
| 1280×720 | 2010, A, 7.9k | (606.780151, 344.887988) | (605.989624, 352) | Correct mark; approximately 8px below pointer after scaling. |

Tooltip positions are measured after eight consecutive rAF samples with stable bounds, not the first nonzero rectangle. The tooltip animates its position; reading it immediately after moving to a second mark reports the old position in transit. At the center of an overlaid numeric label the hit target is `.oc-mark-label` and the tooltip did not appear in the initial probe, even at scale 1. The final probes move to 25% of the bar width and 40% of its height so the actual rect receives the hover. This still uses real Playwright mouse moves and tests two different marks at each size.

The synthetic grouped-by-color spec defaults to stacked bars. Its last stack also reaches beyond the automatically chosen plot domain and is clipped by the chart's plot clip. That was observed, not fixed or used as a source-data claim; the hover measurements use the first two years. This spike does not diagnose the engine's stacked-domain behavior.

### OpenChart verdict

SVG sharpness and settled tooltip pointer mapping pass for the two measured marks at both scales. Default sizing does not pass: a chart mounted cold under a 2/3 CSS transform uses screen dimensions and then scales its height again, while a chart mounted at scale 1 and resized behaves differently. The React kit needs an explicit logical-size policy for OpenChart before treating the adapter as canvas-compatible. A display pixel-ratio option would not fix this SVG geometry issue.

## Port cost

Counts include comments and blank lines and use the final formatted files. Vue SFC counts include their CSS; React CSS is counted separately, so component-only reductions are not like-for-like savings. Several components deliberately implement only the exercised props. These are source-size observations, not timed estimates for a complete addon port.

| React file(s) | Vue/source lines | React lines | Mechanical work and decisions |
| --- | ---: | ---: | --- |
| `slides/01-interview.mdx` | 32 | 30 | HTML to JSX; inline styles to objects; `vw` maximum width to `cqw`. |
| `slides/02-two-a-day.mdx` | 5 | 6 | Frontmatter and the stage invocation. |
| `slides/03-waffle.mdx` | 16 | 6 | Frontmatter and stage invocation; unused hover notes omitted. |
| `slides/04-chart.mdx`, `components/ChartProbe.tsx` | 29 for the source slide, 95 for the generic Vue wrapper | 5 + 37 | Synthetic chart instantiated from the printed schema; this is not a direct component-equivalent comparison. |
| `components/TideDayStage.tsx` | 120 | 114 | Mostly geometry and JSX. Child-ref lifetime, local tween ownership and profiler placement needed thought. |
| `components/WaffleStage.tsx` | 337 | 227 | Same fields, durations, ripple math, ordering and legend. Hover card, target buttons and embed navigation deliberately omitted. |
| `components/StoryStage.tsx` (also exports StoryLayer) | 260 + 24 | 110 | Slots to props; layout-effect entrance; instance-local filter IDs. Cross-slide transitions omitted. Its CSS is another 54 lines. |
| `components/StoryCard.tsx` (also exports StoryLink) | 92 + 48 | 63 | Slots to children/props and ref-driven rise. Outgoing overlap/height easing omitted. Its two CSS files add 19 + 13 lines. |
| `components/InkLine.tsx` | 381 | 53 | Pure clean-path geometry, useTween draw field and imperative addDraw. Unused variants and handles omitted. Clip rule is in index.css. |
| `components/InkRule.tsx` | 107 | 46 | DOM ref and imperative addDraw; GSAP still writes the clip CSS variable directly, as Vue does. |
| `components/InkChip.tsx` | 132 | 30 | Style derivation to render; only the left, unlinked, narrow variant. Its CSS adds 65 lines. |
| `components/UnitGrid.tsx` | 428 | 58 | Clean square variant, hashed reveal and color interpolation only. Parent rendering replaces Vue's cached computed cell descriptors. |
| `components/InkPing.tsx` | 165 | 50 | Beacon envelope/echo math to JSX; only 54×54 rect targets. |
| `components/OdFooter.tsx` | 49, plus 194 in OdLogo | 17 | Footer styles copied separately (20 lines); original page label frozen; simplified static logo. |
| `story/stage.ts` | 42 stage + 101 entrance + 17 copy + 39 scripted-demo | 53 | Same composition using useSlide; render-time clamped copy and separate entrance/beat lifetimes. No keyed remount is needed for the pure grid. |
| `story/timeline.ts` | 156 | 61 | Watcher to layout effects; seek/tween policy and interruption-duration cap retained. Unused resolvePosition/return handles omitted. |
| `story/use-tween.ts` | Vue's built-in reactive subscription; no equivalent source file | 49 | New bridge. Scheduling required the measured correction to a GSAP ticker publication. |
| `story/easings.ts` | 75 | 69 | Curves/durations copied; registration errors now propagate instead of silently falling back. |
| `story/hash.ts` | 77 | 79 | Copied; explicit missing-entry error for strict indexed access. |
| `story/grid.ts` | 55 | 55 | Pure module copied; only Point import changes. |
| `story/ripple.ts` | 68 | 69 | Pure module copied, import location and formatter changes. |
| `story/geometry.ts` | 102 scales + 42 style | 17 | Only the exercised linear projection, clamp and rounded polyline path; unused d3 axis/label helpers omitted. |
| `story/ink.ts` | 62 ramps | 6 | Read resolved JSON theme; only the exercised hue lookup. Unused contrast helpers omitted. |
| `story/boston-days.ts` | 33 | 33 | Data copied unchanged. |
| `story/tide-labels.json` | 95 boston-month + 35 moon-clock | 5 | Used the source modules to evaluate the three exported labels once; no unused month geometry in the spike. |
| `story/07-waffle.ts`, `story/campuses.ts` | 85 + 91 | 105 + 111 | Data derivation copied, then formatted. |
| `story/07-waffle-campuses.json` | Same 122 campus records | 5,280 serialized lines | Source snapshot copied; JSON formatting is not port effort. |
| `story/theme.json`, `styles/theme.css` | 96-line default JSON and theme resolver output | 96 + 50 | Resolved the existing default theme once; no new theme system. |
| `story/ax-theme.json` | 10 | 10 | Original footer brand source copied. |
| `styles/base.css` | 96 | 82 | Removed Slidev full-screen overrides; replaced layout selector with DOM-contract selector. |
| `styles/layout.css` | 165 | 177 | `vw`/`vh` to container units; formatter accounts for line-count growth. |
| `styles/components.css` | 224 | 224 | Global `od-*` rules copied. |
| `styles/story-frame.css` | 385 | 176 | Container units; cross-slide transition styles omitted. |
| `styles/story-marks.css` | 115 | 115 | Card surfaces and labels copied. |
| `styles/interview.css` | Loop rules within the source deck stylesheet | 24 | Only the three loop-node/arrow rules. |
| `styles/waffle.css` | Scoped rules within the 337-line WaffleStage | 44 | Only the legend rules; hover-target styling omitted. |

New measurement-only files have no Vue component counterpart: `story/measure.ts` (27 lines), the two CSS declaration files (9 + 1), and `scripts/browser.mjs`, `scripts/snapshots.mjs`, `scripts/frame-time.mjs`, `scripts/qa.mjs`. `styles/compat.css` (63 lines) and `styles/index.css` (43 lines) are integration glue. The copied normal Inter WOFF2 is the same font asset used by the source. No new component abstraction is inferred from these counts.

| Vue idiom | React replacement used |
| --- | --- |
| `reactive({ ...numericFields })` | Stable Proxy object from `useTween`, versioned through `useSyncExternalStore`. |
| `computed` deriving SVG/styles from numeric state | Render calculations; static domain/tick geometry at module scope. The hot mark remains declarative. |
| Template component refs plus `defineExpose` | React 19 ref props, `useRef`, `useImperativeHandle`. Parent builders run in layout effects. |
| `onMounted` and effect-scope disposal | `useLayoutEffect` with timeline/tween cleanup. |
| Click/activity watchers | Effects keyed by `useSlide()` clicks/activity/context. Click state stays in the runtime store. |
| Named `stage`/`overlay`/`card` slots | ReactNode props for stage/overlay and children for the card. |
| `v-for`/`v-if`/`v-show` | Keyed `.map`, conditional JSX and numeric opacity. |
| `<Transition>` with entering/leaving copies and eased height | Incoming copy rise/fade in a layout effect. The outgoing overlap and measured-height handoff are not ported; settled frames match. |
| Scoped CSS and `:deep` | Explicit global `od-*` selectors, with restored specificity where the source attribute mattered. |
| Document-wide filter injection | Per-stage `useId()` SVG filter definition and an inherited filter URL; multiple instances do not share a global ID. |
| Slidev nav/footer count | Frozen source footer label for this parity fixture. |

## Framework gaps

No runtime patch or private API was required. Public `useSlide()` supplies clicks, activity and render context, child imperative refs exist by the parent layout effect, and `SlideFrame` supplies a size container and the documented CSS variables. `@gsap/react` is installed but unnecessary for these explicit layout-effect lifetimes; no unstable React or GSAP API is imported.

The motion package does not yet provide these hooks, as expected before the kit port. This spike keeps them in `story/`. It exposes a local `window.__spike.settled()` and profiler records because there is no public runtime motion-settlement surface in the current implementation. This is measurement instrumentation, not a proposed second deck store.

The concrete integration issue found is in the chart adapter's use of screen dimensions. In the future kit's OpenChart wrapper I would measure the host's logical `clientWidth`/`clientHeight` with ResizeObserver and pass those as the public spec's `width`/`height`, testing both cold mounts and transform-only resizes. This requires no change to SlideFrame's canvas math. No orchestrator-owned edit is required to run this spike.

## QA as the first user

- Slide 2 walked `0 → 1 → 2 → 1 → 0`: the line clip changed from 100% to 0%, the three dots and chip reached opacity 1 at click 2, reversed to opacity 0 at click 1, and the line erased at click 0. Card copy followed each click.
- Two quick ArrowRight presses on slide 3 landed at click 2 with “Burnet and Webb crossed.” No intermediate replay from zero was observed.
- A real reload of `#/3?clicks=2` showed all 102 cells at full reveal in the first measured visible frame; the settled frame had no ping rings and the click-2 card. Two initial profiler commits handled mount and the seek notification, with no entrance sweep from zero.
- Both requested resizes on slides 1 and 2 produced in-bounds measured boxes and visually clear layouts, with the uniform background filling the extra space.
- A chart rect on slide 4 at 1280×720 showed its correct value in a tooltip beside the pointer after its position transition settled. The chart's cold-load sizing defect is described above.

## Not done or not verified

- This is not a complete component port. Marker brushes, sheet/scatter/collapse UnitGrid variants, cross-slide view transitions, campus hover cards and embed navigation were not ported. No fallback mark was built because no pooled 4x transition crossed the specified threshold.
- StoryCard's outgoing-copy overlap and height easing are omitted. Its settled appearance and incoming rise/fade were exercised; full transient card parity was not measured.
- The footer logo is simplified and static. Its remaining 127 pixels differ intentionally and are not masked.
- The chart data is synthetic because the referenced slide supplies no data or rendered chart. The engine's stacked-domain clipping was observed but not diagnosed. Dense canvas scatter backing resolution was not tested.
- Non-slide render contexts and instant/reduced-motion paths are implemented in the hook policy but were not mounted and browser-verified here. The currently available viewer does not provide all five contexts as working views.
- No cross-browser, headed, GPU-trace, memory, production-build performance, or other-machine comparison was performed. rAF intervals are scheduling measurements, not direct paint or GPU time.
- The results apply to the 102-cell waffle and the tested line. They do not establish a safe cell-count ceiling for every kit mark.

## Checks

| Command | Result |
| --- | --- |
| `bun run --cwd react-decks decks dev spike --port 4310` | Served all four slides. The measurement commands also started independent servers on free ports successfully. No React console/page errors in the snapshot or QA runs. |
| `node react-decks/examples/spike/scripts/snapshots.mjs` | Passed. All four frames below 0.002; three exact matches, one 127-pixel logo difference. |
| `node react-decks/examples/spike/scripts/frame-time.mjs` | Completed 120 recorded transitions: 2 frameworks × 2 throttle levels × 5 runs × 6 transitions. No pooled 4x regression over 20%. Twelve existing Vue wake-lock errors recorded; zero React errors. The final serialization-only writer change was checked by rewriting the saved full measurement payload through that function. |
| `node react-decks/examples/spike/scripts/qa.mjs` | Completed the forward/back walk, uninterrupted and retargeted line probes, rapid waffle navigation, real click-2 reload, four resize cases and four settled chart hovers. Zero console/page errors. Chart cold-size defect recorded. |
| `bun run --cwd react-decks lint` | Passed with 29 warnings: copied compatibility/kit CSS warnings and large measurement-file warnings. |
| `bun run --cwd react-decks typecheck` | Passed all three TypeScript projects. |
| `bun run --cwd react-decks check` | Passed: lint, typecheck, 18 test files / 500 tests, and 24 Chromium E2E tests. Expected compile-failure fixtures log Vite errors while testing recovery; those tests pass. |
| `bun run --cwd react-decks decks build spike` | Passed. Vite warned about the 1,419.43 kB main chunk, which includes the chart adapter; no size optimization was attempted. |

Initial typechecking caught the missing copied campus JSON and the chart CSS import declaration; both were supplied inside the spike. The first gate run after generating measurements failed on JSON formatting, then passed after the output writer was corrected. No gate requirement was removed, no shared configuration was changed, and no new tests were added beyond the requested measurement scripts.

## Orchestrator addendum: OpenChart sizing fix, measured

OpenChart reads `container.getBoundingClientRect()` for its dimensions and has no size
override, so under the scaled canvas it compiles at screen size and is then scaled again.
Counter-scaling the chart's host (`width` and `height` of `scale * 100%`,
`transform: scale(1 / scale)`, origin top left, with `scale` from `useSlideScale()`) makes
the host's layout size equal its screen size. `scripts/chart-fix.mjs` measures it:

| Load | Host on screen | SVG on screen | After resizing to 1600x900 |
| --- | --- | --- | --- |
| Cold 1920x1080 | 1701.1 x 876.7 | 1701.1 x 876.7 | 1417.6 x 730.5, fills host |
| Cold 1280x720 | 1134.1 x 584.5 | 1134.1 x 584.5 | 1417.6 x 730.5, fills host |
| Cold 1024x768 | 907.3 x 642.7 | 907.3 x 642.7 | 1417.6 x 730.5, fills host |

The chart then draws 1:1 in screen pixels, so a canvas renderer is sharp too, its
ResizeObserver fires on window resizes, and font sizes in a spec are screen pixels: they are
multiplied by `useSlideScale()`, which is what `useFrameScale` does in the Slidev decks.
