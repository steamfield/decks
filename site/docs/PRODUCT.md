# Decks landing page: product spec

> Status: rebuilt (2026-11-02) from the RFC `plans/2026-11-02-decks-site-agent-first-rfc.md` in the opendata repo, Phase 3. That RFC holds the reasoning, the rules R1-R6 and the decisions; this file is the spec as built. History is at the end.

## TL;DR

A one-page site plus docs for Decks at `site/` in this repo, scaffolded with `stacks new astro-product-site`. Decks is a Claude Code setup plus the Slidev components data talks need, so the page shows that loop: a prompt goes in, and a real deck comes out that you can step through on the page. The hero is a player: the prompt and the run's figures in a title bar, the deck in a frame sized to fit the first viewport, and a caption bar under it with the current step's text as page text and the controls. Everything shown is real product output, labelled with how it was made.

## Problem

- **Who:** a developer or technical speaker who gives data-heavy talks, uses Claude Code, and may already use Slidev. Secondary reader: the agent itself, via `llms.txt` and the docs.
- **What:** agents asked for decks produce generic prose and unsourced numbers, and Slidev's `v-click` makes a chart that builds in steps and rewinds cleanly a hand job every time. Decks gives the agent a setup (`decks init`: an agent, skills, rules, a prose-lint hook) and the components.
- **Evidence:** the talks Decks was extracted from; the recorded run `keeling-run.jsonl` (47 turns, 16.8 minutes, $2.61) that drafted the Keeling-curve deck from NOAA Mauna Loa data in a fresh `decks init` project; and the earlier run `smoke-1.jsonl` (87 turns, 8.3 minutes, $3.17) that drafted the tides deck with this repository's own setup.

## Job to be done

When I have a talk with real numbers in it, I want to see what the agent produces from a prompt and step through it, and learn quickly whether it fits my setup, so I can decide whether to start my next talk with Decks.

## Rules (from the RFC)

- **R1.** The player (title bar, frame, caption bar) is fully visible at 1440x900 and at least 80% visible at 1280x800 with the frame's top above 40% of the viewport. It is the widest element on the page. e2e, poster and booted states.
- **R2.** The caption is page text at body size under the frame, at 1440, 1280, 768 and 360, and changes with each step. The in-slide story card is never the reading surface. e2e.
- **R3.** Every visual is real product output, labelled with how it was made. Every landing image comes from `/posters/`, `/stills/`, `/loops/` or `/og/`. Build test.
- **R4.** No theme borrowed from another domain, and no chrome that needs explaining.
- **R5.** A visitor tells cause and effect from the first viewport. A five-person user test, a release gate.
- **R6.** Copy follows the writer rules; headings label topics. `make build` runs the package's prose lint over the landing text.

## Page outline

The strings live in `src/config.ts`, `src/pages/index.astro`, `sections.tsx` and `DeckPlayer.tsx`. Everything deck-specific comes from `src/data/examples.json` and generated fixtures, so swapping the hero is a registry entry plus fixtures.

1. **Hero.**
   - Header row: H1 "Slide decks about data, written with Claude Code" and the lede on the left; on the right, the three install lines with one copy button and "Free, Apache-2.0".
   - Player title bar: the run's prompt as a terminal line and "Claude Code · N min · N turns · $N"; for an example with no run, its title and provenance.
   - Frame: sized by viewport height so the whole player fits (R1). Before interaction it shows a muted loop from the real deck (three steps forward and three back, or back first when the start step is near the end) when motion is allowed, else the poster. The first interaction boots the live deck in an inert iframe at the step the loop was showing.
   - Caption bar: the current step's lead and body as page text (R2), controls (slide back, step back, play/pause, step forward, slide forward, full screen), step pips, the `slide · step/steps` counter and "Open the deck". The player takes focus and handles the arrow keys.
   - Phones (under 768px): the same parts stacked, 44px controls, "Open the deck (best in landscape)".
   - Under the player: "Drafted in N minutes from this prompt …, then fact-checked and edited in a second Claude Code session (+A/−B in C files)." (or "then edited by hand" for a hand edit) and up to two before/after caption lines from the edit, from git.
2. **Requirements and limits:** Claude Code, Slidev with `slidev-theme-the-unnamed` and dark slides, Node 20.19+ or 22.12+, PDF export only, OpenChart at its release candidate. The only place the page lists them.
3. **What you get:** the real file tree after `decks init` and `decks new my-talk --story`, generated at build time by running both in a temp directory, each file annotated in a few words. Then one line on iterating, with `decks dev`.
4. **How the agent builds a deck:** the recorded run's transcript, static and abbreviated, and the hook panel: a planted line, the hook's real denial from a scratch `decks init` project, and a plain note that it was a test write.
5. **Example decks:** 16:9 thumbnails with provenance ("Drafted by Claude Code …, then edited by hand (+A/−B in C files)", "From the talks Decks was extracted from", "Template deck"). Picking one loads it into the hero player and scrolls there. Then the v-click comparison.
6. **Themes:** the same slide under the default theme and under `demo/warm-theme.json`, with that file.
7. **Install:** bun, npm and pnpm tabs, each with the install line, `-p slidev-addon-decks decks init` and `decks new`; then the cost line from the run.
8. **Footer.**

## Design

The page and the deck must not blur together. Decks renders on `#09090b`; the page sits one step lighter and the deck reads as an object on it.

| Role | Value | Source |
|---|---|---|
| Page background | `surface #111113` | default.json |
| Panels | `surface-raised` | default.json |
| Deck frame | the deck's canvas `#09090b` inside a 1px `borders.axis` edge and a 16px band (8px on phones) | default.json |
| Text | `text.primary/secondary/muted/faint` | default.json |
| Data and live state (pips, counter) | cyan ramp | default.json |
| Action (play) | amber step 2 `#f59e0b` | default.json |
| Body and headings | Inter (variable), self-hosted | the face slides use |
| Code and transcript | JetBrains Mono | |
| Radii | 12px player and media, 6px controls, 4px chips | product |

- Tokens are read from `default.json` at build time (`src/lib/tokens.ts`); `src/styles/tokens.test.ts` checks contrast.
- Product components stay out of the chrome: page callouts are plain panels, never the story card.
- Identity comes from the deck, the transcript and the real files. No textures, patterns, glows or extra display faces.
- The landing page is dark only. Docs keep the light/dark toggle and the two-theme axe check.
- Motion only where the product moves: the hero loop, then the live deck, behind `prefers-reduced-motion: no-preference`. No sound, the H1 doesn't animate, nothing flashes above 3 Hz.
- OG cards: the page title and description over the hero deck's poster, in the landing colors.

## The embed contract

Deck side in the addon (`bun run test:embed` at the repo root).

- Parent to deck: `{ type: 'decks:cmd', cmd: 'next'|'prev'|'nextSlide'|'prevSlide'|'go', slide?, beat? }`. `prev` from beat 0 lands on the previous slide's last beat; `nextSlide`/`prevSlide` land on beat 0; `go` takes a 1-based slide and clamps it.
- Deck to parent: `decks:ready`, then `decks:meta {title, slides, slideTitles}`, then `decks:state {slide, slides, beat, beats, lead, body, settled, direction}` with `settled: false` on each move and `true` once motion stops. `beats` is the last beat index, so a slide has `beats + 1` steps. `lead`/`body` are empty on non-story slides, and the page falls back to the slide title.
- The iframe is same origin under `/demo/<name>/` (`routerMode: hash`), `inert`, `tabindex="-1"`, titled "{deck title}, controlled by the player". It loads on the first interaction at `index.html#/{slide}?clicks={step}`; a deck that opens elsewhere is sent `go`. Messages from any other source or origin are ignored. A deck that doesn't answer in 15 s gets "The deck didn't load." and a link.
- `aria-live` announces "Slide N of M, step B of K." plus the lead on each settled step.

## Docs (`/docs/`)

- Getting started: Quickstart, Your first story deck, Add Decks to an existing Slidev deck.
- Concepts: Beats and the story timeline, Ink marks, Story vs conventional decks.
- Guides: Theming with `theme.json`, Writing decks with an agent, Checking a deck, Exporting to PDF.
- Reference: `decks` CLI, `decks.json`, `theme.json` tokens, Components.

The content-drift test checks every command shown (hero, install tabs, the dev line, the docs) against `deck.mjs` and the package's `bin`, and requires the `-p slidev-addon-decks` form everywhere.

## Success measures

`install_copied` per session (after release), `player_played`, `beat_stepped` per session, `example_selected`, `docs_quickstart_viewed`. Guardrails: page weight before interaction at or under 350 KB at 1440, loop included (e2e); axe clean; R1 and R2 at four sizes; the R5 user test before release.

## Open items

- **R5 user test:** five people who use Claude Code or Cursor; a release gate.
- **Launch:** the GitHub links 404 and the install lines fail until the repo is public and the package is on npm.

## The hero deck

The hero is `examples/keeling`, the Keeling-curve story deck from the RFC's Phase 2, and tides moved to the gallery.

- **The run.** A scratch project with only `bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed` and `bunx -p slidev-addon-decks decks init`, committed before the run; then `claude -p "make a 5-slide story deck about what the Keeling curve shows about atmospheric CO2" --output-format stream-json`: 47 turns, 16.8 minutes, $2.61. `scripts/excerpt-run.mjs keeling-1` turns the log into `fixtures/keeling-1.json`; the log itself stays outside the repo, as `smoke-1.jsonl` does.
- **Not a stranger's clean machine.** The project had nothing but `bun add` and `decks init`, but the machine also had the user's global `~/.claude/CLAUDE.md`, which Claude Code loads in every project. That is visible in the run: the agent called `on-port` and `wait-for`, helpers that file names. A visitor's results will differ by whatever their own global setup adds.
- **Commits.** The raw agent output (6a5b4b1), the plumbing (3f8f992: `decks.json`, `routerMode: hash`, `test:embed`), and the edit (60dcbfd), each on its own so the edit's diff stands alone. `edits` in `examples.json` diffs 3f8f992..60dcbfd.
- **The edit** was made by a second Claude Code session after a fact-check that re-downloaded the NOAA files and matched all 23 figures. It fixed the six copy issues the fact-check raised, replaced slide 4's "The climb is getting steeper" (the 1990s mean is below the 1980s) with a comparison against the 1960s, added a build-time check that the 2020s mean stays above the 2010s (the "faster still" card rests on six years), and moved the byline from the user's name to Claude Code. The page labels it "fact-checked and edited in a second Claude Code session", never "by hand".
- **Start frame:** slide 5, step 2 (`startSlide: 5`, `startBeat: 1`): the headline, the halfway rule at 2002, the chip and the card all say the same thing. The loop runs back three steps into slide 4 and forward again, since slide 5 has only one step after the start. From the end of the deck, Play starts over at the first story slide.

## Measurements

Production build (`astro preview`), 2026-11-02, 1440x900, before interaction, with the keeling loop playing: 309 KB (text gzipped). Loop 127 KB (WebM), fonts 68 KB, the React client 64 KB, HTML 18 KB, poster 13 KB, CSS 8 KB. Re-measure after any change to fonts, the poster, the loop or the hero; the e2e weight test fails above 350 KB.

## History

The first build (2026-11-02, `plans/landing-page.md` and `plans/landing-copy.md`) dressed the player as a 90s hi-fi stack: a TV for the deck, a cassette deck as the controller, a shelf of cassettes with J-cards, VU meters, a VFD and five display faces. It looked good but read as a Slidev addon with a theme, not an agent setup; the caption under a TV was secondary; and the hardware needed explaining. The RFC above replaced it with the agent-first page: the run in the title bar, a frame sized to the viewport, the caption as page text, real files and real runs throughout. The hi-fi components, styles, sounds and fonts were removed in the same branch.
