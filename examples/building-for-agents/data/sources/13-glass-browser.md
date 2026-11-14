## Slide 13: StatGlass in a browser tab

Read 2026-11-13 from `~/Projects/statglass` at commit `5db8622a`.

| Figure | Value | Source |
|---|---|---|
| DEMO_URL | `https://statglass.steamfield.io/demo/index.html?window=dashboard&scenario=multi-host` | `docs-site/src/lib/demo.ts`: `dashboardDemoUrl` (lines 44 to 56) and `KNOWN_SCENARIOS` (line 38); origin from `docs-site/astro.config.mjs` line 11. Fetched 2026-11-13: 308 to `/demo/?window=dashboard&scenario=multi-host`, then 200, with no frame-blocking header. |
| DEMO_LAYOUT_WIDTH | 1200 CSS px | a deck choice; the dashboard's minimum width is 1024 (`docs-site/src/lib/demo.ts` line 18) |
| "React code calls a Transport interface" with two implementations | | `src/core/transport/contracts.ts` lines 1 to 9; `src/core/transport/native.ts`; `createMockTransport` in `src/core/mock-transport.ts` line 99 |
| "A lint rule bans Tauri imports under src/app" | enforced | `biome.json`: `noRestrictedImports` overrides for `src/app/**`, `src/app/widgets/**` and the `src/app` tests each restrict the group `@tauri-apps/**`. `AGENTS.md` lines 49 to 53 state the rule and say a write hook enforces it too. |
| "Vitest, Playwright, the browser dev server and the docs site demo all use it" | | `src/core/transport/contracts.ts` lines 4 to 5 (dev server, Vitest, Playwright); `docs-site/src/lib/demo.ts` lines 1 to 6 and `docs-site/scripts/build-demo.mjs` (the demo is the app built on its mock transport) |
| Code: the `Transport` interface | lines 121 to 471, trimmed | `src/core/transport/contracts.ts`, through `data/code/13-glass-browser.ts` (drift test) |
| "I can change a screen in a browser without starting the native shell" (notes) | | follows from the dev server using the mock. The outline's stronger "I do most UI work in a browser" is `FLAG: author-reported` and is not in the notes. |

Open decision for Riley: the frame loads the hosted demo, so the beat needs venue network. No copy of the demo build is checked in.
