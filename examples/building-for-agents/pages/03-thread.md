<!--
SLIDE 3 · THE THREAD: the seven products as stations on one road, in the order work flows through them
-->

<ThreadStage />

<!--
ABOUT THIS SLIDE
A schematic. The seven stations are the seven products in the order I use them on one change, which is also the order of the rail along the bottom of every later slide.
Source: data/sources/03-thread.md.

SAY (opening)
These are the seven tools, in the order I use them on one change. I start a project with Stacks, delegate work with foreman, run the tests on other machines with rr and watch those machines with StatGlass. Then I query data with OpenData, chart it with OpenChart and present it with Decks. I built each one for my own work, and most of them started inside OpenData, whose test suite is about fourteen thousand tests.

[click] Six of the seven use TypeScript. Stacks and foreman are TypeScript with Effect, and rr is Go. StatGlass samples the system in Rust and draws its interface in TypeScript, and OpenData has a Python engine behind a TypeScript server.

[click] Stacks, foreman and StatGlass get several slides tonight, with the source code on screen. The other four get about ninety seconds each. The same seven are listed along the bottom of every slide, with the current one marked.

IF ASKED
Are they all open source? Six of the seven are. OpenData is open core.
Where does fourteen thousand come from? It is the figure published on rr's site and in the Steamfield launch post.
-->
