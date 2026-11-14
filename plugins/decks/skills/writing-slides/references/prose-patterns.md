# Prose patterns

Adapted from the claude-essentials writer guidance, https://github.com/rileyhilliard/claude-essentials.
Copyright (c) 2025 Riley Hilliard. MIT License: permission is granted to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies, provided this
notice is kept. The software is provided "as is", without warranty of any kind.

## Voice and concrete claims

Match the author's supplied voice: cadence, word choices and register. Do not polish it toward corporate prose. State what happened, name the actor and support the claim. Describe limits plainly. A real voice sample outranks a generic stylistic preference; evidence and slide readability still matter.

Slide headlines state claims and end in periods. Article section labels and paragraph-level rules do not apply. Slides have no visible paragraphs. Sentence rhythm can vary across the talk without making every card a slogan.

## Fix the sentence shape first

| Pattern | How to recognize it | Repair |
| --- | --- | --- |
| Negative parallelism | “Not X, but Y”, “less about X, more about Y”, or two sentences denying a straw version before asserting the point | Start with the substantive claim. |
| Mechanical triads | Every point has three ascending nouns, verbs or adjectives | Keep only the items the claim needs. A three-bullet ceiling is not a quota. |
| False range | “From X to Y” lists two examples without a meaningful scale | Name the examples directly. |
| Unearned profundity | “Something shifted”, “everything changed”, “X is real” | State the observable change. |
| Self-answered question | A rhetorical question immediately followed by the answer | Write the answer as the sentence. |
| Inflated significance | Calling a result pivotal, transformative or a broader movement | Give the actual result. |
| Characterizing a finding | “The real question is”, “that's the whole answer”, “that is the mechanism” | Delete the label; state what it refers to. |
| Reader direction | Telling people to sit with a number or feel its importance | Show the comparison. |
| Participial significance | A trailing clause about cementing, enhancing or underscoring importance | Cut it or replace it with evidence. |
| Copula avoidance | “Serves as”, “stands as”, “represents” in place of a plain “is” | Use the plain verb when that is the meaning. |
| Dramatic kicker | A final slogan restates each slide's finding | Stop at the finding. |
| Recap or windup | Setup that announces what the slide will cover | Start where the actual claim starts. |
| Hedging seesaw | Qualifiers stacked before a claim, immediately softened after it | State the claim and name its limit once. |
| Vague attribution | “Experts say”, “reports suggest”, “many reviewers” | Name the source or cut the claim. |

Do not add transition openers such as “Importantly”, “Notably”, “Interestingly”, “That said”, “Of course”, “In other words”, “Simply put”, “The reality is” or “It's worth noting”. They consume the first words without carrying evidence.

Avoid press-release positivity and generic benefits. Replace “seamless” with what makes the operation work; replace “powerful” with what it does. Use “use” for “leverage” or “utilize”, “show” for “underscore”, and “explain” for “delve”. Changing vocabulary alone does not fix a repeated rhetorical skeleton.

## Visible formatting

- Use sentence case. No em dashes. Use a colon, comma, parentheses or separate sentences.
- Bold only what needs emphasis, not scattered nouns. Remove decoration and unsolicited emoji.
- Keep lists for parallel points and tables for comparisons. Do not turn every point into a bold label followed by a paragraph.
- An eyebrow or subtitle must add scope, status, period, category or a constraint missing from the headline. Delete paraphrases.

## Review at the right scale

Read each card alone, then all headlines, then the full talk. Look for repeated syntax, identical rhetorical weight and a dramatic line at the end of every slide. Phrase matching cannot reliably find those patterns.

Put the causal explanation, uncertainty, methodology and transitions in `<Notes>`. Notes can be connected prose; on-slide text cannot. Attribute every quotation and real reported scene through `decks:deck-data`.
