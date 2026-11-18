# Charts on slides

## Setup and size

Import `OpenChart`, `slideChartTheme`, `scaleChartTheme`, `slideChartAnimation`, `useFrameScale`, `ink` and `theme` from `@steamfield/decks/kit`. Install the theme in `setup.ts` and import the kit stylesheet before deck CSS. `OpenChart` takes `spec`, optional `onMarkHover` and `onMarkLeave`; it accepts chart or layer specs.

Give the host a definite size or a flex-fill region with `min-height: 0`. A chart should fill most of a chart slide's free area, not sit in a small decorative card. Avoid duplicate titles in the stage headline and chart chrome.

The wrapper counter-scales its host, so OpenChart draws at screen size. Its theme sizes therefore need `scaleChartTheme(slideChartTheme, useFrameScale())`. Recompute the spec when scale changes, normally with React `useMemo`; do not multiply ordinary HTML or SVG sizes by this scale.

The slide theme's design-size defaults are title 30, subtitle 22, body 21, small 18 and axis ticks 20. These are a starting point; increase text or reduce complexity when the actual chart host makes them unreadable. Explicit annotation/data-label font sizes and offsets are screen pixels too; scale authored design-size overrides rather than scaling the chart host again. Theme scaling does not traverse arbitrary spec fields.

Use the shared `slideChartAnimation`, not raw timing numbers per spec. The wrapper enables chart animation only for eligible live slide arrivals at click 0; other contexts, instant motion and later-click arrivals settle. Do not wrap it in a second decorative entrance.

## ChartSteps

Use `ChartSteps` when the speaker can explain one change per click. Import it from `@steamfield/decks/kit` and pass an ordered array of chart or layer specs. With `<ChartSteps specs={series} at={2} />`, clicks 0 and 1 show `series[0]`, click 2 shows `series[1]`, and click 3 shows `series[2]`. The last spec stays visible on later clicks.

Keep the mark type and the fields and types of the x, y, color and key encodings the same across specs. Give each datum a stable identity so the audience can follow its mark. Keep a common quantitative domain when bar lengths need to be comparable.

An inline array such as `specs={[first, second, third]}` contributes `at + specs.length - 2` to the slide's maximum click. For an imported or computed array, set `clicks` in the slide frontmatter. That value covers every step on the slide.

One click forward or back on the live slide requests OpenChart’s update animation. Bars, lines and points support it. Some marks, including ticks, always snap. A jump, instant motion, presenter, preview, overview and print show the target immediately. OpenChart also snaps during an entrance, under reduced motion, or when scale types or transforms change. For SVG, its default limit is 500 marks in either layout. Canvas points have a higher default, and an authored `animation.update.maxMarks` overrides the cap. Switching to reduced motion during a running tween can let it finish. Subsequent steps respect the preference.

## Theme and color

Start from `scaleChartTheme(slideChartTheme, scale)`. Spread nested overrides so you preserve fonts, spacing and chrome. Colors must be resolved JavaScript strings from `ink()` or `theme()`, never CSS variables or hex literals in specs. Set categorical colors through the theme, with stable assignments across related charts.

For one highlighted series, use its hue and neutral context series. For conditional color, a `condition` uses the documented field predicate and resolved token colors. Prefer `mark.fill` for a constant color; check the installed types before using value-only channel shorthand.

## Axes and honest domains

- Specify quantitative domains deliberately, including both scatter axes. Include zero for bars and area magnitude. For lines and scatter a tighter domain is acceptable if the visible scale makes its extent clear. Preserve comparable domains across beats and small multiples unless a change is explicit.
- Include source-relevant extremes and uncertainty. Give bubbles enough space for their radii. Do not set the ceiling to the point center and clip the mark.
- Use `sort: null` on a categorical channel to preserve supplied order; sort the rows explicitly when ranking. Check the rendered top-to-bottom order instead of assuming it.
- Give ticks their units. Use `.1f%` for values already expressed as percent and `.1%` for fractions. Keep label and axis formats consistent. Use enough intermediate ticks to read values without visual clutter.
- Use restrained gridlines, readable theme text and short axis titles. Never remove a necessary scale merely for a cleaner screenshot.

## Marks, annotations and chrome

Use a line with points when individual observations matter; a design stroke around 2.5 units is a useful starting point. Dense observations may need aggregation, not hundreds of dots. Bars should carry readable values where the precision matters. Lines do not gain per-point text labels through `labels.density`; use annotations or endpoint labels.

Keep at most a couple of text callouts. Reference lines are better for repeated thresholds. Anchor a text annotation in data coordinates and offset its text into empty space. Show uncertainty and projected status, using dashed estimates with the same semantic hue as observed values.

Chart chrome carries a finding, a short scope/method subtitle when needed, and source attribution. An eyebrow is optional and must add information. A story headline or external source line can do that job instead; avoid two competing header stacks.

Put legends at the top when used. Prefer clear direct or endpoint labels where they fit. Never turn off both legend and endpoint labels for multiple series unless another visible key identifies each one. Hover-only information is unavailable to most of the room and to PDF readers.

## Inspect and verify

Inspect the built chart in the slide, not only in an isolated chart preview. Check the smallest presenter/preview frame, projection size, 4:3 and 21:9 windows, instant mode and PDF. Look for cropped legends, tiny ticks, source clipping, colliding annotations, insufficient contrast and missing values silently connected.

Walk all click states if the data, domain or highlighted series changes. Recompute claims from data rather than inferring them from pixel geometry. Finish with the fact-check in `decks:deck-data`, tracing every plotted row and annotation to `data-sources.md`.
