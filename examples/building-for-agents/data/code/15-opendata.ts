/**
 * Slide 15: OpenData's MCP server. Read 2026-11-13 from ~/Projects/opendata
 * at commit d9b5ee7c4. Checked by excerpts.test.ts.
 *
 * The WORKFLOW line is cut after "enum values", before the source's dash;
 * the trailing … marks the cut.
 */
import type { Excerpt } from './types'

const base = { repo: 'opendata', commit: 'd9b5ee7c4', lang: 'ts' } as const

/** Every tool the server registers: one call each, fourteen of them. */
export const TOOL_REGISTRY: Excerpt = {
  ...base,
  path: 'mcp/src/tools/index.ts',
  start: 23,
  end: 36,
  code: `registerSearchDatasets(server, client, userId);
registerListCategories(server, client, userId);
registerGetDatasetInfo(server, client, userId);
registerFindRelatedDatasets(server, client, userId);
registerExploreGraph(server, client, userId);
registerGraphSubgraph(server, client, userId);
registerDescribeDatasets(server, client, userId);
registerQueryDataset(server, client, userId);
registerQuerySql(server, client, userId);
registerOpenchart(server, client, userId);
registerRequestDataset(server, client, userId);
registerSaveChartDraft(server, client, userId);
registerFetchQueryResult(server, client, userId);
registerPublishFigure(server, client, userId);`,
}

/** The instruction the server sends every client at initialize. */
export const WORKFLOW: Excerpt = {
  ...base,
  path: 'mcp/src/server.ts',
  start: 52,
  end: 62,
  code: `const SERVER_INSTRUCTIONS = [
  // …
  "WORKFLOW: search_datasets -> query_sql -> openchart. Top search hits already carry column schemas and enum values …
  // …
].join(" ");`,
}
