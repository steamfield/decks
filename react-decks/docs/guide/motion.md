# Motion

Motion in a deck is driven by clicks. A slide has a click total; each key press moves one click forward or back; components decide what to show from the current click. Everything on this page is exported by `@react-decks/motion`, and the components are available in slides without an import.

## Click steps

A slide with a click total of 3 has four states: click 0 (as it first appears), then 1, 2 and 3. The right arrow goes to the next click and, after the last one, to the next slide. The left arrow reverses that and enters the previous slide at its last click.

The click is in the URL (`#/5?clicks=2`), so a reload or a shared link lands on the same state.

### How the total is counted

When a slide's frontmatter has no `clicks`, the total is read from the MDX source at build time. It is the largest of these contributions, or 0:

| Written in the slide | Contributes |
| --- | --- |
| `Step`, `Stagger`, `Highlight`, `Draw` with `at` and optional `until` | `until` if present, else `at` |
| `TextReveal`, `CountUp` with `at` | `at` |
| `Steps` with `from` and `k` children (JSX elements, or one list with `k` items) | `from + k - 1` |
| A fenced code block with `k` highlight steps and `at=<n>` | `at + k - 1` (see [code-blocks.md](code-blocks.md)) |

So this slide has two clicks with no `clicks:` line:

```mdx
<Step at={1}>First</Step>
<Step at={2}>Second</Step>
```

The count is static. It reads the source and never runs it, which sets these rules:

- `at`, `until` and `from` must be literal whole numbers: `at={2}`. An expression, a string or a negative number is an error.
- `until` must be greater than `at`.
- No spread attributes on a counted element (`<Step {...props}>`).
- No counted element inside a JavaScript expression (`{show && <Step at={1} />}`, a `.map()`).
- Children of `Steps` must be JSX elements or a single markdown list.
- A motion component counts under another name when a file in `components/` re-exports it from `@react-decks/motion` (`export { Step as Reveal } from "@react-decks/motion"`), or when the slide imports it from there.
- A deck component that only shares a name with a motion component (`components/Step.tsx`) is not counted.

Steps inside a deck component are not seen, and neither is a component that paces itself from `useSlide().clicks` or `useTimeline`. Such a slide sets the total itself:

```mdx
---
title: useTimeline
clicks: 3
---

<TimelineScene />
```

When `clicks:` is present it wins, and none of the rules above raise an error.

## Step components

Every step component takes `at`, the click at which it appears. The ones that can leave take `until`, the click at which they go.

A step is always rendered, so it keeps its place in the layout while hidden. A hidden step is `aria-hidden` and `inert`. Going back a click plays the same transition in reverse.

Presets, used by `enter` and `exit` (both default to `fade`):

| Preset | Start pose |
| --- | --- |
| `fade` | Transparent. |
| `rise` | Transparent, 24px below. |
| `drop` | Transparent, 24px above. |
| `scale` | Transparent, scaled to 0.92. |
| `blur` | Transparent, blurred 12px. |
| `wipe` | Clipped from the right. |

The examples below are from `examples/motion/slides/`.

### `Step`

Shows its children from click `at`, and hides them again from `until` if given.

```mdx
<Step at={1} until={2} enter="rise" exit="rise">
  <div className="hero-card">Make room for the idea.</div>
</Step>
```

Props: `at`, `until`, `enter`, `exit`, `as` (`"div"` by default; also `"span"`, `"li"`, `"p"`, `"g"` for use inside an SVG), `className`.

### `Steps`

One click per child, starting at `from`. A markdown list as its only child reveals one item per click.

```mdx
<Steps from={1} enter="rise" className="sequence">

1. Frame the question.
2. Reveal the evidence.
3. Connect the pieces.
4. Leave a clear next step.

</Steps>
```

Props: `from`, `enter`, `as` (`"div"` by default; `"ul"` or `"ol"` wraps each child in an `li`), `className`.

### `Stagger`

One click for the whole group. The children enter one after another, 60ms apart.

```mdx
<Stagger at={1} until={2} enter="rise" className="cards">
  <div>Notice</div>
  <div>Compare</div>
  <div>Connect</div>
</Stagger>
```

Props: `at`, `until`, `enter`, `as` (`"div"`, `"ul"`, `"ol"`), `className`.

### `TextReveal`

Reveals text word by word or character by character on one click. Its child must be a plain string. Screen readers get the whole text at once.

```mdx
<TextReveal at={1} by="word" enter="rise">One idea deserves a moment.</TextReveal>

<TextReveal at={1} by="char" enter="blur">{"Stay\ncurious."}</TextReveal>
```

Props: `at`, `by` (`"word"` by default, or `"char"`), `enter`.

### `Highlight`

Sweeps a marker stroke behind inline text from click `at`. The text itself is always visible.

```mdx
Give <Highlight at={1} until={2}>the important part</Highlight> a little space.
```

Props: `at`, `until`. Set the color with the `--deck-highlight` CSS variable; the default is a translucent version of the text color.

### `CountUp`

Shows `from` before click `at` and counts to `to` on it. Going back shows `from` at once.

```mdx
<CountUp at={1} from={0} to={1200} />
```

Props: `at`, `from` (default 0), `to`, `format` (a function from the number to a string; the default rounds and adds thousands separators).

### `Draw`

Draws the strokes of its SVG shape children on click `at`. It renders a `<g>`, so it goes inside an `<svg>`. Direct children that are `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse` or `rect` are drawn; give them a stroke in CSS.

```mdx
<svg className="drawing" viewBox="0 0 1400 500" role="img" aria-label="A rising curve">
  <Draw at={1} until={2}>
    <path d="M 80 400 C 340 400 220 150 520 260 S 890 450 1320 60" />
  </Draw>
</svg>
```

Props: `at`, `until`.

## Hooks

### `useStepState(at, until?)`

Returns the state of a step on the current slide: `"before"`, `"current"`, `"after"` or `"gone"`. Use it to build a step component of your own.

```tsx
import { useStepState } from "@react-decks/motion";

export function Callout({ at }: { at: number }) {
  const state = useStepState(at);
  return <aside className={state === "before" ? "callout is-waiting" : "callout"}>Look here</aside>;
}
```

A component like this is not counted, so its slide sets `clicks:`.

### `useTween(initial)`

Returns a stable object of numbers that gsap can tween. The component re-renders as the values change, so you read them in JSX like any other value.

```tsx
const value = useTween({ radius: 48 });
// ...
<circle cx="750" cy="260" r={value.radius} />
```

Only the fields present in `initial` cause a render. Use it with `useTimeline`, or with `gsap.to(value, { ... })` in an effect.

### `useTimeline(build, deps?)`

Builds a paused gsap timeline with one label per click and keeps it positioned at the slide's click. `examples/motion/components/TimelineScene.tsx`:

```tsx
import { duration, useTimeline, useTween } from "@react-decks/motion";

export function TimelineScene() {
  const value = useTween({ x: 0, turn: 0, color: 0 });
  useTimeline(
    (tl, beat) => {
      beat(0);
      tl.to(value, { x: 320, duration: duration.slow });
      beat(1);
      tl.to(value, { x: 640, color: 1, duration: duration.slow });
      beat(2);
      tl.to(value, { x: 960, turn: 90, color: 2, duration: duration.slow });
      beat(3);
    },
    [value],
  );
  // render from value.x, value.turn, value.color
}
```

`beat(n)` marks where click `n` rests. The tweens between `beat(1)` and `beat(2)` play on the second click.

- Call `beat(0)` first, before adding any tween, then `beat(1)`, `beat(2)` in order. Anything else throws, naming the label.
- A click past the last beat stays on the last beat.
- One click forward or back on the active slide plays to the label. A second press mid-tween continues from the visible position.
- Everything else seeks with no animation: the first positioning, a jump of more than one click, an inactive slide, a context other than `slide`, and instant motion.
- The timeline is rebuilt when `deps` change. A rebuilt timeline of `.to()` tweens starts from whatever the last one left, so a timeline whose `deps` change uses `fromTo`.
- The slide must set `clicks:` to the number of the last beat.

## Motion tokens

Use the tokens instead of raw durations and curves, in JavaScript and in CSS. They are the same values.

| JavaScript | CSS variable | Value |
| --- | --- | --- |
| `duration.quick` | `--deck-dur-quick` | 0.14 s / 140ms |
| `duration.base` | `--deck-dur-base` | 0.3 s / 300ms |
| `duration.slow` | `--deck-dur-slow` | 0.6 s / 600ms |
| `stagger` | `--deck-stagger` | 0.06 s / 60ms |
| `ease.enter` | `--deck-ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `ease.exit` | `--deck-ease-exit` | `cubic-bezier(0.7, 0, 0.84, 0)` |
| `ease.settle` | `--deck-ease-settle` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| `ease.draw` | `--deck-ease-draw` | `cubic-bezier(0.65, 0, 0.35, 1)` |

The JavaScript `ease` values are gsap ease names, and `ease.settle` is gsap's default ease.

```tsx
import { duration, ease, gsap } from "@react-decks/motion";

gsap.to(target, { opacity: 1, duration: duration.base, ease: ease.enter });
```

```css
.panel {
  transition: opacity var(--deck-dur-base) var(--deck-ease-settle);
}
```

Import `gsap` from `@react-decks/motion` (or from the kit, which re-exports it), not from the `gsap` package, so a deck has one instance with the eases registered. When motion is instant the CSS durations and the stagger are `0ms`, so a CSS transition written on the tokens needs no special case.

## Slide transitions

Set a deck's default transition in `deck.config.ts` and override it per slide in frontmatter.

```ts
export default defineDeck({ title: "Motion gallery", transition: "fade" });
```

```mdx
---
title: Transition / push
transition: push
---
```

A slide's `transition` applies to the boundary between it and the next slide, in both directions. Going from slide 4 to 5, or back from 5 to 4, uses slide 4's `transition`, then the deck's, then `fade`. A jump of more than one slide uses the deck's, then `fade`.

| Name | What happens |
| --- | --- |
| `fade` | Cross-fade over `--deck-dur-base`. The default. |
| `push` | The old slide slides out and the new one in, horizontally, over `--deck-dur-slow`. The direction follows the navigation. |
| `zoom` | The old slide scales up and fades while the new one scales in, reversed going back, over `--deck-dur-slow`. |
| `cut` | No transition. |
| `story` | Provided by the kit's stylesheet. See [kit.md](kit.md). |

Transitions use the browser's View Transitions API. A change is applied with no animation when the browser lacks the API, motion is instant, the view is not the play view, or the target slide's module has not loaded yet.

To define your own, pick a name, use it in `transition`, and style the root snapshots. While a transition runs, `<html>` has `data-deck-transition="<name>"` and `data-deck-nav="forward"` or `"backward"`.

```css
html[data-deck-transition="lift"]::view-transition-old(root) {
  animation: lift-out var(--deck-dur-slow) var(--deck-ease-settle) both;
}
html[data-deck-transition="lift"]::view-transition-new(root) {
  animation: lift-in var(--deck-dur-slow) var(--deck-ease-settle) both;
}
```

A name with no CSS gets the browser's default cross-fade.

A deck's `layers/above.tsx` holds still while slides transition under it. See [config.md](config.md).

## `Morph`

`Morph` gives an element an identity that survives a slide change. Put a `Morph` with the same `name` on two neighbouring slides and the element moves and resizes from its old place to its new one while the rest of the slide transitions.

`examples/motion/slides/20-morph-start.mdx` and `21-morph-end.mdx`:

```mdx
<Morph name="gallery-card" className="morph-card compact">
  <strong>Room to grow.</strong>
</Morph>
```

```mdx
<Morph name="gallery-card" className="morph-card expanded">
  <strong>Room to grow.</strong>
</Morph>
```

Props: `name`, `as` (`"div"` by default; also `"span"`, `"h1"`, `"h2"`, `"h3"`, `"p"`, `"figure"`, `"g"`), `className`.

- `name` must be a CSS identifier starting with a letter or underscore. CSS keywords (`none`, `auto`, `root`, `inherit` and the like) and `deck-layer-above` are reserved. A bad name throws.
- Use each name once per slide.
- The morph works under any transition preset except `cut`.

To morph between clicks of one slide, set `morphSteps: true` in its frontmatter. Each click then runs through a view transition in which only named elements move. `examples/motion/slides/22-morph-steps.mdx` and `components/MorphSteps.tsx`:

```mdx
---
title: Morph / steps
clicks: 1
morphSteps: true
---

<MorphSteps />
```

```tsx
export function MorphSteps() {
  const { clicks } = useSlide();
  return (
    <Morph name="step-card" className={`morph-card ${clicks ? "expanded" : "compact"}`}>
      <strong>Keep the thread.</strong>
    </Morph>
  );
}
```

## Motion mode

Motion is either `live` or `instant`. The mode is the `data-deck-motion` attribute on `<html>`. It is `instant` when any of these holds, and `live` otherwise:

- the view is not the play view (the presenter window and the overview never animate);
- the system asks for reduced motion (`prefers-reduced-motion: reduce`);
- the URL's search string has `motion=instant`, as in `http://localhost:3030/?motion=instant#/4`.

In instant mode every state is shown at its end pose: steps do not transition, slide changes cut, `useTimeline` seeks, `CountUp` shows its final number.

In your own components, read the mode with `motionMode()`. It reads the DOM, so call it in an effect or a handler, never during render:

```tsx
import { gsap, motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";

const { isActive, renderContext } = useSlide();
useLayoutEffect(() => {
  if (!isActive || renderContext !== "slide" || motionMode() === "instant") {
    gsap.set(el.current, { opacity: 1 });
    return;
  }
  const tween = gsap.fromTo(el.current, { opacity: 0 }, { opacity: 1 });
  return () => {
    tween.kill();
  };
}, [isActive, renderContext]);
```

In CSS, select on `html[data-deck-motion="instant"]`, or just use the duration tokens.

Use `?motion=instant` for screenshots and for checking the end state of each click.

## `window.__deck.settled()`

`window.__deck.settled()` returns a promise that resolves when the deck has stopped moving: no slide transition in flight, no gsap tween or `useTween` update pending, and no finite CSS animation or transition running, for two animation frames in a row. Animations that loop forever are ignored, so a spinning logo does not block it. It never rejects.

Use it in browser automation instead of sleeping:

```ts
await page.keyboard.press("ArrowRight");
await page.evaluate(() => window.__deck?.settled());
await page.screenshot({ path: "slide.png" });
```

After a change made in another window, wait for the URL to change first; the sync message may not have arrived yet.

A component that animates outside gsap and CSS (a canvas loop, a chart library) can report itself busy with `registerSettleProbe` from `@react-decks/runtime`:

```tsx
import { registerSettleProbe } from "@react-decks/runtime";

useEffect(() => registerSettleProbe(() => busy.current), []);
```
