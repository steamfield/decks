# Motion templates

A motion template is one of twenty-one finished motion graphics you fill in: pick one, write its words, and it
takes its colours, type and timing from the deck's theme and motion tokens. It needs no CSS, no
timeline code and no durations.

```mdx
import { MotionTemplate } from "@steamfield/decks/kit";

<MotionTemplate template="title-reveal" title="Agents read your docs first." subtitle="Write them for that reader." />
```

Every template takes two optional props besides its content:

- `at`: the click its entrance plays on. `0`, the default, plays it when the slide arrives,
  after the slide transition.
- `accent`: a theme hue (`cyan`, `amber`, `rose`, `emerald`, `violet`, `slate`) for the accent
  colour. Never a raw colour.

Like every motion component, a template steps with clicks and reverses when you go back. The
presenter window, the overview, print, PDF export and instant motion all show its finished pose
for the click. Its text stays real text, so it is read once, as a sentence, by a screen reader.

## The templates

| Template | What the audience sees | Props |
| --- | --- | --- |
| `title-reveal` | The headline's words rise into place one after another, an accent rule draws under them, the subtitle fades up | `title`, `subtitle?` |
| `lower-third` | A name and role slide out from behind an accent block in the lower third, over whatever else is on the slide | `name`, `role` |
| `stat-burst` | A number counts up while a ring draws around it; the label slides in under it | `value`, `label`, `suffix?` |
| `stat-compare` | The before value, an arrow, then the after value counting up with the signed change beside it | `from`, `to`, `label`, `suffix?` |
| `metric-grid` | Two to four tiles rise in a stagger, each counting up to its value | `metrics` (`{ value, label, suffix? }[]`) |
| `list-cascade` | One item per click, each with a marker that draws beside it; earlier items dim | `items` (up to 6) |
| `quote-card` | Quote marks draw, the quote appears word by word, the source follows | `quote`, `source` |
| `section-wipe` | An accent panel wipes across the canvas; the section number lands large, then the title | `number`, `title` |
| `agenda` | The talk's sections, earlier ones checked off, the current one highlighted | `items` (up to 7), `current` (1-based) |
| `end-card` | The closing title rises, a rule draws, a link types on beneath it | `title`, `link?` |
| `timeline-sweep` | A line draws; one dated event per click arrives as a tick while a playhead sweeps to it | `events` (`{ date, label }[]`, up to 6) |
| `process-flow` | Steps left to right; each lights on its click as the connector into it draws | `steps` (up to 5) |
| `comparison-split` | The left side lands, then a divider slides in and the right side lands | `left`, `right` (`{ title, points }`, up to 4 points) |
| `myth-fact` | The myth appears; on the next click a strike draws through it and the fact rises below | `myth`, `fact` |
| `spotlight` | An image dims, a ring draws around one point, the label slides in beside it | `src`, `alt`, `x`, `y` (0 to 1), `label` |
| `device-mockup` | A laptop, phone or browser frame slides up with a screenshot inside it | `src`, `alt`, `device`, `caption?` |
| `photo-reveal` | A full-bleed photo eases in with a slow push; a caption and credit rise over it | `src`, `alt`, `caption`, `credit?` |
| `logo-reveal` | A logo opens from a mask as an accent rule draws beneath it; a tagline fades up | `src`, `alt`, `tagline?` |
| `icon-array` | A grid of person icons; the first `filled` of `total` fill with the accent ("1 in 4") | `filled`, `total` (up to 100), `label` |
| `team-grid` | Two to six cards rise in, each with a photo or initials, a name and a role | `people` (`{ name, role, src? }[]`) |
| `venn-overlap` | Two or three circles slide together; the overlap label lands in the shared region | `sets` (2 or 3 labels), `overlap` |

### Clicks

Most templates use one click, at `at`. `list-cascade`, `timeline-sweep` and `process-flow` take
one click per item, from `at`; `comparison-split` and `myth-fact` take two, `at` and `at + 1`.
With a literal `template` and a literal list in the MDX the deck counts these clicks itself,
whether the slide imports `MotionTemplate` or a file in `components/` re-exports it from
`@steamfield/decks/kit`. When the list comes from a data module, or the template sits inside a
deck component, set `clicks:` in the slide's frontmatter.

## Where a motion graphic fits

A motion graphic earns its place at the moments a talk turns, not on every slide.

| Moment | Template |
| --- | --- |
| The opening title, or a thesis stated on its own | `title-reveal` |
| Introducing a speaker or a quoted person | `lower-third` |
| The one number the talk turns on | `stat-burst` |
| A before and after, a change over time | `stat-compare` |
| A short scoreboard of results | `metric-grid` |
| Where the talk is going, or where it is now | `agenda` |
| A break between parts | `section-wipe` |
| A process or a history the speaker walks through | `process-flow`, `timeline-sweep` |
| A belief to correct | `myth-fact` |
| Two options weighed | `comparison-split` |
| A point in a screenshot, photo or map | `spotlight` |
| The product, shown on the device it runs on | `device-mockup` |
| A photograph that sets the scene | `photo-reveal` |
| A company, sponsor or project mark | `logo-reveal` |
| A proportion that should feel human ("1 in 4") | `icon-array` |
| The people behind the work | `team-grid` |
| Two or three ideas that meet in one | `venn-overlap` |
| A quote that carries an argument | `quote-card` |
| The close | `end-card` |

Leave them out of dense data slides (a chart carries those), of slides the speaker talks over
the whole time, and of runs of consecutive slides: three motion graphics in a row read as a
reel, not a talk. A deck of twenty slides usually has three to six.

## Check it

`decks film <deck> <slide> [click]` writes a contact sheet of a template's entrance (see
[cli.md](cli.md)). Read it: every part should be readable in the last frame, and nothing should
still be moving after about a second and a half.

## Writing your own

Each template is one readable file. The package ships their sources in
`docs/motion-templates/`, next to this page. When no template fits, copy the closest one into
the deck's `components/`, replace its relative imports with `@steamfield/decks/kit` and
`@steamfield/decks/motion` (`useTemplateMotion`, `ink` and the rest are public), and change
it. `useTemplateMotion(at, entrance, steps)` is the rule every template uses: the entrance on
click `at` or on arrival, each step on the next click, every tween a `fromTo`. The pieces it uses are public: `useTimeline` and gsap's
registered plugins (`SplitText`, `MorphSVGPlugin`, `MotionPathPlugin`, `DrawSVGPlugin`,
`CustomEase`) from `@steamfield/decks/motion`, `Camera` and `ShapeMorph` for camera moves and
morphs, and `Scene3D` from the kit for three.js. [motion.md](motion.md) covers them.
