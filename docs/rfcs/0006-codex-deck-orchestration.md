# RFC 0006: A repo kit for orchestrating deck builds through Codex

Status: Draft.

## Problem

Building texas-2026 through `foreman` and Codex worked. The contracts that made it work live in one session's scratchpad, though, and the next deck would rewrite them from scratch. Codex also never reads `.claude/rules/` on its own, so every contract has to carry the reading list. The generic delegate template is aimed at code features. It has no slots for the deck-specific needs:

- a fact base;
- a design approval gate;
- owning slide files;
- a prose audit;
- a free dev-server port.

## Evidence (texas-2026)

The build ran in waves:

- Wave 0: the orchestrator scaffolds the deck, writes the manifest and spec, and adds the shared names.
- Wave 1: a research run writes `data-sources.md` and every `data/*.ts` module, while a design run builds the theme, tokens, marks, cover and a sample slide for approval.
- Wave 2: slide runs, each owning two or three slides' stages, pages and notes, with shared components built by one run and reused by a later one.

Several things needed fixing mid-run:

- the presenter-notes format (RFC 0003);
- port collisions (RFC 0001);
- the prose requirements (RFC 0005);
- research overturning the spec. Rung 6 of slide 3 was "out of reach" in the brief, but research found a majority needed four Republican seats, the fourth-closest lost by 8.6 points.

Every contract had to repeat these instructions:

- the same Codex rule-table reading list;
- the hard rules (COPY length, word budget, no literals);
- the review recipe;
- the hand-off shape.

The texas-2026 contracts as run are kept in [`0006-contracts/`](0006-contracts/), as the starting point for the templates. They are snapshots: they still carry absolute paths from the build machine.

## Proposal

1. Add `.claude/delegate.md`, the repo overlay the `codex-delegate` skill already looks for. It would hold the worktree setup (`bun install`), the gate, the port convention, and the rule that a deck's `slides.md` and `decks.json` belong to the orchestrator.
2. Add contract templates under `.claude/skills/building-a-deck/contracts/`:
   - `research.md`: fact base plus data modules, no slides.
   - `design.md`: theme, tokens, marks, cover, sample slide, token drill.
   - `slides.md`: a base with the reading list, hard rules, prose audit, notes format, QA by `shot` on a free port, code review plus prose review, and the hand-off table. A per-run header fills in the slides, ownership and hand-offs.
3. Document the wave plan in the skill:
   - research and design first;
   - the design approval gate;
   - slide runs grouped so that shared components (a timeline, a seat chart) are built by the first run that needs them, and the runs that reuse them start after it merges;
   - the spec treated as claims that research can overturn, with the orchestrator updating the brief when it does.
4. Have the research contract write all of `data/` up front, so slide runs import constants and never type a figure. This worked well enough here to make it the default for data-driven decks.

## Scope

`.claude/delegate.md` (new), `.claude/skills/building-a-deck/` (contracts and a wave section), the AGENTS.md Codex section, and `render:agent` output (decide whether user projects get the contracts).

## Open questions

- Do the contract templates belong in this repo, or in the `codex-delegate` skill as a "deck" profile? Here is better if user projects should get them through `decks init`.
