# Writing slides

A slide is one MDX file under `slides/`: optional YAML frontmatter, then markdown and JSX. The filename sets its order and its id.

```mdx demo="guide-demos/three-steps"
---
title: Three steps
clicks: 3
---

<h1>Three steps</h1>

<StepList />

<Notes>
Start here.

[click] First point.

[click] Second point.

[click] Third point.
</Notes>
```

That is `examples/basic/slides/02-steps.mdx`. `StepList` comes from `examples/basic/components/StepList.tsx` and is used without an import.

Markdown and JSX mix freely. Markdown inside a JSX element needs blank lines around it, which is MDX's rule:

```mdx demo="guide-demos/markdown-in-jsx"
<Steps from={1} enter="rise">

1. Frame the question.
2. Reveal the evidence.

</Steps>
```

A slide can also import and declare things at the top, as any MDX file can:

```mdx
---
title: Building for agents
---
import { StoryCover } from '@steamfield/decks/kit'
import { BYLINE } from '../data/01-cover'

export const month = new Date(`${BYLINE.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
```

## Frontmatter

| Key | Accepted values | Default | Meaning |
| --- | --- | --- | --- |
| `title` | string | the slide's id | Shown in the overview and used as the tile's accessible name. |
| `clicks` | whole number, 0 or greater | counted from the slide | Number of clicks after the initial state. Set it when a component paces itself from the click, or when the count cannot be read from the MDX. See [motion.md](motion.md). |
| `hide` | `true`, `false` | `false` | A hidden slide is dropped before numbering and never compiled. |
| `transition` | non-empty string | the deck's `transition`, else `fade` | Transition between this slide and the next one, in both directions. Built in: `cut`, `fade`, `push`, `zoom`, `rise`, `cover`, `reveal`, `wipe`, `iris`, `blur`, `flip`, `cube` (see [motion.md](motion.md#slide-transitions)). |
| `morphSteps` | `true`, `false` | `false` | Clicks on this slide run through a view transition, so a `Morph` can move between clicks. |
| `layers` | `false`, `"above"`, `"below"` | both layers | Which of the deck's layers this slide shows. `false` shows neither. It does not affect the credit. |

Any other key is kept and reaches components through `useSlide().frontmatter`. A value of the wrong type is an error naming the file and the key. A deck where every slide is hidden is an error.

## Speaker notes

Put notes in one `<Notes>` block. It is removed from the slide at compile time and shown in the presenter window. Its content is markdown.

A line that starts with `[click]` begins the notes for the next click. `[click:3]` skips ahead three clicks. Text before the first marker belongs to click 0. The presenter marks the segment for the current click.

```mdx
<Notes>
Say this when the slide appears.

[click] Say this after the first click.

[click:2] Say this after the third click.
</Notes>
```

Rules:

- One `<Notes>` per slide. A second one is an error.
- Write it as a block of its own, not inside a JSX expression such as `{cond && <Notes>...</Notes>}`.
- A marker only counts at the start of a line. `Say [click] here` is plain text.
- Notes do not add clicks. Markers describe clicks the slide already has.
- Steps and code blocks inside `<Notes>` are neither counted nor rendered.

## Components without imports

Every slide can use these names with no import.

| Source | Names |
| --- | --- |
| The deck's `components/*.tsx` | Every named export under its own name; a default export under the file's basename. |
| Motion (`@steamfield/decks/motion`) | `Step`, `Steps`, `Stagger`, `TextReveal`, `Highlight`, `CountUp`, `Draw`, `Morph`, `Mark`, `Camera`, `ShapeMorph` |
| Layouts (`@steamfield/decks`) | `Center`, `Cover`, `Section`, `TwoCol`, `ImageSide` |
| Navigation (`@steamfield/decks`) | `Toc`, `Link` |
| Built in | `Notes`; fenced code blocks render through `CodeBlock` |

A deck component with the same name as a framework one replaces it for that deck. A replaced motion component no longer adds clicks.

Rules for `components/`:

- Only `.tsx` files directly in the folder are scanned. Put helpers in other folders or in `.ts` files.
- Two files exporting the same name is an error naming both.
- `export * from "..."` is an error. Re-export by name.
- Type-only exports are ignored.

Kit components are not provided automatically. Re-export the ones you want, as `examples/tides-slide/components/chrome.tsx` does:

```tsx
export { StoryCover } from "@steamfield/decks/kit";
```

or import them in the slide. Either way, `ChartSteps` and `MotionTemplate` add their clicks to the slide's total.

A capitalized JSX name that is not provided, exported from `components/`, or imported or declared in the slide is a compile error:

```
slides/03-x.mdx:3:1: <Nonexistent> is not defined. Export it from a file in components/ or import it in the slide.
```

Lowercase elements and member names such as `<motion.div>` are not checked.

## Links between slides

`<Link to={5}>the results</Link>` is a link to slide 5 at click 0. In the play view and the presenter window a click goes there, and in a synced talk the other windows follow. A `Cmd`- or `Ctrl`-click opens the slide in a new tab, which joins the talk's sync and then follows the talk's position. A `to` that is not a slide number in the deck is an error naming it.

`<Toc />` is an agenda: a numbered list of every slide's title as a `Link`, with the current slide marked (`aria-current="page"`). Slides without a `title` in their frontmatter are listed by number, and hidden slides are left out.

In the overview, a preview, and print, both render as plain text, so a thumbnail never navigates.

```mdx
---
title: What this talk covers.
---

<h1>What this talk covers.</h1>

<Toc />
```

## Built-in layouts

Layouts arrange their children and nothing else. They set no fonts, colors or sizes. Each fills the slide and pads its content with `--deck-pad-x` (120px) and `--deck-pad-y` (96px); the gap between children is `--deck-gap` (80px). Override the variables in your CSS.

| Layout | Arrangement | Props |
| --- | --- | --- |
| `Center` | Children centered on both axes. | none |
| `Cover` | Children stacked, centered vertically, aligned to the start. A title slide. | none |
| `Section` | Children anchored to the bottom start corner. A section divider. | none |
| `TwoCol` | Two columns. Requires exactly two element children. | `ratio`: `"1:1"` (default), `"2:1"`, `"1:2"`, `"3:2"`, `"2:3"`. `align`: `"start"` (default), `"center"`, `"end"`. |
| `ImageSide` | An image filling one side edge to edge, children on the other. | `src` and `alt` (required; an empty `alt` marks the image decorative). `side`: `"left"` (default), `"right"`. `ratio`: `"1:1"` (default), `"2:1"`, `"1:2"`. |

On the docs site each layout below plays live above its code; the slides are in
`examples/guide-demos/slides/`, and each adds one click so the second element can enter.

```mdx demo="guide-demos/layout-center"
<Center>
  <p className="od-title">Every outage gets a written review.</p>
  <Step at={1} as="p" enter="rise" className="od-lede">
    Shared with the whole team, with no names attached.
  </Step>
</Center>
```

```mdx demo="guide-demos/layout-cover"
<Cover>
  <p className="od-title">What a quarter of on-call<br />taught us about alerts.</p>
  <Step at={1} as="p" enter="rise" className="od-lede">
    How we cut the pages that wake people up at night.
  </Step>
</Cover>
```

```mdx demo="guide-demos/layout-section"
<Section>
  <p className="od-title">Automate the fix<br />before you page a person.</p>
  <Step at={1} as="p" enter="rise" className="od-lede">
    Restarts and rollbacks now run on their own.
  </Step>
</Section>
```

```mdx demo="guide-demos/layout-two-col"
<TwoCol ratio="2:1" align="center">
  <p className="od-title">Write the runbook<br />before the alert.</p>
  <Step at={1} as="p" enter="rise" className="od-lede">
    A new alert ships only with a linked runbook, so whoever is paged knows the first step.
  </Step>
</TwoCol>
```

```mdx demo="guide-demos/layout-image-side"
<ImageSide src="field.svg" alt="Mint paths converge around an amber circle on a dark field" side="right">
  <p className="od-title">Every alert routes<br />to one owner.</p>
  <Step at={1} as="p" enter="rise" className="od-lede">
    Escalations follow the service map, not the org chart.
  </Step>
</ImageSide>
```

`field.svg` is `examples/guide-demos/public/field.svg`. In a window that is not 16:9 the layouts use the extra canvas: columns widen and centered content stays centered.

## `useDeck()` and `useSlide()`

Both come from `@steamfield/decks`. Use them in components rendered from a slide or a layer. Outside a deck or a slide they throw an error that says so.

```tsx
import { useDeck, useSlide } from "@steamfield/decks";

export function SlideStatus() {
  const { slide, total } = useDeck();
  const { no, clicks, clicksTotal, isActive } = useSlide();
  return (
    <p>
      Slide {no} of {total}, click {clicks} of {clicksTotal}
      {isActive && slide === no ? ", active" : ""}
    </p>
  );
}
```

`useDeck()` describes the whole deck:

| Field | Meaning |
| --- | --- |
| `slide`, `clicks` | The deck's current slide number and click. |
| `total` | Number of visible slides. |
| `clicksTotal` | Click total of the current slide. |
| `slides` | Every slide's `no`, `id`, `file`, `title`, `clicks`, and `transition` and `morphSteps` when set. |
| `view` | `"play"`, `"presenter"`, `"overview"` or `"print"`. |
| `isPrint` | `view === "print"`. |
| `embedded` | True when the page was opened with `?embedded`. |
| `next()`, `prev()` | One click forward or back, crossing slides at the ends. |
| `nextSlide()`, `prevSlide()` | To the neighbouring slide at click 0. |
| `go(slide, click?)` | To a slide, clamped to the deck. |

`useSlide()` describes the slide this component instance is rendered in:

| Field | Meaning |
| --- | --- |
| `no`, `id` | This slide's number and id. |
| `clicks` | The click this instance renders at. Not always the deck's click: see below. |
| `clicksTotal` | This slide's click total. |
| `isActive` | True only for the current slide in the play view. |
| `renderContext` | Which of the five contexts this instance is in. |
| `frontmatter` | The slide's frontmatter as written, custom keys included. |

Pace a component from `useSlide().clicks`, not from `useDeck().clicks`. `examples/basic/components/StepList.tsx`:

```tsx
export function StepList() {
  const { clicks } = useSlide();
  return (
    <ol>
      {POINTS.slice(0, clicks).map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ol>
  );
}
```

A component like this adds no counted clicks, so its slide sets `clicks: 3`.

## The five render contexts

The same slide is rendered in several places, sometimes at once.

| `renderContext` | Where | `clicks` | `isActive` |
| --- | --- | --- | --- |
| `slide` | The play view. The current slide and the slides before and after it are mounted; the neighbours are hidden. | The deck's click on the current slide; the full total on the one before; 0 on the one after. | True on the current slide only. |
| `presenter` | The presenter window's current slide. | The deck's click. | False |
| `preview` | The presenter window's "Next" box. | The click the next key press leads to. | False |
| `overview` | An overview tile. | The slide's last click. | False |
| `print` | The print view (`#/print`), which `decks export` captures. | The frame's click step, or the last click with `?print=final`. | False |

What a component must do:

- Render the finished state for its `clicks` whenever `renderContext` is not `"slide"`, or `isActive` is false, or motion is `instant`. No animation, no timers, no WebGL. The framework's motion components and hooks already do this.
- Never assume it is the only instance. Use `useId()` for ids (SVG filters, gradients, `aria-labelledby`), not fixed strings.
- Never read or write `window.location`. Position comes from the hooks.
- Start work that should happen once per visit (an entrance animation, a scripted demo) from `isActive`, not from mount. A neighbouring slide is mounted before it is shown.

`examples/building-for-agents/layers/above.tsx` shows the pattern for an expensive effect:

```tsx
const { view, embedded } = useDeck();
const { renderContext, isActive } = useSlide();
const on = renderContext === "slide" && isActive && view === "play" && !embedded;
```

For CSS, each slide root carries `data-deck-slide="<no>"`, `data-deck-context="<context>"`, and `data-deck-active` on the current slide of the play view.
