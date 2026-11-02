# Decks

A Slidev addon and deck runner for data-storytelling presentations: a story
engine (beats, ink marks, cross-slide hand-offs), an OpenChart wrapper, layout
CSS, and screenshot/visual-regression tooling.

Work in progress. Full docs come later; for now:

```bash
bun install
bun run list            # registered decks (decks.json)
bun run dev pitch       # dev server for an example deck
bun run test            # guard tests
bun run new my-talk my-talk --story   # scaffold into decks/
```

Licensed under Apache-2.0.
