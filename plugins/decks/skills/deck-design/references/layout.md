# Layout, type and tokens

## Canvas and composition

The default design canvas is 1920x1080. It scales to fit the window and grows along the spare dimension: conventional layouts can use extra width or height. Write ordinary layout in design pixels, flex and grid. Use `100%` or `inset: 0` for a full-slide background; a fixed 1920x1080 background leaves strips on other aspect ratios.

`cqw` and `cqh` measure the frame; `vw` and `vh` measure the browser window and are wrong inside the scaled canvas. The frame exposes unitless `--deck-w`, `--deck-h`, `--deck-scale` and `--deck-text-scale`. Turn a width into a CSS length with `calc(var(--deck-w) * 1px)`.

Basic layouts are available without imports in MDX. `Center`, `Cover` and `Section` arrange content but supply no theme or typography. `TwoCol` requires two element children, with ratios `1:1`, `2:1`, `1:2`, `3:2`, `2:3`; `align` is `start`, `center` or `end`. `ImageSide` requires `src` and `alt`, supports `side="left"` or `"right"`, and ratios `1:1`, `2:1`, `1:2`. An empty alt marks a decorative image.

Their default layout tokens are `--deck-pad-x`, `--deck-pad-y` and `--deck-gap`. Follow the installed guide for values rather than assuming kit classes share the same padding.

## Typography

Establish a short scale for headline, body, label and source. The framework guide's plain-CSS starter uses 96 design pixels for a headline and 40 for body; these are starting values, not rendered kit class guarantees. Do not carry old heading specificity fixes into a new deck. Inspect what actually renders.

Multiply every authored CSS font size by text scale:

```css
.headline {
  color: var(--od-text);
  font-family: var(--od-font-serif);
  font-size: calc(96px * var(--deck-text-scale, 1));
}
```

The viewer intercepts Cmd/Ctrl with `+`, `-` and `0` to resize text. Bare font sizes ignore that feature. Boxes stay the same size, so leave room for text growth. Avoid thin type, low-contrast sources, long line lengths and tiny labels. Use tabular numerals where values must align.

Prefer a component's co-located `.module.css` for local rules; use `styles/index.css` for deck-wide rules. Inline style is for computed geometry, progress or token values. Do not introduce a utility framework just to lay out a slide.

## Kit theme

Install with `installTheme(resolveTheme())` in `setup.ts`, importing both from `@steamfield/decks/kit`. For overrides pass the imported `theme.json` to `resolveTheme`. Import `@steamfield/decks/kit/styles.css` first in `styles/index.css`.

- Objects merge key by key; arrays replace whole. Aliases such as `{surfaces.canvas}` and `{ramps.rose.2}` resolve after merging.
- The fixed ramp names are `cyan`, `amber`, `rose`, `emerald`, `violet`, `slate`. Recolor them instead of adding or renaming slots. Each has four steps, darkest to lightest. Keep visible mark contrast against the canvas; step 1 should clear 3:1. Inspect contrast after recoloring rather than assuming a project test does it.
- Define color literals only in `theme.json`. Components and chart specs read `ink(hue, step)` or `theme()`; CSS reads the emitted variables. Do not put hex literals in components, specs or CSS. OpenChart needs resolved color strings, not CSS variable strings.
- Theme groups cover surfaces, text, borders, accents, glows, fonts, shape, ramps, categorical colors, chart colors and brand. Keep the deck dark when using the kit's dark-only `OpenChart` wrapper.
- Useful CSS variables include `--od-canvas`, `--od-surface`, `--od-text`, `--od-text-secondary`, `--od-text-muted`, `--od-text-faint`, `--od-border`, `--od-cyan`, `--od-rose`, `--od-amber`, `--od-font-sans`, `--od-font-serif`, `--od-font-mono`.
- Shape tokens are `radius`, `hairline`, `card-width`, `dim`. Lengths are CSS length strings; `card-width` and `dim` are unitless numeric strings. The card width is `calc(var(--od-card-width) * var(--lw))`. Set these once instead of fighting component selectors.
- Inter is bundled. Another font must be loaded by the deck as well as named in the theme. Do not assume a family exists because CSS accepts its name.

## Story frame

`StoryStage` centers a fitted 16:9 scene in the slide. `stage` holds SVG children in a 1920x1080 viewBox; `overlay` holds HTML; `card` normally holds `StoryCard`. `background` fills behind the frame. `fluid` can widen reflowable HTML/charts; leave it off for fixed-coordinate scenes.

Within this frame use `--sw` (1% frame width), `--sh` (1% frame height), and `--lw` (1% layout width, wider only in fluid mode). Convert SVG coordinates to overlay percentages using `STAGE.width` and `STAGE.height`, or use the installed `useStageMap` API after reading its declarations. Do not apply `useFrameScale` to ordinary HTML or SVG; that scales twice.

Use `od-story-head` for the headline. Measure its occupied band and the card at maximum copy size; keep marks out of both. Do not hardcode reserved rectangles from another deck after changing fonts or card width. At most two active reading zones per beat: the card plus a chip or end label.

`StoryCard` takes `lead`, optional `body`, `anchor="left"` or `"right"`, and `hue`. Keep the card anchored within a slide as its text changes. `StoryLink` takes `href` and optional `label` for the cited source. `StoryLayer` provides another full-frame SVG layer for overlay ink.

The bottom credit reserves `--deck-credit-space`. Built-in layouts and the kit account for it; custom bottom-positioned elements must too. Respect the project's choice of credit configuration.

Use React `useId()` for filters, gradients and accessible labels when authoring custom SVG. Several instances of a slide can exist simultaneously in different views.
