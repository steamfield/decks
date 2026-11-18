# Clicks, tokens and stage lifecycle

## MDX counts

A slide with `clicks: 3` has states 0, 1, 2, 3. Click 0 is arrival. Forward from the final click crosses the slide boundary; backward enters the previous slide at its last click.

Without explicit `clicks`, the compiler uses the maximum contribution in MDX:

| Element | Count contribution |
| --- | --- |
| `Step`, `Stagger`, `Highlight`, `Draw`, `Mark` | `until` when present, otherwise `at` |
| `TextReveal`, `CountUp` | `at` |
| `Steps` with k children | `from + k - 1` |
| Fenced code with k emphasis states | `at + k - 1` |
| `Camera` or `ShapeMorph` with a literal array of n stops or paths | `at + n - 2` |
| `ChartSteps` with a literal `specs` array of n specs | `at + n - 2` |
| `MotionTemplate` with a literal `template` | `at` plus the template's clicks, minus 1 (one for most, two for `comparison-split` and `myth-fact`, one per literal item for `list-cascade`, `timeline-sweep` and `process-flow`) |

Counted values must be literal nonnegative integers, and `until` must exceed `at`. Computed/spread props or counted elements in expressions need an explicit frontmatter total. `Steps` accepts JSX children or a single Markdown list; Markdown inside JSX needs blank lines around it.

A file in `components/` that re-exports a motion component by name, or the kit's `ChartSteps` or `MotionTemplate`, keeps it counted under its exported name: `export { ChartSteps as Bars } from "@steamfield/decks/kit";` lets `<Bars at={2} specs={[a, b, c]} />` add three clicks with no frontmatter. A deck component that renders one of them internally is not counted.

Inside React components, the compiler cannot count steps or timeline labels. Set MDX `clicks` explicitly. An explicit total overrides counting, so check it manually. `Notes` never adds clicks.

## Primitive details

Read installed declarations for full props; the commonly needed ones are:

- `Step`: `at`, optional `until`, `enter`, `exit`, `as`, `className`. Hidden content stays mounted, retains layout, and is inert and hidden from assistive technology.
- `Steps`: `from`, `enter`, `as`, `className`. One click per child.
- `Stagger`: `at`, optional `until`, `enter`, `as`, `className`. One click for the group.
- Entrance/exit presets: `fade`, `rise`, `drop`, `scale`, `blur`, `wipe`. Select a restrained preset for the argument, not a different effect for every item.
- `TextReveal`: `at`, `by="word"` or `"char"`, `enter`; child must be a plain string.
- `Highlight`: `at`, optional `until`; text remains visible. Its color is `--deck-highlight`.
- `CountUp`: `at`, `from`, `to`, optional `format`. Backward shows the start value immediately. In instant mode it settles according to the click.
- `Draw`: `at`, optional `until`; wraps direct stroked SVG shapes in a `g`. Supply the stroke through CSS.
- `Morph`: `name`, optional `as`, `className`. Same name once per slide, shared by adjacent slides for the same object. Use a valid nonreserved CSS identifier. It does not morph under `cut`.

## Mark

Use `Mark` to draw a rough stroke around or through inline text on a click. Use `Highlight` for a background sweep behind the text. `Mark` keeps the text visible and accessible at every click.

Choose `kind="underline"` (the default), `"circle"`, `"box"`, `"strike"`, `"cross"` or `"bracket"`. Set `at` to the drawing click and optional `until` to the click that removes the stroke. Going backward un-draws the mark. Set `color` to any CSS color, including a theme token such as `var(--accent)`; it defaults to `currentColor`.

```mdx
<Mark kind="circle" at={2} until={4} color="var(--accent)">the evidence</Mark>
```

Marks fit the text box and update when it resizes. Equal boxes produce identical paths across slide, presenter, preview, overview and print. Outside the live slide and in instant mode, the stroke snaps to the pose for that context's click. Set `--deck-mark-width` to change the stroke width (default `3px`).

## Magic move

Use a fence of four or more backticks with `md magic-move` or `markdown magic-move` to morph code between clicks. Put one code fence inside it for each code version. Text between those fences is ignored. The outer fence accepts a title in quotes or Slidev's `[title]` form and `{at: N, lines: true}`; `at` defaults to 0 and line numbers default to off. An inner fence can override numbering with `{lines: false}`.

`````md
````md magic-move "greet.ts" {at: 1, lines: true}
```ts {1}
const greeting = "Hello";
```
```ts {1|2} {lines: false}
const greet = (name: string) => `Hello, ${name}`;
greet("Ada");
```
```ts {all}
export function greet(name: string) {
  return `Hello, ${name}!`;
}
```
````
`````

Ranges use the ordinary code-block syntax: commas and hyphens select lines, `|` separates emphasis clicks, and `all` and `none` are keywords. Each version takes at least one click state. Its first range appears when the morph lands; further ranges each take a click. The total contribution is `at + sum(max(1, range count per version)) - 1`. Before `at`, the first version is visible without emphasis.

Only an adjacent forward click into the next code version morphs in the active live slide. Backward navigation, jumps, first render, instant motion and other contexts show their click's code immediately. Print follows each page's click; final-only print shows the last version. The compiler supplies `MagicMove` and keyed tokens; do not author the component or tokenize code in the browser. Invalid options and ranges report the slide file and line.

## Camera

Use `Camera` to walk an audience through one dense diagram or map. Give its container a height. Each stop frames a point in the children's CSS pixels, measured from their top-left corner. A zoom of 1 keeps their natural size. For an SVG whose rendered width changes, convert landmark positions from its `viewBox` to CSS pixels when choosing stops.

```mdx
<div style={{ height: 600 }}>
  <Camera at={1} stops={[{ x: 600, y: 300, zoom: 1 }, { x: 250, y: 200, zoom: 2 }]}>
    <RouteMap />
  </Camera>
</div>
```

Stop 0 shows before click `at`. Stop 1 arrives on click `at`, and stop `i` arrives on click `at + i - 1`. The last stop holds. A literal array contributes `at + stops.length - 2` to the slide's click total. Set frontmatter `clicks` when the array comes from data, uses a spread, or lives inside a React component. An explicit total replaces the inferred count for the whole slide.

## ShapeMorph

Use `ShapeMorph` when the audience needs to follow the same shape as its outline changes. Place it inside an SVG and set the fill or stroke on the SVG or its enclosing group.

```mdx
<svg viewBox="0 0 100 100" role="img" aria-label="A triangle becomes a square">
  <ShapeMorph at={1} paths={["M50 10L90 90H10Z", "M10 10H90V90H10Z"]} />
</svg>
```

Path 0 shows before `at`, path 1 arrives on `at`, and each following click selects the next path. The last path holds. If either outline is empty or contains only move commands, the target path appears immediately. A literal array contributes `at + paths.length - 2`. For a computed array, a spread, or a morph inside a React component, set frontmatter `clicks` to the total for the whole slide.

## Tokens

Import `duration`, `ease`, `stagger` and `gsap` from `@steamfield/decks/motion`. `duration.quick`, `.base`, `.slow` correspond to `--deck-dur-quick`, `--deck-dur-base`, `--deck-dur-slow`. `ease.enter`, `.exit`, `.settle`, `.draw` correspond to `--deck-ease-enter`, `--deck-ease-exit`, `--deck-ease-settle`, `--deck-ease-draw`. `stagger` corresponds to `--deck-stagger`.

For story timelines use `DUR` and the kit's `SETTLE`, `DRAW`, `TRACE`; their CSS equivalents are `SETTLE_CSS`, `DRAW_CSS`, `TRACE_CSS`. The kit also exports a function named `stagger` for per-item progress, which is different from the motion package's numeric stagger token. Do not confuse their imports.

CSS transitions on duration tokens become instant in instant mode. Custom JavaScript must honor motion mode too. Import the registered `gsap` instance from Decks, not another instance from the raw library.

## React stage construction

Use `useTween({ ... })` from `@steamfield/decks/motion` for stable numeric state read in JSX. `useStage({ copy: COPY, enter, beats })` from the kit builds entrance and click timelines. `enter` is optional; `beats` calls `beat(0)` before any tween, then labels in ascending order without gaps. A tween between `beat(0)` and `beat(1)` plays on click 1. State at click 0 is the initial state.

`COPY` needs an entry for each state, including an empty lead for a deliberate cardless beat. `useStage` returns the current `copy`, `beats` equal to the copy length, and `clicks`, `isActive`, `playCount`, `shown`. Pass those to `StoryStage` and `StoryCard`; MDX sets `clicks` to copy length minus one. The hook clamps copy selection but does not validate this whole agreement for you.

`useTimeline` is the lower-level motion hook for a custom click sequence. It seeks immediately on initial positioning, inactive contexts, instant motion and larger click jumps; adjacent clicks on the active slide tween from the visible position. If dependencies rebuild a timeline, use explicit `fromTo` values so the old end pose cannot become the new baseline.

`useStage` plays its entrance on an arrival at click 0 after any slide transition. It seeks the entrance to its end outside the live slide or on a later-click arrival. Returning to click 0 during the visit must not restart the scene. `StoryStage` also has built-in entrance groups: `od-story-head`, `od-enter-a`, `od-enter-b`, `od-enter-c`, card and progress rail. `enterAfterTransition` lets parts not handed over by a transition enter after it. Do not stack a second fade over the same object without a continuity reason.

Use `useSlide().clicks` for the local instance, not `useDeck().clicks` for the global talk position. A neighboring slide can already be mounted. `useScriptedDemo` supplies visit state for scripted playback, but it does not exempt a custom effect from context and instant-mode rules.

## Handles and identity

Marks such as `InkLine`, `InkBars` and `InkRule` append animation through refs to the parent's timeline. Import their public handle types rather than restating them. Keep timeline-driven children outside any subtree keyed by `playCount`; remounting replaces the instance that the built timeline holds. Reserve visit keys for state the stage timeline does not own.

An omitted position appends. `"<"` means the previous inserted tween's start; a beat label is not a tween. Pass it explicitly only when two changes should happen together. Do not use watchers, timers or DOM mutations to establish evidence that the beat timeline must reverse.

## Contexts and transitions

In `presenter`, `preview`, `overview` and `print`, in an inactive slide, and in instant/reduced motion, show the completed pose for the local click. Overview uses the final click; preview can show the next click rather than the current one. No animation, timers or WebGL there. Custom SVG ids use `useId()` because several instances can coexist.

Deck config `transition` supplies the fallback. Slide frontmatter overrides the boundary from that slide to the next in either direction. Most decks use one or two transitions. Keep a quiet default and save a second transition for meaningful boundaries.

| Preset | When to use it |
| --- | --- |
| `fade` | Move between slides with a quiet cross-fade. |
| `push` | Carry a horizontal sequence across slides. |
| `zoom` | Move between a big picture and its detail. |
| `cut` | Change slides immediately, such as during a rapid comparison. |
| `rise` | Carry a vertical sequence across slides. |
| `cover` | Bring in a new slide over the current one, like a panel. |
| `reveal` | Slide the current view away to show what's underneath. |
| `wipe` | Sweep across two views of the same subject. |
| `iris` | Center a reveal on a focal point, at most once per deck. |
| `blur` | Shift focus to a new subject at a section break. |
| `flip` | Turn from a question to its answer, like a card. |
| `cube` | Turn between distinct faces of one subject. |
| `story` | Preserve headline and card positions across story stages. Provided by the kit stylesheet. |

Use `Morph` for authored object hand-offs so the framework scopes their view-transition names.

`?motion=instant#/2?clicks=1` checks a settled state directly. `window.__deck.settled()` waits for registered motion; after a change in another window, wait for navigation to arrive before waiting for settlement. A custom canvas animation needs the public `registerSettleProbe` API and cleanup if capture must await it; prefer built-in primitives over adding such a loop.
