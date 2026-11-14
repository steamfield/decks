---
name: deck-data
description: Use when adding or refreshing Decks figures, chart rows, factual claims or real anecdotes, and when fact-checking a data-driven deck before hand-off.
---

# Deck data

Read [provenance and source records](references/provenance.md) before adding a figure. Read [fact-check procedure](references/fact-check.md) when verifying or delivering a data-driven deck. For charts also load `decks:visualization` before writing the spec.

Every number, date, ranking, status, real person and reported scene needs evidence. An outline, an author's brief and a reviewer's suggested wording are claims to check. Derive numbers from the recorded source in the current session instead of copying them from a brief or remembering them.

## Keep a traceable chain

1. Record the source query, command, file or document, the actual result, units, period, population and retrieval date in `<deck>/data-sources.md`.
2. Put typed exported figures and chart rows in `<deck>/data/*.ts`, one module per slide or closely related group. Each opens with a provenance comment. A figure not covered by that header gets its own source comment.
3. Import those constants into the MDX or React component. Derive display rounding, percentages, ratios and numeric `COPY` strings from them. Do not type the same figure again in a card or spec.
4. Cite the source on the slide, using chart chrome, a source line or `StoryLink`. Translate column names and codes to audience language while preserving the underlying definition.

`data-sources.md` has a section for every visible slide; retain hidden-slide sections. Personal or otherwise unverifiable claims carry `FLAG: author-reported` in both the module and source row, with attribution and what would confirm them. Keep checked false claims in a banned-content table so stale briefs cannot reintroduce them.

## Fact-check before hand-off

There is no CLI fact extractor. Read the MDX, referenced React components, `COPY` arrays and data modules, then inspect every rendered click state. Inventory every claim, including labels, source text, chart annotations and derived arithmetic.

Never mark `VERIFIED` without rerunning a query or opening the cited evidence in this session and recording its actual result. A failed query means `UNVERIFIABLE` with the error; it does not establish that the deck is wrong. An attributed claim you have not checked is `EXTERNAL`, never `VERIFIED`. An author-reported claim stays `FLAGGED`.

Write `<deck>/fact-check-report.md` unless the user requested no file. Report mismatches, missing evidence, source failures, deliberate flags and stale figures separately. Load-bearing mismatches, unverifiable or unsourced claims must be resolved before calling the deck ready. A corrected figure must also update its prose, chart domain and any derived claim.
