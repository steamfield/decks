# Decks

Decks is a framework for data-driven presentations built on [Slidev](https://sli.dev). It ships as one npm package, `slidev-addon-decks`, with a `decks` command, and this repo adds example decks and the agent configuration used to write decks with Claude Code.

The package contains:

- **Story engine** (`slidev-addon-decks/story`). A story slide pins one visualization to the slide and advances it in beats on the arrow keys. The beat timeline is a function of Slidev's click count, so stepping backward replays the transition in reverse. Prose sits in a floating card whose copy changes per beat, and a visual can carry over from one slide to the next.
- **Ink marks.** Vue components that draw onto the stage: `InkLine`, `InkBars`, `InkChip`, `InkRule`, `InkNumber`, `InkTimeline` and a few more. They use a clean stroked style by default and switch to a hand-drawn marker style with one setting.
- **OpenChart wrapper.** `<OpenChart :spec="..." />` renders an [OpenChart](https://github.com/tryopendata/openchart) spec sized for the 1920x1080 slide canvas, with a shared chart theme and entrance animation. `Graph3D` adds the WebGL network graph.
- **Layout CSS and slide chrome.** Cover, footer, eyebrow, byline, QR card, plus layout classes for bullets, two columns, big stats and full-bleed charts.
- **Viewer.** In the audience view, `Cmd/Ctrl +` and `-` resize the text, a trackpad pinch zooms the slide, and `Cmd/Ctrl 0` resets both. Presenter, overview and PDF export are not affected.
- **Runner and verification tools.** `decks` scaffolds, runs, builds and exports decks from a `decks.json` registry. `shot` screenshots one slide at each click, and `snap` walks a whole deck and diffs it against an earlier walk pixel by pixel.

## Quickstart

In a new project:

```bash
bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed
bunx decks new my-talk --story --author "Your Name"
bunx decks dev my-talk
```

`decks` reads the `decks.json` registry from the current directory. `new` creates it when it is missing; every other command stops without one. `new` takes an alias and an optional directory name, which defaults to the alias. The alias is what you pass to `dev`, `build` and `export`. The directory is created under `decks/`. Its flags:

| Flag | Effect |
| --- | --- |
| `--story` | Scaffold a story deck: a cover, one stage component, a `data/` module and `data-sources.md`. Without it you get a conventional deck with one cover page. |
| `--author "Name"` | Byline on the cover (default `Your Name`). |
| `--brand "Name"`, `--url example.com` | Write a `theme.json` for the deck with that brand name and URL for the cover and footer. |

The other commands:

```bash
bunx decks dev <alias> [--port 3031 ...]   # dev server; flags after the alias go to Slidev
bunx decks build <alias>                   # static build to dist/<name>
bunx decks build --all                     # every registered deck
bunx decks export <alias>                  # PDF export
bunx decks list                            # registered decks
bunx decks check                           # pages on disk vs each deck's src: manifest
```

Run `bunx decks` only after installing the package. The unscoped npm name `decks` belongs to an unrelated library, so without a local install bunx fetches that package and fails.

A deck enables the addon in its headmatter with `addons: ["slidev-addon-decks"]`. The scaffold sets this up for you. `Graph3D` needs `three`, `3d-force-graph` and `three-spritetext` installed alongside. Other components don't need them.

`decks.json` can carry a `_config` entry: `decksDir` (where `new` writes, default `decks`), `outDir` (default `dist/{name}`) and `base` (default `/`). A deck entry can override `outDir` and `base`. The `_readme` key in this repo's `decks.json` documents every field.

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

This repo is set up for Claude Code. Antigravity and Codex read generated copies of the same guidance in `.agents/` and `.codex/`. [`AGENTS.md`](AGENTS.md) is the entry point for any agent. The agent configuration lives in this repository and is not included in the npm package, so the workflow below applies to decks you write in a clone of this repo.

- **`deck-author` agent** (`.claude/agents/deck-author.md`) builds or revises one deck per session.
- **`building-a-deck` skill** covers the full workflow: scaffold, sourcing data, verification, build, and when a deck counts as done.
- **`fact-checking-a-deck` skill** reruns the source behind each figure, using the query or source recorded in the deck's `data-sources.md`, and checks the data arrays, card copy and slide text against the results.
- **Rules** in `.claude/rules/` attach by path when you edit `examples/`, `decks/` or `packages/decks/`. They cover slide prose (`deck-writing.md`), layout, charts and theme (`deck-patterns.md`), story stages (`story-stage.md`), data provenance (`deck-data.md`) and a catalog of AI writing patterns to avoid (`prose-patterns.md`).
- **Hooks.** `lint-ai-rhetoric.sh` runs before every Edit or Write and rejects deck prose that matches an error-level pattern in `tools/ai-rhetoric-patterns.tsv`. `user-prompt-submit.sh` adds a reminder of the writing rules when a prompt asks for deck work. Both hooks need `jq` on your PATH.

These commands use the same checks outside the agent:

```bash
bun run lint                  # AI-rhetoric lint over deck pages, slides.md and components
bun run test                  # unit and guard tests, theme contrast, and the same lint over story-card copy
bun run test:hooks            # tests for the two hooks
bun run fact-extract <alias>  # list every figure in a deck as input for the fact-check
```

## Example decks

| Alias | Deck | What it shows |
| --- | --- | --- |
| `pitch` | `examples/opendata-pitch` | A story deck: 13 slides, each one stage, with `data/` modules and `data-sources.md`. |
| `ax` | `examples/agent-experience` | A conventional deck. It is the reference for slide prose and word counts. |
| `templates` | `examples/od-templates` | Conventional slide layouts (cover, bullets, two columns, big stat, a full OpenChart spec, a story slide) in the alternate warm palette. |
| `story-templates` | `examples/od-story-templates` | Story stage patterns: the minimal stage, bars, labelled cards, and a hand-off between slides. |

From a clone:

```bash
bun install
bun run dev pitch
bun run build:all      # all four decks into dist/
```

## Repository layout

```
packages/decks/   the npm package (slidev-addon-decks)
examples/         the four example decks
decks/            where `bun run new` scaffolds your decks
tools/            prose lint, its pattern list, the fact extractor
.claude/          agent, skills, rules and hooks for Claude Code
```

## Third-party software

| Component | License | How Decks uses it |
| --- | --- | --- |
| [Slidev](https://github.com/slidevjs/slidev) (`@slidev/cli`) | MIT | Installed by the user alongside the package. Not bundled. |
| [slidev-theme-the-unnamed](https://github.com/estruyf/slidev-theme-the-unnamed) by Elio Struyf | MIT (`LICENSE.md` in the package; its `package.json` has no `license` field) | The base theme each deck names in its headmatter. Installed by the user. Not bundled. |
| [OpenChart](https://github.com/tryopendata/openchart) (`@opendata-ai/openchart-core`, `@opendata-ai/openchart-vue`) | Apache-2.0 | Dependency of `slidev-addon-decks`. |
| gsap, d3-scale, uqr | GSAP Standard "no charge" license, ISC, MIT | Dependencies of `slidev-addon-decks`. |
| [Inter](https://rsms.me/inter/) | SIL Open Font License 1.1 | Loaded from Google Fonts when the deck is viewed, through Slidev's `fonts.webfonts`. The package contains no font files. |

`.claude/rules/prose-patterns.md` is adapted from the `ce:writer` skill (MIT). The attribution is in that file.

## License

Apache-2.0. See [LICENSE](LICENSE).
