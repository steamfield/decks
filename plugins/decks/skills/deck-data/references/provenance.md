# Provenance and source records

## Data modules

Use one `data/*.ts` module per slide, or one for a closely related group sharing a fixture. Store figures, dates, factual names, statuses and category labels there. Geometry belongs with the drawing. Import figures into React and MDX instead of duplicating them in JSX, `COPY` strings, annotations or specs.

Each module opens with a comment naming the dataset, query, command, file/commit or document behind its values, with retrieval date and a pointer to its section in `data-sources.md`. Each exported figure not covered by that header needs a one-line provenance comment. Keep enough raw precision to derive displays; round at display time.

For claims that can change, keep an as-of date and a status such as confirmed, reported or pending. These are deck-owned data fields, not framework APIs. A pending value is not a confirmed figure. Either omit it or make its provisional nature visible and deliberate.

The story starter's `data/01-first.ts` contains illustrative points, not observed measurements. Replace them with sourced data before delivery. A fixture is valid for a clearly labeled demonstration; it is not evidence for a real-world claim.

## `data-sources.md`

Use this skeleton, filling rows from evidence rather than inventing example values:

```markdown
# <Deck title>: data provenance

## Slide <number>: <claim headline>

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |

Raw result or short cited excerpt:

Definition: population, numerator, denominator, period, filters, exclusions.
Derivation and display rounding:
Conflicts and chosen source:

## Numbers refresh (<date>)

| Item | Old | New | Provenance |
| --- | --- | --- | --- |

## Banned on-slide content (checked)

| Claim | Why it is wrong | Correct source / value |
| --- | --- | --- |

## Refresh before the talk

| Pending item | What resolves it | Owner |
| --- | --- | --- |
```

Use the filename/id as well as the current slide number so reordering does not detach evidence. Record “no factual claims” where appropriate. Retain hidden-slide evidence. A hyperlink alone is insufficient for a query-derived figure: keep the query and returned row. For documents keep the URL or file, page/section and the short excerpt that actually supports the claim.

When sources conflict, record both, explain the chosen definition and make copy match it. A figure from another period, a different population or a different denominator cannot silently replace the intended one.

## Reported and rejected claims

Write `FLAG: author-reported` next to a personal or unverifiable claim in the module and source row. Include who reported it, when, and what would confirm it. Carry the qualifier visibly when the audience could otherwise read it as independently established. Do not turn a flag into a smaller unqualified number.

Keep checked false figures and rejected premises in the banned-content table with the correction. Deleting the old value from code alone leaves it available in old briefs and future review suggestions.

## Definitions before charts

For a monthly churn chart, establish whether it is customer churn or revenue churn, the eligible starting population, numerator, period boundaries, exclusions, missing months and rounding. Do not infer missing months as zero. Compare like periods and preserve denominator changes. Include the chosen definition in the source record and enough context on the slide for the audience to read it correctly.

Percent and percentage-point changes are different quantities. Ratios, ranks and “half” claims require explicit arithmetic in the source record and constants in the data module. A label translated for an audience must keep the original statistical meaning.
