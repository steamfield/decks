# Typography

Concrete sizing, weight, and formatting rules for chart text elements.

## Hierarchy

| Element | Size | Weight | Color | Purpose |
| --- | --- | --- | --- | --- |
| Title | 26px | Semibold (600) | Ink (`#09090b` light / near-white dark) | The takeaway |
| Subtitle | 14px | Regular (400) | Muted gray | Context |
| Eyebrow | 11px | Medium (500) | Accent (cyan by default) | Category/kicker above the title |
| Axis / tick labels | 12px | Regular (400) | Muted gray (also the axis-line ink) | Scale reference |
| Data labels | 11-13px | Medium (500) | Primary | Precise values |
| Annotations | 13px default | Regular (400), subtitle included; set `fontWeight: 700` for a bold lede | Primary or accent | Editorial callouts |
| Source / byline / footer | 12px | Regular (400) | Muted gray | Attribution |

One weight ladder covers everything: 400 regular (body, subtitle, source), 500 medium (eyebrow, labels, UI chrome, values), 600 semibold (title, series names, tooltip title), 700 bold (reserved for `**bold**` markdown spans within text, not a default element weight). Default spacing: 16px from the chrome block to the chart, 12px from the chart to the footer (`theme.spacing.chromeToChart` / `chartToFooter`). Use at least 2 clearly different hierarchy levels so the reader's eye knows where to start. The title should be noticeably larger and bolder than everything else. Supporting text steps down in size, weight, and contrast. Tabular (lining) numerals apply everywhere numbers appear, including static SVG chrome -- see the Numerals section below.

## Numerals

**Tabular (monospaced) numerals** for all data-facing text: axes, table columns, data labels, tooltips. Every digit occupies the same width, so columns of numbers align vertically and multi-digit values are instantly comparable by length.

**Lining figures** (uniform height, sitting on the baseline) rather than oldstyle figures (which vary in height like lowercase letters). Oldstyle figures look nice in paragraphs but are hard to scan in tables and axes.

## Font Selection

Sans-serif typefaces for all chart text. They render cleanly at small sizes and scan faster than serifs in data-dense contexts. Good options with tabular numeral support:

- Inter, Roboto, Source Sans Pro, Noto Sans
- System sans-serif stack as fallback

Serif typefaces can work for display titles if the publication style calls for it, but keep all other chart text in sans-serif.

Avoid: thin/light weights below 16px (low contrast, hard to read), condensed widths (normal-width text at a smaller size is more readable than bigger condensed text), decorative or script fonts.

## Formatting Rules

**Sentence case everywhere.** "Revenue by quarter" not "Revenue By Quarter" or "REVENUE BY QUARTER". Sentence case is faster to read because mixed-case word shapes aid recognition.

**Alignment:** left or right-aligned text creates clean edges that run parallel to chart elements. Center alignment only for chart titles. In tables, right-align numeric columns so decimal points line up.

**Minimum size:** never go below 10px. If text doesn't fit at 10px, the solution isn't smaller text. It's one of:
- Abbreviate labels (Jan, Feb vs January, February)
- Use direct labeling instead of a legend
- Restructure the chart (horizontal bar for long category names)
- Rotate labels (max 45 degrees, only for short labels)

**Line length for annotations:** 4-8 words per line. Use `\n` for multi-line annotations when needed.
