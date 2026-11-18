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

## People and proportions: icon-array, team-grid, venn-overlap

| Template | When it fits | Example |
| --- | --- | --- |
| `icon-array` | Show a share of a group. Give it a `total` of 1–100 people, the number `filled`, and a `label` explaining the share. | `<MotionTemplate template="icon-array" total={16} filled={4} label="One seat in four goes to an apprentice." />` |
| `team-grid` | Introduce the people responsible for the work. Supply 2–6 `people` with a `name`, `role`, and optional portrait `src`. Initials stand in for a portrait. | `<MotionTemplate template="team-grid" people={[{ name: "Ada Reed", role: "Workshop lead", src: "./ada-reed.svg" }, { name: "Mina Park", role: "Apprentice mentor" }]} />` |
| `venn-overlap` | Name what two or three groups share. Use short labels for `sets` and their `overlap` so each fits inside its region. | `<MotionTemplate template="venn-overlap" sets={["Design", "Fieldwork", "Training"]} overlap="Pilot" />` |
