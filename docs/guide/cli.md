# The decks command

`decks dev` and `decks build` are in [getting-started.md](getting-started.md). This page covers the rest. Every command that takes a deck accepts an alias from `decks.json` or a directory, and a bare name that is neither resolves under `_config.decksDir` (default `decks/`).

## `decks new <alias> [dir] [--story] [--author "Name"] [--url example.com]`

Scaffolds a deck under `decksDir` and registers it in `decks.json`, keeping every other key in the file. `dir` defaults to the alias. Without `--story` you get a conventional deck: a cover and one three-point slide. With `--story` you get a story deck: a cover, a first stage built on `StoryStage`, `StoryCard` and `useStage`, a data module with a provenance comment, and a `data-sources.md` skeleton. `--url` writes a `theme.json` with the brand URL. The command refuses an alias that is already registered, an alias starting with `_`, a `dir` with a slash, or a directory that exists, and writes nothing in those cases.

## `decks check`

Checks the whole project and exits 1 if anything is wrong, one problem per line:

| Problem | Meaning |
| --- | --- |
| `unregistered: <dir>` | A directory under `decksDir` holds a `deck.config.ts` but has no `decks.json` entry. |
| `missing: <alias> -> <dir>` | An entry points at a directory with no `deck.config.ts`. |
| `alias collision` | An alias equals another deck's directory name. |
| `<alias>: <message>` | The deck's config failed to load. |
| `no slides: <alias>` | The deck has no visible slides (`dev` and `build` would refuse it). |
| `<alias>: slide name: <file>` | A slide file is not `NN-slug.mdx`, or two share a number. |
| `N error-level prose hit(s)` | `decks lint` finds error-level patterns. |

## `decks lint [alias...] [--stdin]`

Scans deck prose for AI-rhetoric patterns: MDX prose, JSX text and literal props in `slides/`, `components/` and `layers/`, and story-card `COPY` arrays. Code blocks are not scanned. Each hit prints as `file:line:col severity pattern-id text`; any error-level hit exits 1. With no aliases it lints every registered deck. `--stdin` lints MDX read from standard input. To keep a line a pattern flags on purpose, put `lint-allow: <pattern-id>` in a comment on that line (`{/* lint-allow: not-just-reveal */}` in JSX).

## `decks hook lint|prompt`

The agent hooks. `hook lint` reads a Claude Code PreToolUse payload or a Codex `apply_patch` payload on standard input and denies a write that adds an error-level pattern to deck prose. `hook prompt` adds the deck-writing reminder when a prompt asks to write or revise a deck. `decks init` and the Decks Claude Code plugin wire them up; you rarely run them by hand.

## `decks export <deck> [--out file.pdf] [--final]`

Builds the deck, opens its print view (`#/print`) in Chromium and writes a PDF with one page per click step of every visible slide, each settled. `--final` prints one page per slide at its last click. The default path is `<name>.pdf` beside the build directory (`dist/<name>.pdf` with the default `outDir`), so `decks build` never deletes it. It needs a Chromium for `playwright-core`; without one it exits 1 and prints `npx playwright install chromium`.

## `decks shot <deck> <slide> [clicks] [--out file.png] [--width 1920] [--height 1080]`

Builds the deck and captures one frame, settled, as a PNG (default `slide-<n>-c<clicks>.png`). Same browser requirement as `export`.

## `decks init [--force]`

Sets a project up for coding agents. It enables the Decks Claude Code plugin in `.claude/settings.json`, pinned to the installed version, copies the plugin's skills to `.agents/skills/` for Codex, and adds a Decks section to `AGENTS.md`. It keeps your other settings and never overwrites a skill file or the `AGENTS.md` section you edited since the last run unless `--force` is given. Each collaborator then runs, once:

```sh
claude plugin install decks@steamfield --scope project
```

## Share image

`decks build` writes `og.png` (slide 1 at 1200x630) into the build when the deck has no `public/og.png`, so link previews show the cover. Without a Chromium the build prints one warning and skips it.
