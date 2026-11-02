# OpenData story pitch deck: data provenance

Every number, chart, and status claim on a slide maps to a real artifact: a repo file,
a dataset query, a published article, or a named document. This is the fact-check input.

Deck: `examples/opendata-pitch/` · 13 visible slides · generic pitch, figures current as of
2026-09-10.

Slide order, as `slides.md` renders it (2026-09-19): cover, thesis, ISBE files, scale and
the graph, pipeline, case-study divider, districts, benchmark, platform, model, bootstrap,
signals, close. The benchmark slide (6d) was added 2026-09-19, after the districts slide:
the case study says they had the data and could not get at it, and the benchmark says what
an agent does when the catalog is there. Two changes on 2026-09-13: 5b (Parquet) is
hidden, because three build slides in a row
before the case study was one too many; and 5c (Bootstrap) moved to sit after the model,
where it reads as the capital-efficiency proof for the tier ladder rather than as a third
infrastructure slide. Both are `hide: true` / manifest order in `slides.md`, so the
sections below keep their original 5a/5b/5c/6/6a/6b/7/8/9 names.

How to fact-check it: read the slide's section below, run the query or open the file it
names, and compare the result with what the slide renders. Every figure that comes from a
committed `data/*.ts` file is computed from that file at build time, so checking the file
checks the slide. The exceptions, typed by hand, are the founder-stated figures each
section flags.

---

## Numbers refresh (2026-09-10)

Everything that moved between the August deck and this one, with where the new value came
from. The left column is the figure as the previous deck stated it.

| Item | Old | New | Provenance |
|---|---|---|---|
| datasets | 570 | 969 | `GET api.tryopendata.ai/v1/stats`, `totalDatasets` |
| agencies | 104 | 203 | same call, `totalProviders` |
| rows | 599.7M | 1.6B | same call, `totalRows` = 1,600,512,820 |
| added this week | +22 | dropped | too volatile to put on a slide |
| Illinois corpus | 28 yrs / 29 files | 29 yrs / 29 files | `isbe/report-card:all`, MIN/MAX year 1997-2025 |
| graph | 630 / 2,135 (07-24) | 952 ready nodes / 3,291 edges rendered, 963 / 3,371 raw, +51% / +54% in seven weeks | `/v1/graph/subgraph` on 2026-09-10, header of `data/graph-data.ts`; July figures from `data/graph-data-2026-07.ts` in git history (file deleted 2026-09-13, `JULY_NODES`/`JULY_EDGES` in `data/catalog-totals.ts`) |
| STAAR / SAT | 2024-25 / Class of 2024 | unchanged, still the newest published | `tea/staar-accountability`, `tea/sat-act-campus` |
| AccuWeather / GovWin | $225M / $12K-42K | unchanged | founder's business notes |
| MCP clients | Claude, ChatGPT, Cursor | Claude, ChatGPT, Cursor, VS Code | `frontend/app/routes/docs/mcp.tsx:20` |
| byline | August 2026 | September 2026 | deck decision |

The graph row is the one to read carefully. The raw subgraph has 963 nodes and 3,371
edges; the deck renders the 952 whose `status` is `ready`, and the 3,291 edges whose
endpoints both survive that filter. Growth against July's 630 / 2,135 is therefore
+51% and +54%, not the +53% / +58% an unfiltered comparison gives.

---

## Slide 1: Cover

- "Works inside Claude, ChatGPT, Cursor, and VS Code": the MCP server at `mcp/` is deployed
  and reachable at the production Streamable HTTP endpoint. Claude and Cursor connect via
  standard MCP config; ChatGPT via its connector flow (Clerk DCR, see `mcp/` auth setup);
  the VS Code client is listed at `frontend/app/routes/docs/mcp.tsx:20`. Claude Code has no
  source, so it is omitted.
- The stage behind the cover is the catalog graph, the same snapshot slide 4 renders
  (`opendata-pitch/data/graph-data.ts`), at slide 4's zoom, dimmed and orbiting. It
  is backdrop here: no figure on the cover is read off it.
- No figures on this slide.

## Slide 1a: Thesis

- Divider in cover chrome, no figures. Eyebrow "Thesis" (was "Why now" until 2026-09-13;
  the eyebrow labels what the slide is, and the why-now is the whole deck), title "Agents
  can query any data that is clean and in a database. Almost no public data is.", lede
  "Clean it once, link it to everything like it, and put one query layer on top."
  (rewritten 2026-09-13 from a 25-word sentence; the three clauses are the same three
  claims). Added
  2026-09-10 so the deck states its claim before the ISBE input problem on slide 3. "Almost
  no public data is" restates the cover lede ("almost none arrive in a shape an agent can
  query"), which is a founder claim, not a measured share.

## Slide 3: Unit chart: twenty nine unlabeled files become one clean dataset

- Headline "Twenty-nine files became one dataset." (shortened twice on 2026-09-13, from
  "Twenty-nine unlabeled files, converted into one clean dataset." and then from
  "Twenty-nine unlabeled files became one dataset."). It carries `is-wide`, so it is one
  line by construction rather than by luck; "unlabeled" is dropped because the card lead
  under it already says "No headers".
- The sheet field is two rows of fifteen and fourteen, not three of ten (changed
  2026-09-13). At three rows the raw-row panel covered the middle row and clipped the
  1997/2025 year labels.
- Bottom band, two columns (2026-09-13): the prose card holds the left column and the
  code block the right one (`CODE_COL` in `FilesToRowStage.vue`), both on the same floor
  and at the same height, so the raw row can never run under the card whatever the copy
  does. On beat 1 the dataset card takes the left column and the query the right one, in
  the band between the headline and the prose card, and the two are centred on one line.
- Corpus span 1997 to 2025, one annual report card file per school year, so 29 years and
  29 files. The span is MIN(year)/MAX(year) on `isbe/report-card:all`; the file count is
  one per year, which is how ISBE publishes the report card. Encoded in
  `opendata-pitch/data/isbe-files.ts`.
- The 29 sheets on stage are one per file. One square is one dataset everywhere in this
  deck, so files get the taller sheet glyph and never a square.
- Year labels are drawn on the first, middle and last sheet only: 1997, 2011, 2025.
- Raw rows (`CodeInk`, drawn on entry once the sheets have inked in) are illustrative
  formatting of the ISBE row shape, not transcriptions of specific records. Six rows are
  shown on a canvas surface at 0.9 opacity. Semicolon
  delimited, no header, about 7,691 fields per row:
  `blog/src/content/blog/what-opendata-is-building.mdx` lines 4, 81, 124. The sample
  values (`150162990250001;ABBOTT ELEM;AURORA;...`) carry over from the previous deck's
  slide 4 and are not claimed as verbatim records; the other five rows are made up in the
  same shape (Aurora schools, so the SQL on beat 1 matches). Each line still ends in an
  ellipsis, because a frame full of semicolons reads as a rendering fault, and the block
  scrolls sideways (`scroll-x`): the rows are longer than the frame, are cut at its right
  edge under a fade, and can be wheeled across on stage.
- The caption above the raw rows reads `rc25.txt · row shape only · 7,691 fields each ·
  no header` (`RAW_LABEL`). The field count and the delimiter are real. FLAG: the
  filename is illustrative.
- Dataset card (beat 1) names the published dataset, `isbe/report-card`, with
  `29 files · 1997 to 2025 · one schema`. The card is a link to
  `https://tryopendata.ai/datasets/isbe/report-card` (`DATASET_URL`), opened in a new tab
  so the deck stays put. No tracking parameters. It carries no link styling: the hover
  state lights the card up instead, and it only takes a click once beat 1 has put it on
  screen. The same card opens slide 4 in the same box and
  shrinks into the first cell of the field there (`DATASET_CARD_BOX` in
  `opendata-pitch/data/isbe-files.ts`).
- CAVEAT: `files reconciled` reads 21 on slide 2's row and 29 on this slide. Both are
  right. 21 is the number of annual files in the column-position comparison, which runs
  1997 to 2017. 29 is the number of files in the published dataset, which runs 1997 to
  2025. Narrate it that way if asked.
- SQL (beat 1) is a real query shape against the published dataset,
  `isbe/report-card:all`, not a copy-pasted session. Recorded as `RECONCILED_SQL` in
  `opendata-pitch/data/isbe-files.ts`. It is highlighted on slide by the tokenizer in
  `shared/story/code-tokens.ts`: keywords in the frame's emerald, the quoted dataset
  reference and the string literal in amber, nothing else coloured.
- The SQL block is a link to the workbench with that query loaded and run:
  `https://tryopendata.ai/sandbox?sql=<urlencoded RECONCILED_SQL>&autorun=1`
  (`RECONCILED_SQL_URL`, built from the same array the card draws). New tab, no tracking
  parameters, no link styling: hover lights the block up. FLAG: `/sandbox` requires a
  signed in account, so clicking it while signed out lands on the upsell rather than the
  editor. Sign in before presenting if you intend to click it.
- Card body at beat 0, "About 7,691 unnamed fields per row, and the salary field alone has
  sat in 14 different columns": 7,691 is `RAW_FIELD_COUNT` (source above); 14 is
  `DISTINCT_POSITIONS` from `opendata-pitch/data/isbe-column-drift.ts`, the count of
  distinct column positions of "Teacher Avg Salary" across the 21 files in the 1997-2017
  comparison (see the hidden slide 2 section). The 21-file comparison window is narrower
  than the 29-file corpus; "has sat in" is deliberately not "in every file".
- The other figure in the card copy is 29, which is the file count above.
- The dataset square at the last beat carries `vt-seed-square` and hands off to slide 4. It
  is a glyph, not a figure.
- Link at bottom right, `labs.tryopendata.ai/what-opendata-is-building`: the article the
  ISBE figures on this slide come from, opened in a new tab.

## Slide 4: Scale and the graph

- Link at bottom right from the graph beat on, `tryopendata.ai/graph`: the live graph the
  snapshot was taken from, opened in a new tab. It fades in with the graph and is not
  clickable on the field beats.
- Card at beat 0, "969 datasets. 203 agencies. 1.6 billion rows.":
  `GET https://api.tryopendata.ai/v1/stats` on 2026-09-10, fields `totalDatasets` 969,
  `totalProviders` 203, `totalRows` 1,600,512,820. Rows are rounded down to 1.6 billion.
- CAVEAT: the field on stage is 952 squares, not 969. The grid draws the datasets that are
  in the knowledge graph, which is the subset with `status === "ready"`. If the two numbers
  are challenged, say "969 in the catalog, 952 ready and in the graph". The beat 1 card
  body states it on slide: "952 of the 969 are ready and linked".
- Graph snapshot: `https://api.tryopendata.ai/v1/graph/subgraph`, generated 2026-09-10 by
  `blog/scripts/generate-dataset-graph.mjs` and committed to
  `opendata-pitch/data/graph-data.ts`. The raw subgraph is 963 nodes and 3,371 edges;
  filtering to `properties.status === "ready"` leaves 952 nodes, and keeping only edges
  whose endpoints both survive leaves 3,291. The deck renders the filtered snapshot and
  quotes the filtered counts. Nothing on this slide goes to the network.
- Card at beat 1, "952 datasets. 3,291 relationships.": the node and edge counts of that
  committed file, read from the arrays at build time rather than typed in. The body
  reconciles them against the 969 catalog total from `catalog-totals.ts`.
- Edges are SIMILAR_TO relationships from the knowledge graph. The slide calls them
  relationships, never join paths. Edge width maps to the snapshot's `confidence` field.
  Join validation (fan-out bands, key-coverage floor, cast compatibility) is a separate
  real subsystem (`JoinSuggesterService` in the backend). Keep the two distinct in Q&A.
- Cluster labels at beat 1 (Education 160, Government 145, Health 141, Economics 120) are
  the four largest values in `categoryCounts` in the same committed file. A fifth legend
  row, "13 others 386", stands for every band below them (added 2026-09-13, because
  thirteen unlabelled colours read as decoration): `categoryCounts` has 17 keys, the four
  labelled ones total 566, and 952 - 566 = 386 across the remaining 13. All four numbers
  are computed from the committed file, not typed in.
- Card at beat 1, "17 categories, four of them most of the catalog." over "Education,
  government, health and economics are 566 of the 952." (added 2026-09-13; beats 0 and 1
  had carried the same card). Same arithmetic on `categoryCounts` as the legend row. Note
  that 952 is the graph's ready subset, not the 969 catalog total, and the beat 2 card
  still reconciles the two.
- The field is sorted by cluster size, largest first, so the recolor beat produces
  contiguous blocks that a label can point at. The graph itself renders the snapshot in its
  published order.
- Palette: the twelve categorical hues in `opendata-pitch/data/graph-palette.ts` are
  copied from `shared/components/Graph3D.vue`, which took them from the product's graph
  explorer (`frontend/app/routes/graph/_components/buildGraphSpec.ts`). Assignment is by
  first appearance in `graphNodes`, which is the order the renderer walks the node list in.
  FLAG: that is a match on the same input, not a guarantee about openchart's internal
  colour scale. If the grid and the graph ever disagree on a category's hue, this is why.
- Growth beat: the July snapshot was `opendata-pitch/data/graph-data-2026-07.ts`,
  generated 2026-07-24, 630 nodes and 2,135 edges. It was deleted on 2026-09-13
  (recoverable from git history, in the commit that added it). The two figures live as
  `JULY_NODES` and `JULY_EDGES` in `data/catalog-totals.ts`, read off the frozen
  snapshot and checked against it the day it was removed; nothing regenerates them.
  Against 952 and 3,291 that is +51%
  datasets and +54% relationships over seven weeks (24 July to 10 September). The slide
  draws the four counts and states no percentage; the percentages are Q&A only, and both
  are arithmetic on the two committed files.
- The growth beat draws two pairs of bars beside the frozen graph, July against today for
  datasets and for relationships, each labelled with its count. Bar length is linear in
  the count, with today's bar at full width. The graph dims to 45% under them.
- The squares do not fly into the nodes one at a time. Node positions come from the force
  layout inside the WebGL renderer and are not readable until it settles, so a per node
  flight would animate toward coordinates that are still moving. The beat loosens the grid
  into a cloud instead (`DUR.bloom` on `TRACE`), fades the cloud out over `DUR.gather` and
  brings the graph up over `DUR.scale`, with the graph mounted one beat early so its layout
  has already settled when the fade starts.
- BANNED: never describe this slide as a "network effect". The claim is supply-side
  compounding of a catalog we build, not a two-sided marketplace dynamic.

- Beat 3 card, "Seven weeks, and the graph grew by half." over "630 datasets and 2,135
  links in July; 952 and 3,291 today." (rewritten 2026-09-13). It now states what the bars
  on screen actually show, and every figure in it is read off the two committed snapshots
  rather than typed. "Grew by half" is +51% on datasets and +54% on relationships over
  24 July to 10 September, which is seven weeks; the slide rounds down to "by half" and
  never says "half the catalog". The previous card ("Each dataset makes the next one
  cheaper" / "The first 10 took weeks, the last 100 took days") was founder-stated velocity
  with no measurement behind it and is retired.
- The two bar pairs sit on the house card (`InkCardRect`, x 1230 to 1840 in stage units),
  added 2026-09-13 so they read as a panel over the frozen graph rather than as marks
  floating on it. Bar length was shortened from 380 to 300 units at the same time, because
  the "3,291 today" end label ran past the frame's right column edge.

## Slide 5a: Pipeline: a dataset is a YAML file, six stages and one gate

- YAML block (`CodeInk`, on entry): trimmed from `datasets/tea/staar-accountability/dataset.yaml`
  as committed on 2026-09-12. Every key shown is in the file (`connector: opendata/generic`,
  `format: csv`, `aggregator: time-series` with `variables.year` and `stop_on_error: 3`,
  `expected_schema`, `ingest.transform`, `sync.interval: yearly`, `labels`, `landing_url`,
  `source_url`). The description, the full year list and the field list are cut; the ellipsis
  marks the cut. It is highlighted on stage by the YAML tokenizer in
  `shared/story/code-tokens.ts` (added 2026-09-13): keys in the frame's cyan, urls,
  numbers and the year range in amber, values and structure plain. The block scrolls and
  links to the dataset's public page:
  `https://tryopendata.ai/datasets/tea/staar-accountability`.
- Card at beat 0, "live in about 4 minutes": the git-push CD fast path (validate, sync,
  reingest) measured at roughly four minutes in `.github/workflows/` runs; the same figure
  the deploy rule in `.claude/rules/deployment.md` and memory `feedback_dataset_yaml_deploy`
  state. Rounded, and presented as "about".
- Stage row: the order `opendata/opendata/ingestion/pipeline/stages.py` runs them (fetch,
  parse, transform, validate, write) plus the enrichment hand-off in `finalize.py`. Notes:
  `26 connectors` = `ls opendata/opendata/connectors/*.py | grep -v __init__ | wc -l` (26);
  `14 formats` = parser modules in `opendata/opendata/parsers/` the same way (14);
  `19 steps` = enrichment steps registered in `opendata/opendata/enrichment/` (19). All
  counted 2026-09-12. "blocks the swap" / "atomic promote": the post-ingest quality gate
  runs inside the parquet writer and a failure aborts the atomic overwrite, so the previous
  file keeps serving (`project_ingestion_quality_gate` memory; `opendata/services/`).
- Headline "Infrastructure as code, written by agents." (shortened 2026-09-13 from
  "Infrastructure as code for public data. Agents write most of it.", which wrapped with
  one word on the second line).
- Beat 1 ends with the five non-gate boxes dropping back to `ink('slate', 1)`, so only the
  quality gate carries colour (added 2026-09-13). No figure changes; it is the same run.
- The two ticking figures over the curve ("1k datasets" and "1.6B rows") were removed on
  2026-09-13. The curve is the argument, the row figure's path was an animation of a total
  rather than a measured series, and the catalog total now appears once, on slide 4. The
  peak-week chip stays.
- Velocity curve (`InkLine`, beat 2) and the table in `data/pipeline-velocity.ts`:

  ```
  git log --diff-filter=A --format='%ad %H' --date=short --name-only \
    -- 'datasets/*/*/dataset.yaml'
  ```

  earliest add date per path, bucketed by ISO week (Monday start), run 2026-09-12: 1003
  paths ever added, 973 on disk today. The cumulative curve plots the running total at the
  end of each week. Includes the ten derived `opendata/` datasets and one test fixture
  (removing them moves the total by 12 and no week's rank).

- "93 in one week" chip and card lead: week of 2026-08-17, 93 first-add dates. FLAG: three
  commits are bulk imports rather than a week's authoring and they sit inside the two peak
  weeks (77 datasets on 2026-02-02, 50 on 2026-01-31 in a `subject_tags` migration, 33 on
  2026-08-20). The card therefore says "in one week", never "every week".
- Card body at beat 2, "3 weeks of pipeline before the first dataset": repo first commit
  2025-11-27, first `dataset.yaml` (`bls/cpi-u`) 2025-12-16, 19 days, rounded to 3 weeks.
  "The last four weeks added 232": `LAST_FOUR_WEEKS` sums the weeks starting on or after
  2026-08-15, which is the weeks of 2026-08-17, 08-24, 08-31 and 09-07: 93 + 73 + 42 + 24 = 232. The week of 09-07 is partial (the deck date is 09-12). "most written by Claude Code
  agents": Riley's account; author fields on those commits are the founder's, because
  agents commit through his session. No commit trailer distinguishes agent-written YAML.
  Do not put a percentage on the slide.
- Beat 3 (rebuilt 2026-09-13): the six stages stay where they are and two new boxes,
  Request and Agent, hang off a row below them and feed Fetch through dashed amber links
  tagged "roadmap". It used to fold the six stages into one "Ingestion pipeline" box and
  draw a four-box loop, which asked the audience to re-read a diagram they had just
  learned. Neither link is built: there is no automated trigger from a dataset request to
  an agent run (`backend/` request routes create a row and notify;
  `.claude/agents/dataset-creator.md` is invoked by a person). The card says so ("two steps
  still need a person").

## Slide 5c: Bootstrap: two Mac Minis carry production

- Machine cards: read off the boxes 2026-09-12 (`hostnamectl; lscpu; free -h; df -h` on the
  serving box, `sysctl -n hw.model hw.ncpu hw.memsize; df -h /` on the processing box):
  Apple M1, 8 cores, 16 GB (15 GiB usable), 150 GB NVMe root plus a 466 GB external SSD,
  Linux, containers API x3, frontend x2, MCP, worker, Redis and a reverse proxy. The DuckDB
  chip is not a container: DuckDB runs in-process inside the API containers, so every query
  the M1 answers is a DuckDB query on the M1.
  Processing: Apple M4, 10 cores, 16 GB, 228 GB, macOS, running Postgres, Neo4j, Grafana,
  Prometheus and log storage.
- Machine cost, top right of each card: M1 $250, bought used; M4 $0, won at a hackathon.
  Founder-stated.
- Card at beat 0, "no cloud bill": both machines are owned hardware on a home LAN;
  the monthly cloud bill is zero. Cloudflare's free tier fronts the domain; no
  paid compute. Say "no cloud bill", never "free": power and the Cloudflare account are
  real, unpriced.
- Gauges (beat 1), serving box at idle 2026-09-12: root disk 105 of 150 GB (`df -h /`, 74%
  after the 12.4 GB orphan is counted; the number on the slide is the raw `df` figure);
  RAM 6.4 of 16 GB in use (`free -h`, used = total minus available; the gauge label was
  changed from "15 GiB" to "16 GB" on 2026-09-13 so it matches the "16 GB RAM" on the
  machine card beside it. `free -h` reports 15 GiB usable of a 16 GB machine; the slide
  states the machine's memory, and the used figure is unchanged); CPU load 0.11 on 8
  cores (`uptime` 1-minute average). FLAG: point-in-time reads. Under the stress run,
  memory available never dropped below 6.2 GiB and load reached 10 on 8 cores; the disk
  figure is the one that does not move with load, which is the slide's argument.
- Load figures (beat 2), "968 req/s" API calls, "136 req/s" dataset reads, lead "1,104 QPS
  before latency moves", card body "Zero failures to 1,397 req/s. The wall was the proxy's
  memory cap, not the hardware.": the "0 failed to 1,397 req/s" chip was removed on
  2026-09-13 and folded into that card body, so the beat carries two live text zones rather
  than three. Same figures, same run: k6 v2.2.0 `api.js`
  MODE=ceiling, run from the M4 against the serving box late on 2026-09-12 (local) with
  rate limiting disabled. The same 17 scenarios as the full run, each tagged `bucket`
  (`dataset` = `GET /v1/datasets/{provider}/{dataset}?limit=50`, DuckDB over parquet;
  `api` = the other 16: catalog, search, detail pages, graph), offered load ramped from
  815 to 2,445 req/s over 150 s, `--out csv` for per-second data. The slide
  figures are per-second means over seconds 34 to 41 (the cleanest stretch: 0 failures,
  every second's API p95 under 110 ms): 1,104 total, 968 api, 136 dataset; the p95 labels
  are the median of the per-second p95s in that window (api 28 ms, dataset 12 ms). Zero
  failures held to 1,397 req/s (10 s mean, seconds 64 to 73) but with p95 near 800 ms; the
  host did not run out of memory and CPU did not saturate, so the wall is the proxy's
  memory cap. Card body says "when the proxy hits its memory cap, not CPU".
  FLAG: a single ceiling run. Never present these as "under any load".
- Beat 3 (the disk gauge recolors amber to cyan, tagged "roadmap · cloud storage"): not built. Crawler agents
  (agents that go find datasets rather than fulfil a request) do not exist in the repo; the
  card presents storage as the thing that unblocks them, which is Riley's stated reason.

## Slide 6a: Divider: the case study opens

- Cover chrome only: an eyebrow, a headline and a one sentence lede. No figures.
- Headline "Two tests, ten districts, one contradiction." (changed 2026-09-13; it names
  the finding the next slide delivers rather than a timing claim). The three figures in it
  are the two tests and ten districts slide 6 draws: `STAAR_ROWS` has ten rows and the beat
  2 reorder is the SAT. The previous headline, "One question about Texas schools, answered
  in a few minutes", rested on Riley's account of doing the analysis rather than on a
  measured run, and that claim no longer appears anywhere on the deck. This is founder-led
  discovery work with a state agency, not a contract or a pilot. The eyebrow says
  "Case study", never "customer".
- The lede is the question slide 6 answers, phrased from its two beats: STAAR math among
  economically disadvantaged students against Austin, then the same districts on the SAT.

## Slide 6: Customer: ten districts on STAAR, then on the SAT

- Card at beat 1, "Austin is last of the ten." over "22% of Austin's low-income students
  met grade level; Roma's 64% is nearly triple." (added 2026-09-13; beats 0 and 1 had
  carried the same card, and the beat exists to pick Austin's bar out in rose). Both
  figures are `STAAR_ROWS` in `opendata-pitch/data/tea-districts.ts`: Austin 22, the lowest
  of the ten, and Roma 64, which is 2.9x it, so "nearly triple". The beat 1 underline moved
  from "triples" to "last" with the copy.

- Both bar sets are copied from the deck this one replaced (its `pages/07-tea.md`, removed
  in the 2026-09-11 rename) into `opendata-pitch/data/tea-districts.ts`. Nothing was
  re-queried.
- STAAR bars: `tea/staar-accountability`, metric code `DDE00AM01225R` (economically
  disadvantaged, all students, math, "meets grade level" rate), 2024-25. Query and full
  district-number mapping in `blog/src/content/blog/staar-sat-gap.mdx` FigureSource
  (verified 2026-07-15). Values: Roma 64, South Texas ISD 57, Valley View 52, Sharyland 49,
  Brownsville 47, PSJA 45, La Joya 36, Mission CISD 35, Point Isabel 32, Austin 22. Texas
  median across all 1,198 districts with this metric: 32.
- SAT bars: `tea/sat-act-campus`, Class of 2024, `group = Economically Disadvantaged`,
  districts with 50%+ eco-dis SAT participation. Values: South Texas ISD 979,
  Brownsville 932, Sharyland 929, Austin 886, PSJA 875, Point Isabel 871, Mission 862.
  Source: same article, SAT FigureSource (verified 2026-06-29).
- Card at beat 0, "Roma is 90% low-income and triples Austin." Roma ISD 90% economically
  disadvantaged, A rating; Austin ISD 51%, C rating:
  `blog/src/content/blog/staar-sat-gap.mdx` line 61. "Triples" is 64 over 22, a ratio of
  2.9, and the article states it as "three times Austin's rate" at line 215.
- Chip at beat 2, "Roma drops out: 0.7% take the SAT": `blog/src/content/blog/staar-sat-gap.mdx`
  lines 86 and 215. Roma's roughly 350 annual graduates yield two or three SAT takers, so
  Roma falls below the 50% participation floor and is one of the three rows that exit.
- The three rows that exit at beat 2 (Roma, Valley View, La Joya) are derived in
  `tea-districts.ts` as the STAAR ids with no entry in the SAT array, so the exit set can
  never drift from the data.
- CAVEAT: the SAT axis runs 800 to 1000, not from zero. The scale's own floor is 400 and a
  zero-based axis would compress every district into the same stub. Both ends of the axis
  are labelled on the beat, so the truncation is on screen rather than implied. The point
  of the beat is the reordering, not bar length.
- CAVEAT: the source data also includes IDEA Public Schools at 35 on STAAR. IDEA is a
  charter network, not a traditional district, and is omitted so the comparison stays
  district to district. Say so if asked why the count is 10 and the article's is 11.
- CAVEAT: the source SAT chart also carries "Austin ISD (all students) 1046". It is absent
  here, and must stay absent. Every SAT number on this slide is the economically
  disadvantaged subgroup; mixing the all-student figure in inverts the slide's point.
- "eco-dis" never appears on this slide. The card body spells out "economically
  disadvantaged" and the stage labels name the metric without abbreviating it.
- "Three Valley districts beat Austin, three trail it": article line 190.
- Link at bottom right, `labs.tryopendata.ai/staar-sat-gap`: the published article every
  figure on this slide comes from, opened in a new tab so the deck stays put. No tracking
  parameters. The same link sits on the divider before this slide.
- Beat 3 lead, "If STAAR measured college readiness, the SAT would rank the same way":
  `blog/src/content/blog/staar-sat-gap.mdx` line 238 ("If STAAR performance predicted
  college readiness, though, the SAT rankings would follow the STAAR rankings. They
  don't."). Body, the either/or: the teaching-to-the-test branch is article line 213
  ("STAAR gains may reflect instructional alignment with the test rather than college
  readiness"); the Austin-prepares-better branch rests on the TSI math readiness figures at
  article line 266 (Austin 81.5% of enrolled graduates versus Roma 63.5%, 2018-2024
  average), which are not on the slide. Say them if pressed.
- Chip at beat 3, "Austin: 10th of 10 on STAAR, 4th of 7 on the SAT": both ranks are
  computed at build time from the STAAR and SAT arrays in `tea-districts.ts` (22 is the
  lowest of ten STAAR values; 886 is fourth of seven SAT values), so the chip cannot drift
  from the bars. It replaces the Roma chip in the same position.
- FLAG: **TEA status is founder-reported customer discovery, not a contract, pilot, or
  signed agreement.** The slide does not name TEA. The beat 2 lead "Answered in a day" is
  Riley's account of that discovery work, as are the narrative claims behind the headline
  (a state agency presenting from 2019-era charts, a new analysis taking a bureaucratic
  cycle, knowing the Valley outperformed but not why). There is no document in this repo
  that corroborates them. Never upgrade this to "customer", "pilot", or "design partner"
  on stage or in Q&A.

## Slide 6d: Benchmark: thirty questions, two arms, then the API agent

Phase 1, the run this slide is mostly about: Claude Sonnet 5 on claude.ai, 2026-09-19, one
fresh chat per question, one run per arm. Arm `app-web` is web search plus a code sandbox
with no connector; arm `app-mcp` is the same model with the OpenData MCP connector
attached. Hand grades are the grade of record. Beat 4 leaves that run and shows Phase 0
instead: DeepSeek V4 Flash through OpenRouter at temperature 0, same model and prompt in
three arms with only the tool list differing. That run was billed per token, which is what
makes it the one place in the benchmark a dollar figure is quotable.

Every figure on the slide is computed at build time in
`opendata-pitch/data/benchmark-v5.ts`, so checking that file checks the slide. The commands
below are what produced the three tables it parses and what re-derives each constant. The
write-ups are the Phase 1 report (sections 2, 5 and 9, published at `BENCHMARK_URL`) and
the Phase 0 report; the superseded v4.1 write-up is an earlier revision of the Phase 1
report.

### Phase 1: beats 0 to 3

- Headline, "Thirty questions.", and `N` = 30: the question count of
  `bench/results/phase1-v5-combined-review.csv` per arm.
  `python3 -c "import csv; print(len({r['question_id'] for r in csv.DictReader(open('bench/results/phase1-v5-combined-review.csv'))}))"`
- Beat 0 lead, `${WEB_CORRECT} of ${N}, without OpenData.` = 6 of 30. Beat 1 lead,
  `${MCP_CORRECT} of ${N}, with it.` = 25 of 30. Both are hand grades:
  `python3 -c "import csv,collections; print(collections.Counter((r['arm'],r['hand_grade']) for r in csv.DictReader(open('bench/results/phase1-v5-combined-review.csv'))))"`
  which gives app-web 6 CORRECT / 8 INCORRECT / 16 NOT_ATTEMPTED and app-mcp 25 CORRECT /
  5 INCORRECT. Report section 2 states the same pair.
- The two rows of thirty marks: one mark per question per arm, filled when the hand grade
  is CORRECT and hollow when it is not, in question-id order. One hue, cyan, so a mark
  carries its outcome by fill rather than by colour. The wrong / no-answer split is not
  drawn here; it is on the benchmark page. Rows come from the `V5_TABLE` literal in
  `data/benchmark-v5.ts`, emitted by the one-liner in that file's header.
- The v4.1 figures are **not on the slide**. They were a mono subtitle under the headline
  until the user removed it on 2026-09-19: it named a bank version the audience has no
  context for, and it read as a second headline rather than as support. The constants stay
  in `data/benchmark-v5.ts` and the figures are on the benchmark page, so this is the row
  to read before answering a question about the earlier bank. The numbers are
  `V41_MCP_CORRECT` 27 and `V41_WEB_CORRECT` 15, plus `V41_FASTER` 3.3x on the
  `V41_BOTH_RIGHT_N` 14 both arms got right. Counts:
  `python3 -c "import csv,collections; rows=[r for p in ('bench/results/phase1-claude-1-review.csv','bench/results/phase1-claude-1-superseded-v41-review.csv') for r in csv.DictReader(open(p))]; print(collections.Counter((r['arm'],r['hand_grade']) for r in rows))"`
  which gives app-mcp 27 CORRECT and app-web 15 CORRECT over 30 ids. This is the bank
  neither arm was iterated against, which is why report section 9 wants it in the same
  eyeline as the v5 figure. Not on the slide, available for Q&A from this file; see the
  caveats.
- `V41_BOTH_RIGHT_N` = 14 and `V41_FASTER` = 3.3. The v4.1 report states it as "a median of
  3.3 times faster per item" on the 14 both arms got right, so the arithmetic is the median
  of the per-item ratios:
  `python3 -c "import csv,json,statistics; g={(r['arm'],r['question_id']):r['hand_grade'] for p in ('bench/results/phase1-claude-1-review.csv','bench/results/phase1-claude-1-superseded-v41-review.csv') for r in csv.DictReader(open(p))}; s={(json.loads(l)['arm'],json.loads(l)['question_id']):json.loads(l)['wall_clock_s'] for p in ('bench/results/phase1-claude-1-results.jsonl','bench/results/phase1-claude-1-superseded-v41-results.jsonl') for l in open(p)}; both=[i for a,i in g if a=='app-web' and g[('app-web',i)]=='CORRECT' and g[('app-mcp',i)]=='CORRECT']; print(len(both), round(statistics.median(s[('app-web',i)]/s[('app-mcp',i)] for i in both),2))"`
  which gives 14 and 3.27, so 3.3. The ratio of the two medians is 3.46 and the ratio of
  the two totals is 4.59; neither is the figure the report quotes and neither goes on the
  slide. This is the one ratio report section 9 clears for a screen, it is speed and never
  accuracy, and it never appears without its bank named. Not on the slide, available for
  Q&A from this file; if it goes back on a screen, "(v4.1)" goes with it.
- Beat 2 marks, `WEB_TOTAL_MIN` = 180 min and `MCP_TOTAL_MIN` = 29 min, and beat 2 body
  figures `WEB_MEDIAN_S` = 63 s and `MCP_MEDIAN_S` = 35 s: wall clock is the app's own
  timestamps, first human message to last assistant block.
  `python3 -c "import json,statistics; rows=[json.loads(l) for l in open('bench/results/phase1-v5-combined-results.jsonl')]; print({a: (round(sum(x['wall_clock_s'] for x in rows if x['arm']==a)/60), round(statistics.median(x['wall_clock_s'] for x in rows if x['arm']==a))) for a in ('app-web','app-mcp')})"`
  Report section 5 states 63 s / 35 s median and 10,774 s / 1,763 s total, which is the
  same 180 and 29 minutes.
- Beat 3 strip, "what the time bought", four measures per arm, all from the same results
  file. `WEB_TOOL_CALLS` 541 / `MCP_TOOL_CALLS` 228, `WEB_SANDBOX_CALLS` 392 /
  `MCP_SANDBOX_CALLS` 0, `WEB_OPENDATA_CALLS` 0 / `MCP_OPENDATA_CALLS` 184,
  `WEB_CAP_HITS` 5 / `MCP_CAP_HITS` 0.
  `python3 -c "import json; rows=[json.loads(l) for l in open('bench/results/phase1-v5-combined-results.jsonl')]; print({a: (sum(len(x['tool_calls']) for x in rows if x['arm']==a), sum(x['sandbox_calls'] for x in rows if x['arm']==a), sum(x['opendata_tool_calls'] for x in rows if x['arm']==a), sum(1 for x in rows if x['arm']==a and x['wall_clock_s']>=600)) for a in ('app-web','app-mcp')})"`
  Report section 5 states 541 / 228 tool calls, 392 sandbox calls, 184 OpenData calls and
  five web chats past the cap. `MCP_SANDBOX_CALLS` is 0 because the connector arm never
  reached for `bash_tool`, which is a measurement and is summed from an `mcpSandbox`
  column rather than typed. `WEB_OPENDATA_CALLS` is the one structural zero on the slide,
  not a measurement: the web arm ran with no connector attached. A per-arm breakdown of
  every tool name, which is how the two zeroes were checked, is
  `python3 -c "import json,collections; rows=[json.loads(l) for l in open('bench/results/phase1-v5-combined-results.jsonl')]; print({a: dict(collections.Counter(t['name'] for r in rows if r['arm']==a for t in r['tool_calls'])) for a in ('app-web','app-mcp')})"`
- Beat 3 body, `It spun up a sandbox in ${WEB_SANDBOX_CHATS} of ${N} chats` = 17 of 30:
  web chats with at least one sandbox command.
  `python3 -c "import json; print(sum(1 for l in open('bench/results/phase1-v5-combined-results.jsonl') if json.loads(l)['arm']=='app-web' and json.loads(l)['sandbox_calls']))"`
  Report section 5 states "392 across 17 chats".
- `CAP_S` = 600 is the protocol cap, from `task_timeout_s` in the results file.
- Link at bottom right, `tryopendata.ai/benchmarks/claude-sonnet-5-opendata-connector`: the
  public write-up of this run, opened in a new tab.

### Phase 0: beat 4

- Setup, in the beat 4 body: DeepSeek V4 Flash through OpenRouter at temperature 0, same
  model and same prompt in three arms, only the tool list differing (`none`; `web`, an Exa
  snippet plugin plus a bare python sandbox; `mcp`, the OpenData MCP server). Bank v0, one
  run. The Phase 0 report, "The headline".
- `PHASE0_CORRECT` = none 5, web 8, mcp 21 of 30, and `PHASE0_PER_CORRECT` = $0.002,
  $0.45 and $0.004. `cost_usd` on these rows is real OpenRouter spend, not an estimate.
  `python3 -c "import json; rows=[json.loads(l) for l in open('bench/results/phase0-full-1-grades.jsonl')]; H={('web','p0-027'):'CORRECT'}; print({a: (sum(1 for x in rows if x['arm']==a and H.get((a,x['question_id']),x['grade'])=='CORRECT'), round(sum(x['cost_usd'] for x in rows if x['arm']==a),4)) for a in ('none','web','mcp')})"`
  which gives (5, $0.01), (8, $3.58) and (21, $0.09), so $0.002, $0.447 and $0.0042 per
  correct answer. The report's "What it cost" table states $0.0003 / $0.119 / $0.003 per
  task and the same per-arm totals.
- The one hand correction: `bench/results/phase0-full-1-review.csv` carries an empty
  `hand_grade` column, so the module starts from the judge grade in
  `phase0-full-1-grades.jsonl` and applies the single documented flip. Web p0-027 names
  Austin at "27% more evictions than its baseline" against a gold of "126.8% of baseline";
  the judge passed it on one pass and failed it on the next with identical input, and the
  hand grade carries it as CORRECT. That flip is exactly why the web arm is 8 of 30 by hand
  and 7 by machine (phase0-report.md, "The hand-check"). No other row is adjusted.
- Beat 4 marks are the two dollar figures, labelled with their arm and its count. The
  no-tool arm is a label under them rather than a third figure:
  `no tools at all: ${PHASE0_CORRECT.none} of ${PHASE0_N} correct, $${...} each`.
- `phase0Dollars` prints $0.45 at two decimals and $0.004 at three. Two significant figures
  would print the MCP arm as $0.0042, which is more precision than one run of one cheap
  model supports.

### Computed but not on the slide

`data/benchmark-v5.ts` exports more than the stage draws. Everything in this list is
computed from the same rows as the on-slide figures and is safe to quote in Q&A; nothing
here is drawn, so a change to one of these does not move the slide.

| Export | Value | Why it is not drawn |
|---|---|---|
| `V41_OUTCOMES`, `V41_WEB_CORRECT`, `V41_MCP_CORRECT`, `V41_BOTH_RIGHT_N`, `V41_FASTER` | 30 rows; 15; 27; 14; 3.3 | The v4.1 subtitle came off on 2026-09-19. Derivations are above; the block carries a comment saying nothing renders it |
| `NINE_N`, `NINE_WEB`, `NINE_MCP`, `NINE_MEDIAN_WEB_S`, `NINE_MEDIAN_MCP_S` | 9; 0; 6; 501 s; 65 s | The nine-rewrite story is off the slide by the user's decision; see the caveats |
| `WEB_NO_ANSWER` | 16 | The marks show correct against not-correct on one hue. The wrong / no-answer split is on the benchmark page |
| `WEB_SEARCHES`, `MCP_SEARCHES` | 94; 3 | The effort table has four rows and these were the weakest pair. Both count `web_search` calls only; `web_fetch` is separate and is 50 on the web arm, 1 on the connector arm |
| `PHASE0_COST`, `PHASE0_ROWS` | $0.01 / $3.58 / $0.09; 30 rows | Beat 4 shows dollars per correct answer, not per-arm totals |
| `CAP_S` | 600 | The protocol threshold `WEB_CAP_HITS` counts against, not a finding |
| `Grade`, `Outcome`, `Phase0Arm` | - | Types |

One discrepancy worth knowing: report section 5 says the connector median on the nine is
63 s, and the median of the nine `wall_clock_s` values is 65.4, so the module computes 65.
63 is p1-016's own time, not the median. Neither number is on a slide.

### Caveats

- CAVEAT: single run per cell, both phases. One chat per question per arm, no repeats, so
  there is no variance figure behind any count on this slide. Always say "single run per
  cell"; never state an accuracy ratio.
- CAVEAT: Memory was on in the account that ran both Phase 1 arms. One web chat (p1-013)
  quotes the account's Memory back at itself. It was not disabled, and that is a known
  limitation of the run rather than a controlled condition.
- CAVEAT: nine of the thirty v5 items were rewritten to need what the catalog does, and
  tested against the web arm until they did (p1-004, 007, 008, 013, 016, 017, 018, 020,
  021; report section 9). The slide does not tell that story, which is a deliberate
  decision by the user on 2026-09-19 to keep the slide on the run's results. It is the
  first thing to say if anyone asks how the bank was built, and the benchmark page carries
  it in full. The v4.1 figures were on the slide for the same reason, as a subtitle under
  the headline, until the user removed that line on 2026-09-19. The slide therefore shows a
  v5 figure with neither the rewrite sentence nor the v4.1 comparison beside it, which is a
  deliberate presentation decision and not a change to what the run measured.
- CAVEAT: five Phase 1 web chats ran past the ten minute cap and the v5 web median over all
  30 is depressed by short declines, so the v5 time figures are labelled as totals and
  medians for that run rather than as a general speed claim. The `3.3x` comes from v4.1
  instead, where no cap was in force, and is spoken rather than shown.
- CAVEAT (Phase 0): one run, one cheap model at temperature 0. The web arm there is a
  generic harness (an Exa snippet plugin plus a bare python sandbox), not a product, so it
  is not a fair proxy for a well-built web agent.
- CAVEAT (Phase 0): the run used bank v0, where seven of the nine MCP misses were bank
  ambiguity rather than model error. The report's corrected-bank readings of 23 to 28 are a
  projection from that hand-check, not a measurement, and never go on a screen. The report
  calls 21 of 30 the inversion-risk check, not a product number.

## Slide 6b: Platform: the stack the case study ran on

- Base block meta reads "one query interface" and nothing else, and the beat 0 card body
  is "Everything we clean lands in one place, linked to everything like it, behind a single
  query layer." (changed 2026-09-13). The "969 datasets · 203 agencies" totals were removed
  from both: they are slide 4's figures, and repeating them here made the audience
  re-verify a number they had already been given. This slide now carries no figures at all.
- Beat 0 shows the three surfaces as faint `ink('slate', 1)` outlines with no text, filled
  to emerald with their labels on beat 1 (changed 2026-09-13). No claim changes; the shape
  of the stack is simply present from first paint. The Agents tile is 1.5x the width of the
  other two, because it is the surface the case study ran on; the three still span the base
  exactly.
- The three surfaces are shipped product as of 2026-09-10: the API (`opendata/` routes,
  mounted by the backend; `frontend/app/routes/tools/drug-prices/` is an app built on it),
  the agent interface (the MCP server in `mcp/` and the Ask route in `backend/`), and
  charts via OpenChart. FLAG: "editable, for articles and decks" is founder-stated; confirm
  the chart editing surface ships before presenting.
- Beat 2 adds a dashed amber "Your data" slab under the catalog base rather than replacing
  it (changed 2026-09-13: swapping the base out read as "we stop doing this and start doing
  that", which is the opposite of the claim). The slab is the same width, shorter, and
  carries the "Roadmap, not built yet" tag (a dark `InkChip`, top right of the slab). The
  private instance does not exist. Never present it as available; the tier ladder on
  slide 7 labels it "roadmap" too.
- Card body at beat 2, "Every enterprise conversation asks for it. It ships once signed
  demand covers the SOC 2 cost.": Riley's account (2026-09-10) that the private instance
  comes up in every enterprise conversation, and the stated gate: it is not built until
  buyers are waiting, because SOC 2 runs $10K plus. The dollar figure stays off the slide.
  No document in the repo corroborates the conversations; do not name any enterprise.
- No other figures on this slide.

## Slide 7: Model: the tier ladder and two market comps

- Headline, "Companies already sell usable public data." (shortened 2026-09-13; the old
  two-sentence headline wrapped with one word on the second line, and its second sentence
  is the card's job). It is the two comps below. The product framing is now only in the
  beat 0 card body, "The engine is open source. The API, the agent interface and the charts
  are what we sell.": the paid tiers sell the API
  (`frontend/app/routes/tools/drug-prices/` is an app built on it), the agent interface
  (the MCP server in `mcp/` and the Ask route) and charts over the catalog, not the cleaned
  data by itself. FLAG: "editable charts" is founder-stated; confirm the chart editing
  surface ships before presenting, and say "in progress" if asked and it does not.

- AccuWeather $225M annual revenue built on free National Weather Service data:
  founder's business notes.
- GovWin IQ (Deltek) $12K-42K per year for cleaned federal contract data, with the
  underlying FPDS/USASpending data free: founder's business notes.
- CAVEAT: those two figures are in different units, a company's annual revenue against a
  per-seat annual list price, so there is no scale that holds both. As of 2026-09-13 they
  are typeset figures rather than bars: "$225M" labelled "AccuWeather annual revenue, on
  free NWS feeds" at beat 1, "$12K to $42K" labelled "GovWin IQ, per seat per year, on free
  bid notices" at beat 2. The two equal-height bars and the `//` axis break they stood on
  were removed at the same time; a pair of bars that has to be qualified with a break glyph
  is a comparison the slide did not want to invite in the first place. The claim is that
  both businesses charge for making free data usable, which is what the beat 2 card says.
- Tier ladder (Open source / Pro / Team / Private instance) and the buyer for each are from
  the deck this one replaced (its `pages/08-business-model.md`, removed in the 2026-09-11
  rename), which took them from the founder's business notes. The private instance tier is labelled "roadmap"
  as of 2026-09-10; see slide 6b for the gate.
- Tier prices, on the ladder rows since 2026-09-13, under a mono footnote reading "target
  list prices, pre-revenue":
  - Open source, "free": the `opendata/` package is Apache 2.0.
  - Pro, "$19/mo": founder's business notes.
  - Team, "$99/seat/mo · 5+ seats": the founder's business notes state $99 per seat
    per month for the enterprise tier with a five-seat minimum.
  - Private instance, "from $50K/yr · roadmap": PLACEHOLDER. Chosen by Riley on 2026-09-13
    with no source behind it, and the tier itself is not built (see slide 6b).
  Never present any of these as agreed pricing. Nothing on this deck has been sold at any
  of these numbers; the footnote on the slide says "target list prices, pre-revenue" and
  the same words are the answer in Q&A. The old rule here was "no tier prices on this
  slide, and never two of them side by side"; it was dropped because a ladder with no
  numbers on it invited the pricing question rather than answering it, and a stacked ladder
  is not two prices side by side.
- "~90% modeled gross margin": modeled from the DuckDB-over-Parquet serving architecture,
  with no warehouse compute in the request path. FLAG: modeled, not audited. The InkNumber
  label reads "modeled gross margin", and the tilde stays: it is a range, not a
  measurement, which is also why the figure scales in rather than counting up.
- Apache 2.0 licensing of the engine: the `opendata/` directory license, per the repo's
  open-core split.

## Slide 8: Signals: the reach, the conversations, and the skeptic finding

Added 2026-09-10 in the slot the hidden traction slide held. There is no revenue and the
slide never claims any; every figure here is a demand signal, sourced in
`opendata-pitch/data/signals.ts`.

- "1M+" reads: Riley's account (2026-09-10) that the Reddit data stories now total over
  a million reads. FLAG: confirm the current Reddit totals before presenting and keep the
  figure rounded down.
- "none of them engineers", "journalists, researchers and analysts": Riley's discovery
  finding (2026-09-10) that the cohort showing interest is non-technical and often AI
  sceptical (journalists, economists, academics). Founder-stated, no survey behind it.
- Conversation rows: "A state education agency" and "A state finance office" are
  customer discovery conversations, not customers, named by role rather than by agency.
  "Newsrooms and journalists" and
  "Enterprises" are kinds, never names, per the deck rule. "private instance asks" is the
  same founder account the slide 6b roadmap beat rests on.
- "does the AI make numbers up?": a paraphrase of the recurring objection, not a quote.
- Headline "Verifiability is what converts the skeptics." (changed 2026-09-13 from "The
  people who need this do not trust AI yet."; the slide's point is the answer, not the
  objection). No figure behind it: it is the same founder finding as the beat 2 card.
- The "The answer / Every figure links to its query." callout beside the rows was deleted
  on 2026-09-13; the beat 2 card already carries that claim. The repeated "DISCOVERY" tag
  came off the first three conversation rows at the same time (only "private instance asks"
  still prints), and the reach figure recedes as the rows arrive, so no beat carries more
  than two live text zones.
## Slide 9: Close: the ask

- Headline "Every dataset discoverable. Every claim verifiable." is a positioning
  statement, not a measurement.
- Use-of-funds line under the title, "Next: cloud storage for the crawler agents, one
  engineer, SOC 2." (added 2026-09-13): founder-stated intent, with no figure attached.
  There is no raise number anywhere on this deck, by decision. Each of the three traces to
  something already in these notes: storage is the disk wall on slide 5c, and SOC 2 is the
  gate on the private instance in slide 6b. If asked for an amount, say the round is not
  sized on this deck.
- The stage is the catalog graph, the same snapshot and framing as the cover
  (`CoverGraphField`), dimmed and orbiting. Backdrop only: no figure is read off it.
- The fan chart, its caption and the three asks were removed on 2026-09-10. The weekly
  catalog series (`opendata-pitch/data/catalog-growth.ts`) and `FanChart.vue` were
  deleted on 2026-09-13; both are recoverable from git
  (`git log -- talks/opendata-pitch/data/catalog-growth.ts`).
- QR code encodes `https://tryopendata.ai`, rendered at runtime by `OdQrCard url=` (uqr).
  No committed SVG, no tracking parameters. The white frame around it carries
  `vt-qr-frame`. With slide 8 (traction) hidden, nothing seeds that name on the slide
  before, so the frame is drawn in place; unhide slide 8 and the tick hands off into it
  again.

---

## Banned on-slide content (checked)

Carried forward from the previous deck, with the Ask rows added.

| Item | Why | Status |
|---|---|---|
| "network effect(s)" | The graph is supply-side compounding, not a marketplace dynamic | absent |
| "$183B" / Hugging Face valuation | Not our comp, invites an unwinnable comparison | absent |
| "450+" / "80+" / "257 datasets" / "49 providers" / "570 datasets" | Stale catalog counts | absent |
| "GitHub for datasets" as a headline | No contribution flywheel is shown; invites "where's the Git part?" | absent |
| A tier price presented as agreed pricing | Nothing has been sold at any of them | slide 7 carries target list prices under a "pre-revenue" footnote |
| "from $50K/yr" quoted as a real private-instance price | Placeholder, no source, tier not built | on slide 7 as a target, tagged "roadmap" |
| Any number read off the fan chart | The generated half is illustrative, not a forecast | fan labelled "Illustrative" on slide 9 |
| Ask latencies or tool timings as benchmarks | The replay is a recording, not a benchmark run | absent |
| Ask answer presented as live | Slide 5 replays a committed recording with zero network calls | stated in the slide 5 section |
| `state_revenue` | Terminology rule: use "state aid" | not used |
| Any accuracy ratio on the benchmark ("N times more accurate", "4x the answers") | Single run per cell; the counts are the claim, a ratio of them is not supportable | absent; slide 6d states counts only |
| Token counts or dollar costs for the Phase 1 run | `cost_usd` is hardcoded 0 on a subscription seat and token counts are 4-char estimates with web results recorded as zero characters | absent; Phase 1 cost on slide 6d is time and effort only. Phase 0 (beat 4) was billed per token, and it is labelled as a different model and a different run |
| "six right answers from the sandbox" | It was four of the web arm's six correct answers that came from sandbox downloads, not six | absent; report section 2 has the four |
| "public-data questions" as the population of the benchmark | The bank is 30 questions written to need a data catalog, not a sample of public-data questions | absent; no line on slide 6d describes the thirty as a sample of anything |
| A v5 figure shown without the sentence that the nine were written to need the catalog | Report section 9 rule | not met on the slide: the headline is "Thirty questions." by the user's decision on 2026-09-19. The sentence is in this file's slide 6d caveats and on the benchmark page, and is the first thing to say if the bank comes up in Q&A |
| The v4.1 speed ratio quoted as an accuracy figure, or without its bank | It is speed on the 14 both arms got right, on the uncapped bank | not on the slide since the subtitle was removed on 2026-09-19, available for Q&A from this file; "(v4.1)" is said with it |
| The Phase 0 corrected-bank projection (23 to 28 of 30) | It is a projection from a hand-check of bank v0 ambiguity, not a measurement | absent; slide 6d beat 4 shows the measured 21 of 30 only |
| Phase 0 read as a product benchmark | One run, one cheap model at temperature 0, and its web arm is a generic Exa-plus-python harness rather than a product | absent; beat 4 is framed as the same shape in a bare API agent, and the report calls 21 of 30 the inversion-risk check |
