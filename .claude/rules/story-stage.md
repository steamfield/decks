---
paths:
  - "examples/*/components/*Stage.vue"
  - "decks/*/components/*Stage.vue"
  - "packages/decks/story/**"
  - "packages/decks/components/{Story,Ink,Unit,CodeInk,RowStrip,Graph3D}*.vue"
  - "packages/decks/styles/story-*.css"
  - "examples/*/styles/*.css"
  - "decks/*/styles/*.css"
---

# Story stage authoring

A story slide is one pinned visualization whose state animates from beat to
beat on arrow keys, with a floating prose card carrying the arc. This file is
the authoring contract for a stage component. The engine's full API,
lifecycle, and component list live in `packages/decks/story/README.md`<!-- decks:repo-only -->; read
that before touching `packages/decks/story/` itself<!-- /decks:repo-only -->. `examples/opendata-pitch`
is the reference deck<!-- decks:repo-only -->; `examples/od-story-templates` is the gallery of isolated
patterns<!-- /decks:repo-only -->.

## Write a stage on `useStage`

Every stage is built the same way: a beat script over a reactive state
object, a card copy array indexed by beat, and an optional one-shot enter
motion. `useStage` (`packages/decks/story/stage.ts`) composes `useScriptedDemo`,
`beatCopy`, `useStageEntrance`, and `beat()` so a stage writes only the parts
that differ:

```ts
import { reactive, ref } from 'vue'
import { DRAW, DUR, stagger, useStage, type GrowHandle } from 'slidev-addon-decks/story'
// The slide's figures, one module per slide. See `.claude/rules/deck-data.md`.
import { CONVERSATIONS } from '../data/signals'

const s = reactive({ rows: 0, answer: 0 })
const reach = ref<GrowHandle | null>(null)

const { clicks, copy, beats } = useStage({
  copy: [
    { lead: 'Ask a question in plain English.', body: 'No SQL, no schema browsing.' },
    { lead: 'The answer cites its rows.' },
    { lead: 'Every claim traces to a query.' },
  ],
  enter: (tl) => reach.value?.addGrow(tl, 0),
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { rows: 1, duration: DUR.scale, ease: DRAW })
    beat(1)
    tl.to(s, { answer: 1, duration: DUR.card }, `+=${DUR.opacity}`)
    beat(2)
  },
})
const rowProgress = (i: number) => stagger(s.rows, i, CONVERSATIONS.length, 0.16)
```

`<StoryStage :beats="beats" :click="clicks">` takes `beats` straight from the
call; do not hand-count a `:beats="3"` literal, and do not write
`tl.addLabel('beatN')` by hand outside of `useStage` and the lower-level
`useStoryTimeline`. Both timelines build inside `onMounted`, so a beat script
may drive a child through a template ref (`reach.value?.addGrow(...)`).

## Lifecycle, in one line

Mount picks up a template ref, decides whether to run the one-shot entrance
(real slide view, active, landing on beat 0, no view transition in flight),
then seeks or tweens the beat timeline to the current click. `playCount`
bumps on re-entry; bound as `:key` it remounts that subtree so anything
stateful inside starts over. See `packages/decks/story/README.md` for the full
ordered list and the per-context table (slide / presenter / overview /
print-export).

Anything the beat script drives through a template ref stays **outside** that
key. Both timelines are built once at mount and hold the child instances that
existed then, so a remount leaves them animating orphans while fresh children
sit on screen at their resting state, and the line never sweeps. A
timeline-driven mark re-arms on re-entry without the key; keep the key for
state no timeline owns (a CSS keyframe, a canvas, a child with its own
playhead).<!-- decks:repo-only --> `handle-refs.test.ts` fails on a driven ref inside the key.<!-- /decks:repo-only -->

<!-- decks:repo-only -->
## Beats, COPY, and clicks must agree, and now something checks it

Three numbers used to be kept in three places by hand: the copy array's
length, the `:beats` count, and `clicks:` in the page's manifest stanza.
`useStage` ties the first two together by construction. `beats.test.ts`
checks all three for every deck `test-decks.ts` finds (any registered deck
whose `slides.md` contains `data-od-story`), and also enforces the card
budget: eight words for `lead`, twenty for `body`. A card that already
carries more than budget is pinned by name in `OVER_BUDGET_TODAY` inside the
test; trimming the copy is a content decision, and the pin entry comes out
the same commit the copy is trimmed.
<!-- /decks:repo-only -->
<!-- decks:user: ## Beats, COPY, and clicks must agree

Three numbers have to agree: the copy array's length, the `:beats` count,
and `clicks:` in the page's manifest stanza, which is the beat count minus
one. `useStage` ties the first two together by construction; keep `clicks:`
in step by hand, and confirm it with `bun run shot`, which prints one card
lead per click. The card budget is eight words for `lead` and twenty for
`body`. -->

A beat with no card is `{ lead: '' }`: it still counts toward the beat count,
and the template hides the card at that beat with `v-if="copy.lead"`. Do not
skip the array entry to save the beat.

## Frame units

Ink is drawn in a 1920x1080 viewBox; the overlay is laid out in CSS. The two
only coincide inside `.od-story-frame`, the largest 16:9 box that fits the
viewport (`--od-fw`/`--od-fh` in `story-frame.css`). Anything sized relative
to that frame uses `calc(N * var(--sw))` / `calc(N * var(--sh))`, never a raw
`vw`/`vh`: on a screen that is not 16:9 (which is what full screen usually
gives you) a viewport unit sizes off the window while everything around it
sizes off the frame, and the slide clips.<!-- decks:repo-only --> `frame-units.test.ts` scans every
story deck's components, pages, data, and styles for a raw viewport length
and fails on one outside its small allowlist (the frame's own `--od-fw`/
`--od-fh` declarations, the cover background gradient, the drift keyframes,
and a documented fallback pattern).<!-- /decks:repo-only --> `useStageMap()` converts between viewBox
units and overlay percentages for anything that has to sit on top of a mark.

## `StoryLayer` and view-transition hand-offs

`StoryLayer` (`packages/decks/components/StoryLayer.vue`) is a second full-bleed svg
over the stage, for ink that needs to sit on an HTML element so it can carry
a `view-transition-name`. An svg `<g>` cannot carry one; a div can. The
caller's `class` (a `vt-*` name) falls through to the wrapping div.

A hand-off is two rules<!-- decks:repo-only --> in `story-frame.css`<!-- /decks:repo-only --><!-- decks:user: , in `packages/decks/styles/story-frame.css` for the addon's own and in the deck's `styles/index.css` for a deck-local one -->: one assigns the
`view-transition-name` under `.vt-on` (set only in the real slide view, from
`$renderContext === 'slide'`), one nulls it again inside the presenter, the
print container, and the overview, collapsed into a single `:is(...)` rule.
Only adjacent slides may share a name.<!-- decks:repo-only --> `vt-names.test.ts` compares the set of
`vt-*` classes assigned under `.vt-on` against the set nulled in the `:is()`
list and fails if either side is missing one, so adding a hand-off is one new
name in two places, not three selector lists. `.od-story-head` and
`.od-story-card` also carry names without a `vt-` class of their own and are
checked the same way; `vt-on` itself is the gate class, not a hand-off name,
and is excluded from both sides of the comparison.<!-- /decks:repo-only --><!-- decks:user:  Every name assigned under `.vt-on`
goes in the `:is()` list too, so adding a hand-off is one new name in two
places. -->

## Mark style and hue

`STORY_STYLE.ink` selects the deck-wide mark style (`clean`, the default:
crisp stroked paths and rects with a soft same-hue glow). A new mark
component reads `inkStyle()` at setup and either supports both styles or
documents that it is clean-only. `ink(hue, step)` (`packages/decks/story/ramps.ts`)
returns one of four ramp steps for a token hue (`cyan`, `amber`, `rose`,
`emerald`, `violet`, `slate`); step 1 is the floor and holds 3:1 against the
canvas. The ramps come from the deck theme: a deck's `theme.json` can recolor
any of the six hues (four `#rrggbb` steps, lighter as they go, replaced whole)
but not rename or add one, and <!-- decks:repo-only -->`theme.test.ts` holds step 1 to 3:1<!-- /decks:repo-only --><!-- decks:user: step 1 has to hold 3:1 --> against
`surfaces.canvas`. A stage reads every color through `ink()` or
`slidev-addon-decks/theme`, never a hex literal, so a recolor reaches it. Grey is the default ink; one saturated series per stage carries the
`hue` argument. Seeds for anything hashed (`brushRibbon`, `InkLine`) come from
data identity, never geometry, so a resize or HMR never shimmers the ink.

## Chip and card placement

`InkChip` is a small floating label placed with `xScale`/`yScale` at the same
coordinates as the mark it annotates, `hue` matching the ink beside it,
`progress` driven by the beat. `StoryCard` is the one prose surface per
slide; it never moves within a slide, only its content cross-fades (`riseIn`
in, `fadeOutInPlace` out). Match its `hue` to the ink it sits beside. At most
two live text zones per beat: the card plus one chip or end label.

## Reserved regions

Two parts of the frame belong to the overlay, and the stage's ink stays out
of them; everything else is the stage's, including the left third. Lay the
visual out across the whole free area rather than squeezing it into the
half the card doesn't cover. Figures below are at 1920x1080 (frame units in
brackets) and come from `story-frame.css` and `story-marks.css`:

- **Headline band**: `.od-story-head`, top left at `top: calc(6.2 * var(--sh))`,
  `left: calc(5.7 * var(--lw))`, `64lw` wide (`88lw` with `.is-wide`). Two
  lines of headline end near y = 175 (16sh); keep the top 16sh of the
  headline's columns, x 110 to 1340 (5.7lw to 69.7lw), clear. An
  `.is-wide` headline never wraps (`white-space: nowrap`), so its band is one
  line, to about y = 120, across x 110 to 1800.
- **Card column**: `.od-story-card`, bottom anchored at
  `bottom: calc(12 * var(--sh))` (y = 950), `calc(var(--od-card-width) * var(--lw))`
  wide (36lw, 691px) and `5.7lw` in from the side it anchors to. Its height
  follows its copy, so reserve it at the full budget (an eight-word lead and a
  twenty-word body), about 240px: y 710 to 950 (66sh to 88sh), over
  x 110 to 800 for `anchor="left"` and x 1120 to 1810 for `anchor="right"`.

A deck that changes these (`shape.card-width` in `theme.json`, or its own
headline rule) moves the regions with them; measure with `bun run shot`
rather than trusting the numbers above.

## Entrance vs beat

Two separate motion systems, and mixing them up is the most common authoring
mistake. The beat timeline is a pure function of the click index and is
seekable in both directions; it never plays automatically. The entrance is a
one-shot settle that only ever plays once, on landing at beat 0 in the real
slide view with no view transition in flight. Landing on a later beat
(arriving backwards) or through a view transition skips it outright, because
an entrance mid-transition would put opacity 0 into the transition's
snapshot. Put a mark's resting-state setup in `enter`, never in `beats` before
`beat(0)`.

## Child handles via refs

A child that grows itself off its own baseline (`InkLine`, `InkBars`, `InkRule`)
does not own a timeline; it exposes `addGrow`/`addDraw`/etc. and the parent's
beat script adds tweens to a ref. `GrowHandle`, `BarsHandle`, and `LineHandle`
in `packages/decks/story/types.ts` are the exposed shapes; a stage that holds a ref to
one imports the type rather than restating the signature. Two rules come with
them: the ref'd child stays outside the `playCount` key (see above), and an
omitted position appends. `'<'` means "the start of the previously inserted
tween", not "the end of the timeline", and `beat()` does not count as an
insert, so a defaulted `'<'` in `beat(0); grow(a); beat(1); grow(b)` lands
both figures on beat 1 and leaves the later beats advancing the card against
a frozen stage. `resolvePosition` in `packages/decks/story/timeline.ts` carries the
detail; pass `'<'` explicitly when two marks really should move together.

## Story headmatter

```yaml
transition:
  name: od-cut
  css: false
htmlAttrs:
  data-od-story: ""
```

`data-od-story` is the marker <!-- decks:repo-only -->the guard tests (`packages/decks/story/test-decks.ts`),
<!-- /decks:repo-only -->the router guard in `packages/decks/setup/main.ts`, and the view-transition rules in
`packages/decks/styles/story-frame.css` all key on. Do not use Slidev's own `transition: view-transition`:
it swaps the slideshow container between a div and a `TransitionGroup` on
every route change, and a click is a route change, so every click would
remount every slide. `packages/decks/setup/main.ts` runs `document.startViewTransition`
itself from a router guard instead.

<!-- decks:repo-only -->
Never write the literal string `data-od-story` inside a conventional deck's
`slides.md` prose or comments: `test-decks.ts` enrols any deck whose
`slides.md` contains that string, so a stray mention in a comment silently
puts a conventional deck through the story guards.
<!-- /decks:repo-only -->

## Review-agent brief

A stage design or architecture review runs read-only, with no checkout: it
reads the component and the deck's `data-sources.md`/`data/*.ts`, and reports
findings as `file:line`. Every proposed figure has to name the
`data-sources.md` row or the `data/*.ts` constant it comes from; a proposal
that introduces a number with no citation is a prompt to look the number up,
not copy to paste into the slide.

## Verification loop

- `bun run shot <n> [clicks]`: per-slide screenshots at each click, prints
  the card lead per click and chip positions, and lists console errors
  including unresolved-component failures. Restart the dev server first if a
  component file was added or moved (Slidev's auto-import list is built at
  startup).
<!-- decks:repo-only -->
- `bun run snap <dir> [port]` / `bun run snap:diff <a> <b>`: whole-deck pixel
  walk and diff. The port defaults to 3030, the same as `shot`; a parity gate
  run from a worktree passes 3031 and points its own dev server at that port,
  so the two servers do not collide. On `opendata-pitch`, frames `s01-c0`,
  `s04-c2`, `s04-c3` and `s13-c0` carry a force graph in continuous motion
  and differ by roughly 3 to 20 percent between two identical walks; every
  other frame should be `0.000%` (under 0.2% at most). Walk twice before a refactor to see
  the floor for yourself, then diff the refactor against either walk.
- `bun run test` (vitest over `packages/decks/{story,scripts,theme}`): the
  guard tests above, the theme contrast test, plus the unit suites.
- `bun run typecheck`, `bun run check`, `bun run build <alias>`.
<!-- /decks:repo-only -->
<!-- decks:user: - `bun run snap <dir>`: whole-deck screenshot walk. Walk before and after a
  theme or shared-styles change and compare the frames.
- `bun run lint`: the prose patterns over pages, components and every story
  card's `lead`/`body`.
- `bun run check`, `bun run build <alias>`. -->
