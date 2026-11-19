# Motion reel: data provenance

Every figure on screen is counted from this repository and held in `data/reel.ts`. Slides read
the constants; none types a number. All counts below were taken on 2026-11-18 at
`@steamfield/decks` 1.2.0. Paths are from the repository root.

## Slide 1 (`01-cold-open`): Your agent writes the motion.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| Agents write the slides, charts and motion | no figure | confirmed | `packages/decks/package.json` `description`: "React slide decks for animated, data-driven talks: MDX slides, motion, story stages, charts, and a CLI, built with coding agents." | 2026-11-18 |
| Lower third: "A React slide framework for animated talks" | no figure | confirmed | `docs/guide/README.md` line 3: "Decks is a React slide framework." | 2026-11-18 |

## Slide 2 (`02-sting`): Decks makes React slides that move on every click.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| The mark: two offset slides, cyan over violet | geometry on a 32-unit square | confirmed | `site/src/lib/brand.ts` `MARK` (front rect `x 2, y 12.75, 21 x 14.5, rx 3`; back slide offset to `x 9, y 4.75`; 1.5-unit gap). Redrawn in `components/LogoSting.tsx` with the back slide whole. | 2026-11-18 |
| Motion is driven by clicks | no figure | confirmed | `docs/guide/motion.md` line 3: "Motion in a deck is driven by clicks." | 2026-11-18 |

## Slide 3 (`03-count`) and slide 4 (`04-templates`): Decks ships 21 motion templates.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `TEMPLATES.length` | 21 templates | confirmed | The table under "The templates" in `docs/guide/motion-templates.md` | 2026-11-18 |
| `TEMPLATES` | the 21 names | confirmed | The same table, in its order; cross-checked against the `case` labels in `packages/kit/src/motion-templates/motion-template.tsx` | 2026-11-18 |

Raw result:

```
$ awk '/^## The templates/,/^### Clicks/' docs/guide/motion-templates.md | grep -c '^| `'
21
$ ls packages/kit/src/motion-templates/*.module.css | wc -l
21
```

Definition: a template is one value of the `template` prop of `MotionTemplate`.

The slide's `title` in frontmatter spells the number out as 21. It is the same count; recount
and change the title if `TEMPLATES` changes.

## Slide 5 (`05-clicks`): It moves when you click.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| One click plays one beat | no figure | confirmed | `docs/guide/motion.md`, `useTimeline`: "`beat(n)` marks where click `n` rests. The tweens between `beat(1)` and `beat(2)` play on the second click." | 2026-11-18 |
| Back plays it in reverse | no figure | confirmed | `docs/guide/motion.md` line 60: "Going back a click plays the same transition in reverse." | 2026-11-18 |
| Reload holds the frame | no figure | confirmed | `docs/guide/motion.md` line 9: "The click is in the URL (`#/5?clicks=2`), so a reload or a shared link lands on the same state." | 2026-11-18 |

## Slide 6 (`06-views`): The same deck renders in the presenter, the overview, print and PDF.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `OUTPUTS`: presenter, overview | no figure | confirmed | `docs/guide/presenting.md` line 3: "Press `p` for a presenter window with notes, `o` for an overview of every slide" | 2026-11-18 |
| `OUTPUTS`: print, PDF | no figure | confirmed | `docs/guide/cli.md`, `decks export`: "opens its print view (`#/print`) in Chromium and writes a PDF with one page per click step of every visible slide" | 2026-11-18 |

## Slide 7 (`07-package`): It ships in one package.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| One package | 1 npm package | confirmed | `AGENTS.md`: "published as one npm package, `@steamfield/decks`" | 2026-11-18 |
| `STEP_COMPONENTS.length` | 8 step components | confirmed | The `###` headings under "Step components" in `docs/guide/motion.md` | 2026-11-18 |
| `TRANSITIONS.length` | 13 slide transitions | confirmed | The table under "Slide transitions" in `docs/guide/motion.md` | 2026-11-18 |
| `RENDER_CONTEXTS.length` | 5 views of a slide | confirmed | `RenderContext` in `packages/runtime/src/hooks.ts` | 2026-11-18 |

Raw result:

```
$ awk '/^## Step components/,/^## Hooks/' docs/guide/motion.md | grep -c '^### '
8
$ awk '/^## Slide transitions/,/^## `Camera`/' docs/guide/motion.md | grep -c '^| `'
13
$ grep -n 'export type RenderContext' packages/runtime/src/hooks.ts
89:export type RenderContext = "slide" | "presenter" | "preview" | "overview" | "print";
```

Definition: the 13 transitions are every name the guide's table lists. Eleven are animated
presets in `packages/runtime/src/transitions/transition.css`, `cut` is the hard cut, and
`story` comes from the kit's stylesheet. The 5 views are the contexts a slide component can be
rendered in; `preview` is the presenter window's next-step pane.

## Slide 8 (`08-install`): One line installs it.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `INSTALL` | `bun add @steamfield/decks react react-dom` | confirmed | `README.md` line 6; `docs/guide/getting-started.md` line 39 | 2026-11-18 |

## Slide 9 (`09-end`): Ask your agent for a deck.

| Claim / constant | Value and units | Status | Source / query | Retrieved / as of |
| --- | --- | --- | --- | --- |
| `SITE` | `https://decks.steamfield.io` | confirmed | `packages/decks/package.json` `homepage` | 2026-11-18 |

## Assets

| Asset | Source | Licence |
| --- | --- | --- |
| `public/fonts/inter-latin-wght-normal.woff2` | A copy of `packages/kit/src/styles/fonts/inter-latin-wght-normal.woff2` (Inter variable, Latin subset, from `@fontsource-variable/inter`). The deck does not import the kit stylesheet, so it loads the face itself. | SIL Open Font License 1.1 |

## Banned on-slide content (checked)

| Claim | Why it is wrong | Correct source / value |
| --- | --- | --- |
| A quote from a user or reviewer | The repository holds no attributed quotation, so the reel has no `quote-card`. | none |
| "12 transitions" | Counts only the names in `packages/runtime` and misses the kit's `story`. | 13, the guide's table |

## Refresh before the talk

| Pending item | What resolves it | Owner |
| --- | --- | --- |
| The four counts | Rerun the commands above after any release that adds a template, transition, step component or render context; update `data/reel.ts` and the title of `03-count`. | deck author |
