# Contract: {deckName} slides {slideRange} ({slide titles})

<!-- Template: see contracts/README.md. Fill the per-run header (Your slides, Builds, Reuses,
Waits on, Scope) for this run, fill every {placeholder} below it, and delete this comment. The
part from "Goal" down is the same for every slide run of a deck. -->

## Your slides

- Slide {n} `{Name}Stage`: {what it shows, and anything the brief's spec for it doesn't say. If
  research overturned part of its spec, say what the data shows and what the slide must not
  claim.}
- {One bullet per slide.}
- View-transition hand-offs you own: {`vt-<name>` from slide n to slide n+1, with what matches
  across the two, or none}.

## Builds, reuses, waits on

- Builds: {a shared deck-local component a later run reuses, e.g. `{deckDir}/components/<Name>.vue`:
  what it draws and its props. Keep its API small and document it in a header comment. Or none.}
- Reuses: {a shared component an earlier run built: read its header comment and import it; don't
  change its API. Or none.}
- Waits on: {the runs whose merged work this one needs, or none}.

## Scope

- May change:
  - `{deckDir}/components/{Name}Stage.vue` {one line per stage you own}
  - `{deckDir}/pages/{NN-slug}.md` {one line per page you own}
  - {each shared component this run builds}
  - `{deckDir}/data/` (only to add a missing label string or fix a type in your slides' modules)
  - `{deckDir}/styles/index.css` (only by appending one commented block for a shared class)
- Must not change: `{deckDir}/slides.md`, the brief, `{deckDir}/DESIGN.md`, `{deckDir}/theme.json`,
  `{deckDir}/styles/tokens.css`, `{deckDir}/components/design.ts`, the design run's marks
  ({mark files}), `{deckDir}/data-sources.md`, components this run reuses, other slides' files,
  and anything outside `{deckDir}/`. Never change a figure in `data/`: report a figure problem
  instead. If the design system lacks something you need, make it local to your component and
  name it in the hand-off. Prefer `<style scoped>` to the shared stylesheet.

## Goal

You are building a few slides of the `{alias}` story deck: {one sentence: the talk, its length
and its audience}. Your slides are listed under "Your slides". Build each one as a finished story
stage: motion, copy and presenter notes, working on every click in both directions.

Match the pacing of the reference decks below: each beat changes one thing, earlier items dim,
cards are tight, and motion explains rather than decorates. The look is this deck's own design
system, already built and approved.

## Read first

- `.claude/delegate.md`, "For the delegate".
- `AGENTS.md` (already loaded), including the rule table in its Codex section. Read every rule
  it lists for the files you touch, in full:
  - `.claude/rules/deck-writing.md`
  - `.claude/rules/prose-patterns.md` (`deck-writing.md` wins where they disagree)
  - `.claude/rules/deck-patterns.md`
  - `.claude/rules/story-stage.md`
  - `.claude/rules/deck-data.md`
  - `.claude/rules/project-glossary.md`
- `.claude/skills/building-a-deck/SKILL.md`: the workflow and the definition of done (section 7).
- `.claude/skills/openchart/SKILL.md`, if a slide uses OpenChart.
- `packages/decks/story/README.md`: the engine API.
- `{deckDir}/{brief}`: your slides' rows and per-slide specs are your requirements, and its rules
  for every run are binding.
- `{deckDir}/DESIGN.md`, `theme.json`, `styles/tokens.css`, `styles/index.css`,
  `components/design.ts` and {the design run's marks}: the design system. Use it; don't extend
  it unless you have to (see Scope).
- `{deckDir}/data-sources.md` and `{deckDir}/data/`: the researched figures. Every figure, date,
  name and status on your slides comes from a constant in your slides' `data/` module. Where the
  brief disagrees with `data-sources.md`, `data-sources.md` wins: change the headline or card to
  match it. A figure marked FLAG is not shown, or is shown with its status word.
- {The author's notes, if any: your presenter notes carry their qualifications.}
- Patterns to follow:
  - `examples/opendata-pitch/components/`: the reference story deck. `PipelineStage.vue` (boxes,
    gates and wires), `DistrictBarsStage.vue` (bars), and its `pages/*.md` for the notes.
  - `examples/aisd-showcase/components/WaffleStage.vue` (grid, ping and ripple) and
    `ScatterStage.vue`.
  - `examples/od-story-templates/components/`: `CardsStage.vue`, `BarsStage.vue`, and
    `HandoffOneStage.vue` with `HandoffTwoStage.vue` for a view-transition hand-off.
  - {Any stage in this deck or `examples/texas-2026/components/` closest to what your slide
    draws, e.g. `CollisionTimelineStage.vue` for a timeline with a cursor.}

## Hard rules

- Each slide gets a story stage `{deckDir}/components/<Name>Stage.vue` on `useStage`.
- `COPY` length equals the slide's beat count, and `slides.md` declares `clicks:` as beats minus
  one. Don't edit `slides.md`. If a slide genuinely needs a different beat count, use it and say
  so in the hand-off; the orchestrator updates the manifest.
- A card lead is at most eight words and a body at most twenty. A headline is one claim ending in
  a period, and renders on one line (`shot` warns when it wraps). A qualifier that makes it wrap
  belongs in the card or the notes.
- No em dashes, and no jargon on screen. {The brief's deck-wide prose rules, e.g. how party or
  status is labelled, statute numbers kept off screen.}
- No hex values, `px` radii or opacity literals in components. Colors come from `ink()`, the
  meaning helpers in `design.ts`, `var(--od-*)` or the deck's own tokens; durations from `DUR`;
  frame-relative sizes from `--sw`/`--sh`.
- {How evidence status prints on an object, e.g. the deck's status tag classes.}
- Each page `pages/NN-slug.md` has three parts, in order: the `SLIDE N` header comment, the
  `<NameStage />` tag, then one trailing presenter-notes comment. The notes are an optional
  `ABOUT THIS SLIDE`, then `SAY (opening)` for beat 0, then one plain `[click]` paragraph per
  click (exactly `clicks` of them, never `[click:N]`), then an optional `IF ASKED`. Each
  paragraph is speakable in about 25 seconds. "The stage page and its presenter notes" in
  `story-stage.md` has the template; `bun run test` fails a page that breaks it.
- Each slide's `StoryLink` cites the source in `data-sources.md` for its main figure.

## Acceptance

Run the gate in `.claude/delegate.md` ("The gate") until clean. Then QA every slide you own as
the audience would see it:

1. For each slide, `bun run shot {alias} <n> <clicks>`, with that slide's `clicks:`. Restart a
   dev server you kept running after adding any component file. Look at every PNG.
2. Check that:
   - nothing overlaps or clips, and no ink sits in the reserved headline or card regions;
   - text is readable at the back of a room;
   - one thing changes per beat;
   - each click's card lead matches its `COPY` entry;
   - the run prints `errors: none` and no headline-wrap warning.
3. Check backward stepping by reading the beat script: every beat's state is a tween on the
   beat timeline, so seeking to click k from either side gives the same frame. Nothing the beats
   rely on is set in `enter`, a watcher or a timer, and no ref'd child sits inside the
   `playCount` key (`story-stage.md`).
4. Fix what you find.

## Do not

- commit or push
- edit files outside "May change"
- add dependencies
- type a figure, date or name that isn't imported from `{deckDir}/data/`
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
   > changed outside the contract's scope; a figure, date or name typed into a component or
   > page rather than imported from `{deckDir}/data/`; a hex color, px radius, opacity,
   > duration or raw `vw`/`vh` literal where a token belongs; a beat whose frame depends on the
   > direction it was reached from; a ref'd child inside the `playCount` key; COPY length or
   > presenter notes out of step with the page's `clicks:`; a shared component whose API or
   > header comment a later run couldn't use as written. Also review as an audience member who
   > knows nothing about {the subject}: is each beat clear at speaking pace?

   Then run:

   ```bash
   codex exec --ephemeral --sandbox read-only -m "{reviewModel}" -c 'model_reasoning_effort="high"' -c 'service_tier="priority"' -o "<review dir>/review.md" - < "<review dir>/prompt.md"
   ```

3. Prose review. Run `bun run review-prose {alias} > "<review dir>/prose-prompt.md"`. It walks
   the deck on its own dev server and writes a review prompt holding every visible string
   (headlines, card copy, chips, SVG labels, including labels from `data/`) and the presenter
   notes, with slide, click and source line, plus the writing rules. With the file-editing
   tool, add these lines at the top of that file: "Review only the sections for slides
   {slideList}; other runs own the rest. Be strict: a string that sounds like a slogan, a
   balanced pair, or a characterization of a result fails. Also apply these rules from the
   deck's brief: {the brief's prose rules, or delete this sentence}." Then run:

   ```bash
   codex exec --ephemeral --sandbox read-only -m "{reviewModel}" -c 'model_reasoning_effort="high"' -c 'service_tier="priority"' -o "<review dir>/prose-review.md" - < "<review dir>/prose-prompt.md"
   ```

Fix every finding in `review.md`, and apply or answer every row of `prose-review.md`, or say in
the hand-off why a finding is wrong. Rerun the gate and the shots of every slide you changed.
One pass of each review only.

## Hand-off

Leave everything uncommitted. End with:

1. Summary.
2. Files.
3. Per slide: the final headline, the `COPY` leads, the beat count, and any deviation from the
   brief and why.
4. The prose review: each row (string, pattern, change), and how you resolved it.
5. Any shared component you built: its props and where its header documents them.
6. Manifest or other out-of-scope changes the orchestrator needs to make.
7. Checks, with results.
8. The shot PNG paths.
9. Code review findings, and how you resolved each.
10. Look closer at.
11. Open questions.
