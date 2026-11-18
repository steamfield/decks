---
name: visualization
description: Use when selecting, creating or reviewing OpenChart charts and other data displays on Decks slides, or Ink marks in React story stages.
---

# Visualization

Load `decks:working-with-decks`, then `decks:deck-data` before writing any figure. Read [charts on slides](references/presentation.md) for sizing, theme, sources and visual QA. For Ink scenes read [story marks](references/ink.md) and load `decks:deck-motion`.

## Load the installed types

Read the declaration selected by the installed `@opendata-ai/openchart-core` package exports, commonly `node_modules/@opendata-ai/openchart-core/dist/index.d.ts`. The exact version wins over this reference. Locate it through the project's package manager if dependencies are nested. For the Decks wrapper use the installed `@steamfield/decks/kit` declarations.

Before writing a spec, load the relevant type (`ChartSpec`, `LayerSpec`, `MarkDef`, `Encoding`, `Annotation`, `ThemeConfig`). Use only public stable fields. Do not guess a field from another chart library. If no matching types are available, report the gap before presenting the spec as validated.

The adapted vendored OpenChart essentials are in `references/`; [VENDORED.md](references/VENDORED.md) records their source and version. Load only what the task needs:

| Task | Reference |
| --- | --- |
| Every new chart | [chart selection](references/chart-selection.md), [encodings and formats](references/encoding-channels.md), [color](references/color-strategy.md) |
| Lines, bars, areas or scatter | [mark behavior](references/marks.md) |
| Callouts, thresholds and series labels | [annotations and labels](references/annotations.md) |
| Honest comparisons and rendered review | [charts on slides](references/presentation.md) |
| Persistent SVG scenes | [story marks](references/ink.md) |

## Decide before encoding

Write the finding and identify the comparison the audience should make. Choose the chart for that comparison. Use position on a common scale when precision matters. Keep one main finding per slide; split an overloaded chart before shrinking its labels.

Bars encode length and must start at zero. Line/scatter domains can be tight when appropriate, with explicit bounds and enough context to prevent exaggeration. Preserve missing values and uncertainty. Do not crop a range, filter rows or change a denominator to strengthen a headline. Show source, period and units; derive all rows and callouts from sourced constants.

Use `OpenChart` from the kit for chart and layer specs. It is slide-aware, dark, and scaled for the frame. For a chart whose data changes on each click, use the kit's `ChartSteps` ([charts on slides](references/presentation.md#chartsteps)). It does not accept every OpenChart visualization type: tables, graphs, Sankey, tilemaps and geographic maps require their own public OpenChart renderer and a separate context/scale check. A map or network is useful only if geography or relationships carry the claim.

Finish with `decks lint <deck>`, `decks check`, a build and rendered inspection. Apply the `decks:deck-data` fact-check to the new or changed claims. A valid spec can still be unreadable or misleading.
