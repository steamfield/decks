# Night drive, on stage

The deck looks and feels like steamfield.io's hero: one CRT tube, a tape
playing on it, and a night drive toward the Steamfield mark as a rising sun.
Every slide is that same tube. The cover and slide 4 are the approval samples.

The source is `~/Projects/steamfield/DESIGN.md` and the hero's code under
`~/Projects/steamfield/src/scripts/night-drive/`. Where this file and that one
disagree, this one wins for the deck and says why.

Riley's decisions (2026-11-13): every slide gets the full 80s theme, including
the slight barrel distortion; the deck matches the hero's look and feel; the
heavy tape tracking noise is left out; the sun rises over one minute.

## The tube (every slide)

`global-top.vue` draws one CRT's glass above all slides, ported from the site's
`.crt-overlay`:

- scanlines on a whole-pixel period (4px at 1920 wide, never under 3px);
- a 3px RGB phosphor mask;
- a glass reflection at the top left and a soft vignette;
- rounded tube corners, black past them, and a dark falloff along the edges;
- grain, moved to one of eight positions eight times a second;
- a hum bar, a soft white band 18% of the frame tall, crossing every nine seconds;
- a power-on, the picture opening from a bright line, once per browser session.

The barrel warp is an SVG displacement filter (`#sf-barrel`) on each slide's
frame, so headlines, cards, diagrams and the live scene all bend with the
glass. It uses the site's formula (`crtWarp`): nothing at the center, 8 units
at the corners of a 1920-wide frame (`TUBE_WARP` in `scene/warp.ts`). The glass
itself is not warped.

Neon and pixel type carry the convergence fringe (0.67px of red to the right
and cyan to the left): tags, rail labels, name plates, figure numbers, terminal
lines, the script. Headlines, card and body text, code and the chrome title do
not, as on the site.

Not in the deck: the heavy tape tracking faults. No noise bars, rolls, parks,
flutters, torn picture or crash burst; the site's fault schedule is not ported.

The tube runs in the real slide view only. The presenter view, the notes
viewer, an embedded deck and PDF export draw the slides plain, because the
overlay is fixed to the window. Grain, hum and power-on stop under reduced
motion; scanlines, mask, corners and the warp stay.

All values are `--sf-tube-*` and `--sf-fringe*` in `styles/tokens.css`.

## The live scene (cover and close)

`NightDriveField` shows the hero's three.js scene, ported into `scene/`: sky,
stars, the mark as the sun, a shadowed mountain range whose front ridgeline is
the commit data, the grid floor driving toward the viewer, sun rays through the
real valleys, ground haze, tape texture and color bleed, bloom, a vignette and
the tube stage's beam bloom. The hero's soft-light grain sits over it.

- The sun rises over 60 seconds (15 on the site) and then the view eases
  toward the range over another 60.
- Left out: the game, mouse steering, pointer relighting, turbo, and the
  tracking faults.
- It loads on demand (`three` and `postprocessing`, a separate chunk) while the
  slide is active and is released when it is not.
- The SVG picture in the same component is the finished fallback: reduced
  motion, no WebGL2, the presenter view, the overview and export show it. If
  the live scene has not drawn within three seconds, the still picture takes
  over for good. The two are never shown together.
- Headless Chromium (the `shot` and `snap` screenshots) renders the scene in
  software and does not draw the grid lines. Check the grid in a real browser.

## Color: the hero's aged swatch

The canvas is the hero's ink (`#170d21`, a warm plum-black), and every slide
sits in the hero's sky: ink at the top, the middle sky, a little horizon haze
at the bottom. Cards and boxes let the sky through slightly.

| Theme slot | Appearance | Meaning |
| --- | --- | --- |
| `rose` | The grid's pink (`#ff5798`) | The actor being discussed: the agent, a running process. Also failure, with a count or a ✕. One pink thing per beat. |
| `cyan` | The ridge's cyan (`#66e8df`) | Data and output: results, samples, a cursor on a recording |
| `amber` | Sun yellow | Waiting, held or locked. Also figure numbers and `Recorded` tags. |
| `emerald` | Phosphor green | Anything a computer printed that passed; terminal text |
| `violet` | The wireframe's violet (`#9b70c7`) | Transport and plumbing; things kept outside the project |
| `slate` | Lavender greys | Neutral structure and dimmed items |

There is no red. The sunset (yellow, orange, pink, violet, top to bottom) fills
the mark and nothing else; its stops are `accents.sun-*` and keep the site's
full-strength values. The hero's sky and scene colors are `accents.hero-*`, and
the chrome title's stops are `accents.chrome-1` to `chrome-7`. Product brand
colors are never accents.

## Type

The hero's faces only. No Helvetica or Arial style face appears on a slide
(Riley, 2026-11-13); Heros survives only inside the wordmark, which is the logo.

| Role | Face | Token |
| --- | --- | --- |
| Headlines, card leads, names in diagrams, product plates, rail names, the cover title | Orbitron 700 to 900 | `fonts.serif`, `--sf-font-display` |
| Card copy, figure captions, sentences inside a diagram | VT323 | `fonts.sans` |
| The cover lede and nav line, terminal lines | VT323 | `--sf-font-term` |
| Tags, figure numbers, rail verbs, the cover byline | Press Start 2P | `--sf-font-pixel` |
| Code, file names, paths | JetBrains Mono | `fonts.mono` |
| One script line across the cover title | Mr Dafoe | `--sf-font-script` |
| The "steamfield" wordmark | TeX Gyre Heros | `--sf-font-wordmark` |

Headlines are sentences in sentence case, Orbitron 700 at 39px: one line, 50
characters at most. VT323 has a small x-height, so it is set large: card copy
is 35px. At a 1920 x 1080 frame the cover title is 95px, the cover lede 42px,
card leads 26px, pixel tags 15px, code and file names in a diagram 21px and
never below 18px. HTML lengths scale with `--sw`, `--sh` and `--lw`; SVG type
stays in viewBox units.

## The cover's composition

It is the hero's: the wordmark with the mark at the top left and a terminal
nav line at the top right (the event and the month), the chrome title centered
over the sun with the script line across its lower right, the lede in terminal
type with a pink prompt, the figure caption at the bottom left with a yellow
`Fig. 1`, and the byline in pixel type at the bottom right. The horizon sits at
70% of the frame.

## Evidence

The status word is printed on the object. `EvidenceTag` has three kinds:
`recorded` (yellow, solid border, carries its date), `schematic` (dashed) and
`illustrative` (dotted). Anything recorded plays inside a `CrtFrame`, a small
monitor within the tube: a bezel, a dark screen, its own static scanlines, and
a band along the bottom for the `Fig. n` number and the recording's source. A
schematic is drawn straight on the slide. A frame can sit dark (`power` at 0)
and switch on at a beat.

## Recurring parts

- `ThreadRail`: the seven products along the bottom, under the card. Past
  products at full strength, the current one with a pink marker and a yellow
  verb, the rest at the dim level. The beat rail sits below it.
- `NamePlate`: pixel icon, Orbitron name and language chip, top right, on a
  product's first slide; `chip-only` on its later ones.
- `SfMark`: the mark with the sunset gradient.
- Boxes in a diagram use `sf-box`, wires `sf-wire`, a project boundary
  `sf-boundary`. A lit box takes `is-lit` and the `color` of its meaning.

## Where to change things

| To change | Edit |
| --- | --- |
| Colors, ramps, font families for sans and mono | `theme.json` |
| Font imports, display, pixel, terminal and script faces, type scale, spacing, radii, glow, every tube and fringe value | `styles/tokens.css` |
| SVG geometry, the dim level, the still picture, CRT bezel, slide layouts | `components/design.ts` |
| How tokens attach to shared components; the tube's layers; SVG text and box classes | `styles/index.css` |
| The live scene's timings (sunrise, approach), shaders, tape and tube passes | `scene/` |
| The warp's strength | `TUBE_WARP` in `scene/warp.ts` |

## Motion

Beat motion: durations come from `DUR`, easings from `SETTLE`, `DRAW` and
`TRACE`. Each beat changes one thing, and what a beat is no longer about drops
to `DIM` (`--sf-dim`, 0.45). The tube's ambient layers and the live scene run
on their own clocks, never gate content, and stop under reduced motion. No
large area changes luminance quickly: the grain is 3.5% opaque, the hum bar
peaks at 2.5% white, and the power-on wash peaks at 6% and plays once.

## Do not

Tracking noise bars. Glow on card or code text. Pixel type or Orbitron for a
sentence. Per-band colors on the mark. Hex colors in components (they belong in
`theme.json`). Anything that looks recorded without a `Recorded` tag.
