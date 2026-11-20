# The kit

`@steamfield/decks/kit` is the optional kit import path for data-storytelling decks: a token theme, a "story stage" (one pinned visualization per slide, advanced by clicks, with a prose card), a chart wrapper, and a stylesheet. Two example decks use it and are the references for this page: `examples/tides-slide` (two slides, the smallest working story deck) and `examples/building-for-agents` (19 slides with its own design system).

```mdx demo="building-for-agents"
```

## Setting up a deck

Add `@steamfield/decks` to the deck's dependencies, then do three things.

Install a theme in `setup.ts` (`examples/tides-slide/setup.ts`):

```ts
import { installTheme, resolveTheme } from "@steamfield/decks/kit";

installTheme(resolveTheme());
```

Import the stylesheet first in `styles/index.css` (`examples/tides-slide/styles/index.css`):

```css
@import "@steamfield/decks/kit/styles.css";
```

Set the `story` transition in `deck.config.ts` (`examples/tides-slide/deck.config.ts`):

```ts
import { defineDeck } from "@steamfield/decks/node";
export default defineDeck({ title: "Tides", transition: "story" });
```

Kit components are not available in slides automatically. Import them in your stage components, and re-export any you want to write directly in MDX from a file in `components/` (`examples/tides-slide/components/chrome.tsx`):

```tsx
export { StoryCover } from "@steamfield/decks/kit";
```

`ChartSteps` and `MotionTemplate` re-exported this way still add their clicks to the slide's total, as they do when the slide imports them (see [motion.md](motion.md#how-the-total-is-counted)).

## What the package exports

| Export | What it is |
| --- | --- |
| `resolveTheme`, `installTheme`, `theme`, `ink`<br>Types: `Theme`, `Hue` | The theme. |
| `StoryStage`, `StoryLayer`, `StoryCard`, `StoryCover`, `StoryLink`, `STAGE` | Story stage components and the stage's 1920x1080 box. |
| `useStage`, `useScriptedDemo` | Hooks that drive a stage from clicks. |
| `OpenChart`, `ChartSteps`, `slideChartTheme`, `scaleChartTheme`, `slideChartAnimation`, `useFrameScale` | Charts, and a chart whose data changes per click. |
| `MotionTemplate`, `useTemplateMotion`<br>Types: `MotionTemplateProps`, `MotionTemplateName`, `TemplateProps` | Ready-made motion graphics and the hook they are built on. See [motion-templates.md](motion-templates.md). |
| `Scene3D` | A three.js scene on the click timeline, with a still poster everywhere else. |
| `OdQrCard`, `OdByline`, `OdCoverHead`, `OdEyebrow`, `OdLogo` | A QR code card, a byline row, the cover's brand row, a small overline label, and the theme's brand mark. |
| `InkLine`, `InkBars`, `InkTimeline`, `InkTimelineCursor`, `InkRule`, `InkNumber`, `InkChip`, `InkCardRect`, `InkPing`, `UnitGrid`, `Underline`, `CodeInk`, `Graph3D`<br>Handle types: `LineHandle`, `BarsHandle`, `GrowHandle`, `RuleHandle`, `UnitGridHandle`<br>Data types: `InkBarRow`, `InkStep`, `DrawOptions` | Marks for story stages: lines, bars, timelines, rules, figures that count up, chips, card outlines, focus rings, unit grids (waffles), underlines, SQL with ink, and a 3D graph (live WebGL on the slide, an SVG still everywhere else). A mark that grows itself exposes a handle the stage adds to its timeline through a ref. |
| `useStageEntrance`, `useStageMap`, `entrance`, `fadeIn`, `fadeOutInPlace`, `riseIn`, `easeHeight`, `RISE`, `prefersReducedMotion`, `resolvePosition` | Lower-level stage helpers: a one-shot entrance, stage-to-overlay coordinates, gsap tween presets, the reduced-motion check, and timeline position resolution. |
| `brushRibbon`, `inkStyle`, `polylinePath`, `STORY_STYLE`, `STROKE`, `hash`, `hashRange`, `hashSigned`, `rippleProgress`, `parliament`, `tokenizeSql`, `UNIT_GRID_DEFAULTS`, `unitCellCenter`, `unitCellHeight`, `lerp`, `stackEndLabels`, `CATEGORICAL_COLORS`, `CANVAS` | Drawing primitives for custom marks: hand-drawn ribbons seeded by data identity, stroke styles, seeded hashes, ripple and hemicycle layouts, SQL tokens, unit-grid geometry, and the theme's categorical palette and canvas color. |
| `DUR`, `SETTLE`, `DRAW`, `TRACE`, `SETTLE_CSS`, `DRAW_CSS`, `TRACE_CSS`, `easedStagger` | The story duration table (seconds), three gsap ease names, the same curves as CSS strings, and an eased stagger offset. |
| `xScale`, `yScale`, `clamp01`, `stagger` | Linear scales (d3-scale) for stage coordinates, a 0 to 1 clamp, and per-item progress within one staggered beat. |
| `FILTER_IDS`, `filterUrl` | SVG filters every `StoryStage` defines (marker textures and a glow), referenced as `filter={filterUrl(FILTER_IDS.glow)}`. |
| `LiveTerm`<br>Type: `LiveTermStatus` | A real shell on a slide, one command per click, with a fallback wherever a shell can't run. See [terminal.md](terminal.md). |
| `gsap` | The motion package's gsap instance, re-exported. |

The package also exports `@steamfield/decks/kit/styles.css`. Nothing else is public.

## Theme

The theme is a set of tokens: surfaces, text colors, borders, six color ramps, accents, glows, fonts, shape values, chart colors and a brand. The kit ships defaults (a dark theme in Inter). A deck overrides any part of them with a `theme.json`.

`examples/building-for-agents/setup.ts`:

```ts
import { installTheme, resolveTheme } from "@steamfield/decks/kit";
import deckTheme from "./theme.json";

installTheme(resolveTheme(deckTheme));
```

| Function | Does |
| --- | --- |
| `resolveTheme(deckTheme?)` | Merges the deck's theme over the defaults, resolves aliases, validates, and returns a `Theme`. With no argument it returns the defaults. |
| `installTheme(theme)` | Makes it the active theme: writes its `--od-*` CSS variables into a `<style>` element in `<head>`. Safe to call again; it replaces the previous one. |
| `theme()` | Returns the active theme. Throws if none is installed. |
| `ink(hue, step)` | One color of a ramp. `hue` is `"cyan"`, `"amber"`, `"rose"`, `"emerald"`, `"violet"` or `"slate"`; `step` is 1 to 4, darkest to lightest. |

`setup.ts` runs before any component module, so a component may call `ink()` at module level, as `examples/opendata-pitch/components/BootstrapStage.tsx` does:

```tsx
const RULE_INK = ink("slate", 1);
const DISK_WALL = ink("amber", 3);
```

### A deck's `theme.json`

Write only what differs from the defaults. From `examples/building-for-agents/theme.json`:

```json
{
  "surfaces": {
    "canvas": "#170d21",
    "canvas-cover": "{surfaces.canvas}",
    "surface": "#24143a"
  },
  "ramps": {
    "rose": ["#e23c80", "#ff5798", "#ff86b5", "#ffb9d4"]
  },
  "accents": {
    "pink": "{ramps.rose.2}",
    "screen-black": "#0c0612"
  },
  "fonts": {
    "sans": "'VT323', ui-monospace, monospace"
  },
  "brand": {
    "name": "Steamfield",
    "url": "steamfield.io",
    "logo": null
  }
}
```

- Objects merge key by key. Arrays (`ramps.<hue>`, `categorical`) are replaced whole.
- `{group.token}` is an alias to another token, resolved after the merge. `{ramps.rose.2}` is the same color as `ink("rose", 2)`.
- Each of the six ramps must be four `#rrggbb` colors. `surfaces.canvas` and every `glows` value must be `#rrggbb`. `shape` may only hold `radius`, `hairline` (CSS lengths), `card-width` and `dim` (unitless numbers as strings). A theme that breaks these throws when resolved.
- The hue names are fixed. Recolor a ramp; do not add or rename one.

Groups and the CSS variables they become:

| Group | Keys | CSS variable |
| --- | --- | --- |
| `surfaces` | `canvas`, `canvas-cover`, `surface`, `surface-raised`, `muted` | `--od-<key>` |
| `text` | `primary`, `secondary`, `muted`, `faint`, `dim`, `highlight` | `--od-text` for `primary`, else `--od-text-<key>` |
| `borders` | `default`, `subtle`, `rule`, `axis` | `--od-border` for `default`, else `--od-border-<key>` |
| `accents` | `cyan`, `cyan-bright`, `cyan-soft`, `blue`, `blue-soft`, `violet`, `violet-dim`, `emerald`, `amber`, `amber-soft`, `rose`, `pink`, `slate`, plus any key you add | `--od-<key>` |
| `glows` | `primary`, `secondary`, `amber`, `violet`, `emerald`, `rose` | `--od-glow-<key>-rgb`, an `r, g, b` triplet for `rgba()` |
| `fonts` | `sans`, `serif`, `mono` | `--od-font-<key>` |
| `shape` | `radius`, `hairline`, `card-width`, `dim` | `--od-<key>` |
| `ramps`, `categorical`, `chart` | | Not emitted as CSS. Read them with `ink()` and `theme()`. |
| `brand` | `name`, `url`, `wordmark-gradient`, `logo` | `--od-wordmark-gradient`; the rest is read by `OdCoverHead`. |

In deck CSS use the variables, and in components use `ink()` and `theme()`. Do not write hex colors in either. An accent key you add (`screen-black` above) becomes `--od-screen-black`.

Fonts are not loaded by the theme, except Inter, which the stylesheet ships. A deck that names another font imports it itself, from its stylesheet or `setup.ts`.

## Story stages

A story slide is one stage component per slide. The MDX file only names it and sets the click total (`examples/tides-slide/slides/02-two-a-day.mdx`):

```mdx
---
title: Boston gets two high tides a day.
clicks: 2
---
<TideDayStage />
```

This one plays live on the docs site; its stage is `examples/guide-demos/components/demo-pager-stage.tsx`:

```mdx demo="guide-demos/story-stage"
---
title: Runbooks cut the pages that wake people up.
clicks: 2
---

<PagerStage />
```

The stage component holds the copy, the timeline and the drawing. A condensed `examples/tides-slide/components/TideDayStage.tsx`:

```tsx
import { DUR, ink, StoryCard, StoryLayer, StoryLink, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";

const COPY = [
  { lead: "Water level, hour by hour, for two days.", body: "NOAA prediction for Boston Harbor..." },
  { lead: "High tides arrive 12 h 25 min apart.", body: "That is the average gap..." },
  { lead: "The schedule follows the Moon.", body: "Two tides take 24 hours 50 minutes..." },
];

export function TideDayStage() {
  const line = useRef<LineHandle>(null);
  const rule = useRef<RuleHandle>(null);
  const s = useTween({ dots: 0, chip: 0 });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      rule.current?.addDraw(tl, 0);
    },
    beats: (tl, beat) => {
      beat(0);
      line.current?.addDraw(tl);
      beat(1);
      tl.to(s, { dots: 1, duration: DUR.opacity });
      tl.to(s, { chip: 1, duration: DUR.card });
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={<g>{/* SVG marks in 1920x1080 coordinates */}</g>}
      overlay={
        <>
          <StoryLayer>
            <InkRule ref={rule} x1={220} x2={1700} y={620} />
          </StoryLayer>
          <h2 className="od-story-head">Boston gets two high tides a day.</h2>
          <StoryLink
            href="https://tidesandcurrents.noaa.gov/stationhome.html?id=8443970"
            label="NOAA CO-OPS, station 8443970"
          />
        </>
      }
      card={<StoryCard lead={copy.lead} body={copy.body} />}
    />
  );
}
```

The tides example keeps its own small `InkLine`, `InkRule` and `InkChip` (`examples/tides-slide/components/`) to show how a mark adds its own tween to the stage's timeline through a ref. The kit exports full versions of these and the other Ink marks; see the export list in `packages/kit/src/index.ts`.

### `useStage({ copy, enter, beats })`

Drives a stage from the slide's click.

| Argument | Meaning |
| --- | --- |
| `copy` | One `{ lead, body? }` entry per click state, click 0 first. Needs at least one. |
| `beats` | Builds the click timeline, exactly as the motion package's `useTimeline`: call `beat(0)`, add tweens, `beat(1)`, and so on. |
| `enter` | Optional. Builds a one-shot entrance timeline that plays when the slide is arrived at on click 0, after the slide transition has finished. |

It returns `{ copy, beats, clicks, isActive, playCount, shown }`: `copy` is the entry for the current click, `beats` is `copy.length`, and the rest is what `useScriptedDemo()` returns.

A slide with three copy entries has clicks 0 to 2, so its frontmatter says `clicks: 2`. The click count is not read from a stage component; always set `clicks:`.

Animated values live in `useTween({ ... })` from `@steamfield/decks/motion` and are read in JSX. Use `DUR` for durations and `SETTLE`, `DRAW` or `TRACE` for eases, not raw numbers.

Outside the play view, on a slide that is not active, and when motion is instant, the stage shows the finished state for its click with no animation. The hooks handle that; your marks only need to render from the tweened values.

### `StoryStage`

The frame of a story slide: a 16:9 box centered in the slide that holds an SVG stage and an HTML overlay sharing one coordinate system.

| Prop | Meaning |
| --- | --- |
| `stage` | SVG children, drawn in a `0 0 1920 1080` viewBox. |
| `overlay` | HTML laid over the stage: the headline, labels, links, panels. |
| `card` | The prose card, normally a `StoryCard`. |
| `background` | Content behind the frame that fills the whole slide, such as a full-bleed scene. |
| `beats`, `click` | The number of click states and the current one. With more than one beat a progress rail is drawn at the lower left. Pass the values from `useStage`. |
| `fluid` | Let the frame grow wider than 16:9 (up to 12:5) for reflowable HTML and charts. Leave it off for scenes drawn in fixed coordinates. |
| `enterAfterTransition` | By default a stage arrived at through a slide transition skips its entrance, because the transition brings it in. With this set, the parts that are not handed over by the transition stay hidden during it and enter once it has finished. |
| `className` | Extra classes on the slide root. |

On arriving at click 0 in live motion, the stage fades its parts in, in this order: `.od-story-head` and `.od-enter-a`, then `.od-enter-b`, then the card and `.od-enter-c`, then the progress rail. Put those classes on your own overlay elements to join a group.

Write the headline as `<h2 className="od-story-head">`. It and the card keep their places across the `story` transition.

### Frame units and coordinates

Inside a story slide, size and position in units of the frame, not the window:

| Unit | Is |
| --- | --- |
| `--sw` | 1% of the frame's width: 19.2 stage units. |
| `--sh` | 1% of the frame's height: 10.8 stage units. |
| `--lw` | 1% of the layout width. Equal to `--sw` unless the stage is `fluid`. |

```css
.my-label {
  left: calc(5.7 * var(--lw));
  top: calc(6.2 * var(--sh));
  font-size: calc(1.2 * var(--sw) * var(--deck-text-scale, 1));
}
```

To place an overlay element at a stage coordinate, convert to a percentage of the frame. `STAGE` is `{ width: 1920, height: 1080 }`. `examples/building-for-agents/components/EvidenceTag.tsx`:

```tsx
style={{
  left: `${(x / STAGE.width) * 100}%`,
  top: `${(y / STAGE.height) * 100}%`,
}}
```

The frame is fitted above the credit's band, so nothing in a stage reaches the "Created with Decks" credit.

### `StoryLayer`

A second full-frame SVG layer, in the same 1920x1080 coordinates, for use inside `overlay`. Use it for ink that must sit above overlay HTML, or on an element with a CSS box. Props: `children`, `className`.

### `StoryCard`

The prose card. When `lead` or `body` changes it cross-fades the old copy out and eases its height.

| Prop | Meaning |
| --- | --- |
| `lead` | The card's first line. Required. |
| `body` | Supporting sentence. Optional. |
| `anchor` | `"left"` (default) or `"right"`: which side of the frame it sits on. |
| `hue` | The card's accent, a theme hue. Default `"cyan"`. |

```tsx
card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
```

### `StoryCover` and `StoryLink`

`StoryCover` is a cover or closing slide built on `StoryStage`. `examples/tides-slide/slides/01-cover.mdx`:

```mdx demo="guide-demos/story-cover"
<StoryCover brand
  title={<>Tides run on<br />the Moon's clock.</>}
  lede="Why the sea rises twice a day, and why some coasts get far more of it."
  byline={<><span>Drafted by Claude Code</span><span className="od-dim">•</span><span>Edited by Riley Hilliard</span></>}
/>
```

Props, all optional: `title`, `lede`, `eyebrow`, `byline`, `children` (after the lede), `head` (replaces the brand row), `brand` (show the theme's brand row), `url` (address on the brand row; also shows the row), `field` and `aside` (extra overlay content before and after the text frame), `background`, `center`, `enterAfterTransition`. `examples/building-for-agents/components/CloseStage.tsx` uses `field`, `head` and a QR code in `byline`.

`StoryLink` is a source link pinned to the frame. Props: `href`, `label` (defaults to the URL without its scheme), `opacity`.

## `useScriptedDemo()`

For a component that plays something each time its slide is shown. It returns:

| Field | Meaning |
| --- | --- |
| `clicks` | The click this slide instance renders at. |
| `isActive` | True on the current slide in the play view. |
| `playCount` | How many times the slide has become active. Use it as a `key` or an effect dependency to restart a demo on each visit. |
| `shown(at)` | `clicks >= at`. |

```tsx
const { playCount, shown } = useScriptedDemo();
return shown(1) ? <Terminal key={playCount} /> : null;
```

`useStage` returns the same four fields, so a stage rarely calls this directly.

## `OpenChart` and chart themes

`OpenChart` renders an OpenChart spec (`@opendata-ai/openchart-react`) inside a slide. It fills its parent, so give the parent a size.

| Prop | Meaning |
| --- | --- |
| `spec` | A chart or layer spec. |
| `onMarkHover`, `onMarkLeave` | Passed through to the chart. |

The chart animates in when its slide is arrived at on click 0 in the play view, and renders with animation off everywhere else. It is always drawn in dark mode.

The chart draws at screen size, not canvas size, so font sizes in a spec are screen pixels. Multiply them by the frame scale: `useFrameScale()` returns it, and `scaleChartTheme(theme, scale)` applies it to a chart theme's font sizes and axis spacing. `slideChartTheme` is a chart theme that reads its colors and fonts from the installed kit theme, and `slideChartAnimation` is the entrance timing for slides.

A stage that draws one chart from a module-level `SPEC`, colored with a module-level `DATA = ink("cyan", 2)`:

```tsx
const scale = useFrameScale();
const chartSpec = useMemo<ComponentProps<typeof OpenChart>["spec"]>(() => {
  const base = scaleChartTheme(slideChartTheme, scale);
  return {
    ...SPEC,
    data: [...(SPEC.data ?? [])],
    theme: { ...base, colors: { ...base.colors, categorical: [DATA] } },
    animation: slideChartAnimation,
  };
}, [scale]);

// in the overlay:
<div className="oc-chart" style={place(CHART)}>
  <OpenChart spec={chartSpec} />
</div>
```

A whole slide that defines its chart inline, playing live on the docs site:

```mdx demo="guide-demos/open-chart"
import { useMemo } from "react";
import { ink, OpenChart, scaleChartTheme, slideChartAnimation, slideChartTheme, theme, useFrameScale } from "@steamfield/decks/kit";
import { HOURLY_PAGES } from "../data/demo-hourly-pages";

export function HourlyPagesChart() {
  const scale = useFrameScale();
  const spec = useMemo(() => {
    const { fonts } = slideChartTheme;
    const base = scaleChartTheme({ ...slideChartTheme, fonts: { ...fonts, sizes: { ...fonts.sizes, axisTick: 28, body: 26 } } }, scale);
    return {
      mark: { type: "line", point: true, interpolate: "monotone" },
      data: HOURLY_PAGES,
      encoding: {
        x: { field: "hour", type: "ordinal", sort: null },
        y: { field: "pages", type: "quantitative", scale: { domain: [0, 6] }, axis: { title: "Pages per hour", tickCount: 4 } },
      },
      legend: { show: false },
      responsive: false,
      watermark: false,
      theme: { ...base, colors: { ...base.colors, categorical: [ink("cyan", 3)], axis: theme().text.secondary } },
      animation: slideChartAnimation,
    };
  }, [scale]);
  return (
    <div style={{ width: "100%", height: 440 }}>
      <OpenChart spec={spec} />
    </div>
  );
}

<Cover>
  <p className="od-h2">Night pages peak in the hour after the deploy.</p>
  <div style={{ width: "100%" }}>
    <HourlyPagesChart />
    <p className="od-caption">Pages per hour over four weeks; the deploy runs at midnight. Illustrative figures.</p>
  </div>
  <Step at={1} as="p" enter="rise" className="od-lede">
    The nightly deploy moves to 2 p.m. next sprint.
  </Step>
</Cover>
```

Use `useFrameScale()` only for values handed to `OpenChart`. Anything drawn in ordinary slide CSS or SVG is already scaled with the canvas.

`slideChartTheme` needs an installed theme, so the deck must call `installTheme` in `setup.ts`.

## `ChartSteps`

A chart whose data changes per click: show 2019, then add 2024, then highlight the leader. Marks move to their new values through OpenChart's update animation instead of the chart entering again.

```mdx
---
clicks: 3
---

import { ChartSteps } from "@steamfield/decks/kit";
import { series } from "../data/regions";

<ChartSteps specs={series} at={1} />
```

The demo below plays on the docs site. It passes the frame scale to its spec builder, so the chart's fonts stay in proportion in the small player:

```mdx demo="guide-demos/chart-steps"
---
clicks: 2
---

import { ChartSteps, useFrameScale } from "@steamfield/decks/kit";
import { monthlyPages } from "../data/demo-monthly-pages";

<Cover>
  <p className="od-h2">Night pages fell once runbooks shipped.</p>
  <div style={{ width: "100%", height: 560 }}>
    <ChartSteps specs={monthlyPages(useFrameScale())} at={1} />
  </div>
  <p className="od-caption">Night pages per month, July to December. Illustrative figures.</p>
</Cover>
```

`specs[0]` shows before click `at`, `specs[1]` on click `at`, and `specs[i]` on click `at + i - 1`; the last holds. Keep the mark type and the fields and types of the x, y, colour and key encodings the same across specs, or it throws naming the two specs; give each datum a stable key so its mark can be followed. An inline array is counted (`at + specs.length - 2`); specs imported from a data module need `clicks` in the frontmatter. One click forward or back animates; a jump, instant motion and every other view show the target spec directly. OpenChart itself snaps instead of animating during the entrance, under reduced motion, for marks it cannot tween (ticks), when scale types or transforms change, and past 500 SVG marks.

## `Scene3D`

A three.js scene whose camera and objects move on the slide's clicks. `examples/motion/components/SceneOrbit.tsx`, trimmed:

```tsx
import { Scene3D } from "@steamfield/decks/kit";
import { duration, ease } from "@steamfield/decks/motion";
import type { ComponentProps } from "react";

const setup: ComponentProps<typeof Scene3D>["setup"] = ({ three, scene, camera }, tl, beat) => {
  const cube = new three.Mesh(new three.BoxGeometry(1.4, 1.4, 1.4), new three.MeshStandardMaterial());
  scene.add(cube, new three.AmbientLight("white", 1.2));
  camera.position.z = 12;
  beat(0);
  tl.to(camera.position, { z: 8, duration: duration.base, ease: ease.settle });
  beat(1);
  return () => {
    cube.geometry.dispose();
    cube.material.dispose();
  };
};

export function SceneOrbit() {
  return (
    <div style={{ height: 600 }}>
      <Scene3D label="A cube seen up close" setup={setup} poster={<CubePoster />} />
    </div>
  );
}
```

On the docs site this slide plays live; its `setup` and poster are in `examples/guide-demos/components/demo-rack-scene.tsx`:

```mdx demo="guide-demos/scene-3d"
<Cover>
  <p className="od-h2">Checkout is the service that wakes people up.</p>
  <RackScene />
</Cover>
```

Props: `setup`, `poster` and `label`.

- `setup({ three, scene, camera }, tl, beat)` builds the scene and its timeline. `three` is the three.js module, and `tl` and `beat` work as in `useTimeline` (see [motion.md](motion.md#usetimelinebuild-deps)): call `beat(0)` first, and the tweens between `beat(n - 1)` and `beat(n)` play on click `n`. The scene is drawn on every timeline update. Return a cleanup that disposes what you created; `Scene3D` disposes the renderer itself.
- `poster` is what shows everywhere the scene does not run: the presenter window, the overview, print, an inactive slide, instant motion, and a browser without WebGL 2 (which also logs a warning naming the slide). Draw it as the scene looks at its last beat, usually an SVG.
- `label` is the accessible name of the scene, which has the `img` role.
- The scene fills its parent, so give the parent a size.
- three.js loads the first time a scene goes live, and `window.__deck.settled()` waits for it.
- `setup` is read once each time the scene goes live, so define it outside the component; a new function on each render does not rebuild the scene.
- The steps inside `setup` are not counted, so the slide sets `clicks:` to the last beat.

## The stylesheet

`@import "@steamfield/decks/kit/styles.css";` at the top of the deck's `styles/index.css` loads everything the components need: the Inter font, a small reset scoped to slides, the `od-*` classes, the story frame and marks, and the `story` transition. Put your own rules after it. `examples/building-for-agents/styles/index.css` imports it first and then restyles the headline, the cover and the card with the theme's variables.

Classes the examples use from it: `od-story-head` (stage headline), `od-stage-label` (SVG label text), `od-mono` (monospace text), `od-dim` (de-emphasized text), `od-enter-a`, `od-enter-b`, `od-enter-c` (entrance groups).

Every `font-size` in the stylesheet follows the text scale rule, and yours should too: `calc(<size> * var(--deck-text-scale, 1))`.

## The `story` transition

Set `transition: "story"` in `deck.config.ts`, or on one slide's frontmatter. It needs the kit stylesheet.

Between two slides the frame cross-fades over 600ms while the new slide settles in from a short drift, downward going forward and upward going back. The headline (`.od-story-head`) and the card (`.od-story-card`) hold their places and cross-fade where they stand, so consecutive story slides read as one surface changing. Entering from a slide without a headline or card, they rise in with the frame, the card slightly after the headline.

On the docs site two story slides play live across the transition (`examples/guide-demos/slides/91-story-transition-from.mdx` and `92-story-transition.mdx`); the first carries it:

```mdx demo="guide-demos/story-transition-from..story-transition"
---
title: In July, most alerts had no runbook.
clicks: 1
transition: story
---

<CoverageJulyStage />
```

The hand-off only happens in the play view with live motion. With instant motion, or in the presenter window, slides cut.
