# Annotations and labels

Adapted from the OpenChart annotations, line and typography references identified in [VENDORED.md](VENDORED.md). Read `Annotation`, `TextAnnotation`, `RangeAnnotation`, `RefLineAnnotation` and `EndpointLabelsConfig` from the installed declarations.

Use `type: "text"`, `"range"` or `"refline"`. The old `"rule"` annotation name is invalid. A text callout puts its copy in `text`; `label` is for ranges and reference lines.

## Callouts

Anchor `x` and `y` in actual data coordinates. Move the text with `offset`, not by falsifying the anchor. With neither anchor nor offset the engine searches for a position; an explicit anchor or offset pins placement. Check the actual render, especially when several labels compete in one area.

Prefer zero to two text callouts. A supporting `subtitle` can hold a short qualifier. Use `connector` to preserve the connection to the point when the label is moved into clear space. Bubble plots need enough offset to clear neighboring radii, not just their centers. Automatic collision handling is not a guarantee of legibility.

Use the slide-scaled typography described in [presentation.md](presentation.md). Arbitrary annotation font sizes and offsets are not automatically changed by `scaleChartTheme`. Do not place a tiny web-sized label on a full slide and assume the wrapper enlarges it.

## Ranges and thresholds

A range uses `x1`/`x2`, `y1`/`y2`, or both pairs. Keep its fill subdued and theme-derived so data stays legible. Explain what the band means. Range boundaries need the same source precision as data points.

A reference line uses x or y and a short label. Dashed style can distinguish a target from an observation. Multiple events should not create a fence of overlapping labels. The public `labelPlacement` options include `start`, `end`, `outside`; inspect fallback placement when room is tight.

## Identify series and values

Endpoint labels can replace a legend for line/area series when names fit. `endpointLabels` accepts a boolean or config; common config keys are `ends`, `content`, `showMarker`, `width`, `format`. Check installed enums rather than inventing content strings. Never disable every visible series key.

For bars, keep `labels.format` aligned with the quantitative axis. For line/area values that matter to the claim, use sourced annotations or endpoint values. A tooltip and crosshair are optional interactive aids; the exported slide must stand on its own.

Write a finding in chart titles and short factual callouts. Give the population, time period and units once in the right place. Use sentence case, tabular numerals and a clear size hierarchy. Shorten or split dense labels instead of lowering type below presentation readability.
