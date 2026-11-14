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
browser or Node is passed in by the caller. `setTimeout` and `clearTimeout` are the one
exception: they exist in both environments and core may use them.

## 1.1 Libraries (Final)

Use an established, maintained library where one fits; write our own only where the code is
small and specific to decks. `core` is the exception: it is small pure logic with zero
dependencies by design. The orchestrator installs packages; a run that finds a better fit
than hand-written code asks for it by name.

| Concern | Use | Package |
| --- | --- | --- |
| Deck store and selector subscriptions | zustand vanilla store, read through `useStore` with selectors | `runtime` |
| Keyboard shortcuts | `tinykeys` | `runtime` |
| Pinch, wheel and drag for the viewer | `@use-gesture/react` | `runtime` |
| Class name composition | `clsx` | `runtime`, `motion`, `kit` |
| Timelines, text splitting, SVG drawing, count-up | `gsap` with `@gsap/react`, `SplitText`, `DrawSVGPlugin` | `motion` |
| MDX compile | `@mdx-js/rollup`, `@mdx-js/react` | `node`, `runtime` |
| Frontmatter | `remark-frontmatter` + `remark-mdx-frontmatter` in the MDX pipeline; `gray-matter` when only metadata is read | `node` |
| Markdown in notes to HTML | `remark-rehype` + `rehype-stringify` | `node` |
| Config validation | `zod` | `node` |
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
| `#/print` | print, slide 1, click 0 |
| anything unrecognized, e.g. `#/abc`, `#/5/extra`, `#/-1` | play, slide 1, click 0 |

A `clicks` value that is missing, negative, not an integer or not a safe integer parses as 0;
a slide number that is not a safe integer is unrecognized. `parseLocation`
does not know the manifest and does not clamp to it; the store calls `clampNav` afterwards.
`embedded` and `bridge` are true when the parameter is present in `search` with any value
other than `0` or `false`, including no value. Search parameters inside the hash are only
read for `clicks`.

`formatHash` output: `#/5`, `#/5?clicks=2` (omitted when click is 0), `#/presenter/5`,
`#/presenter/5?clicks=2`, `#/overview`, `#/print`. For every location `L` whose slide
and click are non-negative safe integers, `parseLocation(formatHash(L), '')` returns the same
view, slide and click (for `overview` and `print`, slide 1 click 0).

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

/** Orders states across tabs: higher `seq` wins; equal `seq` is decided by comparing `origin` as strings. */
export interface SyncStamp {
  readonly seq: number
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
`{ seq: 0, origin: id }`. Stamp `a` is newer than stamp `b` when `a.seq > b.seq`, or the
`seq`s are equal and `a.origin > b.origin`.

1. On creation a session subscribes, then posts `hello`.
2. A session that receives `hello` from another id posts `state` carrying its own stamp,
   unchanged, and `current()`. Every session answers, new or old.
3. A session that receives `state` whose stamp is newer than its own adopts that stamp and
   calls `onRemote(state)`. A `state` whose stamp is not newer is ignored. The stamp is
   adopted before `onRemote` is called.
4. `publish(state)` sets the session's stamp to `{ seq: seq + 1, origin: id }` and posts
   `state` with it.
5. A message whose `from` equals the session's own id is ignored.
6. Receiving a `state` never causes a post.

What this guarantees, each of which is a test:

| Case | Outcome |
| --- | --- |
| A tab opens or reloads while others are mid-talk | Its `hello` is answered with stamps above 0; it adopts the talk's position. Its own answer and any publish it makes before hearing back carry lower stamps and are ignored by the others: a late tab never moves them. |
| Two tabs open at the same moment on different slides | Both answer each other's `hello` at `seq` 0; the stamp with the greater `origin` wins on both sides and they agree. |
| Three tabs; one navigates while another's answer to a newcomer is in flight | The answer carries the older stamp, so the navigating tab ignores it; the newcomer ends on the newest stamp whichever arrives first. All three agree. |
| Two tabs publish at the same moment | Equal `seq`, different `origin`: both sides keep the state with the greater `origin`. |
| A joined tab receives another tab's answer to a newcomer | The stamp equals its own; ignored, no `onRemote`. |
| The only other tab closes before answering a newcomer | The newcomer keeps its own state; nothing is posted after close. |

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
| `clicks` | integer >= 0 | 0 | number of clicks after the initial state |
| `hide` | boolean | false | when true the slide is dropped before numbering and never compiled into the deck |
| `transition` | string | none | transition into the following slide |

Any other key is kept and reaches the slide through `useSlide().frontmatter`. A `clicks` that
is not a non-negative integer, a `title` or `transition` that is not a string, or a `hide`
that is not a boolean is an error naming the file and the key. A deck with no visible slide is
an error.

A component file under `components/` provides each of its named exports, and its default
export under the file's basename, to MDX under that name. Two files exporting the same name
is an error naming both files. Subdirectories are not scanned.

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
  `transitionInFlight()`, `afterTransition()`. Slide changes always transition. A click
  transitions only when the slide's set of `<Morph>` names differs between the two steps.
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

`useDeck` and `useSlide` throw an `Error` naming the missing provider when used outside
`Deck` or outside a `SlideHost`.

`Deck` sets `data-deck-view` and `data-deck-motion="live"` on `<html>`, provides the source and
store, wraps slides in `MDXProvider` with `source.components`, and renders the view for
`DeckState.view`. In Phase 2 every view renders `PlayView`.

`PlayView`:

- Mounts a `SlideHost` with context `slide` for the current slide and for the slides directly
  before and after it, inside one `SlideFrame main`. Slides further away are not mounted.
- Each slide root is an element with `data-deck-slide` and `data-deck-context` (section 3).
  The current one has `data-deck-active`; the others have the `hidden` attribute.
- A slide whose module has not loaded renders nothing until it has. When the browser is idle
  after the first render, every slide module is requested once so later navigation does not
  wait.
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
  contenteditable element.

`SlideFrame` measures its parent with `ResizeObserver`, applies `fitCanvas` with the
manifest's canvas, sizes its content to the logical width and height in px, transform-scales
it from the top left, makes it a CSS size container, and sets `--deck-w`, `--deck-h` and
`--deck-scale` (unitless numbers) on it. Where `ResizeObserver` does not exist it renders at
the design size with scale 1.

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
/** `port` 0 or undefined picks a free port starting at 3030. */
export function dev(deck: ResolvedDeck, options?: { port?: number; open?: boolean }): Promise<DevServer>;

export function build(deck: ResolvedDeck, options: { outDir: string; base?: string }): Promise<void>;
```

Config is loaded with Vite's `loadConfigFromFile` and validated with zod. Unknown keys are
an error naming the key.

Modules the plugins serve:

| Id | Exports |
| --- | --- |
| `virtual:react-decks/manifest` | `manifest: DeckManifest`; `slides: Record<id, () => import(<slide file>)>`; `frontmatter: Record<id, Record<string, unknown>>` |
| `virtual:react-decks/components` | `components: Record<name, Component>` built per section 3.1 |
| `virtual:react-decks/notes` | `notes: Record<id, { click: number; html: string }[]>`: each slide's `<Notes>` markdown split with core's `segmentNotes` and each segment rendered to HTML; slides without notes are absent |
| `virtual:react-decks/entry` | no exports; imports the three above (notes lazily, as `loadNotes`), the deck's `styles/index.css` when it exists, and calls `mountDeck` from `@react-decks/runtime` |

The served HTML has `<html>` carrying `config.htmlAttrs`, a `<title>` from `config.title`,
`<meta name="author">` when set, `<meta name="decks:entry" content="<absolute deck dir>">`,
`<meta name="decks:name" content="<name>">`, `<div id="deck-root">`, and a module script for
the entry. No `index.html` is written into the deck directory, in dev or in build.

Slide `.mdx` files compile through `@mdx-js/rollup` with `remark-frontmatter` (frontmatter is
not rendered) and a remark plugin that removes `<Notes>`. JSX and Fast Refresh come from
`@vitejs/plugin-react`. The deck's `public/` is Vite's public directory. `config.vite` is
merged last.

| Change while `dev` runs | Result in the browser |
| --- | --- |
| A slide's body is edited | That slide hot-updates; no full reload |
| A slide's frontmatter changes, or a slide file is added, removed or renamed | The manifest module is invalidated and the page reloads; slide and click survive because they are in the URL |
| A file is added to or removed from `components/` | The components module is invalidated and the page reloads; no server restart |
| `deck.config.ts` changes | The server restarts |

`build` writes a static site to `outDir` that works from any `base` and from `file:`-relative
hosting under that base; hash routing needs no server rewrites.

CLI (`packages/node/src/cli.ts`, built with `citty`, run with `node`):

```
decks dev <deck> [--port <n>] [--open]
decks build <deck> [--out <dir>] [--base <path>]
```

`<deck>` is an alias in `./decks.json` (`{ "<alias>": { "dir": "<path>" } }`, keys starting
with `_` are config) or a path to a deck directory. `dev` prints the URL it serves.
`build` defaults `--out` to `decks.json`'s `_config.outDir` with `{name}` replaced, and
`--base` to `_config.base`. An unknown alias or a directory without `deck.config.ts` exits 1
with a message naming it.

## 7. kit (Outline)

The port of `packages/decks`: theme tokens, global `od-*` styles, `compat.css`, the story
engine on `@react-decks/motion`, and the `Od*`, `Ink*`, `Unit*`, `Story*` components.
