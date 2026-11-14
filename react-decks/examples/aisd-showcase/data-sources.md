# AISD showcase excerpt provenance

This excerpt preserves WaffleStage, ScatterStage, and InkCampusMapStage from Riley Hilliard’s October 2026 `aisd-takeover` talk. The reference project is unchanged. Components, their hover card, chart theme, and every imported data snapshot are local to this example; addon imports use the published `slidev-addon-decks` exports.

| Excerpt slide | Original page | Original evidence section |
| --- | --- | --- |
| 1 | `07-waffle-campuses.md` | Campus ratings and consecutive F histories |
| 2 | `09-scatter-campuses.md` | STAAR campus pass-rate comparison |
| 3 | `09b-campus-map.md` | Campus geography, poverty, and accountability grades |

The complete source-talk query record follows verbatim, retaining the original numbering and its caveats. Values in this excerpt come from the copied, provenance-commented `data/` modules and snapshots.

# AISD Takeover deck: data provenance

Every number, chart, and status claim on a slide maps to a real artifact. This is the
fact-check input.

Deck: `talks/aisd-takeover/` · Refreshed 2026-09-16 to move the deck from projecting a
fifth F to reporting the fifth F TEA confirmed on August 13, 2026 (Burnet 59, Webb 58)
and Dobie's D. Primary source for pre-existing figures is the blog article
`blog/src/content/blog/aisd-takeover-houston-playbook.mdx`, itself already updated with
the August data before this refresh; its own dataset list and query citations (see its
closing `<Disclosure>`) back every figure this deck reused from it. New figures (the
Sept 2026 appeal deadline, the parent-petition mechanism, the Oct 15/Dec 1 dates) come
from primary reporting fetched 2026-09-16, cited per slide below.

**Refresh 2026-10-03.** Brings the deck in line with the October update of the
article and `plans/2026-10-03-aisd-takeover-update-packet.md`: the nine campuses
at four now named for the campuses carrying the count, the closed-campus rule,
the appeal and the December 11 final date, the petition's changed AISD stance,
the corrected deficit row, a new Fort Worth slide, and Fort Worth on the voucher
slide. Every changed figure is listed under "Refresh 2026-10-03" below with its
source or SQL. Section headings here keep the page-file numbering they already
used (2b, 9b, 18b); page headers and stage docblocks carry manifest positions,
which shifted by one from the enrollment divider on when the Fort Worth slide
was inserted after the turnover slide.

**Scope of this refresh.** Slides 1, 3, 5, 6, 7, 8, 9, 10, and 30 (cover, countdown
stats, accountability-score chart, legal-mechanism, waffle, AISD timeline, scatter,
section divider, closing) and `slides.md`'s `info:` line were rewritten. Houston/Fort
Worth history slides (13-14, 16-21, 23-28) were checked against fresh search results
(see "Research checked, not incorporated" below) and left unchanged because no figure
they use has moved. Per this refresh's scope instructions, only the changed slides'
inline chart/stat/timeline data was extracted into `data/*.ts` modules; the untouched
history slides still carry their figures inline in `<script setup>` blocks, as they did
before this refresh.

**Presentation pass 2026-10-11.** The ratings explainer now uses two pages:
`04c-rating-history.md` carries the history timeline and its two original cards;
`04b-af-system.md` carries the domains, weights and score bands. Both retain the
figures and sources under "Slide 4b" below; no figures or claims changed. Other
changes enlarge evidence charts, testimony and the finance table.

## Slide 4c: Rating history (`data/04b-af-system.ts`)

- The original history ticks and cards from Slide 4b, moved intact to their own
  page. See "Slide 4b: How A-F ratings work" for the dates and provenance.

## Presentation pass 2026-10-14

- The teacher-headcount chart now draws certified and uncertified counts as
  separate lines on the same zero-based scale. End labels and differences are
  computed from `CERT_HEADCOUNT`: certified 10,233 → 7,727 (−2,506), uncertified
  301 → 2,088 (+1,787), 2022–23 to 2025–26. Values are unchanged; see the
  certified-headcount section below for the original query.
- Grade-shift focus bands now stay mounted and change opacity by click;
  percentages and bars are unchanged.
- Page-file IDs remain stable. The manifest now places Houston's NES timeline
  before Austin's timeline and its Houston-based scenario. The scenario is a
  conditional comparison, not an estimate of the causal effect of takeover.
- The cover dates Houston's state control to June 2023, replacing the ambiguous
  "four years into" wording. See TEA's intervention history linked below.
- Slide 3 has a fourth click, using the user-supplied `/Users/riley/Downloads/reddit.png`,
  converted with `cwebp -q 85 -m 6` to `public/reddit-district-spending.webp`.
  The 1170 × 2532 screenshot is the artifact for the displayed post and embedded
  chart; authorship remains FLAG: founder-reported. The chart labels its source
  TEA PEIMS Summarized Finance and measures operating revenue per student, not
  spending per student. The card uses the actual metric. No independent refresh
  of the screenshot's chart figures was performed in this pass.

## Slide 4d: The takeover law (`data/04d-takeover-law.ts`)

Research checked 2026-10-14:

- HB 1842 primary author Jimmie Don Aycock and joint author Harold Dutton:
  [official authors](https://capitol.texas.gov/billlookup/Authors.aspx?Bill=HB1842&LegSess=84R).
  Aycock's Republican affiliation: [Legislative Reference Library](https://www.lrl.texas.gov/legeLeaders/members/memberdisplay.cfm?memberID=5640).
- Dutton identifies as a Democrat and explains his intent to make neglected
  Kashmere a priority for the full board in his
  [March 13, 2023 first-person account](https://www.houstonchronicle.com/opinion/outlook/article/dutton-wheatley-tea-hisd-school-takeover-17816744.php).
  Attribute that rationale to him; he continued to defend intervention.
- Year 2015 and final conference-report votes, House 125–18 / Senate 26–5:
  certification at the bottom of the [enrolled act](https://capitol.texas.gov/tlodocs/84R/billtext/html/HB01842F.htm).
  June 19 signing: [official history](https://capitol.texas.gov/billlookup/History.aspx?Bill=HB1842&LegSess=84R).
- Campus failure can trigger districtwide managers or campus closure: §12 of
  the enrolled act, former TEC §39.107. Do not describe district takeover as
  the only statutory option. The disproportionality critique is the speaker's
  interpretation of that mechanism.
- Wheatley's seventh consecutive unacceptable rating triggered action in 2019;
  managers installed June 1, 2023 after litigation: [TEA intervention history](https://tea.texas.gov/about-tea/newsroom/tea-announces-extension-houston-isd-intervention-and-new-appointments-houston-isd-board-managers).
  TEA also cited governance and special-education problems.
- Later legislation includes SB 1365 (2021): [Sen. Bettencourt's statement](https://senate.texas.gov/press.php?id=7-20230315b).
  No new detailed claims about that bill's litigation effects were added.
- Avoid the claim that Democrats alone authored and passed HB 1842: the bill
  had a Republican primary author and bipartisan support. Distinguish Dutton's
  takeover provision from the entire bill.

## Slide 1: Cover

- Byline month: October 2026 (2026-10-03 refresh; was September 2026; deck decision, matches the blog's `date: 2026-07-15` ->
  refreshed framing and this deck's own edit date).
- No Dobie claim on the current cover (checked 2026-09-26); Burnet/Webb figures: same
  sources as Slide 3.

## Slide 2b: Where the numbers come from (`data/02b-reddit.ts`)

- Four screenshots of the speaker's own r/Austin posts
  (`public/reddit-recapture.webp`, `reddit-fortstockton.webp`, `reddit-vouchers.webp`,
  `reddit-district-spending.webp`)
  with the datasets each post's charts were built from (TEA and the comptroller;
  TEA PEIMS finance; FLDOE enrollment; TEA summarized finance). FLAG: founder-reported. Post URLs are not
  recorded here; the screenshots are the artifact.
- Unhidden 2026-09-19 and rebuilt as a story stage (one post per click) in place of
  the paragraph version, which the card budget could not carry.

## Slide 3: What August confirmed (`data/03-countdown.ts`)

Every figure on this slide is 2025-26, queried from `tea/accountability-summary`
(TEA's 2026 statewide multi-year ratings file), district 227901, campus rows only,
on 2026-09-16. That file carries the full 2025-26 campus breakdown, so the slide no
longer falls back on 2024-25 counts or on figures quoted in news coverage.

- 2 campuses crossed the fifth F: Burnet (F, 59) and Webb (F, 58). The August
  coverage reported the two scores the other way round (Austin American-Statesman,
  statesman.com/news/education/article/austin-isd-state-takeover-webb-burnet-f-22386041.php;
  KXAN, kxan.com/news/local/austin/austin-isd-f-rating-tea/, both accessed
  2026-09-16); TEA's own file is what the deck follows.
- 9 campuses one F from the trigger entering the 2026-27 ratings (stat 2, amber),
  card at beat 1: "Nine more are one F away." / "Six carry the record of a school AISD
  closed." (body changed 2026-10-03; see "Refresh 2026-10-03" for the nine as TEA now
  assigns them). Dobie (D, 62) is one of the nine: its D paused its count at four. See
  "Refresh 2026-09-26" for the SQL, the table and the rule; the 3 -> 9 year-over-year
  comparison is carried by the Slide 7 waffle card, cited there. FLAG: derived count.
  Replaces the earlier "1 campus escaped" stat (banned below).
- Stat 4 ("still rated F") is slate rather than amber so it does not sit under the
  amber stat 2 in the same hue.
- 20 F-rated campuses district-wide in 2025-26 (23 in 2024-25).
- 36 of the 113 campuses rated in both 2024-25 and 2025-26 gained at least one letter
  grade; 11 lost one. Combined D/F count 41 -> 31. The 35 / 48 -> 25 pair used before
  this pass came from a superintendent quote via KXAN and does not match TEA's
  published campus ratings.

## Slide 4: STAAR pass rates (`data/04-staar-pass-rates.ts`)

- Measurement note and source link (visible on manifest slide 5 at every click):
  percentage of tests at Approaches Grade Level or above, calculated as
  `100 * SUM(approaches_plus_count) / SUM(tests_taken)` from
  `tea/staar-cambium-campus`, English-language rows with `tests_taken > 0`,
  Science excluded. The dataset covers grades 3–8; included subjects are math,
  reading, and social studies. These are pooled test counts, not unique students
  or an official overall district score. The district comparison includes grades
  3–8 while Burnet, Dobie, and Webb are middle schools.
  Source: [TEA Research Portal (Cambium), Group Summary reports](https://txresearchportal.com/).
  Existing extraction and formula are documented in
  `blog/src/content/blog/aisd-takeover-houston-playbook.mdx` (STAAR chart query and
  methodology) and `datasets/tea/staar-cambium-campus/dataset.yaml`.
- "Below 40% since 2022" (headline, zone label, beat-1 card): the chart's window is
  Spring 2022 to Spring 2026, and all three campuses sit under 40% in every year of it.
  It read "since 2018" before 2026-09-26, which is wrong: in Spring 2019 Burnet scored
  42.7% (623/1458) and Dobie 41.7%.

## Slide 4b: How A-F ratings work (`data/04b-af-system.ts`)

Added 2026-10-03, manifest position 6, between the STAAR chart and the
accountability-score chart. Researched 2026-10-03; nothing here is queried
from a dataset, every item is a document or news source.

On-slide figures:

| Item | Value | Source |
|---|---|---|
| Ratings start (beat 0 card, "1993 Ratings" tick) | 1993, on TAAS; labels Exemplary, Recognized, Academically Acceptable, Low-Performing | TEA Technical Digest 2018, ch. 1 (tea.texas.gov/student-assessment/reports-and-studies/2018-tech-digest-chapter-1.pdf) |
| "to Unacceptable" (beat 0 card) | 2004-2011 TAKS-era bottom label, Academically Unacceptable | TEA 2011 Accountability Manual (rptsvr1.tea.texas.gov/perfreport/account/2011/manual/manual.pdf) |
| Met Standard / Improvement Required "from 2013" (beat 0 card, "2013 Pass/fail" tick) | 2013-2017 labels | Texas 2036 "A-F Ratings 101"; TEA rating-systems page (rptsvr1.tea.texas.gov/perfreport/account/) for no ratings in 2003 and 2012 |
| "2015 A-F law" tick | HB 2804 (84th Leg.) orders A-F from 2017-18; HB 22 (2017) restructures it to today's three domains | TPPF Legislator's Guide (texaspolicy.com/wp-content/uploads/2019/01/A-F-Accountability.pdf); TEA 2026 ratings release |
| Campus letter grades "in 2019" (beat 1 card, "2019 Grades" tick) | First campus grades August 2019; districts got grades in August 2018 while campuses were still Met Standard / Improvement Required | TEA 2018 Accountability FAQs; TEA A-F page; Texas 2036 |
| "COVID stopped ratings for two years" (beat 1 card), "2020 COVID" tick | No ratings 2020 or 2021 | Texas 2036 |
| "Lawsuits held the 2023 and 2024 grades until 2025" (beat 1 card), "2023 Lawsuits" tick | 2023 refresh; districts sued in fall 2023 (Texas Tribune 2023-09-12 says about a month before; KUT says the judge blocked release in October 2023), 120+ districts eventually; 15th Court of Appeals reversed April 3, 2025, 2023 grades published April 24, 2025; 33 districts sued over 2024, cleared July 3, 2025, 2024 and 2025 grades published together August 15, 2025 | Texas Tribune 2023-09-12; KUT 2025-04-04; KBTX 2025-04-24; Community Impact 2025-07-14 and 2025-07-25; TEA To-the-Administrator letter 2025-07-24 |
| "2026 Latest" tick | 2026 ratings public August 14, 2026 (districts saw preliminary results August 13, the date slide 7's beat 1 card and slide 10's fifth-F tick show) | TEA 2026 ratings release (tea.texas.gov/about-tea/newsroom/tea-releases-2026-f-accountability-ratings-txschoolsgov), also the slide's StoryLink |
| Three domains (beat 2 card, rows) | Student Achievement (STAAR, CCMR, graduation rate for high schools; STAAR only for elementary and middle), School Progress (Part A growth, Part B relative performance against campuses with similar economically disadvantaged shares; better of A or B), Closing the Gaps (student groups) | TEA 2026 Accountability Manual, ch. 2 and ch. 5 |
| `AF_WEIGHTS` 70% / 30% (beat 3 card, chips) | Better of Achievement or Progress x 70% + Closing the Gaps x 30%; no Closing the Gaps score means the better-of counts 100% | TEA 2026 Accountability Manual, ch. 5 ("Calculating Ratings") |
| `AF_BANDS`, `AF_F_CUT` 60, `AF_A_CUT` 90 (headline, beat 4 card, scale) | A 90-100, B 80-89, C 70-79, D 60-69, F 59 or below; same cuts for overall and domain scores | TEA 2026 Accountability Manual, ch. 5 |

Speaker-note-only items:

- 2022: under SB 1365 (2021) a campus or district below 70 got "Not Rated: Senate
  Bill 1365" instead of a D or F; 42 districts and 564 campuses. TEA 2022 ratings
  release (tea.texas.gov/about-tea/newsroom/tea-releases-2022-f-accountability-ratings).
- 2023 refresh: the CCMR bar for an A went from 60% to 88% of graduates (Texas
  Tribune 2023-09-12). No specific STAAR cut-score change is claimed; only the CCMR
  change was confirmed.
- STAAR component = (% Approaches or above + % Meets or above + % Masters) / 3. TEA
  2026 Accountability Manual, ch. 5.
- HB 8 (89th Leg., 2nd called session, signed September 2025): annual A-F ratings
  required, statewide Not Rated years banned (campus-level Not Rated continues: 560
  campuses in 2026), most taxpayer-funded suits against ratings barred, STAAR
  replaced by three shorter tests from 2027-28. Texas Tribune 2025-09-30; KUT
  2025-05-28; Senate press release 2025-08-14. HB 8's statutory text was not read;
  TEA's HB 8 overview PDF returned 404.
- Q&A: the 3 Fs rule (below 60 in three of Achievement, Progress A, Progress B,
  Closing the Gaps caps the overall at 59 unless Achievement is 60+), TEA 2026
  Accountability Manual ch. 5; 61% of rated campuses A or B and 49% of high-poverty
  campuses A or B in 2026, next refresh 2028, TEA 2026 ratings release.
- Deliberately not on this slide: the five-year rule (TEC 39A.111), the D pause,
  how Not Rated counts, closure vs board of managers. Slide 8 (legal) covers them.

## Slide 5: Accountability scores (`data/05-accountability-scores.ts`)

- 2017-18 through 2024-25 scores: `tea/accountability-summary`, `overall_score`, campus
  numbers 227901055 (Dobie), 227901053 (Webb), 227901046 (Burnet), verified 2026-07-11
  (same query the blog article cites for its own version of this chart).
- 2025-26 Burnet (F, 59), Webb (F, 58) and Dobie (D, 62): same dataset, queried
  2026-09-16. These are TEA's preliminary scores, not a model projection. The August
  news coverage swapped the Burnet and Webb scores.
- All three lines carry an end label from the first click, each one beside its own
  last point, including Dobie's 62.
- Speaker note (added 2026-10-03): the 2017-18 point predates campus letter grades.
  Campuses were officially rated Met Standard or Improvement Required that year
  (TEA 2018 Accountability FAQs; Texas 2036). The dataset's provenance for a
  2017-18 campus `overall_score` was not checked.

## Slide 6: The legal mechanism

- Beat 1 card names Dobie ("Dobie's D paused its count."): Dobie's 2025-26 D (62)
  under the D-pause rule; see "Refresh 2026-09-26".
- TEC §39A five-consecutive-F trigger, SB 1365 D-pause rule, Fort Worth closed-campus
  precedent: unchanged from the June deck, `tea/accountability-summary` and Texas
  Tribune (texastribune.org/2025/10/29/texas-fort-worth-isd-takeover-history/), as cited
  in the blog article's "Austin isn't the only district facing this path" section.
- SB 1882 rejection quote (TEA, May 28, 2026): unchanged, Texas Tribune
  (texastribune.org/2026/05/28/austin-isds-bid-to-avoid-state-takeover-rejected-by-texas-education-agency/).
- Parent-petition mechanism, October 15 deadline: Austin Current, "Austin mayor reveals
  plan to save AISD from takeover"
  (austincurrent.org/2026/09/09/austin-austinisd-takeover-mayor-burnet-webb/) and KUT,
  "Austin ISD won't help families petition to close schools"
  (kut.org/education/2026-09-15/austin-tx-aisd-state-takeover-burnet-webb-middle-schools-tea),
  both accessed 2026-09-16.
- Closed-campus step (added 2026-10-03, beat 2): see "Refresh 2026-10-03".
- Ratings final December 11 (updated 2026-10-03, same date on the closing slide):
  Community Impact
  (communityimpact.com/central-austin/education/austin-isd-could-lose-elected-board-as-early-as-january/)
  and KUT (kut.org/education/2026-09-18/austin-isd-appeals-two-failing-school-ratings-in-bid-to-avoid-takeover),
  both 2026-09-18. Earlier wording, "in December, after a 90-day review": Texas Tribune, "Austin mayor tries
  to prevent Texas from taking over AISD"
  (texastribune.org/2026/09/09/austin-isd-school-takeover-texas-education-agency/) and
  KXAN, accessed 2026-09-16. AISD's appeal deadline for the preliminary ratings was
  September 11, 2026 (same KXAN piece). AISD did appeal both ratings before that
  deadline (KUT and Community Impact, 2026-09-18), found on the 2026-10-03 refresh.

## Slide 7: Waffle of 102 open campuses (`data/07-waffle.ts`)

**Hover cards added 2026-10-13 (manifest slide 10).** Each square now has a
fixed campus number, with its 2025-26 letter grade, overall score, economically
disadvantaged share, enrollment, and derived consecutive F count. The snapshot
is `data/07-waffle-campuses.json`; no network call occurs during the presentation.

- Source: [TEA 2026 statewide multi-year ratings workbook](https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-statewide-multi-year-ratings-spreadsheet.xlsx),
  downloaded 2026-10-13. This is the exact source URL configured in
  `datasets/tea/accountability-summary/dataset.yaml`. OpenData production API
  credential access was blocked by the repository delegate guard; the snapshot
  was extracted directly from the public source, not fetched from the API.
  Workbook SHA-256: `ec9833e67a33141ab0d9eb49753fad1e2609674f698e7d29f0a1ae7f7794612d`.
- Extraction: read `2018 State Summary` through `2026 State Summary`, select
  District Number `227901` and nonempty Campus Number. Use the 2026 row for
  campus name, Overall Rating, Overall Score, % Economically Disadvantaged
  (stored as a fraction), and Number of Students. Retain the annual Overall
  Rating history, with 2018's `Overall Grade/Rating` header normalized to the
  same field. Keep 114 campuses whose 2026 rating is A–F; exclude the 12 closed
  campus IDs listed in the October 3 section to obtain 102 squares.
- Count method: chronological F or Improvement Required adds one; D and
  Not Rated pause; A/B/C, Met Standard, or Met Alternative Standard reset.
  FLAG: derived count, not TEA's published consecutive-unacceptable count.
  The six transfers use the closed campus's history from the existing
  October 3 transfer table; each card names that campus and separately gives
  the receiver's own count. The displayed grade, demographics, and enrollment
  always belong to the receiving campus, not the closed school.
- Validation: 102 unique open rated campuses; tiers reproduce 2/9/20/71;
  25 open D/F, of which 20 are D/F in 2024, 2025, and 2026. All six receiving
  campuses have an inherited count of four and an own-campus count of zero.
  On the initial rating beats, all actual D/F campuses light and the six
  A/B/C receivers have a distinct violet group labeled "6 inherited four Fs".
  The final beat separates the three own-record campuses at four from the
  other D/F campuses. Squares sort into the visible legend groups per beat;
  campus IDs preserve the hover-card identity during reordering. Hover cards
  fade and rise with a 150ms CSS transition (disabled for reduced motion).

Recomputed 2026-10-03 (see "Refresh 2026-10-03"): 102 campuses open in 2026-27
with a 2025-26 rating; 2 crossed / 9 at four (named for the campus carrying each
count) / 20 other D or F / 71 C or better. Beat 1 now reads 25 open D/F campuses,
20 of them D/F three straight years; beat 2's body "District-wide, 36 gained a
grade; D/F fell from 41 to 31" stays district-wide (all 114). The bullets below
are the 2026-09-26 vintage over all 114 rated campuses, kept for history.

- Tier counts (2 crossed the fifth F / 9 one F from the trigger / 20 other D or F /
  83 C or better, 114 rated campuses): `tea/accountability-summary`, 2025-26, district
  227901, campus rows, queried 2026-09-16; the 29 D/F split into 9 + 20 on 2026-09-26
  (see "Refresh 2026-09-26", FLAG: derived count). Eight further campuses are Not Rated
  and are not squares.
- Beat 3 card ("Nine more are one F away." / "Last year only three were. Two of them
  crossed."): the 3 -> 9 comparison in "Refresh 2026-09-26". The two of the three that
  crossed are Burnet and Webb; the third is Dobie.
- 26 campuses have been D or F in each of 2023-24, 2024-25 and 2025-26 (card copy at
  beat 1): same query, re-counted from the refresh query's rows on 2026-09-26.
- Chronic-tier cells (Burnet, Webb): the two campuses at five consecutive F's.
- The previous 3 / 31 / 81 split was a 2024-25 blog figure TEA's campus ratings do not
  support (2024-25 is 115 rated, 34 D/F for three straight years, 74 C or better).

## Slide 8: AISD timeline (`data/08-timeline.ts`)

- Steps 1-5 (2018-19 through May 2026 enrollment/F-count figures): unchanged,
  `tea/accountability-summary` and `tea/student-enrollment`, as cited in the original
  step sources (carried over verbatim from the June deck).
- Funding Lost KPI, every step: (80,032 - step enrollment) x $8,640, AISD's FY2025
  formula entitlement per enrolled student. $0, $57M, $62M, $67M, $95M (steps 5-8),
  $155M (step 9 scenario). Formula and inputs in "Funding correction 2026-10-03".
- Step 6, "Fifth F crosses the threshold" (Aug 13, 2026): now a confirmed past event,
  not a projection. Same sources as Slide 3.
- Step 7, "Petition window opens" (through Oct 15, 2026): same sources as Slide 6's
  petition mechanism.
- Step 7 updated 2026-10-03: Segura said Sept 15 the district would not help gather
  signatures (KUT), then told Webb (Sept 24) and Burnet (Sept 28) families the petition
  was "the only way for your voice to be brought into the process" (Texas Tribune,
  texastribune.org/2026/09/24/austin-isd-takeover-burnet-webb-petition-mayor/). Card
  body: 'AISD now calls it "the only way" for families.'
- Step 8, "Final ratings and the commissioner's call" (Dec 11, 2026, projected; was
  "Dec 2026" / "90-day review closes"): AISD appealed both ratings before Sept 11
  (KUT 2026-09-18); final ratings Dec 11; a takeover decision could come as early as
  January 2027 (Community Impact 2026-09-18). Card body: "AISD appealed both. A
  decision could come in January." Enrollment KPIs stay on TEA's 69,074; AISD's own
  fall 2026 count (65,951, KUT 2026-09-28) is a different series and is not used.
- Step 9, "What Austin could inherit" (2027-29, scenario): unchanged methodology,
  carried over from the blog article's own disclosed scenario in its Calculations &
  transformations section (~5%/year enrollment decline under takeover), verified
  2026-06-17. Labeled on-slide as a scenario, not a forecast. The per-student valuation
  was $13,300 until 2026-10-03; it is now $8,640, see "Funding correction 2026-10-03".
  Its "around 7,000 more students" is the step's own KPI against today's enrollment:
  69,074 - 62,100 = 6,974. It read "around 10,000" before 2026-09-26.

## Slide 9: Scatter, 24 AISD campuses (`data/09-scatter.ts`)

**Hover cards 2026-10-13 (manifest slide 12).** Each dot joins by its nine-digit
TEA campus number to `data/07-waffle-campuses.json`, the verified 2025–26
accountability snapshot documented under slide 7. Cards show both plotted STAAR
rates, their difference in percentage points, latest letter grade and score,
economically disadvantaged share, enrollment, and the derived consecutive F
count using the same pause/reset rules as slide 10. Closed campuses retain their
own metadata; six identify the receiving campus separately. Winn is marked closed
without attributing its record to a receiver. The unused legacy 2024–25 `enroll` field was removed during the
2026-10-13 refactor. Shared records, closure assignments, and derived F counts
now live in `data/campuses.ts`; slide modules own only their plotted selections. No new coordinate queries or changes were needed.

**Chart correction 2026-10-13 (manifest slide 12).** Replaced the fitted
regression line with a true `y = x` reference line, labeled "No change:
2026 = 2025". The old line was not a valid boundary for improvement despite
the card saying points above it improved. The headline now specifies higher
STAAR pass rates, not improvement in accountability ratings. The 24 points
are unchanged: 17 higher, 6 lower, 1 unchanged at the displayed precision.
All 24 pairs were verified through the newly connected OpenData MCP on
2026-10-13, using the raw view because the default view omits language and
pass counts:

```sql
SELECT campus_cdc, campus_name, ROUND(100.0 * SUM(CASE WHEN administration = 'Spring 2025' THEN approaches_plus_count END) / NULLIF(SUM(CASE WHEN administration = 'Spring 2025' THEN tests_taken END), 0), 1) AS pass_2025, ROUND(100.0 * SUM(CASE WHEN administration = 'Spring 2026' THEN approaches_plus_count END) / NULLIF(SUM(CASE WHEN administration = 'Spring 2026' THEN tests_taken END), 0), 1) AS pass_2026 FROM "tea/staar-cambium-campus:all" WHERE district = 'Austin ISD' AND language = 'English' AND subject <> 'Science' AND tests_taken > 0 AND administration IN ('Spring 2025', 'Spring 2026') AND campus_cdc IN ('227901055', '227901053', '227901046', '227901051', '227901152', '227901114', '227901129', '227901175', '227901157', '227901160', '227901149', '227901125', '227901061', '227901065', '227901109', '227901178', '227901164', '227901116', '227901150', '227901101', '227901118', '227901141', '227901147', '227901161') GROUP BY campus_cdc, campus_name ORDER BY campus_name
```

- Point coordinates (x, y): `tea/staar-cambium-campus`, STAAR pass rate =
  approaches_plus_count / tests_taken, English only, Science excluded (same query as
  the blog article's larger 33/34-campus version of this scatter). The June deck's
  21-campus subset was verified 2026-06-17; Barrington, Oak Springs and Paredes were
  added 2026-09-26 so all nine campuses one F from the trigger appear (24 points). SQL
  and values in "Refresh 2026-09-26".
- Every point has three straight D/F ratings, 2022-23 to 2024-25 (the subtitle's
  window), checked against the refresh query's rows.
  The 11 crossed / one-F campuses are in the refresh table; the 13 "Other D/F campus"
  points are below (`tea/accountability-summary`, same refresh query, verified
  2026-09-26), all D or F in all three years:

  | Campus | 22-23 | 23-24 | 24-25 |
  |---|---|---|---|
  | Wooldridge EL | F | F | F |
  | Winn Montessori | F | F | F |
  | Sadler Means YWLA | F | F | D |
  | Brown EL | D | F | F |
  | Jordan EL | D | F | F |
  | Pickle EL | D | F | F |
  | Govalle EL | D | F | F |
  | Norman(-Sims) EL | F | F | D |
  | Allison EL | D | D | D |
  | Harris EL | D | F | D |
  | Walnut Creek EL | F | D | D |
  | Menchaca EL | D | D | D |
  | Cook EL | D | F | D |

- The original points carried an unused 2024–25 enrollment field, removed
  2026-10-13. Hover enrollment comes from the shared 2025–26 campus snapshot.
- Tiers: "Crossed the fifth F" (Burnet, Webb; rose), "One F from the trigger" (the
  nine, including Dobie; amber), "Other D/F campus" (the other 13, including
  Wooldridge, B in 2025-26, and Winn, C, whose runs reset; slate). FLAG: derived count.
- Relabeled 2026-10-03: the six closed campuses keep their points, coordinates and
  amber tier; each tooltip name reads "<campus> (closed; record moved to <receiver>)".
  Beat 1 body is now "Six amber campuses closed; their records moved to the schools
  that took their students." The receivers are not plotted (none has three straight
  D/F years: Bailey C/C/B, Guerrero Thompson B 2024-25 and 2025-26, Galindo C/B,
  Kealing A/A, Blackshear C/C, Rodriguez D/B for 2024-25/2025-26).
- Beat 2 "Six campuses got worse.": y < x for Pecan Springs, Oak Springs, Pickle,
  Govalle, Allison and Harris (Menchaca is flat at 67.2). It read "Five" before Oak
  Springs (36.3 -> 35.2) was added. 17 of 24 improved (headline).

## Slide 9b: Campus map, eco-dis to TEA ratings (`data/09b-campus-map.ts`)

- 112 mappable AISD campuses, 2025-2026 (FY26). Coordinates are still the
  `tea/school-locations` join copied from `blog/src/data/articles/staar-sat-gap-geo.ts`
  (`AISD_CAMPUSES` subset, verified 2026-07-15). Rating, eco-dis share and enrollment were
  re-pulled from FY26 on 2026-09-16:

  ```sql
  SELECT campus_number, campus, overall_rating, overall_score,
         economically_disadvantaged, number_of_students
  FROM tea/accountability-summary
  WHERE district_number = '227901' AND school_year = '2025-2026'
    AND campus_number IS NOT NULL
  ORDER BY campus_number
  ```

  `school_year = '2025-2026'` is the FY26 value in that dataset. 122 AISD campus rows come
  back, 114 of them with an A-F rating (the other 8 are "Not Rated" DAEP, JJAEP and
  hospital-school programs). 47 of the 112 matched deck ratings changed against the
  2024-25 vintage; eco-dis and enrollment moved to FY26 for all of them so the dots carry
  one vintage. Graduation Preparatory Academy (227901023) and Graduation Prep Academy
  Navarro (227901026) have no FY26 record and were dropped, leaving 112. Still excluded for
  want of coordinates: General Marshall Middle (FY26 D, geocodes to 0,0) and Blazier Pri
  (FY26 B).
- Eco-dis dark ramp (five buckets, thresholds 30/50/70/85%): copied from
  `blog/src/components/rgv-recapture-charts/ecoDisScale.ts`.
- TEA rating palette (A green through F red): copied from
  `blog/src/components/rgv-recapture-charts/AisdRatingsMapScrolly.tsx`.
- F campuses average 91% eco-dis, A campuses average 16%: unweighted means of `ecoDis`
  over the FY26 rows in `data/09b-campus-map.ts` (F: n=20, 90.68%; A: n=28, 15.55%),
  computed 2026-09-16. Both still round to the figures the card copy quotes.
- Basemap: Census TIGERweb 2020 ZIP Code Tabulation Areas, Austin metro, copied from
  `blog/src/data/geo/austin-zips.json`. Clipped to AISD campus bounding box plus ~0.1deg
  margin, toposimplified.
- StoryLink URL: https://labs.tryopendata.ai/staar-sat-gap

## Slide 10: Section divider, "Not just one district"

- No new figures; lede rewritten from "Austin is next in line" to "Austin crossed the
  same threshold in August," matching Slide 3/6/8. 2026-10-03: lede adds "and Fort
  Worth is six months into the same model" (board of managers installed March 24,
  2026, KERA/Fort Worth Report; see Slide 18b).

## Slide 12: NES timeline (`data/13-nes-timeline.ts`)

Added 2026-10-03 (deck UX pass); the slide had no section before. Tick and panel
dates were relabelled so they run in time order along the rule:

| Step | Old date | New date | Source |
|---|---|---|---|
| 1 The state moves in | Jun 2023 | Jun 2023 | June deck |
| 2 Two tracks at once | 2023-24 | 2023-24 | first NES school year |
| 3 The money was the lever | 2023-24 | 2023-24 | same |
| 4 Libraries become Team Centers | Jul 2023 | 2023-24 | June deck dated it July 2023 (Houston Public Media 2024-01-23); the finer date moved to the speaker notes |
| 5 Staff start leaving | Fall 2023 | 2023-24 | 170 resignations in the first six weeks of the first NES year (Houston Landing, as the article cites it) |
| 6 Expansion by letter grade | 2024-25 | 2024-25 | unchanged |
| 7 The brakes come on | 2025-26 | 2025-26 | unchanged |
| 8 An exit ramp appears | 2025-27 | Through Jun 2027 | TEA extension through June 2027, Texas Tribune 2025-06-02 (texastribune.org/2025/06/02/texas-houston-isd-takeover-3/) |

The old "2025-27" overlapped the 2025-26 tick before it; the new label is the end
date the step's own KPI already showed. The panel caption that repeated each card
was removed (`NES_STEP_CAPTIONS`); no figure changed. Speaker-note backup figures
(28 mandated + 57 voluntary = 85, ~$85k NES pay, $8,566 vs $6,133 base campus
allocation per student (Houston Chronicle; excludes districtwide and special-ed funding,
which bring them to $10,635 vs $7,102),
170 vs 84 resignations, 4,000+ June 2024 departures, ~130 campuses, the dropped
150-school target) are the article's `TakeoverTimelineScroll` step bodies.

Funding Lost KPI (steps 6 and 8), added 2026-10-03: there was no sourcing note for
either counter before. Enrollment loss from the 2022-23 baseline of 189,934
(`tea/student-enrollment`) times $8,860, HISD's FY2025 formula entitlement per enrolled
student: Tier One $8,038 + golden-penny Tier Two $819. 13,207 x $8,860 = $117M (2024-25,
176,727 enrolled); 21,122 x $8,860 = $187M (2025-26, 168,812). Was $175M / $281M at
AISD's $13,300. Inputs in "Funding correction 2026-10-03".

## Slide 13: Testimony wall (`data/14-testimony.ts`)

- 39 quotes from r/TexasTeachers threads, June 2026, lightly trimmed for length.
  Attribution is the self-described role in the thread, never a real name. No
  figure appears on this slide; the cards cycle on a wall-clock timer, so a PDF
  export holds whichever two quotes it opened on.

## Slide 15: Uncertified share, Houston and its neighbors (`data/16-uncertified.ts`)

`tea/uncertified-teachers` (by-school-system view), pulled 2026-09-17:

```sql
SELECT academic_year, school_system, total_teachers, total_uncertified,
       percent_uncertified_teachers
FROM "tea/uncertified-teachers:by-school-system"
WHERE cdn IN (101912, 101914, 101907, 227901)
  AND academic_year >= '2020-2021'
```

- Houston ISD 2.9% in 2022-23 (the last pre-takeover year), 21.3% in 2025-26.
- Katy ISD 1.3% in 2025-26; Cypress-Fairbanks 1.2%; Pasadena 2.1%. All three
  border HISD and none was taken over.
- Austin ISD 11.0% in 2025-26.
- The chart's four series stop at 2025-26 because that is the newest year in the
  workbook as of 2026-09-17.

## Slide 16: Certified against uncertified headcount (`data/17-cert-headcount.ts`)

Same workbook and pull date as Slide 15, Houston ISD only:

```sql
SELECT academic_year, total_teachers, total_uncertified
FROM "tea/uncertified-teachers:by-school-system"
WHERE cdn = 101912
ORDER BY academic_year
```

- Certified count is `total_teachers - total_uncertified`: 10,233 in 2022-23,
  7,727 in 2025-26, a drop of 2,506 over three years.
- Uncertified count: 301 in 2022-23, 2,088 in 2025-26.
- Turnover 32.2% (HISD) against 13.6% (Katy) in 2024-25, and average teacher
  experience 10.1 years (HISD), from `tea/tapr-staff-students`, metric codes
  `DPSTURNR` and `DPSTEXPA`, district 101912. 2024-25 is the newest TAPR year.
- The waiver line: HISD hires uncertified teachers under the District of
  Innovation exemption from TEC Chapter 21 certification (2015 law, TEC
  §12A.004). HB 2 (2025) added TEC §21.0032, which removes foundation subjects
  from that exemption: K-5 reading and math from 2026-27, all foundation
  subjects from 2027-28, with certification required by 2029-30.

FLAG: no dataset in the catalog measures teachers moving between districts. The
slides say Houston lost certified teachers while its neighbors did not, which
the counts above support directly. They must not claim a measured flow from
HISD into Katy or Cypress-Fairbanks.

## Slide 17: Teacher turnover stats (`data/18-turnover.ts`)

`tea/tapr-staff-students`, district 101912, pulled 2026-09-17, metric codes
`DPSTURNR` (turnover ratio), `DPSTTOFC` (teacher FTE), `DPSTEXPA` (average
experience).

- Turnover 22.3% (2022-23), 19.7% (2023-24), 32.2% (2024-25). 2024-25 is the
  newest year TAPR publishes.
- Teacher FTE 10,543.4 / 11,378.4 / 10,589.9 for the same three years.
- 8,000 exits since the takeover is turnover times FTE across those three
  years: 2,351 + 2,242 + 3,410 = 8,003, rounded because both inputs are.
  The June deck's 8,108 came from an earlier TAPR vintage.
- Pre-takeover turnover average 19.5%, the mean of 2015-16 through 2021-22
  (19.5, 19.0, 17.6, 19.1, 20.3, 18.8, 22.4).
- 21.3% uncertified is 2025-26 from `tea/uncertified-teachers` (see Slide 15).

## Slide 18b (manifest slide 22): Fort Worth workforce (`data/18b-fwisd-workforce.ts`)

New 2026-10-03, manifest position 20, right after the Houston turnover slide.
Four beats, one InkNumber each. Nothing here is in the catalog (TEA's
uncertified-teacher file stops at 2025-26, when Fort Worth had 46 uncertified,
1.0%; TAPR staff stops at 2024-25), so every figure is reporting from district
records. The same figures carry the article's Fort Worth passage.

- Beat 0, model: chief of schools Daniel Soliz "a former top Houston deputy"; the
  Tribune describes ELEVATE as NES practices rebranded (Texas Tribune, 2026-09-21,
  texastribune.org/2026/09/21/houston-isd-state-takeover-sustainability/). 24 ELEVATE
  campuses (Fort Worth Report, 2026-08-16,
  fortworthreport.org/2026/08/16/fort-worth-isd-has-3-levels-of-school-autonomy-heres-what-each-means/;
  19 at the spring budget, 5 added).
- Beat 1, exits: 1,102 teachers resigned or retired in 2025-26 against 690 in 2024-25,
  by effective date; those with 10+ years in the district 136 -> 279. Fort Worth Report,
  2026-08-06, from district records
  (fortworthreport.org/2026/08/06/record-teacher-turnover-leaves-fwisd-with-few-vacancies-but-fewer-veteran-educators/),
  also the StoryLink. DMN's 1,026 vs 648 (resignations by the June deadline) is a
  different measure and is not used.
- Beat 2, August departures: 55 teachers left in August 2026, versus 21 in
  August 2025. Monthly counts, not full-year or year-to-date totals. Source read
  2026-10-15: https://fortworthweekly.news/article/teacher-departures-at-fort-worth-isd-more-than-doubled-in-august-records-show
  (2026-10-05), attributing district records to Fort Worth Report's October 4 article:
  https://fortworthreport.org/2026/10/04/fwisd-teacher-departures-more-than-doubled-in-august-what-drove-the-increase/.
  FLAG: original article blocked retrieval; figures verified against the secondary
  report only. StoryLink on this beat opens the source actually read. Replaces
  the uncertified-teacher beat; no causal attribution to the takeover.
- Beat 3, principals: new principals at 53 of 120 campuses; prior record 39 (2017-18).
  Fort Worth Report, 2026-08-05
  (fortworthreport.org/2026/08/05/fort-worth-isd-sees-highest-principal-turnover-in-more-than-a-decade/).
- The article's `fwisdWorkforce` arrow chart was not ported: two of the four
  beats are about departures, and the deck's other four-beat stat slides use the
  InkNumber pattern; the 136 -> 279 veteran figure rides in the beat 1 card.

## Slide 19: HISD enrollment decline (`data/20-enrollment.ts`)

`tea/accountability-summary`, district rows only, pulled 2026-09-17:

```sql
SELECT school_year, number_of_students
FROM "tea/accountability-summary"
WHERE district_number = 101912 AND (campus_number IS NULL OR campus_number = '')
ORDER BY school_year
```

- Enrollment: 213,528 (2017-18), 209,040, 209,309, 196,550, 193,727, 189,290,
  183,603, 176,039, 167,793 (2025-26). Every bar is recomputed from this one
  pull, so several moved a tenth or two against the June deck's vintage
  (2020-21 -6.3 -> -6.1, 2021-22 -1.2 -> -1.4, 2022-23 -2.4 -> -2.3, 2023-24
  -3.1 -> -3.0, 2024-25 -4.0 -> -4.1).
- The 2017-18 bar is dropped: this file begins at 2017-18, so there is no
  2016-17 to measure against, and no other catalog dataset carries HISD before
  2018-19.
- 2025-26 is TEA's published count, no longer a projection: -4.7%, or 8,246
  students. The June deck projected -4.5%. On `tea/student-enrollment`, which
  counts 168,812 for the same year, the change is -4.5%; the chart cites the
  accountability file and follows it.
- 2026-27 at -5.6% is a projection, labeled as such on the chart: a
  least-squares line through the four post-takeover years (-2.3, -3.0, -4.1,
  -4.7), extended one year. About 9,400 students, to roughly 158,400. It
  assumes the acceleration holds and is not a TEA figure.

## Slide 20: Grade-level shift (`data/21-grade-shift.ts`)

- Unchanged in this refresh. The figures are the UH Education Research
  Center's post-takeover average minus pre-takeover average by grade. TEA's
  district enrollment file breaks out ethnicity, not grade, and no catalog
  dataset carries district grade-level counts, so these cannot be recomputed
  or extended to 2025-26 from TEA.

## Slide 22: Per-pupil revenue and deficits (`data/24-recapture.ts`)

Revenue rows: `tea/summarized-finance`, fiscal year 2025 (the 2024-25 school
year), pulled 2026-09-17. FY2025 is the newest year TEA publishes; the source
workbook is dated 2026-04-08, so there is no FY2026 audited financial data yet
and will not be until 2027.

```sql
SELECT district_id, year,
       all_funds_local_tax_revenue_from_m_o,
       all_funds_local_property_taxes_from_i_s,
       all_funds_other_local_intermediate_revenue,
       all_funds_state_revenue, all_funds_federal_revenue
FROM "tea/summarized-finance"
WHERE district_id IN ('227901','220905','101912') AND year = 2025
```

- Local revenue kept per pupil (row label was "Local tax" until 2026-10-03) is M&O
  plus I&S plus other local revenue, divided by
  2024-25 enrollment from `tea/student-enrollment` (AISD 72,272, FWISD 70,405,
  HISD 176,727). AISD $14,197, FWISD $8,306, HISD $11,182. PEIMS M&O is net of
  recapture and "other local" is non-tax revenue, so this is what each district keeps,
  not its property tax collections. AISD's gross collections are about $24,000 per
  pupil (SOF 2024-25 line 15: $1,726,264,847 / 72,272 = $23,886).
- Sent to the state (recapture) per pupil (row added 2026-10-03): `all_funds_equity_transfers`
  (object 8911, recapture paid) from the same FY2025 row, over the same enrollment.
  AISD $771,603,135 / 72,272 = $10,676; FWISD $5,227,921 / 70,405 = $74; HISD
  $56,900,029 / 176,727 = $322. Beat 0 now highlights this row.
- Beat 0 card: "Austin sends $10,676 a student to the state." / "Every student Austin
  loses adds about $8,000 more to that." (`AISD_RECAPTURE_PER_PUPIL`,
  `RECAPTURE_PER_LOST_STUDENT`): see "Funding correction 2026-10-03".
- State aid per pupil: AISD $649, FWISD $5,028, HISD $1,216.
- Federal per pupil: AISD $1,553, FWISD $1,267, HISD $2,266.
- Recomputing moved the June deck's local-tax figures by a few dollars
  (14,217 -> 14,197, 8,332 -> 8,306, 11,225 -> 11,182). Same source, same
  definition, slightly different enrollment denominator. State aid and federal
  reproduced to within $15.

Deficit row (corrected 2026-10-03): general-fund operating surplus/deficit for
the same fiscal year as the revenue rows, FY2025 (2024-25), from the same file:

```sql
SELECT year, district_name,
       ROUND((gen_funds_total_operating_revenue - gen_funds_total_operate_expend_by_function) / 1e6, 1)
FROM tea/summarized-finance
WHERE district_name IN ('AUSTIN ISD','FORT WORTH ISD','HOUSTON ISD') AND year = 2025
```

AISD -$100.2M, FWISD -$55.1M, HISD -$311.8M (queried 2026-10-03), shown as
-$100M / -$55M / -$312M, row labelled "Gen-fund deficit, 2024-25". These match the
article's deficit chart and comparison table. Beat 2 card: "All three ran
general-fund deficits." / "Houston $312M in 2024-25, Austin $100M, Fort Worth $55M."

The 2026-09-17 table below is superseded. Its AISD figure was wrong: -$105M is how
AISD's 2025-26 year closed (KUT 2026-09-28; Community Impact 2026-09-04), not its
2026-27 budget; for 2026-27 AISD needs $5.7M more in cuts to avoid a deficit. The
three figures were not one year or one basis.

| District | 2026-27 adopted deficit (superseded 2026-10-03) | Source |
|---|---|---|
| Austin ISD | -$105M, after $192M net in cuts | Austin Current, 2026-08-28, austincurrent.org/2026/08/28/austin-austinisd-budget-cuts-deficit-grew/ |
| Fort Worth ISD | -$49.8M on $904M spending | Fort Worth Report, 2026-06-09, fortworthreport.org/2026/06/09/fwisd-cut-schools-and-jobs-why-is-a-49-8m-shortfall-looming-next-year/ |
| Houston ISD | -$24.5M on a $2.04B budget | Houston Chronicle, 2026-06-25, houstonchronicle.com/news/houston-texas/education/hisd/article/budget-2026-2027-22317443.php |

FLAG: this replaces the June deck's 2025-26 figures (AISD -$100M, FWISD -$55M,
HISD -$312M). Houston's shortfall closed almost entirely between the two
budgets, so the deficit row no longer shows the takeover district in the worst
shape. The slide's argument now rests on the state-aid row, where Fort Worth
draws $5,028 per pupil against Austin's $649.

## Slide 23: TEFA voucher take-up (`data/25-voucher.ts`)

Manifest slide 29 now opens with a program introduction (2026-10-13): TEFA
means Texas Education Freedom Accounts; accepted families use state-funded
accounts for private-school tuition, homeschooling and other approved expenses.
Source: [official TEFA program](https://educationfreedom.texas.gov/), checked
2026-10-13. The existing comparison now starts on click 1; there are five clicks.
The headline no longer claims Austin applicants "stayed": these district-boundary
counts do not measure departures from public-school rosters.

The catalog carries ten `tefa/*` datasets, all Year 1 (2026-27), no time
series. Three of them are the stages of one pipeline, five months apart, and
they do not say the same thing:

| Stage | Dataset | Vintage | AISD | HISD |
|---|---|---|---|---|
| Applications | `tefa/applications-by-district` | Feb 4 - Mar 31, 2026 window | 4,896 | 12,267 |
| Awards | `tefa/awards-by-district` | June 9, 2026 snapshot | 1,193 | 3,953 |
| Funded participants | `tefa/participants-by-district` | July 29, 2026 snapshot | 1,020 | 3,327 |

Denominator is 2025-26 enrollment from `tea/student-enrollment` (AISD 69,074,
HISD 168,812), so applications are 70.9 and 72.7 per 1,000 and funded accounts
are 14.8 and 19.7 per 1,000.

```sql
WITH enr AS (
  SELECT TRY_CAST(district AS BIGINT) AS cdn, MIN(district_name) AS dname, SUM(enrollment) AS enrollment
  FROM "tea/student-enrollment:all"
  WHERE year = '2025-2026' AND TRY_CAST(district AS BIGINT) IN (227901,101912)
  GROUP BY 1
), m(cdn, tefa_name) AS (
  SELECT 227901,'AUSTIN ISD' UNION ALL SELECT 101912,'HOUSTON ISD'
)
SELECT e.dname, e.enrollment,
       a.student_applications, w.applications_awarded, p.participating_students,
       ROUND(a.student_applications*1000.0/e.enrollment,1) AS apps_per_1k,
       ROUND(p.participating_students*1000.0/e.enrollment,1) AS participants_per_1k
FROM enr e JOIN m ON m.cdn = e.cdn
LEFT JOIN "tefa/applications-by-district:all" a ON upper(a.district) = m.tefa_name
LEFT JOIN "tefa/awards-by-district:all" w ON upper(w.district) = m.tefa_name
LEFT JOIN "tefa/participants-by-district:all" p ON upper(p.district) = m.tefa_name
```

- Fort Worth beat (added 2026-10-03, beat 2): same query with 220905 / 'FORT WORTH
  ISD' added. Fort Worth 67,491 enrolled, 4,803 applications (71.2 per 1,000), 2,038
  awards, 1,764 funded (26.1 per 1,000). Houston 19.7 (3,327) and Austin 14.8 (1,020)
  reproduce. Card: "Fort Worth got 26.1 per 1,000." / "Applications were tied. Awards
  went first to students with disabilities and lower-income families." Award priority:
  Texas Comptroller, 2026-04-22,
  https://comptroller.texas.gov/about/media-center/news/20260422-first-round-of-texas-education-freedom-accounts-awards-announced-1776776603367.
  Clicks 3 -> 4.
- Conversion (funded / applications) among the 54 districts over 25,000
  students: Austin 20.8%, rank 50 of 54; Houston 27.1%, rank 34; Fort Worth
  36.7%, rank 16. This is the slide's third beat.
- Take-up rank on funded participants per 1,000, same 54 districts: Fort Worth
  26.1 (4th), Northside 23.1 (7th), Houston 19.7 (16th), Dallas 19.7 (17th),
  Austin 14.8 (28th), Cypress-Fairbanks 13.9 (31st), Katy 12.1 (41st).
- Statewide funnel: 274,183 applications, 102,037 awarded as of June 9 with
  144,744 waitlisted, 80,181 funded participants across the 335 districts the
  file lists.
- Correlations computed on 181 non-charter districts over 5,000 students with a
  2025-26 accountability row: take-up against district accountability score
  r = -0.23, against economically disadvantaged share r = -0.04. Both are weak,
  cross-sectional, Year 1, uncontrolled. Do not put a causal reading on stage.

Caveats that bound what this slide may claim:

- The district on a TEFA row is where the student lives, the public campus they
  would otherwise attend. A student already in private school in 2025-26 still
  counts against their zoned district, so these rates are voucher users per
  public student in the boundary, not an exit rate off a district roster.
- Application, award and funded participation are three different things five
  months apart. Whichever goes on stage gets labeled.
- Both snapshots predate the 2026-27 school year, so funded counts kept rising
  after July 29. The denominator is 2025-26 enrollment, the year before the
  accounts are used, because 2026-27 enrollment does not exist yet.
- TEFA files carry no CDN, only parent-reported district names, so every join
  is by name. Austin and Houston are unambiguous and far above the 30-student
  suppression floor. Name matching does break elsewhere: Northside's
  name-matched aggregate (25.3 per 1,000) collides with a duplicate TEA
  district name, and the CDN-explicit figure for 015915 is 23.1.
- All three district files suppress under 30, so 560 districts with at least
  one participant are missing entirely. Statewide rates computed off these
  files understate, and the correlation sample is selected toward higher
  take-up.
- Prior enrollment (`tefa/applications-by-prior-enrollment`, two rows, exact
  counts): 202,397 of 274,183 Year 1 applicants were already in private school
  or homeschooled, 71,786 came from a Texas public school. 73.8% and 26.2%.
  This is statewide and has no district breakdown, so there is no Austin or
  Houston version of it; the slide labels the bar "statewide applicants".
- No TEFA dataset in the catalog carries funding amounts or program cost.
- `tefa/applicant-demographics` reports 77% private school / 23%
  homeschool-other for educational setting, but its own metadata contradicts
  itself on whether that is prior setting or 2026-27 destination. Unusable on
  stage without checking the source PDF.

FLAG: the June deck showed the application pair alone, unlabeled, under the
headline "The demand to leave is identical," and its third beat said vouchers
turned that demand into an exit. The July participation data does not support
that for Austin: four of five Austin applicants did not end up with a funded
account, 1,020 students is 1.5% of Austin's enrollment, and Austin lost 3,198
students in 2025-26 with no TEFA money in the system at all. The slide now
claims the parity at application and the divergence at funding.

## Slide 27: Prepare your campus (`data/29-prepare.ts`)

The four points are speaker guidance (FLAG: founder-reported), not figures.
Each rests on Houston evidence, checked 2026-09-19:

- Point 1 (PTA surplus): the card's "librarians to zero within a year" is Slide 12's
  own figure (`data/13-nes-timeline.ts`, thirdLabel Librarians, 0). No verified HISD
  case of a PTO funding a librarian, counselor, or arts position after the NES cuts
  was found, and no dollar figures; the point is framed as preparation, not as a
  tactic Houston proved. A "West University Elementary PTO ~$1M in assets" figure
  surfaced in search summaries with no primary source. Do not put it on stage.
- Point 2 (staff cannot be the front line): 117 of ~242 HISD principals put on
  improvement-or-out lists (Houston Public Media, 2024-05-24,
  houstonpublicmedia.org/articles/news/education-news/hisd/2024/05/24/488492/);
  a former principal's $3M suit against Miles (Houston Chronicle,
  houstonchronicle.com/news/houston-texas/education/hisd/article/jessica-berry-files-complaint-district-20290264.php).
  An HISD-employee parent was fired after criticizing Miles on video (Houston
  Chronicle, houstonchronicle.com/news/houston-texas/education/hisd/article/mother-terminated-after-mike-miles-airport-21094198.php),
  which is why the card says "parents who are not district employees".
- Point 3 (all campuses): `CAMPUS_COUNT` is Slide 8's count (`data/07-waffle.ts`, all
  four tiers summed), 102 open campuses since 2026-10-03. Before that the sum left
  out the nine-campus tier and rendered 105, not the 114 its comment claimed.
  The board of managers replaces the elected board district-wide (Slide 6 sources).
  "Wealthy campuses leaned on AISD to fix poverty campuses" is the speaker's reading
  of Slide 10's eco-dis-to-rating pattern, not a sourced claim.
- Point 4 (the levers that moved Houston): bond defeat 58-42, Nov 2024 (Slide 25's
  source, houstonpublicmedia.org/articles/news/education-news/hisd/2024/11/05/504770/);
  HFT injunction against the evaluation rollout (abc13.com/hisd-lawsuit-houston-federation-of-teachers-superintendent-mike-miles-school-district-sued/13722116/);
  records request showing about two-thirds of 2023-24 terminated teachers were Black,
  filed as an OCR complaint (houstonchronicle.com/news/houston-texas/education/hisd/article/houston-education-union-civil-rights-complaint-19760381.php);
  records on Miles' outside charter pay (houstonchronicle.com/news/houston-texas/education/hisd/article/advisory-agreement-terminated-state-law-22230156.php).
  "Rallies and petitions changed nothing": 7,500+ signatures, a ~900-person City Hall
  rally, and repeated board disruptions left Miles in place (texasmonthly.com/news-politics/houston-isd-mike-milkes-ruth-kravetz/).

## Slide 28: Join KASI (`data/29-prepare.ts`)

- Keep Austin Schools Independent, districtwide nonpartisan
  coalition, launched at an Eastside Early College HS press conference 2026-08-13
  (Community Impact). Site joinkasi.org, accessed 2026-09-19; its "Sign the Petition
  and Stay Updated" form is the newsletter step. QR and StoryLink target
  https://joinkasi.org/. The grid is Slide 27's 114 campuses gathering into the card.

Research checked, not put on Slides 27 or 28: the Feb 2025 CVPE sickout (8.75% absence,
attendance-funded budget lever) and enrollment exit as protest, which Miles later
used to justify closing 12 schools in 2026-27
(houstonpublicmedia.org/articles/education/2026/02/12/543326/hisd-school-closures-houston/).

## Slide 30: Closing

- No new figures beyond Slides 3 and 6 (fifth F confirmed, December 11 final ratings,
  parent-petition option). "December" became "December 11" on 2026-10-03.

## Numbers refresh (2026-09-16)

| Item | Old | New | Provenance |
|---|---|---|---|
| Cover lede | "Three middle schools are one F away" (projection) | "Burnet and Webb crossed the fifth-F threshold in August. Dobie escaped with a D." | Statesman/KXAN, accessed 2026-09-16 |
| Cover byline month | June 2026 | September 2026 | deck decision |
| `slides.md` `info:` | "modeled on the Houston ISD takeover trajectory" (forward-looking) | states the fifth F as fact | deck decision |
| Slide 3 headline | "Three schools. Four F's. One more triggers it." | "Burnet and Webb crossed the fifth-F threshold. Dobie escaped." | Statesman/KXAN |
| Slide 3 stat 1 | 4 consecutive F ratings | 2 campuses crossed the trigger | Statesman/KXAN |
| Slide 3 stat 2 | 3 campuses at the brink | 1 campus escaped with a D | Statesman/KXAN |
| Slide 3 stat 4 | 34 campuses 3+ yrs D/F (2022-23 to 2024-25) | 36 campuses gained a letter grade; D/F 41 -> 31; 20 still rated F, all 2025-26 | tea/accountability-summary, queried 2026-09-16 |
| Slide 5 chart series | "(est.)" dashed projection for 2025-26, all three campuses | Solid actual points: Burnet 59, Webb 58, Dobie 62 | tea/accountability-summary, queried 2026-09-16 |
| Slide 5 chrome title | "2026 STAAR gains likely aren't enough to escape the F zone" | "Burnet and Webb crossed the F line for a fifth year." | reflects actual outcome |
| Slide 6 body | "The district is appealing. If the appeal fails... commissioner can announce a board of managers as early as November 2026." | "Burnet and Webb crossed the fifth F on August 13... Ratings go final in December... the commissioner decides what follows." | Texas Tribune/KXAN, accessed 2026-09-16 |
| Slide 6 bullets | 5 bullets incl. "TEA dissolves the elected board" | 4 bullets incl. new parent-petition bullet | Austin Current/KUT, accessed 2026-09-16 |
| Slide 7 head/lede | "It's not just three schools" | "It's not just two schools"; card carries 36-gained-a-grade / 41->31 D-F figures | tea/accountability-summary, queried 2026-09-16 |
| Slide 7 waffle key | "F every year (3)" / "The three you've heard about" | "2 crossed the fifth F" / "29 more rated D or F" / "83 C or better", all 2025-26 | tea/accountability-summary, queried 2026-09-16 |
| Slide 8 step 6 | "Fifth F confirmed," Aug 2026, `projected: true` | "Fifth F crosses the threshold," Aug 13 2026, `projected: false` | Statesman/KXAN |
| Slide 8 step 7-9 | "Board dissolved" (Jan 2027) / "The first hard year" (Fall 2027) / "The choice point" (2028-29) | "Petition window opens" (through Oct 15) / "Final ratings and the commissioner's call" (Dec 2026) / "What Austin could inherit" (2027-29, merged scenario) | Austin Current/KUT/Texas Tribune, accessed 2026-09-16; scenario math unchanged from blog |
| Slide 8 `clicks` | 8 | 9 | one new step added |
| Slide 9 tier | "One F from takeover" (all three campuses, one color) | "Crossed the fifth F" (Burnet/Webb, rose) vs. "Escaped with a D" (Dobie, cyan) | Statesman/KXAN |
| Slide 10 lede | "Austin is next in line" | "Austin crossed the same threshold in August" | Statesman/KXAN |
| Slide 30 headline/lede | "Austin's clock starts in five months" (forward-looking) | "Austin's fifth F already happened"; lede adds petition option | Statesman/KXAN/Austin Current/KUT |

## Refresh 2026-09-26

Queried via the opendata MCP on 2026-09-26.

**Nine campuses one F from the trigger.** `tea/accountability-summary`, district
227901, campus rows. TEA's file has no consecutive-count column, so the count is
derived by applying the slide-7 rule to each campus's ratings in order (2017-18,
2018-19, 2021-22, 2022-23 ... 2025-26): an F adds one, a D pauses, an A/B/C (or "Met
Standard") resets, a Not Rated year (COVID, SB 1365) pauses. FLAG: derived count. TEA's
"consecutive unacceptable counts" roadmap is the official source; this deck's count is
not TEA's.

```sql
SELECT campus_number, MIN(campus) AS campus,
  MAX(CASE WHEN school_year='2017-2018' THEN overall_rating END) AS y18,
  MAX(CASE WHEN school_year='2018-2019' THEN overall_rating END) AS y19,
  MAX(CASE WHEN school_year='2021-2022' THEN overall_rating END) AS y22,
  MAX(CASE WHEN school_year='2022-2023' THEN overall_rating END) AS y23,
  MAX(CASE WHEN school_year='2023-2024' THEN overall_rating END) AS y24,
  MAX(CASE WHEN school_year='2024-2025' THEN overall_rating END) AS y25,
  MAX(CASE WHEN school_year='2025-2026' THEN overall_rating END) AS y26,
  MAX(CASE WHEN school_year='2025-2026' THEN overall_score END) AS s26,
  MAX(CASE WHEN school_year='2025-2026' THEN number_of_students END) AS enroll26
FROM tea/accountability-summary
WHERE district_number = '227901' AND campus_number IS NOT NULL
GROUP BY 1
HAVING COUNT(CASE WHEN overall_rating IN ('D','F') AND school_year >= '2022-2023' THEN 1 END) >= 3
ORDER BY campus
```

| Campus | TEA number | 2017-18 | 18-19 | 21-22 | 22-23 | 23-24 | 24-25 | 25-26 | Count |
|---|---|---|---|---|---|---|---|---|---|
| Burnet MS | 227901046 | Met Standard | F | NR (SB 1365) | F | F | F | F 59 | 5, crossed |
| Webb MS | 227901053 | Met Standard | F | NR (SB 1365) | F | F | F | F 58 | 5, crossed |
| Barrington EL | 227901149 | Met Standard | F | NR (SB 1365) | D | F | F | F 59 | 4 |
| Dawson EL | 227901114 | Met Standard | B | C | F | F | F | F 58 | 4 |
| Dobie MS | 227901055 | Met Standard | F | NR (SB 1365) | F | F | F | D 62 | 4 (D paused it) |
| Linder EL | 227901160 | Met Standard | C | B | F | F | F | F 59 | 4 |
| Martin MS | 227901051 | Met Standard | F | C | F | F | F | F 53 | 4 |
| Oak Springs EL | 227901125 | Met Standard | B | NR (SB 1365) | F | F | F | F 59 | 4 |
| Paredes MS | 227901061 | Met Standard | D | NR (SB 1365) | F | F | F | F 51 | 4 |
| Pecan Springs EL | 227901129 | Met Standard | D | NR (SB 1365) | F | F | F | F 56 | 4 |
| Widen EL | 227901175 | Improvement Required | B | B | F | F | F | F 58 | 4 |

- **3 -> 9.** The same rule applied through 2024-25 puts exactly three campuses at
  four: Burnet, Webb and Dobie. Two of them (Burnet, Webb) crossed in 2025-26; Dobie's
  D held it at four. So "nine now, three last year".
- **2017-18 check.** Every campus above was "Met Standard" in 2017-18 except Widen
  ("Improvement Required"), whose 2018-19 B resets it. No pre-A-F year adds to any
  run, and the third-D clause changes no count (no run holds more than one D).
- **31 D/F.** 2 crossed + 9 one F away + 20 other D or F = the 31 D/F campuses in
  2025-26 (Slide 3). The 26 campuses D or F in each of 2023-24 to 2025-26 (waffle beat
  1) re-count from the same rows.

**Scatter additions (Slide 9).** Same definition as `data/09-scatter.ts`. Re-querying
the six existing at-four points (Dawson 32.4/40.5, Dobie 29.3/34.9, Linder 38.6/41.1,
Martin 25.8/28.8, Pecan Springs 40.3/34.7, Widen 35.9/47.7) reproduced them exactly
before the three new points were added.

```sql
SELECT campus_cdc, MIN(campus_name) AS campus,
  ROUND(100.0 * SUM(CASE WHEN administration='Spring 2025' THEN approaches_plus_count END)
    / SUM(CASE WHEN administration='Spring 2025' THEN tests_taken END), 1) AS x,
  ROUND(100.0 * SUM(CASE WHEN administration='Spring 2026' THEN approaches_plus_count END)
    / SUM(CASE WHEN administration='Spring 2026' THEN tests_taken END), 1) AS y
FROM "tea/staar-cambium-campus:all"
WHERE district = 'Austin ISD' AND language = 'English' AND subject <> 'Science'
  AND administration IN ('Spring 2025','Spring 2026')
  AND campus_cdc IN ('227901055','227901051','227901149','227901114','227901160',
                     '227901125','227901061','227901129','227901175')
GROUP BY campus_cdc ORDER BY campus
```

| Campus | x (Spring 2025) | y (Spring 2026) | enroll (2024-25) |
|---|---|---|---|
| Barrington EL | 47.9 | 50.4 | 405 |
| Oak Springs EL | 36.3 | 35.2 | 215 |
| Paredes MS | 42.0 | 42.1 | 635 |

`enroll` from `tea/accountability-summary` `number_of_students`, 2024-25, matching the
year the original 21 carry (Dobie 512, Webb 502, Widen 432 are all 2024-25 values);
2025-26 would be 307 / 213 / 593. Not plotted.

**Other fixes.**

| Slide | Old | New | Why |
|---|---|---|---|
| Slide 3 stat 2 | "1 campus escaped" (cyan) | "9 one F from the trigger" (amber) | a D pauses the count; it does not reset it |
| Slide 3 stat 4 hue | amber | slate | stat 2 is now amber, directly above it |
| Slide 3 beat 1 card | "Dobie escaped with a D." / "A 62 cleared the F line." | "Nine more are one F away." / "One more F in 2026-27 and each one crosses." | same |
| Slide 4 STAAR | "since 2018" (headline, zone label, card) | "since 2022" | Spring 2019: Burnet 42.7%, Dobie 41.7% |
| Slide 6 legal beat 1 body | "Only A, B, or C resets it. SB 1365." | "Dobie's D paused its count. Only A, B, or C resets it. SB 1365." | names the case |
| Slide 7 waffle | 3 tiers, 3 beats; "Burnet and Webb crossed. Dobie escaped." | 4 tiers, 4 beats; beat 2 "Burnet and Webb crossed.", beat 3 "Nine more are one F away." | nine at four |
| Slide 8 step 9 (data only) | "around 10,000 more students" | "around 7,000" | 69,074 - 62,100 = 6,974 |
| Slide 9 scatter | 21 points; "Escaped with a D" / "One year behind"; "Five campuses got worse." | 24 points; "One F from the trigger"; "Six campuses got worse." | three at-four campuses added; Oak Springs slipped |

## Refresh 2026-10-03

Queried via the opendata MCP on 2026-10-03. Facts follow the October update of
`blog/src/content/blog/aisd-takeover-houston-playbook.mdx` and
`plans/2026-10-03-aisd-takeover-update-packet.md`.

**The nine, as TEA now assigns them.** Six of the nine campuses at four closed for
2026-27, and TEA's August decision moved each one's record to the campus that took
its students (Austin Current, 2026-09-21,
https://austincurrent.org/2026/09/21/austin-austinisd-takeover-school-ratings-paredes-bailey/).
The counts are the closed schools' own histories (table in "Refresh 2026-09-26"); only
the campus carrying them changed. Receivers' own ratings:

```sql
SELECT campus_number, campus, overall_rating, overall_score,
  (SELECT overall_rating FROM tea/accountability-summary b
    WHERE b.campus_number = a.campus_number AND b.school_year = '2024-2025') AS r25
FROM tea/accountability-summary a
WHERE district_number = '227901' AND school_year = '2025-2026' AND campus_number IS NOT NULL
  AND campus_number IN ('227901059','227901186','227901176','227901044','227901105','227901174')
```

| Closed campus (2025-26) | Record now on | Receiver 2024-25 | Receiver 2025-26 |
|---|---|---|---|
| Paredes MS (F 51) | Bailey MS (227901059) | C | B 83 |
| Barrington EL (F 59) | Guerrero Thompson EL (227901186) | B | B 80 |
| Dawson EL (F 58) | Galindo EL (227901176) | C | B 80 |
| Martin MS (F 53) | Kealing MS (227901044) | A | A 90 |
| Oak Springs EL (F 59) | Blackshear EL (227901105) | C | C 72 |
| Widen EL (F 58) | Rodriguez EL (227901174) | D | B 82 |

Unchanged: Dobie (D 62), Linder (F 59), Pecan Springs (F 56), own records.

FLAG: TEA's rule as reported exempts an A or B receiver, yet Kealing (A in both
years) and Guerrero Thompson (B in both years) are on the reported list, as is
Bailey (B in 2025-26; C at the July 30 Paredes closure). The deck attributes the list
to TEA's assignment as the Austin Current reported it and does not assert why each
receiver qualified; TEA's letter would settle it.

**Closed-campus rule (Slide 6, new beat 2).** Effective August 16, 2026: closing a D-
or F-rated campus and sending most of its students to a C-, D- or F-rated campus
moves the closed school's count to the receiver (Austin Chronicle, 2026-08-13, austinchronicle.com/news/can-aisd-steer-clear-of-state-takeover/;
article's closed-campus paragraph). Bailey example: C (78) in 2024-25 when Paredes
closed July 30; B (83) in the ratings released August 13; still assigned Paredes'
four Fs (article; Austin Current 2026-09-21). 83 is `tea/accountability-summary`,
227901059, 2025-26. Legal slide clicks 3 -> 4.
Revised 2026-10-03: the slide no longer says an A or B receiver wipes the
record, because TEA applied the transfer to Kealing (A) and Guerrero Thompson (B)
anyway (see FLAG above). The card now reads "Closing a school moves its count."
with Bailey (B, 83) and Kealing (A) as the examples.

**Waffle recompute (Slide 7).** Method: one square per campus open in 2026-27 that
carries a 2025-26 A-F rating, so a closed school's record is drawn once, on the
campus carrying it. Closed for 2026-27 among the 114 rated: the six above plus six
with retired campus numbers (Austin Current, 2026-09-21): Becker EL (A 90), Bedichek
MS (C 71), International HS (B 86), Ridgetop EL (A 93), Sunset Valley EL (A 91), Winn
Montessori (C 75). The other closures that article names (Graduation Prep x2, Phoenix
Academy, Travis County Day School) carry no 2025-26 A-F row.

```sql
WITH r AS (
  SELECT campus_number, MIN(campus) campus,
    MAX(CASE WHEN school_year='2023-2024' THEN overall_rating END) y24,
    MAX(CASE WHEN school_year='2024-2025' THEN overall_rating END) y25,
    MAX(CASE WHEN school_year='2025-2026' THEN overall_rating END) y26
  FROM tea/accountability-summary
  WHERE district_number='227901' AND campus_number IS NOT NULL GROUP BY 1
), t AS (
  SELECT *,
    campus_number IN ('227901149','227901114','227901051','227901125','227901061','227901175',
                      '227901104','227901054','227901029','227901133','227901158','227901157') AS closed,
    CASE WHEN campus_number IN ('227901046','227901053') THEN 'chronic'
         WHEN campus_number IN ('227901055','227901160','227901129','227901059','227901186',
                                '227901176','227901044','227901105','227901174') THEN 'atFour'
         WHEN y26 IN ('D','F') THEN 'dfOther' ELSE 'other' END AS tier
  FROM r WHERE y26 IN ('A','B','C','D','F')
)
SELECT closed, tier, COUNT(*) n,
  COUNT(CASE WHEN y26 IN ('D','F') THEN 1 END) df26,
  COUNT(CASE WHEN y24 IN ('D','F') AND y25 IN ('D','F') AND y26 IN ('D','F') THEN 1 END) df3yr
FROM t GROUP BY ROLLUP(closed, tier) ORDER BY 1,2
```

| | Squares | D/F 2025-26 | D/F three straight years |
|---|---|---|---|
| Crossed (Burnet, Webb) | 2 | 2 | 2 |
| At four (the nine carriers) | 9 | 3 | 3 |
| Other D or F | 20 | 20 | 15 |
| C or better | 71 | 0 | 0 |
| **Open total** | **102** | **25** | **20** |
| Closed (not drawn) | 12 | 6 | 6 |
| All rated | 114 | 31 | 26 |

25 open D/F matches the superintendent's "25 D/F schools" (Daily Texan, 2026-09-25).
`CAMPUS_COUNT` on the prepare and KASI slides follows the waffle (102). FLAG: the
closure list is the Austin Current's; TEA's file does not mark closures.

**Other changes.**

| Slide | Old | New | Source |
|---|---|---|---|
| Cover byline / `info:` | September 2026; Houston only | October 2026; adds Fort Worth's first six months | deck decision |
| 3 countdown, beat 1 body | "One more F in 2026-27 and each one crosses." | "Six carry the record of a school AISD closed." | Austin Current 2026-09-21 |
| 3 countdown, data comment | nine listed as the closed campuses; public "August 15" | nine as TEA assigns them; public August 14 | Austin Current; Texas Tribune 2026-08-14 |
| 6 legal | 4 steps; "Ratings go final December" | 5 steps (closed-campus rule); "December 11" | see above; Community Impact/KUT 2026-09-18 |
| 7 waffle | 114 squares, 2/9/20/83, nine = closed campuses | 102 squares, 2/9/20/71, nine = carriers | SQL above |
| 8 timeline step 7 | "AISD says it will not gather signatures" | Sept 15 "won't help", then "the only way" | KUT 9/15; Texas Tribune 9/24 |
| 8 timeline step 8 | "Dec 2026", "90-day review closes", "early December" | "Dec 11, 2026", "Appeal decided, ratings final", appeal filed, decision as early as January 2027 | KUT, Community Impact 2026-09-18 |
| 9 scatter | closed campuses named as at-four campuses | tooltip "(closed; record moved to X)", beat 1 body changed | Austin Current 2026-09-21 |
| 10 divider lede | Houston only | adds Fort Worth clause | Slide 18b |
| 18b Fort Worth | (none) | new four-beat slide | Slide 18b section |
| 22 funding, deficit row | "Deficit, 2026-27": -$105M / -$50M / -$25M | "Gen-fund deficit, 2024-25": -$100M / -$55M / -$312M | `tea/summarized-finance` FY2025, SQL in Slide 22 |
| 23 voucher | 4 beats, Houston and Austin | 5 beats; Fort Worth 26.1 per 1,000 (1,764) at beat 2 | TEFA participants; Texas Comptroller 2026-04-22 |
| 27 prepare | "All 105 campuses" (sum omitted the nine) | "All 102 campuses" | waffle |
| 30 close | "Ratings go final in December." | "Ratings go final December 11." | Community Impact/KUT |

Not done: the optional campus-map (Slide 9b) highlight of the six receivers. The
map's four beats are eco-dis and rating views; a receiver highlight would need a
fifth beat and a different story than the slide tells.

## Deck UX pass 2026-10-03

Copy changes from `plans/2026-10-03-aisd-deck-ux-plan.md`. No new source was
fetched; every figure below already sat in a data module or in this file, and
each is now computed in code rather than typed into a card.

| Slide (manifest, current numbering) | Old | New | Provenance |
|---|---|---|---|
| 8 legal, list labels | sentence-length labels that repeated the cards | "Trigger: five straight F's at one campus" / "Pause: a D holds the count" / "Transfer: a closed campus's count moves" / "Petition: families can ask for closure" / "Final: ratings on December 11" | Slide 6 sources above |
| 8 legal, cards | e.g. "Closing a school moves its count." | "The takeover covers the whole district." / "Dobie's D paused its count at four." / "Bailey earned a B (83), then got four Fs." (Kealing, rated A, got Martin's) / "The petition deadline is October 15." / "Then the commissioner decides." (as early as January 2027) | Slide 6 sources; Refresh 2026-10-03 receivers table |
| 10 AISD timeline | panel caption repeating each card | caption removed; date only; projected ticks drawn dotted | no figure changed |
| 11 scatter, beat 0 | lead equal to the headline | "17 of 24 scored higher in 2026." (`IMPROVED`, computed from `scatterPoints`) | Slide 9 section, 17 of 24 |
| 12 map headline | "the same map" wording | "Austin's ratings follow its poverty map." | Slide 9b section |
| 14 NES timeline | see "Slide 12: NES timeline" | | |
| 19 turnover, beat 0 | lead equal to the headline | "About 2,700 teachers left each year." / "Turnover rate times headcount: 2,351, 2,242, then 3,410 in 2024-25." `EXITS_BY_YEAR` in `data/18-turnover.ts`; 2,700 is their mean (2,668) rounded to the hundred | Slide 17 section (turnover x FTE) |
| 23 grade shift, beat 0 | lead equal to the headline | "1st grade shrank by nearly 10%." (`FIRST_GRADE_DROP`, from the module's 1st-grade value) | Slide 20 section |
| ~~25 recapture, beat 0~~ | ~~lead equal to the headline~~ | ~~"Austin raises the most from local taxes." / "Each departing student takes their funding with them."; beat 0 now highlights the local-tax row~~ | Superseded the same day by "Funding correction 2026-10-03" below: the card now reads "Austin keeps the most local revenue." and the row is "Local revenue kept". Beat 0 still highlights that row. |
| 26 voucher, all five cards | cards quoted figures the stage was not showing | each card names the figure on stage: Houston 19.7 funded per 1,000 from 72.7 applications; Austin 70.9 applied, 14.8 funded; Fort Worth 71.2 applied, 26.1 funded (award priority); Austin 20.8% conversion, 50th of 54; prior enrollment statewide only. `VOUCHER_APPS` and `AISD_CONVERSION` added to `data/25-voucher.ts` | Slide 23 section |
| 27 fought back, list labels | sentence labels repeating the cards | "The bond vote" / "The courts" / "The press" / "The calendar" | Slide 27 point 4 sources |
| 28 needle, labels and cards | labels repeated cards; card 0 had no figure | labels "Enrollment" / "Feeder patterns" / "District-wide organizing" / "Parent-led action"; card 0 body "NES campuses lost 10,350 students in two years; autonomous ones 1,918." (`nesLossCount`, `autoLossCount` in `data/28-needle.ts`); card 1 "Two dropped to C afterward." | article: NES vs autonomous enrollment figure (10,350 / 1,918, 2022-23 to 2024-25); Atherton EL and Sugar Grove Academy B -> C |
| 29 prepare, list labels | sentence labels repeating the cards | "PTA surplus" / "Parents, not staff" / "Every campus" / "Districtwide levers" | Slide 27 section |
| all pages | header comment only | trailing presenter-notes comment, `[click]` markers on multi-beat slides | backup figures in notes are drawn from this file and the article; nothing new |

## Funding correction 2026-10-03

The June deck valued each lost student at $13,300, AISD's FY2025 all-funds operating
revenue per enrolled student (`tea/summarized-finance`: $960,491,234 / 72,175 = $13,308).
Most of that does not move when a student leaves: property tax collections depend on
values and rates, golden-penny revenue stays in Austin, and federal grants run on lagged
formulas. What moves is the student's state formula entitlement. Every funding counter
was recomputed on that basis, holding FY2025 (2024-25) values constant across years, the
same simplification the old figure used. Verified by recomputation the same day.

**Formula.** Loss per departing average student = Tier One cost / enrolled + marginal
Tier Two per WADA x (WADA / enrolled). Inputs from TEA's Summary of Finances 2024-25
Final (TEA run dated 2026-05-29) via `tea/summary-of-finances`, AISD 227901, HISD 101912:

| Input (SOF line) | AISD | HISD |
|---|---|---|
| L5 WADA | 93,709.51 | 229,410.25 |
| L6 PEIMS enrollment | 72,272 | 176,727 |
| L9 / L10 M&O rate / compressed rate | 0.8275 / 0.6575 (17 enrichment pennies: 8 golden, 9 copper) | 0.7016 / 0.6516 (5 golden) |
| L43 Tier One cost | $582,942,368 | $1,420,445,215 |
| L45 ASF | $39,510,580 | $101,406,956 |
| L58 Local revenue in excess of entitlement | -$769,459,160 | -$49,122,872 |
| Tier One per enrolled | $8,066 | $8,038 |
| Marginal Tier Two per WADA | copper: 9 x $49.28 = $443.52 (golden pennies cost AISD nothing: its yield per penny beats the $126.21 guarantee and golden revenue is not recaptured) | golden state aid: 5 x $126.21 = $631.05 |
| WADA / enrolled | 1.2966 | 1.2981 |
| Tier Two per enrolled | $575 | $819 |
| **Formula entitlement per enrolled student** | **$8,640** | **$8,860** |

**Recapture.** AISD's local share at the compressed rate ($1.23B) is more than twice its
Tier One entitlement, so a departing student leaves collections unchanged and raises
recapture by the entitlement drop less the ASF payment that also stops: $8,640 - $547 =
$8,093 (in the year a student leaves the full $8,640 lands; the ASF drop follows a year
later because ASF runs on prior-year ADA). The deck says "about $8,000" (TEC 48.257; TEA
recapture one-pager, Feb 2025). AISD's own CFO numbers bracket the rate: "$26 million in
missed funding" for "over 3,000 students" (KUT, 2026-09-28) is $8,130 to $8,667 a student.

**Caveat on the trend.** Enrollment loss explains only about 8-11% of AISD's FY2025
recapture: 7,612 fewer enrolled students since FY2019 x $8,093 = $61.6M (8.0%), or by ADA
8,930 x $9,175 = $81.9M (10.6%), of $772M. Rising property values drove most of the
rest, and recapture fell in FY2024 ($901M -> $665M) while enrollment kept falling. The
deck never says recapture rises because students leave.

| Slide (manifest, file) | Item | Old | New |
|---|---|---|---|
| 10 AISD timeline (`data/08-timeline.ts`) | Funding Lost, steps 2/3/4 | $88M (-$88M) / $96M (-$8M) / $103M (-$7M) | $57M (-$57M) / $62M (-$5M) / $67M (-$5M) |
| 10 AISD timeline | Funding Lost, steps 5-8 | $146M (-$43M) | $95M (-$28M) |
| 10 AISD timeline | Funding Lost, step 9 scenario | $238M | $155M |
| 10 AISD timeline notes | per-student rate; scenario total | 13,300; 238 million | about 8,600; 155 million, 60 million of it from the 6,974 projected to leave |
| 14 NES timeline (`data/13-nes-timeline.ts`) | Funding Lost, steps 6 and 8 | $175M / $281M (at AISD's $13,300) | $117M / $187M (at HISD's $8,860) |
| 14 NES timeline card, notes | "per-pupil spending" | $8,566 vs $6,133 per pupil spent | base campus allocation per student |
| 25 recapture (`data/24-recapture.ts`) | row label | Local tax | Local revenue kept (same values) |
| 25 recapture card, beat 0 | lead / body | "Austin raises the most from local taxes." / "Each departing student takes their funding with them." | "Austin keeps the most local revenue." / "Every student Austin loses sends about $8,000 more of Austin's property tax to the state." |
| 28 needle notes | "40 percent per-pupil premium" | per-pupil premium | premium in base funding per student |

Counter arithmetic at $8,640: 6,648 -> $57.4M; 7,202 -> $62.2M; 7,760 -> $67.0M; 10,958 ->
$94.7M; 17,932 -> $154.9M; 6,974 -> $60.3M. At $8,860: 13,207 -> $117.0M; 21,122 ->
$187.1M. Prose rounds to "about $8,600" and "about $8,900"; the methodology figures stay
$8,640 and $8,860 so the counters reproduce.

Sources: TEA Summary of Finances 2024-25 Final (`tea/summary-of-finances`); TEA
Summarized PEIMS Financial Data FY2025 (`tea/summarized-finance`); TEC 48.257
(codes.findlaw.com/tx/education-code/educ-sect-48-257/); TEA excess local revenue
one-pager, Feb 2025
(tea.texas.gov/about-tea/state-funding/state-funding-manuals/excess-local-revenue-recapture-one-pager-feb2025.pdf);
KUT 2026-09-28
(kut.org/education/2026-09-28/austin-isds-budget-strains-as-enrollment-dips-transportation-spending-increases);
Houston Chronicle, NES base funding
(houstonchronicle.com/news/houston-texas/education/hisd/article/nes-pua-2025-breakdown-budget-per-student-20336980.php).

## Research checked, not incorporated

- **HISD 2025-26 ratings** (K12 Dive, Houston Public Media, accessed 2026-09-16): HISD
  held a district B for a second year; four elementary campuses newly rated F (up from
  zero the prior year); Phillis Wheatley HS earned an A. This deck's slides reference
  only HISD's 2022-23 through 2024-25 figures (unchanged, F count still correctly "0" as
  of 2024-25), so no slide was touched. Flagging here because a future refresh of the
  Houston-history slides should use this if HISD's 2025-26 figures become relevant.
- **Fort Worth ISD staffing** (Fort Worth Report, CBS Texas, accessed 2026-09-16):
  FWISD opened the 2026-27 school year August 10 with zero teacher vacancies, a
  significant improvement on the ~200-vacancy figure the June deck's era referenced.
  No slide in this deck states an FWISD vacancy count, so nothing needed correction.
- **Mike Miles / HISD takeover end date**: a Chron.com headline referenced Miles saying
  the takeover "could end soon," but the fetched page returned only a client-side error
  with no article text. Not used; no slide claims a specific HISD hand-back date beyond
  the June 2027 extension already cited in Slide 8 step 9's sources.

## Not found

- (Resolved 2026-10-03: AISD appealed both ratings before September 11, KUT and
  Community Impact, 2026-09-18.) Whether Austin ISD formally filed an appeal of the preliminary ratings by the
  September 11, 2026 deadline. Available reporting (Statesman, KXAN, Texas Tribune,
  Austin Current, KUT, all accessed 2026-09-16) states the deadline and that district
  leaders were reviewing the data to decide what to appeal, but none confirms a filing
  or outcome. No slide asserts that AISD did or did not appeal the ratings themselves
  (distinct from the SB 1882 partnership appeal, which is confirmed pending).
- (Partly resolved 2026-10-03: Segura says a decision could come as early as January
  2027, Community Impact 2026-09-18; still no TEA date.) A confirmed date for when the commissioner will act after December's final ratings.
  Reporting describes the 90-day review and December finality but not a specific
  post-December decision date; Slide 8's step 9 keeps this as an unresolved scenario
  rather than inventing a date.

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| "Three schools are one F away from triggering a state takeover" | Superseded: Burnet and Webb triggered it August 13, 2026; Dobie escaped. | Removed from cover, Slide 3, Slide 7, Slide 10 |
| 2025-26 accountability scores as a STAAR-based projection with a stated ±5-point uncertainty band (Dobie 58, Webb 58, Burnet 57 in the June deck's "(est.)" series) | TEA's published 2025-26 scores are Burnet 59, Webb 58, Dobie 62, all plotted from the dataset | Removed from Slide 5 |
| "D/F count fell from 48 to 25" and "35 campuses gained a letter grade" | Quoted from a superintendent statement via KXAN; TEA's campus ratings give 41 -> 31 and 36 | Replaced on Slides 3, 7 and 8 |
| "Dobie's score is not yet public" | TEA's 2026 ratings file publishes it: D, 62 | Removed from Slides 3, 5 and 7 |
| "The commissioner can announce a board of managers as early as November 2026" | Reporting places ratings finality in December, after AISD's appeal and a 90-day TEA review; no November action date is sourced | Removed from Slide 6 |
| "Austin's clock starts in five months" (implying the fifth F was still pending) | The fifth F is confirmed, not pending | Removed from Slide 30 |
| Single "One F from takeover" tier applied to Dobie, Webb, and Burnet alike | Only Burnet and Webb crossed the trigger; Dobie earned a D | Removed from Slide 9 |
| "Dobie escaped with a D" (and "Escaped with a D" as a tier) | Superseded 2026-09-26: a D pauses the count and does not reset it, so Dobie sits at four and an F in 2026-27 is its fifth | Removed from Slides 3, 7, 9; no other page carried it (grep, 2026-09-26) |
| "One year behind" scatter tier | Stale: Wooldridge (B) and Winn (C) reset; the tier is now "One F from the trigger" with all nine | Removed from Slide 9 |
| "Below 40% since 2018" on the STAAR slide | Spring 2019: Burnet 42.7%, Dobie 41.7% | Now "since 2022" (the chart's window) |
| "around 10,000 more students" (timeline step 9) | Contradicts the step's own 62,100 KPI: 69,074 - 62,100 = 6,974 | Now "around 7,000" |
| "AISD's 2026-27 adopted deficit is $105M" (Slide 22, and "-$50M / -$25M" beside it) | -$105M is how 2025-26 closed; 2026-27 needs $5.7M more in cuts. The three budget figures mixed years and bases | Replaced 2026-10-03 with FY2025 PEIMS (-$100M / -$55M / -$312M) |
| Barrington, Dawson, Martin, Oak Springs, Paredes, Widen as open campuses one F from the trigger | Closed for 2026-27; TEA moved each record to a receiving campus | Waffle names the carriers; scatter labels them closed (2026-10-03) |
| "AISD says it will not gather signatures" as AISD's current petition stance | Superseded Sept 24-28: Segura called the petition "the only way" for families | Removed from Slide 8 step 7 (2026-10-03) |
| "Ratings go final in early December" / "90-day review closes" | Final ratings are due December 11 | Replaced on Slides 6, 8, 30 (2026-10-03) |
| $13,300 per lost student (AISD timeline, NES timeline) | Total operating revenue per student, not the revenue that moves with a student; the formula entitlement is $8,640 (AISD) / $8,860 (HISD) | Replaced 2026-10-03 on Slides 10 and 14 |
| "Local tax" for the $14,197 / $11,182 / $8,306 row | The row is local revenue kept after recapture, including non-tax revenue; gross AISD collections are about $24,000 per pupil | Relabelled 2026-10-03 on Slide 24 |
| "Recapture keeps rising because students are leaving" | Enrollment explains about 8-11% of FY2025 recapture; recapture fell in FY2024 | Never on a slide; notes say not to claim it |


## Funding sequence addition (researched 2026-10-13)

Manifest slide 26 remains `24-recapture-squeeze.md`. New slides 27 and 28 are
`24b-houston-reserves.md` and `24c-austin-budget-risk.md`; the voucher slide and
all following pages move two positions later. Figures live in
`data/24b-takeover-finances.ts`. Existing section numbering elsewhere is historical.

### Slide 27: Houston spent down its financial cushion.

Primary source: [HISD FY2025 audited financial report](https://www.houstonisd.org/fs/resource-manager/view/6d01b7e7-86bd-4d0c-a29f-27fddf1f509a),
linked from the [district controller](https://www.houstonisd.org/our-district/budget-financial-planning/controllers-office).
Checked the official PDF and the [Tribune-hosted copy](https://www.texastribune.org/wp-content/uploads/2026/09/101912a2025v2.pdf).
The latter's PDF pages 128 (General Fund Balances), 41 (governmental fund operating
statement) and 95 (General Fund Budget and Actual) reproduce the figures below.

| Measure | Value | Basis |
|---|---|---|
| Total general-fund balance, June 2023 | $1,127,068,920 | FY2025 statistical table, FY2023 column; first fiscal year-end after June 2023 takeover |
| Total general-fund balance, June 2024 | $1,047,196,700 | Same table, FY2024 |
| Total general-fund balance, June 2025 | $748,088,314 | Same table, FY2025 |
| Two-year decline | $378,980,606, displayed $379M | First balance minus last; not an annual deficit |
| FY2025 general-fund revenue | $1,940,386,056 | Audited statement |
| FY2025 general-fund expenditures | $2,250,964,487 | Audited statement |
| FY2025 deficit before other financing | $310,578,431, displayed $311M | Expenditures minus revenue |
| FY2025 net balance decrease | $299,108,386 (notes only) | Deficit after $11,470,045 net other financing sources |

Balances include nonspendable, restricted, committed, assigned and unassigned
amounts; they are not all unrestricted cash. The preceding comparison's $312M
is the already-verified TEA PEIMS operating deficit ($311.8M), a different reporting
basis. Do not silently equate it to the audited $310.578M or a net balance change.

[Texas Tribune, Sept. 21, 2026](https://www.texastribune.org/2026/09/21/houston-isd-state-takeover-sustainability/):
- Estimates $190M in cumulative formula-funding losses from enrollment decline
  over the first three takeover years. Attributed estimate, not a causal finding
  that all lost students departed because of takeover.
- Reports 2026 campus allocations of $8,500 per NES pupil versus $6,300 elsewhere:
  $2,200 premium. These are campus allocations, not districtwide spending per pupil.
- Reports recurring reform costs and pandemic-aid expiration, alongside enrollment
  pressure. No allocation of the audited deficit to individual causes is established.
- Its nearly $450M reserve-drawdown claim is not substituted for the $379M change
  in audited total general-fund balance; its reserve basis does not reconcile to
  that measure. No unsupported reconciliation is invented.

### Slide 28: Austin would enter with little financial room.

[KUT / Austin Current, Sept. 28, 2026](https://www.kut.org/education/2026-09-28/austin-isds-budget-strains-as-enrollment-dips-transportation-spending-increases),
reporting district staff's September 24 presentation:

| Measure | Value | Qualification |
|---|---|---|
| FY2026 year-end deficit | $105M | Reported close / unaudited estimate, not FY2027 adopted deficit |
| Planned October cash-flow borrowing | $140M | Payroll bridge through November, repayment after January taxes; not operating deficit |
| Further FY2027 reductions needed | $5.7M | September estimate to avoid deficit after prior cuts |
| Enrollment-related revenue risk | $14.8M | Initial estimate, before daily-attendance adjustments; not added to cuts figure |

[AISD June 15 budget update](https://www.austinisd.org/announcements/2026/06/15/update-our-budget-en-espanol)
provides primary corroboration that reserves were projected at 10%, versus the
usual 20% policy target, and cuts and short-term borrowing were already needed.
Those June projections are not used as the latest dollar figures.

[Austin Current / Texas Tribune, Oct. 12, 2026](https://www.texastribune.org/2026/10/12/austin-isd-state-takeover-costs/)
corroborates $105M and $140M and quotes TEA's spokesperson confirming no extra
funding specifically for intervention costs. The final click is explicitly a
conditional risk: further departures would lower formula funding and increase
pressure for cuts. It is not a prediction of how many students would leave or
what specific cuts TEA would make. For AISD, formula entitlement and recapture
are the relevant mechanism; see Funding correction 2026-10-03 above.

### Rejected funding framings

| Claim | Why it is not used |
|---|---|
| HISD went from a $300M annual surplus to a $300M deficit | Unverified opening surplus; mixes accumulated reserves with annual flows |
| HISD exhausted its reserves | June 2025 audited total general-fund balance remained positive at $748M |
| AISD currently has a $181M adopted deficit | Spring pre-cut gap, superseded by adopted reductions and later updates |
| Takeover will necessarily accelerate AISD departures or require specific immediate cuts | Future outcome; stated as risk and funding pressure, not certainty |

## Slides 11–12: hover-card utilization estimates (2026-10-15)

- OpenData MCP queried `tea/accountability-summary:campuses` and `austin-isd/campus-utilization`. Exact paginated queries and returned rows are saved in `data/campus-enrollment-snapshot.json` and `data/campus-capacity-snapshot.json` (LIMIT 60, OFFSET 0/60/120).
- Comparison: school year 2017–2018 through 2025–2026, the latest year confirmed by OpenData MCP. This supersedes the earlier FY2025 endpoint at the user’s request. Enrollment comes from TEA `number_of_students`, not the separate AISD utilization percentage or projected enrollment.
- Join: restrict TEA to district 227901, then match the last three campus-number digits to AISD campus_id. Source names were reviewed against the 114 hover-card records. AISD's two source-sheet rows are consolidated per campus; only the capacity-bearing row supplies the denominator.
- Estimate = 100 × TEA enrollment / published permanent capacity, with that same capacity held fixed for both endpoints. Change = 100 × (2025–26 enrollment − 2017–18 enrollment) / capacity, in percentage points. Enrollment change is also shown as a student count. Round only display values; compute change from unrounded inputs.
- Example: Pillow has 514 students in 2017–18, 275 in 2025–26, and 488 permanent seats: 105.3% → 56.4%, −49.0 pp, −239 students.
- This is a constant-capacity estimate, not measured historical utilization. OpenData provides no FY2018 capacity history, and additions, rebuilds, relocations, grade changes or program changes can affect comparability. The cards explicitly say the same permanent seat count is assumed in both years. Published AISD utilization uses a different enrollment snapshot and is not mixed into this series.
- Missing endpoints/capacity show N/A. Blazier's source capacity combines campuses; individual TEA records 227901185 and 227901196 deliberately show no utilization estimate without a verified facility crosswalk. Historical enrollment remains visible. Receiving campuses retain their own enrollment and capacity, not the campus whose accountability history they inherit.
- Sources: https://tryopendata.ai/datasets/tea/accountability-summary and https://tryopendata.ai/datasets/austin-isd/campus-utilization .


## Slide 14: Fort Worth intervention dates clarified (2026-10-15)

Supersedes the earlier “six months” wording on the bridge and in deck metadata.

- October 23, 2025: TEA announced intent to appoint a board of managers. [TEA announcement](https://tea.texas.gov/about-tea/newsroom/texas-education-agency-appoints-board-managers-and-names-new-superintendent-lead-fort-worth-isd).
- February 5, 2026: final administrative order upheld TEA's intervention; the appointment letter states it could not be appealed.
- March 24, 2026: TEA appointed managers, suspended elected trustees' powers, and appointed the superintendent effective immediately. [TEA appointment letter, pp. 1–3](https://tea.texas.gov/health-safety-and-discipline/school-boards/school-governance/board-managers/fort-worth-isd-3-24-26-3.pdf).
- October 15, 2026: more than eight months since the final ruling and nearly seven months since board replacement. The first school year beginning under this board is 2026–27. The slide now uses the exact appointment date rather than an aging elapsed-month count.
- Bridge headline also distinguishes Houston's 2023 start of state governance from its earlier accountability trigger (see law-history provenance).

## Slide 15: chronological Houston timeline (2026-10-15)

Supersedes the eight-step timeline described above. Four states now show takeover / 2023–24 / 2024–25 / 2025–26, with one click advancing one period. Equal spacing denotes ordered school-year snapshots, not elapsed months.

- Read the local article `blog/src/content/blog/aisd-takeover-houston-playbook.mdx` and its `blog/src/components/takeover-timeline/TakeoverTimelineScroll.tsx` / `TakeoverTimelineViz.tsx` components. No new data retrieval; existing sourced series are reorganized.
- Enrollment remains 189,934 / 184,109 / 176,727 / 168,812 (`tea/student-enrollment`). The June 2023 state explicitly identifies its figures as the 2022–23 pre-NES baseline. Baseline change is derived by subtraction, ending at −21,122 students.
- NES campuses remain 0 / 85 / approximately 130 / approximately 130. First-year composition: 28 mandated plus 57 voluntary, selected by feeder patterns. Team Center conversions refer only to the 28 mandated campuses.
- The third KPI now consistently shows uncertified teachers: 2.9% / 12.1% / 21.2% / 21.3%, matching `data/16-uncertified.ts` and the article's `TakeoverTimelineViz.tsx` (TEA series, previously verified July 11).
- June 2024's 4,000+ employee departures are labeled as preceding year two; they are not a teacher-only count. Cost-cited freeze and abandoned 150-campus target come from the article's year-three account and existing timeline provenance.
- The article's pay/budget step mixes periods: the current component explicitly dates its campus allocation comparison to September 2026. Removed that standalone beat rather than assigning later budget evidence to 2023–24 or asserting pay caused opt-ins. Detailed classroom and staffing changes are retained in the relevant year's speaker notes.
- June 2027 is an extension horizon announced in June 2025, not a future data observation. It now appears as context within the final historical state; no future enrollment or guaranteed return of elected governance is implied. Source: https://www.texastribune.org/2025/06/02/texas-houston-isd-takeover-3/ .


### Slide 15 funding counter (2026-10-15)

Replaces the uncertified-teacher KPI in the four-state timeline. Annual funding reduction is derived in `data/13-nes-timeline.ts` as `(189934 − enrollment) × 8860`, using the existing FY2025 HISD formula entitlement rate documented under Funding correction 2026-10-03. Values: baseline $0; 2023–24 $51,609,500 (shown $52M); 2024–25 $117,014,020 ($117M); 2025–26 $187,140,920 ($187M). The panel labels the fixed FY2025 rate and 2022–23 enrollment baseline. These are annual estimates, not a cumulative sum, audited revenue changes, or losses causally attributed to takeover. Certification remains in the dedicated workforce slides.

## NES model — manifest slide 15 (added October 15, 2026)

Insertion shifts the Houston rollout timeline to slide 16 and all subsequent manifest positions by one. Existing numbered source sections retain their original identifiers; use their component/page names to resolve them.

- Component: `NesModelStage.vue`; qualitative provenance: `data/12b-nes-model.ts`.
- “Standardized teaching” is presenter framing of the centralized lesson model, not an HISD quotation. The opening card describes centralized lessons; it does not assert that teachers can customize them in practice. Speaker notes pose literacy and transfer beyond STAAR as evaluation questions; no causal efficacy claim is made.
- Narrative selection: `blog/src/content/blog/aisd-takeover-houston-playbook.mdx` and `blog/src/components/takeover-timeline/TakeoverTimelineScroll.tsx`.
- Central lessons, differentiated instruction, Teacher Apprentices, Learning Coaches, higher salaries: [HISD NES one-pager](https://resources.finalsite.net/images/v1750787237/houstonisdorg/n2iwp11jdkvpsherbx5j/HISD-NES-one-pager.pdf), verified October 15, 2026.
- Consistent instruction, checks and targeted support: [HISD NES overview](https://www.houstonisd.org/schools-academics/nes). The flow is schematic; no universal minute count or causal outcome is asserted.
- Library conversions and removed librarian roles at the original **28 mandatory** campuses: [AP reporting](https://apnews.com/article/bfad1e1033b47c3b47626e4ee85f84ac), also covered in the article's timeline. Scope does not extend to every NES school or all HISD libraries.
- Team Centers' learning support / classroom-removal functions: article and AP; HISD one-pager describes remote class participation for minor infractions. Speaker notes preserve this distinction.
- No salary amount or cross-year campus allocation comparison is used here. The following timeline owns rollout counts and funding estimates.


## NES practices and score interpretation — manifest slide 16 (October 16, 2026)

- Component: `NesReceptionStage.vue`; qualitative evidence: `data/12c-nes-reception.ts`.
- Teaching to STAAR: local article’s “Academic gains and their limits” section; KPRC Forest Brook classroom visit documents centralized slides, timed lessons and quizzes.
- Biology course changes: Texas Monthly reporting as summarized in the local MDX article. External page could not be fetched in this revision. Wording attributes the report and makes no claim of proven improper intent.
- Intensive monitoring: KPRC Fleming classroom visit documents cameras and timers; HISD’s January 18, 2024 board transcript describes regular spot observations. Exact URLs in the data module. No claim that every classroom has a camera.
- Counterevidence retained in speaker notes: local article’s elementary/middle-school gains; [The 74](https://www.the74million.org/article/houston-trumpets-historic-gains-from-schools-takeover-but-doubters-remain/) reports NAEP/MAP gains and White’s warning that alternate-assessment changes may be appropriate.
- No numerical claims or anonymous testimony on the slide. No finding that all gains are artificial or that literacy declined.
