<!--
SLIDE 16 · OPENCHART: a chart spec, the validator's verdict on a misspelled field, and the rendered chart
-->

<OpenChartStage />

<!--
ABOUT THIS SLIDE
The spec on the left is the bar chart from OpenChart's README, printed as JSON with the data rows and the chrome block dropped. The middle tile is what the engine's validateSpec returned for it in this browser when the slide loaded. The chart on the right is the same spec drawn by the Vue wrapper.
Source: data/sources/16-openchart.md.

SAY (opening)
OpenChart is the charting library OpenData uses. A chart is a JSON object, and this one is the bar chart from the README. It names a mark, bar, and maps the popularity column to x and the language column to y. The engine computes scales, tick labels and layout from that. Because the chart is data, it can be validated before anything is drawn.

[click] In this spec the y field is misspelled as langauge. The tile in the middle shows what validateSpec returned for it when this page loaded. The path is a JSON Pointer to the field, the code is a fixed string an agent can match on, and the suggestion lists the data's columns and proposes the closest one by edit distance. The validator is about thirty-four hundred lines of TypeScript and uses no schema library.

[click] With the field spelled language, validateSpec returns valid with no errors, and the Vue component draws the chart on the right from the same object. The spec is also published as a JSON Schema file. That file is generated from the TypeScript types, and CI fails when it is out of date.

[click] OpenChart is six packages, and the bars show how many lines of TypeScript each has, excluding tests. Core holds the types and the theme. The engine is the largest at about fifty thousand lines; it validates specs and computes layout, and it has no DOM code. Vanilla draws the engine's layout to the DOM, and it can also render SVG on a server. The React, Vue and Svelte packages wrap vanilla, and the React package is about five percent of the engine's size. The spec type has nineteen marks.

IF ASKED
Is there a CLI or an MCP server for OpenChart? No. It is a library, and agents reach it through OpenData's MCP server.
Which version is this? 9.0.0.
-->
