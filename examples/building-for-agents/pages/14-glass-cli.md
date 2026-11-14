<!--
SLIDE 14 · GLASS CLI: an agent reads StatGlass history through the statglass CLI, and why that CLI is Rust
-->

<GlassCliStage />

<!--
ABOUT THIS SLIDE
The terminal is an illustrative session that nobody recorded. The history output and the error envelope are the exact strings the CLI's tests assert. The output of now is made-up values in the real JSON shape, wrapped at 100 columns the way a terminal would wrap it. The quote on the last beat is plan/rfc-agent-cli.md, lines 106 to 109, word for word.
Source: data-sources.md, Slide 14.

SAY (opening)
StatGlass ships a command-line tool named statglass that a coding agent can run. It asks the running app for readings and recorded history over a local socket. In this session the agent runs now with the all flag and gets the latest CPU reading for both hosts as JSON. Then it runs history for cpu.total on m1-linux over the last three hours. The text output is three lines: the range and bucket size, then the minimum, mean, maximum and last value, then the gaps. CPU on that host reached 97 percent in the minute from 15:12.

[click] The third line of the history output says the host was offline from 14:31 to 14:37. StatGlass stores gaps explicitly, and the CLI prints each one with its cause. The command below it failed because the app was busy. With the json flag an error is one JSON object with a tag, a message, whether a retry can work, and a next field that says what to do. The Stacks CLI's errors have the same tag, retryable and next fields.

[click] This CLI is written in Rust, and Stacks and foreman are TypeScript. The RFC on screen gives the reasons. A TypeScript CLI compiled with bun build --compile was estimated at 55 to 60 megabytes per architecture, and the whole app is 36. It would also need the JIT entitlement under the hardened runtime, and it would repeat by hand the types Rust already defines. The same RFC defers an MCP server and says it could be a TypeScript package.

IF ASKED
How big is the CLI binary? I have not measured it. The 550 KB in the quote is the helper binary next to it.
Which commands does it have? guide, hosts, now, metrics, history, events, top, doctor, schema and skill.
-->
