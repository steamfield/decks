# Chart selection

Adapted from the OpenChart reference identified in [VENDORED.md](VENDORED.md).

Position on a common scale is easier to compare precisely than angle, area or color saturation. Start with the question the audience should answer, then choose the encoding.

| Comparison | Form |
| --- | --- |
| Change across time | Line; use a temporal field for real dates |
| Ranking or category comparison | Horizontal bars with readable names |
| Independent groups within each category | Grouped bars; explicitly disable default stacking |
| Parts of a meaningful total | Stacked bar; normalize only when shares are the question |
| Composition across time | Stacked area, with a common zero baseline |
| Relationship between quantitative variables | Point/scatter |
| Distribution | Dots for individuals, histogram for bins, density when smoothing is explained |
| Change between two observations per entity | Slope lines or range marks |
| Tangible counts or shares | Unit/waffle display with an explicit unit definition |
| Flows | Sankey when width and movement are the claim |
| Geography | Map when location or spatial pattern matters; equal-area tiles for equal-weight regions |

The Decks `OpenChart` wrapper takes chart/layer specs, not all of these renderer families. Check the installed OpenChart renderer's public interface before choosing a non-chart form. An HTML table is often clearer for a few exact values.

Use one protagonist plus neutral context for a selected-series story. Use small multiples with common axes when several equal series overload one plot. Different units usually need separate charts or a clearly defined common index. Avoid dual y-axes: their arbitrary ranges can manufacture apparent correlation.

Bars start at zero because length encodes magnitude. Lines can use tighter labeled domains because position carries the value. Bubble size must encode area, not radius. Avoid 3D perspective, chart decoration and unrelated gradient fills. Show a clear scale rather than maximizing apparent effect size.

Match data resolution to the claim. Aggregate to the meaningful period, preserving the method in provenance; do not silently sample away outliers. Aim for a readable number of observations, commonly fewer than 150 per series, rather than treating more rows as more evidence. Do not treat missing observations as zero.

Separate a finding that needs four charts into a short sequence. A comparison can remain pinned across beats when that continuity helps, provided each beat makes one change and preserves honest scales.
