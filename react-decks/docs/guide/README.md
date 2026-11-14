# react-decks guide

react-decks is a React slide framework. A deck is a directory of MDX files, one per slide, plus optional React components, styles and a config file. The `decks` command serves it with live updates or builds it into a static site. Slides are drawn on a 1920x1080 design canvas that scales to the window, clicks reveal steps inside a slide, and a presenter window with notes follows the audience window. The framework is five packages: `@react-decks/node` (the CLI and config), `@react-decks/runtime` (hooks, layouts, views), `@react-decks/motion` (steps, timelines, code blocks), `@react-decks/kit` (theme, story stages, charts) and `@react-decks/core` (pure logic the others share). The packages are private and their names are not final.

Each page stands alone. Read the one that answers your question.

| Page | Question it answers |
| --- | --- |
| [getting-started.md](getting-started.md) | What files make a deck, how do I run and build one, and how are decks registered? |
| [slides.md](slides.md) | How do I write a slide: frontmatter, notes, components, layouts, `useDeck()` and `useSlide()`? |
| [canvas.md](canvas.md) | How big is a slide, how does it fit the window, and how do I size text and lay out for screens that are not 16:9? |
| [motion.md](motion.md) | How do clicks work, which motion components and hooks exist, and how do slide transitions and `Morph` work? |
| [code-blocks.md](code-blocks.md) | How do I show highlighted code and step through lines? |
| [config.md](config.md) | What can `deck.config.ts` set, how do I add MDX plugins, layers or a setup file, and how are errors reported? |
| [presenting.md](presenting.md) | Which keys do what, and how do the presenter window, overview, sync and text sizing behave? |
| [kit.md](kit.md) | What does `@react-decks/kit` provide: theme, story stages, `OpenChart`, the `story` transition? |

## Not built yet

These are planned or mentioned in the design document, and do not exist in the code. Do not write a deck that depends on them.

- Any `decks` command other than `dev` and `build`: `new`, `export`, `check`, `lint`, `list`, `shot`, `snap`, `film`, `motion-check`, `init`.
- PDF export and a print view. The `#/print` URL and the `print` render context are reserved, and `#/print` shows the play view today.
- `defineTheme` and theme packages. A deck themes itself with CSS, and with the kit's `theme.json` when it uses the kit.
- Tailwind scaffolding. A deck can add Vite plugins through the `vite` option, and nothing sets Tailwind up for it.
- Pinch zoom and pan in the viewer.
- The embed message protocol. `?embedded` only turns off sync and the presenter key.
- Most of the kit beyond the exports listed in [kit.md](kit.md): the `Ink*` and `Unit*` marks, `Graph3D`, `CodeInk`, `RowStrip` and the conventional slide chrome have not been ported.
- A published npm package. Imports in this guide use the current workspace names (`@react-decks/*`).
