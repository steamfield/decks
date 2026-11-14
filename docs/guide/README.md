# react-decks guide

react-decks is a React slide framework. A deck is a directory of MDX files, one per slide, plus optional React components, styles and a config file. The `decks` command serves it with live updates or builds it into a static site. Slides are drawn on a 1920x1080 design canvas that scales to the window, clicks reveal steps inside a slide, and a presenter window with notes follows the audience window. Install `@steamfield/decks` with `bun add @steamfield/decks react react-dom` on Node 22.12 or later. Its import paths are `@steamfield/decks` (hooks, layouts, views and core types), `@steamfield/decks/motion` (steps, timelines, code blocks), `@steamfield/decks/kit` (theme, story stages, charts) and `@steamfield/decks/node` (the CLI and config).

Each page stands alone. Read the one that answers your question.

| Page | Question it answers |
| --- | --- |
| [getting-started.md](getting-started.md) | What files make a deck, how do I run and build one, and how are decks registered? |
| [slides.md](slides.md) | How do I write a slide: frontmatter, notes, components, layouts, `useDeck()` and `useSlide()`? |
| [canvas.md](canvas.md) | How big is a slide, how does it fit the window, and how do I size text and lay out for screens that are not 16:9? |
| [motion.md](motion.md) | How do clicks work, which motion components and hooks exist, and how do slide transitions and `Morph` work? |
| [code-blocks.md](code-blocks.md) | How do I show highlighted code and step through lines? |
| [config.md](config.md) | What can `deck.config.ts` set, how do I add MDX plugins, layers or a setup file, and how are errors reported? |
| [cli.md](cli.md) | What do `decks new`, `check`, `lint`, `hook`, `export`, `shot` and `init` do? |
| [migrating-from-slidev.md](migrating-from-slidev.md) | How do I move a deck from `slidev-addon-decks`? |
| [presenting.md](presenting.md) | Which keys do what, and how do the presenter window, overview, sync and text sizing behave? |
| [kit.md](kit.md) | What does `@steamfield/decks/kit` provide: theme, story stages, `OpenChart`, the `story` transition? |

## Not built yet

These are mentioned in the design document and do not exist in the code. Do not write a deck that depends on them.

- `decks list`, `snap`, `film` and `motion-check`.
- `defineTheme` and theme packages. A deck themes itself with CSS, and with the kit's `theme.json` when it uses the kit.
- Tailwind scaffolding. A deck can add Vite plugins through the `vite` option, and nothing sets Tailwind up for it.
- Pinch zoom and pan in the viewer.
- A print page size other than the 1920x1080 canvas: `decks export` prints every deck at that size.
