# Configuration

A deck is configured by `deck.config.ts` at its root. It must default-export an object; `defineDeck` gives it types.

```ts
import { defineDeck } from "@steamfield/decks/node";

export default defineDeck({
  title: "Building for agents",
  author: "Riley Hilliard",
  transition: "story",
});
```

Only `title` is required. An unknown key is an error that lists the known ones. Editing the file while `decks dev` runs restarts the server and the page comes back at the same slide and click.

## Options

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `title` | `string` | required | The page title. |
| `author` | `string` | none | Written to `<meta name="author">`. |
| `info` | `string` | none | One line about the deck. It becomes the page's `description` and the text of a shared link's preview. |
| `url` | `string` (a URL) | none | Where the built deck is published. Adds `og:url`, and with `public/og.png` or `og.jpg` in the deck an absolute `og:image` for link previews. |
| `canvas` | `{ width: number; height: number }` | `{ width: 1920, height: 1080 }` | The design canvas in pixels. Both must be positive. |
| `transition` | `string` | none (slides fade) | Default slide transition: `cut`, `fade`, `push`, `zoom`, or a name your CSS defines. Must not be empty. |
| `htmlAttrs` | `Record<string, string>` | none | Attributes set on `<html>`. Each key must be a valid HTML attribute name. |
| `credit` | `boolean` | `true` | The "Created with Decks" credit on every slide. `false` removes it. |
| `vite` | Vite `UserConfig` | none | Merged into the framework's Vite config. `vite.plugins` are added after the framework's. |
| `mdx` | `{ remarkPlugins?: PluggableList; rehypePlugins?: PluggableList }` | none | Plugins added to the slide compiler. Each key, when present, must be an array. |
| `term` | `{ dirs?: Record<string, string> }` | none | Working directories a `LiveTerm` pane can start in, by key, relative to the deck. Each must exist when `decks dev --live-term` starts. See [terminal.md](terminal.md). |

Examples of each:

```ts
import { defineDeck } from "@steamfield/decks/node";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default defineDeck({
  title: "Tides",
  author: "Riley Hilliard",
  info: "Why the sea rises twice a day.",
  canvas: { width: 1920, height: 1200 },
  transition: "push",
  htmlAttrs: { lang: "en", "data-theme": "night" },
  credit: false,
  vite: {
    optimizeDeps: { include: ["three"] },
  },
  mdx: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```

Notes on individual options:

- `canvas` changes the size every slide is designed for. See [canvas.md](canvas.md).
- `transition` is the fallback for every slide boundary; a slide's frontmatter `transition` overrides it. See [motion.md](motion.md).
- `vite`: the framework sets the Vite root to the deck directory and the public directory to `public/`. For `decks build`, the base comes from `--base` or `decks.json`, which override a `base` set here. A package imported directly in a slide's MDX (not through a component) can cost one page reload the first time the dev server sees it; import packages from components, or list them under `vite.optimizeDeps.include`.

## MDX plugins

Add remark and rehype plugins under `mdx` to extend slide markdown: math, diagrams, your own syntax.

```ts
mdx: {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
}
```

- Your remark plugins run after the framework's (frontmatter, notes removal).
- Your rehype plugins run before the framework's code highlighting, so a plugin can claim a code element first and the highlighter handles what is still a code block.
- The static click count and the notes extraction parse slides with your remark plugins attached, so syntax they add still parses. Their transforms do not run there: a plugin that generates step components adds no clicks, and such a slide sets `clicks:` in its frontmatter.
- A plugin that throws while compiling a slide is reported as that slide's compile error.

Install the plugins as dependencies of the deck. A plugin's stylesheet (KaTeX's, for example) is yours to import from `styles/index.css`.

## Layers

A layer is a component drawn on every slide: a logo, a progress bar, a footer, a background. A deck provides up to three, each the default export of its file.

| File | Drawn |
| --- | --- |
| `layers/above.tsx` | Over the slide's content. |
| `layers/below.tsx` | Under the slide's content. |
| `layers/credit.tsx` | In place of the built-in credit. |

Any other `.tsx` file under `layers/` is an error.

`examples/motion/layers/above.tsx`:

```tsx
import { useDeck, useSlide } from "@steamfield/decks";

export default function Above() {
  const { no } = useSlide();
  const { total } = useDeck();
  return (
    <footer className="gallery-progress">
      <span>Motion / field notes</span>
      <output aria-label="Slide number">
        {no} / {total}
      </output>
    </footer>
  );
}
```

How layers behave:

- A layer is rendered inside each slide, so `useSlide()` and `useDeck()` work in it, and it is correct in every render context: an overview tile's layer shows that tile's slide number. It also means a layer follows the rules for slide components in [slides.md](slides.md): several instances exist at once.
- Each layer's wrapper fills the slide and takes no pointer events. Turn them back on for a child that needs them (`pointer-events: auto`).
- The above layer holds still while slides transition under it. The below layer moves with its slide, like any background.
- A slide opts out with frontmatter: `layers: false` shows neither, `layers: "above"` or `layers: "below"` keeps only that one.
- For CSS, the wrappers carry `data-deck-layer="above"`, `"below"` or `"credit"`.

### The credit

By default every slide shows "Created with Decks", with the Decks mark and a link, at the lower right, in the slide's text color. It sits in a band along the bottom edge whose height is the CSS variable `--deck-credit-space`; the built-in layouts and the kit keep content above the band.

| To | Do |
| --- | --- |
| Remove it | Set `credit: false` in `deck.config.ts`. `--deck-credit-space` becomes `0px`. |
| Replace it | Add `layers/credit.tsx` with a default-exported component. It is rendered in the credit's wrapper, which fills the slide, so position it yourself. |

`credit: false` wins over a `layers/credit.tsx`. Frontmatter `layers` does not affect the credit. An above layer is drawn over it.

## `setup.ts`

A deck may have a `setup.ts` beside `deck.config.ts`. It is imported for its side effects first, before any component module is evaluated and before the deck mounts, so a component can rely on what it set up, even at module level. Editing it reloads the page.

A deck that uses the kit installs its theme there. `examples/building-for-agents/setup.ts`:

```ts
import { installTheme, resolveTheme } from "@steamfield/decks/kit";
import deckTheme from "./theme.json";

installTheme(resolveTheme(deckTheme));
```

It runs in the browser, not in Node. See [kit.md](kit.md) for the theme.

## How errors are reported

A mistake in a deck is reported once, as a short message that names the file, the value and what to do, without a stack trace:

```
<file>[:line:col]: <what is wrong>. <what to do>
```

| Mistake | Message |
| --- | --- |
| Config lacks `title` | `deck.config.ts: title is required (a string).` |
| Unknown config key | `deck.config.ts: unknown key "titel". Known keys: title, author, ...` |
| Wrong type | `deck.config.ts: canvas.width must be a number, got "1920".` |
| No default export | `deck.config.ts has no default export. Write: export default defineDeck({ title: "..." })` |
| No config file | `no deck.config.ts in <dir>. A deck directory holds deck.config.ts and slides/.` |
| Unknown deck | `"aa" is not a registered deck or a directory. Registered in decks.json: basic, motion.` |
| Bad frontmatter | `slides/03-x.mdx: frontmatter clicks must be a whole number 0 or greater, got "two".` |
| No slides | `no slides/*.mdx files in <dir>.` |
| Uncountable step | `slides/03-x.mdx:7:1: <Step at={n}>: at must be a literal whole number (at={2}). To compute it, set clicks: in the frontmatter.` |
| Undefined component | `slides/03-x.mdx:3:1: <Nonexistent> is not defined. Export it from a file in components/ or import it in the slide.` |
| Port in use | `decks dev: port 3040 is already in use. Stop what is using it or pass a different --port.` |

Where a message appears:

- Before a server exists, and for `decks build`: `decks <command>: <message>` on stderr, exit code 1.
- While `decks dev` runs: one line in the terminal and the same message in the browser's error overlay, with the file and position.
- A failure about the deck as a whole (frontmatter, step counts, a component file, `layers/`) stays reported until it is fixed, and the terminal then prints `<file>: fixed`.
- A slide that fails to compile affects only that slide. Its neighbours keep working.
- An invalid `deck.config.ts` during a session prints `deck.config.ts is invalid, still serving the last valid config:` and keeps the overlay up until the file is valid again.

In the browser:

- A slide that throws while rendering shows `Slide <id> (<file>) failed to render: <message>` in place of that slide only, with the component stack in dev. The rest of the deck keeps working, and in dev the next successful hot update reloads the page.
- A slide whose module failed to load shows `Slide <id> failed to load. See the terminal or the error overlay.`
- A failure while starting the deck (a component file that throws at import) writes `The deck failed to start: <message>` into the page.
- `useSlide()` and `useDeck()` called outside a slide or a deck throw a message that names the hook and the remedy.

Anything that is not an author mistake keeps its stack trace and ends with `This is a bug in react-decks.`
