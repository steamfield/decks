# Building a deck through Codex runs

These are the contract templates for building a story deck with Codex runs (`foreman` or
`codex-delegate`), and the order to run them in. Read `.claude/delegate.md` first: it covers
worktrees, hook trust, which files only you edit, and how to fill the placeholders. Copy a
template to a scratch file outside the repo for each run and fill every `{placeholder}`.

| Template | Run | Owns |
|---|---|---|
| `research.md` | one, wave 1 | `{deckDir}/data-sources.md`, `{deckDir}/data/` |
| `design.md` | one, wave 1 | the theme, deck styles, design tokens, marks, the cover, one sample slide |
| `slides.md` | one per group of two or three slides, wave 2 | its slides' stages, pages and deck-local components |

## Wave 0: you, before any run

1. Scaffold: `bun run new {alias} <dir> --story`, plus `--author`, `--brand`, `--url`.
2. Write the brief: the slide arc, each slide's beats and figures, the design direction, and any
   rules every run follows (how party or status is labelled, words to avoid). The draft
   headlines in it are claims still to be rewritten: hand them, with
   `.claude/rules/deck-writing.md` and `.claude/rules/prose-patterns.md`, to a reviewer that
   didn't write them, and fix what it finds before any run sees them. Runs copy draft headlines.
3. Write the `src:` manifest in `slides.md`, with `clicks:` for each slide (its beat count minus
   one), and a page plus a placeholder stage for every slide, so `bun run check` and
   `bun run test` pass before wave 1. Copy the scaffold's first stage for the placeholders; each
   one's `COPY` needs as many entries as the slide has beats.
4. Name what runs share, in the brief: each stage component's name, every `vt-*` view-transition
   hand-off and the two slides it joins, and every shared deck-local component with the run that
   builds it.
5. If the design direction needs a font, install it at the repo root (`bun add
   @fontsource-variable/<slug>`) and set `fonts.webfonts: []` in the headmatter, per "Changing
   the fonts" in `.claude/rules/deck-patterns.md`.

Commit wave 0. Every run starts from it.

## Wave 1: research and design, in parallel

The research run builds the fact base; the design run builds the look and stops at an approval
gate. Neither touches the other's files. Design uses `FLAG` placeholders for any figure research
hasn't delivered, as local constants marked for replacement.

Treat the brief as claims that research can overturn. When research finds a figure or a premise
wrong (texas-2026's brief said a Senate majority was out of reach; research found it needed four
seats, and the fourth-closest race was lost by 8.6 points), update the brief and the affected
slide run's header before that run starts. `data-sources.md` wins over the brief in every slide
contract, but a run told the old premise in its header will build the old slide.

**Approval gate.** The design run ends with shots of the cover and the sample slide. Show them to
the author. No slide run starts until the author approves the look; changes go back to the design
run (`--resume` it, or `foreman` followup) rather than into a slide run.

## Wave 2: slide runs

No slide run starts before research has written all of `{deckDir}/data/` and you have merged it:
a slide run imports every figure, and a run that can't find one will type it.

Group two or three related slides per run. A shared deck-local component (a seat arc used by two
slides, a timeline reused at the close) is built by the first run that needs it, named in its
header under "Builds", and documented in a header comment. A run that reuses it lists it under
"Reuses" and "Waits on", and starts only after the building run is merged. Runs with no shared
dependency run in parallel; at most five at once. Each run owns the `vt-*` hand-offs whose first
slide it owns.

After each run: read its hand-off, review the diff, run the gate from `.claude/delegate.md`
yourself, and commit. Apply any manifest change it asked for (a slide that needed a different
beat count) in `slides.md` yourself.

## After the last run

Finish the deck with the definition of done in `.claude/skills/building-a-deck/SKILL.md`,
section 7: the prose audit over the whole deck (`bun run review-prose {alias}`), the fact-check
(`fact-checking-a-deck`), the export, and the author's own visual QA.

When a run needed a correction mid-way that a template should have carried, add it to the
template in the same branch, so the next deck doesn't need it.
