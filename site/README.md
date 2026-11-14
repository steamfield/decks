# decks-site

The landing page and docs for Decks (`@steamfield/decks`), a React slide framework for animated data-storytelling presentations, at decks.steamfield.io.

The product's static site: a landing page at `/` and documentation under `/docs/`, built with [Astro](https://astro.build). Every docs page is also served as Markdown, and `/llms.txt` lists them for coding agents. The landing page's player plays the repository's example decks, built into `public/d/` by `make demo`.

## Quickstart

Requires [bun](https://bun.sh), Node 22.12+ and make. Run from `site/` inside the decks repository; the site reads `../packages/`, `../docs/guide/`, `../plugins/decks/` and `../examples/` at build time.

```bash
make install
make demo-build   # build the example decks for the player (needs bun install at the repo root)
make dev          # http://localhost:4321
```

## Adding a docs page

Add a Markdown file under `../docs/guide/` with a level-one title and an opening paragraph. This is the same guide that ships in the npm package. The site derives navigation metadata from the text; the sidebar, pager, docs home, sitemap, social card, Markdown export and both `llms` files pick it up on the next build.

The guide's getting-started page keeps `/docs/getting-started/quickstart/`; other pages use their filename, with `README.md` at `/docs/overview/`. Retired docs routes redirect through `public/_redirects`.

## Commands

| Command           | What it does                                                  |
| ----------------- | ------------------------------------------------------------- |
| `make dev`        | Dev server                                                    |
| `make lint`       | Biome and Prettier checks                                     |
| `make format`     | Apply formatting and safe fixes                               |
| `make check`      | Type-check pages, components and content                      |
| `make test`       | Unit, component and content-drift tests                       |
| `make build`      | Production build into `dist/`, then its acceptance tests      |
| `make e2e`        | Browser and accessibility tests                               |
| `make preview`    | Serve the production build                                    |
| `make demo`       | Build, record and screenshot the example decks for the player |
| `make demo-build` | Build the example decks into `public/d/` only              |

## License

Copyright (c) 2026 Riley Hilliard
