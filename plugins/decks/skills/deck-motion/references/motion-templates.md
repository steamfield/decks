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
