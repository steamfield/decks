# RFC 0003: A presenter-notes format, template and guard

Status: Done. Landed in `bc82bb9`, with review fixes in `6aaf924` and the commit after it.

## Problem

Nothing in the repo says how presenter notes are written for a story slide, and nothing checks them. Two Slidev behaviors make mistakes silent: it reads notes only from the last HTML comment on a page, and its `[click]` markers start at click 1, so the opening paragraph covers beat 0 and a page needs exactly as many markers as its `clicks:`. Get either wrong and the notes vanish or drift out of step with the beats, and nobody notices until the talk.

## Evidence (texas-2026)

The orchestrator's contracts asked for "header, notes comment, then `<Stage />`, one `[click]` paragraph per beat". Both the order and the count were wrong. The slides 8 to 10 run's code review caught it, and three running agents were corrected mid-run. `deck-patterns.md` says only that every page starts with a comment identifying the slide, which reads as if the notes go there too.

The format the deck settled on, on all 12 of its stage pages (see `examples/texas-2026/pages/08-senate-arc.md`), is a trailing comment with four sections: `ABOUT THIS SLIDE` (what the visual shows, plus `Source:`), `SAY (opening)` for beat 0, one `[click]` paragraph per later beat, and `IF ASKED`. Every texas-2026 page's marker count matches its `clicks`, and so do aisd-showcase's three. The other story decks (tides, keeling, opendata-pitch, opendata-showcase, state-of-js, od-story-templates) have no notes after their stage tags.

## Plan

1. Document the format in `.claude/rules/story-stage.md`: page order (header comment, stage tag, trailing notes comment), the four sections with `ABOUT THIS SLIDE` and `IF ASKED` optional, the opening paragraph covering beat 0, and exactly `clicks` plain `[click]` markers. Clarify the header-comment line in `.claude/rules/deck-patterns.md`: the header identifies the slide and holds no notes.
2. Put that shape in `packages/decks/templates/story/pages/02-first.md`, with exactly two `[click]` markers to match the template stanza's `clicks: 2` (`templates/story/slides.md:39`), and placeholder text that passes `decks lint`, which scans `pages/*.md`.
3. Add a shared notes parser to `packages/decks/lint/scan.mjs`, which ships in the package, so RFC 0005's `review-prose` can reuse it. It finds notes by content, not position: any comment other than the leading `SLIDE N` header that contains `[click]` or `SAY (opening)`. (As landed after review: the header counts too when it holds markers, so notes written into it fail as not trailing, and a trailing comment with no markers is returned as unstructured notes, which the guard fails on a stage page and `review-prose` still reads. `.claude/rules/story-stage.md` has the current contract.)
4. Add the guard to `packages/decks/story/beats.test.ts`, which already parses each stanza's `clicks` (line 128) and walks every story deck through `storyDecks()`. For each stage page with a notes comment: it must be the last non-blank content on the page, and its `[click]` count must equal the stanza's `clicks`. A `[click:N]` marker fails with a message saying to use plain markers, since it would make the count meaningless. A page with no notes comment passes, so existing decks need no pinned list.
   - Done when: moving slide 8's notes above `<SenateArcStage />` fails the guard, deleting one `[click]` fails it, changing one to `[click:2]` fails it with the plain-marker message, and every shipped deck passes unchanged.
5. Add "every stage page has notes in this format" to the building-a-deck skill's definition of done, so new decks get notes without forcing them onto old ones.

Not doing: a notes word budget (no run overran), or the guard on conventional decks (they rarely use `[click]` and their notes have never broken). The trailing-comment rule goes in the docs for both.

## Scope

`.claude/rules/story-stage.md`, `.claude/rules/deck-patterns.md` and their `.agents/rules/` copies, `packages/decks/templates/story/pages/02-first.md`, `packages/decks/lint/scan.mjs`, `packages/decks/story/beats.test.ts`, `.claude/skills/building-a-deck/SKILL.md`, and `bun run render:agent` output.

## Verification

`bun run test`, `bun run lint`, the mutations in item 4, and `bun run test:tarball`, which runs `decks new --story` and so proves the new template scaffolds and lints.
