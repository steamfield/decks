# The story engine

A library reference for an engineer with no Claude in the loop. For the
authoring rules (word budgets, hue conventions, headmatter, guard tests as
they bind an author), see `.claude/rules/story-stage.md`. This file is the
API and the mechanism behind it.

## Import root

Everything a stage needs comes from one path:

```ts
import { useStage, DUR, stagger, type BeatCopy } from 'slidev-addon-decks/story'
```

`packages/decks/story/index.ts` is the barrel: it lists what a stage may reach for,
including the lower-level composables documented below that a stage rarely
needs. `useScriptedDemo` (the click/isActive/playCount
primitive) lives in `packages/decks/composables/` and `useStageMap`/`STAGE`
(viewBox-to-overlay conversion) live in `packages/decks/story/stage-map.ts`; both are
re-exported from this barrel, so there is one import line, not two.

## `useStage`

```ts
export interface StageOptions<C extends BeatCopy> {
  copy: readonly C[]
  enter?: (tl: gsap.core.Timeline) => void
  beats: (tl: gsap.core.Timeline, beat: (n: number) => void) => void
}
function useStage<C extends BeatCopy>(opts: StageOptions<C>): {
  clicks: Ref<number>
  isActive: Ref<boolean>
  playCount: Ref<number>
  copy: ComputedRef<C>
  beats: number
}
```

Composes `useScriptedDemo`, `beatCopy`, `useStageEntrance`, and `beat()`. It
returns `beats` derived from `opts.copy.length`, so a stage's `:beats` prop
and its copy array can no longer disagree; `beats.test.ts` checks that value
against the deck manifest's `clicks:`.

## Lower-level composables

A stage almost always wants `useStage`. These are what it is built from, and
what a component that isn't a full stage (an `InkLine`, an `InkBars`) reaches
for directly:

- `useScriptedDemo()` → `{ clicks, isActive, playCount }`. The click-paced
  primitive: `clicks` is the current click index within the slide, `isActive`
  tracks slide focus, `playCount` increments on the `isActive` false-to-true
  edge so a keyed subtree remounts and replays on re-entry. Bind it only
  around state no timeline owns; see step 4 below for what it breaks.
- `beatCopy(copy, clicks)` → a computed card for the current beat.
- `useStageEntrance(enter, { clicks, isActive, beats? })` → runs `enter` once
  on landing, per the entrance policy below, and optionally builds the beat
  timeline in the same scope so a beat script can reach a child ref.
- `useStoryTimeline(build, { clicks, isActive })` → the lower-level primitive
  `useStageEntrance` calls: seeks or tweens a `gsap.timeline()` to the current
  click, choosing seek over tween on first run, an inactive slide, reduced
  motion, or a jump of more than one beat. An interrupted tween retargets
  from its visible position and catches up within one requested beat's
  duration, so rapid clicks cannot build up a playback backlog.
- `beat(tl, n)` → `tl.addLabel(\`beat${n}\`)`.

## Lifecycle

1. Component mounts. `useStageEntrance`'s `onMounted` hook builds the entrance
   timeline (paused) and, if given a `beats` function, builds the beat
   timeline in the same effect scope, so a beat script's template refs are
   already resolved.
2. A watcher on `isActive` and `clicks` decides the entrance: not the real slide view
   (presenter, overview, print) → jump to the end state. Slide inactive →
   hold at zero, so the next entry replays. Active but not landing on beat 0,
   or motion turned down → jump to the end state. Otherwise → hold at zero
   until any in-flight view transition lands, then play once.
   Advancing during that wait or during the entrance finishes it immediately;
   returning to beat 0 on the same visit does not replay it. Leaving the slide
   invalidates any pending transition callback.
   (`StoryStage`'s own chrome entrance skips outright during a transition
   instead, unless the slide passes `enter-after-transition` to get the same
   hold-then-play.)
3. The beat timeline seeks or tweens to the current click on every change,
   per the seek/tween rule above.
4. Re-entering the slide bumps `playCount`. Bound as `:key`, it remounts that
   subtree so anything stateful inside starts over.

   **Nothing the beat script reaches through a template ref may sit inside
   that key.** The timelines are built once, at mount, and each tween they add
   is bound to the child instance that existed then. A remount hands the
   screen fresh children at their resting state and leaves both timelines
   animating orphans: an `InkLine` renders fully drawn from the first frame
   and never sweeps. It reads as a timeline that never ran. Slidev mounts
   preloaded slides hidden, so a stage usually mounts inactive with
   `playCount` at 0 and the swap happens the moment you arrow onto the slide;
   deep-linking to it hides the bug, because mounting while already active
   sets `playCount` during setup and nothing remounts.

   A timeline-driven child does not need the key anyway. `addDraw` is a
   `fromTo` and the beat timeline is a pure function of the click index, so
   both re-arm on re-entry on their own. `handle-refs.test.ts` fails on a
   driven ref inside the key.
5. `isActive` going false holds the entrance at zero for next time; the beat
   timeline is untouched, since it is a pure function of `clicks`.

## Contexts

Four things read `$renderContext` or an equivalent signal and branch:

| Context | Entrance | `vt-*` names | `Graph3D` (WebGL) | Beat timeline |
|---|---|---|---|---|
| `slide` (the real view) | Plays per policy above | Assigned under `.vt-on` | Mounts | Seeks or tweens |
| `presenter` | Jumps to end state | Nulled | Never mounts | Seeks (no animation) |
| `overview` | Jumps to end state | Nulled | Never mounts | Seeks |
| print / export | Jumps to end state | Nulled | Never mounts | Seeks |

The presenter renders a second copy of the same slide alongside the main
view; two elements sharing a `view-transition-name`, or two live WebGL
contexts, would both break outright, which is why every one of these is
nulled or skipped rather than merely hidden.

## Durations and easings

Three easings, one duration table, no numeric literal outside `easings.ts`
(`durations.test.ts` enforces it):

| Easing | For |
|---|---|
| `SETTLE` | Anything that appears, disappears, recolors, or repositions |
| `DRAW` | Anything that draws or travels within a beat. Eased in and out, so give it `DUR.grow` or longer; under about half a second it reads as linear |
| `TRACE` | The long hero moves only: the cover trace, a staggered gather |

| `DUR` key | Seconds | For |
|---|---|---|
| `tick` | 0.03 | One step of a progressive append |
| `opacity` | 0.14 | A quick fade; also the stagger between entrance groups |
| `draw` | 0.24 | A short draw-on |
| `card` | 0.3 | Card copy swap |
| `color` | 0.34 | A recolor |
| `eraseDelay` | 0.35 | Hold before an erase starts |
| `eraseHold` | 0.49 | Erase duration |
| `grow` | 0.56 | A bar or number growing in |
| `morph` | 0.6 | Cross-slide view-transition morph |
| `scale` | 0.9 | A larger draw or grow |
| `gather` | 1.6 | A field gathering into one card, sheet by sheet |
| `trace` | 1.8 | The cover's hero line, traced end to end |
| `bloom` | 2.4 | The slowest full-stage bloom |

Staggers are eased too. `easedStagger(i, n, spread)` gives item `i` of `n` a
start offset across `spread` seconds on an ease-in-out curve, so a cascade
leaves together, flows, and settles rather than ticking at even steps.
`InkBars`' `addGrow` and `addReorder` take `{ spread }` (a `DUR` value; 0, the
default, moves every row at once), and `UnitGrid` eases each cell's own slice
of `reveal` on `SETTLE`. Overlap a beat's tweens rather than chaining them with
`'>'`: land a chip or card as a line reaches its end
(`` `beat0+=${DUR.gather - DUR.card}` ``), not after it stops.

`css-mirror.test.ts` reads the handful of transitions that have to stay in
CSS (`story-frame.css`'s custom properties, the view-transition rules) back
and compares them against this table, so a change to `DUR` or the easing
curves has to land in both files.

## Components by family

- **Frame:** `StoryStage` (the pinned stage: svg + overlay + card slots, owns
  the entrance groups), `StoryLayer` (a second full-bleed svg on a div, for
  ink that needs a `view-transition-name`), `StoryCard` (the floating prose
  card), `StoryCover` (cover/thesis/divider/close chrome, slotted).
- **Ink primitives:** `InkLine` (a drawn series with a `LineHandle`),
  `InkBars` (grow/reorder/recolor/exit rows, a `BarsHandle`), `InkRule`,
  `InkNumber`, `InkTimeline` (with `InkTimelineCursor`, a current-step
  marker whose `position` the beat script tweens), `InkChip` (the floating annotation), `InkCardRect`,
  `InkLabeledCard` (a card box plus a name and a note line, for new stages
  that need the house box-and-label recipe without inventing text offsets),
  `InkPing` (a one-shot focus ring around a named mark, driven by a 0..1
  `progress`; invisible at both ends). `InkLine`'s opt-in `head` rides a
  glowing dot on the draw front while the sweep is under way.
- **Layout:** `UnitGrid`, `RowStrip`. `unitCellCenter(i, geom)` returns a
  `UnitGrid` cell's centre from the same props, and `rippleProgress(t, at,
  from, stagger, { reach, seed, index })` spreads one beat field across marks
  by distance from `from`, nearest first, so a recolor travels outward.
  `parliament.layout(total, { radius, rows?, rowGap? })` places a hemicycle's
  seats (`{ x, y, angle, row }`, centred on its baseline at the origin) in
  concentric rows sized by radius, picking the row count and gap from the
  total so seats sit as far apart along a row as rows sit apart, and returns
  them in reading order, ties at one angle inner row first; it also returns a
  `seatRadius` that clears every neighbour. `parliament.thresholdAngle(seats,
  at)` is the angle between seat `at - 1` and seat `at`, and throws when those
  two share an angle, since no radial tick can separate them. There is no
  component yet: a deck draws the seats itself, one circle of `seatRadius` per
  seat, and a radial line at a `thresholdAngle` for each majority tick.
- **Other:** `CodeInk` (syntax-highlighted code reveal), `Underline`,
  `Graph3D` (WebGL force graph, mounts only in the real slide view).

## The minimal stage

`references/od-templates/components/StoryMinimalStage.vue` is the smallest
correct stage written against this API: one series, one chip, three beats,
child handles via refs, and nothing else. `bun run new <alias> <dir> --story`
copies it as a new deck's first stage. Read that file rather than an inlined
copy here; it is kept runnable and typechecked, which a doc snippet is not.

## Guard tests

- `beats.test.ts`: beat count, `COPY` array length, and manifest `clicks:`
  agree for every story deck; card word budget (eight lead, twenty body);
  pins today's over-budget cards by name.
- `durations.test.ts`: no numeric duration literal outside `easings.ts` in
  `packages/decks/story/` or a `Story`/`Ink`/`Unit`/`Underline`/`Graph3D`/`RowStrip`/
  `CodeInk`/`Demo*`-prefixed component, across every registered deck.
- `frame-units.test.ts`: no raw `vw`/`vh` length inside a story slide's
  components, pages, data, or styles, outside a small allowlist.
- `css-mirror.test.ts`: the CSS duration/easing mirrors in `story-frame.css`
  match `DUR` and the easing curves.
- `vt-names.test.ts`: every `vt-*` hand-off class assigned under `.vt-on` is
  also nulled in the presenter/print/overview `:is()` list, and vice versa.
- `test-decks.ts` (not itself a test): the shared helper the guards above
  use to find every registered deck whose `slides.md` contains
  `data-od-story`, so a new story deck is covered the day it is registered.

### Responsive HTML stages

`<StoryStage fluid>` lets HTML layouts and resize-aware charts use the available
width (up to a 12:5 frame), while `--sw` / `--sh` keep type and vertical spacing
at the fitted 16:9 scale. Use `--lw` for horizontal positions and widths in these
stages. It equals `--sw` in ordinary fitted stages. Fixed-coordinate SVG scenes
should keep the default fitted frame so marks, labels and overlays stay aligned.
Print/export retains the canonical 1920×1080 layout.

`StoryCover` enables this layout automatically when it has no `field` or `aside`
slot requiring coordinate alignment. Put viewport-wide decorative effects in its
`background` slot; `field` remains inside the fitted content frame. `StoryStage`
also exposes `background` directly. Backgrounds do not receive pointer events.
