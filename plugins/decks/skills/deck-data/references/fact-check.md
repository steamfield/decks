# Fact-check procedure

## 1. Inventory claims

Read `data-sources.md`, all relevant `data/*.ts`, MDX frontmatter/body/notes, React stages, `COPY`, labels, chips, chart specs and annotations. Follow imported data, including JSON snapshots. Scalars matter as much as arrays. Inspect every rendered click, because a computed string may not be searchable in source.

Build a checklist with claim, rendered value, file:line or slide/click, data constant, and source row. Include numbers spelled as words, percentages, ratios, ranks, dates, statuses, quotes, people and reported scenes. Check hidden slides before restoring them. No extraction command is assumed.

## 2. Run sources now

- Query or command: run the recorded operation against the same dataset or revision and save the actual result row.
- Local file: read the cited evidence and record its revision when relevant.
- Web page or document: open the cited source, record the relevant excerpt and retrieval date. A source must support the exact population, period and claim.
- `FLAG: author-reported`: report it as `FLAGGED`, identifying the reporter and what still needs confirming. It cannot become independently verified without new evidence.

If access fails, record the error and `UNVERIFIABLE`. A failed query is not a mismatch. If an attributed external claim is deliberately left unchecked, label it `EXTERNAL` and carry that limit. Attribution alone does not prove it.

## 3. Compare source, data and visible claim

| Quantity | Comparison |
| --- | --- |
| Counts and raw monetary values | Exact |
| Displayed money or rounded values | Consistent with recorded rounding |
| Percentages | Within 0.1 percentage point, with matching denominator and documented rounding |
| Ratios, changes and rankings | Recompute explicitly from source constants |

Tolerance is not a license to ignore the definition. Record expected versus found. A numerically correct claim typed directly into `COPY` rather than derived from its data module is still a provenance finding. Verify that chart rows, domains, annotation coordinates and prose all reflect the same current data.

Every array and figure constant maps to a source row. A missing source is `UNSOURCED`; a missing section for a slide is also a finding. A banned figure appearing again is `MISMATCH`.

## 4. Check people and time

Every person presented as real, direct quotation and reported anecdote needs a traceable public record, linked source or named report. Unsupported details get `UNSOURCED-HUMAN`. Clearly signaled hypotheticals using unnamed roles are illustrations, but their numeric claims still need checking.

For changeable figures, a recorded retrieval/as-of date older than 90 days gets `STALE`; refresh sooner when the talk requires it. Historical closed-period figures do not go stale merely with age. Missing dates are provenance findings. A fresh query that returns a different period does not verify the old claim automatically.

## 5. Report and fix

Write `<deck>/fact-check-report.md`, or print the report if the user requested no file:

```markdown
# Fact-check: <deck title>

Date: <today>
Deck: <directory>
Readiness: <ready / unresolved load-bearing claims>

| Claim | Location | Constant / source row | Evidence run or opened | Expected | Found | Status | Resolution |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Totals and open items

Counts by status; actual query errors; missing sources; reporter and confirmation
needed for each flag; refresh dates; effect on the headline or decision.
```

Statuses: `VERIFIED`, `MISMATCH`, `UNVERIFIABLE`, `UNSOURCED`, `UNSOURCED-HUMAN`, `EXTERNAL`, `FLAGGED`, `STALE`. Preserve a staleness note even after verifying a historical snapshot's transcription. Do not call a deck clean because unchecked items were excluded from the verified count.

A mismatch, unverifiable source, or missing evidence behind the headline, card lead, cover, close or decision means the deck is not ready. Resolve it by obtaining evidence, changing the claim or removing it. Make deliberate reported/external qualifications visible and carry them in the hand-off. Rerun affected sources, update `data-sources.md` and modules, revise derived copy and chart geometry, then lint and inspect the affected states.
