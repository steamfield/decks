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
| Agent tooling ([steamfield/decks#8](https://github.com/steamfield/decks/issues/8)) | MCP server (inspect, edit, reorder, navigate slides) | The product pitch is decks made by agents. An MCP server over the manifest and `shot`/`film` output would let an agent see and drive a running deck without a browser tool. Depends on Phase 5 tooling. | Medium |
| Zoom and scale helpers ([steamfield/decks#10](https://github.com/steamfield/decks/issues/10)) | `zoom` frontmatter, `<Transform>` | Scaling one slide's content, or one block, without touching CSS. | Small |
| PDF and images at build ([steamfield/decks#11](https://github.com/steamfield/decks/issues/11)) | Generate PDF when building, PNG export | `decks export` is planned (Phase 5). Emitting the PDF into the built site, and a per-slide PNG export, are small additions on top. | Small |
| Remote presenter ([RFC 0009](rfcs/0009-remote-presenter.md)) | Remote access (control from a phone) | A demo talk mirrors the screen to show an editor and a browser, which leaves no private display for the presenter window. Notes and control from an iPad or second laptop, through a token-gated relay beside the loopback dev server. | Medium |

## Recipe (ecosystem, needs docs and a fixture)

| Slidev feature | In react-decks |
| --- | --- |
| LaTeX (KaTeX) | `remark-math` + `rehype-katex` through `mdx` in `deck.config.ts` (`e2e/mdx-plugins.spec.ts` does this). |
| Mermaid, PlantUML diagrams | A `<Mermaid>` component from the ecosystem, or a remark plugin. Stepping a diagram is where a kit component would add value later. |
| Icons | Any React icon package, imported in a deck component. No auto-import by name. |
| Comark/MDC syntax, Slot Sugar | MDX and React props cover what these exist for. |
| Slide scope styles | A CSS Module beside a deck component, or a `<style>` element in the slide. |
| Slide hooks | `useSlide().isActive` in an effect. |
| Navigation direction variants | `html[data-deck-nav="forward"|"backward"]`, during transitions. |
| TwoSlash | A Shiki transformer on the code blocks. |
| Embeds (YouTube, tweets) | Ordinary React components. |
| Prettier plugin | Prettier formats MDX already. |

## Not planned

Left out deliberately; each would be reconsidered if someone asks for it.

| Slidev feature | Why not |
| --- | --- |
| Drawing and annotations | A sizeable subsystem (drauu, persistence, sync) that no deck here uses. The most likely of this list to be asked for by live presenters. |
| Recording and camera view | Screen recorders do this better. |
| Remote access through a tunnel, or the whole dev server on the network | It would expose the dev server and switch off the live terminal. Control from a phone on the LAN is under Build (RFC 0009). |
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
lock, keyboard navigation, reduced motion. Five gaps this file first listed under Build have
shipped since; their rows moved to `archive/feature-gaps-shipped.md`.
