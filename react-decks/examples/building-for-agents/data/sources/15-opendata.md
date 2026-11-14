## Slide 15: One OpenData result has text and a chart.

The session is the first turn of steamfield.io's scripted OpenData session, copied 2026-11-13 from `~/Projects/steamfield` (commit 1b001f9). The server figures were read 2026-11-13 from `~/Projects/opendata/mcp` (commit d9b5ee7c4).

| Figure | Value | Source |
|---|---|---|
| RECORDED | 2026-11-04 | `steamfield/src/data/opendata-demo.ts` `checked`; the file's header says its figures are "from live queries through the OpenData connector on 2026-11-04" |
| QUESTION | "Are AI data centers driving up electricity bills?" | `steamfield/src/lib/opendata-demo.ts` `QUESTIONS[0]` |
| SEARCH_TERMS, SEARCH_MATCHES | 3 terms, 3 datasets found | `opendata-demo.ts` `searchTerms`, `searchMatches` |
| QUERY_ROWS, QUERY_MS, QUERY_COLUMNS | 51 rows, 11 ms, five columns | `opendata-demo.ts` `pricesQuery.rows.length`, `.ms`, `.columns` |
| PJM_ROWS (two shown in the transcript, eight in the chart) | D.C. 70.3, Maryland 55.2, New Jersey 40.9, Ohio 32.3, Pennsylvania 30.2, Delaware 30.1, Virginia 24.2, West Virginia 17 | `opendata-demo.ts` `pricesQuery.rows` where `grid` is `PJM-core`, in returned order |
| CHART_TITLE | "Bills rose fastest on the PJM grid" | `steamfield/src/lib/figures.ts` line 352 |
| The chart on beat 3 | eight bars, percent change since 2022 | drawn by this deck's `<OpenChart>` from PJM_ROWS. The session's own chart adds a ninth bar, the mean of the other 43 states, which this slide leaves out |
| TOOLS_REGISTERED | 14 | `opendata/mcp/src/tools/index.ts` lines 23 to 36: fourteen register calls, quoted on the slide; each tool file has exactly one `registerAppTool(` call |
| TOOLS_APP_ONLY, TOOLS_FOR_MODEL | 3 and 11 | `grep -l 'visibility: \["app"\]' mcp/src/tools/*.ts`: save-chart-draft, fetch-query-result, publish-figure |
| "on Bun and Hono" | claim | `opendata/mcp/package.json`: `"start": "bun run src/index.ts"`, `"hono": "^4.12.18"` |
| "a Python and DuckDB engine" | claim | `opendata/pyproject.toml` (the engine); `mcp/src/server.ts` line 57, "DuckDB SQL" |
| WORKFLOW instruction line | quoted from its start to "enum values", then cut with … | `opendata/mcp/src/server.ts` line 54, inside `SERVER_INSTRUCTIONS` (lines 52 to 62). The cut drops the rest of the line, which contains a dash (Riley, 2026-11-13) |
| MODEL_ROW_BUDGET (notes) | 60 rows | `opendata/mcp/src/core/constants.ts` line 4; applied in `tools/query-sql.ts` lines 116 to 120 |
| CHART_SAMPLE_ROWS | 120 rows in `_meta` | `opendata/mcp/src/tools/openchart.ts` line 29; sent at lines 417 and 435 to 437 under the key `opendata/chartRows` |
| CHART_MODEL_SAMPLE_ROWS | 24 rows in structuredContent | `openchart.ts` line 32; line 418 |
| "which the host shows only to the interface" | claim | `openchart.ts` lines 26 to 28 and `core/view-data.ts` lines 387 to 392: hosts hand `_meta` to the App and keep it out of model context. The 24-row sample in structuredContent is one "hosts may show the model", so the notes say so |
| CHART_RESOURCE | `ui://opendata/chart` | `openchart.ts`, the tool's `_meta.ui.resourceUri`; listed in `server.ts` line 13 |
| "A React app" | claim | `opendata/mcp/src/mcp-app/main.tsx` imports React; `mcp/package.json` `"react": "19.2.8"` |
| "The host loads it in an iframe" | claim | the MCP Apps host model (`@modelcontextprotocol/ext-apps` 1.7.5 in `mcp/package.json`); `mcp/src/mcp-app/index.html` is the page served for the `ui://` resources |
| Notes: "a few providers are not government agencies" | claim | `FLAG:` from `OUTLINE.md` section 10, slide 15; not re-derived here |
| Notes: "I tune these instructions from transcripts" | claim | `FLAG: author-reported` (`OUTLINE.md` section 10, slide 15, beat 1) |

Departures from the outline: the catalog size (1,046 datasets, 214 providers) is not stated anywhere on the slide or in the notes, so it has no row.
