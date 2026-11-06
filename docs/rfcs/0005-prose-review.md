# RFC 0005: Prose review beyond the regex lint

Status: Draft.

## Problem

`bun run lint` and the write hook catch the error-level patterns in `ai-rhetoric-patterns.tsv`: em dashes, "X is real", and similar. They can't catch the shapes that make slide prose read as machine-written:

- balanced antithesis pairs ("X is easy; Y is hard");
- characterizing a result instead of stating it ("the best result the ballot allowed");
- abstract nouns standing in for facts ("relief", "the handover of power");
- cards that describe the visual instead of the content;
- ledes that restate the headline.

Every one of those passed the lint in this deck.

## Evidence (texas-2026)

The author spotted AI slop in the draft headlines before any slide was finished. The orchestrator's own draft headlines in `OUTLINE.md` had several of these shapes, and agents copy draft headlines. The design run's first pass had a cover lede that restated the title, and sample cards like "A thin ring directs attention." All of it was lint-clean.

The fix was procedural:

- a "Prose audit" section in the deck spec;
- every contract required to read `deck-writing.md`, `prose-patterns.md` and the `ce:writer` forbidden-patterns catalog in full;
- a separate prose-review pass, run as a fresh model, with a per-string audit table in each hand-off.

That works, but it lives in one deck's contracts.

## Proposal

1. Add a `decks review-prose <alias>` command. It extracts every visible string (headlines, COPY leads and bodies, chips, labels, notes) with its file and line, and writes a review prompt built from `deck-writing.md`, `prose-patterns.md` and the catalog. It then prints the prompt for a model, or runs one when a model CLI is configured. The output is a per-string table: the string, the pattern matched, and a rewrite.
2. Add a "Prose audit" section to `building-a-deck/SKILL.md`, and make the review step part of its definition of done, between `lint` and `fact-extract`.
3. Promote the catchable cases to warning-level patterns in the TSV: for example, a semicolon joining two short clauses with mirrored structure, or a "but not" clause at the end of a headline. Measure the false-positive rate against the shipped example decks before turning on any of them.
4. Treat draft headlines in a spec as claims, not wording. Say in the skill that an orchestrator's draft headlines must pass the same audit before they go into a brief, because agents copy them.

## Scope

`packages/decks/scripts/` (a new `review-prose`), `packages/decks/lint/ai-rhetoric-patterns.tsv`, `.claude/skills/building-a-deck/SKILL.md`, `.claude/rules/deck-writing.md`, and `render:agent` output.

## Open questions

- Should the command run a model itself, or only build the prompt? Building the prompt keeps the package free of model dependencies.
