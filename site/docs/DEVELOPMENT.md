# Developing the site

## Where things live

| Path | Owns |
| --- | --- |
| `src/content/blog/`, `src/content/schema.ts` | MDX posts with validated metadata and docs references |
| `src/lib/blog.ts`, `src/layouts/BlogLayout.astro`, `src/pages/blog/` | Blog URLs, reading time, structured data, reading layout and routes |
| `src/components/blog/` | DeckDemo (paused live player), Figure (product media), ThemeCompare (also used on the landing) |
| `src/config.ts` | Product name, tagline, URL, install commands, requirements, notes for the file tree, comparison, footer, license, the docs groups and the `islands` list |
| `src/content/docs/` | Docs pages, one Markdown file each, validated by `src/content/schema.ts` |
| `src/lib/docs.ts` | Pure docs rules: sidebar order, pager, URLs, the Markdown export and both llms files |
| `src/lib/collection.ts` | The collection and render boundary for routes (the schema also uses Astro references) |
| `src/lib/markdown.ts` | Docs Markdown conventions: `@steamfield/ui/markdown`'s Sätteri hast plugins plus its fence-meta Shiki transformer |
| `src/lib/og.ts` | The social card layout (the mark and site name, page title over the hero deck's poster) and its fonts |
| `src/lib/brand.ts` | The Decks mark's geometry and colors (cyan and violet ramp steps from the product theme), its SVG and PNG renders and the ICO packer; `src/pages/favicon.svg.ts`, `favicon.ico.ts`, `apple-touch-icon.png.ts`, `icon-[size].png.ts` and `site.webmanifest.ts` serve them, so no icon is a committed binary. Change the mark there |
| `src/components/landing/` | Landing sections (static React) and the two islands, `DeckPlayer` and `InstallTabs` |
| `src/data/` | `examples.json` (the example registry), build-time loaders for the examples, the recorded fixtures and the scaffolded file tree |
| `src/lib/player/` | The embed contract, caption and counter formatting, and the example types (`stateAt`, `markAt`, `draftLine`) |
| `src/lib/tokens.ts` | The landing page's tokens, derived from the product theme |
| `src/scripts/site.ts` | Theme toggle (docs and blog), command and code copy buttons (`enhanceCopyButtons`, with an execCommand fallback), gallery picks, copy page, the TOC highlight, and on the landing page the header's scroll edge and the section scroll reveal |
| `src/layouts/` | `BaseLayout` (head, header, footer), `DocsLayout` (sidebar, TOC, pager) and `BlogLayout` (article, TOC, install CTA, related links) |

## Docs pages

Frontmatter: `title`, `description` (at most 160 characters), `group` (an id from `docsGroups`), optional `order` (default 100, ties sort by title) and `sidebarLabel`. A file at `src/content/docs/guides/deploy.md` is served at `/docs/guides/deploy/`, exported at `/docs/guides/deploy.md` and drawn at `/og/docs/guides/deploy.png`. Nothing else lists pages by hand.

Markdown conventions, all plain Markdown so pages read the same on GitHub and to agents:

- Callouts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`.
- Titled code blocks: `title="file.ts"` after the fence's language.
- `##` and `###` headings feed the table of contents and get anchor links.
- Tables scroll sideways inside their own region.

Link between pages with the full route and its trailing slash (`/docs/concepts/ink-marks/`). The build test fails on a link or `#anchor` that doesn't resolve.

## Markdown processing

Astro's default processor is Sätteri, which doesn't run remark or rehype plugins. `src/lib/markdown.ts` takes its plugins from `@steamfield/ui/markdown` (`createHastPlugins`): callouts become `<blockquote data-callout="note">` with a `data-callout-title` paragraph, `h2`/`h3` get a `data-heading-anchor` link, tables sit in a focusable `data-table-scroll` region, and each highlighted block becomes a `data-code-block` figure with its caption and a copy button that `src/scripts/site.ts` wires. Shiki highlights code before hast plugins run and drops the fence's info string, so `codeMeta()` (a Shiki transformer) copies `title="..."` onto the `<pre>`. The site keeps its own dual Shiki themes in `astro.config.mjs` rather than the library's `createShikiConfig`, since the plugins key on the `astro-code` class Astro adds under any theme. `global.css` styles those `data-*` hooks; the landing theme.json frame in `index.astro` uses the same markup. `markdown.test.ts` renders through the same processor.

## Islands and scripts

Landing sections are React components rendered to HTML at build time. Only components named in `site.islands` may take a `client:` directive on the landing page. Blog posts may hydrate `DeckPlayer` through `DeckDemo`; the blog index ships no islands; the build test compares the hydrated islands with that list and fails on any island in `/docs/`. `DeckPlayer` uses `client:visible`; `InstallTabs` sits in the getting-started section and uses `client:idle` so it is ready before anyone scrolls to it. Interactive behaviour shared by every page (theme, copy buttons, TOC, gallery picks) goes in `src/scripts/site.ts` as plain DOM code that does nothing when its markup is absent. Two pieces are landing-only: the sticky header shows its bottom edge once a sentinel scrolls away, and `[data-reveal]` blocks below the fold rise in on intersection or keyboard focus. That is `initReveal` from `@steamfield/ui/reveal`: it sets the gate (`html[data-motion-ready]`) from `src/scripts/site.ts` and, in the same task, reveals the blocks already on screen, so they never hide; `landing.css` hides a block only under the gate until it carries `data-revealed`. The library's `revealGateScript` is deliberately not inlined: setting the gate before paint would hide on-screen blocks and replay their entrance (an e2e test checks this on a tall viewport). The reveal does nothing under reduced motion or without IntersectionObserver, and print shows every block.

The header, hero and showcase share one column (`.page-column`): 1360px with 32px gutters, or 16px below 768px. The player keeps its 16:9 composition; viewport height does not cap its width.

## Theme

The landing page is dark only. `BaseLayout` sets `class="dark"` and `data-page="landing"` on `<html>` and inlines the tokens from `src/lib/tokens.ts`, which reads them from the product theme: canvas (the page, the hero and the slide, untinted), band (alternate sections, with hairline edges) and raised (controls, and panels inside a band, where landing.css moves `--color-panel` up a step), both tinted toward the theme's blue-violet with `mix()`. Semantic hue tokens (`agent`, `talk`, `template`, `hand`, `pass`, `block`) and the brand rule stops (`rule-1` to `rule-4`) come from the theme's ramps. Cyan is the action color; its lighter steps mark links, focus and live state. Token tests check text and control contrast on every surface and that the bands stay distinguishable. The landing has no theme toggle.

Docs and blog pages keep both themes. Blog demos keep the landing player palette inside either page theme. The inline head script adds `dark` or `light` to `<html>` before paint, from `localStorage.theme` or the system preference. Without JavaScript neither class is set and a `prefers-color-scheme` media query supplies the dark tokens. Components use the token utilities (`bg-canvas`, `text-ink`, `text-muted`, `border-line`, `bg-panel`, `text-accent`), so both paths style the same markup. New colors become tokens in both theme blocks of `global.css`; the browser step runs axe against both themes.

## Social cards

`/og/[...slug].png` renders `ogCard` with satori and converts it with sharp: the page title and description over the hero example's poster (`public/posters/<hero>-1280.webp`, converted to PNG at build time), in the landing colors. Fonts come from the installed `@fontsource/inter` package as WOFF; satori can't read WOFF2 and lays out flexbox only. To use one static image instead, put a 1200x630 PNG in `public/`, delete the route and `og.ts`, point the layouts' `image` at it and update the build test.

## Search

Search isn't part of this site yet. `BaseLayout` has an empty `search` slot in the header for a search component, and docs content sits in `<article>` inside `<main>` so a static indexer can scope to it.

## Running servers

Dev and preview pass `--ignore-lock` so they stay in the foreground under an agent. Stop an Astro-managed background instance with `bunx astro dev stop` or `bunx astro preview stop`. The browser tests serve `dist/` with `astro preview` on `PORT_E2E`.

## The player and its data

`src/data/examples.json` lists the example decks in gallery order; the first is the hero. Each entry names the deck in `examples/`, its start slide and step (`startSlide`, 1-based, defaulting to the first story slide; `startBeat`, 0-based), its provenance (`agent`, `talk`, `template` or `hand`) and, for an agent deck, the recorded run fixture and its setup (`repo` or `init`), the commit pair for the edit and who made it (`by`: `hand`, or `claude` for a second Claude Code session), and any historical loop-generation settings. `src/data/examples.ts` turns an entry into an `Example` from generated files only. Swapping the hero is a new entry at the top plus its fixtures; no code changes.

`make demo` builds each deck into `public/demo/<name>/` with base `/demo/<name>/`, then drives every build through the embed contract in a headless browser (the same messages the player sends) and writes `fixtures/examples/<name>.json`: title, slide titles, the start slide (the registry's `startSlide`, else the first one with a story card), the start step and every step's caption. Each poster is a screenshot of the same build, loaded at `#/<slide>?clicks=<step>` the way the player loads it and taken once the deck reports that step settled. Historical loop generation follows the registry's authored preview commands and records 1280x720 and 1920x1080 versions; the landing player does not load those recordings. Opening holds last 1.5 seconds; explanatory holds last at least two seconds and extend for caption reading time. Recordings include the original forward and reverse animations. The generated loop fixture records playback time, slide and step for historical media tooling. Posters include 640, 1280 and 1920 pixel widths. The normal and warm stills come from the repo's `shot` script against a Slidev dev server; the warm one runs on a temporary copy of tides under `.demo/` with `demo/warm-theme.json` merged over its theme.

`node scripts/edits.mjs` writes `fixtures/examples/<name>.edits.json` from git: the diff size of `examples/<name>/` between the entry's two commits and up to two before/after caption lines. The content-drift test recomputes it.

The file tree in "What you get" isn't a fixture: `src/data/project.ts` runs the package's real `decks init` and `decks new my-talk --story` in a temporary directory on every build (`scripts/scratch-project.mjs`) and lists what they wrote. The hook panel's fixture comes from the same scratch project's PreToolUse hook (`scripts/capture-hook.mjs`).

The player starts loading its selected interactive iframe when it hydrates in view. A sharp poster and a small loading label remain until the live deck is ready. Automatic playback drives the actual deck when motion is allowed; manual interaction pauses it. Inputs during loading remain queued. Reduced motion loads the deck without automatic playback. The player mirrors the live caption under the frame as page text and never loads recorded preview video. The shell and poster keep their 350 KB budget; live deck assets are measured separately, and recorded-video targets do not gate release. A gallery link carries `data-example`; `src/scripts/site.ts` turns a click into a `decks:pick` event (or `window.__decksPick` before hydration) that the player answers by loading that deck.

Fast browser tests route `/demo/*/index.html` to `e2e/fixtures/stub-deck.html`. Integration tests also exercise the real built excerpts: stubs cannot validate slide animations, chart interaction, or canvas geometry.

The optional `decks-bridge` query flag delegates embedded navigation keys to the parent player. Commands can include a `requestId`; a settled state with that identifier completes the request, including commands that leave the position unchanged. Only the current iframe and same origin are accepted. Standalone decks retain their own navigation.

## Blog posts

Add one `.mdx` file in `src/content/blog/`. Copy an existing post for frontmatter and component imports (`slidev-examples.mdx` uses `DeckDemo` and `Figure`, `slidev-custom-theme.mdx` uses `ThemeCompare`). Titles are 1–48 characters; descriptions are 120–160. Dates coerce to dates, `updated` defaults to `published` and cannot precede it. `feature` is a schema enum and `relatedDocs` contains existing docs ids. Routes, cards, RSS, sitemap, OG cards and llms.txt derive from the collection.

Use `DeckDemo` with only `example` and `caption`. Example names come from `src/data/examples.json`; the recording supplies the poster and start step. Playback starts only on reader input. `Figure` accepts product output under `/posters/`, `/stills/`, `/loops/` or `/og/`. `ThemeCompare` shares the landing's still toggle and code frame. Demo roots carry `not-prose` and `data-demo`. The article is an inline-size container: 44rem text at 18px/28px, with demos breaking out to its page container using `100cqw`. Player and comparison CSS are shared separately from the landing layout. `landingCss` emits the dark demo tokens under `[data-demo]` without changing the page theme.

The layout owns the H1, breadcrumb, dates, TOC, install CTA and related links. Post bodies start at H2, may use search questions as H2s and contain no install CTA. The build checks metadata, links and anchors, structured data, discovery, MDX demo props and prose lint (including warnings). Docs and MDX share Sätteri heading anchors and code frames; do not pass the HAST plugins to `mdx()` again.
