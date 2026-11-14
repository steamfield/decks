# Slidev features react-decks does not have

Compared against https://sli.dev/features on 2026-11-14, plus the core Slidev features that
page does not list (layouts, the go-to dialog, `Toc`, `Link`). The original parity table
(`parity.md`) only covers what this repo's ten decks use; this file covers what other
Slidev users would miss. Nothing here is scheduled. "Build" items are candidates for
follow-up work; "Recipe" items work today or nearly so through the React ecosystem and need
documentation and a fixture, not framework code; "Not planned" items were left out on
purpose.

## Build

| Gap | Slidev feature | Why it matters here | Rough size |
| --- | --- | --- | --- |
| Deck-supplied MDX plugins | (implicit in Slidev's markdown-it and Vite setup) | `deck.config.ts` has `vite` but no way to add remark or rehype plugins, and the framework owns the MDX plugin. This blocks most of the Recipe list below (math, diagrams, code highlighting chosen by the deck). Add `mdx: { remarkPlugins, rehypePlugins }`. | Small |
| Code blocks | Shiki highlighting, line numbers, max height, line highlighting by click, code groups, import code snippets | A fenced code block in a slide renders as unstyled `<pre>` today. Any technical talk needs highlighting, and click-driven line highlighting is one of Slidev's most used features. It fits the step model: a `<Code>` component with `steps` ranges on `data-step-state`. | Medium |
| Code morphing | Shiki Magic Move | The Slidev feature people show off. `shiki-magic-move` has a framework-neutral core and a React renderer; it belongs in the motion package next to `Morph`. | Medium |
| Hand-drawn marks | Rough Markers (`v-mark`) | Underline, circle, box, strike-through and bracket drawn on a click. `Highlight` covers only the marker sweep. Rough Notation is framework-neutral; these would be step primitives (`<Mark kind="circle" at={2}>`). | Small |
| Global layers | Global Layers (`global-top`, `global-bottom`, per-slide layers) | Elements that persist across slides: a logo, a progress bar, a footer, a background that does not transition with the slide. The kit needs one for its credit layer, so the framework should own the mechanism (`layers/` in a deck or theme, rendered outside the transitioning slide). | Small |
| Layouts | Built-in layouts (`two-cols`, `image-right`, `center`, `cover`, `section`, ...) and slot sugar | Dropped because the decks here use one layout and CSS classes. A deck written from scratch by an agent benefits from a few named layout components (`<TwoCol>`, `<Center>`, `<Cover>`) more than from CSS it has to invent. Belongs in the default theme. | Small |
| Agent tooling | MCP server (inspect, edit, reorder, navigate slides) | The product pitch is decks made by agents. An MCP server over the manifest and `shot`/`film` output would let an agent see and drive a running deck without a browser tool. Depends on Phase 5 tooling. | Medium |
| Go-to dialog and navigation components | `g` go-to dialog, `<Toc>`, `<Link to>`, slide number components | Small presenter conveniences. `useDeck()` already exposes what they need. | Small |
| Zoom and scale helpers | `zoom` frontmatter, `<Transform>` | Scaling one slide's content, or one block, without touching CSS. | Small |
| PDF and images at build | Generate PDF when building, PNG export | `decks export` is planned (Phase 5). Emitting the PDF into the built site, and a per-slide PNG export, are small additions on top. | Small |
| Open Graph image | Open Graph Image | SEO meta tags are planned with the entry plugin; generating the image from slide 1 with `shot` is the missing piece. | Small |

## Recipe (ecosystem, needs docs and a fixture)

| Slidev feature | In react-decks |
| --- | --- |
| LaTeX (KaTeX) | `remark-math` + `rehype-katex`, once decks can add MDX plugins. |
| Mermaid, PlantUML diagrams | A `<Mermaid>` component from the ecosystem, or a remark plugin. Stepping a diagram is where a kit component would add value later. |
| Icons | Any React icon package, imported in a deck component. No auto-import by name. |
| Comark/MDC syntax, Slot Sugar | MDX and React props cover what these exist for. |
| Slide scope styles | A CSS Module beside a deck component, or a `<style>` element in the slide. |
| Slide hooks | `useSlide().isActive` in an effect. |
| Navigation direction variants | `html[data-deck-nav="forward"|"backward"]`, during transitions. |
| TwoSlash | A Shiki transformer, once code blocks exist. |
| Embeds (YouTube, tweets) | Ordinary React components. |
| Prettier plugin | Prettier formats MDX already. |

## Not planned

Left out deliberately; each would be reconsidered if someone asks for it.

| Slidev feature | Why not |
| --- | --- |
| Drawing and annotations | A sizeable subsystem (drauu, persistence, sync) that no deck here uses. The most likely of this list to be asked for by live presenters. |
| Recording and camera view | Screen recorders do this better. |
| Remote access (tunnel, control from a phone) | Sync is same-browser only by decision. Cross-device control would need a server relay. |
| Monaco editor, runner, writable editor | Heavy, and live coding in slides is a niche. |
| Integrated editor, VS Code extension | Authoring here is by agent or in the user's own editor. |
| Draggable elements (`v-drag`) | An authoring aid that writes positions back to source. |
| PWA / offline, bundle remote assets | A built deck is already static; offline caching can be added by a deck through Vite. |
| PPTX export | Slides would export as images, which loses what makes them worth exporting. |
| Dark-mode toggle | Themes here are dark by design; a theme can add a second scheme. |
| Eject theme, block frontmatter, frontmatter merging, notes auto ruby | Tied to Slidev's file model or to needs this project does not have. |

## Already covered

Canvas size, click markers in notes, presenter timer, presenter view, overview, importing
slides (one file per slide is the model), per-click animation (`Step` and friends),
shared-element transitions (`Morph`), slide transitions, static build, speaker notes, wake
lock, keyboard navigation, reduced motion.
