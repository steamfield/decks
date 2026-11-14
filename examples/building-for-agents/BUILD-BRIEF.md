# Build brief: stages for "Building for agents"

You are building some slides of a 19-slide talk deck. Other agents are building other
slides in this same checkout at the same time. Read this whole file before you touch
anything. Your prompt names your slides.

Checkout root (run every command from here):
`/Users/riley/Projects/decks/.claude/worktrees/building-for-agents`

Deck directory: `examples/building-for-agents/` (alias `agents`).

## Read first, in this order

1. `examples/building-for-agents/DESIGN.md`: the design contract. It wins over everything else.
2. `examples/building-for-agents/OUTLINE.md`, section 4 (rules) and the section 10 entries for
   your slides. Section 10 is your spec: purpose, layout, a beat table with card copy and
   what the speaker says, data sources, figures. Where it disagrees with `DESIGN.md` or
   this brief, they win.
3. `.claude/rules/story-stage.md`, `.claude/rules/deck-writing.md`, `.claude/rules/deck-data.md`.
4. The two finished exemplars. Copy their structure:
   - `components/StacksLoopStage.vue` with `data/04-stacks-loop.ts` and
     `pages/04-stacks-loop.md`: a system diagram with packets, a recording on a CRT, beats
     that tween state.
   - `components/StacksTourStage.vue` with `data/05-stacks-tour.ts`,
     `data/code/05-stacks.ts` and `pages/05-stacks-tour.md`: a repo tree beside real code,
     where what is focused is a function of the click index.
5. `components/design.ts`, `styles/tokens.css` and the "SVG type" and "Boxes" sections of
   `styles/index.css`, for the constants and classes you may use.

## What you may and may not edit

You own, for each of your slides (names are fixed; the stubs already exist, replace them):

- `components/<Name>Stage.vue`, plus any deck-local helper components you add, named
  with your slide's prefix (for example `ForemanCard.vue`). Slidev auto-imports
  `components/*.vue`.
- `data/NN-slug.ts`, `data/code/NN-slug.ts` (code excerpts), and JSON fixtures under
  `data/fixtures/NN-*`.
- `pages/NN-slug.md`.
- `data/sources/NN-slug.md`: your slide's section for `data-sources.md` (the
  orchestrator merges these). Same table format as the existing `data-sources.md`.

You may make exactly one kind of edit to `slides.md`: the `title:` and `clicks:` lines
of your own slides' stanzas. `clicks` is your COPY length minus one.

Do not edit anything else: not `styles/*`, `theme.json`, `components/design.ts`, the
shared components listed below, `global-top.vue`, `scene/*`, `data/products.ts`,
`data/types.ts`, `data-sources.md`, `package.json`, or anything outside the deck
directory. Put stage-specific CSS in your component's `<style scoped>` block and
stage-specific geometry constants at the top of your component. If a shared component
has a bug or lacks something you need, work around it inside your stage and say so in
your report. Never modify the sibling product repos under `~/Projects`; read them only.
Do not commit, do not push, do not start a long-running dev server.

## Shared components (already built, auto-imported)

| Component | Slot | Use |
| --- | --- | --- |
| `StoryStage`, `StoryCard` | | The frame and the prose card (addon). `<StoryCard anchor="left" hue="rose" :lead :body />` |
| `ThreadRail` | `#overlay` | Bottom rail. `current="stacks|foreman|rr|statglass|opendata|openchart|decks"`, or `all`. Put it on every content slide. |
| `NamePlate` | `#overlay` | Top right. `<NamePlate id="rr" />` on a product's first slide, `chip-only` on its later ones. |
| `EvidenceTag` | `#overlay` | `kind="recorded|schematic|illustrative"`, `:x :y` in stage units, `align="right"`, slot text such as `Recorded 2026-11-06`. |
| `CrtFrame` | `#stage` | SVG monitor for a recording drawn as ink. Props `x y width height fig tag progress power`. |
| `CrtPanel` | `#overlay` | HTML monitor. Props `x y width height label fig tag progress power`; default slot. |
| `TermPane` | `#overlay` | Terminal or agent transcript on a CrtPanel. `:lines` of `{ text, tone }` (tones: cmd, user, agent, out, ok, fail, warn, muted), `:shown` (line count, tween it), `:highlight` (indexes), `x y width height label fig tag power size`. Use it for every agent session too; there is no separate agent pane. |
| `CodePane` | `#overlay` | Highlighted real code. `:excerpt` (see `data/code/types.ts`), `:focus="[[first,last]]"`, `x y width height progress size`. Long lines wrap. |
| `RepoTree` | `#overlay` | File tree. `:nodes` (`TreeNode` from `data/types.ts`), `:lit`, `focus`, `:reveal`, `x y width root`. |
| `PacketPath` | `#stage` | A message moving along a polyline. `:points`, `:progress` (0..1, visible only in flight), `:color`, `wire`, `dashed`, `label`. |
| `PixelIcon`, `SfMark`, `LangChip` | | Product icon, the mark, a language chip. |
| `NightDriveField` | cover `#field` | The night drive picture. `low` sits the sun lower. |

Helpers in `components/design.ts`: `DIM`, `ON`, `OFF`, `FRAME`, `along(points, t)`,
`polyline(points)`, type `Pt`. From `slidev-addon-decks/story`: `useStage`, `DUR`,
`SETTLE`, `DRAW`, `TRACE`, `ink(hue, step)`, `stagger`, `clamp01`, `lerp`, `xScale`,
`yScale`, `STAGE`. Product names, verbs and language chips come from `data/products.ts`.

CSS classes for SVG in `#stage`: text `sf-term` (VT323, phosphor), `sf-mono` and
`sf-mono is-small` (JetBrains Mono), `sf-name` (Orbitron bold), `sf-pixel`, `sf-pixel
is-small`, `sf-pixel is-fig` (pixel type); shapes `sf-box`, `sf-box is-well`,
`sf-box is-lit` (stroke follows CSS `color`), `sf-boundary` (dashed outline), `sf-wire`.

## Rules that the guard tests enforce

- Build every stage on `useStage`. `beats` comes from it; never hand-count.
- Durations only from `DUR`, easings only from `SETTLE`, `DRAW`, `TRACE` or `'none'`.
  No numeric duration literal.
- No raw `vw` or `vh`. HTML lengths use `calc(N * var(--sw))`, `--sh`, `--lw`. SVG
  geometry is in the 1920x1080 viewBox.
- No hex color anywhere in your files. Colors come from `ink()` or `var(--od-*)`.
  Meanings: `rose` the actor or a failure, `cyan` data and output, `amber` waiting,
  held, locked and figure numbers, `emerald` passed or terminal text, `violet` transport
  and plumbing, `slate` neutral. One pink thing per beat.
- Animated SVG opacity goes through `:style="{ opacity: String(x) }"`, never an
  `:opacity` attribute on `g`, `rect`, `path` or `text`.
- Card copy: at most 8 words of lead and 20 of body. A beat with no card is
  `{ lead: '' }`.
- Presenter notes are the page's trailing comment: `SAY (opening)`, then exactly one
  plain `[click]` paragraph per click, then optional `IF ASKED`. Never `[click:N]`.

## Rules about content

- Headlines are one claim, ending in a period, on one line: 50 characters at most
  (`bun run shot` warns when one wraps). If the outline's draft is longer, shorten it and
  set the same text as `title:` in your stanza.
- No em dashes. No marketing adjectives. Product names keep their casing: OpenData,
  OpenChart, StatGlass, Stacks, rr, Decks, foreman.
- Read `.claude/rules/prose-patterns.md` before writing any visible string or note.
  Avoid seesaw pairs, negation then assertion, trailing contrasts, triads, rhetorical
  questions and kickers. A card states content; it never describes the visual.
- Everything shown is real or tagged. Code is quoted from the named file through a
  `data/code/` excerpt (the drift test checks it: every shown line must match a source
  line; mark dropped lines with a line that is only `// …`). Terminal output comes from
  a fixture or doc, or its pane is tagged `Illustrative`. A replayed artifact carries a
  `Recorded <date>` tag with its source; a diagram carries `Schematic`.
- Every figure (in a headline, card, chip, label or note) is a named constant in your
  `data/NN-slug.ts` with a provenance comment giving the file or command it came from,
  and a row in your `data/sources/NN-slug.md`. Open the source and derive the number
  yourself; the outline's figures are secondhand. If your count differs, use yours and
  say so in your report. Claims a person made rather than a repo are
  `FLAG: author-reported`.
- The outline lists facts not to state (section 4 and the "Known conflicts" table in
  section 11). Check your slides against it.
- Notes are a speakable script in Riley's first-person voice: plain, specific, about 25
  seconds a beat. `pages/04-stacks-loop.md` is the model.

## Type

The deck uses the site hero's faces only. There is no Helvetica or Arial style face on
any slide. In your scoped CSS and SVG, never write a font-family name; use these:

| For | Use | Smallest size (stage units) |
| --- | --- | --- |
| Names of things, short labels, anything a few words long | `var(--od-font-serif)` (Orbitron), or the `sf-name` class in SVG | 22 |
| Sentences: captions, notes inside a diagram | `var(--od-font-sans)` (VT323) | 26 |
| Terminal lines | `var(--sf-font-term)` (VT323), or `sf-term` | 26 |
| Code, file names, paths, commands | `var(--od-font-mono)` (JetBrains Mono), or `sf-mono` | 18 |
| Tags, figure numbers, counters | `var(--sf-font-pixel)` (Press Start 2P), or `sf-pixel` | 13 |

The headline, the card and the rail are already styled; do not restyle them.

## Layout

- Reserved: the headline band (top left, to about y 130 for one line), the name plate
  (top right, to about y 165), the card (bottom left, x 110 to 800, y 710 to 950, or
  bottom right if you pass `anchor="right"`), the thread rail (y 985 to 1045). Keep
  your content between y 190 and y 950 and off the card.
- The slide is inside a CRT tube with a slight barrel warp and scanlines over
  everything. Keep text at or above these sizes in stage units: code and file names 21,
  small mono labels 18, pixel type 13, terminal type 26.
- Each beat changes one thing. What a beat is no longer about drops to `DIM`. Set a
  beat's resting state so that stepping backward lands on the same frame. State that is
  a pure function of the click index (which row is focused, which excerpt shows) should
  be computed from `clicks`, as the tour exemplar does.
- Do not add cross-slide view-transition names. Ignore the outline's "morphs".
- A time-driven simulation ported from a product site (the outline's section 7 names
  them) becomes beat-driven like this: keep one reactive `t`, tween it to each beat's
  still moment with `ease: 'none'` over a `DUR` value, and render `sceneAt(t)`. Port the
  pure model into your `data/` module with a provenance header naming the source file.

## Verify before you report

Slide numbers for `shot` are the deck's slide numbers (the manifest has all 19).

```bash
bun run check
bun run typecheck
bun run test
bun run lint agents
bun run shot agents <slide> <clicks> --out /tmp/claude-shots-<your-slide>
```

Look at every screenshot you take (read the PNG) and fix what is wrong: overlaps, text
running out of its box, anything under the card or the rail, illegible sizes, a beat
that shows nothing new. `shot` starts its own dev server; if it prints "Outdated
Optimize Dep" once, run it again. The cover's live scene does not draw its grid in
headless screenshots; that is known and not yours to fix. Tests in other agents'
unfinished files may fail while they work: fix failures in your own files and name any
others in your report.

## Report back

In your final message: which files you wrote; each slide's final headline and click
count; every figure whose value differed from the outline; every place you departed
from the outline and why; anything tagged `FLAG:`; any shared-component problem; and
the test, lint and check results for your files. Do not claim something works unless
you ran it and looked.
