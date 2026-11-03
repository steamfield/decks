---
title: Story vs conventional decks
description: When to use a story deck, with one pinned visualization per slide, and when a conventional deck of bullets, tables and charts is the better fit.
group: concepts
order: 3
---

A deck is either conventional or a story deck.

| | Conventional | Story |
| --- | --- | --- |
| A slide holds | Bullets, tables, charts | One pinned visualization |
| Clicks | Reveal elements | Advance the visualization's beats |
| Prose lives in | The page | The stage component, as per-beat card copy |
| Scaffold | `decks new <alias>` | `decks new <alias> --story` |
| Reference deck | `examples/agent-experience` | `examples/opendata-pitch` |

A story deck's `slides.md` turns the story engine on in its headmatter, and each story slide's stanza carries `clicks:`, the stage's beat count minus one. `--story` also sets `animated: true` in `decks.json`, which switches PDF export from `--with-clicks --with-toc` to `--with-clicks --wait 1500`.

A conventional deck can still hold a story slide: `examples/od-templates` includes one.

## Prose budgets

Slide prose is not article prose. A normal conventional slide runs about 70 visible words. A story card has a budget of eight words for the lead and twenty for the body, and `beats.test.ts` checks it.
