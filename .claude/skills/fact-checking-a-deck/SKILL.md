---
name: fact-checking-a-deck
description: Fact-check a deck by re-running the source behind every figure and checking data arrays, card copy and slide text against the results. Use when asked to "fact-check", "verify the numbers", or "data audit" a deck, and before handing a data-driven deck off. Reads <deck>/data-sources.md and <deck>/data/*.ts.
---

# Deck fact-check

Verify every number in a deck against the source recorded for it. No estimation, no memory, no approximation.

## Hard rules

1. **Never mark VERIFIED without a query run or a source opened in this session.** Paste the actual result row (or the quoted line from the document) next to each claim.
2. **Never estimate or recall a value.** If a query fails or a source is unreachable, the status is UNVERIFIABLE with the error message, not a guess.
3. **Query failure is not a bug in the deck.** It means you can't verify, not that the number is wrong.

## Workflow

### 1. Extract the manifest

```bash
bun run fact-extract <alias>          # alias from decks.json; or: bun tools/content-fact-extract.mjs <deck-dir>
```

The extractor produces three sections: data arrays (every array literal in `data/*.ts` and in the `<script>` of pages and components, which includes story `COPY` arrays), prose numeric claims in `slides.md` and `pages/*.md`, and external links in number-bearing sentences. Treat this output as your working checklist, together with every exported figure constant in `data/*.ts` (the extractor lists arrays, not scalar constants, so read the data modules too).

### 2. Run the sources

The deck's `data-sources.md` names, per slide, the query, file, command or document each figure came from, and each `data/*.ts` module repeats it in its provenance header (`.claude/rules/deck-data.md`). For each figure, run the query or open the source named there:

- **A query or command:** run it as recorded, against the same dataset or file. Paste the result row.
- **A file in the repo:** read the cited lines.
- **A document or web page:** open it and quote the line that carries the figure. If you cannot reach it, the status is UNVERIFIABLE, or EXTERNAL when the claim is attributed on the slide.
- **A `FLAG: author-reported` row:** it cannot be verified from a query by definition. Report it as FLAGGED with what still needs confirming; do not mark it VERIFIED.

### 3. Verify data arrays

Compare each data array (chart data, figure constants) against the source result:

| Data type | Tolerance |
|-----------|-----------|
| Counts (rows, people, items) | Exact match |
| Money (raw) | Exact match |
| Money (display, e.g. "$15M") | Consistent with stated rounding |
| Percentages | +/- 0.1 percentage point |

Flag any discrepancy as MISMATCH with the expected vs actual values.

### 4. Verify slide text and card copy

Map each numeric claim on a slide, and each figure in a story card's `lead`/`body`, to its source:

1. The `data/*.ts` constant it should be computed from. A figure typed into copy instead of read from a data module is a finding even when the value is right (`.claude/rules/deck-data.md`).
2. The `data-sources.md` row for that slide.
3. An external citation (a linked URL or a `StoryLink`).

For derived arithmetic ("four times faster", "half the catalog"), show the computation.

Claims citing external sources get status EXTERNAL (not UNVERIFIABLE).

### 4b. Verify people and anecdotes

Every person presented as real (a name, a direct quote, a reported scene) must trace to a source in `data-sources.md` (linked source, public record, or named report). Flag any such detail with no source as UNSOURCED-HUMAN and treat it like a MISMATCH for readiness. Numbers aren't the only thing that can be invented.

Clearly-signaled hypotheticals are NOT flagged: unnamed roles in scenario framing, second-person framing, and "imagine/suppose" setups are illustration, not reportage. Verify the numbers inside them like any other claim.

### 5. Every data array maps to `data-sources.md`

`<deck>/data-sources.md` is the source of truth. Map each data array and each figure constant to a documented source. A data array with no entry in `data-sources.md` gets flagged UNSOURCED, and so does a visible slide with no section. A figure listed in the deck's banned-content table that appears anywhere in the deck is a MISMATCH.

### 6. Check staleness

`data-sources.md` and the provenance headers record when a figure was taken ("as of", a query date, a "Numbers refresh (<date>)" table). A figure about something that changes (a live count, a price, a current total) whose recorded date is more than 90 days old is STALE, with the date. Historical figures (a closed year, a published report) do not go stale.

### 7. Generate report

Write the report to `<deck>/fact-check-report.md` (or print it if the author asked for no file).

Report format:

```markdown
# Fact-Check Report: <deck title>

Date: <today>
Deck: <path>
Status: <CLEAN / N MISMATCHES / N UNVERIFIABLE / N UNSOURCED / N UNSOURCED-HUMAN>

## Results

| # | Claim | Location | Source | Expected | Found | Status | Note |
|---|-------|----------|--------|----------|-------|--------|------|
| 1 | ... | file:line | query or document | value | value | VERIFIED | |
| 2 | ... | file:line | - | value | - | MISMATCH | expected X, got Y |

## Summary

- N claims verified
- N mismatches (list)
- N unverifiable (list with errors)
- N unsourced arrays or slides (list)
- N unsourced humans (list)
- N flagged author-reported (list, with what needs confirming)
- N external citations (not checked)
- N stale (recorded date > 90 days)
```

Status values: **VERIFIED**, **MISMATCH**, **UNVERIFIABLE**, **UNSOURCED**, **EXTERNAL**, **FLAGGED**, **STALE**, **UNSOURCED-HUMAN**

A MISMATCH, UNVERIFIABLE, UNSOURCED or UNSOURCED-HUMAN on a load-bearing claim (a headline, a card lead, the cover, the close) means the deck is not ready to present.
