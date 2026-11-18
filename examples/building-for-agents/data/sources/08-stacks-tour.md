## Slide 8: The Stacks CLI is written with Effect.

From `~/Projects/stacks/packages/cli`. The counts and code excerpts were reread on 2026-11-18 at commit 6525ecbd (`main`, after the CLI structure refactor regrouped the source into folders and moved each error's exit policy onto its class); the tree rows at 87de4915 (the refactor branch); everything else was read 2026-11-13 at commit a952e96.

| Figure | Value | Source |
|---|---|---|
| SRC_FILES | 231 | `find src -name '*.ts' \| wc -l` (6525ecbd) |
| SRC_LINES | 29,424 | `find src -name '*.ts' \| xargs cat \| wc -l` (6525ecbd) |
| TEST_FILES (notes) | 223 | `find tests -name '*.test.ts' \| wc -l` (6525ecbd) |
| Tree rows | bin.ts, main.ts, cli.ts, runtime.ts, errors.ts, commands/, services/, platform/, schemas/, core/, tests/ | `ls src` and `ls` (87de4915); the notes paraphrase `~/Projects/stacks/AGENTS.md`'s architecture map |
| RUNS_COMMAND | `src/commands/runs.ts` lines 9 to 27 | `data/code/08-stacks.ts`, checked by `data/code/excerpts.test.ts` |
| HOST_SERVICE | `src/services/host.ts` lines 33 to 53 | same |
| APP_LAYER | `src/runtime.ts` lines 18 to 30 | same |
| ERROR_TABLE | `src/errors.ts` lines 221 to 480 (`UpstreamUnavailable`, then `errorTable`) | same |
| LAYER_TEST | `tests/update.test.ts` lines 250 to 279 | same |
| "bin.ts is the only file allowed to touch Node, and a lint rule enforces that" (notes) | claim | `biome-plugins/boundaries.grit` lines 1 to 40 |
| "There are no module mocks" (notes) | claim | `~/Projects/stacks/AGENTS.md` line 174 |
| "Effect 4, with the CLI module that ships inside the effect package" (notes) | claim | root `package.json` catalog `"effect": "^4.0.6"`; `bun.lock` pins `effect@4.0.6`; imports from `"effect/cli"` in `src/` |
| "runs on Node 22 or newer; Bun builds and bundles it" (notes) | claim | `package.json` `engines`; `scripts/build.ts` lines 34 to 49; `dist/stacks` refuses Bun |
