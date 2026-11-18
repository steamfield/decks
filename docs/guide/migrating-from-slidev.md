# Moving a deck from slidev-addon-decks

Decks used to be a Slidev addon, `slidev-addon-decks`. It is now its own React framework. A Slidev deck moves over slide by slide; four decks were ported this way and match their Slidev originals frame for frame, so the mapping below is tested.

## Layout

| Slidev deck | Decks |
| --- | --- |
| `slides.md` headmatter (`title`, `info`, `author`, `htmlAttrs`) | `deck.config.ts` with `defineDeck({ title, info, author, htmlAttrs })` |
| `transition: od-cut` plus `htmlAttrs: { data-od-story }` | `transition: "story"` in `deck.config.ts` |
| `pages/NN-slug.md` listed in `slides.md` by `src:` | `slides/NN-slug.mdx`; order is the filename. Number them by their position in the old manifest. |
| A stanza's `clicks:` and `hide:` | The slide's frontmatter `clicks:` and `hide:` |
| `components/*.vue` | `components/*.tsx`, named exports, provided to every slide by name |
| `global-top.vue`, `global-bottom.vue` | `layers/above.tsx`, `layers/below.tsx` |
| `styles/index.css` (loaded by Slidev) | `styles/index.css`, starting with `@import "@steamfield/decks/kit/styles.css";` |
| `theme.json` | `theme.json`, installed by `setup.ts`: `installTheme(resolveTheme(theme))` from `@steamfield/decks/kit` |
| `data/`, `data-sources.md`, `public/` | Unchanged |

## Code

| Vue / Slidev | React / Decks |
| --- | --- |
| `reactive({ a: 0 })` driven by gsap | `useTween({ a: 0 })` from `@steamfield/decks/motion` |
| `useStage({ copy, enter, beats })` from `slidev-addon-decks/story` | the same call from `@steamfield/decks/kit` |
| `slidev-addon-decks/story`, `/chart-theme`, `/theme` | `@steamfield/decks/kit` |
| `useNav()`, `useSlideContext()`, `$renderContext` | `useDeck()`, `useSlide()` (`renderContext`) from `@steamfield/decks` |
| `computed` | compute in render |
| a template ref plus `defineExpose` | `useRef` plus `useImperativeHandle`; the Ink marks' handles (`GrowHandle`, `LineHandle`, ...) keep their names |
| named slots (`#stage`, `#overlay`, `#card`) | props holding nodes (`stage`, `overlay`, `card`) |
| `:style="{ opacity: String(s.x) }"` | `style={{ opacity: s.x }}`; keep an inline style an inline style |
| `<style scoped>` | a CSS Module beside the component |
| `vw`, `vh` in slide CSS | frame units (`calc(N * var(--sw))`) or `cqw`, `cqh` |
| UnoCSS utilities (`sr-only`, `flex`, ...) | not available; write the rule in a CSS Module |
| `html[data-od-story]`, `[data-od-nav]` in CSS | `html[data-deck-transition="story"]`, `[data-deck-nav]` |
| `<!-- notes -->` at the end of a page | `<Notes>...</Notes>`, `[click]` markers included |
| `<!-- lint-allow: id -->` on a line | `{/* lint-allow: id */}` on the same line |
| `routeEmbedNavigation` from `slidev-addon-decks/composables/embed-navigation` | `routeEmbedNavigation` from `@steamfield/decks` |
| `v-mark` (`v-mark.circle`, `v-mark.box`, ...) | `<Mark kind="circle" at={n}>` around the text; see [motion.md](motion.md) |
| a four-backtick `md magic-move` fence | the same fence; `{*}` emphasis becomes `{all}`. See [code-blocks.md](code-blocks.md) |
| `<Toc />`, `<Link to="5">` | `<Toc />`, `<Link to={5}>` (a number); see [slides.md](slides.md) |
| the bottom-left navigation controls and `g` | the control tray and `g`; see [presenting.md](presenting.md) |
| `slidev --remote` (presenter control from a phone) | `decks dev <deck> --remote`, a token-protected presenter page for a second device on the same network; see [presenting.md](presenting.md#remote-presenter) |

## Commands

`bunx -p slidev-addon-decks decks <cmd>` becomes `bunx -p @steamfield/decks decks <cmd>`. `dev`, `build`, `new`, `check`, `lint`, `export`, `shot`, `hook` and `init` exist, along with `film` and `inspect`, which the addon did not have (see [cli.md](cli.md)); `list`, `snap`, `snap diff`, `fact-extract` and `review-prose` do not yet. `decks.json` entries change from `{ "entry": "path/slides.md", "name": ... }` to `{ "dir": "path" }`.

## Checking a port

Capture the Slidev deck before you remove it (`snap` in the old package, with hidden slides shown), then compare each React frame against it. A frame that differs is a difference in the port: find it in the diff image rather than raising the threshold. Walk every slide forward and back as well, since frames do not show motion.
