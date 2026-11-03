# state-of-js: data provenance

Every number, chart and status claim on a slide maps to a real artifact: a repo file, a
dataset query, a published article or a named document. This is the fact-check input.

One section per visible slide, in manifest order. A figure with no source yet carries
`FLAG:` and the sentence that says what to confirm before presenting.

All figures come from the State of JavaScript survey (Devographics), editions 2016 to
2025, exported 2026-11-03 from OpenData dataset `state-of-survey/state-of-js`
(https://tryopendata.ai/datasets/state-of-survey/state-of-js), license CC-BY-4.0. The two
CSVs and the export notes are checked in under `data/raw/`:

```
# data/raw/tools_historical.csv: one row per tool per survey year
GET https://api.tryopendata.ai/v1/datasets/state-of-survey/state-of-js?view=all&filter[table]=tools_historical&fields=tool_id,tool_name,year,respondents,awareness,usage,interest,retention&sort=tool_id,year&limit=1000&format=csv
# data/raw/tools_2025.csv: the 2025 edition's tools with their category
GET https://api.tryopendata.ai/v1/datasets/state-of-survey/state-of-js?view=all&filter[table]=tools&fields=tool_id,tool_name,category,respondents,awareness,usage,interest,retention,used_count,never_heard_count&format=csv
# then
node examples/state-of-js/scripts/extract.mjs
```

`extract.mjs` writes `data/sojs.generated.ts` verbatim from the CSVs. It refuses to write
on a changed header, an empty cell, a ratio outside 0 to 1, a year outside 2016 to 2025,
or a repeated tool and year. Every derived value is computed in the per-slide `data/*.ts`
modules; on-slide percentages are `Math.round(ratio * 100)` (`pct` in `data/survey.ts`),
the precision the export carries (two decimal places).

Column meanings (from `data/raw/SOURCE.md`): **usage** is the share of respondents who
have used the tool, shown on slides as "used it" / "had used it". **Retention** is the
share of the tool's users who would use it again, shown as "would use it again". Respondents
self-select, so every claim is phrased about survey respondents or a tool's users, never
about all JavaScript developers.

Some modules check a claim the slide types rather than computes, and throw when it stops
holding. `slidev build` bundles those modules without running them, so the checks run in
`bun run test` (`packages/decks/story/data-guards.test.ts` loads every story deck's
`data/*.ts`). Run it after every refresh.

---

## Slide 1: Cover

`data/cover.ts`, `data/survey.ts`.

| Figure | Value | Source |
|---|---|---|
| Title "In 2025, 87% of survey respondents had used webpack." | webpack `Usage` 2025 = 0.87 | `TITLE_YEAR`, `TITLE_USAGE`; typed in `pages/01-cover.md` and the `slides.md` title, `cover.ts` throws if it moves |
| Title "26% of them would use it again." | webpack `Retention` 2025 = 0.26 (share of webpack's users, so "of them") | `TITLE_RETENTION`; same guard |
| "2016 to 2025" in the lede | first and last `Year` in `tools_historical.csv` | `FIRST_YEAR`, `LAST_YEAR`; `survey.ts` throws if the span changes |
| Field line "webpack, would use again" | webpack `Retention` 2016 92, 2017 95, 2018 92 (est.), 2019 90 (est.), 2020 87, 2021 75, 2022 63, 2023 46, 2024 35, 2025 26 | `WEBPACK_RETENTION` via `filled` |
| Field line "Vite, used it" | Vite `Usage` 2021 29, 2022 48, 2023 73, 2024 78, 2025 84 | `VITE_USAGE` |

## Slide 2: webpack retention fell from 95% to 26% as Vite use rose from 29% to 84%

`data/webpack.ts`, `tools_historical.csv` rows `webpack` and `vite`.

| Figure | Value | Source |
|---|---|---|
| webpack usage line | 2016 53, 2017 73, 2018 78 (est.), 2019 83 (est.), 2020 88, 2021 89, 2022 84, 2023 90, 2024 86, 2025 87 | `WEBPACK_USAGE` |
| webpack retention line | 2016 92, 2017 95, 2018 92 (est.), 2019 90 (est.), 2020 87, 2021 75, 2022 63, 2023 46, 2024 35, 2025 26 | `WEBPACK_RETENTION` |
| Vite usage line | 2021 29, 2022 48, 2023 73, 2024 78, 2025 84 | `VITE_USAGE` |
| "87% had used it in the 2025 survey" | 0.87 | `WEBPACK_USAGE_2025`, `LAST` |
| FLAG: estimated, 2018 and 2019 webpack points | the export has no webpack row for 2018 or 2019; both are straight-line interpolations between 2017 and 2020, not survey results. The card says "2018 and 2019 are estimated from the trend." | `filled` in `survey.ts`, `WEBPACK_ESTIMATED`; throws unless exactly 2018, 2019 |
| 95% in 2017 (headline, card) | 0.95, webpack's highest measured retention | `WEBPACK_FROM`, `WEBPACK_RETENTION_FROM` (estimates excluded); throws if either moves |
| 26% in 2025 (headline, card, chip) | 0.26 | `WEBPACK_RETENTION_2025` |
| "Its retention fell in every edition since 2017" | measured editions only: 95 > 87 > 75 > 63 > 46 > 35 > 26 | `FELL_EVERY_EDITION`; throws if any edition rose |
| Vite 29% in 2021, 84% in 2025 | 0.29, 0.84 | `VITE_FIRST`, `VITE_USAGE_2025` |
| "Its retention held at 97% to 98%" | Vite retention 2021 0.97, 2022 to 2025 0.98 | `VITE_RETENTION_MIN`, `VITE_RETENTION_MAX` |
| Title figures 95, 26, 29, 84 | as above | typed in `slides.md`; `webpack.ts` throws if any moves |

"Rose" in the headline describes 2021 and 2025 only: Vite usage rose in every edition
(29, 48, 73, 78, 84), so no intermediate dip is hidden.

## Slide 3: 26 of every 100 webpack users would use it again, against 98 of every 100 Vite users

`data/keep.ts`, 2025 `Retention` from `tools_historical.csv`.

| Figure | Value | Source |
|---|---|---|
| 100 squares | one square per percent of a tool's users | `UNITS` (geometry of the percentage, not a count of people) |
| 26 of 100 (webpack) | 0.26 | `WEBPACK_KEEP` |
| 98 of 100 (Vite) | 0.98 | `VITE_KEEP` |
| "97% or higher in every edition from 2021 to 2025" | Vite retention 2021 0.97, 2022 to 2025 0.98 | `VITE_KEEP_MIN`, `VITE_FIRST_YEAR`, `YEAR` |
| Title figures 26 and 98 | as above | typed in `slides.md`; `keep.ts` throws if either moves |

"Of every 100 ... users" means 100 of that tool's users, not 100 respondents; the cards say
"webpack users" and "Vite users" to keep the denominators apart.

## Slide 4: Of 12 build tools in 2025, webpack ranked first in use and last in retention

`data/build-tools.ts`, `tools_2025.csv` rows with `Category` = `build_tools`.

| Tool | Usage 2025 | Retention 2025 |
|---|---|---|
| webpack | 87 | 26 |
| Vite | 84 | 98 |
| esbuild | 54 | 88 |
| tsc CLI | 53 | 74 |
| Rollup | 47 | 84 |
| Turbopack | 28 | 66 |
| SWC | 27 | 83 |
| Parcel | 26 | 65 |
| Bun | 25 | 91 |
| tsup | 12 | 85 |
| Rolldown | 10 | 94 |
| Rspack | 7 | 87 |

| Figure | Value | Source |
|---|---|---|
| 12 build tools | rows with `build_tools` | `TOOL_COUNT` |
| 2025 (headline, first card, source link) | the edition `tools_2025.csv` holds; the file has no year column | `EDITION`; `build-tools.ts` throws if webpack's or Vite's usage and retention in the file differ from their 2025 rows in `tools_historical.csv` |
| webpack first and Vite second in usage | 87, 84 | `BY_USAGE`; throws otherwise |
| Vite first and webpack last in retention | 98, 26 | `BY_RETENTION`; throws otherwise, or on a tie at either end |
| "The other 10 sit between 65% and 94%" | Parcel 65, Rolldown 94 | `OTHERS_COUNT`, `OTHERS_MIN`, `OTHERS_MAX` |
| "trails the next-lowest tool, Parcel, by 39 points" | 65 - 26 | `NEXT_LOWEST`, `GAP_TO_NEXT` |
| Title figures 12, first, last | as above | typed in `slides.md`; `build-tools.ts` throws if they move |

Bun is listed under `build_tools` in the export (it is also a runtime); kept as the
survey categorised it.

## Slide 5: Since 2021, Jest retention fell to 65% as Vitest use rose to 54%

`data/testing.ts`, `tools_historical.csv` rows `jest` and `vitest`, editions 2021 and
2025. 2021 is the first edition with a Vitest row (`FROM`).

| Figure | 2021 | 2025 | Source |
|---|---|---|---|
| Jest usage | 72 | 75 | `JEST_USAGE` |
| Jest retention | 92 | 65 | `JEST_RETENTION` |
| Vitest usage | 2 | 54 | `VITEST_USAGE` |
| Vitest retention | 94 | 97 | `VITEST_RETENTION` |

| Figure | Value | Source |
|---|---|---|
| "held at 96% in every edition from 2018 to 2020" | Jest retention 2018 0.96, 2019 0.96, 2020 0.96; its maximum | `JEST_PEAK`, `JEST_PEAK_FROM`, `JEST_PEAK_TO`; throws if the peak years stop being one run |
| "Higher than Jest's retention in any edition, including its 96% peak" | Vitest 2025 97 > Jest max 96 | throws if not |
| Title figures 2021, 65, 54 | as above | typed in `slides.md`; `testing.ts` throws if they move |

A slope chart shows two editions only. Jest retention between them: 2022 89, 2023 79,
2024 73, so the fall is steady, not a single-year drop. Jest's 2016 retention (0.58) is
below its later values; the card's "96% peak" is the maximum, not the first value.

---

## Fact-check (2026-11-03)

Both API requests above were re-run on 2026-11-03; the responses are byte-identical to
`data/raw/tools_historical.csv` and (row order aside) `data/raw/tools_2025.csv`. Every
plotted series and card figure was then recomputed from the fresh responses with a
separate Python script (no shared code with `data/*.ts`) and matched.

## Numbers refresh (2026-11-03)

| Item | Old | New | Provenance |
|---|---|---|---|
| All figures | (new deck) | as above | export of 2026-11-03, `data/raw/` |

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| "JavaScript developers" as the subject of a figure | Respondents self-select; figures describe survey respondents or a tool's users | absent; the cover title says "survey respondents" |
| "Respondents would rather use Vite" (the first cover title) | Retention is asked of each tool's own users; no question compares webpack and Vite for the same respondent, so "rather" is an inference | removed 2026-11-03 in the fact-check; the cover states the two webpack figures instead |
| "Jest retention fell from 96% to 65%" over the 2021 to 2025 slope | Jest's 2021 retention is 92; 96 is 2018 to 2020. The slope chart starts at 2021 | absent; the card names 96% as the 2018 to 2020 level |
| "Vite overtook webpack in usage" | 2025 usage is webpack 87, Vite 84 | absent |
| A webpack value for 2018 or 2019 | The export has no rows for those editions | absent; lines break across the gap |
| "Vitest retention 98%" for 2025 | 2025 is 0.97; 0.98 is 2024 | absent |
