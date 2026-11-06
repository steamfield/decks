# Theme Customization

Override default visual styling for any visualization type. All fields are optional and deep-merged onto the default theme. For the full `ThemeConfig` shape (every field, every default), load `ThemeConfig` and `ThemeColors` from `index.d.ts`. This file covers behavioral notes and editorial guidance.

## Shorthand: flat color array

`theme.colors` can be a flat `string[]` instead of the nested `{ categorical, ... }` object. It maps to `colors.categorical`:

```json
{ "theme": { "colors": ["#0d9488", "#94a3b8", "#94a3b8"] } }
```

is equivalent to:

```json
{ "theme": { "colors": { "categorical": ["#0d9488", "#94a3b8", "#94a3b8"] } } }
```

The flat form is more convenient for highlight+gray patterns where you just need to set ordered colors matching your data array.

## Default Categorical Palette

The default `colors.categorical` is a quiet, ordered **six-hue** OKLCH palette, cyan leading: cyan → ochre → blue → rose → green → violet, each hue at least 80° from its neighbors (including the wrap back to cyan) and alternating lightness rather than matching it, so the ordering survives common color-vision deficiencies. A seventh-or-later series extends from a separate six-slot overflow ramp and the engine warns -- six categorical series is already the point to bucket the tail, facet, or direct-label instead of adding a hue.

There's a separate, quieter **fill** variant: `colors.categoricalFill` is used for area-filling marks (bar, area, arc, waffle, calendar, rect), while `colors.categorical` (the stroke variant) is used for lines, points, and graph/network marks. If you set only `categorical` on a custom theme, `categoricalFill` is copied from it automatically -- set both explicitly to control strokes and fills independently.

**Dark mode changes the palette.** Unlike earlier versions, the categorical (and categoricalFill) arrays are NOT mode-agnostic: dark mode swaps in purpose-built dark variants (lightness raised, chroma trimmed) rather than reusing the light hex values or contrast-adjusting them algorithmically -- a generic adapter dulls cyan into teal, so the dark variants are precomputed instead. If you override `theme.colors.categorical` with your own array, that override is NOT swapped for a dark variant automatically -- your custom array renders identically in both modes unless you also pass `TokenValue` pairs (`{ light, dark }`) for the colors that need to differ, or set `categorical`/`categoricalFill` to different arrays per mode via your own theme resolution.

For line strokes specifically, the engine applies a small per-color light-mode darkening (`adaptForLightLineStroke`) to saturated colors so they meet 3:1 contrast on white backgrounds; achromatic (low-saturation) colors and already-dark colors pass through unchanged. This only affects the *drawn* stroke, not the palette value itself -- a bar filled with the same hue stays at the lighter, unadapted color.

## Hairline

`colors.hairline` is the structural line color for axis lines and separators -- heavier than `colors.gridline` (which is for reference lines meant to support reading a value, and stays quieter so it doesn't compete with the data). Both are distinct from `colors.axis`, which is the tick-label *ink* color (and must independently clear 4.5:1 contrast, since tick labels render in it).

## Series Strategy

`theme.seriesStrategy?: 'palette' | 'accent-neutral'` (default `'palette'`) controls categorical color assignment by series count:

- `'palette'` -- full categorical palette, always (the default).
- `'accent-neutral'` -- 1 series gets the accent (first palette color) only; 2-4 series get accent for the first plus neutral grays for the rest; 5+ fall back to the full palette. The grays are surface-aware: darkest-first on light backgrounds, brightest-first on dark.

This automates the highlight+gray convention without hand-building a color array, but it always accents the *first* series -- if the protagonist isn't first in the data, sort it first or use the manual array (see color-strategy.md).

## Light/Dark Token Pairs

Every color field in `ThemeConfig` (including chrome element `color`) accepts a `TokenValue`: a plain string, or `{ "light": "#fff1e5", "dark": "#1a1311" }`. With a pair, dark mode uses your explicit dark value instead of deriving one algorithmically. Plain strings behave as before.

## Presets

Four named `ThemeConfig` presets are exported from `@opendata-ai/openchart-core`: `essay` (serif-feel titles, warm background, generous spacing, square corners), `wire` (monospace, dense, tight chrome, dashboard feel), `broadsheet` (newspaper editorial: warm paper, a red masthead `rule` above the chrome and a matching red eyebrow, 24px/700 title, square corners), `terminal` (dense dark product surface, dark in both modes, one cyan accent, `seriesStrategy: 'accent-neutral'`). For the default look, omit `theme` (the empty `editorial` preset was removed in v9). `clarity` still exists but is deprecated for removal in v10; don't use it in new work. Pass a preset as the `theme` prop/option; layer your own overrides with `mergeThemeConfig` (a deep merge, so nested preset fields survive) rather than an object spread.

```tsx
import { broadsheet, mergeThemeConfig } from "@opendata-ai/openchart-core";

<Chart spec={spec} theme={broadsheet} />
<Chart spec={spec} theme={mergeThemeConfig(broadsheet, { rule: { width: 80 } })} />
```

`terminal` sets its background to a dark hex in *both* light and dark mode -- it resolves as dark regardless of the `darkMode` prop, since the surface itself is already dark.

## The editorial rule

`ThemeConfig.rule` (`{ color, width, thickness }`, any subset, or `null`) draws a short colored bar above the chrome block -- the Economist/FT masthead device. It is absent on every preset except `broadsheet`; `rule: null` removes a preset's rule. Omitted fields inherit the preset's, else 40px width, 3px thickness, and the theme text ink. `color` accepts a `TokenValue` like any other color field, so it needs no separate dark-mode handling. No top chrome (no title/subtitle/eyebrow authored) means no rule is drawn.

```json
{ "theme": { "rule": { "color": "#e3120b", "width": 40, "thickness": 3 } } }
```

## Dark Mode

`darkMode?: 'auto' | 'force' | 'off'` (default `'off'`) is a mount option / component prop (or `VizThemeProvider` prop), never a spec field:

| Value | Behavior |
| --- | --- |
| `"off"` | Always light mode |
| `"auto"` | Respect `prefers-color-scheme` system setting |
| `"force"` | Always dark mode |

**Class-based dark-mode apps:** `'auto'` only checks `prefers-color-scheme`. If your app toggles dark mode by toggling a CSS class (Astro, Next.js, Tailwind), observe the DOM class change and map it to `'force'`/`'off'` yourself — `'auto'` will not pick that up.

**What dark mode adapts:** background, text/secondary text, gridlines, hairline, axis lines/tick ink, chrome text colors, the editorial `rule` (if set), and the categorical/categoricalFill palettes -- these swap to purpose-built dark variants rather than rendering identically in both modes (see "Default Categorical Palette" above). Every adaptation only replaces a value the theme left at its light default; an explicit override (a plain string, not a `TokenValue` pair) survives dark-mode adaptation untouched.

## How theme layers combine

Theme sources deep-merge in this order, later wins: spec `theme`, provider theme (`VizThemeProvider`), then the component `theme` prop or mount/compile `theme` option. Objects merge leaf by leaf; arrays and `{ light, dark }` pairs replace whole. An authored `chrome.<element>.fontSize` beats the general `fonts.sizes` scale even when the two come from different layers. Theme chrome entries are objects: `theme.chrome.title: { color: "#333" }`, not a bare color string (that v8 form fails validation).

In a layer spec, the composed chart's chrome, axes, and legend use the layer's `theme` when it has one (otherwise the first leaf's). Each leaf's marks use the leaf `theme` deep-merged over the layer `theme`; with independent y-scales each side's axis uses its leaf's merged theme too.

**CSS tokens.** Only theme values you author (and values derived from them) are stamped inline on the chart. Everything you omit stays a live `--oc-*` custom property from the stylesheet, so host CSS can restyle it (e.g. `--oc-border-radius`, annotation tokens like `--oc-annotation-label`). An authored theme value beats host CSS.

## Theme Provider (React)

Wrap multiple visualizations to share a theme:

```tsx
import { VizThemeProvider } from '@opendata-ai/openchart-react';

<VizThemeProvider theme={myTheme} darkMode="auto">
  <Chart spec={spec1} />
  <Chart spec={spec2} />
  <DataTable spec={tableSpec} />
</VizThemeProvider>
```

## Example: Custom Theme

```json
{
  "mark": "bar",
  "data": [{ "cat": "A", "val": 10 }, { "cat": "B", "val": 20 }],
  "encoding": {
    "x": { "field": "val", "type": "quantitative" },
    "y": { "field": "cat", "type": "nominal" }
  },
  "theme": {
    "colors": {
      "categorical": ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"],
      "background": "#fafafa",
      "text": "#264653",
      "gridline": "#e0e0e0"
    },
    "fonts": {
      "family": "IBM Plex Sans, sans-serif"
    },
    "spacing": {
      "padding": 16
    },
    "borderRadius": 8
  }
}
```
