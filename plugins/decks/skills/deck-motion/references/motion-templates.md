# Motion templates

`MotionTemplate` from `@steamfield/decks/kit` is a ready-made motion graphic: choose a
`template`, write its words, and it takes colour, type and timing from the deck theme and
motion tokens. Optional `at` sets the click its entrance plays on (0, the default, plays it
on arrival) and `accent` picks a theme hue. Each template's source ships in the package at
`docs/motion-templates/<name>.tsx`; read one before writing custom motion with
`useTimeline` (see [motion-graphics.md](motion-graphics.md)).

## Titles and numbers: title-reveal, lower-third, stat-burst, stat-compare, metric-grid

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

## People and proportions: icon-array, team-grid, venn-overlap
