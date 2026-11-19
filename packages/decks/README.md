# @steamfield/decks

React slide decks for animated, data-driven talks, written in MDX and built with coding agents. A deck is a directory of MDX slides plus React components; `decks dev` serves it with live updates, presenter view and two-window sync (`--remote` adds a presenter page for an iPad, phone or second laptop on the same network), and `decks build` writes a static site. Slides are drawn on a 1920x1080 canvas that scales to any window, clicks step through motion inside a slide, and a story stage pins one visualization per slide and advances it in beats.

Requires Node 22.12 or later and React 19.

```sh
bun add @steamfield/decks react react-dom
bunx -p @steamfield/decks decks new talk --story
bunx -p @steamfield/decks decks dev talk
```

With npm, `npm i @steamfield/decks react react-dom` and `npx -p @steamfield/decks decks …`. The `-p` form matters: the bare `decks` name on npm is an unrelated package.

| Import | What it has |
| --- | --- |
| `@steamfield/decks` | Hooks (`useDeck`, `useSlide`), layouts, views, deck types |
| `@steamfield/decks/motion` | `Step`, `Steps`, `Stagger`, `TextReveal`, `Highlight`, `CountUp`, `Draw`, `Mark`, `Morph`, `Camera`, `ShapeMorph`, `CodeBlock`, `useTween`, `useTimeline`, and gsap with SplitText, MorphSVG, MotionPath, DrawSVG and CustomEase registered |
| `@steamfield/decks/kit` | The theme, story stages (`StoryStage`, `StoryCard`, `useStage`), Ink marks, `OpenChart`, `ChartSteps`, `Graph3D`, `Scene3D`, and `MotionTemplate` (26 fill-in motion graphics) |
| `@steamfield/decks/kit/styles.css` | The kit stylesheet and self-hosted Inter |
| `@steamfield/decks/node` | `defineDeck` for `deck.config.ts`, and the programmatic `dev` and `build` |

The `decks` command: `dev`, `build`, `new`, `check`, `lint`, `export` (PDF), `shot` (PNG), `film` (a contact sheet of one step's motion), `inspect` (content that leaves the canvas or clips its text), `hook` and `init`. `decks init` sets a project up for coding agents: it enables the Decks Claude Code plugin (skills, a deck-author agent and prose hooks) and copies the same skills to `.agents/skills/` for Codex.

The guide for this version is installed with the package in `node_modules/@steamfield/decks/docs/`; start with `docs/README.md`. Source, issues and the changelog: https://github.com/steamfield/decks.

Decks replaces `slidev-addon-decks`, a Slidev addon. A Slidev deck moves over by rewriting each `pages/NN-slug.md` as `slides/NN-slug.mdx` and each Vue component as a React one; `docs/migrating-from-slidev.md` has the mapping.

Apache-2.0.
