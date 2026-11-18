# Motion templates

`MotionTemplate` from `@steamfield/decks/kit` is a ready-made motion graphic: choose a
`template`, write its words, and it takes colour, type and timing from the deck theme and
motion tokens. Optional `at` sets the click its entrance plays on (0, the default, plays it
on arrival) and `accent` picks a theme hue. Each template's source ships in the package at
`docs/motion-templates/<name>.tsx`; read one before writing custom motion with
`useTimeline` (see [motion-graphics.md](motion-graphics.md)).

## Titles and numbers: title-reveal, lower-third, stat-burst, stat-compare, metric-grid

## Text and structure: list-cascade, quote-card, section-wipe, agenda, end-card

## Diagrams and narrative: timeline-sweep, process-flow, comparison-split, myth-fact, spotlight

| Template | When to use it and what to supply | Example |
| --- | --- | --- |
| `timeline-sweep` | Walk through a chronology. Give `events` one to six `{ date, label }` entries in speaking order. | `<MotionTemplate template="timeline-sweep" events={[{ date: "April", label: "Dock trials" }, { date: "June", label: "First sailing" }]} />` |
| `process-flow` | Explain one step per click. Give `steps` one to five short labels. | `<MotionTemplate template="process-flow" steps={["Scan the pass", "Assign a berth", "Board"]} />` |
| `comparison-split` | Introduce two alternatives in turn. Give both `left` and `right` a `title` and one to four `points`. | `<MotionTemplate template="comparison-split" left={{ title: "Paper", points: ["Buy at the kiosk"] }} right={{ title: "Mobile", points: ["Book from home"] }} />` |
| `myth-fact` | Let the audience consider a claim before you correct it. Supply the two sentences in `myth` and `fact`. | `<MotionTemplate template="myth-fact" myth="The tide sets the departure time." fact="The ramp adjusts to the tide." />` |
| `spotlight` | Point out a detail in an image. Supply `src`, `alt`, a short `label` and the point’s `x` and `y` as fractions from the image’s top-left corner. | `<MotionTemplate template="spotlight" src="field.svg" alt="Six paths meeting at a buoy" x={0.54} y={0.5} label="Harbour entrance" />` |
