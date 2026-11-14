<!--
SLIDE 13 · GLASS BROWSER: the UI calls an interface, so the same React code runs on a mock in a browser
-->

<GlassBrowserStage />

<!--
ABOUT THIS SLIDE
The left side is a schematic of the two Transport implementations. The code is the Transport interface from src/core/transport/contracts.ts, trimmed where a line reads only as three dots. On the second beat the frame holds the hosted StatGlass demo in an iframe: the real React app on its mock transport, with the multi-host scenario and simulated readings. It needs a network connection, and it loads only in the slide view. Clicking inside the frame moves keyboard focus into it, so click the slide outside the frame before pressing an arrow key.
Source: data-sources.md, Slide 13.

SAY (opening)
The React code under src/app calls an interface named Transport for everything it reads or writes. There are two implementations. The Tauri one calls the generated bindings and opens a Channel for each live subscription. The mock one is a fake backend written in TypeScript that produces readings in the browser. A Biome rule fails the lint if a file under src/app imports from the Tauri packages. The pane shows two of the interface's methods: getHost is a request, and subscribeLive takes a callback for the stream.

[click] This is the StatGlass dashboard loaded from the docs site, running on the mock transport with a scenario that has several hosts. It is the React code the native app ships, and the mock simulates the numbers. Vitest and Playwright use the mock too, and so does the dev server, so I can change a screen in a browser with hot reload without starting the native shell.

IF ASKED
Is the frame live? Yes. Timeline and Hosts are in its sidebar.
-->
