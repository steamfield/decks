# Agent Experience deck — data provenance

Every number and quote on a slide maps to a real artifact: a repo file, a commit, a
published article, or a cited paper. This is the fact-check input.

## Slide 2 — The lineage (external framing)
- UX -> DX -> AX and "every product has an agent experience": Mathias Biilmann, Netlify,
  "Introducing AX" (Jan 2025) and "One Year of AX". Cite as external framing, not our claim.
- "AX extends DX, it doesn't replace it": a16z, Martin Casado, "Agent Experience" podcast.
- Human-vs-agent contrast rows are framing, not measured. "Carries no memory unless you give
  it some" deliberately hedged (context windows / memory tooling exist).

## Slide 3 — The method
- The task, the watch-then-post-mortem loop, and the SQL-quoting quote:
  blog/src/content/blog/designing-an-api-for-llms.mdx (the article's own blockquote,
  "~10-15% of queries fail on first try", suggested fix = parameterized `?` + params).
- Post-mortem as a method: the `ce:post-mortem` Claude Code skill.
- "3 rounds": article description + body ("We ran three rounds of this in one afternoon").
- n=1 honesty + non-determinism line ("whole CATEGORIES of calls vanish"): grounded in the
  round-2 design doc (2026-03-29), which shows /columns and /views
  categories going to 0, not scattered single-call savings.
- FLAG: "interview the agent" is presented as our named practice, not a citation. Anthropic's
  evaluate/collaborate loop is the nearest prior art; we're extending it, not claiming to invent.

## Slide 4 — The result (all measured on ONE research task, labeled as such)
- 72 -> 8 calls / -89%: designing-an-api-for-llms.mdx hero figure + prose ("Actual was 89%").
  SOURCE-LINE CAVEAT on slide: in-repo round-2 snapshot recorded 72 -> 9; better sampling
  removed the last schema probe (round-2 design doc).
  KNOWN: the article itself is internally inconsistent (87% in the takeaway table vs 89% in
  the hero). Slide shows only 89% to match the hero; do not cite 87% alongside it.
- ~45% fewer tokens: article line 401 + the round-2 fix commit body ("~45% token savings").
- 21 schema-inspection calls -> 0: round-2 doc table, /columns ~13 -> 0 and /views ~8 -> 0
  (13 + 8 = 21). Decomposable and traceable.
- 7 fixes, one commit "feat(api): implement agent feedback round 2 improvements —
  Address all 7 findings from the agent feedback evaluation" (2026-03-29).

## Slide 5 — Section divider (no data)
- Pure transition into the build half. "Four rules" counts the four cards on slide 6;
  "one of them is the error path" points at slide 7. No new claims, nothing to check.

## Slide 6 — Design rules (each code-anchored)
- Batch discover + server-side dedup + join hints: backend/backend/api/discover.py:154.
- Enriched self-describing discover (value_range, sample_values, distinct_count, unit inline):
  backend/backend/schemas/discover.py, DiscoverColumn (line 25).
- Parameterized `?` + params array: backend/backend/api/sql_query.py placeholder counting +
  binding; request field backend/backend/schemas/sql_query.py:11.
- "contracts between deterministic systems and non-deterministic agents": Anthropic,
  "Writing effective tools for AI agents".
- Columnar default: backend/backend/schemas/sql_query.py:22 (Field(default="columnar")).
  ~45% figure hedged to "flat tabular data" (columnar wins only on uniform tables).

## Slide 7 — Errors as an interface
- PARAM_COUNT_MISMATCH + verbatim hint: backend/backend/api/sql_query.py:78-79
  (has passing tests: backend/tests/api/test_sql_query.py:1508/1530/1588).
- Unknown-column self-correction (appends real column list): enrichBinderError,
  mcp/src/core/sql.ts.
- REST-ism rewrite ("Call get_dataset_info..."): rewriteRestisms, mcp/src/tools/error.ts.
- Corroboration only (demoted per devil's advocate): Siemens "Self-Reflective APIs",
  arxiv 2606.05037. Machine-readable recovery hints beat prose errors on Claude models.
  Precise +37-40pp / 0-of-9 -> 7-of-9 kept OFF the slide face (single preprint, one task,
  Claude-specific); slide says only "by a wide margin on Claude models."

## Slide 8 — Section divider (no data)
- Second movement break: slides 3-7 are what agents fail at, slides 9-10 are what they're
  good at. "The clean runs said something too" summarizes the same transcripts cited on
  slide 3; no new claims, nothing to check.

## Slide 9 — OpenChart, config over code
- "JSON is the native output format of LLMs... generate it directly... without imperative
  drawing code": blog/src/content/blog/openchart-is-now-open-source.mdx:485.
- Declarative ChartSpec shape ({mark, encoding, chrome}): mcp/src/tools/openchart.ts
  (Zod mirror) + mcp/src/core/types.ts. The spec shown is illustrative but structurally real.
- Microsoft YAML/JSON declarative agents: Microsoft Agent Framework docs (one nod; PayPal
  dev-time numbers cut per devil's advocate as the pitchiest, weakest-sourced claim).

## Slide 10 — Closing
- "Loop is still running / logs every failed call": the validation observer in
  mcp/src/server.ts (installValidationObserver) logs input-validation failures to the logging pipeline,
  tagged INPUT_VALIDATION, so the next round starts with data. Later AX passes shipped
  2026-07-02 and in "AX wave 2".
- QR code points at https://example.com/write-up, standing in for the article this
  talk is built on (blog/src/content/blog/designing-an-api-for-llms.mdx, slug from
  blog/src/pages/[slug].astro). Regenerate with:
  The QR is rendered at runtime by `OdQrCard url=` (uqr); no committed SVG.

## Refresh notes (Aug 2026 visual pass)

Deck went from 8 slides to 9. Copy and claims are unchanged except where noted below;
every anchor above still resolves.

- Added slide 5, a section divider, at the break between "what the agent told us"
  (slides 2-4) and "what we shipped" (slides 6-8). No data on it.
- Slide 4 stays od-stats + RollingNumber. Decision: NO before/after bar chart. The two
  count metrics (72 -> 8 calls, 21 -> 0 schema calls) are already the two largest numbers
  on the slide, so four bars would restate them without adding a comparison, a trend, or a
  distribution. It would also crowd out the sourcing caveat, which is the honest part of
  the slide. Revisit only if a future round adds a third comparable count metric.
- Slide 7 is now click-driven: the three error cards step in on clicks 1-3 via
  useScriptedDemo (manifest declares `clicks: 3`). Card content and wording unchanged.
- Slide 8's ChartSpec block moved inside a tool-call card (now the deck-local
  `ToolCallCard.vue`)
  (server `opendata`, tool `openchart`), which matches how an agent actually emits the
  spec. The spec text itself is unchanged and still illustrative-but-structurally-real.
- Slide 9 close now uses the shared QR pattern (OdQrCard). Closing line unchanged.
- Deck CSS dropped the `od-kv-grid` class from `.ax-rules` / `.ax-errors` (both fully
  overrode it) and the card chrome from `.ax-spec` (ToolCallCard provides it). The loop
  diagram on slide 3 is deck-specific and stays as is.

## Review pass (Aug 2026)

Deck went from 9 slides to 10. No number on a slide changed; all anchors above still resolve.

- Added slide 8, a second section divider, at the fail-mode -> strengths break. Old slides 8
  and 9 became 9 and 10 (files renamed to match). Every footer now reads `NN / 10`.
- Slide 2's era table is now a horizontal three-era timeline (same content: 1993 UX,
  2011 DX, 2025 AX), and its Biilmann/Casado citation moved from mid-column to the standard
  source slot above the footer.
- Slide 6: the Anthropic "contracts between deterministic systems and non-deterministic
  agents" line moved off the string-hazards card into the slide source row. Same citation
  (Anthropic, "Writing effective tools for AI agents"), same wording, different position.
- Slide 1 byline is now `Your Name · Your role · August 2026`. The old
  "Data: OpenData's own MCP server, API, and OpenChart" row is dropped from the slide face;
  that provenance is this file.
- Slides 9 and 10 got copy rewrites (headline, closing lede). No new factual claims.
