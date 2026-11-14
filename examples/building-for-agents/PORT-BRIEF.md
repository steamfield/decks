# Port brief: `building-for-agents` on react-decks

This deck is being moved from Slidev (`examples/building-for-agents/` at the repo root, Vue)
to react-decks (this directory, React and MDX). Riley presents it next week. The Slidev deck
is the specification: the port is done when every frame matches it. Read this whole file
before touching anything; your contract names the slides and files you own.

## What is fixed

- `DESIGN.md`, `OUTLINE.md`, `PROSE.md`, `data-sources.md`: the deck's own contracts. The copy,
  figures, colors, type and layout are decided. Do not redesign, reword or "improve" anything.
- `data/`, `scene/`, `public/`, `theme.json`: copied from the Slidev deck. The values in them do
  not change. They may need type or lint fixes to pass this workspace's checks: fix types and
  formatting only, never a value, a string, or a number.
- `deck.config.ts`, `setup.ts` (installs the theme).

## Where code goes

Everything for this deck stays in this directory. The CRT overlay, the barrel warp, the
monitor frames, the code and terminal panes, the repo tree, the thread rail, the night-drive
scene and every stage are this deck's own and are not shared with other decks.

- Do not edit anything under `react-decks/packages/`. If the deck needs something the kit
  (`@steamfield/decks/kit`), the motion package or the runtime does not provide, stop and ask the
  orchestrator in one question, saying exactly what is missing. Do not work around it by
  copying framework code into the deck or by reaching into a package's `src/`.
- Do not edit the Slidev deck at `examples/building-for-agents/`.

## Layout of the React deck

```
deck.config.ts  setup.ts  theme.json
slides/NN-slug.mdx        one per Slidev page, same numbers and slugs
components/*.tsx          auto-provided to slides by name (named exports)
layers/above.tsx          the tube: CRT glass over every slide (was global-top.vue)
styles/index.css          imports @steamfield/decks/kit/styles.css, then the deck's own
data/  scene/  public/
```

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

The Slidev capture is 68 frames at 1920x1080 in
`/private/tmp/claude-501/-Users-riley--claude-spares-spare-BdMOe7/636427da-5e73-4422-94d4-718ee4e977c5/scratchpad/bfa-baseline/`
(`s04-c2.png` is slide 4 at click 2; `text.json` has every frame's visible text). From
`react-decks/`:

```sh
node scripts/parity.mjs agents 4 5 --live s01-c0,s19-c0 --ready ".od-slide:not(.sf-tube-host) .od-story-frame"   # your slides
```

A frame passes at 0.2% of pixels or fewer. Two Slidev captures of the same deck are identical
on 66 of the 68 frames, so a difference is a difference in the port, not noise. Open the
diff image in `.out/`, find the cause, fix the port. Never change the threshold, the script,
or a baseline. The cover and the close (slides 1 and 19) run a live scene and are judged by
eye against their baselines.

Then look at your slides moving, which the frames cannot show: walk each forward and back
with the arrow keys in a browser at 1920x1080, capture a few frames mid-beat, and compare the
motion with the Slidev deck (`bun run dev agents` at the repo root). Timings come from `DUR`
and the eases from the kit, as in the Vue source.

The workspace gate also has to pass for what you touched: `bun run --cwd react-decks lint`
and `typecheck`. This deck has no unit tests of its own beyond the copied `data/*.test.ts`.

## Report

For each slide: the parity table rows, what differs and why if anything does, anything you
could not port, and anything you needed from the kit or framework that was missing.
