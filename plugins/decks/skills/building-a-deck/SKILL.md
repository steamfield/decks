---
name: building-a-deck
description: Use when creating a conventional or story deck with @steamfield/decks, or revising a deck's structure, to scaffold, source, author, inspect and deliver it.
---

# Building a deck

Load `decks:working-with-decks` first and read the installed guide. A conventional deck uses MDX for claims, lists, tables and charts. A story deck keeps one visualization pinned per slide, changes it on clicks, and puts visible prose in a React stage's `COPY` array.

Read [workflow and definition of done](references/workflow.md). Follow this order:

1. Establish audience, talk length, desired decision and available evidence. Honor the requested slide count. Write an arc of claim headlines before building layouts.
2. Load `decks:writing-slides` and `decks:deck-design`. For story decks or motion, load `decks:deck-motion`. For numbers, load `decks:deck-data`; for charts or Ink marks, load `decks:visualization` too. Do this before writing copy or figures.
3. Scaffold with `decks new <alias> [dir]`, adding `--story` for a story deck. Keep an existing deck's conventions when revising it.
4. Source the figures and record provenance. Build the cover and one representative slide to establish the visual direction; review their rendered appearance before repeating the design.
5. Author one MDX file per slide. A story slide names a stage component and explicitly sets `clicks: COPY.length - 1`. Keep motion paced by clicks and every beat reversible.
6. Verify throughout: `decks check`, `decks lint <deck>`, inspect changed slides and click states, then `decks build <deck>`. Fix problems and repeat the affected checks.
7. Before delivery, review all visible strings and notes for prose defects; run the fact-check in `decks:deck-data` on every data-driven deck. Finish with the checks, screenshots and PDF inspection in the definition of done.

Do not invent a fact because the outline needs it. Missing or contradictory evidence changes the claim, the visual or the outline. Tell the author what is unresolved.

A clean linter and a successful build do not establish presentation quality. Read the rendered slides at audience size, and walk the talk in both directions.
