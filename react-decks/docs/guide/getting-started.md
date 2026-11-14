# Getting started

A deck is a directory with a `deck.config.ts` and a `slides/` folder. Run it with `decks dev <deck>` and build it with `decks build <deck>`.

## What a deck directory contains

```
my-deck/
  deck.config.ts        required: export default defineDeck({ title: "..." })
  package.json          the deck's dependencies
  slides/01-cover.mdx   required: one .mdx file per slide
  slides/02-point.mdx
  components/*.tsx      optional: components every slide can use without importing
  layers/above.tsx      optional: drawn over every slide
  layers/below.tsx      optional: drawn under every slide
  layers/credit.tsx     optional: replaces the built-in credit
  setup.ts              optional: runs once before the deck mounts
  styles/index.css      optional: loaded once, after the framework's styles
  public/               optional: static files served at the site root
```

There is no `index.html` and no slide list to maintain. The framework generates both.

| Path | Rules |
| --- | --- |
| `deck.config.ts` | Must have a default export. See [config.md](config.md). |
| `slides/*.mdx` | Only `.mdx` files directly under `slides/` are slides. Subdirectories and `.md` files are ignored. |
| `components/*.tsx` | Only `.tsx` files directly under `components/` are scanned. Each named export is available in every slide under its name, and a default export under the file's basename. See [slides.md](slides.md). |
| `layers/` | Only `above.tsx`, `below.tsx` and `credit.tsx` are allowed. Any other `.tsx` file there is an error. See [config.md](config.md). |
| `setup.ts` | Imported for its side effects before any component module. A deck that uses the kit installs its theme here. |
| `styles/index.css` | The one stylesheet the framework loads for you. Import others from it. |
| `public/` | Vite's public directory. `public/field.svg` is served as `field.svg`. `public/favicon.svg`, `.png` or `.ico` is used as the page icon (the Decks mark otherwise), and `public/og.png` or `og.jpg` as the link preview image when `url` is set. |

Other files and folders (`data/`, `scene/`, a `theme.json`) are yours. Import them from components or slides.

A deck's `package.json` depends on the packages it imports. From `examples/basic/package.json`:

```json
{
  "dependencies": {
    "@react-decks/motion": "workspace:*",
    "@react-decks/runtime": "workspace:*",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@react-decks/node": "workspace:*"
  }
}
```

Add `@react-decks/kit` when the deck uses it.

## How slide order works

Slides are sorted by filename, compared as plain strings, so number them with a fixed width: `01-cover.mdx`, `02-steps.mdx`, `10-end.mdx`. To reorder, rename.

A slide's id is its filename without `.mdx` (`02-steps`). Its number is its 1-based position among visible slides. A slide with `hide: true` in its frontmatter is dropped before numbering, so the slides after it move up by one.

## Commands

The packages are not published, so inside the `react-decks/` workspace the command is a script: `bun run decks <command>`. The `@react-decks/node` package declares the same program as the bin `decks`. Run it from the directory that holds `decks.json`.

```bash
bun run decks dev basic
bun run decks build basic
```

### `decks dev <deck> [--port <n>] [--open]`

Serves the deck with live updates and prints its URL.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--port <n>` | first free port from 3030 up | A whole number from 0 to 65535. An explicit port is strict: if it is taken the command fails instead of moving to another. `0` lets the OS pick. |
| `--open` | off | Open the deck in a browser. |

What an edit does while `dev` runs:

| Change | Result |
| --- | --- |
| A slide's body | That slide hot-updates. If the edit changes the slide's counted click total, the page reloads. |
| A slide's frontmatter; a slide added, removed or renamed | The page reloads. Slide and click are in the URL, so the position survives. |
| A component file edited | Hot update. If the edit changes which names the file exports, the page reloads. |
| A file added to or removed from `components/` or `layers/` | The page reloads. |
| `setup.ts` | The page reloads. |
| `deck.config.ts` | The server restarts. An invalid config keeps serving the last valid one and shows the error. |

### `decks build <deck> [--out <dir>] [--base <path>]`

Writes a static site. Navigation uses the URL hash, so the output needs no server rewrites.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--out <dir>` | `dist/{name}`, or `_config.outDir` from `decks.json` | Output directory. `{name}` is replaced with the deck's name. |
| `--base <path>` | `./`, or `_config.base` from `decks.json` | Base URL of the built site. The default `./` works from any path. |

`build` empties the output directory first, so it refuses to run when `--out`:

- is the deck directory or the working directory, or contains either;
- exists, is not empty, and was not written by `decks build`;
- is a file, a dangling symlink, or not writable.

For a build, set the base with `--base` or `_config.base`. A `base` inside the deck's `vite` option is overridden by them.

`decks`, `decks dev --help` and `decks build --help` print usage. An unknown command or option is an error.

## How decks are registered

`<deck>` is either an alias from `decks.json` in the working directory, or a path to a deck directory.

```json
{
  "_config": {
    "outDir": "dist/{name}",
    "base": "./"
  },
  "basic": { "dir": "examples/basic" },
  "motion": { "dir": "examples/motion" }
}
```

- Each key that does not start with `_` is an alias. Its `dir` is resolved against the working directory.
- `_config.outDir` and `_config.base` are the defaults for `decks build`. Both are optional.
- With no `decks.json`, or for a deck that is not in it, pass the directory: `decks dev ./my-deck`.

The deck's name is the alias, or the directory's basename when you pass a path. The name fills `{name}` in the output path and is part of the channel that syncs a deck's windows, so two decks served from one origin do not drive each other.

## A minimal working deck

Four files. Register the directory in `decks.json` or pass its path.

`deck.config.ts`:

```ts
import { defineDeck } from "@react-decks/node";

export default defineDeck({
  title: "My deck",
});
```

`slides/01-cover.mdx`:

```mdx
---
title: Cover
---

<h1>My deck</h1>

<p>Press the right arrow.</p>

<Notes>
Welcome everyone.
</Notes>
```

`slides/02-points.mdx`:

```mdx
---
title: Three points
---

<h1>Three points</h1>

<Steps from={1}>

1. Frame the question.
2. Show the evidence.
3. Say what to do next.

</Steps>
```

`styles/index.css`:

```css
:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: #0b0d12;
  color: #f2f4f8;
  font-family: system-ui, sans-serif;
}

[data-deck-slide] {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 96px 120px;
  font-size: calc(40px * var(--deck-text-scale, 1));
}

h1 {
  margin: 0 0 48px;
  font-size: calc(96px * var(--deck-text-scale, 1));
}
```

The framework ships no CSS reset and no typography, so the stylesheet sets the page background, the slide padding and the type sizes. Sizes are in canvas pixels (the slide is 1920x1080 before scaling), and every `font-size` is multiplied by `--deck-text-scale`; [canvas.md](canvas.md) explains both.

`<Steps>` and `<Notes>` need no import. The second slide has three clicks, counted from the list, so there is no `clicks:` line to maintain.

Working decks to copy from: `examples/basic` (the smallest), `examples/motion` (one slide per motion component, transition and layout), `examples/tides-slide` and `examples/building-for-agents` (story decks on the kit).
