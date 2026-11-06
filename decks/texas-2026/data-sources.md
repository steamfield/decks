# texas-2026: data provenance

Every number, name, date and status claim maps to a source below. This is the fact-check input for the fourteen-slide manifest in `OUTLINE.md`. Research cutoff and fetch date for **every row and query below: 2026-11-06**. Historical dates are identified separately from retrieval dates.

**Confirmed** means the cited source or query supports the stated, qualified claim. It does not turn unofficial returns into certified results or a scheduled deadline into a completed decision. **Pending** means the outcome remains unresolved. **FLAG** means author judgment or evidence still needed. Modules use lowercase status values; timeline `reported` describes a date's evidentiary basis. Source descriptions below are paraphrases unless in quotation marks.

## Slide 1: Cover

Module: `data/01-cover.ts`, importing election facts from Slide 2.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Offices changing party control | Governor, Lt. Governor, Attorney General, Comptroller and Texas House | Confirmed; certification Pending | [SOS returns][sos] and [House reporting][house]: Democratic statewide winners and House majority. These are election outcomes, not officers already inaugurated. | 2026-11-06 |
| Senate control | Republican | Confirmed; certification Pending | [Senate reporting][senate-news]: Republicans retain the chamber. | 2026-11-06 |
| Byline | Riley Hilliard; Austin; November 2026 | FLAG: author-reported | `OUTLINE.md`, Cover specification. Author must confirm public byline and talk month; no exact talk date was supplied. | 2026-11-06 |

## Slide 2: Power board

Module: `data/02-power-board.ts`. SOS snapshot displayed updated November 4, 2026, 4:59 p.m. No race is described as certified.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Governor winner | Gina Hinojosa, Democratic; 5,230,789 votes | Confirmed; certification Pending | [SOS][sos], Governor row; Abbott 4,524,527. [Tribune November 4][election-aisd] identifies Hinojosa's win. | 2026-11-06 |
| Lt. Governor winner | Vikki Goodwin, Democratic; 5,083,581 | Confirmed; certification Pending | [SOS][sos], Lieutenant Governor row; Patrick 4,484,652. | 2026-11-06 |
| Attorney General winner | Nathan Johnson, Democratic; 5,133,629 | Confirmed; certification Pending | [SOS][sos], Attorney General row; Middleton 4,502,442. | 2026-11-06 |
| Comptroller winner | Sarah Eckhardt, Democratic; 5,014,496 | Confirmed; certification Pending | [SOS][sos], Comptroller row; Huffines 4,511,185. | 2026-11-06 |
| House membership and majority threshold | 150 seats; 76 for a majority | Confirmed | [Constitution art. III §2][cn3]; floor(150 / 2) + 1. | 2026-11-06 |
| House majority | Democratic | Confirmed; final membership Pending | [House reporting][house]: 62 prior seats, 11 called flips plus 3 Republican concessions establish the majority. | 2026-11-06 |
| House split | Projected 83 Democratic / 67 Republican | Pending | [House reporting][house]: seven further Democratic leads would yield 83. Remaining returns and HD 93 candidate eligibility are unresolved. Do not present this as a final roster. | 2026-11-06 |
| Senate split | 31 total; 19 Republican / 12 Democratic; majority 16 | Confirmed as reported expected split; certification Pending | [Senate reporting][senate-news]; [Constitution art. III §2][cn3]. Johnson/Eckhardt transitions can create vacancies before a confirmation vote. | 2026-11-06 |
| SBOE composition | 15 total; projected 8 Democratic / 7 Republican | Pending | [SBOE reporting][sboe-news]: seven seats each outside District 8; result depends on that race. | 2026-11-06 |
| District 8 | Dana Van de Walker, Democratic, 300,108; Audrey G. Young, Republican, 299,544; lead 564 | Confirmed snapshot; result Pending | [SOS][sos]; subtraction 300108 − 299544 = 564. [SBOE reporting][sboe-news] says Young had not conceded and outstanding ballots could matter. | 2026-11-06 |
| Recount | Possible; no filed recount verified | Pending | [SBOE reporting][sboe-news] discusses the possibility. It does not establish an active recount. | 2026-11-06 |
| Certification | Unofficial returns; state canvass window November 21–December 7 | Pending | [SOS advisory 2026-28][canvass]: ordinary statewide canvass window, with Sunday deadline moving to Monday. Governor/Lt. Governor returns also follow legislative canvass under [art. IV §3][cn4]. | 2026-11-06 |

### Conflicts

The outline's “District 8 recount” implies a filed proceeding. The reporting supports a possible recount only. House control is supported, but the precise 83–67 split remains a projection. The 19–12 Senate split describes expected party membership, not a guarantee that all those senators will be present or still serving at a later vote.

## Slide 3: Outcome ladder

Module: `data/03-outcome-ladder.ts`.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Senate seats on the regular-election ballot | 16 of 31 | Confirmed | [SOS Senate returns][sos] lists the sixteen districts below; [TCTA candidate directory][senate-ballot] independently lists them. | 2026-11-06 |
| Republican-held ballot seats | 11 | Confirmed | District crosswalk below, using the [Senate roster][senate-roster] and [candidate directory][senate-ballot]. “Held” is the pre-general-election party, including retiring incumbents. | 2026-11-06 |
| Democratic-held ballot seats | 5 | Confirmed | Districts 9, 13, 19, 21 and 26. District 9 was already Democratic after Taylor Rehmet's special-election win. | 2026-11-06 |
| Democratic starting seats / holdovers | 12 / 7 | Confirmed | 12 starting seats less 5 contested = 7 holdovers. | 2026-11-06 |
| Majority target | 16 | Confirmed | floor(31 / 2) + 1. | 2026-11-06 |
| Minimum flips and contested-seat wins | Net 4 flips; win 9 of the 16 contested seats | Confirmed, conditional arithmetic | Retain 5 Democratic defenses and flip 4 of 11 Republican defenses: 7 holdovers + 5 retained + 4 flipped = 16. Every lost Democratic defense requires another Republican flip. | 2026-11-06 |
| Maximum mathematically possible Democratic seats | 23 | Confirmed, counterfactual | 7 holdovers + all 16 contested seats. | 2026-11-06 |
| Was a Democratic majority impossible? | No | Confirmed | Ballot arithmetic above. This does not estimate electoral likelihood. | 2026-11-06 |
| Rung reached | 4 confirmed; 5 provisional | Pending at rung 5 | Slide 2 outcomes: SBOE majority remains conditional on District 8. | 2026-11-06 |
| “Best” and rung ordering | Author's judgment relative to Hinojosa's public-school platform | FLAG: author-reported | `OUTLINE.md`, Slide 3; not a statistical rank or a neutral ordering of voter preferences. | 2026-11-06 |

| Ballot district | Incumbent / former incumbent | Party last holding seat |
|---|---|---|
| 1 | Bryan Hughes | Republican |
| 2 | Bob Hall | Republican |
| 3 | Robert Nichols | Republican |
| 4 | Brett Ligon | Republican |
| 5 | Charles Schwertner | Republican |
| 9 | Taylor Rehmet | Democratic |
| 11 | Mayes Middleton | Republican |
| 13 | Borris Miles | Democratic |
| 18 | Lois Kolkhorst | Republican |
| 19 | Roland Gutierrez | Democratic |
| 21 | Judith Zaffirini | Democratic |
| 22 | Brian Birdwell (former; seat vacant at audit) | Republican |
| 24 | Pete Flores | Republican |
| 26 | José Menéndez | Democratic |
| 28 | Charles Perry | Republican |
| 31 | Kevin Sparks | Republican |

### Margins in the eleven Republican-held seats

Source: [SOS November 3, 2026 returns][sos], displayed update November 4 at 4:59 p.m.; fetched November 6. Each of these eleven contests lists exactly two candidates, one Republican and one Democrat. Thus the winner's runner-up margin and the Republican–Democratic gap are identical. Percentages use **valid votes cast in that district's Senate race**, not statewide turnout or ballots including undervotes.

`senateMargins` sorts ascending by unrounded `marginPp = 100 × (Republican votes − Democratic votes) / total candidate votes`. The table rounds only the displayed margin to two decimals. `contested` means **Democratic opposition** in this module; it is different from “seat up for election” used in the earlier seat math.

| District | Republican winner | Votes | Democratic candidate | Votes | Total | Winner margin (pp) | Democrat on ballot? | Status | Fetched |
|---|---|---|---|---|---|---|---|---|---|
| 2 | Bob Hall | 180,363 | Keenen Colbert | 170,824 | 351,187 | 2.72 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 11 | Dennis Paul | 174,935 | Shannon Dicely | 164,777 | 339,712 | 2.99 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 5 | Charles Schwertner | 197,912 | Paul Thomasson | 173,380 | 371,292 | 6.61 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 18 | Lois W. Kolkhorst | 196,125 | Erica Gillum | 165,093 | 361,218 | 8.59 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 22 | David Cook | 186,433 | Amy Martinez-Salas | 146,611 | 333,044 | 11.96 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 24 | Pete Flores | 192,054 | Joe Paz Herrera | 147,026 | 339,080 | 13.28 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 4 | Brett W. Ligon | 205,530 | Ron C. Angeletti | 147,017 | 352,547 | 16.60 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 3 | Trent Ashby | 211,888 | Bobby Tillman | 93,016 | 304,904 | 38.99 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 28 | Charles Perry | 193,190 | Riley Rodriquez | 83,931 | 277,121 | 39.43 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 1 | Bryan Hughes | 229,545 | Laticia Ambroz | 91,022 | 320,567 | 43.21 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |
| 31 | Kevin Sparks | 163,490 | John Betancourt | 60,021 | 223,511 | 46.29 | Yes | Confirmed unofficial returns; certification Pending | 2026-11-06 |

| Derived claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Republican defenses contested by a Democrat | 11 of 11 | Confirmed | All eleven [SOS][sos] races have a Democratic candidate. | 2026-11-06 |
| Republican wins / Democratic flips in these seats | 11 / 0 | Confirmed unofficial returns; certification Pending | Republican vote total exceeds Democratic total in every row. | 2026-11-06 |
| Fourth-closest Republican–Democratic margin | District 18; 8.5909340066 percentage points, displayed 8.59 | Confirmed conditional arithmetic | Fourth row after sorting all eleven margins; (196125 − 165093) / 361218 × 100. | 2026-11-06 |
| “Close to the best actually achievable” | Author interpretation, not established by returns alone | FLAG: author-reported | The four smallest gaps were 2.72, 2.99, 6.61 and 8.59 points. These describe the result, not pre-election probabilities or a ceiling on feasible outcomes. | 2026-11-06 |

The fourth required flip was an 8.59-point Republican win, so the majority path required gains beyond the two closest races. That supports describing a substantial remaining electoral hurdle. It does not prove four flips were impossible or establish an objective “best achievable” result. An 8.59-point **margin** is not an 8.59-point change in one party's vote share: a direct switch between the two candidates changes their gap by twice the switched share. No uniform-swing forecast is encoded.

#### Reproduce the 2026 calculation

This SQL runs over the SOS rows transcribed above, not an invented remote dataset. Source URL: https://electionresults.sos.state.tx.us/results.html . All eleven complete candidate lists were inspected; there are no third-party votes to add to these denominators.

```sql
WITH returns(district, republican_votes, democratic_votes) AS (
  VALUES
    (2, 180363, 170824),
    (11, 174935, 164777),
    (5, 197912, 173380),
    (18, 196125, 165093),
    (22, 186433, 146611),
    (24, 192054, 147026),
    (4, 205530, 147017),
    (3, 211888, 93016),
    (28, 193190, 83931),
    (1, 229545, 91022),
    (31, 163490, 60021)
)
SELECT district, republican_votes, democratic_votes,
       republican_votes + democratic_votes AS total_votes,
       100.0 * (republican_votes - democratic_votes)
         / (republican_votes + democratic_votes) AS margin_pp
FROM returns
ORDER BY margin_pp, district;
```

### 2022 context for the same district numbers

Source: [TXElectionResults.com 2022 compilation](https://www.txelectionresults.com/2022-general-election), which attributes its data to the Texas Secretary of State; each row links to its race page. Fetched November 6, 2026. This is a **named compilation**, not a direct successful retrieval of the official archive. The [SOS archive](https://www.sos.texas.gov/elections/historical/elections-results-archive.shtml) points to [results.texas-election.com](https://results.texas-election.com/races), which returned HTTP 403. The [January 10, 2023 Senate Journal, pp. 1–2](https://journals.senate.texas.gov/sjrnl/88r/pdf/88RSJ01-10-F.PDF) independently reproduces the SOS-certified winners.

The cohort is the eleven Republican-held districts up in **2026**, not all Republican seats or all contests in 2022. Modules `senateMargins2022` and `senateMarginSummary2022` preserve this context separately.

| District / source | Republican winner | Votes | Runner-up | Party | Votes | Other votes | Winner margin (pp) | Democrat on ballot? | Status |
|---|---|---|---|---|---|---|---|---|---|
| [2](https://www.txelectionresults.com/2022-general-election/races/3460) | Bob Hall | 172,713 | Prince S. Giadolor | Democratic | 106,309 | 0 | 23.80 | Yes | Confirmed named-source record |
| [24](https://www.txelectionresults.com/2022-general-election/races/3476) | Pete Flores | 187,598 | Kathy Jones-Hospod | Democratic | 104,063 | 0 | 28.64 | Yes | Confirmed named-source record |
| [18](https://www.txelectionresults.com/2022-general-election/races/3471) | Lois W. Kolkhorst | 186,367 | Josh Tutt | Democratic | 95,287 | 0 | 32.34 | Yes | Confirmed named-source record |
| [4](https://www.txelectionresults.com/2022-general-election/races/3462) | Brandon Creighton | 202,341 | Misty Bishop | Democratic | 86,946 | 0 | 39.89 | Yes | Confirmed named-source record |
| [5](https://www.txelectionresults.com/2022-general-election/races/3463) | Charles Schwertner | 192,146 | Tommy Estes | Libertarian | 76,317 | 0 | 43.15 | No | Confirmed named-source record |
| [22](https://www.txelectionresults.com/2022-general-election/races/3475) | Brian Birdwell | 190,988 | Jeremy Schroppel | Libertarian | 66,204 | 0 | 48.52 | No | Confirmed named-source record |
| [3](https://www.txelectionresults.com/2022-general-election/races/3461) | Robert Nichols | 213,288 | Steve Russell | Democratic | 58,285 | 3,941 | 56.26 | Yes | Confirmed named-source record |
| [1](https://www.txelectionresults.com/2022-general-election/races/19792) | Bryan Hughes | Not reported | Unopposed | None | N/A | N/A | N/A | No | Confirmed named-source record |
| [11](https://www.txelectionresults.com/2022-general-election/races/19793) | Mayes Middleton | Not reported | Unopposed | None | N/A | N/A | N/A | No | Confirmed named-source record |
| [28](https://www.txelectionresults.com/2022-general-election/races/19795) | Charles Perry | Not reported | Unopposed | None | N/A | N/A | N/A | No | Confirmed named-source record |
| [31](https://www.txelectionresults.com/2022-general-election/races/20047) | Kevin Sparks | Not reported | Unopposed | None | N/A | N/A | N/A | No | Confirmed named-source record |

District 3's other votes were 3,941 for Libertarian Desarae Lindsey; its denominator is 275,514, including all three candidates. Districts 5 and 22 had Libertarian opponents but no Democrat. The four unopposed race pages display zero-vote placeholders and “Results not yet reported”; the module stores null vote totals and null margins, not fabricated 100-point margins.

| Derived context | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Democratic contests in this cohort | 5 | Confirmed named-source arithmetic | Districts 2, 3, 4, 18 and 24. | 2026-11-06 |
| Seats with any opponent / unopposed | 7 / 4 | Confirmed named-source arithmetic | Add the Libertarian-only contests in 5 and 22; unopposed 1, 11, 28 and 31. | 2026-11-06 |
| Fourth-smallest Republican–Democratic margin | District 4; 39.8894523432 points, displayed 39.89 | Confirmed named-source arithmetic | Sort only the five Democratic contests; exclude Libertarian-only races and null margins. | 2026-11-06 |

The five comparable Democratic contests had smaller Republican margins in 2026 than in 2022. Different candidates, turnout and opposition coverage prevent treating these two elections as a forecast model.

#### Rejected alternate data

An OpenData precinct aggregation was checked but excluded: it omitted districts and mixed party labels. For example, it returned only 144,010 Hall votes versus the named final-result compilation's 172,713, and mislabeled some Tommy Estes votes as Democratic. Those partial totals cannot supply district margins.

```sql
SELECT district, candidate, party, SUM(votes) AS votes
FROM "openelections/tx-precinct-results:all"
WHERE election_year = 2022
  AND office ILIKE '%senat%' AND office NOT ILIKE '%U.S.%'
  AND district IN (1,2,3,4,5,11,18,22,24,28,31)
GROUP BY district, candidate, party
ORDER BY district, votes DESC;
```

Source checked: [OpenData precinct results](https://tryopendata.ai/datasets/openelections/tx-precinct-results). This query is documented as rejected evidence; no returned value is used in the margin constants.

### What could have happened

These are cumulative counterfactual outcomes, not probabilities. School powers follow the legal sources in Slides 4, 8 and 10.

| Rung | Outcome and school lever | On the 2026 ballot? | Status |
|---|---|---|---|
| 1 | Existing party control retained | Yes, as an available outcome | Confirmed possibility |
| 2 | Governor: vetoes and commissioner nominations | Yes | Confirmed possibility |
| 3 | Plus House: House passage of school bills | Yes, all House seats | Confirmed possibility; House passage alone does not enact a bill |
| 4 | Plus Lt. Governor: Senate agenda under chamber rules | Yes | Confirmed electoral possibility; rules-based powers Pending |
| 5 | Plus Attorney General, Comptroller and SBOE: litigation ([art. IV §22][cn4]), voucher administration ([TEC §29.352][ed29]), curriculum ([TEC §7.102][ed7]) | Yes; the contested SBOE seats could change its majority | Confirmed possibility; actual SBOE result Pending |
| 6 | Plus Senate majority: majority votes in both chambers | Yes; 9 contested Senate wins needed under the retention assumption | Confirmed possibility; Senate floor rules can require more than a simple majority |

### Conflicts

The [November 5 Senate article][senate-news] says fifteen seats were contested. The SOS returns and candidate directory enumerate sixteen. Use sixteen. The outline explicitly allows correction of its suggested “out of reach” label: the ballot did permit a Democratic majority. A majority also would not automatically eliminate Senate procedural thresholds; “bills pass without Republican votes” needs that qualification.

## Slide 4: Rulebook

Module: `data/04-rulebook.ts`.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Legislature | Writes school law and appropriates funding | Confirmed | [Constitution art. III §1][cn3] vests legislative power in House and Senate. | 2026-11-06 |
| Governor / Senate | Governor nominates commissioner; Senate confirms | Confirmed | [TEC §7.051][ed7]; [art. IV §12][cn4]. These are distinct powers. | 2026-11-06 |
| TEA / commissioner | Administers education law and statutory interventions | Confirmed | [TEC §§7.021, 7.055][ed7]; [§39A.111][ed39a]. | 2026-11-06 |
| AISD elected trustees | Govern and oversee district schools, subject to statutory intervention | Confirmed | [TEC §11.151(b)][ed11]. | 2026-11-06 |
| Incumbent commissioner | Mike Morath; appointed, not elected | Confirmed; successor Pending | [Tribune November 4][election-aisd] identifies Morath; appointment mechanism in [TEC §7.051][ed7]. | 2026-11-06 |
| Commissioner term | 4 years, commensurate with governor's term | Confirmed | [TEC §7.052][ed7]. Term expiration does not itself resolve holdover or removal. | 2026-11-06 |
| Board of managers | State-appointed board exercising district governance in place of elected trustees | Confirmed | [TEC §39A.202][ed39a]. Trustee powers are suspended; elections can still occur under §39A.208. | 2026-11-06 |

## Slide 5: Two campuses

Module: `data/05-two-campuses.ts`; snapshot: `data/05-waffle-campuses.json`. Port basis: `examples/aisd-showcase/data/07-waffle.ts`, `campuses.ts`, `07-waffle-campuses.json` and `examples/aisd-showcase/data-sources.md`. The query was rerun; the port is not treated as independent evidence.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Triggering campuses | Burnet Middle School, 227901046; Webb Middle School, 227901053 | Confirmed | TEA campus query below; [AISD September 14][aisd-appeal] and [KUT September 18][kut-appeal]. | 2026-11-06 |
| Burnet's five counted ratings | 2019 F 54; 2023 F 55; 2024 F 57; 2025 F 54; 2026 F 59 | Confirmed preliminary record; final count Pending | Actual TEA result rows below. No D occurs in this counted sequence. | 2026-11-06 |
| Webb's five counted ratings | 2019 F 52; 2023 F 59; 2024 F 54; 2025 F 59; 2026 F 58 | Confirmed preliminary record; final count Pending | Actual TEA result rows below. No D occurs in this counted sequence. | 2026-11-06 |
| Intervening years | 2020 and 2021 Not Rated; 2022 Not Rated under SB 1365 | Confirmed | TEA rows and [TEC §39A.117][ed39a]. “Consecutive” is the legal count, not five uninterrupted calendar years. | 2026-11-06 |
| Appeals | Both filed; outcomes unresolved | Pending | [KUT][kut-appeal] confirms filing before the September 11 deadline; [TEA timeline][appeals] schedules final ratings for December 11. | 2026-11-06 |
| Waffle denominator | 114 A–F records minus 12 closed rated campuses = 102 open rated campuses | Confirmed, defined universe | TEA aggregate below; [Austin Current September 21][transfers] names closures/transfers. Eight Not Rated records are excluded. This is not a total of every AISD campus/program. | 2026-11-06 |
| District rating rows | A 28, B 33, C 22, D 11, F 20, Not Rated 8; total 122 | Confirmed preliminary data | Aggregate query below. A–F = 114; D/F = 31. | 2026-11-06 |
| Waffle tiers | chronic 2 / atFour 9 / dfOther 20 / other 71 | Confirmed arithmetic; atFour/other legal classification FLAG | Port algorithm below. The two fifth-F campuses are subject to appeal. The nine includes six inherited histories. | 2026-11-06 |
| Open D/F campuses | 25; of those, 20 were D/F in each of 2024, 2025 and 2026 | Confirmed preliminary data | Exclude six closed F records from 31; check each remaining history for the three listed end-years. | 2026-11-06 |
| Closed rated records | Barrington 149, Dawson 114, Martin 051, Oak Springs 125, Paredes 061, Widen 175; Becker 104, Bedichek 054, International HS 029, Ridgetop 133, Sunset Valley 158, Winn 157 | Confirmed named reporting | Campus IDs have prefix 227901. [Austin Current][transfers] lists the six transferred and ten retired campus numbers, of which six retired records were A–F rated. [AISD][consolidate] confirms consolidation; [July 30 notice][paredes] confirms Paredes closure. | 2026-11-06 |
| Reported inherited histories | Bailey 059 ← Paredes 061; Guerrero Thompson 186 ← Barrington 149; Galindo 176 ← Dawson 114; Kealing 044 ← Martin 051; Blackshear 105 ← Oak Springs 125; Rodriguez 174 ← Widen 175 | Confirmed as named reporting; legal application FLAG | [Austin Current][transfers] reports TEA's assignments. Primary assignment letters and receiving-campus exceptions have not been verified. | 2026-11-06 |
| Own-record atFour campuses | Dobie 055 (D 62), Linder 160 (F 59), Pecan Springs 129 (F 56) | Confirmed ratings; derived legal counts FLAG | TEA snapshot; the port pauses D and Not Rated years. Final TEA year-count publication is needed to confirm the derived count. | 2026-11-06 |
| Snapshot names, scores, enrollment and economically disadvantaged share | 114 campus records, each with 2018–2026 rating history | Confirmed query match after correction | Full verification query below. JSON stores the exact displayed record values; `ecoDis` is a fraction. Only Garcia YMLA 064 score changed: 86 → 85. | 2026-11-06 |
| Elected school board affected | Austin ISD district board | Confirmed conditional consequence | [TEC §39A.111][ed39a] authorizes district managers from a campus trigger; appointment itself remains Pending. | 2026-11-06 |

### Reproducible queries and rows

Source: [TEA multi-year workbook][ratings-workbook], queried through [OpenData accountability-summary][ratings-data].

```sql
SELECT school_year, campus_number, campus, overall_rating, overall_score
FROM "tea/accountability-summary:all"
WHERE campus_number IN ('227901046', '227901053')
ORDER BY campus_number, school_year;
```

| School year | Burnet rating | Score | Webb rating | Score |
|---|---|---|---|---|
| 2017-2018 | Met Standard | 63 | Met Standard | 62 |
| 2018-2019 | F | 54 | F | 52 |
| 2019-2020 | Not Rated: Declared State of Disaster | null | Not Rated: Declared State of Disaster | null |
| 2020-2021 | Not Rated: Declared State of Disaster | null | Not Rated: Declared State of Disaster | null |
| 2021-2022 | Not Rated: Senate Bill 1365 | 59 | Not Rated: Senate Bill 1365 | 58 |
| 2022-2023 | F | 55 | F | 59 |
| 2023-2024 | F | 57 | F | 54 |
| 2024-2025 | F | 54 | F | 59 |
| 2025-2026 | F | 59 | F | 58 |

```sql
SELECT overall_rating, COUNT(*) AS campuses
FROM "tea/accountability-summary:all"
WHERE district_number = '227901' AND campus_number IS NOT NULL
  AND school_year = '2025-2026'
GROUP BY overall_rating ORDER BY overall_rating;
```

Actual rows: `A,28; B,33; C,22; D,11; F,20; Not Rated,8`.

```sql
SELECT campus_number, campus, school_year, overall_rating, overall_score,
       number_of_students, economically_disadvantaged
FROM "tea/accountability-summary:all"
WHERE district_number = '227901' AND campus_number IS NOT NULL
ORDER BY campus_number, school_year
LIMIT 60 OFFSET 0;
```

Rerun with offsets 0, 60, 120, …, 1080: eighteen pages of 60 and one of 43, totaling 1,123 rows. For each snapshot ID, compare the 2025-2026 row's name, rating, numeric score, enrollment and share, then each historical rating by end-year. The 114 displayed latest rows and their history arrays are preserved in the JSON. The only mismatch in the original port was `227901064, GARCIA YMLA, 2025-2026, B, 85, 243, 0.975`; the JSON now uses 85.

Port method: F or Improvement Required increments; A/B/C or Met Standard resets; D and Not Rated pause. Apply the reported transfer history separately from the receiving campus's own rating. Remove the twelve closed rated records, then classify fifth-F first, four-count second, remaining D/F third, and others last. Result: 2 + 9 + 20 + 71 = 102. This simplification is **not a general legal rule for every D**: §39A.118 pauses specified first/second D ratings. The atFour count requires the final official year counts and transfer letters.

### Conflicts

AISD's generic start/end-times page still lists Paredes and International. Use the dated Paredes closure notice and the September reporting on retired numbers, not that stale directory. The consolidation page's ten-school vote is a narrower event than all twelve closed A–F records removed from this waffle. The named transfer report was available through search's full indexed article; direct fetch returned HTTP 403. Reported assignments are attributable, but the underlying TEA letters remain FLAG.

## Slide 6: Trigger tree

Module: `data/06-trigger-tree.ts`.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Trigger | 5 consecutive legally unacceptable school years | Confirmed | [TEC §39A.111][ed39a]; timing/count exceptions in §§39A.117–.118. | 2026-11-06 |
| Required alternatives | District board of managers OR campus closure | Confirmed law; AISD choice Pending | [§39A.111][ed39a] uses “shall order,” subject to §39A.112. | 2026-11-06 |
| Appeal gate | If the ratings survive appeal | Pending | Slide 5 evidence. A final intervention outcome has not been established. | 2026-11-06 |
| Petition threshold | Parents representing more than 50% of enrolled students; one signature counted per student | Confirmed | [§39A.112(a)-(b)][ed39a]; [19 TAC §97.1065(d)(2)(C)][tac]. Not a majority of parents who happen to sign. | 2026-11-06 |
| Enrollment snapshot | October 30, 2026 | Confirmed as reporting | [Austin Politics October 31][petition-news] reports the snapshot used for validation. The rule delegates the particular date to TEA procedures. | 2026-11-06 |
| Petition effect | A valid timely petition generally requires its authorized action | Confirmed law; validity Pending | [§39A.112(b)][ed39a]. [Austin Politics][petition-news] reports validation and complaint review still in progress. | 2026-11-06 |
| Trustee alternative | Written alternative action plus explanation; commissioner may accept | Confirmed law; request Pending | [§39A.112(c)][ed39a]; [TAC §97.1065(d)(3)][tac] requires public-meeting approval by a majority of board members. | 2026-11-06 |
| Monitor/conservator | Alone does not satisfy the two-remedy requirement | Confirmed | [§39A.111][ed39a]; [TAC §97.1065(c)][tac] expressly allows supplementary sanctions in combination. | 2026-11-06 |
| Who decides | Superintendent validates petition; elected trustees may request alternative; commissioner orders remedy | Confirmed | [TAC §97.1065(d)][tac]. Petition complaint outcome remains Pending. | 2026-11-06 |

### Conflicts

The outline's blanket suggestion that a monitor or conservator is forbidden after five years is too broad. The rule allows supplementary oversight; it cannot substitute for the required closure/managers choice. Burnet and Webb's counted ratings are all F, so the deck need not claim a D caused either trigger.

## Slide 7: Collision timeline

Module: `data/07-collision-timeline.ts`. ISO strings preserve dates without inventing times.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Election | 2026-11-03 | Confirmed, election date | [SOS][sos]. Certification remains Pending. | 2026-11-06 |
| Parent collection deadline | 2026-10-15 | Confirmed, legal rule | [TAC §97.1065(d)(1)(A)][tac]: finalized petition to superintendent for validation. Already elapsed; not a future invitation to sign. | 2026-11-06 |
| Validated petition deadline | 2026-12-01 | Confirmed, legal rule; submission Pending | [TAC §97.1065(d)(1)(C)][tac]: superintendent submits a valid petition to commissioner. | 2026-11-06 |
| Approximate appeal response | About 2026-12-10 | Confirmed as reporting; response Pending | [Austin Politics][petition-news] reports the expectation. Module status `reported`; not a statutory deadline. | 2026-11-06 |
| Final ratings and revised year-count publication | 2026-12-11 | Confirmed, administrative schedule; publication Pending | [TEA appeal timeline, p. 2][appeals]: decisions to appealing districts **before** December 11; final public ratings/year counts on December 11. | 2026-11-06 |
| Trustee alternative request deadline | 2026-12-15 | Confirmed, legal rule; request Pending | [TAC §97.1065(d)(3)][tac]. Optional request following a valid parent petition, not a scheduled meeting date. | 2026-11-06 |
| Inauguration | 2027-01-19 | Confirmed constitutional schedule; event Pending | [Art. IV §4][cn4]: first Tuesday after legislative organization, or as soon thereafter as practicable; [LRL][session-calendar] gives January 12 session start. | 2026-11-06 |
| Closure plan, if requested | 2027-01-30 | Confirmed, conditional legal deadline; plan Pending | [TAC §97.1065(d)(4)][tac]. | 2026-11-06 |
| Petition-process sanction order | By 2027-02-15 | Confirmed, conditional legal deadline; order Pending | [TAC §97.1065(d)(5)][tac]: follows valid petition and any board request; implementation in current or, if necessary, subsequent school year. | 2026-11-06 |
| Commissioner identity at order time | Not yet known | Pending | Holdover/appointment analysis in Slide 8. | 2026-11-06 |

### Conflicts

December 10 is the district's reported estimate; December 11 is TEA's final publication date. They are different events. December 1, December 15 and February 15 are established in the current administrative rule, so they should not be styled merely as reported dates. February 15 applies to the valid-petition process and either statutory remedy, not only closure and not every possible intervention order.

## Slide 8: Senate arc

Module: `data/08-senate-arc.ts`, importing the expected Senate split.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Senate arc | 31 total; 19 Republican, 12 Democratic; majority 16 | Confirmed expected composition; certification Pending | Slide 2 sources. | 2026-11-06 |
| Appointment threshold | Two-thirds of senators present | Confirmed | [Art. IV §12(b)-(c)][cn4]. | 2026-11-06 |
| Threshold with full attendance | ceil(31 × 2 / 3) = 21 | Confirmed conditional arithmetic | All 31 present. It is not an invariant threshold independent of attendance. | 2026-11-06 |
| Additional votes with all Democrats supporting | 21 − 12 = 9 | Confirmed conditional arithmetic | Requires all 12 Democrats still serving, present and supporting the nominee; vacancies or opposition change the calculation. | 2026-11-06 |
| Holdover | Incumbent continues duties until successor qualifies | Confirmed general rule; Morath departure Pending | [Art. XVI §17(a)][cn16]. “Qualifies” is broader than merely nominated or confirmed. Resignation alone does not end holdover service; [AG Letter Opinion 97-092][holdover-opinion] explains that an accepted resignation can leave the officer serving until a successor qualifies. Lawful removal or another applicable vacancy rule requires separate analysis. | 2026-11-06 |
| Removal route | Appointing governor plus two-thirds of Senate present | Confirmed statutory text; incoming-governor application FLAG | [Art. XV §9][cn15] specifies the governor who appoints the officer; [TEC §7.053][ed7] incorporates that removal mechanism. No legal determination was found establishing that Hinojosa can invoke Abbott's appointing-governor route. | 2026-11-06 |
| Current/incoming governors | Greg Abbott / Gina Hinojosa | Confirmed election context; inauguration Pending | [Tribune][election-aisd] and [KPRC][harrison]. | 2026-11-06 |
| Senate rules changes | Possible changes to Lt. Governor's committee/agenda powers | Pending | [Tribune November 5][senate-news] reports discussion; [art. III §11][cn3] lets each chamber determine its rules. No adopted 2027 change verified. | 2026-11-06 |
| Constitutional Senate presidency | Lt. Governor remains president of Senate | Confirmed | [Art. IV §16][cn4]. Chamber rules cannot erase this constitutional office. | 2026-11-06 |
| Harrison proposal | Rep. Brian Harrison, Republican; November 4 call for special session limiting emergency powers | Confirmed proposal; session/enactment Pending | [KPRC November 5][harrison] reports his call. [Art. IV §8][cn4] gives the sitting governor the power to convene. | 2026-11-06 |

### Conflicts

Replace “Morath stays until a successor is confirmed” with the constitutional qualification rule and a pending tenure outcome. Replace unconditional “needs 21 votes” with its attendance assumption. Reporting about Senate rules or a special session establishes proposals, not enacted limits or a scheduled session.

## Slide 9: Undo

Module: `data/09-undo.ts`. These are the rules for the relevant board appointment, not a forecast of AISD's eventual duration.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Replace individual managers | Commissioner may do so at any time | Confirmed | [TEC §39A.207][ed39a]. | 2026-11-06 |
| Early board removal | Triggering campus must receive acceptable ratings for 2 consecutive school years; commissioner may remove | Confirmed law; AISD outcome Pending | [§39A.209(a)][ed39a], for managers appointed under Subchapter C. | 2026-11-06 |
| Appointment expiration notice | By second anniversary | Confirmed | [§39A.208(b)][ed39a]. This is notice of the expiration date, not automatic expiration then. | 2026-11-06 |
| Extension | Up to 2 additional years after insufficient progress determination and local feedback | Confirmed | [§39A.208(c)][ed39a]. | 2026-11-06 |
| Phased return | Replace one-third of managers following each of the last 3 years | Confirmed | [§39A.208(b)][ed39a], with elected trustees in the closest achievable one-third grouping. | 2026-11-06 |
| Two further unacceptable years | Commissioner may replace the board after community consultation | Confirmed | [§39A.209(b)][ed39a]. This route does not restore elected governance by itself. | 2026-11-06 |
| Oversight after removal | Monitor or conservator permitted | Confirmed | [§39A.209(c)][ed39a]. | 2026-11-06 |

### Conflicts

The outline's “at least two school years” is an imprecise elapsed-time claim. The statute specifies two consecutive acceptable school-year ratings and discretionary removal; it does not promise a fixed return date measured from appointment.

## Slide 10: Tools

Module: `data/10-tools.ts`.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Commissioner nomination | Governor can nominate; Senate consent required | Confirmed | [TEC §7.051][ed7]; [art. IV §12][cn4]. | 2026-11-06 |
| Recess appointment | Conditional vacancy route with later confirmation requirements | Confirmed | [Art. IV §12(c)-(f)][cn4]. Not a blanket “appointments without confirmation” power. | 2026-11-06 |
| Veto | Bills and appropriation items; override possible | Confirmed | [Art. IV §14][cn4]. | 2026-11-06 |
| Budget proposal | Governor is chief budget officer and submits budget recommendations | Confirmed | [Government Code §§401.041, .0445, .046][gv401]. Legislature makes appropriations. | 2026-11-06 |
| Special session and agenda | Governor may call session and designate subjects | Confirmed | [Art. IV §8][cn4]; [art. III §40][cn3]. Legislators must still enact bills. | 2026-11-06 |
| Policy priorities | Governor recommends measures and executes law | Confirmed | [Art. IV §§9–10][cn4]; [TEC §7.055][ed7] preserves commissioner's legal duties. | 2026-11-06 |
| Change takeover requirement | Needs legislation | Confirmed | [TEC §39A.111][ed39a]. | 2026-11-06 |
| Change statutory testing requirements | Needs legislation | Confirmed | [TEC §§39.022–.023][ed39]. Current text already provides a redesigned testing framework; do not describe old STAAR law as unchanged. | 2026-11-06 |
| Change funding formulas | Needs legislation | Confirmed | [TEC ch. 48][ed48]. | 2026-11-06 |
| Repeal voucher program | Needs legislation | Confirmed | [TEC §29.352][ed29] directs comptroller to establish/administer it; [SB 2 summary][sb2]. Administrative discretion is not repeal. | 2026-11-06 |
| Bill passage | Both chambers must agree on identical text, then governor action or constitutional alternative | Confirmed | [Art. III §30][cn3], [art. IV §14][cn4], [House process guide][house-guide]. Signature, no-signature enactment and veto override are distinct routes. | 2026-11-06 |

### Conflicts

The “She can do alone” appointment card is incorrect if it means installing a permanent commissioner without Senate consent. The module separates nomination from confirmation. A new governor's preference cannot independently repeal enacted intervention, testing, funding or voucher statutes.

## Slide 11: HB 2 and Austin's gap

Module: `data/11-hb2.ts`. All raw monetary constants are dollars.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| HB 2 new funding | About $8.5 billion, enacted in 2025 for the 2026–27 state fiscal biennium | Confirmed | [Senate May 23 report][hb2-senate] describes new public-school funding; [bill summary][hb2-summary] and [Tribune explanation][hb2-explainer] give scope. This is not an annual AISD allocation. | 2026-11-06 |
| Senate vote | 31 yeas, 0 nays, May 23, 2025 | Confirmed | [Enrolled HB 2 certification][hb2-enrolled], Senate passage with amendments. “Unanimous” is supported. | 2026-11-06 |
| AISD projected gap before reductions | $181,000,000 for 2026–27 | Confirmed historical projection | [AISD June 23 budget update][aisd-budget-update] describes the original shortfall. Not the current remaining deficit. | 2026-11-06 |
| Adopted operating budget / identified reductions | $887,000,000 / $205,000,000 | Confirmed reported totals | Same [AISD update][aisd-budget-update]. Do not subtract these headline aggregates to invent an ending surplus. | 2026-11-06 |
| Recapture estimate | $715,523,373, rounded $715.5 million, adopted FY 2026 / 2025–26 school year | Confirmed budget estimate; actual payment Pending | [AISD budget process][aisd-process], Recapture row, FY 2026 adopted column. | 2026-11-06 |
| Meaning of recapture | Local property-tax revenue above state-formula entitlement returned to the statewide funding system | Confirmed | [AISD budget explanation][aisd-budget] and [TEC ch. 48][ed48]. | 2026-11-06 |
| Current finance forecast | Refresh required | Pending | Historical adopted estimates do not establish the November forecast or 2026–27 recapture actuals. | 2026-11-06 |

### Conflicts

Keep $8.5B and unanimity. Replace “$715M a year” with the year-specific $715.5M adopted estimate. Keep $181M only with “before reductions.” Those qualifications already appear in parts of the source outline but are lost in the later slide draft.

## Removed: Houston (was slide 12)

The author cut this slide on 2026-11-06. The rows below stay as the record of what was checked; nothing on a slide uses them now.

Module: `data/12-houston.ts`.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Intervention begins | June 1, 2023 | Confirmed | [TEA extension announcement][hisd-extension] identifies installation date. | 2026-11-06 |
| Intervention extended through | June 1, 2027 | Confirmed extension; elected-board return Pending | Same [TEA announcement][hisd-extension]. Extension end is not a guaranteed complete handback date. | 2026-11-06 |
| Enrollment series | Eight school years, 2018–19 through 2025–26 | Confirmed | TEA enrollment query and exact rows below. | 2026-11-06 |
| Loss since pre-takeover baseline | 189,934 − 168,812 = 21,122; about 21,000 | Confirmed arithmetic | Baseline 2022–23, endpoint 2025–26. [Tribune September 21][hisd-report] reports the rounded decline. | 2026-11-06 |
| Earlier “over 13,000” loss | TEA query: 189,934 − 176,727 = 13,207; UH text: 13,208 | Confirmed rounded comparison; exact source difference unresolved | [University of Houston January 15][uh] covers the first two years, through 2024–25. Its exact figure differs from the query by one student; the cause is unverified. Both support “over 13,000.” Neither replaces the later three-year chart comparison. | 2026-11-06 |
| Rating trend | A/B counts 93 → 170 → 198 → 205 from 2022–23 to 2025–26 | Confirmed snapshot; final 2026 ratings Pending | TEA campus aggregate below. D/F counts for those years: 120, 41, 17, 14. | 2026-11-06 |
| Causation | Not established by these series | Confirmed limitation | Enrollment already fell before 2023; annual campus populations and accountability methodology change. These data are descriptive. | 2026-11-06 |

### Enrollment query and result

Source: [TEA enrollment reports][enrollment-origin] via [OpenData student-enrollment][enrollment-data]. The dataset stores mutually exclusive ethnicity categories; each HISD year had seven category rows, no total row and no masked small category. Sum those categories once.

```sql
SELECT year, SUM(enrollment) AS enrollment
FROM "tea/student-enrollment:all"
WHERE district = 101912
GROUP BY year ORDER BY year;
```

| School year | Enrollment |
|---|---|
| 2018-2019 | 209772 |
| 2019-2020 | 210061 |
| 2020-2021 | 196943 |
| 2021-2022 | 194607 |
| 2022-2023 | 189934 |
| 2023-2024 | 184109 |
| 2024-2025 | 176727 |
| 2025-2026 | 168812 |

### Campus ratings query and result

Source: [TEA multi-year workbook][ratings-workbook] via [OpenData][ratings-data].

```sql
SELECT school_year, overall_rating, COUNT(*) AS campuses
FROM "tea/accountability-summary:all"
WHERE district_number = '101912' AND campus_number IS NOT NULL
GROUP BY school_year, overall_rating
ORDER BY school_year, overall_rating;
```

The chart uses the years matching the enrollment series. The query also returns 2017–18: Improvement Required 6, Met Alternative Standard 5, Met Standard 246, Met Standard - Appeal 1, Not Rated 6, Not Rated: Harvey Provision 17; these are outside the chart.

| School year | A | B | C | D | F | Not Rated | Total | A/B | D/F |
|---|---|---|---|---|---|---|---|---|---|
| 2018-2019 | 58 | 77 | 86 | 29 | 21 | 8 | 279 | 135 | 50 |
| 2019-2020 | null | null | null | null | null | 280 | 280 | null | null |
| 2020-2021 | null | null | null | null | null | 274 | 274 | null | null |
| 2021-2022 | 96 | 117 | 43 | null | null | 17 | 273 | 213 | null |
| 2022-2023 | 36 | 57 | 52 | 65 | 55 | 7 | 272 | 93 | 120 |
| 2023-2024 | 59 | 111 | 54 | 30 | 11 | 9 | 274 | 170 | 41 |
| 2024-2025 | 74 | 124 | 50 | 17 | 0 | 8 | 273 | 198 | 17 |
| 2025-2026 | 92 | 113 | 46 | 9 | 5 | 7 | 272 | 205 | 14 |

Not Rated categories are consolidated only for this table: 2020 disaster 280; 2021 disaster 270 plus ordinary 4; 2022 SB 1365 nine plus ordinary 8. No A–F rating was assigned in 2020/2021; low 2022 results were suppressed under SB 1365, so D/F is null, not zero. 2025 F is genuinely zero in a year with A–F reporting. The 2023 accountability refresh limits comparison to earlier years. Use the 2022–23 rating year as the pre-intervention baseline despite delayed publication.

### Conflicts

The outline's “21,000” is a supported rounded value, not a rejected figure. Its baseline and endpoint must be shown. The UH figure has an earlier endpoint. Neither report nor the query justifies attributing every lost student to the takeover.

## Slide 12: Futures

Rebuilt 2026-11-06 around three paths after the author questioned the earlier "intervention proceeds" middle column. Module: `data/13-futures.ts`.

| Figure / claim | Value | Status | Source | Fetched |
|---|---|---|---|---|
| Petition remedy | Parents ask the commissioner to close Burnet and Webb, proposed by Mayor Kirk Watson in September as the alternative to a district takeover | Confirmed as reporting | [Austin Politics][petition-news] | 2026-11-06 |
| Initial petition counts | "initial counts at both schools exceeded the required majority of currently enrolled students" | Confirmed as reporting; validation Pending | [Austin Politics][petition-news], quoting Superintendent Segura's Oct 19 letter | 2026-11-06 |
| Signature complaint | TEA reviewing the Webb PTA complaint (Oct 26); no findings announced | Pending | [Austin Politics][petition-news] | 2026-11-06 |
| Petition effect | A valid timely petition generally requires its requested action; trustees may request an alternative | Confirmed law | [TEC §39A.112][ed39a], [TAC §97.1065(d)][tac] | 2026-11-06 |
| Replacing managers | The commissioner may replace board-of-managers members | Confirmed law | [TEC §39A.207][ed39a] | 2026-11-06 |
| Hinojosa on takeovers | Pledged to end state takeovers; "on day one, I will fire Mike Morath" (Nov 3) | Confirmed as reporting | [Texas Tribune, Nov 4][election-aisd] | 2026-11-06 |
| New commissioner's options | UH's Duncan Klussmann: a new commissioner might close the failing schools rather than take over the district; UT's Rachel White: the commissioner "would still be bound by state law" | Confirmed as reporting | [Texas Tribune, Nov 4][election-aisd] | 2026-11-06 |
| Houston under state control | Board of managers installed June 1, 2023; extended through June 1, 2027 | Confirmed | [TEA extension announcement][hisd-extension] | 2026-11-06 |
| "Most likely" column | Petitions hold: two campuses close, elected board keeps the district | FLAG: author judgment | Follows from the petition record above; no probability estimated. Fails if validation, the TEA complaint or a trustee request changes the remedy. | 2026-11-06 |
| Takeover columns | A takeover run by a Hinojosa-appointed commissioner would aim to help the district; one run as in Houston would be imposed from the top | FLAG: author judgment | Hinojosa pledge and §39A.207 above; Houston record. A scenario, not an observed outcome. | 2026-11-06 |

## Slide 13: Watch and close

Module: `data/14-watch.ts`, reusing Slide 7 dates.

| Figure or claim | Value | Status | Source and evidence | Fetched |
|---|---|---|---|---|
| Watch list size and selection | 5 decisions/topics | FLAG: author-reported editorial selection | `source-outline.md` Slide 24, grouped as below. Five topics are not five scheduled votes. | 2026-11-06 |
| Final ratings / petition determinations | Commissioner decides appeals; superintendent validates petitions; parents supply petition | Pending | [TEC §39A.112][ed39a], [TAC §97.1065(d)][tac], [TEA appeal schedule][appeals]. | 2026-11-06 |
| Intervention timing / remedy | Commissioner orders; trustees may request alternative | Pending | Same law; February 15 conditional deadline from Slide 7. Watch whether an order precedes or follows inauguration. | 2026-11-06 |
| Commissioner transition | Governor nominates; Senate confirms | Pending | [TEC §7.051][ed7], [Constitution art. IV][cn4], [art. XV][cn15] and [art. XVI][cn16]; Slide 8 qualifications. | 2026-11-06 |
| Senate rules / education committees | Senators adopt rules; Lt. Governor exercises retained assignment powers | Pending | [Art. III §11][cn3]; [Senate reporting][senate-news]. | 2026-11-06 |
| Education legislation / funding | House, Senate and governor | Pending | [Art. III][cn3] and [art. IV][cn4]; proposals on funding, accountability and vouchers do not become law on filing. | 2026-11-06 |
| Session start | January 12, 2027 | Confirmed legal schedule | [LRL 90th session calendar][session-calendar]; [art. III §5][cn3]. | 2026-11-06 |
| Ordinary bill filing deadline | March 12, 2027, day 60 | Confirmed published calendar; applicable exceptions remain | [Official Horseshoe Bay legislative calendar][filing-calendar]; [art. III §5][cn3]. Emergency/local and adopted-rule exceptions prevent a universal “no bills after” claim. | 2026-11-06 |
| Sine die | May 31, 2027, day 140 | Confirmed legal schedule | [LRL][session-calendar]; [art. III §24][cn3]. | 2026-11-06 |
| Post-session governor action | June 20, 2027 | Confirmed conditional legal calculation | May 31 + 20 calendar days under [art. IV §14][cn4] for bills covered by its post-adjournment provision. | 2026-11-06 |
| Board meeting time | 6 p.m. America/Chicago | Confirmed published schedule | Individual AISD calendar events below; agenda and rescheduling remain subject to refresh. | 2026-11-06 |
| QR destination | https://decks.steamfield.io | Confirmed | Author chose the Decks homepage for the closing QR. | 2026-11-06 |

### AISD board calendar through February 2027

| Date | Meeting | Status | Source |
|---|---|---|---|
| 2026-11-05 | Information session, 6 p.m. | Confirmed published date | [AISD event](https://www.austinisd.org/calendar/events/2026/11/05/board-information-session) |
| 2026-11-12 | Regular voting meeting, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2026/11/12/board-regular-voting-meeting) |
| 2026-12-10 | Information session, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2026/12/10/board-information-session) |
| 2026-12-17 | Regular voting meeting, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2026/12/17/board-regular-voting-meeting) |
| 2027-01-14 | Information session, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2027/01/14/board-information-session) |
| 2027-01-28 | Regular voting meeting, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2027/01/28/board-regular-voting-meeting) |
| 2027-02-11 | Information session, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2027/02/11/board-information-session) |
| 2027-02-25 | Regular voting meeting, 6 p.m. | Confirmed schedule | [AISD event](https://www.austinisd.org/calendar/events/2027/02/25/board-regular-voting-meeting) |

### Conflicts

The scheduled December 17 voting meeting is after the December 15 trustee-request deadline. Do not invent a December 15 board meeting; any necessary action needs a legally noticed earlier meeting. The June horizon is an editorial watch period, not a promise that all five decisions will be resolved by then.

## Numbers refresh (2026-11-06)

| Item | Old | New | Provenance |
|---|---|---|---|
| Senate ballot size | Article: 15; outline left N unresolved | 16; 11 Republican defenses, 5 Democratic defenses | [SOS][sos], [TCTA][senate-ballot], Slide 3 crosswalk |
| Senate feasibility | Suggested “out of reach” | Possible: retain 5 and flip 4; 9 contested wins | Slide 3 arithmetic |
| Outcome rung | Rung 5 as completed result | Rung 4 confirmed; rung 5 provisional | [SBOE reporting][sboe-news] |
| House exact split | Unspecified Democratic majority | Projected 83–67, Pending | [House reporting][house] |
| SBOE status | “District 8 recount” | Possible recount; no filed recount verified | [SBOE reporting][sboe-news] |
| Appeal tick | About December 10 | Keep as reported estimate; December 11 final publication; appeal decisions before then | [Austin Politics][petition-news], [TEA][appeals] |
| Deadline certainty | Petition/board/order dates described as reported | December 1/December 15/February 15 confirmed rule dates; February 15 conditional on petition process | [TAC][tac] |
| Confirmation math | Unqualified 21 votes / 9-seat gap | Same numbers only with 31 present and 12 Democratic yes votes | [Art. IV §12][cn4] |
| Holdover | Until successor confirmed | Until successor qualifies, subject to lawful departure/vacancy routes | [Art. XVI §17][cn16] |
| Manager removal duration | “At least two school years” | Two consecutive acceptable ratings; discretionary removal, no fixed return date | [TEC §39A.209][ed39a] |
| Appointment power | “Appointments without confirmation” | Nomination alone; confirmation required; conditional recess rules | [Art. IV §12][cn4], [TEC §7.051][ed7] |
| Recapture | About $715M “a year” | $715,523,373 adopted FY 2026 estimate; about $715.5M for 2025–26 | [AISD process][aisd-process] |
| Budget gap | $181M without time qualification in slide draft | $181M before 2026–27 reductions | [AISD June 23][aisd-budget-update] |
| Houston loss | 21,000 without explicit baseline | 21,122 from 2022–23 to 2025–26; about 21,000 remains valid | TEA query, Slide 12 |
| Garcia YMLA hover score | 86 in ported JSON | 85 | TEA query: 227901064, 2025–26 |
| Monitor/conservator | Blanket prohibition after trigger | Insufficient alone; supplementary oversight permitted | [TAC §97.1065(c)][tac] |

## Banned on-slide content (checked)

| Item | Why / correct value | Status |
|---|---|---|
| “Only fifteen Senate seats were on the ballot” | SOS enumerates 16 | Checked wrong; banned |
| “A Democratic Senate majority was mathematically impossible” | 9 contested wins could produce 16 total | Checked wrong; banned |
| “All election results are certified” | Canvasses pending on November 6 | Checked wrong as of cutoff; banned |
| “SBOE District 8 recount is underway” | No filed proceeding established | Unsupported; banned until sourced |
| “Burnet and Webb each had five consecutive calendar years of F” | Five counted Fs with Not Rated years between | Checked wrong; banned |
| “114 campuses are currently open in the waffle” | Display universe 102 after exclusions | Checked wrong for this defined waffle |
| “Garcia YMLA scored 86 in 2026” | Query returns 85 | Checked wrong; banned |
| “Every D always pauses the legal count” | §39A.118 has specific first/second-D conditions | Checked overbroad; banned |
| “A monitor/conservator is forbidden” | Supplementary oversight permitted | Checked wrong; banned |
| “Parents can collect petitions until December 1” | Collection deadline October 15; December 1 is validated submission to TEA | Checked wrong; banned |
| “TEA promises an appeal decision on December 11” | Decisions before; final publication on December 11 | Checked wrong; banned |
| “February 15 requires any AISD order in all circumstances” | Rule is conditional on the petition process | Checked overbroad; banned |
| “Every commissioner confirmation always takes 21 votes” | Two-thirds present, not fixed total membership | Checked wrong; banned |
| “Hinojosa can appoint a permanent commissioner without confirmation” | TEC and Constitution require Senate consent | Checked wrong; banned |
| “Hinojosa can remove Morath unilaterally on inauguration day” | No such route established; removal/holdover restrictions apply | Unsupported; banned |
| “Two years automatically ends a board of managers” | Ratings condition/discretion and separate expiration process | Checked wrong; banned |
| “Resignation alone ends Morath's holdover service” | Art. XVI §17 and AG Letter Opinion 97-092 preserve holdover after an accepted resignation | Checked overbroad; banned |
| “Five decisions are due by June” | June is the author's watch horizon; several topics have no such deadline | Unsupported; banned |
| “An intervention is the most likely outcome” as a factual headline | No probability model or attributed forecast; author scenario only | Unsupported; banned as a settled claim |
| “Only a Senate majority would have done better” as a settled election result | The education-board majority is still pending; ladder ordering is author judgment | Unsupported; banned as a settled claim |
| “AISD currently has an unaddressed $181M deficit” | Original pre-reduction projection | Checked wrong use of historical figure |
| “AISD pays exactly $715M in recapture every year” | Year-specific adopted estimate $715.5M | Checked wrong; banned |
| “Houston lost 21,000 in a single year” or “the takeover caused all losses” | Three-school-year comparison; causal effect not identified | Checked wrong / unsupported; banned |
| “No Houston D/F campuses in 2022 proves improvement” | Low ratings suppressed as Not Rated | Checked wrong; banned |

The $8.5B HB 2 total, 31–0 Senate vote and rounded 21,000 Houston loss passed their checks and are not banned.

## Refresh within 24 hours of the talk

- [ ] Replace unofficial returns with the applicable canvass status; resolve House totals and HD 93 eligibility.
- [ ] Check SBOE District 8 outstanding ballots, certification, recount filing and outcome.
- [ ] Check the Senate roster for vacancies and successors; update confirmation attendance assumptions.
- [ ] Check Senate rules proposals, adopted votes and education committee leadership.
- [ ] Check whether Abbott called a special session and whether any limits were enacted.
- [ ] Check Burnet/Webb appeal letters, final ratings and official consecutive-year counts.
- [ ] Check petition validation, complaint disposition, enrollment snapshot guidance and any trustee request.
- [ ] Obtain TEA transfer letters before presenting inherited counts as legal determinations.
- [ ] Check any TEA order, remedy, implementation timetable or rule change.
- [ ] Check Hinojosa's commissioner nominee, Morath's tenure and any removal/holdover ruling.
- [ ] Refresh AISD enrollment, budget forecasts and recapture estimates with their fiscal years.
- [ ] Refresh HISD enrollment and final 2026 ratings; preserve baseline and comparability notes.
- [ ] Check AISD meeting notices, especially action needed before December 15; recheck all future calendar dates.
- [ ] Check 2027 session rules, filing exceptions, education bills, funding and committee assignments.
- [ ] Check changes to board-of-managers removal or termination law.
- [ ] Confirm byline, Scenario labels and published sources URL.

## Open FLAG register

| Flag | What would resolve it |
|---|---|
| Byline / talk month | Author confirmation of public byline and date |
| Ladder ordering and “best” | Author accepts platform-relative editorial framing; keep it identified as judgment |
| Own-record and inherited atFour legal counts | Final TEA consecutive-year counts, assignment letters, receiving-campus exception analysis |
| Incoming-governor removal route | Authoritative legal analysis or ruling applying art. XV §9 and TEC §7.053 to this transition |
| “Most likely” scenarios | Author owns the conditional scenario framing; no numerical likelihood is established |
| Five-topic watch selection | Author accepts the editorial grouping; it is not a legal enumeration |

Ordinary pending election, petition, appointment, rulemaking and legislative outcomes remain Pending rather than being relabeled FLAG.

## Source-outline URL audit

All twenty-eight distinct URLs in `source-outline.md` were opened or fetched on 2026-11-06. The rows above use specific primary pages where an outline link was only a portal. Failed browser fetches were retried with direct HTTP or the source's indexed text; none was silently counted as verification.

| Outline source | Result / use |
|---|---|
| [Tribune election/AISD][election-aisd] | Read; election context and Morath |
| [Texas SOS returns][sos] | Read browser result; direct HTTP 403; unofficial winners and districts |
| [Tribune Senate][senate-news] | Read; majority/rules discussion; fifteen-seat error corrected |
| [TEC chapter 7][ed7] | Read; appointment/term/removal |
| [TEC chapter 39A][ed39a] | Read; intervention/petition/manager law |
| [AISD September 14][aisd-appeal] | Read; campus intervention/appeal context |
| [AISD budget][aisd-budget] | Read; recapture explanation |
| [AISD process][aisd-process] | Read; year-specific recapture row |
| [AISD June 23][aisd-budget-update] | Read; pre-cut gap and adopted budget |
| [Austin Politics][petition-news] | Read; validation/complaint and reported dates, supplemented with TAC |
| [Constitution art. IV][cn4] | Read; governor, confirmation, veto and inauguration |
| [Tribune education agenda][education-agenda] | Read via direct HTTP after browser failure; promises do not establish enacted changes |
| [Constitution art. XV][cn15] | Read; appointing-governor removal wording |
| [Constitution art. XVI][cn16] | Read; holdover |
| [House about/process][house-guide] | Read browser result; direct HTTP 403; bicameral process |
| [Legislature portal][capitol] | Read; source gateway, not evidence of a 2027 enactment |
| [Constitution art. III][cn3] | Read; membership, rules, session and legislation |
| [Comptroller revenue estimate][bre] | Read; budget context; no unsupported future revenue total imported |
| [SB 2 summary][sb2] | Read; voucher statute, supplemented by TEC §29.352 |
| [Tribune SBOE][sboe-news] | Read; District 8 unresolved |
| [KPRC][harrison] | Read; Harrison proposal |
| [Senate HB 2 news][hb2-senate] | Read browser result; direct HTTP 403; $8.5B |
| [HB 2 summary][hb2-summary] | Read; supplemented by enrolled vote certification |
| [Tribune HB 2 explanation][hb2-explainer] | Read; funding scope |
| [University of Houston][uh] | Read; earlier two-year enrollment comparison |
| [Tribune HISD][hisd-report] | Read; later rounded 21,000; replaced chart inputs with TEA query |
| [AISD homepage][aisd-home] | Read; followed calendar and consolidation pages |
| [TEA homepage][tea-home] | Read; followed appeal timeline and current rules |

## Source links

[sos]: https://electionresults.sos.state.tx.us/results.html
[house]: https://www.texastribune.org/2026/11/03/texas-house-legislature-outcomes-control-republicans-democrats-2026/
[election-aisd]: https://www.texastribune.org/2026/11/04/texas-gina-hinojosa-austin-isd-tea-takeover/
[senate-news]: https://www.texastribune.org/2026/11/05/texas-senate-republican-majority-lieutenant-governor-powers/
[sboe-news]: https://www.texastribune.org/2026/11/04/texas-state-board-education-elections-2026/
[canvass]: https://www.sos.texas.gov/elections/laws/advisory2026-28.shtml
[senate-ballot]: https://www.tcta.org/texasteachersvote/find-candidates/texas-senate-candidates
[senate-roster]: https://senate.texas.gov/members.php
[cn3]: https://tcss.legis.texas.gov/resources/CN/htm/CN.3.htm
[cn4]: https://tcss.legis.texas.gov/resources/CN/htm/CN.4.htm
[cn15]: https://tcss.legis.texas.gov/resources/CN/htm/CN.15.htm
[cn16]: https://tcss.legis.texas.gov/resources/CN/htm/CN.16.htm
[ed7]: https://tcss.legis.texas.gov/resources/ED/htm/ED.7.htm
[ed11]: https://tcss.legis.texas.gov/resources/ED/htm/ED.11.htm
[ed29]: https://tcss.legis.texas.gov/resources/ED/htm/ED.29.htm
[ed39]: https://tcss.legis.texas.gov/resources/ED/htm/ED.39.htm
[ed39a]: https://tcss.legis.texas.gov/resources/ED/htm/ED.39A.htm
[ed48]: https://tcss.legis.texas.gov/resources/ED/htm/ED.48.htm
[gv401]: https://tcss.legis.texas.gov/resources/GV/htm/GV.401.htm
[aisd-appeal]: https://www.austinisd.org/announcements/2026/09/14/message-from-superintendent-segura
[kut-appeal]: https://www.kut.org/education/2026-09-18/austin-isd-appeals-two-failing-school-ratings-in-bid-to-avoid-takeover
[petition-news]: https://www.austinpolitics.org/on-my-block/webb-burnet-petition-review-aisd-outside-operators-dobie-linder-pecan-springs
[appeals]: https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-appeals-timeline_0.pdf
[tac]: https://tea.texas.gov/laws-and-rules/commissioner-rules-tac/coe-tac-currently-effect/ch097ee.pdf
[ratings-workbook]: https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-statewide-multi-year-ratings-spreadsheet.xlsx
[ratings-data]: https://tryopendata.ai/datasets/tea/accountability-summary
[transfers]: https://austincurrent.org/2026/09/21/austin-austinisd-takeover-school-ratings-paredes-bailey/
[consolidate]: https://www.austinisd.org/consolidate
[paredes]: https://www.austinisd.org/announcements/2026/07/30/trustees-approve-amended-turnaround-plan-closure-paredes-en-espanol
[harrison]: https://gmg-kprc-prod.cdn.arcpublishing.com/news/local/2026/11/05/hinojosa-responds-to-republican-calls-to-limit-governors-powers-before-she-takes-office/
[house-guide]: https://www.house.texas.gov/about
[sb2]: https://capitol.texas.gov/billlookup/BillSummary.aspx?Bill=SB2&LegSess=89R
[hb2-summary]: https://capitol.texas.gov/billlookup/BillSummary.aspx?Bill=HB2&LegSess=89R
[hb2-enrolled]: https://capitol.texas.gov/tlodocs/89R/billtext/html/HB00002F.htm
[hb2-senate]: https://www.senate.texas.gov/news.php?id=20250523a
[hb2-explainer]: https://www.texastribune.org/2025/06/04/texas-public-education-schools-funding-bill-explained/
[aisd-budget]: https://www.austinisd.org/budget
[aisd-process]: https://www.austinisd.org/budget/process
[aisd-budget-update]: https://www.austinisd.org/announcements/2026/06/23/superintendents-update-approved-2026-27-budget-en-espanol
[hisd-extension]: https://tea.texas.gov/about-tea/newsroom/tea-announces-extension-houston-isd-intervention-and-new-appointments-houston-isd-board-managers
[enrollment-data]: https://tryopendata.ai/datasets/tea/student-enrollment
[enrollment-origin]: https://rptsvr1.tea.texas.gov/cgi/sas/broker?_service=marykay&_program=adhoc.addispatch.sas&major=st&minor=e&loop=1&linespg=60&charsln=120&endyear=26&selsumm=sd&format=C&key=&_debug=0&countykey=&oldnew=new&grouping=e%20
[uh]: https://www.uh.edu/news-events/stories/2026/january/01152026-houston-isd-takeover-by-the-numbers.php
[hisd-report]: https://www.texastribune.org/2026/09/21/houston-isd-state-takeover-sustainability/
[session-calendar]: https://www.lrl.texas.gov/sessions/sessionYears.cfm
[filing-calendar]: https://www.horseshoe-bay-tx.gov/978/Texas-Legislature-101
[education-agenda]: https://www.texastribune.org/2026/11/05/texas-dems-vowed-seismic-education-change-heres-how-schools-could-change-for-millions-of-students/
[capitol]: https://capitol.texas.gov/
[bre]: https://comptroller.texas.gov/transparency/reports/biennial-revenue-estimate/
[aisd-home]: https://www.austinisd.org/
[tea-home]: https://tea.texas.gov/
[holdover-opinion]: https://www2.texasattorneygeneral.gov/opinions/opinions/48morales/lo/1997/htm/lo1997092.htm
[refresh-methodology]: https://tea.texas.gov/taa-letters/2023-accountability-manual

## Finished-deck fact-check report (2026-11-06)

Deck: `decks/texas-2026`, alias `tx26`. This report covers all fourteen pages, their presenter notes, all thirteen Stage components, the cover and every data module. The report is kept in this permitted provenance file; the hand-off also prints a per-slide table.

Status: supported findings corrected; author flags and pending decisions remain. No numerical chart value required correction. The named-source records support the historical comparison; the official historical-results portal remains unreachable. The report has 41 grouped result rows: 23 VERIFIED, 10 MISMATCH-FIXED, 7 FLAGGED and 1 UNVERIFIABLE. These are claim families, not counts of individual campus values. Remaining counts: 0 unresolved mismatches, 0 unsourced arrays/slides, 0 unsourced humans, 0 unchecked external citations and 0 stale records. Four of the flagged families are author choices: byline, ladder ordering, scenarios and watch selection.

### Session evidence and method

`bun run fact-extract tx26` completed. Every scalar export and every Stage headline, COPY entry, display label and presenter note was read separately. Geometry, bill/section identifiers and slide numbering are not statistical figures. The source links were fetched anew; the previous “Confirmed” labels were not evidence for this audit.

Seventy-six distinct URLs already recorded in this file were attempted. Seventy-five returned content, including the TEA workbook; `https://results.texas-election.com/races` returned `HTTP Error 403: Forbidden`. The Senate news page failed in the browser tool and succeeded by direct HTTP. The TEA appeal PDF was read through the browser's PDF text and page screenshot after local text extraction yielded no usable text. The additional AG holdover opinion and TEA methodology notice were opened in this session.

The SQL blocks above were rerun. Trailing semicolons initially caused `HTTP 400: SQL validation failed`; removing the trailing delimiters succeeded without changing query semantics. Three campus-page requests hit `Too many concurrent queries (limit: 4)` and succeeded on sequential retry. These recovered failures do not make the returned data unverifiable.

Actual returned TEA rows, SQL, column names and origin URLs are preserved in `data/fact-check-evidence.json`. Its `austinSnapshot` contains all 1,123 rows, retrieved with offsets 0 through 1,080. Comparison against `05-waffle-campuses.json` found exact matches for all 114 current campus names, ratings, scores, enrollment counts and economically disadvantaged proportions, plus all 1,006 historical rating entries. No tolerance or estimate was needed. The four smaller query results are retained separately in the same evidence file.

The existing Slide 3 returns tables and Slides 5/12 query tables above were compared against this session's source rows. Their values remain the evidence tables for those claims. Imported data modules were also evaluated to check all derived counts and margins. The rejected precinct query was rerun: `2 | Bob Hall | REP | 144010` and `5 | Tommy Estes | DEM | 983` reproduce the reasons for excluding it.

### Per-slide results

Each row covers the listed claim family; multiple dates, amounts or names are grouped only when they share an opened source. VERIFIED means the stated qualification is supported, including an explicitly preliminary result or published future schedule. It does not mean the pending event happened.

| Slide | Claim / location | Source opened or query run | Status | Evidence quote, returned row or computation |
|---|---|---|---|---|
| 1 | Cover election context; `01-cover.ts`, page | [SOS][sos], [House][house], [Senate][senate-news] | VERIFIED | SOS statewide rows reproduced below; House wins/concessions establish a reported majority; Senate report gives expected 19 R / 12 D. Winners are not yet inaugurated. |
| 1 | Byline and presentation month; page | `OUTLINE.md`, Cover specification; `01-cover.ts` | FLAGGED | Author-supplied record: `Riley Hilliard; Austin; 2026-11`. Page now reads the record, including its formatted month. Public identity/date still require author confirmation. |
| 2 | Statewide winners and vote counts; `02-power-board.ts`, PowerBoardStage | [SOS][sos] | VERIFIED | `Governor: Hinojosa 5230789, Abbott 4524527; Lt. Governor: Goodwin 5083581, Patrick 4484652; AG: Johnson 5133629, Middleton 4502442; Comptroller: Eckhardt 5014496, Huffines 4511185`. Updated `11/04/2026 04:59 PM`. |
| 2 | House majority versus projected roster; module/card/notes | [House][house], [art. III §2][cn3] | MISMATCH-FIXED | Reported arithmetic: `62 + 11 called flips + 3 concessions = 76`; seven further leads yield `83 D / 67 R`. Constitution: `150 members`. Changed present-tense “has” to election-result “won”; HD 93 and final totals stay pending. |
| 2 | Senate and SBOE projections; module/cards/notes | [Senate][senate-news], [SBOE][sboe-news], [SOS][sos] | VERIFIED | Senate expected `19 R / 12 D`; SBOE seven each outside District 8. SOS: `Walker 300108; Young 299544`; `300108 - 299544 = 564`. Young had not conceded; a possible recount is not a verified filing. |
| 2 | Canvass schedule and chamber thresholds | [SOS advisory][canvass], [arts. III][cn3] and [IV][cn4] | VERIFIED | Advisory gives `November 21, 2026` through `December 7, 2026`; art. IV §3 separately governs executive returns. `floor(150/2)+1=76`; `floor(31/2)+1=16`. |
| 3 | Ballot districts, names and previous party; `senateBallot` | [SOS][sos], [TCTA][senate-ballot], [Senate roster][senate-roster], 2023 Senate Journal linked above | MISMATCH-FIXED | SOS lists `1,2,3,4,5,9,11,13,18,19,21,22,24,26,28,31`. Roster lists `Constituent Services* / District 22` and says the asterisk marks a vacancy. Birdwell is now identified as former; party classification means the party last holding the seat. Other crosswalk names match. |
| 3 | Feasibility and outcome arithmetic; `senateMath`, `reachedRung` | Ballot/roster sources above; module evaluation | VERIFIED | `16 contested = 11 R defenses + 5 D defenses`; `12 - 5 = 7 D holdovers`; `7 + 5 + 4 = 16`; `5 + 4 = 9` contested wins; maximum `7 + 16 = 23`. Rung `4` reached; rung `5` conditional on SBOE. |
| 3 | Eleven current race names, vote totals, margins | [SOS][sos]; Slide 3 source rows above | VERIFIED | Every candidate/vote pair matches. Sorted district/margin rows: `2/2.7162; 11/2.9902; 5/6.6072; 18/8.5909; 22/11.9570; 24/13.2795; 4/16.5972; 3/38.9867; 28/39.4265; 1/43.2119; 31/46.2926`. Margin is `100*(R-D)/(R+D)`. All eleven Republican wins, zero Democratic flips. |
| 3 | Historical candidates, parties, counts and comparison | Eleven individual TXElectionResults race pages linked above; Senate Journal | VERIFIED | All seven reported vote pairs and SD 3's `3941` other votes match. Pages identify Democratic versus Libertarian candidates in their party-marked result bars. Four single-candidate pages contain zero placeholders, correctly stored as null. Fourth Democratic contest: `100*(202341-86946)/289287 = 39.889452343174774`; current fourth: `100*(196125-165093)/361218 = 8.590934006610967`. Rounded displays `39.9` and `8.6` match. |
| 3 | Direct official 2022 archive retrieval | [Official results portal](https://results.texas-election.com/races) | UNVERIFIABLE | `HTTP Error 403: Forbidden`. Named compilation is verified above; do not call it a direct successful retrieval of the primary archive. |
| 3 | Ladder ranking, first card and headline | `OUTLINE.md`, outcome arrays, SBOE reporting | MISMATCH-FIXED | “One more office” was false for a multi-office rung; step numbers were typed twice; “Only a Senate majority” treated the pending SBOE rung as achieved. Corrected these strings and removed duplicated comparison figures from notes; the displayed comparison reads the constants. Ordering remains author judgment. |
| 3 | Platform-relative ladder ordering | `OUTLINE.md`, Slide3; `ladderJudgment` | FLAGGED | The author ranks combinations of offices against Hinojosa's public-school platform. No source makes this a neutral ordering of voter preferences or an estimated likelihood. |
| 4 | Legislature, TEA, commissioner, trustees and appointed board | [ED 7][ed7], [ED 11][ed11], [ED 39A][ed39a], [art. III][cn3], [Morath reporting][election-aisd] | VERIFIED | §7.051: governor appoints with Senate advice/consent; §7.052: `four years commensurate with the term of the governor`; §11.151(b): trustees govern/oversee management; §39A.202: trustee powers suspended during managers' appointment. Article identifies Mike Morath and Abbott's appointment. |
| 5 | All snapshot records, hover facts and rating histories | TEA paginated query, evidence JSON; [workbook][ratings-workbook] | VERIFIED | `1123 source rows; 114 snapshot records; 1006 historical grades; 0 mismatches`. Example row: `227901064, GARCIA YMLA, 2025-2026, B, 85, 243, 0.975`. |
| 5 | Burnet/Webb sequences and appeals | TEA query; [AISD][aisd-appeal], [KUT][kut-appeal], [appeal schedule][appeals] | VERIFIED | Counted years `2019,2023,2024,2025,2026`: Burnet `F/54, F/55, F/57, F/54, F/59`; Webb `F/52, F/59, F/54, F/59, F/58`. Both appealed. Intervening disaster/SB 1365 rows are Not Rated. Final ratings/counts remain pending. |
| 5 | Waffle denominator and closures | TEA query; [Austin Current][transfers], [AISD closure][paredes], [consolidation][consolidate] | VERIFIED | Query `A28/B33/C22/D11/F20/Not Rated8 = 122`; A-F `114`; remove the twelve named closed rated records listed above: `102`. Open own-grade D/F `25`; those D/F throughout 2024–26 `20`. Named report confirms six transfer pairs and ten retired numbers, six of them A-F records. |
| 5 | Tier arithmetic versus legal classification | Module evaluation; [transfer report][transfers]; [§39A.118][ed39a] | FLAGGED | Computed `chronic2/atFour9/dfOther20/other71 = 102`. Arithmetic matches; six inherited histories and own-record legal counts require TEA letters/final counts. The algorithm's blanket D pause is not a general legal determination. |
| 6 | Trigger, remedies, petitions, supplementary oversight | [§§39A.111–.112, .117–.118][ed39a]; [TAC §97.1065][tac] | VERIFIED | Trigger `five consecutive school years`; alternatives `(1) board of managers; (2) closure`. TAC: `more than 50%` and `only one parent signature per enrolled student`; trustees need public-meeting majority approval; commissioner may accept alternative; supplementary oversight allowed. Pending validation/appeals remain explicit. |
| 6 | Petition snapshot and complaint status | [Austin Politics][petition-news] | VERIFIED | Reported record: `Oct. 30 enrollment`; complaint allegations under TEA review, no announced findings. Snapshot date is reported practice, not a date specified in the statute. |
| 7 | Election, petition and intervention dates | [SOS][sos], [TAC §97.1065(d)][tac] | VERIFIED | `2026-11-03` election; `(1)(A) October15; (1)(C) December1; (3)(B) December15; (4) January30; (5) February15`. Order deadline follows a valid petition and any board request; implementation may be current or subsequent school year. |
| 7 | Appeal estimate versus final publication | [Austin Politics][petition-news], [TEA PDF p.2][appeals] | VERIFIED | Report: `Around Dec. 10`; TEA rows: `Prior to 12/11/2026` decisions, `12/11/2026` final ratings and consecutive-year counts. Both are qualified correctly. |
| 7 | Inauguration and commissioner identity at talk | [Art. IV §4][cn4], [LRL][session-calendar], [Morath reporting][election-aisd] | MISMATCH-FIXED | LRL starts session `Jan12,2027`; first following Tuesday is `Jan19,2027`, with constitutional practicability qualification. Replaced “at the time of this talk” with the research cutoff and required refresh; future commissioner identity is not established. |
| 8 | Confirmation threshold, split and additional votes | [Art. IV §12][cn4]; Senate source above | MISMATCH-FIXED | “two-thirds of the Senate present”; `ceil(31*2/3)=21`; `21-12=9`. Headline now carries the attendance assumption. Vacancies and Democratic support can change the calculation. |
| 8 | Holdover wording and resignation | [Art. XVI §17][cn16], [AG LO 97-092][holdover-opinion] | MISMATCH-FIXED | Constitutional endpoint: successor “duly qualified.” AG: “the law operates to continue him or her in office until his successor qualifies.” Removed resignation as an automatic earlier endpoint. |
| 8 | Incoming-governor removal route | [Art. XV §9][cn15], [TEC §7.053][ed7] | FLAGGED | Text specifies “the governor who appoints an officer” and two-thirds present. No ruling applying this route to the incoming governor was established. |
| 8 | Proposed rules / Harrison special-session request | [Senate report][senate-news], [KPRC][harrison], [arts. III][cn3] and [IV][cn4] | VERIFIED | Harrison's embedded request is dated `November4,2026`; article dated November5 identifies him as a Republican representative. Rule changes are discussed, not verified as adopted. Senators set rules; governor convenes; Lt. Governor's Senate presidency is constitutional. |
| 9 | Manager replacement, early removal, expiration and further failure | [TEC §§39A.207–.209][ed39a] | VERIFIED | §207: replace individual manager “at any time.” §209(a): two consecutive acceptable ratings, discretionary removal. §208: notice by second anniversary, up to two additional years, one-third trustee replacement after each of last three years. §209(b)/(c): two further unacceptable years permit replacement after consultation; oversight may follow. |
| 10 | Executive tools and legislation | [Art. IV][cn4], [art. III][cn3], [GV 401][gv401], [ED 7][ed7], [29][ed29], [39][ed39], [39A][ed39a], [48][ed48] | VERIFIED | §401.041 calls governor chief budget officer; §401.046 requires budget delivery. Art. IV covers nomination/conditional recess appointments, veto/override and special sessions. ED §29.352 assigns voucher administration to comptroller; other cited chapters establish testing, intervention and funding law. These statutes need legislative change. |
| 10 | Bill origination in presenter notes | [Art. III §33][cn3] | MISMATCH-FIXED | “All bills for raising revenue shall originate in the House of Representatives.” Added the exception to the overbroad either-chamber claim. |
| 11 | HB 2 funding, period and bipartisan vote | [Senate report][hb2-senate], [enrolled act][hb2-enrolled], [summary][hb2-summary] | VERIFIED | Senate describes `$8.5 billion in new school funding` for the upcoming biennium. Act certification: `May23,2025; Yeas31; Nays0`. Act §7.22 explicitly covers school years `2025-2026 and 2026-2027`; these fall in the displayed state fiscal biennium. |
| 11 | AISD historical gap, operating budget, reductions, recapture | [AISD update][aisd-budget-update], [budget process][aisd-process] | VERIFIED | Update rows: `2026-27 operating887M; gap181M; reductions205M`. Recapture table: `2026 Adopted / $715523373`; `715523373/1e6 = 715.523373`, displayed `$715.5M`. Historical estimate and pre-reduction qualifications retained. |
| 12 | All enrollment/rating rows, gains, losses and intervention dates | TEA query results in evidence JSON; [TEA extension][hisd-extension] | VERIFIED | Enrollment `209772,210061,196943,194607,189934,184109,176727,168812`; chart years 2018–19 through 2025–26. A/B baseline/latest `93/205`, gain `112`; enrollment loss `189934-168812=21122`, rounded `21000`, over three school years. Installation `June1,2023`; extension `June1,2027`. All eight rating rows match the table above. |
| 12 | Missing grades, cohort changes and causal language | TEA query rows/caveat; [TEA methodology notice][refresh-methodology]; [UH report][uh] | MISMATCH-FIXED | 2020 disaster `280`; 2021 disaster `270` + ordinary NR `4`; 2022 A/B/C `96/117/43`, SB1365 NR `9` + ordinary NR `8`. Nulls correctly mean unavailable grades. TEA says “year-over-year comparisons are more difficult this year” during the 2023 refresh. Removed the unsourced generalization about “many urban districts”; retained the observed pre-takeover decline and no-causation qualification. |
| 12 | UH exact two-year loss versus TEA subtraction | [UH][uh]; TEA enrollment query | FLAGGED | UH text says `13208`; this session's TEA rows give `189934-176727=13207`. Cause of one-student difference unresolved. Both support the earlier rounded “over 13000”; the chart uses TEA's later endpoint. |
| 13 | Scenario rows and likelihood headline | `source-outline.md` Slide23; `OUTLINE.md` Futures; `13-futures.ts` | MISMATCH-FIXED | Author supplies Best / Most likely / Worst, four dimensions and hypothetical outcomes; no forecast probability. Headline now says scenarios depend on unresolved decisions. |
| 13 | “Most likely” label, selected outcomes and family responses | Same author records | FLAGGED | Scenario badges and notes identify judgment. Author still owns the relative-likelihood label; it is not statistically verified. |
| 14 | Session dates and governor deadline | [LRL][session-calendar], [city calendar][filing-calendar], [arts. III][cn3] and [IV][cn4] | VERIFIED | Published `Jan12,2027; Mar12,2027; May31,2027`; inclusive day counts `60/140`; `May31 + 20 days = June20`. Filing exceptions and conditional post-adjournment action remain explicit. |
| 14 | Board meeting dates and time | All eight AISD event links in Slide14 above | VERIFIED | Event date rows, each `6:00 pm`: `2026-11-05,11-12,12-10,12-17; 2027-01-14,01-28,02-11,02-25`. December17 follows December15 request deadline; a prior noticed vote is needed for that request. Dates are schedules, not evidence of completed meetings. |
| 14 | Five-topic deadline headline and election/QR closing | Watch data; [TAC][tac]; [Decks homepage](https://decks.steamfield.io) | MISMATCH-FIXED | Five comes from `decisionsToWatch.length`. No source makes all topics due by June. Headline now says unresolved; closing says officials will hold power; obsolete QR-placeholder/source-ledger note now identifies the live Decks homepage. |
| 14 | Watch-list selection and QR destination choice | Author-supplied outline/data | FLAGGED | Five selected topics are an editorial grouping. The homepage loads; author intent to use it, rather than a published deck-specific ledger, remains author-reported. |

### Fixes, limits and readiness

- Corrected the District 22 incumbent description, House present-tense card, ladder's one-office/settled-outcome claims, unconditional confirmation headline, resignation/holdover wording, scenario likelihood headline, universal June deadline and future-talk commissioner claim.
- Bound the cover byline/month and ladder step numbers to data; removed copied election-margin figures from presenter notes in favor of the existing data-driven comparison. The closing count now uses `watchCount`.
- Shortened the ladder's nine-word statewide-office lead to the required eight-word budget while preserving the offices shown in the diagram.
- Corrected the close's timing and obsolete QR note; added the revenue-bill exception; removed an unsourced multi-district enrollment generalization. Recorded the one-student UH/TEA provenance difference without changing the chart.
- The existing source tables cover all data arrays and scalar figures. There are no remaining unsourced named people or anecdotes on the presented slides. The author byline, ladder preference, legal transfer counts, incoming-governor removal application, scenarios and watch selection remain explicitly flagged.
- The official 2022 archive is the only unresolved retrieval failure; the comparison has an opened named compilation and independently opened certified-winner journal. No external citation was silently counted as checked. No current claim has a recorded retrieval older than 90 days; historical reports and fixed statutory dates are not stale merely because their publication date is older.
- No load-bearing numerical mismatch remains. Present with the qualifications and Scenario/Pending labels intact. This audit does not settle future elections, appeals, petitions, appointments, funding or intervention outcomes.

The author must complete the existing **Refresh within 24 hours of the talk** checklist above. In particular, refresh certification/HD93/SBOE recounts; Senate vacancies and vote attendance; appeals/final year counts; petition validation/complaints and trustee action; TEA assignment letters/orders; commissioner appointment and holdover; rules/special sessions; fiscal-year-specific budget/enrollment figures; HISD ratings; all future meeting/session dates; and author choices/byline/QR destination. The June endpoint is an editorial watch horizon.

### Checks and review focus

| Check | Result |
|---|---|
| `bun run fact-extract tx26` | Passed before and after the corrections; scalars checked separately. |
| `bun run typecheck` | Passed, no reported TypeScript errors. |
| `bun run test` | Passed: 30 files, 336 tests; 1 existing skipped test. |
| `bun run lint` | Exit 0, no errors. Existing `parallel-reveal` warning in `examples/opendata-pitch/components/SkepticsStage.vue:31`; left outside this contract's scope. |
| `bun run check` | Passed: page manifests match, no error-level rhetoric hits. |
| `bun run build tx26` | Passed; cover data binding and revised Stage templates compile. |
| Source/data comparisons | Exact match for current/historical Senate vote values, all 114 campus records and 1,006 history entries, all Houston series; derived tiers, margins and calendar arithmetic match. |
| `git diff --check` | Passed. |

Orchestrator review should focus on the retained “Most likely” author label, the District 22 former-incumbent qualification, the distinction between verified named-source historical results and the blocked primary archive, and the legal flags around inherited campus counts and commissioner removal. The UH one-student discrepancy is confined to contextual provenance. No layouts, styles, tokens or manifest were changed. Changes are uncommitted.
