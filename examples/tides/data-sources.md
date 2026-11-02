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
| Near side pulled hardest, far side least; two bulges | mechanism | NOAA Ocean Service tides tutorial, "Gravity, Inertia, and the Two Bulges", https://oceanservice.noaa.gov/education/tutorial_tides/tides03_gravity.html: the Moon's attraction "is strongest on the side of the Earth that happens to be facing the moon"; on the far side it "is less because it is farther away", and a second bulge forms there. NOAA frames the far bulge as inertia exceeding gravity; the card's "Earth is pulled away from that water" is the same difference of pulls seen from Earth's center |
| Both bulges pass each coast | mechanism | Same page: "the two bulges stay aligned with the moon as the Earth rotates". The card does not say every coast sees two highs: Pensacola (Slide 5) gets one a day (see Fact-check below) |

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
| Pensacola range | 0.37 m | MN above, 0.365 rounded half-up (`PENSACOLA_LABEL`) |
| Anchorage over Pensacola | 22 times | 7.982 / 0.365 = 21.9 |
| Coastline shape plays a major role | claim | NOAA Ocean Service, "Where is the highest tide?", https://oceanservice.noaa.gov/facts/highesttide.html: "The shape and geometry of a coastline play a major role" |
| Funnel-shaped bays get the biggest tides | claim | NOAA Ocean Service tides tutorial, "Other Effects", https://oceanservice.noaa.gov/education/tutorial_tides/tides08_othereffects.html: "Funnel-shaped bays in particular can dramatically alter tidal magnitude", with the Bay of Fundy as "the classic example" |
| Anchorage at the head of Cook Inlet; Eastport at the mouth of the Bay of Fundy | geography | Station locations, NOAA station pages |

---

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| a figure with no row above | Nothing on a slide is unsourced | absent |
| "Bay of Fundy has the world's highest tides" with a number | No Canadian station queried; NOAA's page names the bay but this deck has no figure for it | absent |
| "Long, narrow bays get the biggest tides" | NOAA's "Other Effects" page says the opposite of narrow inlets: they "tend to dissipate incoming tides". Funnel shape is the sourced claim | removed 2026-11-02 |
| "each coast passes two highs" | Many Gulf of Mexico stations are diurnal (NOAA tides tutorial, tides07_cycles); Pensacola, on Slide 5, has one high a day | removed 2026-11-02 |
| "The Gulf of Mexico barely moves" | One station (Pensacola) is not the Gulf | removed 2026-11-02 |
| Spring-to-neap ratio of 2.7 ((1+0.46)/(1-0.46)) | Theoretical; Boston's measured window gives about 2.0 because of perigee and local effects | absent |

## Fact-check (2026-11-02)

Run per `.claude/skills/fact-checking-a-deck/SKILL.md` after the deck was drafted
by Claude Code, before it shipped as `examples/tides`. Every request above was
re-run on 2026-11-02 and compared with the data modules by script.

| # | Claim | Location | Result | Status |
|---|---|---|---|---|
| 1 | 48 hourly Boston levels, June 11 to 12, 2025 | `data/boston-days.ts` `HOURLY_M` | 48 rows, 0 differences from the hourly request | VERIFIED |
| 2 | Highs 12:25 (2.638), 00:23 (3.079), 13:06 (2.644) | `data/boston-days.ts` `HIGHS` | June `hilo` request returns the same three rows | VERIFIED |
| 3 | 85 highs and lows, January 10 to 31, 2025 | `data/boston-month.ts` `ROWS` | 85 rows, 0 differences from the January `hilo` request | VERIFIED |
| 4 | Full moon Jan 13 22:27, last quarter Jan 21 20:31, new moon Jan 29 12:36 (UT) | `data/boston-month.ts` `PHASES` | USNO request returns the same three instants | VERIFIED |
| 5 | Spring swing 3.6 m, neap swing 1.8 m | `SPRING_LABEL`, `NEAP_LABEL` | 3.629 m and 1.769 m computed from rows in #3 | VERIFIED |
| 6 | High tides 12 h 25 min apart | `HIGH_GAP_LABEL` | 42 highs, 41 gaps, 12.410 h | VERIFIED |
| 7 | Lunar day 24 hours 50 minutes | `LUNAR_DAY_LABEL` | NASA Moon fact sheet: synodic period 29.53 days; 24 / (1 - 1/29.53) = 24.841 h | VERIFIED |
| 8 | Sun's tidal pull 46% of the Moon's | `SUN_TO_MOON_LABEL` | NASA fact sheets: Moon 0.07346e24 kg at 0.3844e6 km, Sun 1,988,400e24 kg at 149.6e6 km; 0.459. NOAA tides02_cause: the Sun's force is "about half" the Moon's | VERIFIED |
| 9 | Mean range at five stations, 1983-2001 epoch | `data/ranges.ts` `STATIONS` | datums.json MN: 7.982, 5.593, 2.893, 1.248, 0.365, all epoch 1983-2001 | VERIFIED |
| 10 | Pensacola averages 0.37 m | `PENSACOLA_LABEL` | The card rendered "0.36 m": `(0.365).toFixed(2)` rounds the double down. Fixed to round half-up | MISMATCH, fixed |
| 11 | Anchorage 22 times Pensacola | `ANCHORAGE_OVER_PENSACOLA` | 7.982 / 0.365 = 21.9 | VERIFIED |
| 12 | "Long, narrow bays get the biggest tides" | Slide 5, beat 2 lead | NOAA tides08_othereffects: funnel-shaped bays magnify tides; narrow inlets "tend to dissipate" them. Lead now reads "Funnel-shaped bays get the biggest tides." | MISMATCH, fixed |
| 13 | "so each coast passes two highs" | Slide 3, beat 3 body | Pensacola `hilo` predictions, Jan 10 to 16, 2025 (`.../datagetter?product=predictions&station=8729840&interval=hilo&datum=MLLW&units=metric&time_zone=lst_ldt&begin_date=20250110&end_date=20250116`): one high and one low a day. Body now reads "so both bulges pass each coast." | MISMATCH, fixed |
| 14 | "The Gulf of Mexico barely moves" | Slide 5, beat 3 lead | Generalizes one station to a basin. Lead now reads "Pensacola's tide barely moves." | UNSOURCED, fixed |
| 15 | Near bulge, far bulge | Slide 3 | NOAA tides03_gravity, quoted in the Slide 3 table. The author-reported flag is resolved | VERIFIED |
| 16 | Anchorage at the head of Cook Inlet; Eastport at the Bay of Fundy's mouth | Slide 5, beat 2 body | Cook Inlet runs from the Gulf of Alaska to Anchorage at its northern end; Eastport is on Passamaquoddy Bay, an inlet at the Bay of Fundy's western entrance | VERIFIED |
| 17 | Cover byline | Slide 1 | Read "Riley Hilliard · Explainer", which did not say who wrote the deck. Now "Drafted by Claude Code · Edited by Riley Hilliard" | fixed |

Nothing here goes stale: the tide figures are predictions for closed 2025 windows and
the datums are for a fixed epoch.
