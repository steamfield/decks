---
paths:
  - "{{decksDir}}/*/data/*.ts"
  - "{{decksDir}}/*/data-sources.md"
---

# Deck data

One `data/*.ts` module per slide (or per closely related group of slides that
share one fixture, such as a scripted demo). A slide's figures come from that
module, computed at build time; a figure is never typed directly into a
`COPY` array, a chart spec, or a page's markdown, because a number typed twice
is a number that can drift from its source without either test or reviewer
noticing.

## Provenance header

Every module opens with a comment naming where its numbers came from: the
query, the file, the commit, or the document. This header, from a deck
about a state report card corpus, is the pattern; every module under
`{{exemplars}}/tides/data/` follows it:

```ts
/**
 * The Illinois State Board of Education report card corpus, as sheets.
 *
 * One annual file per school year from 1997 to 2025: twenty nine years, twenty
 * nine files. The span is the MIN and MAX year in `isbe/report-card:all`; the
 * file count is one per year, which is how ISBE publishes the report card.
 *
 * The raw row and the SQL are both recorded in `data-sources.md`.
 */
```

Every exported constant that is a figure (not a geometry constant, not a
label string) carries its own one-line provenance comment if the module-level
header does not already cover it, naming the query or the specific source
row.

## Author-reported and banned figures

A claim that is personal or otherwise unverifiable from a query gets
`FLAG: author-reported` (or a more specific flag naming what still needs
confirming) next to it, both in the data module and in its `data-sources.md`
row. A figure that was checked and found wrong, and must never come back,
gets a row in the deck's banned-content table instead of being deleted
silently, so the same wrong number doesn't get re-derived from a stale brief
next time.

## `data-sources.md` skeleton

```md
# <Deck>: data provenance

Every number, chart, and status claim on a slide maps to a real artifact.
This is the fact-check input.

## Slide N: <title>

- Figure/claim, its value, and the query, file, or document it came from.

## Numbers refresh (<date>)

| Item | Old | New | Provenance |
|---|---|---|---|

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
```

A section per visible slide; a hidden slide keeps its section too, so
unhiding it later does not leave the fact-check input behind. Fact-checking a
deck runs the `fact-checking-a-deck` skill, which starts from
`{{decks}} fact-extract <alias>` at the project
root.
