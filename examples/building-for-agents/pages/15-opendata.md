<!--
SLIDE 15 · OPENDATA: an MCP server in TypeScript whose chart result carries text for the model and rows for the interface
-->

<OpenDataStage />

<!--
ABOUT THIS SLIDE
The monitor on the left replays the first turn of the OpenData session shown on steamfield.io, whose queries ran on November 4. The code on the right is quoted from OpenData's MCP server. The diagram that replaces it is a schematic of one chart result. The chart on the last beat is drawn from eight rows of the session's query result.
Source: data/sources/15-opendata.md.

SAY (opening)
OpenData is a catalog of public data sources that an agent can search and query with SQL. The query engine is Python and DuckDB. The part an agent talks to is an MCP server written in TypeScript, running on Bun with Hono. The code on the right is the server's tool list, one register call per tool, fourteen in total. The model can call eleven of them. The last three are marked app only, so the chart interface can call them and the model is never shown them.

[click] When a client connects, the server sends it a block of instructions, and the highlighted line sets the order of tool calls: search, then SQL, then chart. The same line says search results already include column schemas, so the model can write SQL without a describe call first. In the recorded session on the left the model made one search and one query, and the query returned fifty-one rows in eleven milliseconds. I tune these instructions from transcripts of real sessions.

[click] The model then calls the chart tool, and its result has three fields. Content is text, which the model reads. Structured content holds the chart spec and the first twenty-four rows. The rows the chart is drawn from, up to a hundred and twenty, are in underscore meta, which the host passes to the interface and keeps out of the model's context. Query results are limited the same way, to sixty rows for the model.

[click] The interface is a React app that the server publishes as a ui resource, and the host loads it in an iframe inside the conversation. The eight bars are rows from the query on this slide, the eight jurisdictions that query labels PJM-core. OpenChart draws the chart.

IF ASKED
Why keep rows out of the model's context? Rows cost tokens. The model needs enough text to describe the result, and the chart needs all of its rows.
What if a host drops underscore meta? The interface draws from the twenty-four rows in structured content.
Are the sources all government? No. A few providers are not government agencies, so I say public data sources.
-->
