# Decks guide

Decks is a React slide framework. A deck is a directory of MDX files, one per slide, plus optional React components, styles and a config file. The `decks` command serves it with live updates or builds it into a static site. Slides are drawn on a 1920x1080 design canvas that scales to the window, clicks reveal steps inside a slide, and a presenter window with notes follows the audience window. Install `@steamfield/decks` with `bun add @steamfield/decks react react-dom` on Node 22.12 or later. Its import paths are `@steamfield/decks` (hooks, layouts, views and core types), `@steamfield/decks/motion` (steps, timelines, code blocks), `@steamfield/decks/kit` (theme, story stages, charts) and `@steamfield/decks/node` (the CLI and config).

Each page stands alone. Read the one that answers your question.

| Page | Question it answers |
| --- | --- |
| [getting-started.md](getting-started.md) | What files make a deck, how do I run and build one, and how are decks registered? |
| [slides.md](slides.md) | How do I write a slide: frontmatter, notes, components, layouts, `useDeck()` and `useSlide()`? |
| [canvas.md](canvas.md) | How big is a slide, how does it fit the window, and how do I size text and lay out for screens that are not 16:9? |
| [motion.md](motion.md) | How do clicks work, which motion components and hooks exist, how do slide transitions, `Morph`, `Camera` and `ShapeMorph` work, and how do I write custom motion graphics with gsap? |
| [motion-templates.md](motion-templates.md) | Which ready-made motion graphics can I fill in (titles, stats, timelines, quotes, section breaks), and where in a talk does one fit? |
| [code-blocks.md](code-blocks.md) | How do I show highlighted code and step through lines? |
| [config.md](config.md) | What can `deck.config.ts` set, how do I add MDX plugins, layers or a setup file, and how are errors reported? |
| [cli.md](cli.md) | What do `decks new`, `check`, `lint`, `hook`, `export`, `shot`, `film`, `inspect` and `init` do? |
| [presenting.md](presenting.md) | Which keys do what, how do the presenter window, overview, sync and text sizing behave, and how do I present from an iPad or second laptop? |
| [terminal.md](terminal.md) | How do I run real commands in a terminal pane on a slide, and what does the deck show when it can't? |
| [kit.md](kit.md) | What does `@steamfield/decks/kit` provide: theme, story stages, `OpenChart`, `ChartSteps`, `Scene3D`, the `story` transition? |
