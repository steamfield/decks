# Decks

Decks is a React slide framework for animated, data-driven talks, built to be written with coding agents. A deck is a directory of MDX slides and React components; slides are drawn on a 1920x1080 canvas that scales to any window, clicks step through motion inside a slide, and a story stage pins one visualization per slide and advances it in beats while a prose card carries the argument. It ships as one npm package, [`@steamfield/decks`](packages/decks/README.md), with a `decks` command, and a Claude Code plugin that teaches an agent to build a good deck.

```sh
bun add @steamfield/decks react react-dom
bunx -p @steamfield/decks decks init               # agent setup: Claude Code plugin, Codex skills
bunx -p @steamfield/decks decks new talk --story   # scaffold a story deck
bunx -p @steamfield/decks decks dev talk           # serve it, with presenter view on p
```

Node 22.12 or later and React 19. The `-p` form keeps runners from fetching the unrelated `decks` package on npm. The user guide is [docs/guide/](docs/guide/README.md); it also ships inside the package.

Decks was a Slidev addon (`slidev-addon-decks`) until 1.0. [Moving a deck from slidev-addon-decks](docs/guide/migrating-from-slidev.md) has the mapping; the git tag `slidev-final` holds the last Slidev version of this repo.

## This repository

| Path | What it is |
| --- | --- |
| `packages/{core,runtime,motion,node,kit}` | The framework, as private workspaces with enforced boundaries |
| `packages/decks` | The published package, bundling the five |
| `examples/` | Decks: `building-for-agents`, `opendata-pitch`, `aisd-showcase`, `texas-2026`, and small fixtures |
| `plugins/decks` | The Claude Code plugin (skills, agent, hooks); the marketplace is `.claude-plugin/marketplace.json` |
| `site/` | decks.steamfield.io |
| `docs/` | The guide, the architecture, RFCs and the delegation log |

```sh
bun install
bun run check            # lint, typecheck, unit and integration tests, browser tests
bun run test:tarball     # pack the package, install it outside the repo, build and serve a deck
bun run decks dev agents # run an example deck from source
```

`AGENTS.md` is the rulebook for contributors and coding agents.

## License

Apache-2.0.
