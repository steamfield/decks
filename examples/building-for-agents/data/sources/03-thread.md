## Slide 3: I ship a change with seven tools I built.

Station order, verbs, names, icons and language chips are `data/products.ts` (see "Every slide: product chips").

| Figure | Value | Source |
|---|---|---|
| OPENDATA_TESTS | "about 14,000" | Published figure: `~/Projects/rr/README.md` line 58 ("around 14,000 tests", rr commit 536948d) and `~/Projects/steamfield/src/content/blog/why-steamfield.mdx` line 26 ("about 14,000 tests", steamfield commit 1b001f9). `FLAG:` replace with a collected count before the talk (`pytest --collect-only -q` in `opendata/` and `backend/`, `vitest list` in the TypeScript packages, or the totals of one `rr test` run); the outline's static count on 2026-11-13 was higher |
| "Most started inside OpenData" | claim | `FLAG: author-reported` |
| "Six of the seven use TypeScript" | 6 of the 7 language chips name TypeScript | `TYPESCRIPT_PRODUCTS` in `data/03-thread.ts`, computed from `data/products.ts` |
| "rr is Go" | claim | `~/Projects/rr/go.mod` |
| "StatGlass samples the system in Rust" | claim | `~/Projects/statglass/crates/statglass-collect/src/` (Rust sources, statglass commit 5db8622a) |
| FEATURED | Stacks, foreman, StatGlass | `OUTLINE.md` section 3 (Riley's decision, 2026-11-13) |
| BRIEF_SECONDS (notes: "about ninety seconds each") | 90 | `FLAG: author-reported` (`OUTLINE.md` section 10) |
| "OpenData's engine is Python" | claim | `~/Projects/opendata/pyproject.toml` (see "Every slide: product chips") |
| "Six of the seven are open source; OpenData is open core" (IF ASKED) | claim | `license` fields in `~/Projects/steamfield/src/data/projects.ts` (line 41 for OpenData) |
