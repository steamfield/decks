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

## Images and identity: device-mockup, photo-reveal, logo-reveal

| Template | When it fits | Props | Example |
| --- | --- | --- | --- |
| `device-mockup` | Show the screen a user sees during a product walkthrough. | `src`, `alt`, `device` (`laptop`, `phone`, or `browser`), `caption?` | `<MotionTemplate template="device-mockup" device="laptop" src="./trail-desk.svg" alt="Patrol handoff in Trail Desk" caption="Both crews can read the handoff before they leave." />` |
| `photo-reveal` | Set the scene before describing what happened there. | `src`, `alt`, `caption`, `credit?` | `<MotionTemplate template="photo-reveal" src="./north-inlet.svg" alt="Pines along the shoreline" caption="Fog rolls through North Inlet." credit="Field sketch by Mira Chen" />` |
| `logo-reveal` | Introduce a partner or close on a publication's mark. | `src`, `alt`, `tagline?` | `<MotionTemplate template="logo-reveal" src="./inlet-press.svg" alt="Inlet Press" tagline="Field guides for the long way home." />` |

## People and proportions: icon-array, team-grid, venn-overlap
