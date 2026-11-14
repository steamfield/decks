# Port brief: `aisd-showcase` on react-decks

This deck is being moved from Slidev (`examples/aisd-showcase/` at the repo root, Vue) to react-decks
(this directory, React and MDX). The Slidev deck is the specification: the port is done when
every frame matches it. Read this whole file before touching anything; your contract names
the slides and files you own.

## Slides

| # | Slidev page | React slide | Stage component (Vue lines) |
| --- | --- | --- | --- |
| 1 | `07-waffle-campuses.md` | `01-waffle-campuses.mdx` | `WaffleStage` (337) |
| 2 | `09-scatter-campuses.md` | `02-scatter-campuses.mdx` | `ScatterStage` (132), `OpenChart` |
| 3 | `09b-campus-map.md` | `03-campus-map.mdx` | `InkCampusMapStage` (277), `CampusHoverCard` (160) |

The React slide number is the slide's position in the Slidev manifest, which is also the
baseline frame number. `styles/chart-theme.ts` is a Vue composable today; port it to a React
hook in the same file.

## What is fixed

- `data/`, `data-sources.md`: copied from the Slidev deck. The values do not change. The
  only edits made were import specifiers (`slidev-addon-decks/story` to `@steamfield/decks/kit`).
  Fix types and formatting only, never a value, a string, or a number.
- `deck.config.ts`, `setup.ts` (installs the theme), `styles/index.css` (the Slidev deck's CSS
  after the kit stylesheet), `package.json`. Ask before changing them; a rule only your slide
  needs goes in a CSS Module beside your component.

## Where code goes

Everything for this deck stays in this directory: `slides/NN-slug.mdx` and
`components/*.tsx` (named exports, auto-provided to slides by name). Do not edit anything under
`react-decks/packages/`. If the deck needs something the kit, motion or runtime does not
provide, stop and ask the orchestrator in one question, saying exactly what is missing. Do not
copy framework code into the deck or reach into a package's `src/`. Do not edit the Slidev deck.

Import from the public names: `@steamfield/decks` (runtime: `useDeck`, `useSlide`),
`@steamfield/decks/motion`, `@steamfield/decks/kit`. The kit now has every Ink/Unit component,
`CodeInk`, `Graph3D` and the story helpers (`useStage`, `useStageEntrance`, `useStageMap`,
`brushRibbon`, `parliament`, ...); read `packages/kit/src/index.ts` for the list.

## Vue to React, as used here

| Vue | React |
| --- | --- |
| `reactive({ a: 0 })` driven by gsap | `useTween({ a: 0 })` from `@steamfield/decks/motion` |
| `useStage({ copy, enter, beats })` | the same call, from `@steamfield/decks/kit` |
| `computed` | compute in render; module scope for constants |
| `ref` to a child + `defineExpose` | `useRef` + `useImperativeHandle` |
| named slots (`#stage`, `#overlay`, `#card`) | props holding nodes: `stage`, `overlay`, `card` |
| `v-for`, `v-if`, `v-show` | `.map` with keys, conditionals, opacity |
| `:style="{ opacity: String(s.x) }"` | `style={{ opacity: s.x }}` |
| `<style scoped>` | a CSS Module beside the component, or rules in `styles/index.css` under the deck's own class |
| `useId()` | `useId()` from React; never a fixed id (a slide renders in several contexts at once) |
| `useNav()`, `useSlideContext()` | `useDeck()`, `useSlide()` from `@steamfield/decks` |
| `slidev-addon-decks/story` | `@steamfield/decks/kit` |
| `slidev-addon-decks/chart-theme` | `@steamfield/decks/kit` |
| `vw`, `vh` in CSS | `cqw`, `cqh` (the slide frame is a size container) |

A slide page becomes MDX: the header comment becomes `{/* ... */}`, the stage element stays,
and the trailing notes comment becomes `<Notes>` with the same text, `[click]` markers
included. Frontmatter carries `title` (from the Slidev manifest stanza). Leave `clicks:` out
when the stage component decides the count: then set `clicks:` to the Slidev stanza's value,
because steps inside a component are not counted.

Outside the `slide` render context (`useSlide().renderContext`), and when motion is instant,
a stage shows the settled state for its click with no animation. `useStage` and `useTimeline`
already do this for timelines; anything else that animates (a canvas, WebGL, a CSS loop)
must do it too. WebGL runs only in the `slide` context.

## Done means the frames match

The Slidev capture is 11 frames at 1920x1080 in `.parity/aisd/` at the repo root
(`s05-c2.png` is slide 5 at click 2; `text.json` has every frame's visible text). From
`react-decks/`:

```sh
node scripts/parity.mjs aisd 3 4        # your slides
```

A frame passes at 0.2% of pixels or fewer. A difference is a difference in the port, not
noise: open the diff image in `.out/`, find the cause, fix the port. Never change the
threshold, the script, or a baseline. A frame with a live canvas or WebGL scene is passed with
`--live sNN-cK` and judged by eye against its baseline; say which and why.

Then look at your slides moving, which frames cannot show: walk each forward and back with the
arrow keys at 1920x1080, capture a few frames mid-beat, and compare the motion with the
Slidev deck (`bun run dev aisd-showcase` at the repo root). Timings come from `DUR` and the
kit's eases, as in the Vue source.

Gate for what you touched: `bun run --cwd react-decks lint` and `typecheck`, plus any copied
`data/*.test.ts`.

## Report

For each slide: the parity rows, what differs and why if anything does, anything you could not
port, and anything you needed from the kit or framework that was missing.
