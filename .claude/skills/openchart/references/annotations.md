# Annotations

Annotations are the editorial layer on top of data visualizations. They highlight insights, call out outliers, and provide context. Supported on charts and graphs.

The `Annotation` type is a discriminated union on `type` (`'text' | 'range' | 'refline'`). For the full per-variant shape (every field, every default), load `Annotation`, `TextAnnotation`, `RangeAnnotation`, `RefLineAnnotation`, and `AnnotationDot` from `index.d.ts`. This file covers the *behavior* the types don't describe — anchoring, collision resolution, what specific fields actually do at render time, and which combinations are gotchas.

> Use `type: 'refline'`. The old `'rule'` alias fails validation in v9 (`migrateSpecV8` rewrites stored specs). `label` belongs only to `range` and `refline`; on a `text` annotation it is a validation error, so put callout copy in `text` and supporting copy in `subtitle`.

## Text Annotation — behavior worth knowing

**`x` / `y` are data coordinates.** They resolve to pixels through the same scales as data marks, so annotations stay stable across responsive resizes. Always set them to the actual data point you're annotating; use `offset` to push the label into clear space.

**`text` supports `\n`** for hard line breaks and **`**bold**` spans** for inline emphasis: `"Inflation peaked at **8.5%**"`. Emphasis belongs on the key phrase, not the whole block — that's the NYT/Datawrapper voice. Only matched pairs turn bold; an unmatched `**` renders literally. Bold spans work in `subtitle` too.

**Text is never center-aligned.** Lines align on the edge facing the data point: left-aligned (ragged right) by default, right-aligned when `anchor: 'left'` puts the block to the left of the point. That's about how the lines sit against each other, not where the block lands: a `top`/`bottom` anchored block still straddles its data point horizontally, so "above" means above. Don't hand-compute a negative `dx` to re-center it — the engine already does.

**`subtitle`** renders a muted second-tone line below `text`. Use for "(methodology note)" or a source citation that belongs with the callout. Multi-line `text` still produces a multi-line primary block; `subtitle` is a separate block underneath.

**Weight:** the primary `text` is regular (400) even when a `subtitle` is present. For the "Feb. 25 / 2015 maximum" bold-lede stack, set `fontWeight: 700`; otherwise put emphasis on the key phrase with `**bold**`. The subtitle renders at `round(fontSize * 12 / 13)` (override with `subtitleFontSize`).

**Wrapping:** callouts wrap at `min(240, plot width - 2 * padding)` px by default. Set `maxWidth` to a number to change it, or `maxWidth: null` to disable wrapping limits.

**`dot`** draws an open-ring marker on the data point itself. You get one **by default** whenever a connector is enabled and carries no arrowhead — straight leaders and drop-lines included. An arrowed connector gets no marker unless you ask for one (the arrowhead already marks the spot). `dot: false` gives a bare label; an explicit `dot` always wins. Default style: the resolved surface fill (opaque, so the ring covers the line), stroke matching the connector, radius 4, strokeWidth 1.5. A default dot that lands on a line's endpoint marker takes the marker's colors, so the point draws one ring. Pass an `AnnotationDot` object to override any of those.

**`anchor`** is the direction the label sits relative to the data point: `'top' | 'bottom' | 'left' | 'right' | 'auto'`. With no `offset` and no anchor (or `'auto'`), the engine runs a placement search: it scores candidate positions against marks, other labels, the legend, and the chrome, and penalizes connector crossings, placing higher-`priority` annotations first (ties by source order). An explicit `anchor` or any `offset` (even `{ dx: 0, dy: 0 }`) pins the label: an explicit anchor puts it 28px off the point in that direction, then `offset` adds to that. With an `offset` but no explicit direction, the base position is above-right of a point in the lower half of the plot, below-right in the upper half.

**`connector`** is `boolean | 'straight' | 'curve' | 'drop-line'` (or `{ type, arrow? }` for explicit arrow control):

- `true` / `'straight'`: straight line from label to anchor point, no arrowhead. Gray hairline.
- `'curve'`: single quadratic arc in the label's text ink, shaped to the data point and shortened along its end tangent so the tail aims at the marker. No arrowhead by default; use `{ type: 'curve', arrow: true }` for one (then no default dot). This is the emphasis voice — use it for the one callout that carries the story.
- `'drop-line'`: vertical line through the data point's x; label sits beside the line and auto-flips to the opposite side if it would overflow the chart area. **Caveat:** the auto-flip only checks against the chart edge — it does not avoid neighboring marks or other annotations. Place these in clear regions.
- `false`: no connector.

The connector leaves the text block (primary text plus subtitle, as one box) on the side facing the data point, with a 6px standoff, and stops short of the marker at the other end. **Short connectors are dropped:** a leader under 8px, or one whose data point sits inside the text block, is suppressed and only the marker renders. A plain `{ type: 'text' }` with no `offset` sits 28px off the point, so it draws a ring *and* a real leader with zero authoring — you only lose the line by pulling the label back onto its own marker.

**`halo`** is on by default — it paints a stroke halo behind the text in the resolved surface color (the theme background, or the light/dark page color when the theme background is transparent), knocking out chart lines that pass behind. Data labels drawn outside their bar get the same halo, and reflines and ranges render under data labels, so a value label crossing an average rule stays legible. Set `halo: false` when the annotation text is white or light-colored sitting on a colored background (the halo would make the text invisible). Use `background` instead for an explicit rect.

**`responsive`** defaults to `true`, which makes the annotation subject to compact-width thinning. Below 400px container width (the outer width, including facets) at most `responsive.compactAnnotationLimit` text callouts stay inline (default 1; `null` removes the limit), and the rest become numbered notes below the chart. `responsive: false` keeps an annotation inline and outside that count. Below 200px height, annotations are tooltip-only regardless.

**Series-anchored text annotations:** When a text annotation's `(x, y)` lands on a colored series and the user toggles that series off via the legend, the annotation is suppressed (it would drift onto a different scale). It comes back when the series is re-shown. Range and refline annotations pass through legend toggles unchanged because they anchor to constant axis values, not series.

**Tips:**
- Use `\n` in `text` for multi-line annotations and `**bold**` for the key phrase inside a sentence
- Text annotations get a paint-order stroke halo by default (in the resolved surface color, so it works on the default transparent theme too) that knocks out chart lines behind the text without needing an explicit background rect
- Hand-placed callouts (explicit `offset`) are still clamped below the title/subtitle block, and auto-placed ones treat that block as an obstacle, so a callout never climbs into the chrome at narrow widths
- Set `halo: false` when the annotation text is white or light-colored and sits on a colored element -- the halo would make the text invisible. Use `background` instead for an explicit rect.
- Set `background` to `true` (theme surface, follows light/dark) or a color string for an explicit background rect instead of the default halo
- `connector` defaults to `true` (straight gray leader from label to point, with an open-ring marker on the point)
- `"curve"` connector draws a single arc in the label's ink (add `arrow: true` via the object form for an arrowhead) — reserve it for the one callout that carries the story
- Omitting `anchor` and `offset` lets the engine search for a position (see details below)
- `responsive: false` keeps the annotation inline at compact breakpoints (< 400px); otherwise only the first eligible callout stays inline there and the rest become notes.

## Placement on Dense or Bubble Charts

Scatter/bubble charts create unique annotation challenges because circles are large and clustered. Small offsets (10-20px) almost always land on top of nearby dots. Follow these rules:

**Use large offsets.** On bubble charts, `offset: { dy: -50 }` or more is normal. Think of the annotation as living in the empty quadrant of the chart, not next to its data point. The connector line handles the visual link back.

**Anchor at the data point, offset into empty space.** Always set `x`/`y` to the actual data coordinates so the connector points to the right dot. Then use `offset` to push the text into a clear zone. Don't move the `x`/`y` anchor to approximate the label position (this disconnects the connector from the data).

**Scan for empty quadrants.** Before placing annotations, identify the chart's empty zones. Scatter plots typically have open corners (upper-left for low-x/high-y, lower-right for high-x/low-y). Place labels there with connectors back to their data points.

**Budget for bubble radius.** A dot with 13,000 enrollment and a dot with 400 enrollment have very different radii. The label for the larger dot needs to clear a bigger circle. When in doubt, overshoot the offset and let the connector do the work.

| Mistake | Fix |
| --- | --- |
| Small offset lands on adjacent dots | Use 40-100px offsets into empty chart regions |
| Annotation near chart edge gets clipped | Pull label inward with negative dx or dy |
| Anchor set to approximate position, not data point | Set x/y to actual data coords; use offset for visual position |
| Label in lower-left corner colliding with axes | Move to upper-left or use larger dy to clear axis labels |

## How the Engine Handles Placement

Understanding what the engine does (and doesn't do) helps you write annotations that render correctly on the first try.

**What the engine does automatically:**
- Resolves annotation `x`/`y` data coordinates to pixel positions via the same d3 scales used for data points
- Nudges text annotations away from obstacle rects (legend bounds, band-scale mark bounds) so annotations don't land on the legend
- Resolves annotation-to-annotation collisions using a greedy algorithm: if two text annotations overlap, the second one is repositioned to the nearest non-colliding spot (below, above, left, or right)
- Rebuilds connectors after any nudge, clamp, or auto-placement so they still exit the text block on the side facing the point (the subtitle moves with its label, and the connector re-derives from the data point, not from its previous pulled-back end)
- Suppresses a connector that would be shorter than 8px or would have to cross its own label
- Demotes crowded callouts to numbered notes at narrow widths (thinning), and keeps at most one eligible inline callout below 400px (see `responsive` above). Labels that sit in the chart margin — above a peak, below a trough — are fine; only labels escaping the chart entirely get demoted. Note numbers are the source-order ordinal of the text annotation and stay stable when other notes hide, so gaps are normal.
- Grows the figure by the note band unless `chromeLayout: 'subtract'` is set (see [responsive.md](responsive.md)).

**Practical limits of automatic placement:** The search works best when annotations target different areas of the chart. If all annotations cluster in the same region, labels can land in awkward positions. Use `priority` to say which callout gets the best spot, and pin the rest with `anchor` + `offset` when the result matters.

## Estimating Annotation Size

These rough estimates help you reason about whether annotations will fit. They match the engine's internal text measurement.

- **Text width:** `characters * fontSize * 0.55` (default fontSize is 13). A 20-character annotation is roughly `20 * 13 * 0.55 = 143px`. Bold text (fontWeight 700, including `**bold**` spans) adds ~8% width.
- **Text height:** `lines * fontSize * 1.3`. A single line at 13px = ~17px tall.
- **Multi-line text** (`\n`): the widest line determines bounding box width. With `anchor: 'top'`/`'bottom'` the block is centered on the data point; with `anchor: 'left'`/`'right'` it hangs off the facing edge.
- **`subtitle`:** adds another block underneath at 12/13 of the primary font size, plus a 2px gap.
- **Wrap width:** text wraps at `maxWidth` (default `min(240, plot width - 2 * padding)`), so long callouts grow taller, not wider.

These are heuristic estimates. The engine can't know the precise rendered width without a real font metric context. When placement is critical (scatter/bubble with multiple annotations), use the `playwright-cli` skill to screenshot and verify.

## Practical Rules for Multiple Annotations

- **Prefer 0-2 text annotations per chart.** Use reflines with labels for additional callouts. Refline labels are simpler and less collision-prone.
- When using 2+ text annotations, aim for different areas of the chart. The engine auto-resolves collisions, but good initial separation produces cleaner results.
- With 2+ text annotations, either leave placement automatic and set `priority`, or pin each one with explicit `anchor` + `offset`.
- For scatter/bubble charts, use 40-100px offsets to push labels into empty quadrants, with connectors back to data points.

## Range Annotation — behavior worth knowing

`RangeAnnotation` (`type: 'range'`) highlights a region. Field shape: `RangeAnnotation` in `index.d.ts`. Behavioral notes:

- **Shape choice:** Set only `x1`/`x2` for a vertical band, only `y1`/`y2` for a horizontal band, all four for a rectangle.
- **Fill and opacity:** The default fill is yellow (`#f0c040`) at 0.15 opacity. Keep opacity low (0.1–0.2) so the data inside the band stays readable. The label uses the theme `small` size unless you set `fontSize`.
- **Label centering:** `labelAnchor: 'top' | 'bottom' | 'auto'` centers the label horizontally over the range. `'left'` (default) and `'right'` position the label at the corresponding edge.
- **Ordinal axis limitation:** Range annotations on ordinal x-axes may merge into one continuous band when multiple ranges are specified — ordinal scales position values at discrete band slots, not on a continuous number line, so two separate ranges (e.g. `2008–2010` and `2020–2022`) can render as one solid band spanning the full interval. For visually distinct shaded bands, switch the x-axis to `type: "temporal"` with `axis: { format: "%Y" }`. Range annotations work most reliably on temporal and quantitative axes.

## Reference Line — behavior worth knowing

`RefLineAnnotation` (`type: 'refline'`) draws a horizontal or vertical threshold line. Field shape: `RefLineAnnotation` in `index.d.ts`. Behavioral notes:

- Set `x` for a vertical line, `y` for a horizontal line.
- Use `style: 'dashed'` for targets/thresholds — dashed reads as "aspirational" vs solid "this is the data."
- **Label placement:** with neither `labelPlacement` nor `labelAnchor` set, the engine places the label automatically along the rule, clear of marks and other labels. `labelPlacement: 'start' | 'end'` pins it to one end of the rule. `labelPlacement: 'outside'` moves it out of the plot: horizontal rules get a right gutter sized to the widest wrapped label (capped at 160px or 25% of the width); vertical rules get a lane above the plot where non-overlapping labels share rows, capped at 25% of the height. A label that doesn't fit falls back inside the plot and the compile warns once. Prefer `'outside'` for multiple vertical event markers on a dense chart.
- `labelAnchor` still works as the explicit form (horizontal rules: `'top'`/`'right'` above the right end, `'bottom'` below it, `'left'` above the left end; vertical rules: `'left'`/`'top'` right of the line near the top, `'right'` left of it, `'bottom'` near the bottom).
- Use `labelOffset: { dx, dy }` for fine tuning. Labels default to the theme `small` size (12px) and the rule ink to `#888888` light / `#9ca3af` dark.

## Annotation Editing

In edit mode (`interaction: 'edit'` with `onEdit`), text annotations, connector endpoints, range/refline labels, chrome, and the legend are draggable, and each gesture arrives as an `EditTransaction`. Dragging a label writes an explicit `offset` (and `anchor`) plus `responsive: false`, so a placed label stays inline on narrow screens. See [editing reference](editing.md).

## Example: Annotated Line Chart

Two text annotations placed on opposite sides of the chart. The trough annotation uses `anchor: "bottom"` to push below the data; the peak uses `anchor: "top"` to push above. This gives the engine's collision resolver a good starting position for each label.

```json
{
  "mark": "line",
  "data": [
    { "month": "2023-01", "price": 48200 },
    { "month": "2023-04", "price": 29100 },
    { "month": "2023-07", "price": 30800 },
    { "month": "2023-10", "price": 34500 },
    { "month": "2024-01", "price": 42800 },
    { "month": "2024-04", "price": 63400 },
    { "month": "2024-07", "price": 57200 },
    { "month": "2024-10", "price": 72800 }
  ],
  "encoding": {
    "x": { "field": "month", "type": "temporal" },
    "y": {
      "field": "price",
      "type": "quantitative",
      "axis": { "format": "$,.0f" }
    }
  },
  "chrome": {
    "title": "Bitcoin surged past $70K after spot ETF approvals",
    "subtitle": "Monthly closing price, Jan 2023 - Oct 2024",
    "source": "Source: CoinGecko"
  },
  "annotations": [
    {
      "type": "refline",
      "y": 42800,
      "label": "Jan 2024: ETF approved",
      "style": "dashed",
      "stroke": "#c44e52"
    },
    {
      "type": "text",
      "x": "2023-04",
      "y": 29100,
      "text": "Crypto winter trough",
      "anchor": "bottom",
      "offset": { "dx": 0, "dy": 25 },
      "connector": true
    },
    {
      "type": "text",
      "x": "2024-10",
      "y": 72800,
      "text": "New all-time high",
      "anchor": "top",
      "offset": { "dx": 0, "dy": -25 },
      "connector": true
    }
  ]
}
```
