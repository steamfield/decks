# RFC 0006: A repo kit for orchestrating deck builds through Codex

Status: Ready (reviewed). Execute last: the templates point at the commands and formats RFCs 0001, 0002, 0003 and 0005 add.

## Problem

texas-2026 was built through `foreman` and Codex, and the contracts that made it work existed only as snapshots, in `docs/rfcs/0006-contracts/` as of `959b9fa` (removed once the templates landed: [`contracts/README.md`](../../.claude/skills/building-a-deck/contracts/README.md), [`research.md`](../../.claude/skills/building-a-deck/contracts/research.md), [`design.md`](../../.claude/skills/building-a-deck/contracts/design.md), [`slides.md`](../../.claude/skills/building-a-deck/contracts/slides.md), and [`.claude/delegate.md`](../../.claude/delegate.md)). The next deck would rewrite them. Codex never reads `.claude/rules/` on its own, so every contract carried the reading list by hand. The generic delegate templates are aimed at code features and have no slots for what a deck run needs: a fact base, a design approval gate, slide-file ownership, a prose audit, and a dev server that doesn't collide with other runs.

## Evidence (texas-2026)

The build ran in three waves. In wave 0 the orchestrator scaffolded the deck, wrote the manifest and spec, and added the shared names. In wave 1 a research run wrote `data-sources.md` and every `data/*.ts` module while a design run built the theme, tokens, marks, cover and a sample slide for approval, using FLAG placeholders where research hadn't landed (`0006-contracts/design.md:134` at `959b9fa`). In wave 2, five slide runs each owned two or three slides, and a shared component (the seat arc) was built by one run and reused by a later one.

Four things were fixed mid-run: the presenter-notes format (RFC 0003), port collisions (RFC 0001), the prose requirements (RFC 0005), and research overturning the spec. The brief said rung 6 of slide 3 was out of reach; research found a majority needed four Republican seats and the fourth-closest was lost by 8.6 points.

Every contract repeated the same Codex reading list, hard rules, review recipe and hand-off table. The snapshots also depend on things a template can't carry: an absolute build-machine path in each file, `decks/texas-2026/` paths (the deck now lives in `examples/`), a reference deck in another repository (`opendata/talks/aisd-takeover`), user-level `ce` plugin skills found by globbing `~/.claude/plugins/cache`, and the review recipe in `~/.claude/skills/codex-delegate/contract.md`.

`codex-delegate` reads a repo overlay at `.claude/delegate.md` before anything else (`SKILL.md:21`), and names hook trust as overlay content: Codex trusts `.codex/hooks.json` per absolute path, so without `DELEGATE_TRUST_REPO_HOOKS=1` the prose-lint write hook doesn't run in its worktrees (`scripts/delegate.sh:29-32`). `foreman guide` also tells the orchestrator to read `.claude/delegate.md`, and foreman worktrees inherit hook approval from the main checkout (`AGENTS.md`, Codex section).

## Plan

1. Add `.claude/delegate.md` in two clearly separate parts. The orchestrator part sets `DELEGATE_TRUST_REPO_HOOKS=1` and says a deck's `slides.md` and `decks.json` belong to the orchestrator. The delegate part covers worktree setup (`bun install`), the gate (`bun run check && bun run typecheck && bun run test && bun run lint && bun run build <alias>`, matching what the as-run contracts required), and screenshots through `bun run shot <alias>` with no assigned port (RFC 0001). Point the Codex section of `AGENTS.md` at the delegate part, so `foreman` runs read it too.
2. Add contract templates under `.claude/skills/building-a-deck/contracts/`, built from the snapshots with a `{deckDir}` placeholder for every deck path, and no absolute paths, other-repo references or user-level skill paths. The reading list is the repo's own files (`AGENTS.md`, the rule table, `prose-patterns.md` in place of the writer skill). The review recipe is written into the template rather than pointing at `codex-delegate`. The "patterns to follow" list uses in-repo decks (`examples/aisd-showcase`, `examples/opendata-pitch`). Three templates:
   - `research.md`: writes `data-sources.md` and all of `data/`; touches no slide.
   - `design.md`: theme including RFC 0002's shape tokens, marks, cover, one sample slide, and the token drill, with FLAG placeholders for figures research hasn't delivered; ends at the approval gate.
   - `slides.md`: the base (reading list, hard rules, notes format per RFC 0003, QA by `shot`, code review, prose review by `decks review-prose` per RFC 0005, hand-off table) plus a per-run header for the slides owned, the shared components built or reused, and the runs it waits on.
3. Put the wave plan in `contracts/README.md`: research and design in parallel, the design approval gate, slide runs grouped so the first run needing a shared component builds it and the runs reusing it start after it merges, the spec treated as claims research can overturn with the orchestrator updating the brief when it does, and no slide run starting before research has written all of `data/`. Add one line to the building-a-deck skill pointing at it, inside `<!-- decks:repo-only -->` markers. `SKILL.md` is a `render:agent` source, so unmarked text naming `foreman` or `bun run` would ship to `decks init` users and trip the render guard (`render-agent.mjs:62-63`). `contracts/` itself is never rendered, because `render:agent` copies an explicit file list.
4. Once the templates exist, delete `0006-contracts/` and replace the link above with the templates plus the commit that holds the snapshots.

Done when: a fresh orchestrator session given only the building-a-deck skill, `contracts/` and `.claude/delegate.md` runs wave 1 and one slide run on a throwaway deck, and makes no mid-run correction for any issue the kit covers (notes format, ports, prose audit, data ownership, hook trust). Count the corrections it does make and add them to the templates.

## Scope

`.claude/delegate.md` (new), `.claude/skills/building-a-deck/contracts/` (new), one repo-only line in `.claude/skills/building-a-deck/SKILL.md`, the Codex section of `AGENTS.md` and `.codex/agents/deck-author.toml` if it carries the reading list, and `docs/rfcs/0006-contracts/` (removed at the end).

## Open questions

- Should the templates live in the `codex-delegate` skill as a "deck" profile instead? Here is better while the kit changes with the repo's rules.
