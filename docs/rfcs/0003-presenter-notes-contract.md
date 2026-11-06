# RFC 0003: A presenter-notes format, template and guard

Status: Draft.

## Problem

Nothing in the repo says how presenter notes should be written for a story slide, and nothing checks them. Slidev has two behaviors that are easy to get wrong:

- It reads notes only from the trailing HTML comment on a page.
- Its `[click]` markers start at click 1, so the opening paragraph covers beat 0, and a page needs exactly `clicks` markers.

Get either wrong and the notes silently disappear, or drift out of step with the beats. Nobody notices until the talk.

## Evidence (texas-2026)

The orchestrator's slide contracts asked for "header, notes comment, then `<Stage />`, one `[click]` paragraph per beat". Both parts were wrong. The slides 8–10 run's independent code review caught it, and three running agents had to be corrected mid-run. `deck-patterns.md` says only "every page file starts with a comment identifying the slide", which a reader can take to mean the notes go there too.

## Proposal

1. Document the format in `.claude/rules/story-stage.md`:
   - the order: slide header comment, stage tag, trailing notes comment;
   - the opening paragraph covers beat 0;
   - one `[click]` paragraph for each later beat.
2. Put that shape in the story page template that `decks new --story` writes.
3. Add a guard to `beats.test.ts`, or a sibling test. For each story page, it checks that the last comment is the notes, and that its `[click]` count equals the stanza's `clicks:`. Pages with no notes are allowed only with an explicit opt-out marker.
4. Optionally, add a notes word budget (roughly 25 seconds of speech per beat, about 60 to 70 words), reported as a warning, so the notes stay speakable.

## Scope

`.claude/rules/story-stage.md`, `deck-patterns.md` (the header comment section), `packages/decks/templates/story/`, `packages/decks/story/beats.test.ts`, and `render:agent` output.

## Open questions

- Should conventional decks get the same guard? They use `[click]` less, but the trailing-comment rule applies to them too.
