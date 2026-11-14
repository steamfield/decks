# Encodings and formats

Adapted from the OpenChart encoding and format references identified in [VENDORED.md](VENDORED.md). Read installed `ChartSpec`, `LayerSpec`, `MarkDef`, `Encoding` and `EncodingChannel` declarations for complete shapes.

## Spec shape

Charts use `mark`, commonly a string or `{ type: ... }`, plus `data` and `encoding`. `type: "line"` is not a chart discriminant. Non-chart visualization families use their own `type` and renderer. Do not pass host options such as dark mode or renderer selection inside a chart spec.

Map real numeric fields as `quantitative`, dates as `temporal`, unordered categories as `nominal`, and ordered categories as `ordinal`. `field` must match the data exactly. Use the channel's audience-facing `title` instead of showing an internal column name. Add `color` for series identity; grouping without color uses `detail` where supported.

`scale.domain` sets explicit bounds. `scale.zero` controls inclusion of zero. For a precise temporal window, `nice: false` prevents a rounded domain from adding unrelated time. `sort: null` preserves categorical order; ascending/descending category sort is lexical, not a value ranking. Order rows yourself for ranked bars and check the render.

`bin`, `timeUnit` and `aggregate` can express documented transforms on channels. Keep statistical definitions and aggregation rules in the source record. A transform is not a substitute for preserving where the input rows came from.

## Stacking

| Mark | When colored |
| --- | --- |
| Bar | Stacked by default; `stack: null` on the quantitative channel gives grouped comparisons |
| Area | Stacked by default; `stack: null` on y gives overlap |
| Line | Does not stack |

Use `stack: "normalize"` for shares, producing a 0-to-1 domain. Use `"zero"` for cumulative totals. Never leave stacking to defaults when it changes the meaning of the comparison.

## Color channels

For a constant fill, prefer `mark.fill`, resolved through the Decks theme. Installed versions that export `ValueDef` also accept a bare `encoding.color: { value: ... }` and expand it to a mark property. A field-based channel maps data; a conditional channel uses `condition.test` with a field predicate and `condition.value`, plus a fallback `value`. Read the installed channel and condition types before authoring them.

## Formatting

OpenChart supports d3-format strings plus a literal suffix extension. These are format demonstrations, not source data:

| Format | Meaning |
| --- | --- |
| `.1f` | One decimal place |
| `.1f%` | One decimal plus literal percent sign; use for values already in percent units |
| `.1%` | Multiply a fraction by 100 and show percent |
| `$,.0f` | Currency with comma groups and no decimals |
| `,.0f` | Count with comma groups |
| `~s` | SI suffix for large values |

Use matching `axis.format` and `labels.format`. State the units even if no tooltip is available. Do not round the underlying data merely to make labels shorter. For normalized stacks use fractional-percent formatting, not the percent-unit suffix form.

`axis.tickCount` is a suggestion, not an exact count. Use enough intermediate ticks to make the scale readable. Log axes need fewer subdivisions and a stated rationale. A short unit-bearing tick can make a redundant unit in the axis title unnecessary.
