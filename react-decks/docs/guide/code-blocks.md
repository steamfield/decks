# Code blocks

Write a fenced code block in a slide and it is syntax-highlighted at compile time. Options after the language add a title, line numbers, a maximum height, and line emphasis that steps with clicks.

````mdx
---
title: Types make the boundary readable.
---

# Types make the boundary readable.

```ts {3-6} at=1 lines=10 title="session.ts"
type Session = { name: string; role: "speaker" | "guest" };

export function welcome(session: Session) {
  const greeting = `Welcome, ${session.name}`;
  return session.role === "speaker" ? `${greeting}. You're on.` : greeting;
}
```
````

That is `examples/motion/slides/24-code.mdx`: lines 3 to 6 are emphasized from click 1, numbering starts at 10, and the block is captioned `session.ts`.

## Info-string options

Options go on the opening fence after the language, separated by spaces, in any order. Each may appear once.

| Option | Meaning |
| --- | --- |
| `{...}` | Lines to emphasize, in steps. See below. |
| `at=<n>` | The click at which the first step shows. A whole number, default 0. |
| `lines` | Show line numbers starting at 1. |
| `lines=<n>` | Show line numbers starting at `n` (1 or greater). |
| `title="..."` | A caption above the block, usually a filename. The text cannot contain a double quote. |
| `maxHeight=<n>` | Maximum height in canvas pixels (1 or greater). A taller block scrolls, and the emphasized lines are kept in view. |

An option that does not parse is a compile error naming the file and the option: an unknown key, a repeated key, a reversed range such as `5-2`, a line number past the end of the block, or a value that is not a whole number.

## Line emphasis

Inside the braces, commas separate lines and ranges, and `|` separates steps. Write it without spaces.

| Written | Meaning |
| --- | --- |
| `{3}` | One step: line 3. |
| `{2,4-5}` | One step: lines 2, 4 and 5. |
| `{2\|4-5\|all}` | Three steps: line 2, then lines 4 and 5, then every line. |
| `all` | Every line emphasized. |
| `none` | Every line dimmed. |

Line numbers in the braces count from 1 within the block, whatever `lines=<n>` says.

While a step is in force its lines are at full strength and the others are dimmed. Before click `at`, nothing is emphasized and nothing is dimmed. Each `|` is one more click, and the last step stays in force for any later click. Going back a click reverses it.

`examples/motion/slides/25-code-steps.mdx`:

````mdx
```ts {2|4-5|all} lines title="store.ts" maxHeight=500
export function createStore() {
  let count = 0;

  const increment = () => count++;
  const read = () => count;

  return { increment, read };
}
```
````

At click 0 line 2 is emphasized, at click 1 lines 4 and 5, at click 2 every line.

A block with `k` steps adds `at + k - 1` to the slide's click total, so the slide above has two clicks with no `clicks:` in its frontmatter. A block without braces uses no clicks. See [motion.md](motion.md) for how the total is counted.

## Languages

The language is the first word on the fence. Any language Shiki bundles works. A block with no language is plain text. An unknown language is rendered as plain text and logs a warning naming the file.

Inline code (single backticks) is not highlighted.

## Colors and type

No theme is baked in. Tokens are colored through CSS variables with dark defaults; override them in the deck's `styles/index.css`.

| Variable | Colors |
| --- | --- |
| `--deck-code-background` | The block's background. |
| `--deck-code-foreground` | Plain text and parameters. |
| `--deck-code-keyword` | Keywords. |
| `--deck-code-string` | Strings and links. |
| `--deck-code-comment` | Comments. |
| `--deck-code-constant` | Constants. |
| `--deck-code-function` | Function names. |
| `--deck-code-punctuation` | Punctuation. |
| `--deck-code-caption` | The title and the line numbers. |
| `--deck-code-dim` | Opacity of a dimmed line. A number, default `0.35`. |

```css
:root {
  --deck-code-background: #1c1029;
  --deck-code-keyword: #ff86b5;
  --deck-code-dim: 0.25;
}
```

Code is set in the system monospace font at 32px with a line height of 1.6, and the title at 24px. Both follow the viewer's text scale. The framework's styles are in the CSS layer `react-decks`, so any rule in the deck's own stylesheet overrides them:

```css
[data-deck-slide] pre code {
  font-family: "JetBrains Mono Variable", ui-monospace, monospace;
  font-size: calc(28px * var(--deck-text-scale, 1));
}
```

For CSS and tests, each line is a `span` with `data-line="<number>"`, and `data-line-state="active"` or `"dim"` while a step is in force. A numbered line also has `data-line-number`.

## `CodeBlock`

`CodeBlock`, exported by `@react-decks/motion`, is the component a fenced block renders as. The framework maps the `pre` element to it for every slide. You do not write it by hand: its input is the highlighted markup and `data-*` attributes the compiler produces, not a string of code.

What it does:

- Renders a `figure` with an optional `figcaption` (the title) and the `pre`.
- Reads the slide's click from `useSlide()` and marks each line active or dim.
- With `maxHeight`, scrolls the block itself (never the page) so the first emphasized line of the step is in view.
- Makes a block that scrolls focusable, so it can be reached by keyboard.
- Outside the play view, changes lines with no transition.

Limits to know about:

- Arrow keys navigate the deck even while a scrolling block has focus.
- With `maxHeight`, only the first emphasized line of a step is guaranteed to be visible.
- A code block inside `<Notes>` is not highlighted and adds no clicks.
