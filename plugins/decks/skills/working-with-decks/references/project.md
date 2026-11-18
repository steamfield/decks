# Project layout and commands

Read the installed guide's getting-started, configuration and slide-authoring pages for details. A deck has:

```text
my-deck/
  deck.config.ts
  slides/01-cover.mdx
  slides/02-first-point.mdx
  components/FirstStage.tsx
  setup.ts
  styles/index.css
  public/
  data/
  data-sources.md
  theme.json
```

Only the config and slides are required by the framework. `data/`, `data-sources.md` and `theme.json` are authoring conventions. The story scaffold provides the first two.

- Slides are direct `slides/*.mdx` files, sorted by filename as strings. Use `NN-slug.mdx`. `decks check` expects unique two-digit prefixes and lowercase hyphenated slugs. Gaps are fine. A slide id is its basename without the extension; its number is its 1-based visible position.
- `hide: true` removes a slide before numbering. Keep its evidence so it can be restored safely.
- `components/*.tsx` direct children expose named exports to all MDX slides; default exports use the filename. Duplicate names and `export *` are errors. Helpers can be `.ts` or live outside this discovery folder.
- `Step`, `Steps`, `Stagger`, `TextReveal`, `Highlight`, `CountUp`, `Draw`, `Morph`, `Mark`, `Camera`, `ShapeMorph`, `Center`, `Cover`, `Section`, `TwoCol`, `ImageSide`, `Toc`, `Link` and `Notes` are available in MDX without imports. Kit components require an explicit import or named re-export from `components/`; a re-exported `ChartSteps` or `MotionTemplate` still adds its clicks to the slide.
- `styles/index.css` loads after framework styles. Import the kit stylesheet first when using the kit: `@import "@steamfield/decks/kit/styles.css";`.
- `setup.ts` runs in the browser before component modules. Install the kit theme there with `installTheme(resolveTheme())`, imported from `@steamfield/decks/kit`. For an override, import `./theme.json` and pass it to `resolveTheme`.
- `public/` contains assets served at the site root. Only `above.tsx`, `below.tsx` and `credit.tsx` are allowed as React layers under `layers/`; each default-exports a component. They render per slide instance.

## Presenting controls

Move the pointer to the bottom-left corner of the play view to reveal the control tray, or Tab to its buttons. It holds Previous, Next, the slide counter (opens go-to), Overview, Open presenter, fullscreen when supported, and smaller/larger text. The tray is absent in embedded and bridge decks and other views. Use `f` for fullscreen, `o` for overview, `p` for the presenter window, and `g` for go-to. Cmd/Ctrl `+` and `-` change text size; Cmd/Ctrl `0` resets it.

Run `decks dev <deck> --remote` to read notes and control the deck from an iPad or second laptop. Connect both devices to the same network, open the deck on the presenting laptop, then scan the QR code or open the URL printed in its terminal on the second device. The remote shows the current notes, next slide title and talk timer.

## Public import roots

| Import | Use |
| --- | --- |
| `@steamfield/decks` | React runtime hooks and layouts, including `useSlide`, `useDeck`, `useSlideScale` |
| `@steamfield/decks/motion` | Motion components, `useTween`, `useTimeline`, tokens and the registered `gsap` instance |
| `@steamfield/decks/kit` | Theme, story stages, Ink marks and slide-aware `OpenChart` |
| `@steamfield/decks/node` | `defineDeck` for `deck.config.ts`; tooling belongs outside browser components |

Do not import the node entry into a slide. No automatic utility CSS framework is installed. Use ordinary CSS, CSS Modules, or the kit's documented classes.

## CLI

Use `decks <command> --help` to confirm the installed version's flags.

| Command | Behavior |
| --- | --- |
| `decks new <alias> [dir] [--story] [--author "Name"] [--url example.com]` | Scaffold a conventional or story deck under `_config.decksDir` (default `decks/`) and register it in `decks.json`. `dir` is a bare directory name. Existing aliases/directories are refused. |
| `decks dev <deck> [--port N] [--open] [--remote] [--remote-port N] [--live-term]` | Serve with live updates; default first free port at or above 3030. Explicit ports are strict; `0` asks the OS. `--remote` also serves a token-protected presenter page on the local network (see Presenting controls). `--live-term` runs `LiveTerm` panes in a real shell. |
| `decks check` | Check registered configs, slide names/counts, alias collisions, unregistered decks under `decksDir`, and error-level prose. Register a path-only deck if you need this command to cover it. |
| `decks lint [deck ...]` | Report prose errors and warnings; defaults to every registered deck. Error hits fail. |
| `decks lint --stdin` | Lint MDX from stdin, without deck arguments. |
| `decks build <deck> [--out dir] [--base path]` | Build a static site; default output `dist/{name}`, base `./`, overridable by registry defaults. Output is emptied, with protections against unrelated directories. |
| `decks shot <deck> <slide> [clicks] [--out file.png] [--width N] [--height N]` | Build and capture one settled frame with instant motion. Defaults: click 0, 1920x1080, `slide-<slide>-c<clicks>.png`. Owns its browser and preview server. |
| `decks export <deck> [--out file.pdf] [--final]` | Build and export all click states to PDF; `--final` exports only each slide's final click. Default PDF is `<outDir>/<name>.pdf`, using the registry output default. |
| `decks inspect <deck> [--width N] [--height N]` | Build and open each visible slide at its last click. Report elements outside the canvas and boxes that clip their own text; exit 1 when there are any. An ancestor with `overflow: clip` marks a deliberate crop. |
| `decks film <deck> <slide> [click] [--frames 6] [--out film.png] [--width 1280] [--height 720]` | Write a PNG contact sheet of the motion into one click, on virtual time. Click 0 films the transition from the previous slide. `--frames` takes 2 to 24. |
| `decks init [--force]` | Enable the Decks Claude Code plugin, copy the skills to `.agents/skills/` and add a Decks section to `AGENTS.md`. |

Screenshot, film, inspect and PDF commands use Chromium. If the CLI reports it missing, follow its instruction: `npx playwright install chromium`. A capture failure is a failed verification, not a successful export. Build also generates an `og.png` preview from the first slide when `public/og.png` is absent; missing Chromium skips that preview with a warning rather than failing the build.

Edits hot-update or reload as needed: adding a component or changing exports reloads; editing config restarts the server. Do not prescribe manual restarts after every new component.

`decks check` and lint do not prove that a deck compiles or fits on screen. Build and inspect rendered frames too. There is no figure extractor or automatic fact-check command; use `decks:deck-data`.
