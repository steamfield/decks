# Motion templates

`MotionTemplate` from `@steamfield/decks/kit` is a ready-made motion graphic: choose a
`template`, write its words, and it takes colour, type and timing from the deck theme and
motion tokens. Optional `at` sets the click its entrance plays on (0, the default, plays it
on arrival) and `accent` picks a theme hue. Each template's source ships in the package at
`docs/motion-templates/<name>.tsx`; read one before writing custom motion with
`useTimeline` (see [motion-graphics.md](motion-graphics.md)).

## Titles and numbers: title-reveal, lower-third, stat-burst, stat-compare, metric-grid

Install the kit theme in the deck’s `setup.ts` so the graphics can read its hue ramps.

| Template | When to use it and what to supply | Example |
| --- | --- | --- |
| `title-reveal` | Open a talk with a short `title`, or put any headline on a slide that should arrive with the reel's rise. Spaces separate the staggered words. A headline without spaces rises as one phrase. Add a `subtitle` for context; the accent rule draws only under a subtitle. | `<MotionTemplate template="title-reveal" title="The river changed course." />` |
| `lower-third` | Introduce a speaker over the current slide with their `name` and `role`. | `<MotionTemplate template="lower-third" name="Mara Lin" role="River survey lead" />` |
| `stat-burst` | Pause on one measurement. Supply the numeric `value`, its `label`, and an optional `suffix` for units. | `<MotionTemplate template="stat-burst" value={36} suffix=" km" label="River surveyed" />` |
| `stat-compare` | Compare `from` and `to` with a shared `label`. With `suffix="%"`, both values show `%` and their difference shows percentage points (`+38 pp`). Any other `suffix` also applies to the difference. | `<MotionTemplate template="stat-compare" from={42} to={30} suffix=" min" label="Time to process a sample" />` |
| `metric-grid` | Give two to four related measurements one row. Each item in `metrics` supplies a `value`, a `label`, and an optional `suffix`. | `<MotionTemplate template="metric-grid" metrics={[{ value: 18, label: "Field sites" }, { value: 36, suffix: " km", label: "River surveyed" }]} />` |

## Text and structure: list-cascade, quote-card, section-wipe, agenda, end-card

| Template | When it fits | Example |
| --- | --- | --- |
| `list-cascade` | Walk through up to six `items` one click at a time. Each new item draws a marker and the previous one dims. | `<MotionTemplate template="list-cascade" items={["Read the shift notes", "Trace the missed handoff"]} />` |
| `quote-card` | Pause on someone's words. The `quote` appears word by word, followed by its `source`. | `<MotionTemplate template="quote-card" quote="We kept two copies of the same log." source="Shift lead, demo interview" />` |
| `section-wipe` | Introduce a new chapter with a full-canvas wipe, its `number` as text and its `title`. | `<MotionTemplate template="section-wipe" number="02" title="Where the handoff breaks" />` |
| `agenda` | Reorient the audience between sections. Give it up to seven `items` and a one-based `current` section. | `<MotionTemplate template="agenda" items={["Field notes", "Handoff gaps", "Trial run"]} current={2} />` |
| `end-card` | Close with a `title` and an optional `link` that the audience can follow. | `<MotionTemplate template="end-card" title="Take the checklist to your next shift." link="https://example.org/checklist" />` |

## Diagrams and narrative: timeline-sweep, process-flow, comparison-split, myth-fact, spotlight

| Template | When to use it and what to supply | Example |
| --- | --- | --- |
| `timeline-sweep` | Walk through a chronology. Give `events` one to six `{ date, label }` entries in speaking order. | `<MotionTemplate template="timeline-sweep" events={[{ date: "April", label: "Dock trials" }, { date: "June", label: "First sailing" }]} />` |
| `process-flow` | Explain one step per click. Give `steps` one to five short labels. | `<MotionTemplate template="process-flow" steps={["Scan the pass", "Assign a berth", "Board"]} />` |
| `comparison-split` | Introduce two alternatives in turn. Give both `left` and `right` a `title` and one to four `points`. | `<MotionTemplate template="comparison-split" left={{ title: "Paper", points: ["Buy at the kiosk"] }} right={{ title: "Mobile", points: ["Book from home"] }} />` |
| `myth-fact` | Let the audience consider a claim before you correct it. Supply the two sentences in `myth` and `fact`. | `<MotionTemplate template="myth-fact" myth="The tide sets the departure time." fact="The ramp adjusts to the tide." />` |
| `spotlight` | Point out a detail in an image. Supply `src`, `alt`, a short `label` and the point’s `x` and `y` as fractions from the image’s top-left corner. | `<MotionTemplate template="spotlight" src="field.svg" alt="Six paths meeting at a buoy" x={0.54} y={0.5} label="Harbour entrance" />` |

## Images and identity: device-mockup, photo-reveal, logo-reveal

| Template | When it fits | Props | Example |
| --- | --- | --- | --- |
| `device-mockup` | Show the screen a user sees during a product walkthrough. | `src`, `alt`, `device` (`laptop`, `phone`, or `browser`), `caption?` | `<MotionTemplate template="device-mockup" device="laptop" src="./trail-desk.svg" alt="Patrol handoff in Trail Desk" caption="Both crews can read the handoff before they leave." />` |
| `photo-reveal` | Set the scene before describing what happened there. | `src`, `alt`, `caption`, `credit?` | `<MotionTemplate template="photo-reveal" src="./north-inlet.svg" alt="Pines along the shoreline" caption="Fog rolls through North Inlet." credit="Field sketch by Mira Chen" />` |
| `logo-reveal` | Introduce a partner or close on a publication's mark. | `src`, `alt`, `tagline?` | `<MotionTemplate template="logo-reveal" src="./inlet-press.svg" alt="Inlet Press" tagline="Field guides for the long way home." />` |

## People and proportions: icon-array, team-grid, venn-overlap

| Template | When it fits | Example |
| --- | --- | --- |
| `icon-array` | Show a share of a group. Give it a `total` of 1–100 people, the number `filled`, and a `label` explaining the share. | `<MotionTemplate template="icon-array" total={16} filled={4} label="One seat in four goes to an apprentice." />` |
| `team-grid` | Introduce the people responsible for the work. Supply 2–6 `people` with a `name`, `role`, and optional portrait `src`. Initials stand in for a portrait. | `<MotionTemplate template="team-grid" people={[{ name: "Ada Reed", role: "Workshop lead", src: "./ada-reed.svg" }, { name: "Mina Park", role: "Apprentice mentor" }]} />` |
| `venn-overlap` | Name what two or three groups share. Use short labels for `sets` and their `overlap` so each fits inside its region. | `<MotionTemplate template="venn-overlap" sets={["Design", "Fieldwork", "Training"]} overlap="Pilot" />` |

## Kinetic type and single-figure data: word-swap, scramble-text, command-line, bar-board, donut-build

| Template | When it fits | Example |
| --- | --- | --- |
| `word-swap` | One sentence whose ending changes with each click. One or two `lead` lines (up to 18 characters each) and 2–5 `words` (up to 16 characters each); the last word lands in the accent. | `<MotionTemplate template="word-swap" lead={["We ship"]} words={["monthly.", "weekly.", "daily."]} />` |
| `scramble-text` | A short name or code that should land with a flourish: `text` up to 16 characters, optional `label`. | `<MotionTemplate template="scramble-text" text="TIDE-7" label="The build that fixed the handoff" />` |
| `command-line` | The one command the audience should run, up to 48 characters. | `<MotionTemplate template="command-line" command="npm create harbour@latest" />` |
| `bar-board` | A ranking whose leader is the slide's claim. 2–6 `rows` of `{ label, value }`, largest first (unsorted rows throw), a `source`, optional `prefix` and `suffix`. Click 2 highlights the leader. Rows come from `data/*.ts`. | `<MotionTemplate template="bar-board" rows={REGIONS} source="Port authority, 2025" suffix=" ships" />` |
| `donut-build` | The parts of one whole, one per click. 2–5 `segments` of `{ label, value }` from `data/*.ts`; set `clicks:` in the frontmatter, because the list is not literal. | `<MotionTemplate template="donut-build" segments={CARGO_SHARE} suffix="%" />` |

`bar-board` and `donut-build` are for one headline comparison of at most six rows with no time axis. Anything larger, over time, or in several steps of evidence is a sourced chart (`OpenChart`, `ChartSteps`) under the visualization skill. Values move on `ease.snap` and never overshoot.

## Clicks

Most templates take one click, at `at`; with `at` 0 the entrance plays on arrival and adds no click. `comparison-split`, `myth-fact` and `bar-board` take two, `at` and `at + 1`. `list-cascade`, `timeline-sweep`, `process-flow`, `word-swap` and `donut-build` take one per item, starting at `at`. The deck counts these when `template` is a literal string and the list is a literal array, whether the slide imports `MotionTemplate` or a `components/` file re-exports it by name. Set frontmatter `clicks` when the list comes from a data module or the template sits inside a deck component.
