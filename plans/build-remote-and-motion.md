# Build: remote-and-motion

## Context

Two threads from 2026-11-17.

1. A demo talk mirrors the laptop to show VS Code, a terminal and a browser, which leaves no
   private screen for the presenter window. RFC 0009 (`docs/rfcs/0009-remote-presenter.md`,
   Ready) puts notes and control on an iPad or second laptop.
2. Decks' strength is what an agent can build with it. This build leans into that: an agent
   can see motion (`decks film`) and catch layout faults (`decks inspect`); charts change
   across clicks (`ChartSteps`); eight more transitions; and motion graphics of After
   Effects quality, built on gsap and three.js (`Camera`, `ShapeMorph`, gsap's plugins bound
   to the click timeline, `Scene3D`, a motion-graphics craft reference), plus slide recipes.

Decided with Riley on 2026-11-17 and 2026-11-18 (RFC 0009's four decisions are in the RFC):

- All of the above in one build. Landing branch `feat/remote-and-motion`; merge to main and
  push only when Riley asks.
- Motion graphics means AE-quality motion authored in code with gsap and three.js, not
  playing After Effects files. No Lottie. No new motion dependency: gsap 3.15.1 already ships
  SplitText, MorphSVG, MotionPath, DrawSVG and CustomEase, and kit already has `three`.
- Codex implements through foreman: `gpt-6.2-astra` for design-heavy units, `gpt-6.2-sol`
  for the rest (the model column below). High effort, fast mode. Each unit's review command
  uses its run's model.
- Cut on purpose: particles, parallax layers, slide images on the remote, the MCP server (#8).

## Phases (ce:build, decided 2026-11-18)

No timebox. Every lane is a Codex run through foreman (`gpt-6.2-astra` or `gpt-6.2-sol` as
the model column says) that writes its contract's tests first, sees them fail, then
implements. Phases land on `feat/remote-and-motion` and are tagged there (`rm-phase-N`);
at the end the branch merges to main locally and every worktree and run is cleaned up; no
push unless Riley says so. Scaffold SHA: `9031e0f`.

| Phase | Lanes | Depends on | Demo |
| --- | --- | --- | --- |
| 1 remote presenter | 1A remote server, 1B remote client | scaffold | `bun run decks dev basic --remote`, open the printed URL on an iPad, step the deck from it |
| 2 agent tooling | 1C film, 2C inspect | phase 1 | `bun run decks film motion <push slide> 0`; `bun run decks inspect motion` |
| 3 data and transitions | 1D ChartSteps, 1E transitions | phase 1 | `bun run decks dev motion`, slides 35-43 |
| 4 motion graphics library | 2A Camera and ShapeMorph, 2B motion graphics (Astra) | phase 2 | slides 45-49, filmed |
| 5 motion templates | 2E templates A, 2F templates B (both Astra) | phase 4 | `bun run decks dev motion`, slides 50-55, each filmed |
| 6 recipes | 2D recipes | phases 3 and 5 | `bun run decks dev recipes` |

Phases 2 and 3 run together after phase 1 (four lanes). The unit names below (1A-2D) are
the lane names; the phase they land in is this table's.

## Execution

I orchestrate; Codex runs implement. Contracts come from `.claude/delegate/contract.md`, with
procedure from `.claude/delegate.md`. Each run:
`foreman start <unit> --new-worktree --from feat/remote-and-motion --setup "bun install"
--contract <path> --write --model <model> --wait`. Contracts carry scoped checks only
(`rr rd-test <paths>`, `rr rd-e2e -- <spec> --repeat-each=5`, lint, typecheck); I run
`rr rd-check` on the integration branch after each merge. At most five runs at once.

Mine under AGENTS.md: `docs/`, every `package.json`, every `packages/*/src/index.ts`,
`decks.json`, `vitest.config.ts`, the CHANGELOG, and the phase 0 scaffold below.

Every contract that adds an `examples/motion` slide states the gallery rules
(`e2e/motion-gallery.spec.ts`): the slide has an `h1` title, its poses are reversible, and
the file name is the one assigned here. Names are prefixed by kind so `slideNo()` lookups
(`e2e/fixtures/motion-gallery.ts`) never collide with `03-rise`, `06-blur`, `07-wipe` or
`27-cover`.

| File | Unit |
| --- | --- |
| `35-chart-steps.mdx` | 1D |
| `36-transition-rise.mdx` … `43-transition-cube.mdx` (rise, cover, reveal, wipe, iris, blur, flip, cube), `44-transition-end.mdx` | 1E |
| `45-camera.mdx`, `46-shape-morph.mdx` | 2A |
| `47-kinetic-type.mdx`, `48-path-follow.mdx`, `49-scene-3d.mdx` | 2B |
| `50-title-reveal.mdx` … `52-stat-burst.mdx` | 2E |
| `53-list-cascade.mdx` … `55-section-wipe.mdx` | 2F |

Skill files, one owner each per phase: 1C `building-a-deck/references/workflow.md` (a film
section) and `deck-motion/SKILL.md` ("Verify motion as a viewer"); 1D
`visualization/references/presentation.md`; 1E the transitions table in
`deck-motion/references/motion.md`; 2A the `Camera` and `ShapeMorph` sections of that file;
2B a new `deck-motion/references/motion-graphics.md` and its row in `deck-motion/SKILL.md`;
2C the CLI paragraph in `working-with-decks/references/project.md`; 2D
`building-a-deck/references/recipes.md`.

## Phase 0: scaffold (mine)

1. Commit the pending doc changes on main (RFC 0009, the feature-gaps row, the plan moves,
   this plan), then `git worktree add .claude/worktrees/remote-and-motion -b
   feat/remote-and-motion main` and `bun install` there.
2. `bun add uqr@0.1.3` in node (kit and decks already have it).
3. `packages/core/src/remote-protocol.ts`, written by me: event names and message shapes
   (below). No logic.
4. Stubs that throw `not implemented`, with exports:
   - runtime: `mountRemote`, the `remote` option type on `mountDeck`;
   - kit: `ChartSteps`, `Scene3D`;
   - motion: `Camera`, `ShapeMorph`, and the plugin exports `SplitText`, `MorphSVGPlugin`,
     `MotionPathPlugin`, `DrawSVGPlugin`, `CustomEase` (registered once in `tokens.ts`; 2B
     makes them safe under the five render contexts).
5. Registration: `Camera` and `ShapeMorph` in the default MDX components (`dev/entry.ts`), the
   `provided` list (`mdx/component-check.ts`) and `clicks.ts`'s `stepNames`. Kit components
   are not defaults: a slide imports `ChartSteps` and `Scene3D` from `@steamfield/decks/kit`,
   as it does `OpenChart`.
6. Plumbing so parallel units own disjoint files: a `remote: boolean` parameter from `dev()`
   through `reactDecks()` (`plugins.ts`) to `entryModule()` (`entry.ts`), unused; `decks film`
   and `decks inspect` registered in `cli-command.ts` as stubs; `openBuiltDeck` split into
   `openBuiltPage` (preview server and page, no waiting, with an optional `beforeLoad(page)`
   hook) and the existing wait, with `openBuiltDeck` composing them, so `shot` is unchanged.

### Remote protocol (core)

```ts
export const REMOTE_POSITION = "deck-remote:position"; // window -> dev server (HMR)
export const REMOTE_INTENT = "deck-remote:intent";     // dev server -> window (HMR)
export type RemoteIntent = { type: "next" } | { type: "prev" } | { type: "go"; slide: number };
export interface RemotePosition {
  slide: number; click: number;
  view: "play" | "presenter" | "overview"; focused: boolean;
}
export interface RemoteSlide {
  id: string; title: string; clicks: number;
  notes: readonly { click: number; html: string }[];
}
export interface RemoteDeck { title: string; slides: readonly RemoteSlide[] }
export type RemoteServerMessage =   // relay -> remote page
  | { type: "deck"; deck: RemoteDeck }
  | { type: "position"; slide: number; click: number; elapsed: number | null }
  | { type: "waiting" }
  | { type: "pong" };
export type RemoteClientMessage =   // remote page -> relay
  | RemoteIntent | { type: "reset-timer" } | { type: "ping" };
```

## Shared rule: stepped components

`ChartSteps`, `Camera` and `ShapeMorph` index the same way: item 0 shows before click `at`,
item `i` from click `at + i − 1`. `clicks.ts` counts `at + items.length − 2` when the items
prop is an array literal (`integerAttribute` already reads the estree, `clicks.ts:57-71`;
the new branch goes before the generic `at`/`until` one at `clicks.ts:247-263`). When the
prop is not a literal and the slide has no frontmatter `clicks`, it throws the existing
"set clicks: in the frontmatter" `DeckError` naming the slide (pattern at `clicks.ts:72-76`).
Frontmatter `clicks` replaces counting (`mdx/slides.ts:43-46`), so a data-driven slide sets
it. `ChartSteps` joins `stepNames` for this even though it is not a default component.

`Scene3D` and gsap-plugin compositions follow `useTimeline`: beat `k` is click `k`, and the
slide sets frontmatter `clicks`.

One step forward or back in the live slide context animates; a jump of more than one click,
motion `instant`, or any other render context seeks to the target with no animation.

## Phase 1 (five runs in parallel)

| Unit | Model | Owns | Delivers |
| --- | --- | --- | --- |
| 1A remote server | astra | `packages/node/src/remote/*` (server, relay, payload, page build, tests); the `--remote` and `--remote-port` flags in `cli-command.ts` and `dev/server.ts`; the payload hook in `dev/plugins.ts` | RFC 0009 "The remote server" and "The remote sends intents", as written. The remote page is built at `--remote` start with `build()` and `config()` from `dev/server.ts` (so source and published resolution are the existing ones), from a virtual entry that calls `mountRemote`, into a temp dir served by the remote server and deleted on close. |
| 1B remote client | astra | `packages/runtime/src/remote/*` (the window link, `RemoteView`, `mountRemote`, css, dom tests); the `remote` option in `mount.tsx`; the `remote` branch in `dev/entry.ts` | The window side and the remote page from RFC 0009. `mountDeck(source, root, { remote })` with `remote: { report(position): void; onIntent(apply): () => void }`, built in the dev entry from `import.meta.hot`. The `mount.tsx` sync gate applies. |
| 1C `decks film` | astra | `cli/commands/film.ts` and tests; `dev/browser.ts` (on top of the scaffold's split); a `dev/film-capture.ts`; the film skill sections | See "Film". |
| 1D `ChartSteps` | astra | `packages/kit/src/ink/chart-steps.tsx` and test; `open-chart.tsx` and `chart-entrance.ts`; the `ChartSteps` branch in `clicks.ts`; `e2e/kit-chart-steps.spec.ts`; `35-chart-steps.mdx`; its skill section | See "ChartSteps". |
| 1E transition pack | sol | `packages/runtime/src/transitions/transition.css` (new presets only); `e2e/transition-presets.spec.ts`; slides 36-43; its skill section | See "Transitions". |

### Film

`decks film <deck> <slide> [click] [--frames 6] [--out film.png] [--width 1280] [--height 720]`
captures the motion of arriving at `(slide, click)` from the position before it: click
`click − 1` of the same slide, or the previous slide's last click when `click` is 0 (which
films the transition). It writes one contact-sheet PNG, frames in reading order, each
labelled with its time in ms; the last frame is the settled state.

One virtual time `t` drives everything, and nothing waits on the wall clock:

- `openBuiltPage` with a `beforeLoad` that installs `page.clock` at 0, paused. Navigate to the
  position before the step and run the clock until `settled()` resolves, stepping it as
  `e2e/fixtures/motion-clock.ts` does.
- Press the step key, then advance in 1/60 s increments. After each increment, every entry of
  `document.getAnimations()` not seen before is paused and its birth time recorded, and every
  paused animation gets `currentTime = t − birth` (the seek in
  `e2e/fixtures/transition-seek.ts`). gsap, OpenChart's update tweens and three run on rAF
  and timers, which the clock drives.
- The motion's span is the later of: the last `t` at which a rAF-driven value changed (the
  page reports when `settled()`'s probes go quiet) and the largest `birth + endTime` among the
  animations. Then `finish()` every animation and confirm `settled()`. More than 10 s of
  virtual time throws a `DeckError` naming the slide and click.
- Second pass from a fresh page: the same steps, sampling the frames evenly over the span.
- The sheet is an HTML grid of the frames screenshotted in the same browser. No image library.
- Errors: unknown slide or click, slide 1 click 0 (nothing precedes it), never settling.
- First task, before the command: prove the method on `examples/motion`'s `push` transition
  and a `useTimeline` slide (the middle frame differs in pixels from the first and last).
  If it cannot be made to work, stop and ask; never fall back to sleeps.

### ChartSteps

`<ChartSteps specs={[s0, s1, …]} at={n} />`, under the shared stepped rule.

- Steps animate through OpenChart's `update` phase on one `Chart` instance (`chart.update`).
  The kit wrapper keys `Chart` on `playCount` only, not on `animated` (`open-chart.tsx:57`), so
  turning animation on for a step does not remount.
- OpenChart snaps instead of tweening when two specs differ in mark type, an encoding field
  or its type, scale type or `transform`, when more than 500 marks change, under reduced
  motion, or while the entrance runs. `ChartSteps` throws at render, naming both indices, when
  two specs differ in mark type or encoding fields, since the author meant a morph. A step
  during the entrance snaps; that is a test row. Do not import OpenChart internals
  (`canTransitionSpecShape`).
- The settle probe bounds the update by the resolved update duration, as
  `chart-entrance.ts:16-27` bounds the entrance.
- Tests: dom, one per behaviour; e2e forward, back, jump, reload at a later click, print.

### Transitions

New presets in `transition.css`, root snapshots only, motion tokens only, mirrored for
backward navigation where they have a direction:

| Name | What happens |
| --- | --- |
| `rise` | The new slide pushes in from below; backward, from above. |
| `cover` | The new slide slides over the old one, which stays put. |
| `reveal` | The old slide slides away, uncovering the new one. |
| `wipe` | A straight edge sweeps across in the navigation direction (`clip-path: inset`). |
| `iris` | The new slide opens from a circle at the centre (`clip-path: circle`). |
| `blur` | The old slide blurs out as the new one sharpens in. |
| `flip` | Both snapshots rotate about the vertical axis, with perspective. |
| `cube` | The slides turn as two faces of a cube. |

Tests: `transition-presets.spec.ts` gains each name, sought to 50% with `seekTransition`,
asserting the computed transform, clip-path, filter or opacity on the pseudo-elements, in
both directions where the preset has one.

## Phase 2

2A, 2B and 2C start once phase 1 is merged. 2D starts after 2A and 2C merge.

| Unit | Model | Owns | Delivers |
| --- | --- | --- | --- |
| 2A `Camera`, `ShapeMorph` | astra | `packages/motion/src/camera.tsx`, `shape-morph.tsx`, css, tests; their branches in `clicks.ts`; `e2e/motion-camera.spec.ts`; slides 44-45; their skill sections | See below. |
| 2B motion graphics | astra | `packages/motion/src/plugins.ts` (registration, render-context safety); `packages/kit/src/ink/scene-3d.tsx`, css, tests; `e2e/motion-graphics.spec.ts`, `e2e/kit-scene-3d.spec.ts`; slides 46-48; `deck-motion/references/motion-graphics.md` | See below. |
| 2C `decks inspect` | sol | `cli/commands/inspect.ts` and tests, using `openBuiltPage` | Builds the deck, opens each visible slide at its last click with `?motion=instant`, and reports elements whose box leaves the canvas and text clipped by its own box (`scrollHeight > clientHeight` or `scrollWidth > clientWidth` with overflow not visible). One line per finding: slide position, file, a short selector and text excerpt, overflow in px. Exit 1 with findings. Its tests use temp decks it writes; it reports on `examples/*` in the hand-off and fixes nothing outside its paths. |
| 2D recipes | sol | `examples/recipes/` (a fixture deck, one slide per recipe), `building-a-deck/references/recipes.md` | Eight recipes as MDX an agent copies: big number, ranked bars that build (`ChartSteps`), before/after, timeline, quote with source, three-step process, diagram tour (`Camera`), code walk-through (magic move). Each slide passes `decks check`, `decks lint` and `decks inspect`. The `decks.json` line is a hand-off request. |

Phase 2 integration (mine): `e2e/remote.spec.ts` from RFC 0009 plan item 5, against the
merged 1A and 1B, written by a sol test-author run.

### Camera and ShapeMorph

- `<Camera stops={[{ x, y, zoom }, …]} at={n}>` frames a region of its children per click.
  `x`, `y` are the centre in the child canvas's own pixels; `zoom` 1 shows the whole canvas.
  One gsap tween per step, seeked, under the shared stepped rule.
- `<ShapeMorph paths={[d0, d1, …]} at={n} />` is a `<path>` in an SVG morphing between path
  strings with `MorphSVGPlugin`, under the same rule.

### Motion graphics

The authoring surface for AE-quality motion is a deck component using `useTimeline` with
gsap's plugins; this unit makes that safe and teaches it.

- `plugins.ts` registers SplitText, MorphSVG, MotionPath, DrawSVG and CustomEase once.
  SplitText changes the DOM, so a split made inside a `useTimeline` build is reverted on
  cleanup and the text stays whole and accessible (`aria-label` on the split element) in
  every context.
- `<Scene3D setup={(three, tl, beat) => …} poster={node} />`: a three.js scene whose objects
  are tweened on a paused gsap timeline with beat labels, the `useTimeline` rule. Renders on
  demand (a frame per timeline update), never a free-running loop. Like `Graph3D`, it creates
  a WebGL context only in the live slide context and renders `poster` everywhere else and in
  `instant` mode; the context is disposed when the slide stops being active.
- Slides 46-48 show kinetic type (SplitText), a mark following a path (MotionPath with
  DrawSVG) and a `Scene3D` camera move; each is filmed with `decks film` in the run, and the
  sheets go in the hand-off.
- `motion-graphics.md`: the craft rules an agent applies (one ease family per scene, overlap
  between parts instead of sequencing, anticipation and follow-through within the token
  durations, stagger rhythm, a hold on the read state, motion that stops before the speaker
  talks over it), each with a short gsap example from slides 46-48, and a "film it and read
  the sheet" check.

## Motion templates (phase 5)

Added 2026-11-18 at Riley's request: besides the library, ready-made motion graphics an agent
fills in. The agent picks a template, writes the prose, and the template takes its colours,
type and timing from the deck's theme and motion tokens. Each template is also a reference:
one readable source file per template, which the build copies into the package's `docs/`
(`docs/motion-templates/<name>.tsx`) so an agent writing custom motion can read how a
finished one is built.

```tsx
import { MotionTemplate } from "@steamfield/decks/kit";

<MotionTemplate template="title-reveal" title="Agents read your docs first." subtitle="Write them for that reader." />
<MotionTemplate template="list-cascade" at={1} items={["Brief", "Build", "Film"]} />
```

`MotionTemplate` takes a discriminated union on `template`; each template's content props are
typed (no free-form config). Optional `accent` takes a theme colour name from the kit theme,
never a raw colour. Every template:

- is built on `useTimeline` with gsap and its registered plugins, so it seeks per click, renders
  its end state outside the live slide context and in `instant` mode, and settles;
- uses only theme variables and motion tokens; text stays real text (SplitText reverted on
  cleanup, `aria-label` on split elements);
- plays its entrance at click `at` (default 0, on arrival) as one beat, except `list-cascade`,
  which takes one click per item; `clicks.ts` counts `at` (plus `items.length − 1` for a
  literal `items` in `list-cascade`), otherwise the slide sets frontmatter `clicks`;
- has a slide in `examples/motion` and a `decks film` sheet in its run's hand-off.

| Template | What it does | Content props | Lane |
| --- | --- | --- | --- |
| `title-reveal` | Headline words rise out of a mask with a stagger, an accent rule draws under it, the subtitle fades up | `title`, `subtitle?` | 2E |
| `lower-third` | An accent block wipes in, name and role slide out from behind it | `name`, `role` | 2E |
| `stat-burst` | A number counts up while a ring draws around it, the label slides in | `value`, `label`, `suffix?` | 2E |
| `list-cascade` | Items arrive one per click, each with a drawn marker | `items` | 2F |
| `quote-card` | Quote marks draw, the quote reveals word by word, the source line follows | `quote`, `source` | 2F |
| `section-wipe` | A panel in the accent colour wipes across, the section number and title land on it | `number`, `title` | 2F |

Phase 5 scaffold (mine): `packages/kit/src/motion-templates/` with `motion-template.tsx` (the
dispatcher over a registry), `registry.ts`, one stub file per template, the `MotionTemplate`
and `MotionTemplateName` exports, `MotionTemplate` in `stepNames`, the `build.mjs` copy into
`docs/motion-templates/`, and slide filenames `50-title-reveal.mdx` to
`55-section-wipe.mdx`. 2E owns the first three template files and slides, 2F the last three;
each lane adds its templates' rows to `deck-motion/references/motion-graphics.md` under a
heading the scaffold creates for it.

## Phase 3 (mine)

- Guide: `presenting.md` remote section and `cli.md` (`--remote`, `film`, `inspect`);
  `motion.md` transitions, `Camera`, `ShapeMorph`, the gsap plugins; `kit.md` `ChartSteps`,
  `Scene3D`.
- `architecture.md`: the remote protocol and window link, and `film`/`inspect`.
- RFC 0009 marked Done with its commit; the feature-gaps row archived; CHANGELOG
  `## Unreleased`.
- A reviewer pass that the skill files read correctly together.
- After each run: an `AGENTS.md` note where the run taught something, and a
  `docs/delegation-log.md` row.

## Final review and gate

- `rr rd-check` on a cold Vite cache, `bun run check:isolated`, `bun run test:tarball` (the
  remote page builds from the packed package), `make -C site ci-fresh`.
- `ce:code-reviewer` (opus) on the branch against main; every finding that holds gets fixed.
- Driven as a user: the RFC's verification (iPad, mirrored screen, VS Code in front); film a
  transition, a `ChartSteps` step, a `Camera` move and slide 48, and read the sheets;
  `decks inspect` on every example, with its findings triaged.

## Assumptions Riley can override

- The remote page is built when `decks dev --remote` starts (a few seconds), so it always
  matches the installed runtime; RFC 0009 plan item 3 is updated to say so.
- Data-driven `ChartSteps` slides set frontmatter `clicks`.
- `decks film` captures one step per invocation; filming a whole slide is a loop the agent
  runs.
- `decks inspect` reports overflow and clipping only, not overlap or contrast.

## DA findings applied (2026-11-18)

Film runs on one virtual time with seeded Web Animations instead of `settled()` under a
paused clock; `openBuiltDeck` is split in phase 0 and 1C owns `browser.ts`; `decks check` does
not compare frontmatter with content, so stepped components count array literals or demand
frontmatter; ChartSteps keeps one `Chart` instance and throws on unmorphable spec pairs; kit
components are not default MDX components; examples filenames, skill sections and the remote
flag plumbing are assigned up front; 2D waits for 2A and 2C, and 2C fixes nothing outside its
paths; the remote page build reuses `config()` and the RFC says so.

## Decisions during the build

- 2026-11-18, phase 1 questions: the remote page keeps its token in its URL (no stripping, no
  `sessionStorage`), so a reload works against the strict 403; the iPad is not projected.
  After a failed socket handshake the page GETs its own tokenized URL: only a 403 means the
  link expired. The first window report after `waiting` is pushed regardless of dedup; the
  first report sets the position with `elapsed: null` and the first change starts the talk;
  reports arrive in arrival order (a late presenter report can briefly win; accepted for v1).
  `--remote` forces the dev server to loopback even when `vite.server.host` is configured,
  with a logged line. A window in print never reports. RFC 0009 is updated at phase 3 docs.
