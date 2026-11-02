# ocean-tides: data provenance

Every number, chart and status claim on a slide maps to a real artifact: a repo file, a
dataset query, a published article or a named document. This is the fact-check input.

One section per visible slide, in manifest order. A figure with no source yet carries
`FLAG:` and the sentence that says what to confirm before presenting.

All NOAA requests below were run on 2026-11-02. NOAA predictions are deterministic
harmonic forecasts, so re-running a request returns the same values unless NOAA
revises the station's harmonic constants.

---

## Slide 1: Cover

- No figures on this slide.

## Slide 2: Boston gets two high tides a day

Hourly series (`data/boston-days.ts` `HOURLY`):

```
curl "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=decks&datum=MLLW&station=8443970&time_zone=lst_ldt&units=metric&format=csv&begin_date=20250611&end_date=20250612&interval=60"
```

High tides marked on the line (`HIGHS`):

```
curl "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=decks&datum=MLLW&station=8443970&time_zone=lst_ldt&units=metric&format=csv&begin_date=20250601&end_date=20250630&interval=hilo"
```

| Figure | Value | Source |
|---|---|---|
| Two-day window | June 11 and 12, 2025 | `DAYS_LABEL`, the request above |
| Highs in window | 12:25 (2.638 m), 00:23 (3.079 m), 13:06 (2.644 m) | June `hilo` request |
| Average gap between highs | 12 h 25 min | `HIGH_GAP_LABEL` in `data/boston-month.ts`: 41 gaps between the 42 highs from Jan 10 07:30 to Jan 31 12:19 = 508.8 h / 41 = 12.41 h (Slide 4 request) |
| Lunar day | 24 hours 50 minutes | `LUNAR_DAY_LABEL` in `data/moon-clock.ts` (see Slide 3) |

## Slide 3: The Moon stretches the ocean into two bulges

Schematic, not to scale. Bulge heights and arrow lengths are geometry only.

| Figure | Value | Source |
|---|---|---|
| Lunar day | 24 hours 50 minutes | `data/moon-clock.ts`: 24 / (1 - 1/29.53) = 24.84 h. Synodic period 29.53 days from the NASA NSSDCA Moon fact sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html |
| Near side pulled hardest, far side least; two bulges | mechanism | Standard tidal (differential gravity) explanation. FLAG: author-reported; cite a textbook or NOAA Ocean Service tides tutorial if the audience expects a reference |

## Slide 4: The Sun makes the tide grow and shrink

```
curl "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=decks&datum=MLLW&station=8443970&time_zone=lst_ldt&units=metric&format=csv&begin_date=20250101&end_date=20250131&interval=hilo"
curl "https://aa.usno.navy.mil/api/moon/phases/date?date=2025-01-01&nump=8"
```

| Figure | Value | Source |
|---|---|---|
| Window | January 10 to 31, 2025 | `WINDOW_LABEL`; rows from Jan 10 on, verbatim |
| Full moon | Jan 13 22:27 UT (17:27 EST) | USNO request; marker placed in EST |
| Last quarter | Jan 21 20:31 UT (15:31 EST) | USNO request |
| New moon | Jan 29 12:36 UT (07:36 EST) | USNO request |
| Spring swing | 3.6 m | `SPRING`: largest high/low swing within 1.5 days of the new moon, Jan 30 11:33 (3.32 m) to 17:56 (-0.309 m) = 3.629 m |
| Neap swing | 1.8 m | `NEAP`: smallest swing within 1.5 days of the last quarter, Jan 22 17:33 (2.348 m) to 23:34 (0.579 m) = 1.769 m |
| Sun's tidal pull vs Moon's | 46% | `SUN_TO_MOON` in `data/moon-clock.ts`: (1,988,400 / 0.07346) x (0.3844 / 149.6)^3 = 0.459. Masses and distances from the NASA NSSDCA Moon and Sun fact sheets |

The window starts at Jan 10 rather than Jan 1 because the Jan 6 first-quarter neap
coincides with lunar perigee (closest approach), which enlarges that neap and muddies
the spring/neap contrast. Mention perigee in speaker notes if asked.

## Slide 5: Coastline shape decides how high the tide climbs

`MN` (Mean Range of Tide) from `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/<id>/datums.json?units=metric`.
All five report the 1983-2001 epoch.

| Station | Id | MN (m) |
|---|---|---|
| Anchorage, AK | 9455920 | 7.982 |
| Eastport, ME | 8410140 | 5.593 |
| Boston, MA | 8443970 | 2.893 |
| San Francisco, CA | 9414290 | 1.248 |
| Pensacola, FL | 8729840 | 0.365 |

| Figure | Value | Source |
|---|---|---|
| Anchorage range | 8.0 m | MN above |
| Pensacola range | 0.37 m | MN above |
| Anchorage over Pensacola | 22 times | 7.982 / 0.365 = 21.9 |
| Coastline shape plays a major role | claim | NOAA Ocean Service, "Where is the highest tide?", https://oceanservice.noaa.gov/facts/highesttide.html |
| Anchorage at the head of Cook Inlet; Eastport at the mouth of the Bay of Fundy | geography | Station locations, NOAA station pages |

---

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| a figure with no row above | Nothing on a slide is unsourced | absent |
| "Bay of Fundy has the world's highest tides" with a number | No Canadian station queried; NOAA's page names the bay but this deck has no figure for it | absent |
| Spring-to-neap ratio of 2.7 ((1+0.46)/(1-0.46)) | Theoretical; Boston's measured window gives about 2.0 because of perigee and local effects | absent |
