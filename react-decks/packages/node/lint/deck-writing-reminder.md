Deck writing reminder (see .claude/rules/deck-writing.md):
- Slides are NOT short articles. The audience gets one pass at reading speed while someone talks over it. The slide carries only what must be read; the speaker carries the rest.
- Word budget: ~70 visible words on a normal slide. A story card is eight words of lead, twenty of body. 150 means split the slide. Four figures means it is a bug.
- Headlines are CLAIMS, full sentences ending in a period ("Interview the agent like you'd interview a user."), not topic labels. This deliberately INVERTS the usual article section-title rule; do not carry article habits in. Same for chart titles: findings, not labels.
- Bullets: three per slide, one sentence each, parallel grammatical shape. A bullet that only makes sense next to its neighbor is one bullet.
- NO paragraphs. `od-lede` is for a single sentence. Three connected sentences go in speaker notes or across two slides.
- Anti-slop shapes carry over unchanged (`decks lint` covers each deck's `slides/*.mdx`, `components/*.tsx`, `layers/*.tsx` and story-card COPY in `.ts/.tsx`): never "X is real", never characterize a finding instead of stating it, never negation-then-assertion, never an em dash. Catalog: .claude/rules/prose-patterns.md.
- Article rules that do NOT apply here: paragraph construction, leading each paragraph with its point, prose density, and paragraph-level structural review.
- Every figure traces to a query in `<deck>/data-sources.md` and a `<deck>/data/*.ts` constant (.claude/rules/deck-data.md). Deck fact-check runs the `fact-checking-a-deck` skill.
