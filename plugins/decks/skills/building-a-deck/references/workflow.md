# Workflow and definition of done

## Brief and arc

Write the audience, the decision or understanding the talk should leave, the time available, and the sources. Sketch one claim per slide and one change per story beat. Do not draft layout labels and call them headlines.

Conventional content slides need one dominant body block. A chart can carry the slide; it does not also need a list explaining the chart. Story slides need a persistent visual, a claim headline, a card and a source link. Use a cover or close where it has a purpose. Do not add section dividers to satisfy a template.

For work split among agents, define ownership of slides, source modules, theme and reusable components before delegating. Finish research before dependent slides, and establish the visual system with a representative slide. A reviewer proposing a new number must name its source row or constant. Review in a separate read-only context; never change branches in another agent's worktree.

## Scaffold and inspect

```sh
decks new q3 --story
decks dev q3 --open
```

`decks new` registers the deck and creates two starter slides. Replace illustrative data and placeholder copy. A requested six-slide deck needs six actual MDX slides, not six beats of the starter stage. No separate slide manifest is maintained.

The scaffold installs the theme from `setup.ts` and imports the kit stylesheet. To customize, put a partial override in `theme.json` and pass it to `resolveTheme` in that setup file. Use the theme for color, fonts and shape; use local CSS Modules for a component's rules.

## Research before claims

Use `decks:deck-data`. Create a section in `data-sources.md` for each slide, including slides without numeric claims (record that they have none). Put sourced constants and chart rows in `data/*.ts`. Record query, raw result, units, population, period and retrieval date. A draft brief is a claim to check, not evidence.

Carry personal claims as `FLAG: author-reported`. Mark unresolved values as pending; do not dress them as confirmed facts. If evidence overturns a premise, change the outline before building slides that depend on it.

## Author conventional slides

Use direct `slides/NN-slug.mdx` files. Frontmatter `title` describes the slide in overview; the visible headline still has to appear in the slide body. Motion and basic layout components are available without imports. Kit components need imports or named re-exports from a direct `components/*.tsx` file.

`TwoCol` requires exactly two element children. Choose its ratio from the installed guide. Do not force every argument into two columns or cards. Markdown within JSX needs blank lines around it. Put narration and caveats in one standalone `<Notes>` block.

## Author story slides

Keep the MDX thin: frontmatter, stage component, notes. This is the story scaffold's second slide:

```mdx
---
title: Keep the evidence in view.
clicks: 1
---

<FirstStage />
```

The stage holds `COPY`, `useStage`, marks and card. `useStage` returns `clicks`, current `copy` and `beats`; pass `beats` and `click={clicks}` to `StoryStage`. `beats` is `COPY.length`, while the MDX click total is one less. An empty lead can hide a card but still occupies a beat; render it conditionally.

Set `transition: "story"` in `deck.config.ts` and import the kit stylesheet. Write the headline with `od-story-head`. Keep it on one line at the authored size; shorten it if necessary. Keep ink out of the measured headline and card regions. Reserve the card at its full eight-word lead and twenty-word body budget.

Use `decks:deck-motion` for entrance versus beat state and refs. Use `decks:visualization` before selecting an Ink mark or writing an OpenChart spec. Use no network-dependent live demo to stand in for reproducible evidence.

## Live terminal

Use `LiveTerm` from `@steamfield/decks/kit` for prepared shell commands inside a slide. Pass a `pane` specification (`id`, `rows`, `cols`, `cwd`, `commands`), the slide's current click, and a required `fallback` recording node. Use `cwd: "temp"` for a fresh temporary directory, or a key declared in `deck.config.ts` under `term.dirs`.

Start the deck with `decks dev <deck> --live-term` on macOS or Linux. Only the active play slide with live motion shows the shell. Presenter, overview, print and embeds show the recording. Build, export and shot also show the recording; check it at every click. Full-screen TUIs are unsupported because replaying the output tail cannot reconstruct their screen.

Click the terminal to type; press Escape to return keys to the deck. Give the pane a size in the slide layout. Set its font and colours with `--deck-term-*` custom properties; the component supplies no skin.

Pass `frame={(content, status) => ...}` to wrap both the shell and recording in your deck's skin. Render `content` in a sized area and label it from `status.live`, `status.busy`, `status.queued` and `status.reason`, for example "Live · busy" or "Recorded · live unavailable: Shell exited (0)". `live` becomes true when the shell can draw; the recording stays visible while the module and font load. With `frame`, show the reason yourself. Without it, the component places the reason below the recording with `role="status"`.

## Notes and pacing

Put opening narration before the first `[click]` marker in a single `<Notes>` block. For story decks use one plain `[click]` line per click, in order, so the presenter can follow every beat. Notes do not add clicks. Do not hide notes in comments or put the block inside a conditional expression.

The stage must make the same claim when reached by next, previous, a direct URL or reload. Test all four. Presenter current, next preview, overview and print must show settled states for their own clicks, with no animation or duplicate SVG ids.

## Verification chain

Run from the project containing `decks.json`:

```sh
decks check
decks lint q3
decks build q3
decks shot q3 2 0 --out slide-2-c0.png
decks shot q3 2 1 --out slide-2-c1.png
decks export q3 --out q3.pdf
```

The screenshot commands above illustrate the scaffold's two states; capture every state of every new or changed slide, not just that slide. Use `--width` and `--height` to check 4:3 and 21:9 framing as well as 16:9. Screenshots settle a single instant state; also walk live forward/backward motion in `decks dev`.

Inspect the PNGs for clipping, overlaps, unreadable sources, card/mark collisions and headline wraps. Inspect the PDF for every click state, not only its page count. An all-click export should contain the sum of `clicks + 1` across visible slides. Use `--final` only for a requested final-state handout.

After a source or copy change, rerun the relevant fact-check and lint; after a visual or motion change, inspect affected states again. Do not claim an unavailable source or failed capture passed. Report the exact error and the work left to verify.

### Film a step

Run `decks film q3 2 1 --out slide-2-c1-film.png` and open the PNG. Read across each row to follow the motion into click 1. To inspect the transition into slide 2, use click 0. The labels show virtual milliseconds and the last frame shows the settled pose. Use `--frames 12` for a closer look at a short beat.

## Definition of done

- The requested arc and slide count are complete; no scaffold placeholders remain.
- `decks check`, `decks lint <deck>` and `decks build <deck>` pass. Review warnings too. These commands do not enforce every word budget, design rule or factual claim.
- Prose review covers headlines, cards, labels, captions, chips, chart chrome and notes. Fix sentence shapes that phrase matching cannot catch. A fresh read-only reviewer is useful for a full new deck.
- Every figure and real person/anecdote traces to evidence; the `decks:deck-data` fact-check report records current results. Load-bearing mismatches, unsourced or unverifiable claims are resolved. Deliberate attributed flags are reported.
- Every changed click state is inspected, along with forward/backward navigation, later-click reload, presenter, overview, instant motion and alternate aspect ratios. Text scaling does not break key content.
- The PDF exports and is visually inspected, with all click states unless a final-only handout was requested.
- Deliver the deck location, output paths, checks and results, fact-check findings, deliberate flags and remaining limits. A clean screenshot run is evidence of rendering, not the author's aesthetic approval.
