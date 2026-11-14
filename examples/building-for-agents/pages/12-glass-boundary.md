<!--
SLIDE 12 · GLASS BOUNDARY: where Rust stops and TypeScript starts in StatGlass, and how one sample gets across
-->

<GlassBoundaryStage />

<!--
ABOUT THIS SLIDE
A schematic of the StatGlass repo. Rust crates are on the left, the TypeScript layers on the right, and the generated bindings file is between them. The bar is line counts at commit 5db8622a, with tests and generated code included. The chart inside the widget box uses made-up values. The code is quoted from the files named above each pane.
Source: data-sources.md, Slide 12.

SAY (opening)
StatGlass is a Tauri app, and 58 percent of its lines are Rust. The Rust crates sample the machine, keep the last hour in a ring buffer, write history to SQLite, talk to remote hosts over SSH and draw the menu bar item. TypeScript is the React UI in the popover and the dashboard. The repo has a written rule that Rust decides what a value means and the client formats and draws it.

[click] The two sides share one generated file. Each Rust command carries a specta attribute, and tauri-specta writes a typed TypeScript function for it into bindings.ts. The top pane is subscribe_live in Rust. The bottom pane is the line generated from it, with the same five arguments in camel case. That file has 92 commands and 10 events, and a pre-push hook regenerates it and fails if the committed copy differs.

[click] Live samples reach the UI over a Tauri Channel, which is a stream that a command gives to the webview. The engine sends one frame message per tick. A frame holds a timestamp and an array of numbers, and an earlier layout message says which series each position in the array belongs to, so the series names are sent once per layout and the frames stay small.

[click] In TypeScript a reducer applies each message to the host's state, a zustand store holds that state, and each widget subscribes to the part it draws. A test counts renders to check that a CPU change leaves the memory card alone. The chart path is computed with d3 and rendered by React as SVG. When a tick arrives the chart is redrawn one slot over, and this animate call slides it back to its resting position, so only the transform animates.

[click] With no window open, Rust stops sending frames to the webview and the engine samples every two seconds. The menu bar item is the only thing still drawn, and Rust draws it as a bitmap. In that state the app used 0.67 percent of one core and about 105 megabytes. That is one 120-second run on my M3 Max in October, on a machine that was also running builds, taken before remote monitoring existed.

IF ASKED
Do the line counts include tests? Yes. Inline Rust tests, TypeScript tests and the generated bindings are all counted.
-->
