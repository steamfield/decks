# texas-2026: deck spec

This file is the build contract for every agent working on this deck. The claims, sources and qualifications come from `source-outline.md`, the author's 24-slide original. Its slide numbers are not this deck's.

The deck is a 20-minute story deck (14 slides, about 18.75 minutes of content) for Austin parents, teachers and residents who have no assumed knowledge of Texas government. It answers one question: how much can the new state government change for Austin ISD, and how fast? The middle of the talk turns on a second question: who signs the February order? Slide 7 asks it and slide 8 answers it.

The UX reference is `../opendata/talks/aisd-takeover`, for its beat pacing, dimming and view transitions. Its look is not the reference: this deck has its own design system (see "Design system" below).

## Rules every run follows

- Read the rules in the AGENTS.md Codex table for every file you touch: `deck-writing.md`, `prose-patterns.md`, `deck-patterns.md`, `story-stage.md`, `deck-data.md`.
- Story cards are 8 words of lead and 20 words of body, and `beats.test.ts` enforces it.
- Each slide has one claim headline, ending in a period.
- No em dashes.
- `clicks:` in `slides.md` equals the COPY length minus 1. The orchestrator owns `slides.md`. If your beat count differs from the table below, say so in your hand-off; don't edit `slides.md`.
- Nothing reads as a celebration or as partisan. Party names are always text labels as well as color. Red and blue mean party and nothing else: the `rose` slot is Republican red and the `violet` slot is Democratic blue, used only on marks that show which party holds a seat or office (the Senate chart on slides 8 and 11 first). Never use red or blue for risk, emphasis or decoration.
- No statute numbers or legal jargon on screen. Section numbers go in the presenter notes.
- Gloss "board of managers" once, as "a state-appointed board that replaces elected trustees".
- Write "most likely", not "working case".
- Spell out "recapture" in plain words the one time it appears.
- Name Commissioner Mike Morath on slide 4 ("appointed by the governor, confirmed by the Senate").
- Print the evidence status on the object as a small word: "Pending", "Reported date" or "Scenario". Line style reinforces it: dashed means pending, dotted or hatched means scenario. Never rely on a legend.
- Every figure comes from a `data/*.ts` constant that cites a row in `data-sources.md`. A figure with no row doesn't go on a slide.
- Presenter notes go in the page's HTML comment, one `[click]` paragraph per beat. Each is speakable in about 25 seconds and carries the qualifications from `source-outline.md`.
- The pacing comes from the AISD deck:
  - each beat changes one thing;
  - earlier items dim to the `design.ts` dim level, about 0.55;
  - durations come only from `DUR`;
  - a beat's resting state is set before its `beat(n)` label, so seeking is exact in both directions.

## Prose audit (every run, every visible string)

The author has flagged AI-sounding prose in earlier drafts, so prose gets the same rigor as code. Before writing any headline, card, chip, label or note, read these in full:

- `.claude/rules/deck-writing.md`: the slide-prose rules. Where the others disagree with it, it wins.
- `.claude/rules/prose-patterns.md`.
- The `ce:writer` skill: `$HOME/.claude/plugins/cache/claude-essentials/ce/<newest>/skills/writer/SKILL.md`, its `references/forbidden-patterns.md`, and `references/educator.md`, the persona for explaining government to a lay audience.

Check each string against these tells and rewrite any that match:

- Balanced antithesis or seesaw pairs ("X is easy; Y is hard", "A rose; B fell", "can push, but can't rewrite"). Two facts can share a sentence when both are facts. They can't be arranged as a rhetorical mirror.
- Negation-then-assertion, and trailing contrasts ("..., not X", "but not the Senate" used for drama).
- Characterizing instead of stating ("the best result the ballot allowed", "sits between relief and Houston", "the handover of power", "runs straight through"). Say the fact: which office, which date, which number.
- Abstract nouns standing in for facts ("relief", "power", "change", "leadership"). Name the office, the person, the vote or the dollar figure.
- Triads, false ranges ("between X and Y"), unearned profundity, rhetorical questions answered at once (the cover's question is the one allowed question), and section-ending kickers.
- Cards that describe the visual ("A thin ring directs attention") rather than the content.
- Ledes or notes that restate the headline, and recap openers in notes ("Tonight we'll look at...").
- Em dashes, and inflated or literary vocabulary.

Every hand-off includes a prose audit table. It has one row per visible string (headline, each card lead and body, chips, tags, axis labels) and three columns: the string, the patterns checked, and what was changed. The orchestrator re-audits every string before merging.

## Design system: "Ballot and chalk"

The full token map is `DESIGN.md`, which the design run writes. The essentials:

- The palette slots mean different things in this deck, so don't read them literally:
  - The `cyan` slot is school-bus yellow and means an office changed hands or new leadership.
  - The `amber` slot is a Capitol-granite clay and means AISD risk, a pending decision or a gap.
  - The `slate` slot is chalk grey and means the status quo or neutral structure.
  - The `rose` slot is Republican red and the `violet` slot is Democratic blue, both muted to sit in the chalk palette. They are used for party only.
- The canvas is a near-black chalkboard tint and text is chalk off-white.
- Headlines are set in the serif, `--od-font-serif`. Everything else uses the sans (Public Sans). Figures use tabular numerals.
- Marks are ballot ovals: filled means won or holds, empty means not won, hatched means scenario. Data marks are sharp, with 0–2 px radius. Cards and chips use `--tx-radius-card`. There are no shadows and no glows. Pings are a single thin ring.
- The headline sits top-left: one line of about 50 characters or fewer, two lines at most, with no qualifiers (qualifiers go in the card body or the notes). The card is anchored bottom-left. The visualization uses the full frame width above the card's top edge and beside it, on a shared chalk baseline in the lower third (`--tx-baseline-y`). Never leave the left third empty, and never float labels in it: a label sits on the mark it describes.
- No values are hardcoded:
  - colors come from `ink()`, `theme` or `--od-*`;
  - shape and layout come from `var(--tx-*)` in `styles/tokens.css`;
  - JS-side numbers (dim level, oval size, gaps) come from `components/design.ts`.

  A grep for hex values, `px` radii or opacity literals in `components/*.vue` must come back empty.

## The arc

The author cut the Houston slide (row 12 below) on 2026-11-06; the deck runs 13 slides, and later slide numbers shift down by one.

| # | Page / stage | Headline (draft) | Beats | Min |
|---|---|---|---|---|
| 1 | `01-cover` / `StoryCover` + `BallotField` | Texas elected new leaders. What can they change for Austin's schools? | 1 | 0.5 |
| 2 | `02-power-board` / `PowerBoardStage` | Democrats won four statewide offices and the House. Republicans kept the Senate, 19 to 12. | 4 | 1.5 |
| 3 | `03-outcome-ladder` / `OutcomeLadderStage` | Democrats won every office that was within reach this year. | 5 | 1.5 |
| 4 | `04-rulebook` / `RulebookStage` | Lawmakers write school law. An appointed commissioner enforces it. | 3 | 1.25 |
| 5 | `05-two-campuses` / `TwoCampusesStage` | Two middle schools put the whole district's elected board at risk. | 3 | 1.25 |
| 6 | `06-trigger-tree` / `TriggerTreeStage` | After five failing ratings in a row, state law allows two outcomes. | 4 | 1.75 |
| 7 | `07-collision-timeline` / `CollisionTimelineStage` | Most of AISD's deadlines fall before the new governor takes office. | 6 | 2 |
| 8 | `08-senate-arc` / `SenateArcStage` | Confirming a new commissioner takes 21 Senate votes. Democrats hold 12. | 4 | 1.75 |
| 9 | `09-undo` / `UndoStage` | A new commissioner can replace takeover managers at once. Ending a takeover takes at least two years. | 3 | 1.25 |
| 10 | `10-tools` / `ToolsStage` | The governor can veto bills on her own. Changing school law takes both chambers. | 3 | 1.25 |
| 11 | `11-hb2` / `HB2Stage` | The Senate voted unanimously for $8.5B in school funding. Austin still had to cut its budget. | 3 | 1.5 |
| 12 | `12-houston` / `HoustonStage` | Houston's ratings rose after the 2023 takeover, and the district lost 21,000 students. | 2 | 1.25 |
| 13 | `13-futures` / `FuturesStage` | In the most likely case, the intervention goes ahead under friendlier state leadership. | 4 | 1.75 |
| 14 | `14-watch` / `WatchStage` | Five decisions due by June settle what the election changes for Austin. | 4 | 1.25 |

The draft headlines record the claim each slide makes. The wording is still a draft and must pass the prose audit below before it ships. A headline is a plain statement of fact a parent could repeat at dinner.

Every number in a headline is subject to `data-sources.md`. If research changes a figure, the headline changes with it.

## Cross-slide morphs

Only adjacent slides share a name. Both names already exist in `packages/decks/styles/story-frame.css`.

- `vt-power-board` (slide 2 to slide 3): a `StoryLayer` carrying the office tiles on slide 2 hands off to the ladder on slide 3. The won tiles stack into the ladder's lit rungs. The geometry matches at the hand-off.
- `vt-campus-pair` (slide 5 to slide 6): the two clay Burnet and Webb squares lift out of the waffle and become the tree's root node.

Between other slides, the deck's 340 ms fade override handles the transition. The headline and card cross-fade in place.

## Per-slide spec

1. **Cover.** A `StoryCover` with a deck-local `BallotField`: a column of faint office names (Governor, Lt. Governor, Attorney General, Comptroller, Texas House, Texas Senate), each with an empty oval. On the cover's settle, the four statewide ovals and the House oval fill in yellow one at a time. The Senate oval stays empty. The byline reads "Riley Hilliard · Austin · November 2026".

2. **Power board.**
   - Setup: seven office tiles (the six above plus the State Board of Education). Each shows the office, the holder's name or chamber split, and the party as text. All start grey.
   - Beat 1: Governor (Gina Hinojosa), Lt. Governor (Vikki Goodwin), Attorney General (Nathan Johnson) and Comptroller (Sarah Eckhardt) flip to yellow with an `easedStagger`, each oval filling.
   - Beat 2: the House flips.
   - Beat 3: the Senate holds, with an `InkPing` and "19 R · 12 D".
   - Beat 4: the SBOE tile turns dashed yellow, tagged "Pending: 8–7, District 8 recount".

3. **Outcome ladder** (what could have happened). Six cumulative rungs, bottom to top. Each rung's label carries its school lever:
   1. No change.
   2. Governor only: vetoes, appointments.
   3. Plus the House: school bills can start.
   4. Plus the Lt. Governor: sets the Senate's agenda.
   5. Plus AG, Comptroller and SBOE: school lawsuits, the voucher program's administration, curriculum.
   6. Plus a Senate majority: bills pass without Republican votes.

   The beats:
   - Beat 1: the rungs draw grey.
   - Beat 2: a cursor climbs and each rung fills yellow as it passes.
   - Beat 3: the cursor stops on rung 5 with a ping and a "2026 result" chip.
   - Beat 4: rung 6 is hatched and labelled with the research run's seat math, for example "Out of reach: only N of 31 seats were on the ballot". If the math does not make it impossible, write what it shows instead.
   - Beat 5: rungs 1 to 4 dim to show how much worse it could have gone.

   "Best" is relative to the public-school platform Hinojosa ran on, and the card or notes say so. The notes also say the ordering of rungs 2 to 5 is a judgment.

4. **Rulebook.** A chain that draws on entrance: Legislature writes the law, the Governor appoints the commissioner, the Senate confirms, TEA enforces, and the AISD elected board runs the schools. Beat 3 lights the commissioner node: "Mike Morath: appointed, not elected".

5. **Two campuses.**
   - Port from `examples/aisd-showcase/components/WaffleStage.vue` and `data/07-waffle.ts`. Copy the data with its provenance and cite `examples/aisd-showcase/data-sources.md`.
   - Beat 1: the campus grid reveals.
   - Beat 2: Burnet and Webb turn clay with an `InkPing`.
   - Beat 3: one "Elected school board" bar draws across the whole grid while the grid dims. The point is a campus trigger with a district consequence.
   - Slide 6's root node takes the pair through `vt-campus-pair`.

6. **Trigger tree.**
   - Beat 1: the root node arrives through the morph, and the first gate reads "If the appeals fail". It sits before the fork, so the parents' first question is answered first.
   - Beat 2: wires draw (`DRAW`) to two branches: "State-appointed board replaces elected trustees" and "Close the campus".
   - Beat 3: "Parent petition" and "Trustee request" arrive as Pending inputs to the fork.
   - Beat 4: a greyed side note reads "Monitor or conservator: not allowed after five years".
   - The headline says "failing ratings", not "F", unless research confirms all five were F.

7. **Collision timeline** (hero). This follows `AisdTimelineStage` in talks.
   - An `InkTimeline` runs November 2026 to February 2027 with three labelled rows: AISD/TEA, Governor, Commissioner.
   - `InkTimelineCursor` (in the addon after the Wave 1 port) glides one date per beat:
     - Beat 1: Nov 3, election.
     - Beat 2: Dec 1, petitions.
     - Beat 3: about Dec 10, appeals.
     - Beat 4: Dec 15, trustees.
     - Beat 5: Jan 19, inauguration. Only the Governor row turns yellow.
     - Beat 6: Feb 15, order deadline.
   - The Commissioner row stays grey throughout.
   - Reported dates are `projected` ticks with "Reported date".
   - The final card asks "Who signs the February order?"

8. **Senate arc.** A deck-local `SeatArc` draws 31 ballot-oval seats in a hemicycle. Both parties are drawn neutral (filled versus outlined), with text labels.
   - Beat 1: a majority line at 16.
   - Beat 2: a two-thirds line at 21, with the 9-seat gap glowing clay.
   - Beat 3 (answers slide 7): "Morath stays until a successor is confirmed."
   - Beat 4: "The Lt. Governor runs the Senate floor, unless senators vote that power away in January." Tagged Pending.
   - The notes cover the outline's art. IV §12, art. XV §9 and art. XVI §17 points, and the special-session story from its slide 19.

9. **Undo.** Two lanes.
   - Beat 1: "Replace the managers: the commissioner's call" fills almost at once.
   - Beat 2: "End the board early" begins to fill across a long rule.
   - Beat 3: the rule is labelled "Two acceptable ratings at the campus: at least two school years".

10. **Tools.** Cards sort into two columns.
    - Beat 1: "She can do alone": appointments without confirmation, vetoes, budget proposals, special-session agendas.
    - Beat 2: "Needs a bill": the five-year takeover rule, testing, school-funding formulas, vouchers.
    - Beat 3: the card says a bill must pass both the House and the Senate.

11. **HB 2 and Austin's gap.**
    - Beat 1: an `InkNumber` counts up to the HB 2 figure.
    - Beat 2: `SeatArc` returns with all 31 seats filled for the unanimous Senate vote. Import it from slide 8's component.
    - Beat 3: "Austin still faced a $181M gap and sends about $715M a year back to the state." The figures and the wording follow research ("pre-cut gap"; "recapture" in plain words).

12. **Houston.** Two coordinated small OpenChart panels: HISD enrollment, and the campus rating trend. Each has a 2023 takeover rule. The spec is fixed and per-beat emphasis is done with `:data-beat` CSS, the `EnrollmentStage` technique in talks, so the charts never re-animate. Beat 1 emphasizes ratings and beat 2 emphasizes enrollment. The notes say enrollment fell across many urban districts too. Neither panel claims causation.

13. **Futures.** Three columns, Best, Most likely and Worst, all in the Scenario style. One row per beat: leadership, intervention, finances, trust. The middle column brightens last. The notes say these are conditional scenarios, not probabilities.

14. **Watch and close.**
    - Beat 1: the slide-7 timeline returns, extended through June 2027.
    - Beat 2: five labelled ticks appear, each naming a decision and who makes it. They come from the outline's slide 24 list.
    - Beat 3: a neutral civic beat with the petition and board meeting dates from research.
    - Beat 4: the closing line, verbatim from `source-outline.md`, then the field collapses into an `OdQrCard` that links to the deck's sources.
