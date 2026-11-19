# RFC 0010: the motion-reel style as the kit's motion vocabulary

Status: Done. Merged to main in b0bb6d2 (2026-11-19). Revised after a product and UX review; the decisions it changed
are listed under "Review changes".

## Problem

The landing page's motion section plays `examples/motion-reel`, and that deck is the look
Decks should produce by default: headlines that rise through masks with a lean while their
tracking closes, colour plates that sweep in from one edge and out the other, beats that
overlap so a slide lands as one gesture, accents that overshoot once and settle. An agent
asked for "a motion slide like the landing demo" cannot get that look from the kit today.

The look lives in the deck, not the framework. `examples/motion-reel/components/` holds 777
lines of hand-written GSAP (`WordSwap`, `RiseLine`, `BarBoard`, `Rundown`, `NameTicker`,
`InstallLine`, `LogoSting`) on four curves the deck defines for itself in `ease.ts`. The 21
`MotionTemplate`s in `packages/kit/src/motion-templates/` were written earlier, in a plainer
dialect: every tween uses `ease.enter`, words rise without lean or tracking, and beats run in
sequence. Put a kit `title-reveal` next to the reel's `RiseLine` and the kit one looks
unfinished.

So there are two gaps. The first is vocabulary: the reel's curves, mask constants and overlap
habits are not tokens, so each new deck either reinvents them or falls back to the plain
dialect. The second is coverage: a few of the reel's moves (the swapping phrase, the bar
board, the command bar) are general enough to be templates, and a few motion-graphics staples
that fit this style are missing.

## Evidence

The motion-reel deck (commits `59b5b87` through `6727219`, 2026-11-18) was written by an
agent that had the kit available and still hand-built seven components, because no template
did what the slide needed. A follow-up commit went to a timing fix the kit would have owned
(`6727219`: bars started growing behind the wipe's edge).

A web survey of motion-graphics template sources (Envato, Motion Array and Storyblocks
packs; GSAP's plugins; Remotion's packages; Keynote; Flourish and Observable on animated
data) found this baseline: kinetic type with per-word or per-character reveals, lower
thirds, logo reveals, counters, bar, donut and line charts that build on, bar chart races,
scramble or decode text, and Magic Move between slides. Decks already has lower thirds, logo
reveals, counters, Magic Move, code morphs and shape morphs. Missing: scramble text, a donut
that builds, a line that draws, and a bar chart race. The survey's distinctive finds that fit
a click-driven data deck are the pinned chart whose state changes per beat (the NYT and
Pudding scrollytelling pattern) and the Rosling-style scatter that plays through time.

In this repo only `motion-showcase` (two slides), the reel and the `examples/motion` fixtures
use `MotionTemplate`; none of the real talks do. The restyle's risk is mostly to decks outside
the repo, which is why it ships with an opt-out.

## Design

### 1. Motion tokens grow a role vocabulary

`@react-decks/motion`'s `ease` gains the reel's four curves, named by role:

| Token | Curve (from `examples/motion-reel/components/ease.ts`) | Role |
| --- | --- | --- |
| `ease.snap` | `M0,0 C0.06,0.6 0.12,0.9 0.3,0.97 0.5,1 0.72,1 1,1` | Type arriving, and any tween that encodes a value: fast attack, long soft settle |
| `ease.punch` | `M0,0 C0.1,0.7 0.18,1.13 0.4,1.06 0.58,0.99 0.8,1 1,1` | An accent that encodes nothing: a plate, a marker, a label's scale. Overshoots about 13% once |
| `ease.leave` | `M0,0 C0.3,-0.06 0.62,0.18 1,1` | Something leaving: a small gather, then away |
| `ease.slam` | `0.76,0,0.24,1` | A plate or band crossing the canvas |

One rule goes with them: a tween that encodes a value (a bar's length, an arc's sweep, a
line's progress, a rank position, a counter's number) never uses `punch`. An overshooting bar
runs past its value while the axis is on screen, which a data talk cannot show. The reel's
`BarBoard` breaks this rule today and is fixed when it becomes a template.

`enter`, `exit`, `settle` and `draw` stay, so nothing outside the kit breaks. A `rise` token
carries the reel's two mask constants: `rise.clear` (135, the percentage of its own height a
word travels to clear its mask) and `rise.lean` (5, the degrees it arrives leaning). The
architecture's section 1.1 row for `gsap` changes to name the new tokens.

The opt-out: the role curves are named `CustomEase` registrations, so a deck that wants the
plain feel re-creates `snap`, `punch`, `leave` and `slam` with the plain curves in its
`setup.ts`. The guide documents that as four lines. A deck-level theme switch is not added.

### 2. One shared headline entrance

`rise-words`, a private kit function in `packages/kit/src/motion-templates/rise-words.ts`,
adds a heading's entrance to a timeline: masked words rise with a lean on `ease.snap`, and the
total stagger is capped with `amount` (as `title-reveal` does now) so a long title lands in
the same time as a short one. The tracking close runs only on a heading that cannot wrap
(`white-space: nowrap`); a wrapping heading rises without it, because changing letter-spacing
mid-entrance moves its line breaks frame by frame. Resting tracking stays at the theme's
headline value.

It is for headlines only. Callers: `title-reveal`, `section-wipe` and `end-card` (whose
titles now rise as a whole block; moving them to masked words is a new behaviour with new
split DOM, and their fixtures cover it), plus `word-swap`. `quote-card` keeps its word fade:
lean and tracking on a 25-word quote are hard to read. Deck authors copy a template, as the
guide already says, so `rise-words` stays private.

### 3. The 21 templates move to the vocabulary

Each template's tweens move to the role curves under the rule above, headlines use
`rise-words`, and beats overlap where they can: the next element starts before the previous
lands, never before the element it reveals is uncovered. Overlap is bounded by the guide's
existing ceiling: nothing still moving after about a second and a half, so a list of
staggered items uses a total `amount`, not a fixed per-item offset.

Props, beat counts and the DOM contract do not change, so no deck's clicks move. What changes
is how the motion looks, so the CHANGELOG entry says that looks change and clicks do not, and
screenshot baselines are regenerated (Linux baselines from the CI artifact, as `AGENTS.md`
says).

`title-reveal` draws its accent rule only when it has a subtitle. That lets it replace the
reel's `RiseLine` (a headline with nothing under it) rather than adding a second
headline-rise template.

### 4. New templates

Each joins `MotionTemplateProps`, `MOTION_TEMPLATE_BEATS` in core, the table in
`docs/guide/motion-templates.md`, and the shipped template sources, using the existing beat
kinds (`one`, `two`, `list`). Every text prop has a character limit in the props table, and
a string over it throws an error naming the string, as the existing templates do for empty
titles.

`accent` drives the one thing that should draw the eye. Everything else uses the theme's
neutral plate and text colours, so a single-accent deck never gets a rainbow.

Tier 1 comes from the reel:

| Template | Beats | What it does | Props |
| --- | --- | --- | --- |
| `word-swap` | list (`words`) | A fixed lead; the last phrase sits on a plate and swaps each click, the old plate lifting away as the next grows in from left. Plates take the theme's hues in order (skipping the accent), or the neutral surface with `tone="neutral"`; the last word's plate takes `accent` and lands on `punch` | `lead` (1 or 2 lines, up to 18 characters each), `words` (2 to 5, up to 16 characters each) |
| `bar-board` | two | A ranked board wipes across; bars grow one after another, overlapping, on `snap`, values counting beside them in the deck's number format; the next click turns the leader to `accent` and dims the rest | `rows` (`{ label, value }[]`, 2 to 6, sorted descending, labels up to 16 characters), `source`, `prefix?`, `suffix?` |
| `command-line` | one | A bar wipes across and a command types on into it | `command` (up to 48 characters) |

`bar-board` fixes what the reel's version gets away with on small integers: the axis uses
nice ticks (at most six) rather than a step of 5, values go through the kit's number
formatting rather than `Math.round`, a `prefix` exists for currency, and unsorted rows throw
naming the first row out of order, because the leader is the first row.

The reel keeps `LogoSting` (its identity), `NameTicker` (names bleed off both edges, so it
cannot carry a sponsor or contributor list, which is the main reason to show a wall of names)
and `Rundown` (its plate morphs among four shapes that mean something only in the reel;
`list-cascade`, `process-flow` and `agenda` already cover a list that steps per click).

Tier 2 fills baseline gaps:

| Template | Beats | What it does | Props |
| --- | --- | --- | --- |
| `scramble-text` | one | A word decodes from random glyphs into place, left to right, and settles | `text` (up to 16 characters), `label?` |
| `donut-build` | list (`segments`) | A ring draws one segment per click on `snap` while the centre counts the running total of the values | `segments` (`{ label, value }[]`, 2 to 5), `prefix?`, `suffix?` |

`scramble-text` needs GSAP's `ScrambleTextPlugin`, which ships with the installed gsap
3.15.1 and is not registered; `motion` registers and exports it beside the other four. Its
end pose for print, instant mode and a jump is always the real text.

A `list` template counts its clicks from a literal array. `donut-build`'s segments come from
`data/*.ts` under the `deck-data` rule, which the click counter cannot read, so its guide row
says to set `clicks:` in the frontmatter, as `ChartSteps` slides already do.

Tier 3 waits until tiers 1 and 2 have been used in a real deck, and each starts by checking
what `ChartSteps` already does:

- `line-draw` (a line strokes on, then an annotation pins to a point) and `bar-race` (ranked
  bars re-sort per period) both need axes, units and dates. `ChartSteps` over OpenChart
  already has those and morphs data between steps. Build them as templates only if
  `ChartSteps` cannot do the draw-on or the re-sort.
- `pinned-chart`: one chart whose highlight or filter changes per click while a caption
  swaps. Likely a guide recipe pairing `ChartSteps` with a caption, not a template.
- `scatter-play`: dots move through time steps with the period's label behind them. It needs
  a time-series row shape the `deck-data` skill can source.

### 5. When a chart template, when a chart

The guide says to leave templates out of dense data slides. With chart templates in the kit,
"Where a motion graphic fits" gets one rule: a chart template carries a single headline
comparison (one ranking, one share) that the slide's claim is about, with at most six rows and
no time axis. Anything with an axis over time, more rows, or several steps of evidence is a
sourced chart through `OpenChart` or `ChartSteps` and the `visualization` skill. Both read
their figures from `data/*.ts`.

### Out of the vocabulary on purpose

Glitch, liquid and particle reveals, motion blur, audiograms and cube transitions. They are
the stock After Effects look this style is set against, or they need a timeline the deck does
not have.

## Plan

1. Tokens. `ease.snap`, `ease.punch`, `ease.leave`, `ease.slam` and `rise` in
   `packages/motion/src/tokens.ts`; `ScrambleTextPlugin` registered and exported in
   `plugins.ts`; the exact `index.ts` lines in the contract. Done when: a motion dom test
   seeks a tween on each curve to its midpoint and reads the value `CustomEase` gives for that
   curve; a test shows a deck's `setup.ts` re-registration of `snap` changing a template's
   midpoint value; and the reel's `ease.ts` is replaced by imports.
2. `rise-words` and the restyle of the 21 templates. Done when: every template's existing dom
   tests pass unchanged; fixtures at each template's longest allowed content (a wrapping
   title, a long quote, a two-digit section number) are filmed per click with `decks film`
   and reviewed for reflow, clipped letters and masks that uncover late; the two
   `motion-showcase` slides that use a template are filmed against that deck's linocut look,
   and if they lose it, that deck takes the `setup.ts` opt-out; baselines are regenerated.
3. Tier 1 templates. Done when: each has dom tests per the template test pattern, including
   the thrown error for each limit; node's click counting has a row per template; and the
   reel uses `title-reveal`, `word-swap`, `bar-board` and `command-line` in place of
   `RiseLine`, `WordSwap`, `BarBoard` and `InstallLine`, with the landing recording
   regenerated.
4. Tier 2 templates. Done when: each has dom tests, a fixture slide in `examples/motion`, and
   an e2e spec that steps it forward and back with `settled()`.
5. Docs and skills: the template table, character limits and the chart rule in
   `docs/guide/motion-templates.md`; the curve roles, the value rule and the opt-out in
   `docs/guide/motion.md`; in the `deck-motion` skill, the template choice table and its
   "Avoid bounces" line rewritten as the value rule (an overshoot only on something that
   encodes no value). The reel's `TEMPLATES` list and its template-count slide follow the new
   count. A CHANGELOG entry for the look change.

## Interleavings to step through before the contract

- Back mid-swap on `word-swap`: the timeline seeks to the previous beat's end pose; the old
  plate is back at full width with its letters up. Every tween is a `fromTo` with
  `immediateRender: false` on exits, as the reel's is.
- Jump into a `donut-build` slide at click 3 from the overview: the pose for three segments
  shows with no animation and the centre reads their running total.
- Resize mid-entrance: everything is sized in canvas units, so the canvas fit scales it;
  nothing measures the viewport.
- Print and `?motion=instant`: every template renders its end pose for the click.
- Reduced motion mid-talk: `data-deck-motion` flips to `instant` and the current slide shows
  its pose.

## Scope

Out of scope: a second named motion style or a theme-level motion switch (the `setup.ts`
opt-out covers it), tier 3 until tiers 1 and 2 have been used, and any change to slide
transitions.

## Verification

A fresh agent with only the published package and the plugin's skills gets slide requests in
a speaker's words, each run three times: "we used to ship quarterly, now we ship weekly, then
daily", "which region grew fastest last year", "how to install it", "what share of our
traffic is mobile", and "revenue by month for the last two years". A pass is any defensible
choice with no hand-written GSAP; the last request passes only as a sourced `ChartSteps` or
`OpenChart` chart, not a template. The same set runs once more against a plain data-talk
theme (one accent, a serif headline font). Every resulting slide is filmed per click with
`decks film` and reviewed for overshoot on a value, reflow mid-entrance, letters cut by a
mask, and anything still moving past about a second and a half.

## Review changes

A product and UX review on 2026-11-19 changed these from the first draft: `punch` no longer
touches values, and the skill's "Avoid bounces" line becomes that rule; `rise-words` is for
headlines only, drops the tracking close on wrapping text and caps its stagger; `quote-card`
keeps its word fade; the restyle gets a `setup.ts` opt-out and a CHANGELOG entry;
`rise-line` folds into `title-reveal`; `rundown` and `name-ticker` stay in the reel, and the
new `steps` beat kind is dropped with them; `bar-board` gets nice ticks, number formatting, a
prefix and sorted-input validation; every text prop gets a character limit; `accent` drives
one element per template; `line-draw` and `bar-race` move to tier 3 behind a check against
`ChartSteps`; the guide gets a chart-template rule; overlap stays within the 1.5-second
ceiling; and verification uses neutral prompts, repeated runs, a plain theme, a negative
case and `decks film`.

## Open questions

1. Restyle the 21 existing templates with the opt-out (recommended), or ship the reel style
   as a second set and leave the old ones? Two sets double the tests and leave agents
   choosing between dialects.
2. Name the curves by the reel's words (`snap`, `punch`, `leave`, `slam`, recommended: short,
   and the reel's comments already explain them) or by function (`arrive`, `accent`,
   `depart`, `sweep`)?
3. `title-reveal` drawing its rule only with a subtitle changes the look of any existing
   `title-reveal` without one. Accept that (recommended, it is one template and the rule
   under a lone headline is the plain dialect's habit), or add a `rule` prop?
