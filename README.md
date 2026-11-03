# Decks

Decks is a framework for data-driven presentations built on [Slidev](https://sli.dev). It ships as one npm package, `slidev-addon-decks`, with a `decks` command. `decks init` installs the Claude Code setup used to write decks, and this repo adds example decks.

The package contains:

- **Story engine** (`slidev-addon-decks/story`). A story slide pins one visualization to the slide and advances it in beats on the arrow keys. The beat timeline is a function of Slidev's click count, so stepping backward replays the transition in reverse. Prose sits in a floating card whose copy changes per beat, and a visual can carry over from one slide to the next.
- **Ink marks.** Vue components that draw onto the stage: `InkLine`, `InkBars`, `InkChip`, `InkRule`, `InkNumber`, `InkTimeline` and a few more. They use a clean stroked style by default and switch to a hand-drawn marker style with one setting.
- **OpenChart wrapper.** `<OpenChart :spec="..." />` renders an [OpenChart](https://github.com/tryopendata/openchart) spec sized for the 1920x1080 slide canvas, with a shared chart theme and entrance animation. `Graph3D` adds the WebGL network graph.
- **Layout CSS and slide chrome.** Cover, footer, eyebrow, byline, QR card, plus layout classes for bullets, two columns, big stats and full-bleed charts.
- **Viewer.** In the audience view, `Cmd/Ctrl +` and `-` resize the text, a trackpad pinch zooms the slide, and `Cmd/Ctrl 0` resets both. Presenter, overview and PDF export are not affected.
- **Runner.** `decks` scaffolds, runs, builds, exports, lints, screenshots and fact-extracts decks from a `decks.json` registry, and installs the agent setup with `decks init`.
- **Embed control.** A built deck inside a same-origin iframe takes `postMessage` commands (`next`, `prev`, `nextSlide`, `prevSlide`, `go`) and reports its slide, beat, card text and whether the beat's motion has settled. Outside such an iframe it does nothing. The message contract is at the top of `packages/decks/setup/embed.ts`.
- **Inter, self-hosted.** The package ships Inter and decks set `fonts.provider: none`, so a deck makes no Google Fonts request.

## Quickstart

Requirements: Node 20.19+ or 22.12+ (Vite's minimum) and Claude Code for the agent setup. Bun is optional: the `decks` CLI runs on Node, and every command below has an npm equivalent. Working in a clone of this repo needs Bun for its workspace and scripts.

In a new project:

```bash
bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed
bunx -p slidev-addon-decks decks init
bunx -p slidev-addon-decks decks new my-talk --story --author "Your Name"
bunx -p slidev-addon-decks decks dev my-talk
```

With npm, install with `npm i slidev-addon-decks @slidev/cli slidev-theme-the-unnamed` and replace `bunx` with `npx`: `npx -p slidev-addon-decks decks init`, and so on.

Every command uses the `-p slidev-addon-decks` form. The bare name `decks` on npm is an unrelated package, so running the bare name through bunx or npx can fetch and run it. With `-p`, the runner fetches `slidev-addon-decks` and runs its `decks` bin; if the package can't be installed, the command fails instead of running something else. The tables below write the command as `decks` for short; run it with the prefix above.

`decks` reads the `decks.json` registry from the current directory. `new` creates it when it is missing; `init` and `lint` run without one, and every other command stops without it. `new` takes an alias and an optional directory name, which defaults to the alias. The alias is what you pass to `dev`, `build` and `export`. The directory is created under `decks/`. Its flags:

| Flag | Effect |
| --- | --- |
| `--story` | Scaffold a story deck: a cover, one stage component, a `data/` module and `data-sources.md`. Without it you get a conventional deck with one cover page. |
| `--author "Name"` | Byline on the cover (default `Your Name`). |
| `--brand "Name"`, `--url example.com` | Write a `theme.json` for the deck with that brand name and URL for the cover and footer. |

A deck enables the addon in its headmatter with `addons: ["slidev-addon-decks"]`. The scaffold sets this up for you. `Graph3D` needs `three`, `3d-force-graph` and `three-spritetext` installed alongside. Other components don't need them.

`decks.json` can carry a `_config` entry: `decksDir` (where `new` writes, default `decks`), `outDir` (default `dist/{name}`) and `base` (default `/`). A deck entry can override `outDir` and `base`. The `_readme` key in this repo's `decks.json` documents every field.

### What `decks init` writes

`init` installs the Claude Code setup into the current project:

- `.claude/agents/deck-author.md`, the skills `building-a-deck` and `fact-checking-a-deck` under `.claude/skills/`, and six rules under `.claude/rules/` (`deck-patterns`, `deck-writing`, `deck-data`, `story-stage`, `prose-patterns`, `project-glossary`). They are the repo's own files with your `decksDir`, the CLI command and the installed package's path filled in.
- Two hooks in `.claude/settings.json`: `decks hook lint` before Edit, Write and MultiEdit, and `decks hook prompt` on prompt submit. Both run through `.claude/hooks/decks.sh`, a short POSIX `sh` wrapper that calls the installed package. Existing settings and hooks are kept, nothing is added twice, and `init` prints the diff.
- A block between `<!-- decks:start -->` and `<!-- decks:end -->` in `AGENTS.md`, or in `CLAUDE.md` when that is the only instructions file. With neither, `init` creates `AGENTS.md` and a `CLAUDE.md` containing `@AGENTS.md`.
- `.claude/decks.json`, which records each file `init` wrote and its content hash.

Re-running `init` is safe:

- A file whose hash still matches is updated to the new version.
- A file you edited is skipped and reported. `--force` overwrites it.
- A file that exists at one of those paths but that `init` never wrote is a collision. `init` reports it and leaves it alone, with or without `--force`. Rename or move your file and re-run to install the Decks version.
- A file an earlier `init` wrote that the package no longer ships is removed if you haven't edited it, and kept and reported if you have.
- The `decks:start` block is replaced in place, in both `AGENTS.md` and `CLAUDE.md` if both carry one.

If the package isn't installed, `init` writes the agent files and the instructions block but not the hooks, prints the install command and exits 1. Install the package and re-run `init` to add the hooks.

When the hooks are in `.claude/settings.json` but the package is missing (a fresh clone before `bun install`, or after you uninstall it), `decks.sh` refuses writes to deck prose (`slides.md`, `pages/*.md` and `components/*.vue` under your `decksDir`), because it can't lint them, and allows every other write. The prompt hook does nothing. Re-running `init` in that state warns about it. If you stop using Decks, remove the two `decks.sh` entries from `.claude/settings.json`.

### CLI reference

| Command | What it does |
| --- | --- |
| `decks init [--force]` | Install the Claude Code setup, as above. |
| `decks new <alias> [dir]` | Scaffold a deck and register it. |
| `decks dev <alias> [...]` | Dev server; flags after the alias go to Slidev (`--port 3031`). |
| `decks build <alias>`, `decks build --all` | Static build to `dist/<name>`, or every registered deck. |
| `decks export <alias>` | PDF export. |
| `decks list` | Registered decks. |
| `decks check` | Pages on disk against each deck's `src:` manifest, unregistered decks, and error-level `decks lint` hits. |
| `decks lint [alias\|file ...] [--strict] [--errors-only]` | AI-rhetoric scan of `slides.md`, `pages/*.md`, `components/*.vue` and story-stage `COPY` arrays; every deck when no target. Exits 1 on an error-level hit (any hit with `--strict`). `decks lint --stdin` scans piped text. |
| `decks shot <alias> <slide> [clicks] [--port N] [--out DIR]` | Screenshot one slide at each click; prints card leads, chips and console errors. |
| `decks snap <alias> [outDir] [--port N]` | Screenshot every slide and click. `decks snap diff <dirA> <dirB> [threshold]` diffs two walks per frame. |
| `decks fact-extract <alias\|deck-dir>` | List every figure in a deck as input for the fact-check. |
| `decks hook lint`, `decks hook prompt` | The two Claude Code hooks. `init` wires them; you don't run them by hand. |

`shot` and `snap` use a dev server already running on `--port`, or start one on a free port and stop it after. They need `playwright-chromium`, an optional peer dependency: install it with `bun add -d playwright-chromium` (or `npm i -D`) before using them. `snap diff` also needs `pngjs` and `pixelmatch`.

## Theming

All colors, fonts and brand fields come from one file, `packages/decks/theme/default.json`. To restyle a deck, put a `theme.json` next to its `slides.md` and include only the keys you want to change:

```json
{
  "brand": { "name": "Acme", "url": "acme.example", "logo": null },
  "ramps": { "cyan": ["#2f8f83", "#3fae9f", "#62c7b8", "#9be0d4"] }
}
```

Objects merge key by key and arrays are replaced whole. The six hue ramps (cyan, amber, rose, emerald, violet, slate) keep their names when you recolor them. Each ramp has four steps from dark to light, and step 1 must reach 3:1 contrast against the canvas. Themes stay dark. The theme becomes `--od-*` CSS variables for stylesheets. JavaScript, such as chart specs, reads it through `import { theme } from 'slidev-addon-decks/theme'` or `ink(hue, step)` from `slidev-addon-decks/story`. Hex literals in deck code ignore the deck's theme. In dev, edits to `theme.json` reload live.

`examples/od-templates/theme.json` is a complete alternate palette. The full token reference, including alias syntax and the CSS variable names, is in "Theme and tokens" in [`.claude/rules/deck-patterns.md`](.claude/rules/deck-patterns.md), and [`AGENTS.md`](AGENTS.md) has a summary.

The `od-` prefix on CSS variables and classes is a leftover from the project Decks was extracted from. It stays to avoid a rename across hundreds of selectors.

## Writing decks with an agent

Claude Code is the supported agent. After `decks init`, ask it for a deck in plain language and it uses the setup below. Other agents read `AGENTS.md`, but `init` doesn't install or test a setup for them. In this repo, [`AGENTS.md`](AGENTS.md) is the entry point; Antigravity and Codex read generated copies of the same guidance in `.agents/` and `.codex/`.

- **`deck-author` agent** (`.claude/agents/deck-author.md`) builds or revises one deck per session.
- **`building-a-deck` skill** covers the full workflow: scaffold, sourcing data, verification, build, and when a deck counts as done.
- **`fact-checking-a-deck` skill** reruns the source behind each figure, using the query or source recorded in the deck's `data-sources.md`, and checks the data arrays, card copy and slide text against the results.
- **Rules** in `.claude/rules/` attach by path when you edit files under your decks directory. They cover slide prose (`deck-writing.md`), layout, charts and theme (`deck-patterns.md`), story stages (`story-stage.md`), data provenance (`deck-data.md`), a catalog of AI writing patterns to avoid (`prose-patterns.md`) and your own terminology (`project-glossary.md`, which starts empty).
- **Hooks.** `decks hook lint` runs before every Edit, Write and MultiEdit and denies deck prose that matches an error-level pattern in the package's `lint/ai-rhetoric-patterns.tsv`. If the scanner can't run, it refuses the write instead of letting it through. `decks hook prompt` adds a reminder of the writing rules when a prompt asks for deck work. Both are Node scripts behind the `sh` wrapper `.claude/hooks/decks.sh`, so they need no `jq` or bash.
- **Exemplars.** The skills point the agent at two decks inside the package, `node_modules/slidev-addon-decks/agent/exemplars/tides` (story) and `.../agent-experience` (conventional), to read and not edit.

In this repo the same setup is the source, in `.claude/` and `tools/`. `bun run render:agent` renders it into `packages/decks/agent/`, which is what `init` installs. The checks outside the agent:

```bash
bun run lint                  # decks lint: AI-rhetoric lint over pages, slides.md, components and story COPY
bun run test                  # unit and guard tests, theme contrast, and the render:agent drift test
bun run test:hooks            # tests for the two hooks
bun run test:tarball          # pack the package and run init, lint, check and the hooks in scratch projects
bun run fact-extract <alias>  # list every figure in a deck as input for the fact-check
bun run test:embed [alias...] # embed-control contract test against built decks (bun run build:all first)
```

## Example decks

| Alias | Deck | What it shows |
| --- | --- | --- |
| `pitch` | `examples/opendata-pitch` | A story deck: 13 slides, each one stage, with `data/` modules and `data-sources.md`. |
| `ax` | `examples/agent-experience` | A conventional deck. It is the reference for slide prose and word counts. |
| `templates` | `examples/od-templates` | Conventional slide layouts (cover, bullets, two columns, big stat, a full OpenChart spec, a story slide) in the alternate warm palette. |
| `story-templates` | `examples/od-story-templates` | Story stage patterns: the minimal stage, bars, labelled cards, and a hand-off between slides. |
| `tides` | `examples/tides` | A five-slide story deck on how ocean tides work, from NOAA, USNO and NASA sources. Drafted by Claude Code in one run of this repo's agent setup, then fact-checked and edited by hand. The commit after `feat(examples): add tides deck, raw agent output` holds every change; the findings are in its `data-sources.md`. |

From a clone:

```bash
bun install
bun run dev pitch
bun run build:all      # all five decks into dist/
```

## Repository layout

```
packages/decks/   the npm package (slidev-addon-decks)
examples/         the five example decks
decks/            where `bun run new` scaffolds your decks
tools/            wrappers around the package lint and fact extractor
.claude/          agent, skills and rules for Claude Code (the source `init` installs)
```

## Third-party software

| Component | License | How Decks uses it |
| --- | --- | --- |
| [Slidev](https://github.com/slidevjs/slidev) (`@slidev/cli`) | MIT | Installed by the user alongside the package. Not bundled. |
| [slidev-theme-the-unnamed](https://github.com/estruyf/slidev-theme-the-unnamed) by Elio Struyf | MIT (`LICENSE.md` in the package; its `package.json` has no `license` field) | The base theme each deck names in its headmatter. Installed by the user. Not bundled. |
| [OpenChart](https://github.com/tryopendata/openchart) (`@opendata-ai/openchart-core`, `@opendata-ai/openchart-vue`) | Apache-2.0 | Dependency of `slidev-addon-decks`. |
| gsap, d3-scale, uqr | GSAP Standard "no charge" license, ISC, MIT | Dependencies of `slidev-addon-decks`. |
| [Inter](https://rsms.me/inter/) via [`@fontsource-variable/inter`](https://fontsource.org/fonts/inter) | SIL Open Font License 1.1 | Dependency of `slidev-addon-decks`. Its variable font files are bundled into each built deck by `styles/fonts.css`. |

`.claude/rules/prose-patterns.md` is adapted from the `ce:writer` skill (MIT). The attribution is in that file.

## License

Apache-2.0. See [LICENSE](LICENSE).
