## Slide 16: OpenChart tells the agent which field is wrong.

Read 2026-11-13 from `~/Projects/openchart` (commit 26bd0ba6). The verdict is computed, not recorded: `data/16-openchart.ts` calls `validateSpec` from the installed `@opendata-ai/openchart-engine` when it loads.

| Figure | Value | Source |
|---|---|---|
| README_SPEC | the bar chart spec | `openchart/README.md` lines 26 to 44, as an object. The slide prints `JSON.stringify(spec, null, 2)` with the data rows and the chrome block dropped |
| TYPO | `language` written as `langauge` | this deck's own edit, in the manner of `packages/engine/src/compiler/__tests__/validate-did-you-mean.test.ts` lines 25 to 40 (`revenue` as `reveune`) |
| VERDICT.path | `/encoding/y/field` | `validateSpec(BAD_SPEC).errors[0].path`, at module load |
| VERDICT.code | `DATA_FIELD_MISSING` | `validateSpec(BAD_SPEC).errors[0].code`, at module load |
| VERDICT.suggestion | Use one of the available data columns: language, popularity. Did you mean "language"? | `validateSpec(BAD_SPEC).errors[0].suggestion`, at module load |
| FIXED | valid, 0 errors | `validateSpec(README_SPEC)`, at module load |
| "by edit distance" | claim | `openchart/packages/engine/src/compiler/validation/helpers.ts` (the did-you-mean helper) |
| ENGINE_VERSION | 9.0.0 | this repo's `package.json` pins `@opendata-ai/openchart-engine` 9.0.0; every `openchart/packages/*/package.json` says 9.0.0 |
| PACKAGES: core | 13,668 lines | `find packages/core/src -name '*.ts*' -not -path '*__tests__*' -not -name '*.test.*' \| xargs cat \| wc -l` |
| PACKAGES: engine | 50,369 lines | the same command on `packages/engine/src`. The outline said 50,097 |
| PACKAGES: vanilla | 42,424 lines | the same command on `packages/vanilla/src` |
| PACKAGES: react | 2,639 lines | the same command on `packages/react/src` |
| PACKAGES: vue | 2,502 lines | the same command on `packages/vue/src`. `.vue` files are not matched by the glob |
| PACKAGES: svelte | 864 lines | the same command on `packages/svelte/src`. `.svelte` files are not matched by the glob; the two wrappers hold 1,339 lines of `.vue` and `.svelte` between them |
| REACT_SHARE (notes) | 5 percent | 2,639 / 50,369, rounded, computed in the data module |
| MARKS (notes) | 19 | entries of `MARK_TYPES` in `packages/core/src/types/spec.ts` lines 3486 to 3506. Two comments in the repo say 16 |
| VALIDATOR_LINES (notes: "about thirty-four hundred") | 3,369 | `find packages/engine/src -path '*validat*' -not -path '*__tests__*' -name '*.ts' \| xargs wc -l` |
| Notes: "no schema library behind it" | claim | the validator's files import only relative modules and `@opendata-ai/*` |
| Notes: JSON Schema generated from the types, checked in CI | claim | `openchart/package.json` scripts `generate:schema` and `check:generated`; `.github/workflows/ci.yml` lines 44 to 46 |
| "Drawing is a separate package from the engine" | claim | `openchart/README.md` lines 126 to 128: core and engine are "(no DOM)", vanilla is "DOM rendering" |
| Notes: vanilla can render SVG on a server | claim | `openchart/README.md` line 159: `renderStaticSVG` from `@opendata-ai/openchart-vanilla/static`, "No browser or DOM shim is required" |
| Notes: wrappers sit on vanilla | claim | `packages/{react,vue,svelte}/package.json` each depend on core, engine and vanilla |
| Role labels in the package list | types and theme; computes layout; draws to the DOM; wrapper | `openchart/README.md` lines 126 to 128, shortened |
