# Contract: {deckName} research and data modules

<!-- Template: see contracts/README.md. Fill every {placeholder}, write the per-slide questions
from the brief, and delete this comment. -->

## Goal

Build the deck's fact base before any slide is written. Today is {date}. Every figure, date, name
and status claim the deck will show must trace to a primary or named source, with a status:
Confirmed, Pending or FLAG.

You produce two things:

1. `{deckDir}/data-sources.md`: one section per slide, in manifest order.
2. One `{deckDir}/data/NN-slug.ts` module per slide that shows figures, holding them as exported
   constants with provenance comments.

The slide runs import these constants and type no figure, date or name themselves.

## Read first

- `.claude/delegate.md`, "For the delegate".
- `AGENTS.md` (already loaded): "Data provenance", and the rule table in its Codex section.
- `.claude/rules/deck-data.md`: the data contract and the `data-sources.md` skeleton. Follow it
  exactly.
- `.claude/rules/prose-patterns.md` and `.claude/rules/project-glossary.md`: the label strings
  you write render on slides, so they follow these too.
- `.claude/skills/fact-checking-a-deck/SKILL.md`: how this file will be checked later. Write it
  so that check passes.
- `examples/opendata-pitch/data-sources.md` and `examples/opendata-pitch/data/`: a worked
  example of both outputs.
- `{deckDir}/{brief}`: every slide and every figure each one shows.
- {The author's notes and source list, if the brief has one.}
- {Any in-repo deck that already sources some of these figures, such as
  `examples/aisd-showcase/data-sources.md`, and what it covers. Reuse a figure only after
  confirming its source still says it, and prefer its primary sources.}

## What to establish

Open every source the brief or the author's notes cite and confirm it says what they claim.
Search further where a figure needs better sourcing. If a dataset query tool is available to you,
a dataset query is the best source: record the SQL.

The brief is a set of claims, not facts. Where a source contradicts it, the source wins: record
the corrected value and report the change in the hand-off. When the brief rests a slide on a
premise (something is impossible, a deadline is fixed, a vote was unanimous), test the premise
itself and state plainly whether it holds, with the numbers.

{Per slide or group of slides: the figures, dates, names and statuses to establish, and any
premise to test. Name what each slide will show, so nothing is left for a slide run to look up.}

## Output format

### `data-sources.md`

Follow the skeleton in `deck-data.md`:

- one section per slide, titles from the brief;
- per figure: value, status (Confirmed / Pending / FLAG), source (a URL with the quoted or
  paraphrased line, or the SQL) and the date fetched;
- a "Banned on-slide content" table for every brief figure checked and found wrong, with the
  correct value;
- a "Refresh before the talk" checklist of every Pending item and who resolves it;
- a short "Conflicts" section wherever sources disagree, saying which one you chose and why.

Replace the scaffold's placeholder rows.

### Data modules

One module per slide that has figures: {the module list, e.g. `data/02-slug.ts`}. Each has:

- a provenance header comment;
- typed exported constants (`as const` where useful);
- a one-line source comment on each figure the header doesn't cover;
- a status on every claim that can still change (`status: 'confirmed' | 'reported' | 'pending'`),
  and dates as ISO strings.

Names and labels the slides show (office holders, decision names, category labels) go in the
modules too, so the stages type nothing factual. Write no geometry and no slide copy.

## Scope

- May change:
  - `{deckDir}/data-sources.md`
  - `{deckDir}/data/`
- Must not change: anything else, in particular `{deckDir}/slides.md`, `{deckDir}/pages/`,
  `{deckDir}/components/` and the brief. If the work needs a change outside scope, stop and say
  why.

## Acceptance

From the worktree root, until clean:

```bash
bun run typecheck
bun run test
bun run check
```

Every module has to compile under `tsc`, and the story guards scan `data/` for raw viewport
units.

## Do not

- commit or push
- invent a figure, or soften one you couldn't source: mark it FLAG with what would confirm it
- mention a repository outside this one, or an absolute path, in a tracked file

## Hand-off

Leave everything uncommitted. End with:

1. Summary.
2. Files.
3. Every figure you changed from what the brief or the author's notes say: old value, new value,
   source.
4. Each premise you were asked to test, with the answer in one sentence.
5. Every FLAG still open, and what would resolve it.
6. Checks run, with their results.
7. Open questions for the author.
