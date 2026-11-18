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
| `title-reveal` | Open a talk with a short `title`. Spaces separate the staggered words. A headline without spaces rises as one phrase. Add a `subtitle` for context. | `<MotionTemplate template="title-reveal" title="The river changed course." />` |
| `lower-third` | Introduce a speaker over the current slide with their `name` and `role`. | `<MotionTemplate template="lower-third" name="Mara Lin" role="River survey lead" />` |
| `stat-burst` | Pause on one measurement. Supply the numeric `value`, its `label`, and an optional `suffix` for units. | `<MotionTemplate template="stat-burst" value={36} suffix=" km" label="River surveyed" />` |
| `stat-compare` | Compare `from` and `to` with a shared `label`. With `suffix="%"`, both values show `%` and their difference shows percentage points (`+38 pp`). Any other `suffix` also applies to the difference. | `<MotionTemplate template="stat-compare" from={42} to={30} suffix=" min" label="Time to process a sample" />` |
| `metric-grid` | Give two to four related measurements one row. Each item in `metrics` supplies a `value`, a `label`, and an optional `suffix`. | `<MotionTemplate template="metric-grid" metrics={[{ value: 18, label: "Field sites" }, { value: 36, suffix: " km", label: "River surveyed" }]} />` |

## Text and structure: list-cascade, quote-card, section-wipe, agenda, end-card

## Diagrams and narrative: timeline-sweep, process-flow, comparison-split, myth-fact, spotlight
