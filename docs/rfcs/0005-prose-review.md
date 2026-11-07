# RFC 0005: Prose review beyond the regex lint

Status: Ready (reviewed). Depends on RFC 0001 item 2 (the alias form of `shot`) and RFC 0003 item 3 (the shared notes parser).

## Problem

`bun run lint` and the write hook catch the error-level patterns in `packages/decks/lint/ai-rhetoric-patterns.tsv` (em dashes, "X is real" and similar), and `beats.test.ts` holds card copy to eight words of lead and twenty of body. Neither catches the shapes that make slide prose read as machine-written: balanced antithesis ("X is easy; Y is hard"), characterizing a result instead of stating it ("the best result the ballot allowed"), abstract nouns standing in for facts ("relief", "the handover of power"), cards that describe the visual instead of the content, and ledes that restate the headline. Every one of those passed both checks in texas-2026. Nothing limits story headline length at all.

## Evidence (texas-2026)

The author spotted these shapes in the draft headlines in `OUTLINE.md` before any slide was built, and agents copy draft headlines. The design run's cover lede restated the title, and its sample cards said things like "A thin ring directs attention." All of it was lint-clean.

The fix was procedural and lives in one deck's contracts: a "Prose audit" section in the spec, every contract told to read `deck-writing.md`, `prose-patterns.md` and the user-level `ce:writer` catalog, and a separate review pass by a fresh model with a per-string audit table in each hand-off. `prose-patterns.md` already carries a condensed copy of that catalog (its line 10 names the source), and `decks init` users don't have `ce:writer`, so the repo's own files must be the whole reading list.

Headlines ran long. A story headline is the `h2.od-story-head` in each stage's template (for example `SenateArcStage.vue:58`), rendered at `--tx-head-size` across `--tx-head-width`. Slide runs repeatedly produced headlines that wrapped to two lines carrying qualifiers ("With all 31 senators present, confirming a commissioner takes 21 votes."), and each needed a manual follow-up. Whether a headline wraps depends on the deck's size and width, so a character count can't catch it across decks.

The existing extractors can't feed a reviewer. `fact-extract.mjs` keeps only lines with numbers; `scan.mjs`'s `proseLines` drops HTML comments (so all notes) and blanks `{{ }}` interpolations; COPY comes back as unresolved template literals; and visible labels live in `data/*.ts` objects no extractor reads as prose.

## Plan

1. Harvest visible text where it renders. Add a text pass to the browser walk in `packages/decks/scripts/browser.mjs`, used by `shot` and `snap`: for each slide and click, collect `h2.od-story-head`, the card's `data-lead` and `data-body` (`StoryCard.vue:56-57`), `.od-inkchip`, SVG `<text>`, and `foreignObject` text. Interpolations arrive resolved. Map each string back to a source file and line by search, and mark it unmapped when the search fails.
2. Add `decks review-prose <alias>`. It runs the harvest from item 1, adds each page's presenter notes through RFC 0003's parser in `lint/scan.mjs`, and prints a review prompt to stdout: the strings with slide, click, file and line; the rules from `deck-writing.md` and `prose-patterns.md`; the line that `deck-writing.md` wins where they disagree; and the instruction to skip paragraph-level review, which `deck-writing.md` says doesn't apply to slides. It asks for a table of string, pattern matched and rewrite. It only builds the prompt; the package takes no model dependency. In this repo it reads `.claude/rules/`; in a user project it reads the copies `decks init` installed, falling back to the package's `agent/templates/rules/`.
   - Wire it in everywhere a command is listed: a root `package.json` script, a `review-prose` entry in the command mapping at `render-agent.mjs:45` (otherwise `render:agent` throws on the new `bun run review-prose` line), and a row in `packages/decks/agent/INVENTORY.md`.
   - Done when: on texas-2026 the prompt includes slide 8's headline with "31" and "21" filled in, every COPY lead, the slide 8 notes, and the `arcLabels` text from `data/08-senate-arc.ts`, each with slide and click.
3. Warn on wrapped headlines in `shot` (which runs on every changed slide, unlike `snap`) and `snap`, through the same `browser.mjs` pass: read `h2.od-story-head`'s rendered line count from its text's client rects and print a warning with slide and click when it exceeds the limit. Set the limit from the shipped decks: one line if a snap of every shipped story deck on main is quiet at one, otherwise two. Warning only.
   - Done when: shooting the texas-2026 commit before its headline fixes warns on the slides that were fixed by hand, and main is quiet at the chosen limit.
4. Add a "Prose audit" step to `.claude/skills/building-a-deck/SKILL.md`, between `lint` and `fact-extract` in the definition of done: run `review-prose` and hand the prompt to a reviewer that didn't write the prose. Say in the same section that an orchestrator's draft headlines are claims to be rewritten, and must pass the audit before they go into a brief.
5. Measure warning-level TSV candidates before adding any: a semicolon joining two short mirrored clauses, and a trailing "but not" clause in a headline. Run each over every shipped deck and add it only if most of its hits are true positives. Record the counts here.

## Scope

`packages/decks/scripts/{browser,shot,snap,deck,render-agent}.mjs`, a new `review-prose.mjs`, `packages/decks/lint/scan.mjs` (reusing RFC 0003's parser), `packages/decks/lint/ai-rhetoric-patterns.tsv`, root `package.json`, `.claude/skills/building-a-deck/SKILL.md`, `packages/decks/agent/INVENTORY.md`, and `bun run render:agent` output.

## Verification

`bun run test`, `bun run lint`, `bun run render:agent` with the drift test, `bun run test:tarball`, and the checks in items 2 and 3.

## Results

Measured on this branch, 2026-11-07.

**Item 3, the wrap limit.** A snap of the eight shipped story decks (od-story-templates, aisd-showcase, keeling, texas-2026, state-of-js, opendata-showcase, opendata-pitch, tides) with the limit at one warned only on state-of-js: its headlines on slides 2 to 5 render on two lines. No deck reached three. By the rule in item 3 the limit is two (`HEAD_LINE_LIMIT` in `browser.mjs`).

The texas-2026 check does not pass at two. At `0cc4cc9` (both the slides 5-7 and 8-10 runs merged, before `c67ec74` and `ac0e94c` rewrote their headlines) the walk at a limit of one warned on exactly the five headlines those commits shortened, slides 5, 6, 7, 8 and 9, and on nothing else (slide 10's rewrite replaced a one-line headline for content); current texas-2026 is quiet at one. Every one of those five rendered on two lines, so at two none warns. The two conditions in item 3 cannot both hold with one global limit: a limit of one catches the texas-2026 wraps and flags state-of-js slides 2 to 5; two keeps main quiet and catches nothing seen so far. The limit is set to one: the warning exists to catch the two-line headline with a leading qualifier, which is the shape texas-2026 had and the shape state-of-js slides 2 to 5 have ("Since 2021, Jest retention fell to 65% as Vitest use rose to 54%."). Those four warnings stand until that deck is next revised; the warning never fails a walk.

**Item 5, the TSV candidates.** Run over every registered deck's lint surfaces (prose and story `COPY`) and over the rendered text of the eight snaps above. A true positive is a pair of short parallel clauses that reads as balanced antithesis.

| Candidate | ERE tried | Source hits (true / false) | Rendered hits (true / false) | Added |
|---|---|---|---|---|
| Semicolon joining two short mirrored clauses | `\b[A-Za-z]+( [A-Za-z]+){0,3} (is\|are\|was\|were\|has\|have\|gets?\|takes?\|stays?\|needs?) [A-Za-z]+[^;.]{0,20}; ` and the same clause again | 0 | 0 | No |
| Any short clause pair joined by a semicolon (the wider form) | `[A-Za-z][^;.!?]{0,60}; [^;.!?]{1,60}[.!?]` | 14 (5 / 9) | 10 (5 / 5) | No |
| Trailing "but not" clause | `, but not [^,.;]+[.]` | 0 | 0 | No |
| Any "but not" | `\bbut not\b` | 0 | 0 | No |

The wider semicolon form's true positives are the mirrored lines ("One row leaves the series hue; everything else stays grey-green.", "630 datasets and 2,135 links in July; 952 and 3,291 today."); its false positives are YAML comments in `slides.md`, legend definitions in `CampusHoverCard.vue`, source lines ("Source: Texas Tribune; certification pending.") and plain sequences of facts. The mirrored lines vary their verbs, so the narrow form misses all of them. Neither semicolon form is mostly true positives, and the "but not" forms have nothing to judge, so no row was added; `review-prose` is where these shapes get caught.
