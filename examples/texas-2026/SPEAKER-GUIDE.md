# Speaker guide: Texas schools after the 2026 election

This guide is for anyone presenting this deck. Read it once, then run the deck in presenter view: every slide's notes explain what is on screen, give the background you need, script each click, and list the questions you are likely to get.

## The talk in one paragraph

The 2026 election put Democrats in four statewide offices and, on unofficial returns, in control of the Texas House. Republicans kept the Senate 19 to 12, which was the only better outcome on the ballot, and Democrats fell four seats short of it. Meanwhile two Austin middle schools, Burnet and Webb, have five failing ratings in a row, which by state law forces the education commissioner to either close them or replace Austin's elected school board. Parents petitioned to close the schools, so the most likely outcome keeps the elected board. If a takeover happens anyway, who runs it matters: a commissioner appointed by the new governor would likely work with the district, unlike Houston's takeover. The talk ends on the five decisions to watch and the December dates.

Audience: Austin parents, teachers and residents with no background in Texas government. Length: 9 slides, about 10.5 minutes at a normal speaking pace, plus questions.

## Running the deck

From the repo root:

```bash
bun install
bun run dev tx26
```

Open the deck at `http://localhost:3030` on the projector and the presenter view at `http://localhost:3030/presenter/` on your laptop. The presenter view shows the current slide, the next one, a timer, and the notes for the current click highlighted.

- Right arrow or space: next click. Left arrow: back one click. Each slide's animation steps forward on each click.
- Most slides have three to six clicks. The thin dashes at the bottom left show how many, and which one you are on.
- Backup: `bun run export tx26` writes `texas-2026.pdf` with every click as its own page. Bring it on a USB drive.
- Every slide has a source link in the bottom-right corner that opens the original document.

## Reading the slides

Three conventions run through the whole deck. Point them out once, on slide 2.

| On screen | Means |
|---|---|
| Yellow fill | An office changed hands in this election |
| Clay (muted orange) | Austin's risk: the two schools, a gap, a pending deadline |
| Blue and red dots | Democratic and Republican seats, used only on the Senate chart |
| Dashed border, "Pending" tag | Not final yet: certification, appeals, petitions, recounts |
| "Scenario" or "Most likely" tag | A judgment about the future, not a fact |

## Timing

| # | Slide | Clicks | Minutes |
|---|---|---|---|
| 1 | Cover: what can new leaders change? | 0 | 0.5 |
| 2 | Who won | 3 | 1.5 |
| 3 | Who controls Texas schools | 2 | 1 |
| 4 | Burnet and Webb | 2 | 1 |
| 5 | The December to February calendar | 5 | 2 |
| 6 | The Senate confirmation math | 3 | 1.25 |
| 7 | HB 2 and Austin's budget | 2 | 1.25 |
| 8 | Three paths for Austin | 2 | 1.25 |
| 9 | What to watch, and the close | 2 | 0.75 |

The 10-minute version hides four slides in `slides.md` (`hide: true`): what could have happened (`03-outcome-ladder`), the two legal choices (`06-trigger-tree`), changing versus ending a takeover (`09-undo`), and what the governor can do alone (`10-tools`). Remove the `hide` lines to restore the longer talk. Their key points survive elsewhere: slide 2's notes carry the Senate seat math, slide 4 names both remedies, slide 8 says a new commissioner can replace every manager, and slide 7's notes answer what the governor can do without the Senate.

If you are running long, skip the Senate-rules click on slide 6. Do not cut slide 5: slides 6 and 8 answer the question it ends on.

## Before you present

The facts were checked on November 6, 2026, and several were still moving. Within 24 hours of the talk, work through the "Refresh within 24 hours of the talk" checklist in `data-sources.md`. The items most likely to have changed:

- election certification, the final House count, and the State Board of Education District 8 recount;
- whether Burnet's and Webb's appeals succeeded (final ratings December 11);
- whether the petitions were validated by December 1, and the outcome of TEA's review of the Webb signature complaint;
- any school board request for a different remedy (due December 15);
- whether a new commissioner has been nominated or confirmed, and Senate vacancies;
- any special session or change to Senate rules.

If a fact changed, update its `data/*.ts` module and the matching row in `data-sources.md`; the slides read their numbers from those files.

## Staying even-handed

The audience will include people who voted both ways. A few habits keep the talk credible:

- State results as results ("Democrats won four statewide offices"), not as good or bad news.
- Say "pending" out loud whenever a slide shows the tag.
- "Most likely" on slide 8 is a judgment call. Say so; the notes give you the wording.
- When someone asks what a new official will do, answer with what the law lets them do, and point out the limits: the Senate, the courts, and the statute itself.

## Questions you will probably get

Each slide's notes end with the questions specific to it. The ones that come up across the talk:

- **Is AISD being taken over?** Not yet, and possibly not at all. The appeals could end it, and valid petitions would close two schools instead of replacing the board.
- **Can Hinojosa just fire Morath?** The removal rule is written for the governor who appointed him. Whether a new governor can use it is unresolved, and a replacement needs 21 Senate votes.
- **Why not count on the Legislature to change the takeover law?** Any change needs a bill through the Republican Senate. School funding has passed that Senate unanimously before; the takeover rule has not been tested.
- **Where do the numbers come from?** `data-sources.md` lists every figure with its source and the date it was checked.

## Where things live

| What | File |
|---|---|
| Speaker notes | `pages/*.md`, the comment after each slide's stage |
| Every figure and its source | `data/*.ts` and `data-sources.md` |
| Slide order and click counts | `slides.md` |
| The talk's original outline and source list | `source-outline.md` |
| Colors, fonts and other design settings | `DESIGN.md` |
