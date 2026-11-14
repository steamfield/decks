# Color strategy

Adapted from the OpenChart reference identified in [VENDORED.md](VENDORED.md). Slide examples use resolved Decks theme colors, not literal palette arrays.

| Story | Strategy |
| --- | --- |
| One entity or series matters | Highlight it; use neutral context for the rest |
| Several equal categories must be distinguished | Categorical hues with comparable emphasis |
| Magnitude or intensity | Sequential ramp, ordered by perceived lightness |
| Above/below a meaningful midpoint | Diverging scale with an explicit midpoint |

Color encodes the finding or a real distinction. It does not need to be used on every label and mark. Gray is useful context. Do not infer “good” or “bad” from a variable without evidence, and do not assign every category an unrelated hue to make the slide lively.

Use `theme()` and `ink()` from `@steamfield/decks/kit`. The chart theme's categorical palette can be set through `theme.colors.categorical` in a spec override; preserve the other theme colors. For a quantitative color channel, choose a suitable scale from the installed declarations and source the range colors from theme tokens. Keep semantic mappings consistent across related charts.

Categorical palette order follows the encountered series values, so uncontrolled row ordering can change identity. Establish a stable color domain/mapping rather than trusting incidental query order. Check filtering and changed data as well as the first frame.

Reserve most saturation for the claim. If every series must remain identifiable, combine color with labels, position or dash patterns. Do not rely on red/green alone. Ensure readable text and mark contrast against the actual dark canvas. Sequential ramps on a dark surface often need increasing lightness for increasing emphasis.

A gradient can show a continuous magnitude; it must not imply order among arbitrary categories. Bucket thresholds must be explicit in source data and legend text. Avoid manufacturing discrete tiers just to add more colors to a scatter plot.

For series that are estimates or projections, preserve the semantic hue and add a dash or explicit label. A semantic distinction should survive monochrome print and color-vision differences.
