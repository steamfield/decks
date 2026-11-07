# Contract: {deckName} design system

<!-- Template: see contracts/README.md. Fill every {placeholder}, cut the build steps the deck
doesn't need, and delete this comment. -->

## Goal

Build this deck's visual system, so every later slide run inherits one look. It must be easy to
change after the deck is built: every color, font, radius, opacity and size lives in a token
file, and nothing is hardcoded anywhere else.

You also build two visible things the author approves before any other slide is written:

- the real cover (slide 1);
- a design sample on slide {sampleSlide} that exercises every mark and convention.

The direction is in `{deckDir}/{brief}`, "{designSection}": {one or two sentences on the motif,
the audience and the feel, and anything the look must avoid}.

## Read first

- `.claude/delegate.md`, "For the delegate".
- `AGENTS.md` (already loaded): "Theme", "Conventions", and the rule table in its Codex section.
- `.claude/rules/deck-patterns.md`: "Theme and tokens" (including the `shape` group and
  "Changing the fonts") and "Styling ladder".
- `.claude/rules/story-stage.md`: "Frame units", "Mark style and hue", "Reserved regions",
  "`StoryLayer` and view-transition hand-offs", and "The stage page and its presenter notes".
- `.claude/rules/deck-writing.md` and `.claude/rules/prose-patterns.md`, in full, before you
  write the cover or the sample's card copy. `deck-writing.md` wins where they disagree.
- `packages/decks/story/README.md`.
- `packages/decks/theme/default.json` and `packages/decks/theme/resolve.ts`. Note what is
  validated: ramps are four `#rrggbb` steps getting lighter, step 1 holds 3:1 against
  `surfaces.canvas`, glows are hex. `packages/decks/theme/theme.test.ts` runs that check on every
  registered deck's `theme.json`, this one included.
- `examples/od-templates/theme.json`: a worked alternate theme.
- `packages/decks/components/StoryCover.vue`, `StoryCard.vue` and `StoryStage.vue`, and
  `packages/decks/styles/story-frame.css`: what your CSS restyles.
- `examples/texas-2026/`: a finished deck-local system to learn the structure from, not a look
  to copy. `theme.json`, `styles/tokens.css`, `styles/index.css` (including its view-transition
  fade override), `components/design.ts` and `DESIGN.md`.
- `{deckDir}/{brief}`: the slot-to-meaning map, the cover spec and the sample slide's spec.

## What to build

### 1. `{deckDir}/theme.json`

A partial override of the default theme:

- `surfaces` and `text`: {the surface and text direction}.
- `ramps`, by meaning. The six slots are recolored, never renamed: {slot: color: meaning, for
  each slot the deck uses; slots used only for chart support say so}.
- `categorical` rebuilt from those ramps, `glows` as hex (or aliases of surfaces if the deck
  renders none), and `chart` following the palette.
- `fonts`: `sans` {family}, `serif` {family}, `mono` {family}. The story headline and cover title
  read `fonts.serif`, so they need no deck CSS for the family. Use each package's variable
  family name (`'Source Serif 4 Variable', serif`).
- `shape`: `radius`, `hairline`, `card-width` and `dim`. Set the card and chip look here, not by
  overriding the addon's card selectors.
- `brand`: {name, url, logo or null, wordmark gradient from the palette}.

Starting values, to tune until the contrast test passes and the result reads well on a
projector: {hex values}.

### 2. `{deckDir}/styles/tokens.css`

The first import of `styles/index.css`. It holds:

- the `@fontsource-variable/...` imports for the deck's fonts (installed during wave 0; if one
  is missing, stop and say so);
- `--{prefix}-*` custom properties for every deck-only shape and layout value the theme's
  `shape` group doesn't cover, such as mark radius, stroke widths, hatch spacing, dash pattern,
  headline size, weight, leading and tracking, the shared baseline, and the view-transition fade
  length (a mirror of a `DUR` value, with a comment naming which).

Comment each group with what it controls. Sizes that scale with the frame use
`calc(N * var(--sw))` or `var(--sh)`, never raw `vw`/`vh`.

### 3. `{deckDir}/styles/index.css`

Imports `tokens.css`, then applies the system: the headline and cover type scale, tabular
numerals on figures, the card look on top of the `shape` tokens, {deck classes, such as status
tags that print a word on an object, a shared baseline}, and any view-transition timing change,
scoped to this deck. Every value comes from `var(--{prefix}-*)` or `var(--od-*)`: no hex, no bare
px radii, no opacity literals. Keep each block under an ancestor selector
(`.od-slide.is-story ...`).

### 4. `{deckDir}/components/design.ts`

JS-side tokens for the beat scripts, each commented: the dim opacity (or
`Number(theme.shape.dim)`), mark geometry in viewBox units, any value mirrored in `tokens.css`
(say so on both sides), and helpers that return `ink()` colors by meaning, so stages say what
they mean rather than which slot.

### 5. Marks

{Each deck-local mark component: its file, what it draws, its props, and how a beat drives it
(progress props from 0 to 1). A mark that a slide run will reuse gets its API in a header
comment.}

### 6. Slide 1: `{deckDir}/pages/01-cover.md`

The real cover, `StoryCover` plus {the cover field}, per the cover spec in the brief:

- the headline: {draft}. It is a draft claim; rewrite it if it fails the prose review;
- a one-sentence lede that adds a fact and doesn't restate the headline;
- the byline: {byline}.

Keep the header comment, and end the page with presenter notes in the format in
`story-stage.md`: a short spoken open under `SAY (opening)`.

Any figure or name the cover shows comes from `{deckDir}/data/`. If the research run hasn't
written its module yet, use a local constant marked `// FLAG: replace with data/<module>.ts`.

### 7. The design sample: slide {sampleSlide}, `{deckDir}/components/{SampleStage}.vue`

Replace the placeholder with a valid story stage of {beats} beats: `COPY` keeps {beats}
entries, because `slides.md` says `clicks: {clicks}`. Show each of these at least once:
{the marks, states and conventions to judge, such as the claim headline, the card, every mark
state, a pending tag, a dimmed earlier item, a ping}.

It may preview the real slide's content, but its job is to judge the look, and the slide run
rewrites it; say so in a header comment. Its card copy still states content: a card that
describes the visual ("A thin ring directs attention.") fails the prose review. Figures not yet
in `data/` use FLAG placeholders as in step 6. End `{deckDir}/pages/{samplePage}` with notes in
the `story-stage.md` format.

### 8. `{deckDir}/DESIGN.md`

A one-page guide: the slot-to-meaning table; which file holds which token, as a "to change X,
edit Y" table; how to swap a font (the fontsource import in `tokens.css` plus `fonts.*` in
`theme.json`); the mark and status conventions; and the do-not list (no hex, radius or opacity
literals in components, {deck-specific don'ts}).

## Scope

- May change:
  - `{deckDir}/theme.json`
  - `{deckDir}/styles/`
  - `{deckDir}/components/design.ts`
  - {each mark component, e.g. `{deckDir}/components/<Mark>.vue`}
  - `{deckDir}/components/{SampleStage}.vue`
  - `{deckDir}/pages/01-cover.md`
  - `{deckDir}/pages/{samplePage}`
  - `{deckDir}/DESIGN.md`
- Must not change: `{deckDir}/slides.md`, `decks.json`, `package.json`, `packages/decks/`,
  `{deckDir}/data/` and `{deckDir}/data-sources.md` (the research run owns them), and the brief.
  If the deck needs a headmatter change (fonts, for one), name it in the hand-off. If anything
  else outside scope is needed, stop and say why.

## Acceptance

Run the gate in `.claude/delegate.md` ("The gate") until clean. Then QA what you built:

1. `bun run shot {alias} 1 {coverClicks}` and `bun run shot {alias} {sampleSlide} {clicks}`.
   Look at each PNG yourself.
2. Fix contrast, crowding and alignment, and keep ink out of the reserved headline and card
   regions (`story-stage.md`). Confirm the fonts loaded: the serif is visible in the headline,
   with no fallback.
3. Every shot prints `errors: none` and no headline-wrap warning, and each click's card lead
   matches its `COPY` entry.

Then prove the tokens work:

1. Change one ramp in `theme.json`, `shape.radius` in `theme.json`, and the dim value in
   `design.ts`.
2. Re-shoot the sample slide and confirm all three changes showed up.
3. Revert, re-shoot, and confirm the frames match the originals.

## Do not

- commit or push
- use hex, px radii or opacity literals in `components/*.vue`; deck-only values go in
  `design.ts` or `tokens.css`
- use raw `vw`/`vh`, or duration literals (use `DUR`)
- add dependencies
- mention a repository outside this one, or an absolute path, in a tracked file

## Review before hand-off

Once the acceptance checks pass, get two independent reviews, each in a fresh read-only Codex
process, and fix what they find. Use separate plain commands and the file-writing tool: no shell
functions, heredocs or generated scripts.

1. Run `mktemp -d`. The directory it prints is the review directory, outside the worktree.
2. Code review. With the file-writing tool, write `<review dir>/prompt.md` containing:

   > Review the uncommitted changes and new files in {worktree} against base {baseBranch}. You
   > didn't write them. Read the contract at {contractPath} first, then `.claude/delegate.md`
   > ("For the delegate") and every `.claude/rules/` file that the rule table in `AGENTS.md`'s
   > Codex section lists for the changed files. Your sandbox is read-only: don't run tests or
   > edit files; the author already ran the checks. Report every real defect as a flat list
   > with file:line, with no optional tier. Look for: a contract or rule violation; a file
   > changed outside the contract's scope; a hex color, px radius, opacity, duration or raw
   > `vw`/`vh` literal where a token belongs; a token defined in two places that can drift; a
   > value set in deck CSS that the theme's `shape` or `fonts` group already carries; COPY
   > length or presenter notes out of step with the page's `clicks:`; a figure, date or name
   > typed into a component or page with no data module or FLAG behind it.

   Then run:

   ```bash
   codex exec --ephemeral --sandbox read-only -m "{reviewModel}" -c 'model_reasoning_effort="high"' -c 'service_tier="priority"' -o "<review dir>/review.md" - < "<review dir>/prompt.md"
   ```

3. Prose review. Run `bun run review-prose {alias} > "<review dir>/prose-prompt.md"`. It walks
   the deck on its own dev server and writes a review prompt holding every visible string and
   the presenter notes, with slide, click and source line, plus the writing rules. With the
   file-editing tool, add one line at the top of that file: "Review only the sections for
   slides 1 and {sampleSlide}; the other slides are placeholders." Then run:

   ```bash
   codex exec --ephemeral --sandbox read-only -m "{reviewModel}" -c 'model_reasoning_effort="high"' -c 'service_tier="priority"' -o "<review dir>/prose-review.md" - < "<review dir>/prose-prompt.md"
   ```

Fix every finding in `review.md`, and apply or answer every row of `prose-review.md`, or say in
the hand-off why a finding is wrong. Rerun the gate and the shots. One pass of each review only.

## Hand-off

Leave everything uncommitted. End with:

1. Summary.
2. Files.
3. Decisions: the final palette and contrast ratios, the type scale, anything you changed from
   the starting values and why.
4. Headmatter or dependency changes the orchestrator needs to make.
5. Checks, with results.
6. The shot PNG paths, for the author's approval.
7. The token drill result.
8. Review findings from both reviews, and how you resolved each (the prose review's as a table:
   string, pattern, change).
9. Look closer at.
10. Open questions.
