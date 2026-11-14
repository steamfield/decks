# react-decks architecture

This is the design every contract cites. A section marked **Final** is a contract: implement
it as written and ask before deviating. A section marked **Outline** fixes responsibilities
and boundaries; its signatures are finalized here by the orchestrator before the phase that
builds it.

Only the orchestrator edits this file, any `package.json`, and each package's
`src/index.ts` export list.

## 1. Packages and the dependency rule (Final)

```
kit -> motion -> runtime -> core <- node
```

| Package | Purpose | May import | Must never import |
| --- | --- | --- | --- |
| `@react-decks/core` | Pure deck logic | its own files | `react`, `react-dom`, `node:*`, any `@react-decks/*`, DOM globals (`window`, `document`, `location`, `BroadcastChannel`) |
| `@react-decks/runtime` | React client | `core`, `react`, `react-dom`, declared npm deps | `node:*`, `motion`, `kit`, `node` |
| `@react-decks/motion` | Tokens, step primitives, timelines | `core`, `runtime`, `react`, declared npm deps (`gsap`, `@gsap/react`) | `node:*`, `kit`, `node` |
| `@react-decks/node` | Vite plugins, CLI, export, tooling | `core`, `node:*`, declared npm deps | `react`, `runtime`, `motion`, `kit` |
| `@react-decks/kit` | Opinionated components and theme | `core`, `runtime`, `motion`, `react`, declared npm deps | `node:*`, `node` |

Cross-package imports use the bare package name. A relative import never leaves its package.
`tests/boundaries.test.ts` and `biome.json` enforce this.

Inside a package, files are grouped by feature, one file per concept, with its test beside
it (`navigation.ts`, `navigation.test.ts`). There is no `utils/` or `shared/` directory. A
helper used by one file lives in that file.

`core` takes numbers, strings and plain objects and returns the same. Anything that needs the
browser or Node is passed in by the caller. `setTimeout`, `clearTimeout` and
`URLSearchParams` are the exceptions: they exist in both environments and core may use them.
`packages/core/tsconfig.json` type-checks core without DOM, Node or React types, so any other
global is a compile error.

## 1.1 Libraries (Final)

Use an established, maintained library where one fits; write our own only where the code is
small and specific to decks. `core` is the exception: it is small pure logic with zero
dependencies by design. The orchestrator installs packages; a run that finds a better fit
than hand-written code asks for it by name.

| Concern | Use | Package |
| --- | --- | --- |
| Deck store | zustand vanilla store behind the `DeckStore` surface; hooks subscribe with React's `useSyncExternalStore` and a selector | `runtime` |
| Error boundary around each slide | `react-error-boundary` | `runtime` |
| Keyboard shortcuts | `tinykeys` | `runtime` |
| Pinch, wheel and drag for the viewer | `@use-gesture/react` | `runtime` |
| Class name composition | `clsx` | `runtime`, `motion`, `kit` |
| Timelines, text splitting, SVG drawing, count-up | `gsap` with `@gsap/react`, `SplitText`, `DrawSVGPlugin` | `motion` |
| MDX compile | `@mdx-js/rollup` | `node` |
| Frontmatter | `remark-frontmatter` + `remark-mdx-frontmatter` in the MDX pipeline; `gray-matter` when only metadata is read | `node` |
| Markdown in notes to HTML | `remark-rehype` + `rehype-stringify` | `node` |
| Loading `deck.config.ts` | `jiti` | `node` |
| Config validation | `zod` | `node` |
| Reading a component file's export names | `oxc-parser` | `node` |
| CLI commands and flags | `citty` | `node` |
| Terminal colour and prompts | `picocolors`, `@clack/prompts` | `node` |
| Free port | `get-port` | `node` |
| File globbing | `tinyglobby` | `node` |
| Browser automation, PDF | `playwright`, `pdf-lib` | `node` |
| Image diff and contact sheets | `pixelmatch` + `pngjs`, `sharp` | `node` |
| Dev server, HMR, file watching, React refresh | `vite`, `@vitejs/plugin-react` | `node` |
| Fonts | `@fontsource*` packages | decks, `kit` |
| Charts | `@opendata-ai/openchart-react` | `kit` |
| Tests | `vitest`, `@testing-library/react`, `user-event`, `jest-dom`, `@playwright/test` (`toHaveScreenshot` for pixel checks) | workspace |

Written here on purpose: the navigation reducer, hash codec, notes segmentation, sync
protocol and canvas fit in `core` (each is a few dozen lines of deck-specific rules), and the
import scanner in `tests/boundaries.test.ts` (dependency-cruiser does not support TypeScript
7 yet). The browser's own APIs are used directly where they exist: `BroadcastChannel`,
`ResizeObserver`, View Transitions, Screen Wake Lock.

## 2. core (Final)

All types are exported. All functions are pure unless stated. Slide numbers are 1-based.
Click indexes are 0-based: a slide with `clicks: 3` has click states 0, 1, 2, 3.

### 2.1 `manifest.ts`

```ts
export interface SlideMeta {
  /** 1-based position among visible slides. */
  readonly no: number
  /** Filename without extension, e.g. "03-outcome-ladder". Stable across reorders. */
  readonly id: string
  /** Path relative to the deck directory, e.g. "slides/03-outcome-ladder.mdx". */
  readonly file: string
  readonly title: string
  /** Number of clicks after the initial state. 0 means the slide has no steps. */
  readonly clicks: number
  /** Name of the transition into the following slide; undefined uses the deck default. */
  readonly transition?: string
  /** True when a click on this slide commits through a view transition (section 4.3). */
  readonly morphSteps?: boolean
}

export interface CanvasSize {
  readonly width: number
  readonly height: number
}

export interface DeckManifest {
  /** Registry alias; also part of the sync channel id. */
  readonly name: string
  readonly title: string
  readonly canvas: CanvasSize
  /** The deck's default slide transition; undefined means `fade`. */
  readonly transition?: string
  readonly slides: readonly SlideMeta[]
}

/** Throws an Error naming the first problem. Returns the same object when valid. */
export function assertManifest(manifest: DeckManifest): DeckManifest
```

`assertManifest` rejects: zero slides; `no` values that are not exactly 1..n in order;
duplicate `id`; a `clicks` that is negative or not an integer; a canvas dimension that is not
a positive finite number. Hidden slides never reach the manifest: the node package drops them
before building it.

### 2.2 `navigation.ts`

```ts
export interface NavState {
  readonly slide: number
  readonly click: number
}

export type NavAction =
  | { readonly type: 'next' }
  | { readonly type: 'prev' }
  | { readonly type: 'nextSlide' }
  | { readonly type: 'prevSlide' }
  | { readonly type: 'go'; readonly slide: number; readonly click?: number }

export type NavDirection = 'forward' | 'backward' | 'none'

export function clampNav(state: NavState, manifest: DeckManifest): NavState
export function navigate(state: NavState, action: NavAction, manifest: DeckManifest): NavState
export function navDirection(from: NavState, to: NavState): NavDirection
```

| Action | Result |
| --- | --- |
| `next`, clicks remain on the slide | same slide, `click + 1` |
| `next`, on the slide's last click, a later slide exists | next slide, click 0 |
| `next`, last click of the last slide | unchanged |
| `prev`, `click > 0` | same slide, `click - 1` |
| `prev`, `click === 0`, an earlier slide exists | previous slide at its last click (`clicks`) |
| `prev`, slide 1 click 0 | unchanged |
| `nextSlide` | next slide at click 0; unchanged on the last slide |
| `prevSlide` | previous slide at click 0; unchanged on slide 1 |
| `go` | that slide at `click ?? 0`, then clamped |

`clampNav`: a slide below 1 becomes 1, above the count becomes the last slide; a click below
0 becomes 0, above the slide's `clicks` becomes `clicks`; non-integers are floored; `NaN`
becomes slide 1 or click 0. `navigate` clamps its input state before applying the action and
clamps its result. When the result equals the input, `navigate` and `clampNav` return the
input object itself, so callers can compare by reference.

`navDirection` compares slide first, then click: later is `forward`, earlier is `backward`,
equal is `none`.

### 2.3 `clicks.ts`

```ts
/** The click count a given slide should render with, given where the deck is. */
export function clicksForSlide(slideNo: number, nav: NavState, manifest: DeckManifest): number

export type StepState = 'before' | 'current' | 'after' | 'gone'

/** `at`: the click at which the step appears. `until`: the click at which it leaves, if any. */
export function stepState(clicks: number, at: number, until?: number): StepState
```

`clicksForSlide`: the current slide gets `nav.click`; a slide before it gets its own `clicks`
total (it renders fully revealed); a slide after it gets 0. An unknown slide number gets 0.

`stepState`: `before` when `clicks < at`; `current` when `clicks === at`; `after` when
`clicks > at` and (`until` is undefined or `clicks < until`); `gone` when `until` is defined
and `clicks >= until`. `until <= at` throws.

### 2.4 `location.ts`

```ts
export type DeckView = 'play' | 'presenter' | 'overview' | 'print'

export interface DeckLocation {
  readonly view: DeckView
  readonly slide: number
  readonly click: number
  /** `?embedded` in the search string. */
  readonly embedded: boolean
  /** `?decks-bridge` in the search string. */
  readonly bridge: boolean
}

/** `hash` includes the leading "#" or is empty. `search` includes the leading "?" or is empty. */
export function parseLocation(hash: string, search: string): DeckLocation

/** Returns the hash to write, including the leading "#". Never writes the search string. */
export function formatHash(location: Pick<DeckLocation, 'view' | 'slide' | 'click'>): string
```

| Hash | Parsed as |
| --- | --- |
| `` (empty), `#`, `#/` | play, slide 1, click 0 |
| `#/5` | play, slide 5, click 0 |
| `#/5?clicks=2` | play, slide 5, click 2 |
| `#/presenter` | presenter, slide 1, click 0 |
| `#/presenter/5?clicks=2` | presenter, slide 5, click 2 |
| `#/overview` | overview, slide 1, click 0 |
| `#/overview/5?clicks=2` | overview, slide 5, click 2 |
| `#/print` | print, slide 1, click 0 |
| anything unrecognized, e.g. `#/abc`, `#/5/extra`, `#/-1` | play, slide 1, click 0 |

A `clicks` value that is missing, negative, not an integer or not a safe integer parses as 0;
a slide number that is not a safe integer is unrecognized. `parseLocation`
does not know the manifest and does not clamp to it; the store calls `clampNav` afterwards.
`embedded` and `bridge` are true when the parameter is present in `search` with any value
other than `0` or `false`, including no value. Search parameters inside the hash are only
read for `clicks`.

`formatHash` output: `#/5`, `#/5?clicks=2` (omitted when click is 0), `#/presenter/5`,
`#/presenter/5?clicks=2`, `#/overview/5`, `#/overview/5?clicks=2`, `#/print`. For every
location `L` whose slide and click are non-negative safe integers,
`parseLocation(formatHash(L), '')` returns the same view, slide and click (for `print`,
slide 1 click 0). The overview's hash holds the talk's position, which browsing the overview
does not change, so leaving it returns to where the talk was.

### 2.5 `notes.ts`

```ts
export interface NoteSegment {
  /** The click this text belongs to. Text before the first marker belongs to click 0. */
  readonly click: number;
  /** Markdown source of the segment, trimmed. */
  readonly markdown: string;
}

/** Splits a slide's notes, as markdown source, at its click markers. */
export function segmentNotes(markdown: string): NoteSegment[]
/** The click of the last marker; 0 when there are none. */
export function noteClickCount(markdown: string): number
```

Notes are segmented as markdown, before any conversion to HTML, so every segment is a
sequence of whole blocks and renders to balanced markup. The node package renders each
segment separately.

A marker is `[click]` or `[click:N]` (N a positive integer, leading zeros allowed) at the
start of a line, after optional spaces or tabs. `[click]` adds 1 to the running click;
`[click:N]` adds N. Each marker starts a new segment; the marker and the spaces after it are
removed and the rest of that line belongs to the new segment. A marker anywhere else in a
line, and a malformed one (`[click:0]`, `[click:-1]`, `[click:x]`), is left in the text and
starts nothing. Empty segments are kept, so the result always has one segment for click 0
plus one per marker. Input with no markers returns one segment with click 0.

| Input | Segments (click: markdown) |
| --- | --- |
| `Intro` | 0: `Intro` |
| `Intro\n\n[click] First\n\n[click] Second` | 0: `Intro`, 1: `First`, 2: `Second` |
| `[click]\nFirst` | 0: (empty), 1: `First` |
| `A\n[click:3] B` | 0: `A`, 3: `B` |
| `[click]\n[click] B` | 0: (empty), 1: (empty), 2: `B` |
| `Say [click] here` | 0: `Say [click] here` |
| `  [click] indented` | 0: (empty), 1: `indented` |

### 2.6 `sync.ts`

```ts
export interface SyncState {
  readonly nav: NavState
  /** Width / height of the audience window, when the sender is an audience view. */
  readonly aspect?: number
}

/** Orders states across tabs. See "newer" below. */
export interface SyncStamp {
  readonly seq: number
  /** `startedAt` of the session that published this state. */
  readonly started: number
  /** Id of the session that published this state. */
  readonly origin: string
}

export type SyncMessage =
  | { readonly type: 'hello'; readonly from: string }
  | { readonly type: 'state'; readonly from: string; readonly stamp: SyncStamp; readonly state: SyncState }

export interface Transport {
  post(message: SyncMessage): void
  /** Returns an unsubscribe function. */
  subscribe(listener: (message: SyncMessage) => void): () => void
  close(): void
}

export interface MemoryHub {
  /** Each call returns a transport for one participant. */
  connect(): Transport
}

/** In-memory stand-in for BroadcastChannel. A post reaches every other open transport, never
 *  the sender. Like BroadcastChannel, delivery is asynchronous: each delivery is queued with
 *  `setTimeout(fn, 0)`, so one sender's messages arrive in order and nothing arrives inside
 *  the `post` call. A transport closed before a queued delivery runs does not receive it. */
export function createMemoryHub(): MemoryHub

export interface SyncSessionOptions {
  /** Unique per tab. */
  readonly id: string
  /** When this tab's session began, in milliseconds since the epoch. The caller supplies it. */
  readonly startedAt: number
  readonly transport: Transport
  /** The session's current local state; used to answer a newcomer. */
  readonly current: () => SyncState
  /** Called when a newer state from another participant should be applied locally. */
  readonly onRemote: (state: SyncState) => void
}

export interface SyncSession {
  /** Tell the other participants about a local change. */
  publish(state: SyncState): void
  /** Stops listening and closes the transport. Later publishes do nothing. */
  close(): void
}

export function createSyncSession(options: SyncSessionOptions): SyncSession

/** Stable channel name for a deck served at a base path, e.g. "react-decks:tides:/demo/tides/". */
export function syncChannelId(deckName: string, base: string): string
```

Every session keeps a stamp for the state it currently shows. It starts at
`{ seq: 0, started: startedAt, origin: id }`. Stamp `a` is newer than stamp `b` when
`a.seq > b.seq`; or the `seq`s are equal and `a.started < b.started` (the session that has
been open longer wins a tie); or both are equal and `a.origin > b.origin` as strings.

1. On creation a session subscribes, then posts `hello`.
2. A session that receives `hello` from another id posts `state` carrying its own stamp,
   unchanged, and `current()`. Every session answers, new or old.
3. A session that receives `state` whose stamp is newer than its own adopts that stamp and
   calls `onRemote(state)`. A `state` whose stamp is not newer is ignored. The stamp is
   adopted before `onRemote` is called.
4. `publish(state)` sets the session's stamp to
   `{ seq: seq + 1, started: startedAt, origin: id }` and posts `state` with it.
5. A message whose `from` equals the session's own id is ignored.
6. Receiving a `state` never causes a post.

What this guarantees, each of which is a test:

| Case | Outcome |
| --- | --- |
| A tab opens or reloads while another is already open, before anyone has navigated (both at `seq` 0) | The older tab's answer wins the tie on `started`, so the new tab adopts the older tab's position, whichever id is greater. The older tab never changes. |
| A tab opens or reloads mid-talk | Its `hello` is answered with a stamp above its own; it adopts the talk's position. Its own answers carry `seq` 0 and are ignored. |
| A new tab publishes before it has heard back, while the talk is at the same `seq` it publishes | The talk's stamp started earlier, so the others ignore the publish and the new tab is brought to the talk's position when the answer arrives. |
| Two tabs open at the same moment on different slides | Both answer each other at `seq` 0; the one with the earlier `startedAt` wins on both sides (equal times fall to `origin`), and they agree. |
| Three tabs; one navigates while another's answer to a newcomer is in flight | The answer carries the older stamp, so the navigating tab ignores it; the newcomer ends on the newest stamp whichever arrives first. All three agree. |
| Two tabs publish at the same moment | Equal `seq`: both sides keep the state from the tab that has been open longer. |
| A tab receives another tab's answer to a newcomer | The stamp equals its own; ignored, no `onRemote`. |
| The only other tab closes before answering a newcomer | The newcomer keeps its own state; nothing is posted after close. |

Known limits, accepted:

- A new tab that navigates twice or more before it has heard any answer can publish a `seq`
  above the talk's and move the others. The window is the few milliseconds between opening
  and the first answer.
- Two tabs created one after the other with exactly equal `startedAt`, where the later one
  has the greater id, stay on their own slides until someone navigates. The runtime passes
  `performance.timeOrigin + performance.now()`, which has sub-millisecond resolution, so
  equal values do not occur in practice.

`onRemote` applying a state must not `publish` it back; the runtime store guards this.

`syncChannelId` normalizes `base` to start and end with `/`.

### 2.7 `canvas.ts`

```ts
export interface CanvasFit {
  /** Factor to transform-scale the frame by. */
  readonly scale: number
  /** Logical size of the frame in design pixels, before scaling. */
  readonly width: number
  readonly height: number
}

export function fitCanvas(
  containerWidth: number,
  containerHeight: number,
  designWidth: number,
  designHeight: number,
): CanvasFit
```

`scale = min(containerWidth / designWidth, containerHeight / designHeight)`.
`width = containerWidth / scale`, `height = containerHeight / scale`. One of the two equals
its design dimension and the other is greater or equal: the frame fills the container with no
letterbox and the design area always fits. A container dimension that is not a positive
finite number returns `{ scale: 1, width: designWidth, height: designHeight }`. A design
dimension that is not a positive finite number throws.

| Container | Design | Result |
| --- | --- | --- |
| 1920 x 1080 | 1920 x 1080 | scale 1, 1920 x 1080 |
| 960 x 540 | 1920 x 1080 | scale 0.5, 1920 x 1080 |
| 1600 x 1200 (4:3) | 1920 x 1080 | scale 0.8333, 1920 x 1440 |
| 2560 x 1080 (21:9) | 1920 x 1080 | scale 1, 2560 x 1080 |
| 0 x 0 | 1920 x 1080 | scale 1, 1920 x 1080 |

## 3. DOM contract (Final)

Kit CSS, deck CSS, tests and tooling select on these and nothing else from the framework.

| Hook | Where | Values |
| --- | --- | --- |
| `data-deck-slide="<no>"` | each slide's root element | the slide number |
| `data-deck-context` | the same element | `slide`, `presenter`, `preview`, `overview`, `print` |
| `data-deck-active` | the same element, present only on the active slide in the play view | |
| `data-deck-view` | `<html>` | `play`, `presenter`, `overview`, `print` |
| `data-deck-motion` | `<html>` | `live`, `instant` |
| `data-deck-idle` | `<html>`, in the play view after 3 s without pointer movement | |
| `data-deck-nav` | `<html>`, during a transition | `forward`, `backward` |
| `data-deck-transition` | `<html>`, during a transition | a slide transition name, or `step` |
| `#deck-root` | the React mount node | |
| `#deck-frame` | the scaled canvas element of the main view | sets `--deck-w`, `--deck-h`, `--deck-scale`, `--deck-text-scale` |
| `#deck-print` | the print container | |
| `data-step-state` | each step primitive's element | `before`, `current`, `after`, `gone` |

Framework UI classes are prefixed `rd-` and live in `@layer react-decks`. The framework ships
no CSS reset.

## 3.1 Deck layout (Final)

```
<deck>/
  deck.config.ts      export default defineDeck({ ... })
  package.json        depends on @react-decks/runtime; dev-depends on @react-decks/node
  slides/*.mdx        one file per slide, ordered by filename
  components/*.tsx    optional; provided to every slide without an import
  styles/index.css    optional; loaded once, after framework styles
  public/             optional; served at the site root
```

There is no `index.html` and no slide manifest file in a deck. `examples/basic` is the
reference.

Slides are every `.mdx` file directly under `slides/`, sorted by filename compared as plain
strings (`"02-a" < "10-b"`). A slide's `id` is its filename without `.mdx`. Frontmatter:

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `title` | string | the slide's `id` | shown in overview, PDF outline and embed metadata |
| `clicks` | integer >= 0 | counted (section 6.2) | number of clicks after the initial state |
| `morphSteps` | boolean | false | clicks on this slide commit through a view transition (section 4.3) |
| `hide` | boolean | false | when true the slide is dropped before numbering and never compiled into the deck |
| `transition` | string | none | transition into the following slide |

Any other key is kept and reaches the slide through `useSlide().frontmatter`. A `clicks` that
is not a non-negative integer, a `title` or `transition` that is not a string, or a `hide`
that is not a boolean is an error naming the file and the key. A deck with no visible slide is
an error.

A component file under `components/` provides each of its named exports, and its default
export under the file's basename, to MDX under that name. Two files exporting the same name
is an error naming both files. A wildcard re-export (`export * from "..."`) is an error
naming the file: re-export by name instead. Type-only exports are ignored. Subdirectories
are not scanned.

`<Notes>...</Notes>` in a slide holds speaker notes as markdown. It is removed from the
slide's rendered output at compile time and collected into the notes module. More than one
`<Notes>` in a slide is an error naming the file.

## 4. runtime (Outline)

- Store: `createDeckStore(manifest, locationAdapter, transport?)`, a zustand vanilla store
  whose only reducer is core's `navigate`; components read it through selector hooks. The URL hash is the source of truth: clicks are written with
  `replaceState`, slide changes with `pushState`.
- Hooks: `useDeck()` returns `{ slide, total, clicks, clicksTotal, slides, view, isPrint,
  next, prev, nextSlide, prevSlide, go }`. `useSlide()` returns `{ no, clicks, clicksTotal,
  isActive, renderContext, frontmatter }`. `useSlideScale()` returns the canvas scale.
- `SlideFrame` applies `fitCanvas`. `SlideHost` mounts one slide inside a slide context, so
  previews and print render a slide at any click without touching the URL.
- `PlayView` mounts the current, previous and next slide. Inactive slides are `display: none`.
  Every slide module is prefetched when the browser is idle, without mounting.
- `transition.ts` owns view-transition state: `runTransition(commit, kind)`,
  `transitionInFlight()`, `afterTransition()`. Slide changes transition; a click transitions
  only on a slide with `morphSteps` (section 4.3).
- Registries, because runtime cannot import the packages above it:
  `registerSettleProbe(isBusy: () => boolean)` and
  `registerCaptionProvider(read: (slideRoot: Element) => { lead: string; body: string } | null)`.
  `settled()` resolves when no finite animation from `document.getAnimations()` is running,
  no probe reports busy and no transition is pending.
- `embed.ts`: the `decks:*` postMessage protocol.
- `viewer.ts`: pinch zoom, pan, reset, and text sizing through `--deck-text-scale`.
- `PresenterView`, `OverviewView`, `PrintView`, keyboard map, wake lock, idle cursor, `Notes`.

## 4.1 runtime, Phase 2 surface (Final)

```ts
import type { MDXComponents } from "mdx/types";
import type { ComponentType, ReactElement, ReactNode } from "react";
import type { DeckManifest, DeckView, NavAction, NavState, SlideMeta } from "@react-decks/core";

export type SlideLoader = () => Promise<{ default: ComponentType<{ components?: MDXComponents }> }>;

/** Everything the generated entry hands to the runtime. */
export interface DeckSource {
  readonly manifest: DeckManifest;
  /** Keyed by slide id. */
  readonly slides: Readonly<Record<string, SlideLoader>>;
  /** Keyed by slide id. */
  readonly frontmatter: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly components: MDXComponents;
  /** Rendered notes keyed by slide id, one entry per segment; loaded only by views that show notes. */
  readonly loadNotes?: () => Promise<Readonly<Record<string, readonly NoteHtml[]>>>;
}

/** One note segment after rendering: the click it belongs to and its HTML. */
export interface NoteHtml {
  readonly click: number;
  readonly html: string;
}

export interface DeckState {
  readonly nav: NavState;
  readonly view: DeckView;
  readonly embedded: boolean;
  readonly bridge: boolean;
}

export interface DeckStore {
  getState(): DeckState;
  subscribe(listener: () => void): () => void;
  dispatch(action: NavAction): void;
  /** Removes the window listeners. */
  destroy(): void;
}

/** Binds to `window.location` and `window.history`. */
export function createDeckStore(manifest: DeckManifest): DeckStore;

export function Deck(props: { source: DeckSource; store: DeckStore }): ReactElement;

/** Creates a store, renders `Deck` into `root` (default `#deck-root`), returns an unmount function. */
export function mountDeck(source: DeckSource, root?: HTMLElement): () => void;

export interface DeckApi {
  readonly slide: number;
  readonly total: number;
  readonly clicks: number;
  readonly clicksTotal: number;
  readonly slides: readonly SlideMeta[];
  readonly view: DeckView;
  readonly isPrint: boolean;
  next(): void;
  prev(): void;
  nextSlide(): void;
  prevSlide(): void;
  go(slide: number, click?: number): void;
}
export function useDeck(): DeckApi;

export type RenderContext = "slide" | "presenter" | "preview" | "overview" | "print";

export interface SlideApi {
  readonly no: number;
  readonly id: string;
  /** The click this instance of the slide renders at. */
  readonly clicks: number;
  readonly clicksTotal: number;
  /** True only for the current slide in the play view. */
  readonly isActive: boolean;
  readonly renderContext: RenderContext;
  readonly frontmatter: Readonly<Record<string, unknown>>;
}
export function useSlide(): SlideApi;

/** The scale the nearest SlideFrame applies; 1 outside a frame. */
export function useSlideScale(): number;

/** The adaptive canvas. `main` marks the one frame that owns `#deck-frame`. */
export function SlideFrame(props: { main?: boolean; children: ReactNode }): ReactElement;

/** One slide in a slide context. `clicks` defaults to `clicksForSlide` for the deck's position. */
export function SlideHost(props: { no: number; context: RenderContext; clicks?: number }): ReactElement;

export function PlayView(): ReactElement;

/** Speaker notes. The compiler removes it from slides; rendering it yields nothing. */
export function Notes(props: { children?: ReactNode }): null;
```

The store is a zustand vanilla store internally; `DeckStore` is the surface the rest of the
runtime and the tests use.

| Event | Store behaviour |
| --- | --- |
| Created | Parses `location.hash` and `location.search`, clamps with `clampNav`. If the hash is not the canonical `formatHash` of that state, rewrites it with `history.replaceState`. |
| `dispatch`, state unchanged | Nothing: no history entry, no notification. |
| `dispatch`, only the click changed | State updates, hash rewritten with `replaceState`, subscribers notified once. |
| `dispatch`, the slide changed | State updates, hash written with `pushState`, subscribers notified once. |
| `hashchange` or `popstate` (edited URL, back, forward) | Re-parses and clamps; state updates and subscribers are notified if it differs; a non-canonical hash is rewritten with `replaceState`. |
| Any write | `location.search` is preserved. |
| `destroy` | Listeners removed; later URL changes do not notify. |
| `dispatch` while the view is `overview` or `print` | Nothing. The overview moves the talk through `setView` (section 4.2); print has no position. |

`useDeck` and `useSlide` throw an `Error` naming the missing provider when used outside
`Deck` or outside a `SlideHost`.

`Deck` sets `data-deck-view` and `data-deck-motion="live"` on `<html>`, provides the source and
store, and renders the view for `DeckState.view`. `SlideHost` passes `source.components` to
each slide through the MDX content component's `components` prop; compiled slides do not
import `@mdx-js/react` and there is no `MDXProvider`. In Phase 2 every view renders `PlayView`.

`PlayView`:

- Mounts a `SlideHost` with context `slide` for the current slide and for the slides directly
  before and after it, inside one `SlideFrame main`. Slides further away are not mounted.
- Each slide root is an element with `data-deck-slide` and `data-deck-context` (section 3).
  The current one has `data-deck-active`; the others have the `hidden` attribute.
- A slide whose module has not loaded renders nothing until it has. When the browser is idle
  after the first render, every slide module is requested once. A slide whose module has
  already loaded renders in the same frame it is mounted in: jumping to any prefetched slide
  shows no blank frame. The choice is made once per mount: a host that mounted before its
  module loaded keeps its Suspense wrapper for that mount, so the slide's local state is not
  reset when the module arrives.
- A slide whose module fails to load, or whose component throws, shows an error naming the
  slide id in place of that slide only; the rest of the deck keeps working, and the next
  mount of that slide tries the load again.
- A slide root with the `hidden` attribute is not displayed, whatever the deck's own CSS
  says about `[data-deck-slide]`.
- Keys, bound with `tinykeys` on `window`:

| Key | Action |
| --- | --- |
| `ArrowRight`, `Space`, `PageDown` | `next` |
| `ArrowLeft`, `Shift+Space`, `PageUp` | `prev` |
| `ArrowDown` | `nextSlide` |
| `ArrowUp` | `prevSlide` |
| `Home` | `go(1)` |
| `End` | `go(total)` |

  A key is ignored when the event target is an `input`, `textarea`, `select` or
  contenteditable element, and while it auto-repeats: holding a key down advances once.
  This is `tinykeys`' default behaviour; do not replace it.

`SlideFrame` measures its parent with `ResizeObserver`, applies `fitCanvas` with the
manifest's canvas, sizes its content to the logical width and height in px, transform-scales
it from the top left, makes it a CSS size container, and sets `--deck-w`, `--deck-h` and
`--deck-scale` (unitless numbers) on it. Where `ResizeObserver` does not exist it renders at
the design size with scale 1.

## 4.2 runtime, Phase 3 surface: presenter, overview, sync (Final)

```ts
import type { NavState, Transport } from "@react-decks/core";

export interface DeckState {
  // ...the Phase 2 fields, plus:
  /** Width / height of the audience window, once a play view has reported it. */
  readonly audienceAspect?: number;
}

export interface DeckStore {
  // ...the Phase 2 members, plus:
  /** Switches view, optionally moving to `nav` (clamped) in the same step. One history write:
   *  `pushState` when the slide changes, `replaceState` otherwise, so Back always steps the
   *  talk and never returns to the overview. Does nothing when nothing would change. */
  setView(view: DeckView, nav?: NavState): void;
}

/** `transport` joins the store to other windows of the same deck. Without it the store is local. */
export function createDeckStore(manifest: DeckManifest, options?: { transport?: Transport }): DeckStore;

/** A `Transport` over `BroadcastChannel`. */
export function createBroadcastTransport(channelId: string): Transport;

export function PresenterView(): ReactElement;
export function OverviewView(): ReactElement;
```

The store's position (`nav`, the hash) is always the talk's position. The overview does not
move it while the user browses: its highlight is DOM focus, local to the view. `dispatch`
stays a no-op in `overview` and `print`; the overview moves the talk only through `setView`.

### Sync

`mountDeck` creates a transport with
`createBroadcastTransport(syncChannelId(manifest.name, base))`, where `base` is
`location.pathname` with a trailing `index.html` removed, unless `BroadcastChannel` is
missing, the location is `?decks-bridge` or `?embedded`, or the view at mount is `print`.
The decision is made once at mount. With a transport, the store creates one
`createSyncSession` for its lifetime, with a random id (`crypto.randomUUID()`, or 16 bytes
from `crypto.getRandomValues` as hex where that is missing, as on plain HTTP) and
`startedAt = performance.timeOrigin + performance.now()`.

`current()` returns `{ nav, aspect }`, where `aspect` is `innerWidth / innerHeight` when the
view is `play`, and the store's `audienceAspect` (absent until known) in any other view, so a
presenter's answer to a newcomer carries the room's aspect. Every publish sends the same shape, read at the moment
of publishing.

| Event | Store behaviour |
| --- | --- |
| Created | Publishes nothing. |
| The position changes locally: `dispatch`, `setView` with a `nav`, an edited URL, back, forward | Publishes. |
| The view changes and the position does not | Publishes nothing. |
| The window resizes in the `play` view and `aspect` changed | Publishes, at most once per 250 ms, trailing. |
| A newer remote state arrives | Applies `nav` (clamped) in any view, written to the hash with the same rule as a local change (`pushState` when the slide changed, `replaceState` for a click), notifies subscribers once, publishes nothing. If the state carries `aspect`, sets `audienceAspect`. |
| `hashchange` or `popstate` | The URL-derived fields are merged into the state; `audienceAspect` is kept. |
| `destroy` | Closes the session and the transport. |

Remote slide changes are pushed so that every window's history is the talk's history and a
back gesture steps one slide back for the whole room.

Accepted limits:

- A mistyped hash (`#/abc`) parses as slide 1, as it does on load, and the room follows.
- With several play windows open, the presenter shows the aspect of whichever published last.
- A resize publish and a navigation in another window within the same few milliseconds tie on
  `seq`; the window that has been open longer wins, which can undo the navigation.
- A window mounted in `print` and then edited to another view stays unsynced until reload.

### Views and keys

`Deck` renders `PlayView`, `PresenterView` or `OverviewView` by `DeckState.view` (print comes
in Phase 5 and renders `PlayView` until then) and sets `data-deck-motion` to `live` in the
play view and `instant` in every other view. `Deck` keeps two things in memory above the
view switch: the timer (below) and the home view, the last of `play` and `presenter` shown.
When the view at mount is `overview`, the home view is `presenter` if `window.name` starts
with `react-decks-presenter:` and `play` otherwise.

Keys added to the Phase 2 table:

| Key | Action |
| --- | --- |
| `o` | From play or presenter: `setView("overview")`. From the overview: `setView(home)`. |
| `Escape` | In the overview: `setView(home)`. The position is untouched, clicks included. |
| `p` | In the play view, when not embedded: opens the presenter window. |
| `f` | In every view: toggles fullscreen on `document.documentElement`. |

The presenter window: `const w = window.open("", "react-decks-presenter:" + channelId)`. If
`w.location.href` is `about:blank`, set it to the current URL with the hash formatted for the
presenter view at the current position. Then `w.focus()`. An existing presenter is focused
and not navigated. If `window.open` returns null (a popup blocker), nothing happens.

### `PresenterView`

Four regions, each a landmark with an accessible name:

- "Current slide": `SlideHost` at the store's position, context `presenter`, in the
  `SlideFrame main`.
- "Next": `SlideHost` at `navigate(nav, { type: "next" })`, context `preview`, in a
  `SlideFrame`. On the deck's last frame it shows the text "End of deck" and no slide.
- "Notes": every note segment of the current slide, in order, as HTML. The segment with the
  greatest `click` not above the current click has `aria-current="true"` and is scrolled into
  view (`scrollIntoView({ block: "nearest" })`) when it changes. While notes load, the
  region is empty. A slide with no segments, or only empty ones, or a deck without
  `loadNotes`, shows "No notes for this slide". A rejected load shows "Notes failed to load".
- A status bar: the position as "5 / 12", the click as "click 2 of 3" when the slide has
  clicks, the local time as 24-hour `HH:MM`, and the timer.

Both slide boxes have the CSS `aspect-ratio` of `audienceAspect`, falling back to the
canvas's design ratio, so the speaker sees the framing the room sees. Navigation keys work as
in the play view.

Timer: `00:00` and stopped until the first position change, local or remote, after `Deck`
mounts; then it counts up once a second as `mm:ss`, or `h:mm:ss` from one hour. A button
named "Reset timer" returns it to `00:00`, stopped; the next position change starts it again.
Its state lives in `Deck`, so opening the overview does not reset it; a reload does. It is
not synced. One interval drives the timer and the clock and is cleared on unmount.

Note HTML is compiled from the deck author's own markdown at build time and is rendered with
`dangerouslySetInnerHTML`.

### `OverviewView`

A scrollable grid with one button per slide, named "Slide 3: <title>", each showing
`SlideHost` with context `overview` at that slide's last click inside a `SlideFrame` in a box
of the canvas's design ratio. The button for the store's current slide has
`aria-current="true"`, and on entry it is focused and scrolled into view.

In every view a navigation key is ignored when the event target is a button or inside one,
so `Space` and `Enter` on a focused button do the button's own job.

Arrow keys move focus: `ArrowRight` and `ArrowDown` to the next button, `ArrowLeft` and
`ArrowUp` to the previous, `Home` and `End` to the first and last. Nothing is bound to
`Enter` or `Space` globally; activating a button the native way (click, `Enter`, `Space`)
calls `setView(home, { slide: no, click: 0 })`, except on the current slide's button, where
it calls `setView(home)` and so keeps the click. The slide content inside each button is
`inert`, so it adds no tab stops. Every slide is mounted; decks here have at
most a few dozen slides and a stage outside the `slide` context renders one static frame.
This is an accepted limit, not a place to add virtualization.

### Wake lock, idle cursor

In the play and presenter views the runtime holds a screen wake lock
(`navigator.wakeLock.request("screen")`) while the document is visible, requests it again
when the document becomes visible, and releases it on leaving those views. A rejected request
is expected (battery saver, an unfocused window) and is ignored; where the API is missing
nothing happens.

In the play view, after 3 s without a `pointermove`, `<html>` gets `data-deck-idle` and the
framework's CSS hides the cursor; the next `pointermove`, or leaving the play view, removes
it.

### Behaviour that needs a browser test

| Situation | Outcome |
| --- | --- |
| Play window on slide 3 click 1; press `p` | A presenter window opens on slide 3 click 1. Pressing `p` again opens no second window and does not move the presenter. |
| Advance in the presenter | The play window follows, URL included. Advance in the play window and the presenter follows. |
| Reload the presenter mid-talk | It returns to the talk's position; the play window does not move. |
| Reload the play window mid-talk | It returns to the talk's position; the presenter does not move. |
| Open a third window at `#/1` mid-talk | It is brought to the talk's position; the others do not move. |
| Presenter opens the overview, arrows to another slide, presses `Escape` | The audience never moved; the presenter is back on the talk's slide and click. |
| Presenter opens the overview and activates slide 6 | Both windows go to slide 6, click 0, and the presenter is in the presenter view. |
| The audience window reloads while the presenter is browsing the overview | The audience returns to the talk's position, not the focused tile. |
| Presenter reloaded while in the overview, then `Escape` | It returns to the presenter view. |
| The talk advances three slides from the play window; press back in the presenter | Both windows step back one slide. |
| Presenter on a slide with `[click]` notes; advance a click | The segment for that click becomes the current one. |
| Play window resized to 4:3; then the presenter reloads | The presenter's two slide boxes are 4:3 before and after the reload. |
| Open the overview from the presenter after the timer started | On return the timer has kept counting. |
| Two decks served from one origin at different paths, each with two windows | Navigating one deck does not move the other. |
| The same built deck opened as `/dir/` and `/dir/index.html` | The two windows sync. |

## 4.3 runtime, Phase 3 surface: transitions, motion mode, settle (Final)

```ts
/** Registers something that can be mid-animation where `document.getAnimations()` cannot see
 *  it. Returns a function that removes it. */
export function registerSettleProbe(isBusy: () => boolean): () => void;

declare global {
  interface Window {
    /** Set by `mountDeck`, removed on unmount. */
    __deck?: { settled(): Promise<void> };
  }
}
```

### Motion mode

`Deck` sets `data-deck-motion` to `instant` when the view is not `play`, or
`(prefers-reduced-motion: reduce)` matches (followed live; where `matchMedia` is missing, as
in jsdom, it counts as not matching), or the page's search string has
`motion=instant` (what `shot`, `snap` and print use). Otherwise `live`.

### Presented and logical state

A view transition has to snapshot the old DOM before React commits the new one, and the
browser calls the update callback a frame after `startViewTransition`. So the store keeps two
states. The logical state changes at once on `dispatch`, `setView`, a remote state or a URL
change. The presented state is what `getState()` returns and what subscribers are notified
about; it catches up with the logical state either at once or inside a transition's update
callback.

Everything inside the store reads and writes the logical state: `dispatch`, `setView`, the
`hashchange`/`popstate` handler (which compares with and merges into it), the remote-state
handler, the resize handler, the URL writes, and `current()` and every publish (position and
view). Only `getState` and `subscribe` expose the presented state. Two key presses in one
frame therefore advance two steps, a sync answer during a transition carries the new
position, and Back during a transition is not ignored.

`createDeckStore`'s options gain `present?: (change: { from: DeckState; to: DeckState }, apply: () => void) => void`.
The store calls it after every logical change, with the presented state at that moment and
the new logical state. `apply()` sets the presented state to the logical state as it is when
`apply` runs (not to `to`) and notifies if it differs, so a late `apply` can never put an
older state on screen and a second `apply` is a no-op. Without the option the store applies
at once. `mountDeck` passes the runtime's presenter, below.

`createSlideModules(source)` returns the same map for the same source (kept in a `WeakMap`),
so `mountDeck` and `Deck` share it and the presenter can ask whether a slide's module has
resolved.

### When a change transitions

For each change the presenter decides, in this order:

1. If a transition's update callback has not run yet, start nothing: that callback will apply
   the latest logical state. If the new logical state equals the presented state, call
   `skipTransition()` on the pending transition.
2. Otherwise, if the change must not animate, call `skipTransition()` on any transition still
   in flight and `apply()` now, without `flushSync` (a dispatch can come from an effect).
   A change must not animate when any of these holds: `document.startViewTransition` is
   missing; `data-deck-motion` is `instant`; the view is not `play` both before and after;
   the position did not change; the target slide's module has not resolved; the transition
   name is `cut`. No transition attributes are set.
3. Otherwise call `document.startViewTransition(() => flushSync(apply))`.

| Change | Transition name |
| --- | --- |
| To the next slide (`n` to `n + 1`) | Slide `n`'s `transition`, else the manifest's, else `fade`. |
| To the previous slide (`n + 1` to `n`) | The same boundary: slide `n`'s `transition`, else the manifest's, else `fade`. |
| A jump of more than one slide | The manifest's `transition`, else `fade`. |
| A click on a slide with `morphSteps` | `step`. |
| A click on any other slide | None; applied at once. |

The name and direction come from the presented state and the logical state at the moment the
transition starts. While it is in flight `<html>` has `data-deck-transition="<name>"` and
`data-deck-nav="forward"` or `"backward"` (by slide number, then click). Both are set before
`startViewTransition` is called and removed when its `finished` promise settles, unless a
newer transition has replaced them. A change that arrives after the callback ran starts its
own transition; the browser skips the old one to its end. The `ready`, `finished` and
`updateCallbackDone` promises are all given a rejection handler: a skipped transition
rejects `ready`, which is expected.

The presenter window never transitions (its view is not `play`).

### Presets

`transition.css`, in `@layer react-decks`, styles the root snapshot per name. Durations and
eases read the motion tokens with fallbacks (`var(--deck-dur-slow, 600ms)`), because runtime
cannot import the motion package.

| Name | Root animation |
| --- | --- |
| `cut` | None; never starts a view transition. |
| `fade` | Old fades out, new fades in, over `--deck-dur-base`. |
| `push` | Old slides out and new slides in horizontally by the full width, leftward when `forward`, rightward when `backward`, over `--deck-dur-slow` with `--deck-ease-settle`. |
| `zoom` | Old scales up to 1.08 and fades, new scales from 0.94 and fades in, reversed when `backward`, over `--deck-dur-slow`. |
| `step` | The old root snapshot is hidden (`display: none`) and the new root has `animation: none`, so the live slide shows through with its steps' own CSS transitions. Leaving both root snapshots visible would add them together (the browser blends them `plus-lighter`). |

For every name, a named group (`::view-transition-group(*)` other than `root`) moves and
resizes over `--deck-dur-slow` with `--deck-ease-settle`, so an element with the same
`view-transition-name` before and after glides to its new place under any preset. A deck
defines its own transition by naming it in frontmatter and writing CSS against
`html[data-deck-transition="<name>"]::view-transition-old(root)` and `new(root)`; a name with
no CSS gets the browser's cross-fade.

### `settled()`

Resolves once, for two consecutive animation frames: no view transition is in flight, no
change is waiting to be applied, no registered probe reports busy, and no animation from
`document.getAnimations()` is running with a finite end (an animation with infinite
iterations or infinite duration is ignored, so a looping logo does not block it). It never
rejects. After a change made in another window, wait for the URL first: the message may not
have arrived yet. Tests, `shot`, `snap` and export wait on it instead of sleeping.

### Behaviour that needs a browser test

| Situation | Outcome |
| --- | --- |
| ArrowRight across a `fade` boundary | `data-deck-transition="fade"` and `data-deck-nav="forward"` appear, then are removed; `settled()` resolves after they are gone; the URL changed at once. |
| ArrowLeft back across it | The same name with `data-deck-nav="backward"`. |
| ArrowRight twice within one frame at a slide boundary | The deck ends two steps on with one transition; no step is lost. |
| ArrowRight then ArrowLeft within one frame at a slide boundary | The deck, the URL and a second window all end where they started. |
| ArrowRight then `o` within one frame | The overview is shown, with no transition attributes left on `<html>`. |
| Browser Back in the frame after ArrowRight across a boundary | The deck and the URL agree on the earlier slide. |
| ArrowRight across a boundary, sampled when the update callback is done | The new slide's content is in the DOM and visible: the snapshot is not blank. |
| A second window answers a newcomer during the first window's transition | The newcomer lands on the new position. |
| ArrowRight, then ArrowRight again mid-transition | Ends on the second target; the first transition's attributes do not linger. |
| A slide with `transition: cut` | No `data-deck-transition` attribute ever appears. |
| `?motion=instant` or reduced motion | No transition; `data-deck-motion="instant"`. |
| A click on a slide without `morphSteps` | No transition. With `morphSteps`, `data-deck-transition="step"`. |
| End from slide 1 before the last slide's module loaded | A cut to the last slide, no error. |
| End and Home at `?motion=instant` | The slide paints in the next animation frame. This replaces the existing test "Prefetched slides paint in the next animation frame when jumping", which now runs with `?motion=instant`. |
| The presenter window while the audience transitions | No transition attributes in the presenter. |

## 5. motion (Outline)

- Tokens: `motion.duration.{quick,base,slow}`, `motion.ease.{enter,exit,settle,draw}`,
  `motion.stagger`, as `--deck-dur-*` / `--deck-ease-*` and JS constants. `instant` motion
  zeroes them.
- Step primitives on `stepState`: `Step`, `Stagger`, `TextReveal`, `Draw`, `CountUp`,
  `Highlight`, with a closed preset set (`fade`, `rise`, `scale`, `blur`, `wipe`, `draw`).
- `Morph`: assigns a `view-transition-name` while its slide is active.
- `useTimeline((tl, beat) => void)`: a gsap timeline with one label per click; plays forward,
  reverses backward, jumps when motion is `instant`. Owns gsap setup.
- `useTween(initial)`: a stable object gsap can tween; the owning component re-renders once
  per animation frame while it changes.

Decided at checkpoint 1 (`docs/spikes/parity.md` has the measurements):

- `useTween` stays as designed: a stable Proxy over the initial numeric fields, read through
  `useSyncExternalStore`. A changed field schedules one notification on `gsap.ticker`, so the
  render lands in the same frame as gsap's update. A separate `requestAnimationFrame` queue
  halved the visible update rate and is not used. On the 102-cell waffle stage React matched
  Vue's frame interval at 1x and 4x CPU throttle, so no mark writes through refs. If a later
  stage does drop frames, that mark alone moves to gsap writing attributes through refs.
- `useTimeline` builds in a layout effect, after child `useImperativeHandle` refs exist, and
  keeps the Slidev rule: seek on first run, when inactive, outside the `slide` context, when
  motion is `instant`, or on a jump of more than one beat; otherwise tween, retargeting from
  the visible position on a rapid second click. Killed on unmount.

## 5.1 motion, Phase 3 surface: tokens, steps, timelines (Final)

```ts
import type { StepState } from "@react-decks/core";
import type { DependencyList, ReactElement, ReactNode } from "react";

/** The one gsap instance, with the motion eases registered and `ease.settle` as default. */
export { gsap };

/** Seconds. */
export const duration: { readonly quick: 0.14; readonly base: 0.3; readonly slow: 0.6 };
/** gsap ease names, registered with CustomEase. */
export const ease: { readonly enter: "deckEnter"; readonly exit: "deckExit"; readonly settle: "deckSettle"; readonly draw: "deckDraw" };
/** Seconds between items of a staggered group. */
export const stagger: 0.06;

/** "instant" when `<html data-deck-motion>` is `instant` or missing. Reads the DOM: call it
 *  in an effect or a handler, never during render. */
export function motionMode(): "live" | "instant";

export type StepPreset = "fade" | "rise" | "drop" | "scale" | "blur" | "wipe";
type StepElement = "div" | "span" | "li" | "p" | "g";

/** The state of a step on the slide it is rendered in. Throws when `until <= at`. */
export function useStepState(at: number, until?: number): StepState;

export function Step(props: {
  at: number; until?: number;
  enter?: StepPreset; exit?: StepPreset;
  as?: StepElement; className?: string; children?: ReactNode;
}): ReactElement;

/** One click per child: child `i` (from 0) is a `Step` at `from + i`. */
export function Steps(props: { from: number; enter?: StepPreset; as?: "div" | "ul" | "ol"; className?: string; children?: ReactNode }): ReactElement;

/** One click for the whole group; the children enter one after another, `stagger` apart. */
export function Stagger(props: { at: number; until?: number; enter?: StepPreset; as?: "div" | "ul" | "ol"; className?: string; children?: ReactNode }): ReactElement;

/** Reveals text piece by piece on one click. */
export function TextReveal(props: { at: number; by?: "word" | "char"; enter?: StepPreset; children: string }): ReactElement;

/** A marker stroke swept behind inline text from click `at`. */
export function Highlight(props: { at: number; until?: number; children?: ReactNode }): ReactElement;

/** A number that counts from `from` to `to` on click `at`. */
export function CountUp(props: { at: number; from?: number; to: number; format?: (value: number) => string }): ReactElement;

/** Draws the strokes of its SVG shape children on click `at`. Renders a `<g>`. */
export function Draw(props: { at: number; until?: number; children?: ReactNode }): ReactElement;

/** A stable object whose numeric fields gsap tweens; see below. */
export function useTween<T extends Record<string, number>>(initial: T): T;

/** A paused gsap timeline positioned by the slide's click; see below. */
export function useTimeline(
  build: (tl: gsap.core.Timeline, beat: (n: number) => void) => void,
  deps?: DependencyList,
): void;
```

### Tokens

`motion.css`, imported by the package entry, defines on `:root`: `--deck-dur-quick: 140ms`,
`--deck-dur-base: 300ms`, `--deck-dur-slow: 600ms`, `--deck-stagger: 60ms`,
`--deck-ease-enter: cubic-bezier(.16,1,.3,1)`, `--deck-ease-exit: cubic-bezier(.7,0,.84,0)`,
`--deck-ease-settle: cubic-bezier(.32,.72,0,1)`, `--deck-ease-draw: cubic-bezier(.65,0,.35,1)`.
The JS `ease` names are the same four curves registered with `CustomEase`. Under
`html[data-deck-motion="instant"]` the three durations and the stagger are `0ms`. A unit test
(`tests/motion-tokens.test.ts`, in the Node project) reads `motion.css` and fails if a CSS value and its JS constant disagree. Theme overrides of
these tokens arrive with themes in Phase 4; until then they are fixed.

All of the package's CSS is in `@layer react-decks`.

### Steps

Every step primitive's root element carries `data-step-state` (`before`, `current`, `after`,
`gone`, from core's `stepState` at the slide's click, read with `useSlide()`),
`data-step-enter` and `data-step-exit` (the preset names; `exit` defaults to `fade`, `enter`
to `fade`). In the `before` and `gone` states the element also has `aria-hidden="true"` and
`inert`. Children are always rendered, so a step keeps its place in the layout while hidden.

The motion is CSS only: `before` holds the enter preset's start pose, `current` and `after`
hold the natural pose, `gone` holds the exit preset's end pose, with `opacity`, `transform`,
`filter` and `clip-path` transitioning over `--deck-dur-base` with `--deck-ease-enter`
(entering) or `--deck-ease-exit` (leaving). Going back a click is the same transition in
reverse, and a slide rendered at any click with motion `instant` shows that click's poses.
Start poses: `fade` opacity 0; `rise` opacity 0 and 24px down; `drop` opacity 0 and 24px up;
`scale` opacity 0 and scale 0.92; `blur` opacity 0 and `blur(12px)`; `wipe`
`clip-path: inset(0 100% 0 0)`. Hidden states use `visibility: hidden`, delayed until the
transition has run.

| Component | Behaviour |
| --- | --- |
| `Step` | As above, on an element chosen by `as` (default `div`). |
| `Steps` | Wraps each child in a `Step` at `from + index` with the given `enter`, skipping whitespace-only text (MDX puts newlines between block children). With `as="ul"` or `"ol"` each wrapper is an `li`; otherwise a `div`. |
| `Stagger` | One step state for the group on the container; each child is wrapped in an element with `--step-index: <index>`, and its transition is delayed by `index * --deck-stagger` when entering. The delay sits on the CSS rule for the visible states, so any move into `current` or `after` is staggered (re-entering from `gone` included) and any move into `before` or `gone` is not. |
| `TextReveal` | Splits `children` on whitespace (`by="word"`, the default) or into characters. The root is a `span` holding a visually hidden `span` with the whole text, then the pieces inside an `aria-hidden` `span`, each piece a `span` with `--step-index`, staggered like `Stagger`. Whitespace between words is preserved. |
| `Highlight` | A `mark` whose background (the `--deck-highlight` color, default a translucent `currentColor`) grows from zero to full width over `--deck-dur-slow` with `--deck-ease-draw` when its state is `current` or `after`. Its text is always visible; it is never `inert` or `aria-hidden`. |
| `CountUp` | Shows `format(from)` (default `from` 0) before click `at` and `format(to)` from it. On the live transition from `before` to `current` in the `slide` context it tweens the value over `duration.slow` with `ease.settle`; going back, or motion `instant`, or any other context, shows the value for the state with no tween. Default `format` rounds to an integer and uses `Intl.NumberFormat`. The root is a `span` holding a visually hidden `span` with the formatted value for the current state (`format(from)` before `at`, `format(to)` from it) and the animated number in an `aria-hidden` `span`. Like `Highlight` it is always visible and never `inert` or `aria-hidden`. |
| `Draw` | A `g` with the step attributes. Each direct child that is an SVG shape element (`path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`) gets `pathLength="1"`; CSS sets `stroke-dasharray: 1` and moves `stroke-dashoffset` from 1 (`before`, `gone`) to 0 over `--deck-dur-slow` with `--deck-ease-draw`. |

A step outside a `SlideHost` throws through `useSlide()`.

### `useTween`

Returns the same object for the component's lifetime: a Proxy over a copy of `initial`.
Setting one of the initial numeric fields to a different value schedules one notification on
`gsap.ticker` (so the render lands in the frame gsap updated in) and the owning component
re-renders through `useSyncExternalStore`. Several fields set in one tick cause one render.
Nothing is scheduled while no field changes. Fields that were not in `initial` (gsap's own
cache) never notify. The pending ticker callback is removed on unmount.

### `useTimeline`

Builds one paused timeline in a layout effect (child `useImperativeHandle` refs exist by
then), calling `build(tl, beat)`; `beat(n)` adds the label `beat<n>` at the current end. The
first call in `build` must be `beat(0)` and labels must increase by one; otherwise it throws,
naming the label. The timeline is killed and rebuilt when `deps` change, and killed on
unmount.

After each build and whenever the slide's click, active flag or render context changes, the
timeline is positioned at the label for the click (clamped to the last label):

| Situation | Positioning |
| --- | --- |
| First positioning after a build | Seek. |
| The slide is not active, or the context is not `slide`, or `motionMode()` is `instant` | Seek. |
| The click moved by more than one | Seek. |
| The click moved by one on the active slide | Tween to the label with `ease: "none"` (the tweens inside carry their own eases). |
| A second move arrives while a tween is running | The running tween is killed; the new one starts from the visible position and takes at most the duration of one step. |

### Behaviour that needs a browser test

Against `examples/motion`, one slide per primitive and preset:

| Situation | Outcome |
| --- | --- |
| Each preset slide at click 0, then after ArrowRight and settling | The step's computed opacity is 0 (or its clip hides it) before, and its pose is the natural one after. |
| Forward one click, back one click, on every gallery slide | Computed opacity, transform, filter and clip-path of every step element equal their values before the forward click. |
| Each gallery slide loaded directly at its last click with `data-deck-motion="instant"` | The same computed poses as arriving there by clicking with motion live and letting it settle. |
| `Stagger` of four children, sampled mid-entry | The children's opacities are in non-increasing order from first to last, and not all equal. |
| `CountUp` from 0 to 1200 | Shows 0, then values strictly between during the tween, then 1,200; back shows 0 at once. |
| `useTimeline` slide: ArrowRight twice within 100 ms | Ends at the click-2 pose with no jump back to the click-0 pose on the way. |
| `useTimeline` slide reloaded at `?clicks=2` | The click-2 pose in the first painted frame. |
| `useTween` slide during a beat | The tweened attribute changes on every animation frame of the beat, and stops changing when it ends. |

## 5.2 motion, Phase 3 surface: `Morph` and the settle probe (Final)

```ts
/** Gives its element a `view-transition-name` while its slide is the active one in the play
 *  view. An element with the same name on the next slide, or at the next click of a slide
 *  with `morphSteps`, moves and resizes to the new place and cross-fades. */
export function Morph(props: { name: string; as?: "div" | "span" | "h1" | "h2" | "h3" | "p" | "figure" | "g"; className?: string; children?: ReactNode }): ReactElement;
```

`name` must be a CSS identifier (`/^[A-Za-z_][A-Za-z0-9_-]*$/`) other than `root` and `none`;
anything else throws naming it. The name is set as an inline `view-transition-name` only when
`useSlide()` reports `isActive` and the `slide` context; in every other context, and on the
hidden neighbour slides, the element carries no name, so a name is never present twice in
one document. Two `Morph`s with the same name on one slide at the same time are an author
error the browser reports by skipping the transition; the framework does not police it. A
`Morph` inside a hidden step is still captured, as an invisible box.

The package registers one settle probe with the runtime when it is first imported: busy
while a `useTween` notification is pending, or while any tween nested anywhere under gsap's
global timeline is not paused, does not repeat forever and has not reached its end (so a
tween still in its `delay` counts, and a `repeat: -1` child inside a finite timeline does
not).

Browser tests, against two new gallery slides (`Morph` across slides, `Morph` across clicks
with `morphSteps: true`):

| Situation | Outcome |
| --- | --- |
| ArrowRight between the two `Morph` slides, sampling the `::view-transition-group` box each frame | Its left and top move monotonically from the first slide's box to the second's. |
| A click on the `morphSteps` slide | The morphing element's box moves monotonically; the rest of the slide does not cross-fade. |
| `settled()` during a `useTimeline` beat | Resolves only after the beat's last change. |
| `settled()` on the gallery's looping element | Resolves. |

## 6. node (Outline)

- Vite plugins: `slides` (scan `slides/*.mdx`, frontmatter, drop `hide: true`, build the
  manifest and notes modules), `mdx` (lift `<Notes>`), `components` (deck and theme
  components provided to MDX), `theme`, `entry` (generated `index.html`).
- Virtual modules: `virtual:react-decks/manifest`, `virtual:react-decks/notes`,
  `virtual:react-decks/components`, `virtual:react-decks/theme`,
  `virtual:react-decks/theme.css`.
- `defineDeck` and `defineTheme` config, validated at load.
- CLI `decks`: `dev`, `build`, `export`, `new`, `list`, `check`, `lint`, `fact-extract`,
  `review-prose`, `shot`, `snap`, `snap:diff`, `film`, `motion-check`, `init`, `hook`.

## 6.1 node, Phase 2 surface (Final)

```ts
import type { DeckManifest, SlideMeta } from "@react-decks/core";
import type { Plugin, UserConfig } from "vite";

export interface DeckConfig {
  readonly title: string;
  readonly author?: string;
  readonly info?: string;
  /** Default { width: 1920, height: 1080 }. */
  readonly canvas?: { readonly width: number; readonly height: number };
  /** Default transition between slides. */
  readonly transition?: string;
  /** Attributes set on <html>. */
  readonly htmlAttrs?: Readonly<Record<string, string>>;
  /** Merged into the Vite config; how a deck adds Tailwind or other plugins. */
  readonly vite?: UserConfig;
}

/** Identity function that gives `deck.config.ts` its types. */
export function defineDeck(config: DeckConfig): DeckConfig;

export interface ResolvedDeck {
  /** Registry alias, or the directory's basename. */
  readonly name: string;
  /** Absolute path of the deck directory. */
  readonly dir: string;
  readonly config: DeckConfig & { readonly canvas: { readonly width: number; readonly height: number } };
}

/** Loads and validates `<dir>/deck.config.ts`. Throws an Error naming the file and the problem. */
export function loadDeck(dir: string, name?: string): Promise<ResolvedDeck>;

export interface ScannedSlide {
  readonly meta: SlideMeta;
  readonly frontmatter: Readonly<Record<string, unknown>>;
}

/** Reads `slides/*.mdx` per section 3.1: sorted, hidden slides dropped, numbered from 1. */
export function scanSlides(deck: ResolvedDeck): Promise<readonly ScannedSlide[]>;

export function buildManifest(deck: ResolvedDeck, slides: readonly ScannedSlide[]): DeckManifest;

/** The Vite plugins that turn a deck directory into an app. */
export function reactDecks(deck: ResolvedDeck): Plugin[];

export interface DevServer {
  readonly url: string;
  close(): Promise<void>;
}
/** `port` undefined picks a free port starting at 3030; 0 lets the OS pick any free port. */
export function dev(deck: ResolvedDeck, options?: { port?: number; open?: boolean }): Promise<DevServer>;

export function build(deck: ResolvedDeck, options: { outDir: string; base?: string }): Promise<void>;
```

Config is loaded with `jiti` (no module cache, so an edited file is re-read) and validated
with zod. Unknown keys are an error naming the key. An `htmlAttrs` key must be a valid HTML
attribute name (`/^[A-Za-z_:][-A-Za-z0-9_:.]*$/`).

Modules the plugins serve:

| Id | Exports |
| --- | --- |
| `virtual:react-decks/manifest` | `manifest: DeckManifest`; `slides: Record<id, () => import(<slide file>)>`; `frontmatter: Record<id, Record<string, unknown>>` |
| `virtual:react-decks/components` | `components: Record<name, Component>` built per section 3.1. Export names are read from each file when the module is generated, so a duplicate name fails `dev` and `build` with the error, not the browser |
| `virtual:react-decks/notes` | `notes: Record<id, { click: number; html: string }[]>`: each slide's `<Notes>` markdown split with core's `segmentNotes` and each segment rendered to HTML; slides without notes are absent |
| `virtual:react-decks/entry` | no exports; imports the three above (notes lazily, as `loadNotes`), the deck's `styles/index.css` when it exists, and calls `mountDeck` from `@react-decks/runtime` |

The served HTML has `<html>` carrying `config.htmlAttrs`, a `<title>` from `config.title`,
`<meta name="author">` when set, `<meta name="decks:name" content="<name>">`, in dev only
`<meta name="decks:entry" content="<absolute deck dir>">` (a built site never contains a
local path), `<div id="deck-root">`, and a module script for
the entry. No `index.html` is written into the deck directory, in dev or in build.

Slide `.mdx` files compile through `@mdx-js/rollup` with `remark-frontmatter` (frontmatter is
not rendered) and a remark plugin that removes `<Notes>`. JSX and Fast Refresh come from
`@vitejs/plugin-react`. The deck's `public/` is Vite's public directory. `config.vite` is
merged over the framework's config, and then the explicit options of `dev` and `build`
(`port`, `outDir`, `base`) are applied last: a `--base` on the command line beats a `base`
in `config.vite`.

| Change while `dev` runs | Result in the browser |
| --- | --- |
| A slide's body is edited | That slide hot-updates; no full reload, unless the edit changes its counted click total (section 6.2), which reloads the manifest |
| A slide's frontmatter changes, or a slide file is added, removed or renamed | The manifest module is invalidated and the page reloads; slide and click survive because they are in the URL |
| A file is added to or removed from `components/` | The components module is invalidated and the page reloads; no server restart |
| `deck.config.ts` changes | The server restarts and the page recovers at the same slide and click |
| A slide file is renamed | One reload, after both the removal and the addition have been seen; the position in the URL is not clamped by an intermediate state. Structural changes are coalesced over a 100 ms quiet window; events further apart are separate changes |

Before the first request Vite scans the runtime's entry and the deck's `components/*.tsx`
for dependencies, so a cold start does not reload. A package imported directly in a slide's
MDX is not scanned and can cost one reload the first time it is seen: import packages from
components, or list them in `deck.config.ts` under `vite.optimizeDeps.include`.

While `dev` is running, a slide edited into a state that does not compile keeps showing its
last good version under Vite's standard error overlay, as any Vite app does; the per-slide
error applies when a slide fails to load or throws while rendering.

Known limits, accepted: a slide's URL holds its number, so after a slide is inserted before
it the same URL shows a different slide; and a structural reload (a slide or component file
added or removed, frontmatter changed) discards component-local state.

`build` empties `outDir` first and writes a static site that works from any `base` and from `file:`-relative
hosting under that base; hash routing needs no server rewrites.

CLI (`packages/node/src/cli.ts`, built with `citty`, run with `tsx`, which runs on Node):

```
decks dev <deck> [--port <n>] [--open]
decks build <deck> [--out <dir>] [--base <path>]
```

`<deck>` is an alias in `./decks.json` (`{ "<alias>": { "dir": "<path>" } }`, keys starting
with `_` are config) or a path to a deck directory. `dev` prints the URL it serves.
`build` defaults `--out` to `decks.json`'s `_config.outDir` with `{name}` replaced (default
`dist/{name}`), and `--base` to `_config.base` (default `./`). A `--port` that is not a whole
number, and a malformed `decks.json`, exit 1 with a message naming the value or the file. An unknown alias or a directory without `deck.config.ts` exits 1
with a message naming it.

## 6.2 node: static click totals and transition metadata (Final)

`clicks` in frontmatter stays authoritative when present. When it is absent, the slide's
click total is counted from the motion step components written in the MDX, so an author who
uses `<Step at={2}>` does not also maintain a number:

| Element in the MDX | Contributes |
| --- | --- |
| `Step`, `Stagger`, `Highlight`, `Draw` with `at` and optional `until` | `until` if present, else `at` |
| `TextReveal`, `CountUp` with `at` | `at` |
| `Steps` with `from` and `k` JSX element children | `from + k - 1` (nothing when `k` is 0) |

The total is the largest contribution, or 0. The count runs on the MDX syntax tree
(`remark-parse` + `remark-mdx`, already installed), after `hide` is checked, so a hidden
slide's body is never parsed.

- Elements are matched by the name written in the slide, block or inline. An aliased import
  or a member name (`<motion.Step>`) is not counted; such a slide sets `clicks:`.
- `at`, `until` and `from` must be non-negative integer literals (`at={2}`), and `until`
  must be greater than `at`. Anything else (an expression, a string, a fraction, a negative
  number) is an error naming the file and the attribute.
- A child of `Steps` that is neither a JSX element nor whitespace (markdown, an expression) is
  an error naming the file.
- A counted name that appears inside a JavaScript expression in the slide (`{cond && <Step
  at={1} />}`, a `.map()`), where it cannot be counted, is an error naming the file.
- None of these errors is raised when the slide sets `clicks:`; the number is then the
  author's.
- A file under `components/` may export one of the seven counted names only as a re-export
  from `@react-decks/motion`; defining its own is an error naming the file and the name.
- Steps inside a deck component are not seen; such a slide sets `clicks:`.

`ScannedSlide.frontmatter` holds what the author wrote: `clicks` is absent from it when the
author did not write it (the existing expectation in `slides.test.ts` changes accordingly).
`SlideMeta.clicks` always holds the total in use.

In dev, the manifest is invalidated when a slide's frontmatter or its counted total changes.
A body edit that changes the total therefore reloads the manifest; one that does not still
hot-updates only that slide. If a body stops parsing mid-edit, the count keeps the slide's
last total and the slide's own compile reports the error; at build, or on the first scan, a
body that does not parse is an error naming the file.

Frontmatter `morphSteps: true` becomes `SlideMeta.morphSteps`; anything but a boolean is an
error naming the file, as is an empty `transition`. `deck.config.ts`'s `transition` becomes
`DeckManifest.transition`. `assertManifest` rejects an empty `transition` on the manifest or
a slide, and a `morphSteps` that is not a boolean.

## 7. kit (Outline)

The port of `packages/decks`: theme tokens, global `od-*` styles, `compat.css`, the story
engine on `@react-decks/motion`, and the `Od*`, `Ink*`, `Unit*`, `Story*` components.

Decided at checkpoint 1 (`docs/spikes/parity.md`):

- Units. Inside a slide, `vw` and `vh` become `cqw` and `cqh` (the frame is a size
  container). The story frame keeps its fitted 16:9 box: `--sw` and `--sh` derive from
  `min(100cqw, 177.7778cqh)` and `min(100cqh, 56.25cqw)`, and SVG scene geometry stays in
  1920x1080 design units. In a window that is not 16:9 a story scene is centred with the
  canvas background around it; a conventional slide's flex and grid layout takes the extra
  space. Slidev's full-screen overrides (`transform: none !important`) are not ported.
- `compat.css` is small and stays for the port: the Tailwind reset Slidev loaded, the
  `h1`-`h3` sizes and list-item margins from Slidev's `layouts-base.css` (so `h2.od-h2`
  still renders at 30px), and the dashed link border. It is scoped to `[data-deck-slide]`.
  Vue's scoped-style attribute added specificity that a plain class loses; a ported rule that
  relied on it is qualified to keep its place in the cascade. With these, three `tides`
  frames matched Slidev pixel for pixel and the conventional slide differed by 127 pixels in
  a simplified logo.
- Slidev synthesized italics from the normal Inter face; the kit ships the same single face
  so italic text keeps its metrics.
- OpenChart measures its container with `getBoundingClientRect()` and has no size option, so
  under the scaled canvas it compiles at screen size and is scaled again. The kit's
  `OpenChart` wrapper counter-scales its host (`width`/`height` of `scale * 100%`,
  `transform: scale(1 / scale)`, origin top left) so layout size equals screen size. The
  chart then draws 1:1 on screen, resizes with the window, and stays sharp with the canvas
  renderer. Font sizes in a spec are therefore screen pixels: `useFrameScale()` returns
  `useSlideScale()` and chart themes multiply by it, as they do today. It is not used for
  anything inside the scaled canvas, which would shrink twice.
- SVG filter ids are per stage instance (`useId()`), since a slide renders in several
  contexts at once.
- Not covered by the spike and still to prove in the port: marker brushes, the other
  `UnitGrid` variants, `StoryCard`'s outgoing-copy overlap and height easing, cross-slide
  transitions, and stages in the presenter, preview, overview and print contexts.
