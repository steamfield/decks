# Ballot and chalk

A green-black classroom board, warm chalk type, and paper-ballot ovals. The
serif asks the question; Public Sans carries office names, evidence and figures.
The cover and slide 2 are the approval samples. Slide 2 has flagged result
placeholders until the research module arrives; its author replaces them.

| Theme slot | Appearance | Meaning |
| --- | --- | --- |
| `cyan` | School-bus yellow | Changed hands; new leadership |
| `amber` | Desaturated granite clay | AISD risk; pending decisions; gaps |
| `slate` | Warm chalk grey | Neutral structure; unchanged offices of either party |
| `emerald` | Sage | Chart support only |
| `violet` | Dusk | Chart support only |
| `rose` | Plum | Chart support only |

Party names are text labels. Neither party owns a color. In beat scripts use
`changed()`, `risk()` and `neutral(step)` from `components/design.ts`.

| To change | Edit |
| --- | --- |
| Colors, ramps, font families, brand, chart palette | `theme.json` |
| Font imports, type scale, spacing, radii, borders, CSS opacity | `styles/tokens.css` |
| Oval proportions, SVG geometry, dim level, ladder gaps, arc radius | `components/design.ts` |
| How tokens attach to shared components | `styles/index.css` |

Swap a font with two line changes: its fontsource `@import` in `tokens.css`
and its `fonts.sans` or `fonts.serif` family in `theme.json`. Use the installed
package's actual CSS family name. `fonts.mono` aliases `fonts.sans`; figures
use tabular numerals. Verify the font loaded in the browser after a swap.

At a 1920 × 1080 frame, the cover title is 72px and claims are 60px, both
Source Serif 4 at weight 520 and line-height 1.12. Prose is 28px; small labels
are 22px. The left margin is 112 units. The chalk baseline sits at y=720.
HTML lengths scale with `--sw` and `--sh`; SVG geometry stays in viewBox units.

`BallotOval` takes `cx`, `cy`, a `size` multiplier, `state`, `meaning`, `fill`
and `pending`. Filled means won or holds; empty means not won; hatched means
Scenario. A dashed stroke means Pending. Print the evidence word on the
object: `tx-tag is-pending`, `is-reported` (Reported date) or `is-scenario`.
Reported dates keep a solid border; scenario tags are dotted. A ping is one
unfiltered thin ring. Earlier evidence dims to `DIM`.

Keep the documented mirrors together: `DIM` / `--tx-dim`, `BASELINE_Y` /
`--tx-baseline-y`, `HATCH.spacing` / `--tx-hatch-spacing`, and `DASH` /
`--tx-pending-dash`. CSS timing mirrors `DUR.color` for the normal fade and
`DUR.opacity` for reduced motion. The addon mirror test does not scan these
deck-local values. View-transition selectors must live on `html`; this
deck's stylesheet supplies them without changing the shared addon.

Do not put hex colors, radius or opacity literals in components. Put new
visual values in the three token files. No raw viewport units, red or blue,
glows or shadows. Every ramp must get lighter and clear 3:1 at its first step;
`packages/decks/theme/theme.test.ts` includes this deck.

Run the browser token regression with
`bunx vitest run decks/texas-2026/styles/tokens.test.ts`.

The cover's office list is flagged until `data/02-power-board.ts` arrives.
Replace that fallback with research exports before approving election claims.
