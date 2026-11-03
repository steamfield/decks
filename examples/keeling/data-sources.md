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
python3 -I decks/keeling/scripts/extract.py /tmp/keeling-raw
```

`extract.py` writes `data/noaa.generated.ts` verbatim from the CSVs. Every derived value
(peaks, swings, decade means, halfway year) is computed in the per-slide `data/*.ts`
modules at build time, so a refresh updates the slides without hand edits. Values below
are what the 2026-10-09 files produce.

---

## Slide 1: Cover

- No figures. "Rising faster" is the Slide 4 finding.

## Slide 2: Carbon dioxide in the air keeps climbing

`data/record.ts`, from `co2_mm_mlo.csv` column `average` (ppm).

| Figure | Value | Source |
|---|---|---|
| Monthly series | March 1958 to September 2026, 823 months | `SERIES`, every row of the file |
| First month and value | March 1958, 315.71 ppm | `FIRST` = first row |
| Highest month and value | May 2026, 432.34 ppm | `PEAK` = max of `average` |
| Scripps data to April 1974, NOAA after | 1974 | `NOAA_FROM`; file header: "Data from March 1958 through April 1974 have been obtained by C. David Keeling of the Scripps Institution of Oceanography" |
| Axis ticks / gridlines | 1958, 1980, 2000, 2020; 320 to 440 ppm | geometry |

## Slide 3: The curve breathes once a year

`data/seasons.ts`, same file, rows 2021 to 2025.

| Figure | Value | Source |
|---|---|---|
| Window | 2021 through 2025 | `FROM`, `TO` |
| High months | May (2021, 2022, 2023, 2025), June (2024) → "May or June" | `HIGHS`, `HIGH_MONTHS` |
| Low months | September (2021, 2023, 2024, 2025), October (2022) → "September or October" | `LOWS`, `LOW_MONTHS` |
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
| "This decade is running faster still" | 2020s 2.56 > 2010s 2.42 | the module throws at build time if the partial decade's mean is not above the last full decade's. It rests on six years, 2024 alone at 3.33; 2025 was 2.23 |

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
| Halfway value | 371.665 ppm | `HALF` = (315.98 + 427.35) / 2 |
| Halfway year | 2002 (2001: 371.32, below; 2002: 373.45, above) | `HALF_YEAR`, first year with mean ≥ `HALF` |
| Years before / after | 43 (1959 to 2002), 23 (2002 to 2025) | `YEARS_BEFORE`, `YEARS_AFTER` |
| Every annual mean higher than the year before | true | `ALWAYS_UP`; the module throws at build time if this stops holding. Cross-check: smallest `ann inc` in `co2_gr_mlo.csv` is 0.31 (1964) |

---

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| Pre-industrial 280 ppm baseline | Comes from ice cores, not this dataset; no source recorded in this deck | absent |
| "Northern Hemisphere forests" as the seasonal driver | The cited NOAA page says "plants ... during the growing season", not hemisphere | absent |
| "Half the rise came in the last quarter century" | 23 years, not 25 | absent |
