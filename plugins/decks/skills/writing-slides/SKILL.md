---
name: writing-slides
description: Use when drafting, revising or reviewing Decks headlines, bullets, story cards, chart text, labels or speaker notes for presentation-distance reading.
---

# Writing slides

The audience gets one pass while a person talks. Put only what must be read on the slide; put explanation in speaker notes. Load `decks:working-with-decks` for the installed MDX and notes syntax.

Read [prose patterns](references/prose-patterns.md) before writing or reviewing copy. Slide rules take precedence over article habits.

| Element | Budget and shape |
| --- | --- |
| Normal conventional slide | About 70 visible words, including labels and chrome. At 150, split it. Four separate figures on one slide means redesign it. |
| Headline | One claim, a full sentence ending in a period. State the finding. Topic labels do not carry the talk. |
| Bullets | At most three, one sentence each, parallel grammatical shape. No third wrapped line. Each stands alone; dependent neighbors are one bullet. |
| Story card | Lead at most eight words; optional body at most twenty. One supporting sentence. Budget the rendered text, including interpolated values. |
| Lede | One sentence. No paragraphs anywhere in visible slide prose. |
| Chart title | A one-sentence finding. Units, population and period belong in a short subtitle or source context. |

This conventional scaffold excerpt shows the shape. Replace its instructional bullets with the deck's actual evidence:

```mdx
<h1 className="od-h2">Give each slide one claim.</h1>
<ul className="od-body">
  <li>Replace this point with evidence for your claim.</li>
  <li>Keep each bullet to one sentence.</li>
  <li>Put supporting detail in speaker notes.</li>
</ul>
```

## Write and review

1. Read just the headlines in order. They should carry the argument without the bodies.
2. Count visible words per conventional slide or per story beat, not words in the MDX alone. A React stage's `COPY`, labels and chips count too.
3. Cut paragraphs, redundant subtitles, mood-word eyebrows and repeated labels. An eyebrow earns space only by adding a fact or useful orientation.
4. Translate dataset column names and codes to audience language. Record recurring mappings in the deck's source notes or existing glossary; no glossary rule is enforced automatically.
5. Trace every proposed numeric phrase, including “half”, rankings and ratios, to `data/*.ts` and `data-sources.md` using `decks:deck-data`. Review suggestions need sources too.
6. Read the slide aloud with the speaker notes. The slide states the point; notes supply the qualifications, method and pacing.

## Lint is one part of review

Run `decks lint <deck>` and `decks check`. The installed lint hook, when configured and active, blocks newly written error-level rhetorical patterns in deck MDX and component prose, including literal `COPY` leads/bodies. Notes are reported as warnings. See [lint coverage and limits](references/lint.md).

Never route a denied write through another tool. Rewrite the sentence structure. A clean lint result does not check word budgets, truth, hierarchy or every rhetorical shape; inspect the rendered text yourself.
