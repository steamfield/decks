---
trigger: glob
description: "Deck Writing"
globs: "**/examples/*/pages/*.md,**/examples/*/slides.md,**/examples/*/components/*.vue,**/decks/*/pages/*.md,**/decks/*/slides.md,**/decks/*/components/*.vue"
---
<!-- GENERATED from .claude/ for delegate agents from .claude/rules/deck-writing.md. Edit the source, then regenerate this copy to match. -->

# Deck Writing

Slide prose follows different rules from article prose, and the difference is not a matter of degree. An article reader controls the pace and can re-read a sentence. A talk audience gets one pass at reading speed while a person is also talking at them. So the slide carries only what has to be read, and the speaker carries everything else.

If you have written articles or docs before, the habit to unlearn is completeness. A slide that states its claim and stops is finished. A slide that also explains, qualifies, and transitions has taken the speaker's job.

## Word budget

Measured across the decks these examples came from (visible text plus some markup, so read these as an upper bound and trust the ordering, not the digits). Only `agent-experience` ships here; the other rows are kept as the measured range:

| Deck | Slides | Avg words/slide | Heaviest slide |
|---|---|---|---|
| `agent-experience` | 10 | 68 | 106 |
| a technical talk | 11 | 106 | 206 |
| a second technical talk | 10 | 140 | 211 |
| a long conference talk | 16 | 200 | 443 |
| a long-form data story | 26 | 266 | 1022 |

`opendata-pitch` is not in the table, and cannot be: it is a story deck, so its
visible prose lives in the `COPY` arrays of its stage components rather than in
its page files, and a word count over `pages/` measures the wrong thing. Its
budget is the per-card one in `.claude/rules/story-stage.md` instead, eight
words of lead and twenty of body, which is tighter than anything here<!-- decks:repo-only -->, and
`beats.test.ts` fails on a card over that budget<!-- /decks:repo-only -->. A beat with no card is
`{ lead: '' }`; it still counts as a beat.

Target the top of that table. `agent-experience` is the exemplar: roughly 70 words of visible text on a normal slide, and it is the deck that reads cleanest at presentation distance. Treat 150 as the point where a slide needs splitting, and treat a four-figure slide as a bug regardless of how good the content is.

The canonical slide is `examples/agent-experience/pages/03-interview.md`: an eyebrow, a headline that is one claim, three single-sentence bullets, a pull quote, and a three-node diagram whose labels are three words each.

## Headlines are claims, and this inverts the article rule

A slide headline is a full sentence stating the finding, ending in a period: "Interview the agent like you'd interview a user." Not "The method". Not "Our approach to agent research".

Article style guides usually say the opposite for section titles: they label the topic and never narrate a finding. Both rules are correct in place, and the reason they diverge is the reading mode. An article heading is a navigation aid for someone scanning a table of contents, so it describes what a section covers. A slide headline is the one line an audience is guaranteed to read, so it has to carry the point rather than announce a topic. Do not carry the article rule into a deck.

The same split applies to chart chrome. `deck-patterns.md` calls for chart titles that are one-sentence findings, where an article chart usually gets a title that labels the data. That is deliberate, for the same reason.

## Bullets

Three per slide, four at the absolute limit. One sentence each, no wrapping to a third line, and parallel in grammatical shape across the group. A bullet list where the first item is a noun phrase and the second is a full clause reads as sloppy from the back of a room.

A bullet is not a sentence fragment of the slide's argument. Each one stands alone and states something. If two bullets only make sense read together, they are one bullet.

## No paragraphs

There is no slide layout in this package that wants a paragraph, and `od-lede` exists for a single sentence. If a point genuinely needs three connected sentences, it belongs in the speaker notes or gets split across two slides. Prose that a reader would have to work through is the one failure mode that no amount of good typography rescues.

## What carries over from article rules

The anti-slop shapes are the same, because they are defects of sentence construction rather than of format. <!-- decks:repo-only -->`bun run lint` runs on every deck's `pages/*.md`, `slides.md`, and `components/*.vue` under `examples/` and `decks/`, and `beats.test.ts` runs the same error patterns over every story card's `lead`/`body`, so the pattern set in `packages/decks/lint/ai-rhetoric-patterns.tsv` applies here unchanged.<!-- /decks:repo-only --><!-- decks:user: `bun run lint` runs on every deck's `pages/*.md`, `slides.md`, and `components/*.vue` under `decks/`, story cards' `lead`/`body` included, so the package's pattern set (`packages/decks/lint/ai-rhetoric-patterns.tsv`) applies here unchanged. --> `.claude/rules/prose-patterns.md` is the longer catalog of the same tells, with examples. In particular, never write "X is real", never characterize a finding instead of stating it ("that's the whole answer", "the real question is"), never write negation-then-assertion ("That is not a prediction. It is arithmetic."), and never use an em dash.

Terminology also carries over: `.claude/rules/project-glossary.md` is where a project records how its column names and codes read in prose, and column names still get translated before they reach a slide.

## What does not carry over

The article rules about paragraph construction, leading each paragraph with its point, and prose density have no referent here, because slides have no paragraphs. Do not go looking for them, and do not run a paragraph-level structural review on a deck: its tests are paragraph-scoped and a bullet list cannot satisfy them.

Numbers are the exception that keeps its full weight. Every figure on a slide traces to a query recorded in `<deck>/data-sources.md`, exactly as an article figure traces to one. That binds review and copy agents too: a suggested headline or card line that introduces a figure ("Thirteen categories", "half the catalog in eight weeks") has to name the `data-sources.md` row or the `data/*.ts` constant it comes from, and a proposal without one is a prompt to look the number up, not copy to paste. Two such figures from a design review of <!-- decks:repo-only -->the `opendata-pitch` deck<!-- /decks:repo-only --><!-- decks:user: one of the decks this package was extracted from --> were wrong (17 categories, seven weeks) and would have shipped if the brief had not been re-checked against the data files. Fact-checking a deck runs the `fact-checking-a-deck` skill.
