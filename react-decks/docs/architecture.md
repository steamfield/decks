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

A `clicks` value that is missing, negative or not an integer parses as 0. `parseLocation`
does not know the manifest and does not clamp to it; the store calls `clampNav` afterwards.
`embedded` and `bridge` are true when the parameter is present in `search` with any value
other than `0` or `false`, including no value. Search parameters inside the hash are only
read for `clicks`.

`formatHash` output: `#/5`, `#/5?clicks=2` (omitted when click is 0), `#/presenter/5`,
`#/presenter/5?clicks=2`, `#/overview`, `#/print`. For every location `L` with a
non-negative integer slide and click, `parseLocation(formatHash(L), '')` returns the same
view, slide and click (for `overview` and `print`, slide 1 click 0).

### 2.5 `notes.ts`

```ts
export interface NoteSegment {
  /** The click this text belongs to. Text before the first marker belongs to click 0. */
  readonly click: number
  readonly html: string
}

export function segmentNotes(html: string): NoteSegment[]
/** The click of the last marker; 0 when there are none. */
export function noteClickCount(html: string): number
```

Markers are the literal text `[click]` and `[click:N]` (N a positive integer). `[click]` adds
1 to the running click; `[click:N]` adds N. Each marker starts a new segment and is removed
from the output. Segment `html` is the text between markers, trimmed; empty segments are
kept, so the result always has one segment for click 0 plus one per marker. A malformed
marker such as `[click:0]`, `[click:-1]` or `[click:x]` is left in the text and starts
nothing. Input with no markers returns one segment with click 0.

### 2.6 `sync.ts`

```ts
export interface SyncState {
  readonly nav: NavState
  /** Width / height of the audience window, when the sender is an audience view. */
  readonly aspect?: number
}

export type SyncMessage =
  | { readonly type: 'hello'; readonly from: string }
  | { readonly type: 'state'; readonly from: string; readonly state: SyncState }

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

/** In-memory stand-in for BroadcastChannel: a post reaches every other open transport,
 *  never the sender, synchronously, in connection order. A closed transport neither sends
 *  nor receives. */
export function createMemoryHub(): MemoryHub

export interface SyncSessionOptions {
  /** Unique per tab. */
  readonly id: string
  readonly transport: Transport
  /** Called to answer a newcomer's hello. */
  readonly current: () => SyncState
  /** Called when another participant's state should be applied locally. */
  readonly onRemote: (state: SyncState) => void
  /** How long to wait for an answer before assuming this tab is alone. Default 300. */
  readonly joinTimeoutMs?: number
}

export interface SyncSession {
  /** False until a state arrived or the join timeout passed. */
  readonly joined: boolean
  /** Tell the other participants about a local change. No-op until joined. */
  publish(state: SyncState): void
  /** Stops listening, cancels the join timer, closes the transport. */
  close(): void
}

export function createSyncSession(options: SyncSessionOptions): SyncSession

/** Stable channel name for a deck served at a base path, e.g. "react-decks:tides:/demo/tides/". */
export function syncChannelId(deckName: string, base: string): string
```

Protocol:

1. On creation a session posts `hello` and starts the join timer. It is not joined.
2. A joined session that receives `hello` posts `state` with `current()`.
3. A session that receives `state` from another id calls `onRemote(state)` and, if it was not
   joined, becomes joined and cancels its timer.
4. If the join timer fires first, the session becomes joined: it is alone.
5. `publish` before joining does nothing. This is what stops a reloaded or late tab from
   pulling the others back to slide 1.
6. A message whose `from` equals the session's own id is ignored.
7. A session never posts in response to a `state` message. `onRemote` applying a state must
   not cause a `publish` of that same state; the runtime store guards this, and a test here
   proves that two joined sessions exchanging one publish produce exactly one `onRemote` call
   and no further messages.

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

## 7. kit (Outline)

The port of `packages/decks`: theme tokens, global `od-*` styles, `compat.css`, the story
engine on `@react-decks/motion`, and the `Od*`, `Ink*`, `Unit*`, `Story*` components.
