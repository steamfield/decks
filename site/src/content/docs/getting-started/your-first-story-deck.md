---
title: Your first story deck
description: What decks new --story writes, how a story slide is put together, and where to look in the example decks.
group: getting-started
order: 2
---

`bunx -p slidev-addon-decks decks new my-talk --story` scaffolds `decks/my-talk/` and registers the alias `my-talk` in `decks.json`.

## The files

```text title="decks/my-talk/"
slides.md          headmatter and the src: manifest, one stanza per slide
pages/01-cover.md  the cover
pages/02-first.md  the first story slide: one stage component
components/        FirstStage.vue, the stage
data/first.ts      the figures the stage draws
data-sources.md    where each figure comes from
styles/index.css   deck-local CSS, loaded by Slidev
```

A story slide pins one visualization to the slide and advances it in beats on the arrow keys. The stage component holds the chart and the card copy for each beat; the page file only places the stage.

`FirstStage.vue` is the package's minimal stage: one series, one chip, three beats. In `slides.md`, the slide's stanza carries `clicks: 2`, which is the stage's beat count minus one.

## Add a slide

1. Add a stage component under `components/`, written with `useStage` from `slidev-addon-decks/story` ([Beats and the story timeline](/docs/concepts/beats-and-the-story-timeline/)).
2. Add a page under `pages/` that places it, and a stanza in `slides.md` with its `src:` and `clicks:`.
3. Put its figures in a `data/` module and record their sources in `data-sources.md`.

Restart the dev server after adding a component file. Slidev builds its auto-import list at startup, so a new `.vue` renders as an empty slot until it does.

## Example decks

The repository ships these, built from `examples/`:

| Deck | What it shows |
| --- | --- |
| `examples/opendata-pitch` | A story deck: each slide one stage, with `data/` modules and `data-sources.md`. |
| `examples/agent-experience` | A conventional deck. It is the reference for slide prose and word counts. |
| `examples/od-templates` | Conventional slide layouts (cover, bullets, two columns, big stat, a full OpenChart spec, a story slide) in the alternate warm palette. |
| `examples/od-story-templates` | Story stage patterns: the minimal stage, bars, labelled cards, and a hand-off between slides. |
| `examples/tides` | The story deck in the player on the home page. |
