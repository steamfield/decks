# decks-site

Instructions for coding agents working in this directory. Keep this file under about 200 lines: it is loaded at the start of every session. Put detail that matters only for one area in a doc and link it from Deeper context.

## Overview

The landing page and docs for Decks (`slidev-addon-decks`) at decks.steamfield.io. The hero is a large headline with the install commands beside it, then a live same-origin deck in a presenter-style player: a sticky title bar (examples, position, transport), the slide, a rail of slides with step progress, and a readable caption. The header, hero, player and sections share one 1360px column. The landing page takes its palette from the product theme (`packages/decks/theme/default.json`), so the page canvas is the slide canvas and every other surface is that zinc tinted toward the theme's blue-violet. Astro (static), React islands, Tailwind 4, Bun. It lives in `site/` inside the decks repository, outside the bun workspace, and is scaffolded from the stacks `astro-product-site` stack.

## Commands

Run these from `site/`. They are the only supported way to build, test, and run the project; if a command here is wrong, fix it here in the same change.

| Command | What it does |
| --- | --- |
| `make install` | Install dependencies (frozen lockfile in CI) and, outside CI, Playwright's Chromium |
| `make dev` | Dev server on `PORT_WEB` (4321) |
| `make lint` | Biome (TS, JS, CSS, JSON) and Prettier (`.astro`) |
| `make format` | Apply Biome and Prettier fixes |
| `make check` | `astro check` type-check |
| `make test` | Unit, component and content-drift tests (vitest) |
| `bunx vitest run src/lib/player/format.test.ts` | One test file |
| `make build` | Static build into `dist/`, then `tests/build.test.ts` over it |
| `make e2e` | Playwright and axe against the production build (`PORT_E2E`, 4322) |
| `make demo` | Lint and check the decks, build every example in `src/data/examples.json` into `public/demo/`, record them into `fixtures/examples/`, shoot each poster at its start step, film the hero loop into `public/loops/` (needs ffmpeg), and take the normal and warm stills with the repo's `shot` (about 6 minutes) |
| `node scripts/demo.mjs --no-shots` | Builds and recordings only, keeping posters, loops and stills |
| `node scripts/demo.mjs --loops` | Builds, recordings and loops only |
| `node scripts/demo.mjs --only opendata-showcase,aisd-showcase` | Regenerate only the featured excerpts and their media |
| `node scripts/edits.mjs` | Write each agent example's edit fixture from git |
| `node scripts/excerpt-run.mjs keeling-1 <log.jsonl>` | Write a run's transcript fixture from its stream-json log (the logs stay outside the repo) |
| `make demo-build` | Deck builds only, into `public/demo/` (what a deploy needs) |
| `make deploy-check` | Serve `dist/` through `wrangler dev`; checks headers, canonical URLs, 404 |
| `stacks verify` | The definition of done (install through serve) |

Each target also has a `bun run <target>` alias in `package.json`. `make demo` needs the parent repo's dependencies (`bun install` at the repo root) and Playwright's Chromium.

## Architecture map

| Path | Owns |
| --- | --- |
| `src/config.ts` | All landing copy, install commands, requirements, notes for the file tree, the v-click comparison, footer, `site.islands` |
| `src/pages/index.astro` | The landing page: section order and which island goes where |
| `src/data/examples.json` | The example registry: gallery order (the first is the hero), start step, provenance, featured labels, excerpt attribution, run fixtures, edit commits and preview scripts |
| `src/data/examples.ts` | Build-time example loader: recordings, posters, loops, run figures and edits from generated files |
| `src/data/fixtures.ts`, `src/data/project.ts` | The recorded run and hook denial loaders; the file tree from a real `decks init` run |
| `src/components/landing/DeckPlayer.tsx` | The showcase island: title bar (example switcher, position, transport), poster/interactive frame, slide rail, captions, acknowledged navigation, playback and gallery picks |
| `src/components/landing/sections.tsx` | Static sections (requirements, file tree, comparison, transcript, hook panel, gallery, no-JS deck text) |
| `src/components/CopyBlock.astro`, `InstallTabs.tsx` | Multi-line copy blocks and the install tabs |
| `src/lib/player/` | `protocol.ts` (embed contract), `format.ts` (captions, counter), `example.ts` (types, `stateAt`, `markAt`, `draftLine`) |
| `src/lib/brand.ts`, `src/components/Logo.astro` | The Decks mark (two slides, cyan over violet, from the theme's ramps) and everything built from it at build time: the header mark, `favicon.svg`/`.ico`, `apple-touch-icon.png`, `icon-<size>.png` and `site.webmanifest` (endpoints in `src/pages/`), and the mark on the social card |
| `src/lib/tokens.ts` | Landing tokens derived from the product theme: the canvas/band/raised surface ladder and the cyan action color |
| `@steamfield/ui` | Shared library: scroll reveals, the TOC highlight, copy buttons, the install tabs and the docs Markdown plugins; `src/styles/sf-theme.css` maps the site's tokens onto its `--sf-*` variables and imports the library stylesheets the site uses |
| `src/styles/global.css`, `src/styles/landing.css` | Docs tokens (light and dark) and the landing layout: the one 1360px column, alternating section bands, the player and its uniformly scaled mobile canvas |
| `fixtures/` | `smoke-1.json`, `hook-denial.json`, `examples/<name>.json`, `.loop.json`, `.edits.json`: all generated by scripts, never typed |
| `scripts/demo.mjs`, `edits.mjs`, `excerpt-run.mjs`, `capture-hook.mjs`, `hook.mjs`, `scratch-project.mjs` | Generators for the above |
| `demo/warm-theme.json` | The warm still's theme override |
| `public/posters/`, `public/stills/`, `public/loops/` | Generated images and video (committed); `public/demo/` holds deck builds (gitignored) |
| `src/content-drift.test.ts` | Commands, figures, the hook's answer, edits and deck recordings checked against the repository |
| `e2e/fixtures/stub-deck.html` | A stand-in deck that speaks the embed contract, routed in for browser tests |

The site reads its parent repository at build time (`../packages/decks`, `../examples`, `../README.md`), so it builds only inside the decks repo.

## Agent harness

Claude Code reads `CLAUDE.md`, which imports this file. Hooks in `.claude/` block destructive commands and secret-shaped writes, lint each written file and format changed files on stop (`.claude/README.md`). Rules in `.claude/rules/site/`: `docs.md` covers `src/content/docs/**`, `ui.md` covers the components, styles and pages.

## Conventions

- Copy is literal: say what the product does. Section headings are claims ending in a period, built from fixture figures where they cite one (reference sections such as Requirements and limits keep a topic label); never questions. No slogans, no "not X but Y", no em dashes. The landing unit is a "step"; "beat" is defined in the docs. `make build` runs the package's prose lint over the landing text (R6); mark a quoted bad example with `data-lint-skip`.
- Every number on the page comes from a generated fixture or the repository, and `src/content-drift.test.ts` checks it. Never type a figure, a transcript line or a slide title by hand: re-run the generator. Every landing image comes from `public/posters/`, `stills/`, `loops/` or `og/` (R3, build test), and each example says how it was made.
- Every shown `decks` command pins the package: `bunx -p slidev-addon-decks decks …` (pnpm, which has no `-p`, uses `pnpm exec decks …` after its `pnpm add`). The bare `decks` on npm is unrelated.
- The landing page is dark only. The canvas is the slide's #09090b; bands, panels, controls and hairlines are the theme's zinc tinted toward its blue-violet (`mix()` in `src/lib/tokens.ts`). Cyan is the one action color. The theme's other hues carry meaning only: provenance (agent cyan, talk amber, template violet, hand emerald), run output and the hook's verdict (emerald passes, rose blocks). Sections alternate canvas and band (`Section tone`), each band edged by hairlines, and a panel sits one step above its section. Depth comes from that ladder and borders; the open examples menu is the one shadow. The Decks mark (header, icons, social card) is the logo and sits outside these limits. Decorative marks are limited to the multi-hue rule (top of the player, above the closing call to action), the faint dot grid behind the hero and the terminal frame's window dots; no other textures, glows or gradients, and no extra display faces: Inter and JetBrains Mono only. `src/styles/tokens.test.ts` checks contrast, the tint and that the bands stay distinguishable.
- The header, hero text and showcase share one column: 1360px wide with 32px gutters, or 16px below 768px, so the page has a single left edge. Never cap the showcase's width by viewport height. Preserve the full 16:9 composition by uniformly scaling the slide on mobile; captions and controls remain readable page text. Fullscreen fits the complete slide with letterboxing.
- The selected live deck loads when the player hydrates in view. A sharp poster remains until the interactive deck is ready; no recorded video loads. Automatic live playback runs only when motion is allowed, visible and onscreen, and manual interaction pauses it. Reduced motion still loads the live deck without automatic playback. The shell and poster stay at or under 350 KB; live deck assets are measured separately. Recorded-video size and frame-rate targets are no longer release gates.
- Islands: `DeckPlayer` (`client:visible`) and `InstallTabs` (`client:idle`). Each server-renders a useful state: posters, deck text and links without JavaScript.
- The embed contract's deck side is in the addon (`bun run test:embed` at the repo root). `beats` is the last beat index, so a slide has `beats + 1` steps.

## Guardrails

- Destructive commands, credential-shaped writes and real `.env` writes are guarded by native hooks. A block means ask the user; never rephrase a command or use another tool to bypass it.
- Store credentials in environment variables. Write variable names and placeholders in `.env.example`.
- Treat lint diagnostics as work to resolve. Run the project check command before finishing.
- Keep site-only changes inside `site/`. A request covering demo content or embedded interaction can also require changes to `examples/` and the addon; read the root rules for those changes.

## Testing

- `make test`: protocol, formatting, example types, file tree, sections and player component tests (Testing Library, happy-dom; the iframe's window is a stand-in), token contrast, docs rules, and the content-drift test, which runs the real prose-lint hook in a scratch `decks init` project and recomputes the edits fixture from git.
- `make build`: acceptance tests over `dist/` (docs pages, links, islands, landing content, R3 image sources, R6 prose lint, a probe page built in a temp parent that links the repo back in). Links need `public/demo/`: run `make demo-build` once in a fresh checkout.
- `make e2e`: axe on `/` (dark under either system theme) and on a docs page in light and dark, the player against the stub deck (boot, Play timing, keys, gallery pick, default live loading, reduced motion), the shared column (player width and the single left edge) and unchanged slide proportions, 360px controls and overflow, separate shell/live-asset measurements, no-JS rendering, copy buttons.
- Weakening or skipping a test to get green is a failure, not a fix.

## Error handling

- The player gives up on a deck that does not answer within 15 s and offers Retry and Open deck while retaining visual context. A failed analytics load turns analytics off.
- Generators (`scripts/*.mjs`) throw with the step that failed and exit 1.

## Debugging

- If a fix hasn't worked after two attempts with no new diagnostic step in between, stop and list other hypotheses.
- Under an agent, `astro dev` started through `bunx` may miss file changes; restart it or run `node node_modules/.bin/astro dev`.
- The Astro dev server serves no directory index from `public/`, so the player loads `/demo/<name>/index.html`.

## Analytics

`src/lib/analytics.ts` is the only `posthog-js` import; it does nothing while `PUBLIC_POSTHOG_KEY` is empty (dev, tests, CI). Events live in `src/lib/events.ts`: `install_copied {method}`, `player_played {example}`, `beat_stepped {cmd}`, `example_selected {example}`, `docs_quickstart_viewed`. Names are `object_verb`, past tense, flat scalar properties; track from islands or `src/scripts/site.ts`, never docs. All five Steamfield sites send to one shared Steamfield PostHog project; every event carries a `site` property (stamped in `before_send`, since opting in resets super properties), `"decks"` here. Consent: PostHog runs cookieless (`cookieless_mode: "on_reject"`, opted out by default) until the visitor accepts, then uses `localStorage+cookie` across subdomains; the decision lives in the `sf-consent` cookie on `.steamfield.io`. When the build has a key, `BaseLayout.astro` creates the store with `createConsentStore({ domain: "steamfield.io" })` from `@steamfield/ui/consent`, passes it to `initAnalytics` and mounts the banner with `mountConsentBanner`, linking the shared privacy page at https://steamfield.io/privacy (also in the footer); the banner's `--sf-consent-*` tokens are mapped in `src/styles/sf-theme.css`. The consent store is the source of truth: pass it to `initAnalytics` as `consent`, and PostHog follows it (granted opts in; undecided or declined goes back to cookieless and stores nothing). The layout only calls `initAnalytics` when the build has a key, so a keyless build ships no analytics code. Never send typed text, emails or tokens.

What is captured (the module is copied from stacks-api and shared by every site; its comments explain each option):

- Every visitor, cookieless included: pageviews and page leaves, autocapture (clicks, rage clicks, field changes, form submits; never input values) and web vitals. Page URLs go out without their hash. Each page loads PostHog's remote config script and web vitals library from PostHog's CDN; feature flags stay off, so `/flags` is never requested.
- After Accept only: heatmaps and session recording with console logs. Recordings mask every input and the text of anything marked `data-ph-mask`, and never record network bodies or headers. The site has no text field of its own, so nothing here needs `data-ph-mask`; add it to any element that shows typed text. `before_send` drops heatmap, dead-click and snapshot events unless PostHog's consent record is granted, and a page restored from the back-forward cache re-checks it. PostHog Logs' console capture is kept out (`__extensionClasses: { logs: undefined }`).
- Autocapture reads an element's text before consent, and `data-ph-mask` doesn't apply to it: never echo typed text in an `a`, `button`, `label` or `form`.
- https://steamfield.io/privacy lists all of this; keep it in step. Tests: `src/lib/analytics.test.ts` runs the real posthog-js with remote config from `tests/fixtures/posthog/` (its README says how to refresh it), including a config with everything switched on. `e2e/analytics.spec.ts` builds the site with a test key, serves PostHog locally and checks in Chromium: no recordings or heatmaps before Accept or after a Decline (here or on a sibling site), masked recordings with no network capture after Accept, no typed text in any event, and cookieless web vitals.

## Deploy

Cloudflare Worker `decks` serving `dist/` as static assets, production at decks.steamfield.io, deployed by Cloudflare's Git integration (Workers Builds): root directory `/site`, build command `bun run build`, deploy command `npx wrangler deploy`. Under Workers Builds (`WORKERS_CI=1`) `make build` first runs `ci-prepare` (`bun install` at the repo root, then the deck builds into `public/demo/`, which is gitignored). `wrangler.jsonc` holds the rest: the assets directory, trailing-slash and 404 handling, and the `decks.steamfield.io` custom domain, which `wrangler deploy` attaches. `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` are build variables on the Worker. `make deploy-check` verifies headers and URLs locally; `make deploy-preview BRANCH=…` (a preview version) and `make deploy` upload from a machine with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Headers live in `public/_headers` (framing is `SAMEORIGIN` because the player embeds `/demo/`); add `public/_redirects` only for moved pages.

## Build workarounds

| Where | What and why | Remove when |
| --- | --- | --- |
| `package.json` | `typescript@^6`: `astro check` refuses TypeScript 7 | `@astrojs/check` supports TypeScript 7 |
| `tests/build.test.ts` | The probe build copies `site/` into a temp parent and symlinks `packages`, `examples` and `README.md` beside it, because the site reads its parent repo | The site stops reading the parent repo at build time |
| `src/content-drift.test.ts`, `scripts/demo.mjs` | Import `../../packages/decks/theme/resolve.ts` across the package boundary to merge and validate the warm still's theme with the real resolver | The addon publishes the resolver on an export path the site can depend on |
| `src/lib/tokens.ts`, `scripts/scratch-project.mjs` | Read `packages/decks/theme/default.json` and run `packages/decks/scripts/deck.mjs` from the parent repo | The site stops reading the parent repo at build time |

## Deferred

- A light-slide variant of the player (decks stay dark).
- Re-theming the hero player live (would need a second deck build and a reload).
- A blog or changelog pages.

## Pending user actions

- Deploy steamfield.io with its `/privacy` page before deploying this site with a PostHog key: the consent banner and the footer link to https://steamfield.io/privacy.
- Until the repo is public and the package is on npm, the GitHub links 404 and the install line fails.
- In the shared Steamfield PostHog project, set `PUBLIC_POSTHOG_KEY` (and host) as Workers Builds build variables on the `decks` Worker for production builds only, and enable "Cookieless server hash mode" and "Discard client IP data" in its settings.
- Optional: allow `make demo`, `make demo-build` and `make deploy-check` in `.claude/settings.json`.
- The parent repo formats with Prettier (`.prettierrc`); this directory has its own Biome and Prettier config, which take precedence here. If the root ever adopts Biome, exclude `site/` or extend this `biome.json`, and add `.claude/worktrees/` to the root `.gitignore`.

## Deeper context

| Need | Read |
| --- | --- |
| Why the page is shaped this way, the copy, the design, success metrics | `docs/PRODUCT.md` |
| How the site fits together, docs pipeline | `docs/DEVELOPMENT.md` |
| Hooks and Claude settings | `.claude/README.md` |
