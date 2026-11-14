## Slide 5: The Stacks CLI is written with Effect.

All from `~/Projects/stacks/packages/cli` at commit a952e96, read 2026-11-13.

| Figure | Value | Source |
|---|---|---|
| SRC_FILES | 203 | `find src -name '*.ts' \| wc -l` |
| SRC_LINES | 24,386 | `find src -name '*.ts' \| xargs cat \| wc -l` |
| TEST_FILES (notes) | 209 | `find tests -name '*.test.ts' \| wc -l` |
| Tree rows | bin.ts, main.ts, cli.ts, runtime.ts, errors.ts, commands/, services/, platform/, schemas/, core/, tests/ | `ls src` and `ls`; the notes paraphrase `~/Projects/stacks/AGENTS.md`'s architecture map |
| RUNS_COMMAND | `src/commands/runs.ts` lines 8 to 25 | `data/code/05-stacks.ts`, checked by `data/code/excerpts.test.ts` |
| HOST_SERVICE | `src/services/host.ts` lines 29 to 49 | same |
| APP_LAYER | `src/runtime.ts` lines 11 to 19 | same |
| ERROR_TABLE | `src/errors.ts` lines 425 to 443 | same |
| LAYER_TEST | `tests/update.test.ts` lines 250 to 279 | same |
| "bin.ts is the only file allowed to touch Node, and a lint rule enforces that" (notes) | claim | `biome-plugins/boundaries.grit` lines 1 to 40 |
| "There are no module mocks" (notes) | claim | `~/Projects/stacks/AGENTS.md` line 174 |
| "Effect 4, with the CLI module that ships inside the effect package" (notes) | claim | root `package.json` catalog `"effect": "^4.0.6"`; `bun.lock` pins `effect@4.0.6`; imports from `"effect/cli"` in `src/` |
| "runs on Node 22 or newer; Bun builds and bundles it" (notes) | claim | `package.json` `engines`; `scripts/build.ts` lines 34 to 49; `dist/stacks` refuses Bun |
