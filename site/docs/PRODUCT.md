# Decks site

The site presents Decks as a slide framework for coding agents. It supplies slide components, animation tools and a presentation workflow for stories told through transitions and interactive visualizations. Visitors can explore real decks, then learn how to build their own with an agent. The installed agent setup currently targets Claude Code; the requirements state that limit. Presentation quality is the first evidence, and recorded agent runs show how a deck was produced.

## Composition

The header contains Decks, Examples, Docs and Install. A compact split introduction leads directly into a centered showcase with a 1600px maximum width. At 768px and above it retains at least 24px gutters; below that it has 12px gutters. Its width is independent of the narrower reading column and is never reduced to fit above the fold.

The player has an example picker and a sticky control strip above its 16:9 canvas. Captions stay below the canvas as readable page text. The complete slide scales uniformly at every size: no internal mobile reflow, stretched charts or cropped artwork. Fullscreen contains the complete slide with letterboxing. Page controls have 44px targets; the slide's own chart targets keep their original geometry.

Below the showcase: getting started, agent evidence, examples and themes, then requirements and docs. Full transcripts, scaffolded files and hook output live in labeled disclosures. Keeling supplies the agent evidence independently of the selected hero.

## Design

The page uses graphite surfaces (#10151d page, #19222e player chrome, #232f3e raised controls), #edf2f8 primary text, #b8c5d5 secondary text and #9bdcff actions, selection and focus. Deck artwork retains its theme. Inter supplies headings and body text; JetBrains Mono supplies code and numeric metadata. Headings use 44px desktop and 30px mobile type; body text remains 16–18px. Controls have 6px corners and the player has 12px corners. Fine borders and surface contrast establish depth.

## Featured excerpts

OpenData shows files consolidating into a dataset and becoming part of the dataset graph, preserving the shared transition across slides. AISD shows the campus grid, scatterplot and map, with campus details available through pointer, touch and focus. Both are attributed excerpts from existing talks, with self-contained sources and build dependencies in this repository.

The live deck runs by default. Sharp posters up to 1920px provide visual context while the selected iframe loads. Recorded video is not part of the player.

## Player states and navigation

The player loads the selected live deck when it hydrates in view. Its header says Loading… and the poster carries a small Loading interactive deck… label until the iframe is ready. Controls keep their positions throughout loading, interactive playback and failure. Previous and Next inputs made during loading remain queued. Live mode says Interactive and shows chart-specific interaction guidance. Failure retains visual context and offers Retry and Open deck.

The parent coordinates navigation one operation at a time, coalescing rapid input toward the desired position. Optional command identifiers are acknowledged through settled states, even at a boundary or an unchanged destination. Switching examples cancels old work. Inputs from a different origin or iframe are ignored. The opt-in embed input bridge routes navigation without disabling chart interaction or changing standalone decks.

Automatic live playback starts when the deck is ready and waits for settled motion and caption reading time. Manual interaction pauses it. Hidden or offscreen players pause. Reduced motion loads the interactive deck without automatic playback. No-JavaScript pages retain posters, deck text and standalone links.

## Acceptance

Run functional checks against both the protocol stub and real built excerpts. Cover rapid and alternating inputs, loading, boundaries, replay, stale sessions, retry, chart interaction, focus, fullscreen and reduced motion. Verify the same slide and step at mobile and desktop sizes for unchanged wrapping, positions and relative proportions.

Review full-page captures at 390, 1440 and 1920px, plus checks at 360px, tablet and mobile landscape. Capture loading, live, chooser, failure and fullscreen states. Review continuous recordings of initial live loading, forward/reverse motion and example switching. Clipping, blurry desktop media, unclear state, inaccessible controls, abrupt loading transitions or inconsistent section composition block completion even if automated tests pass.

The shell and poster budget is 350 KB. Live deck assets load for the selected deck when the player hydrates in view and are measured separately. Recorded-video budgets and frame-rate targets are not release gates. Preserve source provenance, literal copy, generated metrics, existing docs support and the accessibility checks.

## Earlier Keeling showcase

The previous hero was `examples/keeling`, the Keeling-curve story deck from the RFC's Phase 2, and tides moved to the gallery.

- **The run.** A scratch project with only `bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed` and `bunx -p slidev-addon-decks decks init`, committed before the run; then `claude -p "make a 5-slide story deck about what the Keeling curve shows about atmospheric CO2" --output-format stream-json`: 47 turns, 16.8 minutes, $2.61. `scripts/excerpt-run.mjs keeling-1` turns the log into `fixtures/keeling-1.json`; the log itself stays outside the repo, as `smoke-1.jsonl` does.
- **Not a stranger's clean machine.** The project had nothing but `bun add` and `decks init`, but the machine also had the user's global `~/.claude/CLAUDE.md`, which Claude Code loads in every project. That is visible in the run: the agent called `on-port` and `wait-for`, helpers that file names. A visitor's results will differ by whatever their own global setup adds.
- **Commits.** The raw agent output (6a5b4b1), the plumbing (3f8f992: `decks.json`, `routerMode: hash`, `test:embed`), and the edit (60dcbfd), each on its own so the edit's diff stands alone. `edits` in `examples.json` lists the content commits, 60dcbfd and e8dd230 (the guard follow-up), each diffed against its parent; ac258c6 (a path-only fix) sits between them and is left out of the count.
- **The edit** was made by a second Claude Code session after a fact-check that re-downloaded the NOAA files and matched all 23 figures. It fixed the six copy issues the fact-check raised, replaced slide 4's "The climb is getting steeper" (the 1990s mean is below the 1980s) with a comparison against the 1960s, added a check that the 2020s mean stays above the 2010s (the "faster still" card rests on six years), which throws when the data module loads and runs in `bun run test` (`slidev build` bundles the module without running it), and moved the byline from the user's name to Claude Code. The page labels it "fact-checked and edited in a second Claude Code session", never "by hand".
- **Compared with tides** (the RFC's Phase 2 check that a fresh project does as well as this repository's setup):

  | | Tides (`smoke-1`) | Keeling (`keeling-1`) |
  | --- | --- | --- |
  | Setup | This repository's agent setup | A fresh project: `bun add` and `decks init` only |
  | Run | 87 turns, 8.3 min, $3.17 | 47 turns, 16.8 min, $2.61 |
  | Sources | NOAA tide predictions, USNO moon phases, NASA fact sheets | NOAA GML Mauna Loa CSVs; every figure is derived at load from a module a script generates from them |
  | What the draft leaves out | Nothing listed | A table of excluded claims in `data-sources.md` |
  | Review | Edited by hand: +49/−11 in 6 files | Fact-checked (0 wrong figures; 6 copy issues and 2 claims without a guard), then edited in a second Claude Code session (size in `fixtures/examples/keeling.edits.json`) |

  The fresh project did at least as well on sourcing: fewer turns, a lower cost, and figures computed from the source files rather than copied into constants. It took twice as long. The bundled tides exemplar (`agent/exemplars/tides` in the package) was the agent's model for the story slides. It wrote its own Playwright script for screenshots because `decks shot` didn't print where it saved them; `shot` prints each path since 4691f99 on main.
- **Start frame:** slide 5, step 2 (`startSlide: 5`, `startBeat: 1`): the headline, the halfway rule at 2002, the chip and the card all say the same thing. The loop runs back three steps into slide 4 and forward again, since slide 5 has only one step after the start. From the end of the deck, Play starts over at the first story slide.

## Historical measurements

Production build (`astro preview`), 2026-11-02, 1440x900, before interaction, with the keeling loop playing: 309 KB (text gzipped). Loop 127 KB (WebM), fonts 68 KB, the React client 64 KB, HTML 18 KB, poster 13 KB, CSS 8 KB. This is the previous combined page-and-loop baseline. Current budgets separate the shell and poster from live deck assets.

## History

The first build (2026-11-02, `plans/landing-page.md` and `plans/landing-copy.md`) dressed the player as a 90s hi-fi stack: a TV for the deck, a cassette deck as the controller, a shelf of cassettes with J-cards, VU meters, a VFD and five display faces. It looked good but read as a Slidev addon with a theme, not an agent setup; the caption under a TV was secondary; and the hardware needed explaining. The RFC above replaced it with the agent-first page: the run in the title bar, a frame sized to the viewport, the caption as page text, real files and real runs throughout. The hi-fi components, styles, sounds and fonts were removed in the same branch.
