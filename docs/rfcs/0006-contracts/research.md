# Contract: texas-2026 research and data modules

## Goal

Build the deck's fact base before any slide is written. Today is 2026-11-06, and the facts are days old. Every figure, date, name and status claim the deck will show must trace to a primary or named source. That covers state statute, the Constitution, the Texas SOS, AISD, TEA, the Legislature and named reporting. Each one also needs a status: Confirmed, Pending or FLAG.

You produce two things:

1. `decks/texas-2026/data-sources.md`: one section per slide, in manifest order.
2. One `decks/texas-2026/data/NN-slug.ts` module per slide, holding the figures as exported constants with provenance comments.

The slide-writing runs import these constants and type no numbers themselves.

## Read first

- `AGENTS.md`: "Data provenance", and the Codex rule table.
- `.claude/rules/deck-data.md`: the data contract and the `data-sources.md` skeleton. Follow it exactly.
- `.claude/skills/fact-checking-a-deck/SKILL.md`: how this file will be checked later. Write it so that check passes.
- `decks/texas-2026/OUTLINE.md`: the 14 slides and every figure each one shows.
- `decks/texas-2026/source-outline.md`: the author's claims and source URLs.
- `/Users/riley/Projects/opendata/talks/aisd-takeover/data-sources.md` and its `data/*.ts`: an earlier, fact-checked deck on the same AISD story. It already sources many figures:
  - Burnet's and Webb's ratings history and fifth-F scores;
  - the appeal and the "December 11 final" date;
  - the parent-petition mechanism;
  - recapture and budget figures;
  - Houston NES enrollment.

  Reuse a figure only after confirming that its source still says it. Prefer its primary sources. It is a reference for you only: no tracked file may mention that repository or its paths.
- `examples/aisd-showcase/data-sources.md` and `examples/aisd-showcase/data/07-waffle.ts`: the campus waffle data that slide 5 ports.

## What to establish

Use web search and fetch. Open every source URL in `source-outline.md` and confirm it says what the outline claims. Search further where a figure needs better sourcing.

### Election (slides 1, 2, 3)

- Who won Governor, Lt. Governor, AG and Comptroller.
- The House majority and seat count.
- The Senate split (19–12?).
- The SBOE split and the District 8 status.
- Certification status as of today.

### Senate seat math (slide 3, rung 6)

- How many of the 31 Senate seats were on the 2026 ballot, and which.
- How many of those Republicans held.
- How many seats Democrats needed to flip for a majority.

State plainly whether a Democratic Senate majority was mathematically impossible this cycle. If it wasn't, state how many contested seats it would have needed.

Then write a short "what could have happened" table for slide 3's ladder: each rung's outcome and whether it was on the ballot this cycle.

### Two campuses and the law (slides 4, 5, 6)

- Burnet and Webb: whether all five consecutive ratings were F, or included unacceptable D's.
- The appeal status.
- The AISD campus count shown by the waffle.
- The TEC §39A.111 and §39A.112 wording: the board of managers or closure, the petition majority, the trustee request, and that a monitor or conservator doesn't satisfy the rule.

### Timeline (slides 7, 14)

Each date, its source, and whether it is a reported date or a legal one:

- the Dec 1 petition deadline;
- the appeal resolution (about Dec 10 or Dec 11);
- the Dec 15 trustee request;
- the Jan 19, 2027 inauguration;
- the Feb 15 order deadline.

Also find:

- AISD board meeting dates through February 2027;
- 2027 session milestones through June 2027: session start, bill filing deadline, sine die.

### Senate and commissioner (slides 8, 9)

- The two-thirds rule (art. IV §12) and what 21 votes assumes.
- The holdover (art. XVI §17).
- The removal issue (art. XV §9, and TEC §§7.051 to 7.053).
- Any reporting on Senate rules changes to the Lt. Governor's powers.
- Rep. Harrison's special-session call.
- §§39A.207 to 39A.209: replacing managers, early removal, and the two-acceptable-ratings condition.

### Tools (slide 10)

What the governor can do alone, and what needs a bill. Cite the Constitution or statute for each item.

### Money (slide 11)

- The HB 2 (2025) total, and the Senate vote count (was it unanimous, and by what tally?).
- AISD's 2026–27 projected shortfall before cuts ($181M?).
- AISD's recapture payment, with its year ($715.5M?).
- The plain-language definition of recapture.

### Houston (slide 12)

- An HISD enrollment series from 2018–19 to 2025–26, with the "21,000 lost" figure and its baseline year.
- A campus rating trend series. Use counts of A/B or of D/F campuses by year, whichever the source supports.

The OpenData MCP tools, if available to you, may have TEA enrollment and accountability datasets. A dataset query is the best source: record the SQL.

### Futures and watch (slides 13, 14)

Any figure those slides use, and the five decisions to watch, each with who makes it.

## Output format

### `data-sources.md`

Follow the skeleton in `deck-data.md`:

- one section per slide (Slides 1 to 14, titles from `OUTLINE.md`);
- a table of figure, value, status (Confirmed / Pending / FLAG), and source (URL plus the quoted or paraphrased line, or the SQL), with the date fetched;
- a "Banned on-slide content" table for anything checked and found wrong. For example, if the outline's 21,000 or its $8.5B is wrong, add a row with the correct value;
- a "Refresh within 24 hours of the talk" checklist, adapted from Appendix D of `source-outline.md`;
- a short "Conflicts" section wherever sources disagree, saying which one you chose and why.

Replace the scaffold's placeholder rows.

### Data modules

Write one module per slide that has figures:

- `data/02-power-board.ts`
- `data/03-outcome-ladder.ts`
- `data/04-rulebook.ts`
- `data/05-two-campuses.ts` (port the waffle data from `examples/aisd-showcase/data/07-waffle.ts` and its JSON, keeping its provenance)
- `data/06-trigger-tree.ts`
- `data/07-collision-timeline.ts` (dates as ISO strings plus a `status: 'confirmed' | 'reported' | 'pending'` field)
- `data/08-senate-arc.ts`
- `data/09-undo.ts`
- `data/10-tools.ts`
- `data/11-hb2.ts`
- `data/12-houston.ts` (the two series)
- `data/13-futures.ts` (only if it has figures)
- `data/14-watch.ts`

Each module has:

- a provenance header comment;
- typed exported constants (`as const` where useful);
- a one-line source comment on each figure;
- a status on every claim that can be pending.

Names and labels the slides show (office holders, the party text, decision names) go in the modules too, so the stages type nothing factual themselves. Don't write geometry or copy.

## Scope

- May change: `decks/texas-2026/data-sources.md`, `decks/texas-2026/data/`.
- Must not change: anything else. In particular, not `slides.md`, `pages/`, `components/`, `OUTLINE.md`, or anything outside `decks/texas-2026/`.

## Acceptance

```bash
bun run typecheck
bun run check
```

Both must be clean. Every module has to compile under `tsc`.

## Do not

- commit or push
- invent a figure, or soften one you couldn't source. Mark it FLAG with what is needed to confirm it.
- mention any repository outside this one in a tracked file

## Hand-off

Leave everything uncommitted. End with:

1. Summary.
2. Files.
3. Every place you changed a figure from what `OUTLINE.md` or `source-outline.md` says, with old value, new value and source.
4. The Senate seat-math conclusion in one sentence.
5. Every FLAG still open.
6. Checks run, with their results.
7. Open questions for the author.
