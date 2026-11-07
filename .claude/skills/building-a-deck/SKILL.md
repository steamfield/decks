---
name: building-a-deck
description: End-to-end workflow for creating or revising a Slidev deck in this repo (scaffold, author, verify, build). Use when building a new deck, conventional or story, or doing a structural revision of an existing one.
---

# Building a deck

The pattern rules (layout classes, typography, chart specs, headmatter, theme)
live in `.claude/rules/deck-patterns.md` and auto-attach when you edit files
under `examples/` or `decks/`. This skill is the workflow around them: the order
of operations and the verification chain. Gold-standard references:
`examples/agent-experience` (conventional: the word budget and slide shape to
copy) and `examples/opendata-pitch` (data storytelling: one pinned visualization
per slide, beats on arrow keys, and the data-sources.md template). Run every
command below from the repo root.<!-- decks:repo-only --> To build a deck through Codex runs (`foreman` or `codex-delegate`), the wave plan and contract templates are in `contracts/README.md` next to this file.<!-- /decks:repo-only -->

A deck is either **conventional** (bullets, tables, charts, one file per slide)
or a **story deck** (one pinned visualization per slide, beats on arrow keys,
prose in the stage component rather than the page). Steps 1 and 4 branch; the
rest of the workflow is the same for both.

## 1. Scaffold

```bash
bun run new <alias> [dir-name]            # conventional: slides.md + pages/01-cover.md
bun run new <alias> [dir-name] --story    # story: story headmatter, StoryCover page,
                                           # a first stage copied from the minimal
                                           # template, data/first.ts, data-sources.md
```

Both write to `decks/<dir-name>/` (dir-name defaults to the alias) and register
the alias in `decks.json`, creating it if missing.
`--author "Name"` fills the byline; `--brand "Name" --url example.com` writes a
`theme.json` with the deck's brand (otherwise the cover shows the default
"Decks" name and no mark). Recoloring is the same `theme.json`; see "Theme and
tokens" in `deck-patterns.md`. Set `"animated": true` if the deck will
use OpenChart or scripted demos (it switches export to `--with-clicks --wait 1500`);
`--story` sets it for you. `bun run list` shows the registry.

## 2. Outline before pages

Read `.claude/rules/deck-writing.md` first if you are writing slide text. It
carries the word budget (~70 visible words per slide for a conventional deck,
eight/twenty words per story card), the three-bullet limit, the no-paragraphs
rule, and the places where deck prose deliberately inverts article rules.
`.claude/rules/prose-patterns.md` is the catalog of AI tells to keep out.

Write the slide arc first (claim headlines, not topic labels; 15 minutes ≈ 10
slides). Conventional non-cover slide: eyebrow + claim headline + one body
block + source line + `<OdFooter />`. Section dividers get `is-section` + a
`glow-*` class; the close slide gets `is-close` + `<OdQrCard url="...">` (QR
renders at runtime, no SVG asset step). A story slide has none of that: no
footer, no eyebrow, the headline lives inside the stage (`od-story-head`), and
the source line is a `<StoryLink>`; see `.claude/rules/story-stage.md`.

## 3. Numbers are derived, never copied

Every on-slide figure needs a query or command in `<deck>/data-sources.md`
(template and the full data contract: `.claude/rules/deck-data.md`; worked
example: `examples/opendata-pitch/data-sources.md`). Derive numbers fresh with the
recorded command even when a brief hands them to you. Briefs have been wrong
(provider counts, commit counts) and fresh derivation caught it every time.
Personal/unverifiable claims get `FLAG: author-reported`. Claims that were
checked and must not return get a banned-content row.

## 4. Author pages

**Conventional:** one file per slide in `pages/NN-slug.md`, registered in the
`src:` manifest. `layout: full` comes from headmatter `defaults:`; stanzas
are just `src:` lines. Footers are `<OdFooter />` with no page prop (numbering
comes from Slidev nav). Scripted demos: use `useScriptedDemo()` in a
deck-local component (`examples/agent-experience/components/AxErrorCards.vue`
is the reference); the page stanza declares `clicks: N`. Never timers.
Charts are `<OpenChart :spec>` specs with the addon's slide theme ("Charts" in
`.claude/rules/deck-patterns.md`)<!-- decks:repo-only -->; for chart-type choice,
encodings, annotations and the spec API, load the `openchart` skill
(`.claude/skills/openchart/`, pinned to the OpenChart version the decks
render with), and let `deck-patterns.md` win where they disagree<!-- /decks:repo-only -->.

**Story:** one `<Name>Stage.vue` per slide in `<deck>/components/`, on
`useStage` (`.claude/rules/story-stage.md`). Its `COPY` array carries the
slide's prose, not the page file; the page is the header comment,
`<XStage />`, and a trailing presenter-notes comment (`SAY (opening)` plus one
`[click]` per click; "The stage page and its presenter notes" in
`.claude/rules/story-stage.md`). A `data/*.ts`
module per slide, provenance-commented (`.claude/rules/deck-data.md`), holds
the figures the stage draws. **Restart the dev server after adding, moving,
or deleting a component file**: Slidev's auto-import list is built at
startup, so a new component renders as "Failed to resolve component" until
the server restarts. Known build-breaker for both branches: a blank line
inside 4+-space-indented HTML becomes an indented code block and fails with
"Element is missing end tag".

## 5. Verify (in this order)

```bash
bun run check                 # manifest vs pages/ drift + unregistered decks    (every edit cycle)
<!-- decks:repo-only -->
bun run typecheck             # first-party TS errors (node_modules noise filtered)  (every edit cycle)
bun run test                  # unit suites + story guards (beats incl. COPY lint, durations, frame units, vt-names)  (every edit cycle)
<!-- /decks:repo-only -->
bun run shot <alias> <n> [clicks]  # per-slide screenshot, card lead, chip position, console errors  (story: after each new/changed stage; restart the dev server first)
<!-- decks:repo-only -->
bun run snap <alias>          # whole-deck pixel walk                            (only around an addon refactor)
bun run snap:diff <a> <b>     # diff two walks; on the pitch, s01-c0/s04-c2/s04-c3/s13-c0 have a noise floor, everything else should be 0.000%
<!-- /decks:repo-only -->
<!-- decks:user: bun run snap <alias>          # whole-deck screenshot walk                       (before and after a theme or styles change) -->
bun run build <alias>         # must pass before any review                      (before handing off)
<!-- decks:repo-only -->
bun run lint                  # prose lint (also enforced by the write hook)      (before handing off)
<!-- /decks:repo-only -->
<!-- decks:user: bun run lint                  # prose lint incl. story COPY (also enforced by the write hook)  (every edit cycle) -->
bun run review-prose <alias>  # prose-audit prompt for a reviewer that did not write the deck  (before handing off)
bun run fact-extract <alias>  # every number in the deck, to trace to data-sources.md   (before handing off)
```

`shot` and `snap` start a dev server for the deck on a free port and stop it
after, and warn when a story headline wraps past one line. To shoot after every edit, start one with
`bun run dev <alias> --no-open --port N` and pass `--port N` to each `shot`.

Export for stage/PDF: `bun run export <alias>` (flags are picked from
`decks.json`, don't pass your own).

## 6. Review-agent brief

A design or architecture review of a story stage runs read-only, with no
branch switching or commits (spawn it read-only or in its own worktree).
Findings are `file:line`. Every proposed figure has to name the
`data-sources.md` row or the `data/*.ts` constant it comes from. A proposal
that introduces a number with no citation is a prompt to look the number up,
not copy to paste into the slide. Two figures from a past design review were
wrong for exactly this reason and would have shipped unread.

## 7. Definition of done (story deck)

<!-- decks:repo-only -->
1. `bun run check`, `bun run typecheck`, `bun run test` clean, and the story
   guards (`beats`, `durations`, `frame-units`, `vt-names`) report scanning
   this deck.
<!-- /decks:repo-only -->
<!-- decks:user: 1. `bun run check` clean (manifest drift plus lint errors, story `COPY`
   included), and each stage's `COPY` length, beat count and the page's
   `clicks:` agree (`.claude/rules/story-stage.md`). -->
2. `bun run build <alias>` succeeds.<!-- decks:repo-only --> For a change to `packages/decks/` or to
   the story engine, `bun run build:all` (every registered deck, galleries
   included).<!-- /decks:repo-only -->
3. `bun run lint` clean.
4. Prose audit. `bun run review-prose <alias>` walks the deck and prints a
   review prompt: every visible string (headlines, card copy, chips, SVG
   labels) and the presenter notes, each with its slide, click and source
   line, plus the writing rules. Hand it to a reviewer that did not write the
   prose (a fresh subagent or another model), apply or answer each row of the
   table it returns, then re-run `lint`. The lint catches fixed phrases; this
   catches the shapes it can't, such as balanced antithesis or a card that
   describes the visual. An orchestrator's draft headlines (in an outline or
   a brief) are claims still to be rewritten, and they pass this audit before
   they go into a brief, because agents copy draft headlines.
5. Every figure `bun run fact-extract <alias>` lists is traced (run the
   `fact-checking-a-deck` skill); `data-sources.md` has a section per visible slide, every
   `FLAG` row resolved or carried deliberately, the banned-content table
   current.
6. Dev server restarted after the last component was added; `bun run shot`
   on every new or changed slide prints `errors: none`, no headline-wrap
   warning, and a card lead per click that matches the `COPY` entry.
7. Every stage page ends with presenter notes in the story-stage format:
   `SAY (opening)` for beat 0, then exactly `clicks` plain `[click]`
   paragraphs.<!-- decks:repo-only --> `beats.test.ts` checks any notes a page has; it does not
   require them, so this item is what makes a new deck carry them.<!-- /decks:repo-only -->
<!-- decks:repo-only -->
8. For a refactor of `packages/decks/`: `snap` baseline before, `snap:diff` after,
   every frame under its noise floor or explained, never widened.
<!-- /decks:repo-only -->
<!-- decks:user: 8. For a theme or shared-styles change: a `snap` walk before and after, and
   every changed frame explained. -->
9. `bun run export <alias>` produces a PDF with every click state
   (`animated: true` set).
10. The author's own visual QA is the last step, and the only one that judges
    aesthetics.

## 8. Publish

`bun run build <alias>` writes a static site to `dist/<name>` (`outDir` and
`base` in `decks.json` `_config`, overridable per deck). Host it anywhere that
serves static files.

`shot`/`snap` check resolution, card copy, and pixel regression; they are not
aesthetic QA. The author does their own visual QA and signs off on how the
deck looks. Do not treat a clean `shot`/`snap` run as that sign-off.

## Session hygiene

- Run git from the repo root with root-relative paths.
- One deck per agent session. package.json/decks.json edits belong to the
  orchestrator when multiple deck agents run in parallel.
- Review agents must never `git checkout` another branch in the shared working
  tree: spawn them read-only or in a worktree.
