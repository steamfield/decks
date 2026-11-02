---
trigger: glob
description: "Deck Patterns"
globs: "**/examples/**,**/decks/**,**/packages/decks/**"
---
<!-- GENERATED from .claude/ for delegate agents from .claude/rules/deck-patterns.md. Edit the source, then regenerate this copy to match. -->

# Deck Patterns

## Architecture

One bun workspace. The addon and runner are `packages/decks/` (npm name `slidev-addon-decks`, bin `decks`); your decks live in `decks/` (where `bun run new` scaffolds) and the shipped ones in `examples/`. Each deck has its own directory with `slides.md` (headmatter + `src:` manifest) and `pages/` (one file per slide). `canvasWidth: 1920`, `aspectRatio: 16/9`, `layout: full` on every slide.

Slidev auto-imports Vue components from the directory adjacent to `slides.md`. The addon extends this with cross-deck components.

File naming: pages use `NN-slug.md` (e.g. `04-ridership-recovery.md`). Gaps in numbering are fine (deleted slides). The `src:` manifest in `slides.md` controls order, not the filenames.

Blank lines inside deeply-indented HTML break the build ("Element is missing end tag"): markdown-it treats a line after a blank one at 4+ spaces of indent as an indented code block, so keep nested markup blank-line-free or dedent it.

## The addon (`packages/decks/`)

A Slidev addon providing components, styles, the theme, and the chart theme. Every deck enables it by package name in headmatter, at any depth:

```yaml
addons: ["slidev-addon-decks"]
```

**Provides:** `OdFooter` (auto page numbers), `OdLogo`, `OdCoverHead` + `OdEyebrow` + `OdByline` (cover/close chrome), `RollingNumber`, `OpenChart` (with `useIsSlideActive()` animation), `OdQrCard url="https://..."` (white QR card for close slides; renders at runtime via uqr, no SVG asset step), `StoryLink href="https://..."` (a clickable source line at the bottom right of a story slide; the stage overlay swallows pointer events, so a link inside it has to opt back in), `useStageMap()` from `slidev-addon-decks/story`, and the base/layout/components/stats/story-frame/story-marks CSS plus the theme's generated tokens. A chart that shares a small card with other content uses `demoChartTheme` from `slidev-addon-decks/chart-theme` instead of hand-shrinking `slideChartTheme`. The story family (`StoryStage`, `StoryCard`, the `Ink*` primitives, `useStage`) has its own authoring rule, `.claude/rules/story-stage.md`, and its own library reference, `packages/decks/story/README.md`; both are pointed to below rather than restated here.

**Scripted demos:** click-paced zero-network demo playback (chat replays, terminal replays) uses `useScriptedDemo()` from `slidev-addon-decks/story` (also `slidev-addon-decks/composables/scripted-demo`): it returns `shown(at)` for click-gated beats and `playCount` to bind as `:key` so re-entering the slide replays entrance animations. The page declares `clicks: N` in its manifest stanza. Never drive demo pacing with timers; they drift on stage and the click-driven PDF export can't capture them. Reference implementation: `examples/agent-experience/components/AxErrorCards.vue`.

**QR codes:** `<OdQrCard url="https://..." label="..." sublabel="..." />`, rendered at runtime (uqr), no generated SVG. Record the target URL in `data-sources.md`.

**Cover and close slides:** build from the addon primitives: `<OdCoverHead url="example.com" />` (omit `url` to use the theme's `brand.url`; a `null` one shows nothing), `<OdEyebrow>label</OdEyebrow>`, `<OdByline>` for the mono meta row, root class `is-close` (+ a `glow-*`) for the close background, `<OdQrCard url="...">` for the CTA. `examples/agent-experience/pages/01-cover.md` and `10-closing.md` are the canonical usage. The logo and wordmark come from the theme's `brand` (see Theme below). (`opendata-pitch` builds its cover and close out of `StoryCover` instead, so it is not the example to copy for a normal deck.) Byline: three spans separated by `od-dim` bullets — name · role · month year.

Promote-on-second-use: a component stays deck-specific until a second deck needs it, then move it into the addon.

## Story slides

A story slide is one pinned visualization whose state animates from beat to beat on arrow keys, with a floating prose card carrying the arc. `examples/opendata-pitch` is the reference deck; `examples/od-story-templates` is the pattern gallery. The full authoring contract (beats/copy/clicks, frame units, marks, hue, view-transition hand-offs, the verification loop) is `.claude/rules/story-stage.md`; the library API and lifecycle are `packages/decks/story/README.md`. Read both before writing a stage component rather than reverse-engineering one from `opendata-pitch`.

**Component naming.** Slidev's icon resolver treats a PascalCase prefix that matches an iconify collection (`Bi`, `Fa`, `Mdi`, ...) as an icon: `BigNumber` resolved to `bi/g-number` and broke every slide. Prefix story components `Ink`, `Story`, `Unit` or similar. This applies to every component in the package, not only the story family.

## Styling ladder

Three tiers, in order of preference.

1. **Utilities in the markup first.** Slidev bundles UnoCSS with the Tailwind-compatible preset, so `flex`, `gap-4`, `text-sm`, `items-end` and the rest work in every page and component with no config. Use them for layout, spacing and typography in ordinary (non-story) slides and inside HTML overlays. The one deck-specific exception is the story frame: anything that has to scale with the 1920x1080 frame uses `calc(N * var(--sw))` / `calc(N * var(--sh))`, which has no utility, and SVG `<text>` is sized in viewBox units. Those stay in CSS.
2. **Custom CSS, scoped by the tool.** `<style scoped>` in a `.vue` stage or addon component for rules only it needs; Vue scopes them at compile time, so names inside can be short and local (`.name`, `.meta`) rather than prefixed chains. `packages/decks/styles/*.css` is for rules two decks or two components share, and it ships to every deck, so an addon block stays under an ancestor selector (`.od-slide.is-story .od-story-card { ... }`) rather than a bare class. State and variants are `is-*` / `anchor-*` companions (`is-wide`, `is-link`, `anchor-right`). BEM punctuation (`__`, `--`) is not used and should not be introduced; a few pre-scoping names (`od-story-card-lead` and similar) are left alone until the block they belong to is next rewritten.

   **`@scope` is not a free wrapper.** Under `@scope (.od-slide.is-story) { .od-story-head { ... } }`, the rule's specificity is the *inner* selector alone: `.od-story-head` at (0,1,0), not the scope's donor selector. The theme's `.slidev-layout h2` rule is (0,1,1) and would still beat it, so wrapping a heading rule in `@scope` silently drops it back to the theme's size. Qualify the element (`h2.od-story-head`, (0,2,0)) or prefix with `:scope` (`:scope .od-story-head`, also (0,2,0)) before relying on `@scope` for a heading; a non-heading rule under an element the theme doesn't style (`div`, `p` inside a card body) has no such trap.
3. **Inline `:style` only for JS values.** Beat progress (`opacity: String(s.chip)`), geometry computed from data, a colour from `ink()`, a CSS custom property set from a prop. A static value in a `:style` object is a defect; move it to a class.

**Heading classes lose to the theme.** `.slidev-layout h1/h2/h3` (from the Slidev theme) sit at specificity (0,1,1); `.od-title`/`.od-h2`/`.od-h3` are (0,1,0) and lose whenever both apply to the same element, which is every slide (`.slidev-layout` wraps every slide's content). So `h1.od-title` renders at 36px (the theme's 2.25rem), not the 4.4rem the class declares, and `h2.od-h2` at 30px, not 2.9rem; the theme's line-height and margin win too. This is the render the snap gate is pinned to, so it is not a bug to fix in this pass. See the typography table below, which lists rendered values, not source values. `h2.od-story-head` is unaffected: its selector is `.od-slide.is-story .od-story-head`, at (0,3,0), which already beats the theme.

## Slide comment header

Every page file starts with a comment identifying the slide:

```md
<!--
SLIDE 5 · CHART: Ridership is back above 2019
-->
```

## Slide types and root classes

Every slide is wrapped in a `<div class="od-slide ...">` that fills the full canvas. Modifier classes control the layout variant:

| Root class | Use for | Padding |
|------------|---------|---------|
| `od-slide` | Default text/stats/table slide | `4.4vh 5.7vw` |
| `od-slide is-cover` | First slide (brand + title + lede) | `8.1vh 5.7vw`, cyan+blue radial glow bg |
| `od-slide is-chart` | Full-bleed chart slide (chart fills flex space) | `3.4vh top, 3vh bottom` |
| `od-slide is-section` | Section divider (numbered, centered) | `8vh 8vw`, subtle radial glow bg |
| `od-slide is-section is-section-viz` | Section divider with side-by-side visualization | `8vh 8vw`, row layout |
| `od-slide is-timeline` | Timeline-heavy slides | `3.6vh top, 3vh bottom` |
| `od-slide is-close` | Close slide (QR CTA) | cover padding, close radial-gradient bg |

Glow variants: `glow-amber`, `glow-violet`, `glow-emerald` (applied alongside `is-section` or `is-close`).

## Typography classes

`od-title`, `od-h2`, and `od-h3` land on `h1`/`h2`/`h3` elements, which the Slidev theme also styles at a higher specificity than these classes (see the styling ladder above). The sizes below are what actually renders, not the rem values the class declares; weight and color do win, because `base.css` forces them with `!important`.

| Class | Rendered size | Weight | Color | Use for |
|-------|------|--------|-------|---------|
| `od-title` | 36px (theme wins; class declares 4.4rem) | 510 | `--od-text` | Cover headline |
| `od-h2` | 30px (theme wins; class declares 2.9rem) | 510 | `--od-text` | Slide headline |
| `od-h3` | 24px (theme wins; class declares 1.9rem) | 510 | `--od-text` | Subheadings |
| `od-lede` | 1.7rem | 300 | `--od-text-muted` | Lead paragraph |
| `od-body` | 1.45rem | 400 | `--od-text-secondary` | Body copy |
| `od-caption` | 1.18rem | 400 | `--od-text-faint` | Sources, fine print |
| `od-mono` | inherit | inherit | inherit | Mono font family |
| `od-eyebrow` | 0.98rem | 510 | `--od-cyan` | Overline/category label |

`od-lede`, `od-body`, `od-caption`, `od-mono`, and `od-eyebrow` sit on `p`/`span`, which the theme does not style, so those render at their declared size. `h2.od-story-head` (story decks only) also renders at its declared 2.9rem: its selector is qualified enough to beat the theme (see the styling ladder above).

Eyebrow color variants: `amber`, `violet`, `emerald`, `rose`.

## Layout utilities

| Class | What it does |
|-------|-------------|
| `od-twocol` | 50/50 CSS grid, `5vw` gap, vertically centered |
| `od-twocol wide-left` | 60/40 split |
| `od-twocol wide-right` | 42.5/57.5 split |
| `od-chart-host` | Flex-fill container for charts (`flex:1; min-height:0`) |
| `od-chart-host--full` | No top margin (for full-bleed chart slides) |
| `od-section-head` | Left column in section-viz (40% width) |
| `od-section-viz` | Right column in section-viz (flex-fill) |

## Stats grid

For big-number KPI slides. Uses `RollingNumber` for animated entry.

```html
<div class="od-stats">
  <div class="od-stat">
    <div class="od-stat-num"><RollingNumber value="41" /><span class="unit">%</span></div>
    <div class="od-stat-label">fewer failed tool calls</div>
    <div class="od-stat-delta up">after the error rewrite</div>
  </div>
  <!-- repeat for each stat -->
</div>
```

- Default: 4-column grid. Use `od-stats three-col` for 3.
- `od-stat-num` gradient variants: `amber-grad`, `cyan-grad`, `violet-grad`.
- `od-stat-delta` color variants: `up` (emerald), `down` (rose), `flat` (faint), `amber`.
- `.unit` span inside `od-stat-num` for unit suffixes (smaller, muted).

## Comparison tables

```html
<table class="od-compare">
  <thead><tr><th>Label</th><th>Before</th><th>After</th></tr></thead>
  <tbody>
    <tr><td>Median latency</td><td class="rose">840 ms</td><td>210 ms</td></tr>
  </tbody>
</table>
```

Cell color classes: `rose`, `amber`, `green`, `dim`. Non-first columns right-align with mono font.

## Other components

| Class | Purpose |
|-------|---------|
| `od-bullets` | Styled bullet list (cyan dot). Variants: `amber`, `emerald`, `violet` |
| `od-bullets-tight` | Compact spacing variant |
| `od-quote` | Block quote with cyan left border |
| `od-quote-cite` | Attribution line inside quote |
| `od-kv-grid` | Key-value pair grid (mono keys, muted values) |
| `od-compare` | Data comparison table |
| `od-slide-source` | Source citation above footer |
| `od-brand` | Logo + wordmark row (cover slide) |

## Footer

Every content slide ends with `<OdFooter />` (covers and closes omit it). Page numbering comes from Slidev nav automatically; pass `page="NN / TOTAL"` only to pin an override. Footer renders the theme's `brand` (logo, if any, and name) + page number with a subtle top border.

In section dividers, footer is absolutely positioned at the bottom.

## Charts (openchart on slides)

Slide charts fill most of the 1920x1080 canvas. They need larger text and bolder visual choices than charts on a web page. The chart theme encodes these sizes; the guidance below covers what's different from page-sized usage.

### Theme and animation

Always import `slideChartTheme` and `slideChartAnimation` from `slidev-addon-decks/chart-theme` (TS import, not auto-imported). Never copy-paste the theme block between slides. The chart theme sets:

- Font sizes: title 30, subtitle 22, body 21, small 18, axisTick 20 (all larger than OpenChart's defaults)
- Transparent background (the `od-slide` canvas shows through)
- Gridlines at 5% white opacity, axis at 12%
- Chrome colors from the deck theme's `chart` group: cyan eyebrow, primary-text title, muted subtitle/source

```ts
import { slideChartTheme, slideChartAnimation } from 'slidev-addon-decks/chart-theme'

const spec = {
  mark: { type: 'line', point: true, strokeWidth: 2.5 },
  data: [...],
  encoding: {...},
  chrome: { eyebrow: '...', title: '...', subtitle: '...', source: '...' },
  theme: slideChartTheme,
  animation: slideChartAnimation,
  crosshair: true,
  legend: { position: 'top' },
  labels: { density: 'none' },
}
```

Per-slide overrides via spread: `theme: { ...slideChartTheme, spacing: { ...slideChartTheme.spacing, xAxisHeight: 60 } }`.

### Wrapping

Chart slides use `od-slide is-chart` with `od-chart-host od-chart-host--full`. The chart host fills the remaining flex space between the spec's chrome (title/subtitle) and the footer, so charts are as tall as possible.

```html
<div class="od-slide is-chart">
  <div class="od-chart-host od-chart-host--full">
    <OpenChart :spec="mySpec" />
  </div>
  <OdFooter />
</div>
```

`OpenChart.vue` handles slide-aware animation: chart plays on slide entry via `useIsSlideActive()`, with a 500ms fallback for export mode.

### Spec patterns for the 1920px canvas

These differ from page-sized charts because of the canvas size:

**Axis labels:** Always set `labelColor: theme.text.faint` (`import { theme } from 'slidev-addon-decks/theme'`). Axis titles are optional for obvious fields (year, percent). When used, keep them short.

**Scale domains:** Always set explicit `domain` on y-axis (and x for scatter). Don't rely on auto-fit. Tight domains make the data fill the chart area. Add a small `padding: 0.04` on ordinal x-axes to give the first/last points breathing room.

**Annotations:** Font sizes 18-22px (readable at presentation distance). Reference lines use `fontSize: 22, fontWeight: 510` for labels. Text annotations use `fontSize: 19-21`. Region annotations (danger zones, F zones) use low opacity fills (0.15-0.18).

**Labels:** Default to `labels: { density: 'none' }` for line charts (crosshair handles hover). For bar charts, set `labels: { fontSize: 22, format: '...' }` since bars need visible values. Format strings use d3-format: `'+.1f%'` for signed percent, `'.0f%'` for unsigned, `'~s'` for SI notation.

**Line marks:** `strokeWidth: 2.5` and `point: true` for all line charts (thicker than page defaults for projection distance).

**Bar marks:** Horizontal bars use `sort: null` on y to preserve data order. Conditional color encoding for positive/negative splits: `color: { condition: { test: { field: 'pct', gte: 0 }, value: ink('slate', 1) }, value: theme.accents.cyan }`.

**Scatter plots:** `mark: { type: 'point', filled: true }`. Use `size` encoding for emphasis tiers. Add `tooltip` array for hover detail. Diagonal reference lines for x=y comparisons.

**Area charts:** `mark: { type: 'area', point: true, strokeWidth: 2 }`. Good for showing absolute headcount where the area fill conveys magnitude.

**Series styles:** Projections/estimates use dashed lines: `seriesStyles: { '2026 (est.)': { lineStyle: 'dashed' } }`. Color-match solid and dashed variants.

**Chrome:** Every chart spec has a `chrome` block with `eyebrow`, `title`, `subtitle`, and `source`. Eyebrows are short category labels ("Ridership", "Error rates"). Titles are one-sentence findings, not neutral descriptions. Subtitles explain the data and methodology. Sources cite the dataset.

**Legends:** `legend: { position: 'top' }` or `legend: { show: false }`. Never bottom. Hide when colors are explained in annotations or the subtitle.

**Animation:** `slideChartAnimation` gives 900ms smooth enter + 350ms annotation delay. Bars can use shorter 700ms. Always import from the chart theme rather than setting per-slide.

### Color conventions

OpenChart doesn't resolve CSS vars, so chart colors are strings, and they come from the theme in JS: `import { theme } from 'slidev-addon-decks/theme'` (the deck's `theme.json` merged over the defaults) or `ink(hue, step)` from `slidev-addon-decks/story`. Never type a hex literal into a spec: it ignores the deck's theme and breaks the moment someone recolors it. Semantic mapping (default values shown for orientation only):

| Read it as | CSS var | Default | Typical use |
|-------|-----|-----|-------------|
| `theme.accents.cyan` | `--od-cyan` | `#06b6d4` | Primary accent, eyebrows, the subject of the slide |
| `theme.accents.rose` | `--od-rose` | `#fb7185` | Negative/failing values, danger zones |
| `theme.accents.amber` | `--od-amber` | `#f59e0b` | Warning/at-risk, the "after" era |
| `theme.accents.emerald` | `--od-emerald` | `#34d399` | Positive/improving values |
| `theme.accents.slate` | `--od-slate` | `#94a3b8` | Baseline/average/neutral category |
| `theme.accents.violet` | `--od-violet` | `#a78bfa` | Secondary category |
| `theme.accents['blue-soft']` | `--od-blue-soft` | `#60a5fa` | Tertiary category |
| `ink('slate', 1)` | | `#64748b` | Pre-era / muted comparison bars |
| `theme.text.dim` | `--od-text-dim` | `#52525b` | Subtle reference lines and annotations |

For region fills (danger zones), use the accent at low opacity: `{ fill: ink('rose', 1), opacity: 0.18 }`. For more than a handful of series, `theme.categorical` (also `CATEGORICAL_COLORS`) is the ordered palette.

### Metrics sidebar

For charts that need KPI callouts alongside the visualization, use the `metrics` spec property:

```ts
metrics: [
  { label: 'After (2026)', value: '21.3%', delta: '+18.4 pp since the change', deltaTone: 'up' },
  { label: 'Baseline', value: '<3%', secondary: 'both arms' },
],
```


## Theme and tokens

One source: `packages/decks/theme/default.json`. A deck recolors or rebrands itself with a `theme.json` next to its `slides.md`, a partial override of the default:

- Objects merge key by key; arrays (`ramps.<hue>`, `categorical`) are replaced whole.
- Aliases use `{group.token}` and `{ramps.<hue>.<1-4>}` (e.g. `"glows": { "secondary": "{ramps.amber.2}" }`), resolved after the merge, so an alias in the default follows your override.
- The six hue names (`cyan`, `amber`, `rose`, `emerald`, `violet`, `slate`) are fixed slots: recolor them, don't rename or add. Each ramp is four `#rrggbb` colors getting lighter, and step 1 must clear 3:1 against `surfaces.canvas` (`theme.test.ts` enforces it for the default and the example).
- Glows must be hex (they become `--od-glow-K-rgb` triplets). Themes stay dark: `the-unnamed` forces `colorSchema: dark`.
- `brand` is `{ name, url, "wordmark-gradient", logo }`. `logo` is `{ "view-box", "svg" }` or `null` (no mark); `url: null` hides the cover URL. A custom mark only animates if it reuses the `od-intro*`/`od-settle-*` classes `OdLogo.vue` animates. `bun run new ... --brand "Name" --url example.com` writes this block for you.
- Edits live-reload in `bun run dev` and apply at build time. `examples/od-templates/theme.json` is the worked example (a full alternate palette and brand); `examples/opendata-pitch/theme.json` overrides only the brand.

In CSS, never use raw hex values. The theme renders to custom properties: `surfaces.K` and `accents.K` -> `--od-K`, `text.primary` -> `--od-text`, `text.K` -> `--od-text-K`, `borders.default` -> `--od-border`, `borders.K` -> `--od-border-K`, `glows.K` -> `--od-glow-K-rgb` (use as `rgba(var(--od-glow-amber-rgb), 0.2)`), `fonts.K` -> `--od-font-K`. The ones you'll reach for:

**Surfaces:** `--od-canvas`, `--od-surface`, `--od-surface-raised`
**Text:** `--od-text`, `--od-text-secondary`, `--od-text-muted`, `--od-text-faint`, `--od-text-dim`
**Borders:** `--od-border`, `--od-border-subtle`
**Accents:** `--od-cyan`, `--od-rose`, `--od-amber`, `--od-emerald`, `--od-violet`, `--od-blue`, `--od-slate`

In JS (chart specs, SVG fills computed in a stage), read colors through `slidev-addon-decks/theme` or `ink()`, never a hex literal (see Color conventions above).

## Data provenance

For decks with data-driven charts, maintain `<deck>/data-sources.md` mapping slide numbers to source queries. This is the fact-check input for decks. Shared data arrays and scripted-demo fixtures live in `<deck>/data/*.ts`. The full data contract (provenance comments, `FLAG: author-reported`, the banned-content table) is `.claude/rules/deck-data.md`.

## Headmatter template

A conventional deck (`Slidev`'s own transition, no story engine):

```yaml
---
theme: the-unnamed
title: "Deck Title"
info: "One-line description for SEO and slide index."
author: Your Name
transition: slide-left
aspectRatio: 16/9
canvasWidth: 1920
fonts:
  fallbacks: false
  webfonts: [Inter]
  sans: Inter, sans-serif
  serif: Inter, sans-serif
  mono: Inter, sans-serif
  weights: "300,400,510,590,700"
lineNumbers: false
drawings:
  enabled: false
defaults:
  layout: full
addons: ["slidev-addon-decks"]
exportFilename: slug-name
src: ./pages/01-cover.md
---
```

A story deck adds two keys and keeps everything else the same: `transition` becomes a no-op `TransitionGroup` (the addon runs cross-slide transitions itself), and `htmlAttrs` carries the `data-od-story` marker the story guard tests and view-transition rules key on:

```yaml
transition:
  name: od-cut
  css: false
htmlAttrs:
  data-od-story: ""
```

See `.claude/rules/story-stage.md` for what that marker gates.

`defaults: layout: full` applies to every slide, so each subsequent manifest stanza is just:

```yaml
---
src: ./pages/NN-slug.md
---
```

`bun run new <alias> <dir>` scaffolds the conventional headmatter and a cover page into `decks/<dir>/`; `bun run new <alias> <dir> --story` scaffolds the story variant instead, plus a first stage, its data module, and a `data-sources.md` skeleton.

## Scripts

Decks are registered in `decks.json` at the repo root (alias -> entry, URL slug, `animated` flag; `_config` sets `decksDir`, `outDir`, `base`) and driven by `packages/decks/scripts/deck.mjs` (the `decks` bin):

```bash
bun run new <alias> <dir> [--story] [--author "Name"] [--brand "Name"] [--url example.com]   # scaffold into decks/<dir> + register
bun run dev <alias>
bun run build <alias>       # -> dist/<name> (decks.json _config.outDir)
bun run export <alias>      # static: --dark --with-clicks --with-toc; animated: --dark --with-clicks --wait 1500
bun run check               # orphaned/missing pages vs src: manifests (also gates build --all)
```

Set `"animated": true` in `decks.json` for decks with OpenChart or scripted demos: the TOC export step errors on HTML-only slides and animations need the wait to settle. The runner owns export flags; never pass them by hand.

Verify: `bun run check`, `bun run build <alias>`.
