# Contract: texas-2026 design system ("Ballot and chalk")

## Goal

Build this deck's original visual system, so every later slide run inherits one look. It must be easy to change after the deck is built: every color, font, radius, opacity and size lives in three token files, and nothing is hardcoded anywhere else.

You also build two visible things the author approves before any other slide is written:

- the real cover (slide 1);
- a design sample on slide 2 that exercises every mark and convention.

The direction comes from `decks/texas-2026/OUTLINE.md`, "Design system". The motifs are a paper ballot (filled ovals) and a classroom chalkboard. The audience is Austin parents and teachers at a civic talk. The design should feel calm, trustworthy and specific to Texas public schools.

It must not look like the repo's default OpenData look: zinc-black canvas, Inter, cyan, blurred glow pools. No red and no blue anywhere, because party never gets a color.

## Read first

- `AGENTS.md`: "Theme", "Conventions", the Codex rule table.
- `.claude/rules/deck-patterns.md`: "Theme and tokens" and "Styling ladder".
- `.claude/rules/story-stage.md`: frame units, hue rules, durations, marks, view transitions.
- `packages/decks/story/README.md`.
- `packages/decks/theme/default.json` and `resolve.ts`. Note what is validated: ramps are four `#rrggbb` steps getting lighter, step 1 is at least 3:1 against `surfaces.canvas`, glows must be hex. `fonts.*` keys each become `--od-font-<key>`, so a new `fonts.serif` works with no engine change.
- `packages/decks/theme/theme.test.ts`: the contrast test. Make sure it covers this deck's theme, or run its check against it.
- `examples/od-templates/theme.json`: a worked alternate theme.
- `packages/decks/components/StoryCover.vue`, `StoryCard.vue` and `StoryStage.vue`: what your CSS restyles.
- `packages/decks/styles/story-frame.css`: the VT rules your override sits on.
- `/Users/riley/Projects/opendata/talks/aisd-takeover/styles/index.css`, lines 66 to 89: the 340 ms view-transition override to adapt. It is a reference for you only: don't mention that repository in a tracked file.
- `decks/texas-2026/OUTLINE.md`: the deck's slot-to-meaning map and the slide 1 spec.

## Skills to apply

Find the newest installed copy with:

```bash
ce=$(ls -d "$HOME"/.claude/plugins/cache/*/ce/*/ | sort -V | tail -1)
```

Then read and use:

- `${ce}skills/design/SKILL.md` and its `references/craft-css.md`. Use them to tune the palette, type scale, spacing rhythm and radii, and to avoid the AI-default patterns it lists.

## What to build

### 1. `decks/texas-2026/theme.json`

A partial override of the default theme.

Surfaces are a chalkboard tint: near-black with a slight green cast. Text is chalk: warm off-white, never pure white.

The ramps:

- `cyan` slot: school-bus yellow. It means "changed hands" and "new".
- `amber` slot: Capitol-granite clay, desaturated. It means AISD risk, pending decisions and gaps.
- `slate` slot: warm chalk greys.
- `emerald`, `violet` and `rose`: low-chroma sage, dusk and plum, for chart support only.

`categorical` is rebuilt from those ramps. Glows are quiet hex values: the deck renders no glows. `chart` colors follow the palette.

Fonts:

- `fonts.sans`: Public Sans.
- `fonts.serif`: Source Serif 4.
- `fonts.mono`: Public Sans, with tabular numerals handled in CSS.

`brand` is `{ "name": "Texas schools after the election", "url": null, "logo": null }` with a wordmark gradient from the palette.

Starting values (tune them until the contrast test passes and the result reads well on a projector):

- canvas `#0e1311`, surface `#141a17`, raised `#1b2320`;
- text `#f1eee6`, muted `#a7a497`, faint `#7a786e`;
- yellow `#d4a20f #e8b923 #f2cc4d #f7dd85`;
- clay `#c8664a #d97c5f #e59a80 #efbba8`.

### 2. `decks/texas-2026/styles/tokens.css`

The first import of `styles/index.css`. It holds:

- the two fontsource `@import`s: `@fontsource-variable/source-serif-4` and `@fontsource-variable/public-sans`, both installed at the repo root;
- `--tx-*` custom properties for every shape and layout value:
  - radii (`--tx-radius-mark` 0 to 2 px, `--tx-radius-card` about 4 px);
  - hairline width and opacity;
  - oval stroke width, the hatch spacing for scenario marks, and the dash pattern for pending marks;
  - headline font size, weight, line height and tracking;
  - card width and padding;
  - `--tx-baseline-y`, the shared chalk baseline in the lower third;
  - the dim opacity mirrored for CSS;
  - the VT fade length (as a `DUR` mirror; check `css-mirror.test.ts` before adding a duration).

Comment each group with what it controls.

Sizes that scale with the frame use `calc(N * var(--sw))` or `var(--sh)`, per `story-stage.md`. No raw `vw`/`vh`.

### 3. `decks/texas-2026/styles/index.css`

Imports `tokens.css`, then applies the system:

- `h2.od-story-head` and the cover title in the serif, from tokens;
- Public Sans everywhere else;
- `font-variant-numeric: tabular-nums` on figures, chips and `InkNumber`;
- cards restyled to the token radius and a hairline border, with no shadows;
- the chalk baseline as a reusable class;
- small status-tag classes (`tx-tag` with `is-pending`, `is-reported`, `is-scenario`), so a word can be printed on an object;
- the 340 ms fade override for this deck's view transitions, adapted from the talks file and scoped to this deck;
- the beat rail tinted to the palette.

Every value comes from `var(--tx-*)` or `var(--od-*)`. No hex, no bare px radii, no opacity literals. Keep each block under an ancestor selector (`.od-slide.is-story ...`).

### 4. `decks/texas-2026/components/design.ts`

JS-side tokens for the beat scripts, each commented:

- `DIM` (about 0.55);
- oval rx and ry;
- the hatch and dash parameters if SVG needs them in JS;
- the ladder rung gap;
- the seat-arc radius;
- the baseline y in viewBox units (matching `--tx-baseline-y`);
- helpers that return `ink()` colors by meaning: `changed()`, `risk()`, `neutral(step)`. Stages then say what they mean, not which slot.

### 5. `decks/texas-2026/components/BallotOval.vue`

The deck's core mark: an SVG ellipse in viewBox units. Its props:

- `cx`, `cy`, `size` (default from `design.ts`);
- `state`: `'empty' | 'filled' | 'hatched'`;
- `meaning`: `'changed' | 'risk' | 'neutral'`;
- `fill`: 0 to 1, so a beat can tween the fill as a radial scale from the center;
- `pending`: boolean, for a dashed stroke.

Hatching is an SVG pattern with a unique id per instance.

### 6. `decks/texas-2026/components/BallotField.vue`

The cover's field. It is a column of office rows, each with a faint office name and a `BallotOval`. The office list and outcomes are imported from `data/02-power-board.ts` if it exists. Otherwise use a local constant with a `// FLAG: replace with data/02-power-board.ts` comment; the research run is writing that module in parallel.

It exposes a `fill` progress per row, which the cover's settle drives, so the won ovals fill one at a time. The Senate oval stays empty.

### 7. Slide 1: `decks/texas-2026/pages/01-cover.md`

The real cover, `StoryCover` plus `BallotField`, per the slide 1 spec in `OUTLINE.md`:

- headline: "Texas elected new leaders. What can they change for Austin's schools?" Tighten it if you can, but keep it a question about change;
- a one-sentence lede;
- byline: "Riley Hilliard · Austin · November 2026".

Keep the presenter-notes comment, with a short spoken open.

### 8. The design sample: `decks/texas-2026/components/PowerBoardStage.vue`

Replace the placeholder with a design sample: a valid 4-beat story stage that keeps `COPY` at 4 entries, because `slides.md` says `clicks: 3`. Show each of these at least once:

- the serif claim headline;
- the left-anchored card;
- a row of `InkLabeledCard`-style office tiles carrying ovals;
- filled, empty and hatched ovals;
- a "Pending" dashed tag;
- the clay accent on one "risk" item;
- the chalk baseline;
- a dimmed earlier item;
- one ping.

It may preview the real slide 2 content (the power board), but its job is to judge the look. The slide 2 run will rewrite it. Put a header comment saying so.

### 9. `decks/texas-2026/DESIGN.md`

A one-page guide covering:

- the slot-to-meaning table;
- which file holds which token, with a "to change X, edit Y" table;
- how to swap a font: a two-line change, the fontsource import in `tokens.css` plus `fonts.*` in `theme.json`;
- the oval and line-style status conventions;
- the do-not list: no hex, radii or opacity literals in components; no red or blue; no glows; no shadows.

## Scope

May change:

- `decks/texas-2026/theme.json`
- `decks/texas-2026/styles/`
- `decks/texas-2026/components/design.ts`
- `decks/texas-2026/components/BallotOval.vue`
- `decks/texas-2026/components/BallotField.vue`
- `decks/texas-2026/components/PowerBoardStage.vue`
- `decks/texas-2026/pages/01-cover.md`
- `decks/texas-2026/pages/02-power-board.md` (comment only)
- `decks/texas-2026/DESIGN.md`
- `packages/decks/theme/theme.test.ts`, only to enroll this deck's theme in the contrast test, if the test enrolls decks by list

Must not change:

- `slides.md`
- `decks.json`
- `package.json`
- `packages/decks/` (other than the one test line above)
- `data/` (the research run owns it)
- `data-sources.md`
- `OUTLINE.md`

If something outside scope is needed, stop and say why.

## Acceptance

```bash
bun run typecheck
bun run test          # story guards scan texas-2026; the theme contrast test passes
bun run lint
bun run check
bun run build tx26
```

Then QA what you built:

1. Start the dev server: `bun run dev tx26`, port 3030. Wait for it with `wait-for 3030`.
2. Run `bun run shot 1` and `bun run shot 2 0`, then `shot 2 1`, `shot 2 2` and `shot 2 3`. Look at each PNG yourself.
3. Fix contrast, crowding and alignment. Confirm the fonts actually loaded: the serif is visible in the headline, with no fallback.
4. Every shot must print `errors: none`.

Finally, prove the tokens work:

1. Change the yellow ramp in `theme.json`, `--tx-radius-card` in `tokens.css`, and `DIM` in `design.ts`.
2. Re-shoot slide 2 and confirm all three changes showed up.
3. Revert.

Report the result.

## Do not

- commit or push
- use hex, px radii or opacity literals in `components/*.vue`, outside `design.ts`
- use raw `vw`/`vh`
- use duration literals (use `DUR`)
- add npm dependencies (the two font packages are already installed)
- mention any repository outside this one in a tracked file

## Review before hand-off

Run one independent review as a fresh read-only Codex process, using the `ce:code-reviewer` body. Use the recipe in `~/.claude/skills/codex-delegate/contract.md`, section "Review before hand-off", with base branch `main` and this contract's path. Fix the findings, then rerun the acceptance checks.

## Hand-off

Leave everything uncommitted. End with:

1. Summary.
2. Files.
3. Decisions: the final palette hex values and contrast ratios, the type scale, anything you changed from the starting values and why.
4. Checks, with results.
5. The shot PNG paths, so the author can review them.
6. The token drill result.
7. Review findings and how you resolved them.
8. Look closer at.
9. Open questions.
