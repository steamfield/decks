# Mark behavior

Adapted from the OpenChart bar, line, area, scatter and series-style references identified in [VENDORED.md](VENDORED.md). Read the installed mark and encoding declarations before using optional fields.

## Bars

`mark: "bar"` covers horizontal and vertical bars. Quantitative x plus categorical y gives horizontal bars; categorical/temporal x plus quantitative y gives columns. Keep the magnitude axis at zero. For a narrow range where zero obscures the change, choose a position-based dot plot rather than truncating bars.

Color groups stack by default. Use `stack: null` on the quantitative channel for independent side-by-side comparisons. `"normalize"` gives shares of the total; it is wrong when the audience needs absolute values. Preserve or deliberately sort category order, and inspect the displayed order. Values should be readable without hover when precision matters.

## Lines

`mark: "line"` connects ordered observations. Use temporal x for real dates; ordinal x for a deliberate ordered sequence. Use color for distinct series. `point: true` helps show sparse observations; dense observations may need aggregation instead.

For multiple line/area series, endpoint chip labels are on by default and the traditional legend can be auto-suppressed. `endpointLabels: false` restores the default legend behavior. To request a top legend instead, use `legend: { position: "top" }` with endpoint labels off. To force both, set `legend.show: true`.

`labels.density` does not add per-point text to lines/areas. Annotate selected values. `crosshair: true` is useful for interactive detail but cannot carry a presentation's main value alone. Do not connect across missing periods as if measurements exist there.

## Areas

`mark: "area"` emphasizes magnitude through filled area. Use a zero baseline for magnitude. Colored areas stack by default; `encoding.y.stack: null` overlaps them, while `"normalize"` shows shares. Use `y2` for a genuine range or interval, with both boundaries documented. Do not present uncertainty bands as measured totals.

## Scatter and bubble

`mark: "point"` maps quantitative x/y. Use `filled: true` for solid points when that improves projection contrast. `size` is a quantitative encoding for bubble area. Fit domains to the question, leave space for the largest marks and label the extent. A correlation is not evidence of causation.

Use color only for a meaningful category, magnitude or highlight. Dense plots need fewer labels and selected annotations. Prefer a couple of labeled comparisons over shrinking every campus or customer name until it becomes unreadable.

## Series identity

`seriesStyles` overrides a series by its color-field value. Public fields include `lineStyle`, `showPoints`, `strokeWidth` and `opacity`. Use dashed estimates/benchmarks, dim context and a clear subject. Resolve colors from the Decks theme and keep identities stable across slides and beats.

Legend toggling can change the visible scale; do not rely on an interactive filtered state to establish a headline without documenting the filter. The exported frame must still identify what is plotted.
