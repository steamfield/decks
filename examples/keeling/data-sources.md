# keeling: data provenance

Every number, chart and status claim on a slide maps to a real artifact: a repo file, a
dataset query, a published article or a named document. This is the fact-check input.

One section per visible slide, in manifest order. A figure with no source yet carries
`FLAG:` and the sentence that says what to confirm before presenting.

All figures come from three NOAA Global Monitoring Laboratory CSVs, downloaded 2026-11-02
(file header: "File Creation: Fri Oct 9 13:08:07 2026"). To refresh:

```
mkdir -p /tmp/keeling-raw
curl -sfL https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv     -o /tmp/keeling-raw/co2_mm_mlo.csv
curl -sfL https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv -o /tmp/keeling-raw/co2_annmean_mlo.csv
curl -sfL https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_gr_mlo.csv     -o /tmp/keeling-raw/co2_gr_mlo.csv
python3 -I examples/keeling/scripts/extract.py /tmp/keeling-raw
```

`extract.py` writes `data/noaa.generated.ts` verbatim from the CSVs, and exits without
writing on an empty cell, a NOAA missing-value sentinel or a value not above zero. Every
derived value (peaks, swings, decade means, halfway year) is computed in the per-slide
`data/*.ts` modules, so a refresh updates the slides without hand edits. Values below
are what the 2026-10-09 files produce.

Re-checked 2026-11-05 for the staging revision: the three files still carry the
2026-10-09 creation stamp, `extract.py` output is byte-identical to the committed
`noaa.generated.ts`, and every figure below was re-derived from the raw CSVs with an
independent script (no deck code) and matched.

Some modules also check a claim the slide types rather than computes, and throw when it
stops holding. `slidev build` bundles those modules without running them, so the checks
run in `bun run test` (`packages/decks/story/data-guards.test.ts` loads every story
deck's `data/*.ts`). Run it after every refresh.

---

## Slide 1: Cover

- No figures. "Rising faster" is the Slide 4 finding.
- The curve behind the title is the Slide 2 series (`data/record.ts` `SERIES`), drawn at the
  shared geometry in `data/frame.ts` (no figures there) so it hands off to Slide 2 unchanged.

## Slide 2: Carbon dioxide in the air keeps climbing

`data/record.ts`, from `co2_mm_mlo.csv` column `average` (ppm).

| Figure | Value | Source |
|---|---|---|
| Monthly series | March 1958 to September 2026, 823 months | `SERIES`, every row of the file |
| First month and value | March 1958, 315.71 ppm | `FIRST` = first row |
| Highest month and value | May 2026, 432.34 ppm | `PEAK` = max of `average` |
| Scripps data to April 1974, NOAA after | 1974 | `NOAA_FROM`; file header: "Data from March 1958 through April 1974 have been obtained by C. David Keeling of the Scripps Institution of Oceanography" |
| Axis ticks / gridlines | 1958, 1980, 2000, 2020; 320 to 440 ppm | geometry; `TICK_YEARS`; `Y_DOMAIN` top and `GRID_PPM` are `PEAK` rounded up to the next 40 |
| Chips | "315.71 ppm" at the first month, "432.34 ppm" at the peak | `FIRST.y`, `PEAK.y` |

## Slide 3: The curve breathes once a year

`data/seasons.ts`, same file, rows 2021 to 2025. The slide opens on the Slide 2 record
(`data/record.ts`) with a box around the window, then zooms into it.

| Figure | Value | Source |
|---|---|---|
| Window | 2021 through 2025 | `FROM`, `TO`; the box and the zoomed x range are `X_DOMAIN` = [2021, 2026] |
| Zoomed y range and gridlines | 412 to 432 ppm; 415, 420, 425, 430 ppm | geometry: `Y_DOMAIN` is the lowest low floored and the highest high ceiled, padded by 1; `GRID_PPM` every 5 inside it |
| "NOAA calls it the seasonal cycle" | wording | NOAA GML carbon cycle basics (row below): "there is a clear seasonal cycle in atmospheric CO2" |
| Drawdowns (emerald, last beat) | each year's months from its high to its low | `DRAWDOWNS`; geometry from `HIGHS` and `LOWS`, no new figure |
| High months | May (2021, 2022, 2023, 2025), June (2024) → "May or June" | `HIGHS`, `HIGH_MONTHS` |
| Low months | September (2021, 2023, 2024, 2025), October (2022) → "September or October" | `LOWS`, `LOW_MONTHS` |
| "Highs in late spring, lows in early fall" | every high in May or June, every low in September or October | typed lead; `seasons.ts` throws if a high or low falls outside those months |
| Yearly swing range | 4.9 to 6.1 ppm (2024: 426.91 − 422.03 = 4.88; 2025: 430.51 − 424.37 = 6.14) | `SWING_LABEL` |
| Mechanism: plants draw CO2 down in the growing season, respiration and decay release it | mechanism | NOAA GML carbon cycle basics, https://gml.noaa.gov/education/carbon_toolkit/basics.html: "there is a clear seasonal cycle in atmospheric CO2 as plants photosynthesize during the growing season, removing large amounts of CO2. Respiration (from both plants and animals) and decomposition ... release CO2 back into the atmosphere." |
| Site note | Dec 2022 to early July 2023 measured at Maunakea, about 21 miles north, during the Mauna Loa eruption shutdown | file header. Not on the slide; speaker context only |

## Slide 4: The climb is steeper now than in the 1960s

`data/decades.ts`, from `co2_gr_mlo.csv` column `ann inc` (ppm/yr), plain mean of the years in each decade.

| Figure | Value | Source |
|---|---|---|
| 1960s | 0.857 → 0.86 | `DECADES` |
| 1970s | 1.28 | `DECADES` |
| 1980s | 1.61 | `DECADES` |
| 1990s | 1.51 | `DECADES` |
| 2000s | 1.97 | `DECADES` |
| 2010s | 2.425 → 2.42 (JS `toFixed(2)` on the float mean) | `DECADES` |
| 2020s, partial | 2020 to 2025, 6 years, 2.5617 → 2.56 | `CURRENT_YEARS`, `CURRENT_PPM` |
| 2010s vs 1960s | 2.425 / 0.857 = 2.83 → "2.8 times" | `SPEEDUP_LABEL` |
| 2020s column label | "2020s, to 2025" | `COLUMNS[].note`, `LAST_YEAR` = last year in `co2_gr_mlo.csv` |
| Chip | "2.8 times the 1960s rate" | `SPEEDUP_LABEL`, `FIRST_DECADE` |
| Dashed level across the chart | the 1960s mean, 0.857 ppm/yr | `FIRST_PPM` |
| Card: "Its first 6 years averaged 2.56 ppm a year" | 6, 2.56 | `CURRENT_YEARS`, `CURRENT_PPM` |
| Columns and gridlines | each column spans the years it averages on the Slide 2 time axis; 1, 2, 3 ppm/yr | geometry; `COLUMNS[].from`/`to`; `DOMAIN` top is the largest mean rounded up |
| "This decade is running faster still" | 2020s 2.56 > 2010s 2.42 | `decades.ts` throws if the partial decade's mean is not above the last full decade's (run by `bun run test`). It rests on six years, 2024 alone at 3.33; 2025 was 2.23 |

The rise is not steeper every decade: the 1990s (1.51) sit below the 1980s (1.61). The
headline compares the record's end with the 1960s rather than claiming each decade beat the one
before it.

## Slide 5: Half the rise came in the last 23 years

`data/halfway.ts`, from `co2_annmean_mlo.csv` column `mean` (ppm).

| Figure | Value | Source |
|---|---|---|
| Span | 1959 to 2025 | `FIRST`, `LAST` |
| First / last annual mean | 315.98, 427.35 ppm | `FIRST.y`, `LAST.y` |
| Total rise | 111.37 → "111 ppm" | `RISE_LABEL` |
| Halfway value | 371.665 → "371.7 ppm" on the card | `HALF` = (315.98 + 427.35) / 2; `HALF_LABEL` |
| Rise bracket chip | "+111 ppm" | `RISE_LABEL` |
| Halfway chip and drop line | "Halfway: 2002" at the 2002 annual mean | `HALF_POINT`, `HALF_YEAR`; the level line ends where the line between 2001 and 2002 crosses `HALF` (`CROSS_X`, geometry) |
| Span labels | "43 years", "23 years" | `YEARS_BEFORE`, `YEARS_AFTER` |
| Second half redrawn in amber | 2002 to 2025 | `AFTER` |
| Halfway year | 2002 (2001: 371.32, below; 2002: 373.45, above) | `HALF_YEAR`, first year with mean ≥ `HALF` |
| Years before / after | 43 (1959 to 2002), 23 (2002 to 2025) | `YEARS_BEFORE`, `YEARS_AFTER`; the on-slide headline reads `YEARS_AFTER`, and `halfway.ts` throws if it is not the 23 typed in the `slides.md` title |
| Every annual mean higher than the year before | true | `ALWAYS_UP`, cross-checked by `MIN_GROWTH`: smallest `ann inc` in `co2_gr_mlo.csv`, 0.31 (1964). `halfway.ts` throws if either stops holding (run by `bun run test`) |
| Axis range | 300 to 440 ppm | `Y_DOMAIN`, top = `LAST.y` rounded up to the next 40 |
| Dots on every annual mean (last beat) | 67 points, 1959 to 2025 | `SERIES`, every row of `co2_annmean_mlo.csv` |

## Slide 6: Anyone can download the whole record

`data/close.ts`. No figures.

| Claim | Value | Source |
|---|---|---|
| "the whole record" | the three CSVs are the full published series: 823 monthly rows, March 1958 to September 2026, no month missing | `co2_mm_mlo.csv`; the NOAA data page links all three (checked 2026-11-05) |
| "Every figure in this deck comes from NOAA's Mauna Loa CSV files" | the three CSVs at the top of this file | every `data/*.ts` module imports `noaa.generated.ts` or holds geometry only |
| QR code target | https://gml.noaa.gov/ccgg/trends/data.html | `DATA_URL`; the NOAA GML page that links the three CSVs |
| Background curve | the Slide 2 series, ghosted | `data/record.ts` `SERIES` |

---

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| Pre-industrial 280 ppm baseline | Comes from ice cores, not this dataset; no source recorded in this deck | absent |
| "Northern Hemisphere forests" as the seasonal driver | The cited NOAA page says "plants ... during the growing season", not hemisphere | absent |
| "Every month of it" on the close | the file has a row for every month, but its header says missing months were interpolated (NOAA months with negative `sdev`: December 1975 and April 1984; Scripps months carry no `sdev` at all), so "every month" overstates what was measured | absent; the close says "the whole record" |
| "Half the rise came in the last quarter century" | 23 years, not 25 | absent |
