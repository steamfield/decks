# Four-minute builds: data provenance

Status of every figure in this deck: **illustrative, fictional team**. The platform team, its CI
and its numbers are invented for the landing page's scripted agent session (RFC 0011). No real
team was measured. The figures live in two CSV files in this deck, the files the user hands the
agent in the session, and every slide reads them through `data/build-times.ts` and
`data/changes.ts`; no slide types a figure except in frontmatter `title`, which overview and the
outline show and which has to be a literal. Authored 2026-11-19.

## The two files

`data/build-times.csv`, one row per week:

```
week,median_minutes
1,14.0
2,14.3
3,13.8
4,9.2
5,8.9
6,9.0
7,6.1
8,5.8
9,6.0
10,4.2
11,3.9
12,4.0
```

Definition: the median duration, in minutes, of every CI build that week, on every branch.
Twelve consecutive weeks. No weeks are missing.

`data/changes.csv`, one row per change, in the order they shipped:

```
change,week_shipped,minutes_saved
Cached deps,4,5
Parallel tests,7,3
Smaller image,10,2
```

Definition: `week_shipped` is the first week the change was live for the whole week.
`minutes_saved` is the mean weekly median of the three weeks before it shipped minus the mean
of the three weeks from it on, rounded to whole minutes:

| Change | Weeks before (mean) | Weeks from it on (mean) | Difference | `minutes_saved` |
| --- | --- | --- | --- | --- |
| Cached deps | 1 to 3 (14.03) | 4 to 6 (9.03) | 5.00 | 5 |
| Parallel tests | 4 to 6 (9.03) | 7 to 9 (5.97) | 3.07 | 3 |
| Smaller image | 7 to 9 (5.97) | 10 to 12 (4.03) | 1.93 | 2 |

The three sum to exactly 10, the same as the drop from week 1 to week 12 rounded (14.0 to 4.0).
"Cached deps" is the dependency cache; the label is short so it fits `bar-board`'s label column.

## Slide 1 (`01-blank`): before the first slide

No factual claims. The footer (`layers/credit.tsx`) names the presenters and the occasion:
"Platform team", "Thursday all-hands", both from the brief.

## Slide 2 (`02-cover`): Our builds went from 14 minutes to 4.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `BEFORE` | 14 minutes | illustrative, fictional team | `build-times.csv` week 1, 14.0, rounded | 2026-11-19 |
| `AFTER` | 4 minutes | illustrative, fictional team | `build-times.csv` week 12, 4.0, rounded | 2026-11-19 |
| `WEEKS.length` (subtitle) | 12 weeks | illustrative, fictional team | row count of `build-times.csv` | 2026-11-19 |

`COVER_TITLE` is built from `BEFORE` and `AFTER` in `data/build-times.ts`.

## Slide 3 (`03-trend`): The median build fell 10 minutes in 12 weeks.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `WEEKS` (the bars) | 12 weekly medians, minutes, one decimal | illustrative, fictional team | every row of `build-times.csv` | 2026-11-19 |
| `DROP` (headline) | 10 minutes | illustrative, fictional team | `BEFORE - AFTER` = 14 - 4 | 2026-11-19 |
| Card, click 0: "Weeks 1 to 3: about 14 minutes" | weeks 1 to 3: 14.0, 14.3, 13.8 | illustrative, fictional team | the weeks before `Cached deps` shipped (week 4) | 2026-11-19 |
| Card, click 1: "cut it to 6" | 6 minutes | illustrative, fictional team | `BEFORE_LAST_CHANGE`: week 9, 6.0, the week before the last change | 2026-11-19 |
| Card, click 1: weeks 4 and 7 | weeks | illustrative, fictional team | `week_shipped` of the first two rows of `changes.csv` | 2026-11-19 |
| Card, click 2: "brought it to 4", week 10 | 4 minutes; week 10 | illustrative, fictional team | `AFTER`; `week_shipped` of `Smaller image` | 2026-11-19 |

The chart steps with `ChartSteps` at `at={1}`: click 0 shows weeks 1 to 3, click 1 weeks 1 to 9,
click 2 all 12 with weeks 10 to 12 accented. The splits come from `changes.csv`'s
`week_shipped`, so they move if the file changes. Bars are labelled to one decimal on a fixed
0 to 16 axis.

## Slide 4 (`04-stat`): A build now takes 4 minutes, down from 14.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `BEFORE`, `AFTER` | 14 and 4 minutes | illustrative, fictional team | as slide 2 | 2026-11-19 |
| "week 12" | the last week | illustrative, fictional team | `WEEKS.length` | 2026-11-19 |

## Slide 5 (`05-changes`): 3 changes took 10 minutes off every build.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `CHANGES` | 3 rows: label, week shipped, minutes saved | illustrative, fictional team | every row of `changes.csv` | 2026-11-19 |
| `TOTAL_SAVED` | 10 minutes | illustrative, fictional team | 5 + 3 + 2 | 2026-11-19 |

## Slide 6 (`06-close`) and slide 9 (`09-close-fitted`): Keep the build at 4 minutes.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `AFTER` (headline) | 4 minutes | illustrative, fictional team | as slide 2 | 2026-11-19 |

The bullets are the team's requests to colleagues, one per change, and carry no figures. Slide 6
is deliberately crowded: it holds the same message with each bullet's explanation on the slide,
so its fixed-height panel cuts the copy off and `decks inspect` reports it. Slide 9 is the
fitted version, with the explanations moved to its notes.

## Slide 7 (`07-reel`): Builds were slow, then flaky, then fast.

No figures. The lead "Builds were" and the words "slow.", "flaky.", "fast." are the user's
wording from the session's second prompt. The CSVs say nothing about flakiness; the word is the
speaker's characterisation, not a measured claim.

## Slide 8 (`08-saved`): Cached deps saved 5 of the 10 minutes.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `SAVED_ROWS` | 5, 3 and 2 minutes, largest first | illustrative, fictional team | `minutes_saved` of `changes.csv`, sorted descending | 2026-11-19 |
| `SAVED_HEADLINE` | 5 of 10 minutes | illustrative, fictional team | the leader's `minutes_saved` over `TOTAL_SAVED` | 2026-11-19 |
| Notes: "half of it" | 5 / 10 = 0.5 | illustrative, fictional team | the same two values | 2026-11-19 |

The source line names `data/changes.csv` and says the figures are illustrative.

## Banned on-slide content (checked)

| Claim | Why it is wrong | Correct source / value |
| --- | --- | --- |
| Any real company, team or person's build times | The team is fictional; the data is authored for the demo | the two CSVs, labelled illustrative |
| A failure or flake rate | Neither CSV has one | none |

## Refresh before the talk

| Pending item | What resolves it | Owner |
| --- | --- | --- |
| The frontmatter titles of slides 2, 3, 4, 5, 6, 8 and 9 type their figures | Retype them if either CSV changes | deck author |
