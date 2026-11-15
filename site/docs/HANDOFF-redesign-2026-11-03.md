# Decks redesign handoff

## Status and stopping point

The user rates this iteration **6/10**, up from 2/10. The target remains 9/10.
This is a checkpoint, not design acceptance. The user requested a commit,
local merge to `main`, this handoff, and then a stop. Do not push or deploy.

The implementation received independent code and visual reviews. Their checks
do not override the user's quality assessment. Further design work is required.

## Decisions to preserve

- Decks is an agent-first framework for animated presentations and storytelling,
  not exclusively data stories. Current headline: “Animated slide decks, built
  with agents.”
- Load the actual interactive deck by default. The user rejected recorded
  previews for low resolution and frame rate. Do not bring back a video/GIF
  preview or the recording-to-live handoff.
- Center the hero preview with a 1600px maximum width, independently of the
  narrower text container. Use 24px desktop and 12px mobile side gutters.
- Preserve the deck's 16:9 composition by scaling the whole canvas uniformly.
  Mobile must not reflow slide text, squash charts, or crop artwork. External
  captions and Fullscreen/Open deck support small screens.
- Keep agent guidance canonical, with thin platform adapters rather than
  duplicated authoring rules. Reference projects remain read-only.

## Implemented

- Graphite and ice-blue interface with distinct page, chrome, and control
  surfaces; Inter and JetBrains Mono; compact introduction and revised header.
- Supporting page order: showcase, getting started, actual Keeling agent
  evidence, examples/themes, requirements/docs. Technical evidence is retained
  behind disclosures.
- Self-contained OpenData files/dataset/graph and AISD campus grid/scatter/map
  excerpts, using the real engine and preserving source provenance. Runtime
  builds do not require the sibling OpenData checkout.
- Live deck startup with a sharp poster and loading overlay. Reveal waits for
  the expected scene and any queued navigation to settle. Default playback
  includes an opening hold; reduced motion starts paused.
- Stable toolbar geometry across loading, interactive, and failure states;
  explicit slide/step position, named chooser, progress, accessible controls,
  stable captions, fullscreen containment, retry, and chart interaction hints.
- Serialized navigation with desired-destination coalescing, command IDs,
  completion acknowledgements for boundaries/no-ops, stale-session protection,
  timeout/retry, and preserved first navigation during loading.
- Opt-in embed input bridge. Manual navigation and meaningful chart hover/focus
  pause playback, as do hidden/offscreen states. Standalone deck behavior and
  editable/chart controls remain available.
- Packaged guidance audited against `../opendata/talks/.claude`: authoring,
  rhetoric, animation, transitions, story lifecycle, provenance, checks, and
  exemplars are included. Canonical `AGENTS.md` supports Codex, Cursor,
  Windsurf, and OpenCode; Claude/Gemini import it, and Copilot has a scoped
  instruction adapter. Automatic hooks remain Claude-specific. Native authoring
  sessions have not been exercised in all seven applications.
- Installer migration preserves unrelated project instructions. Destination
  preflight rejects unsafe symlinks/collisions before writing any files.
- Project/site documentation and regression coverage updated for these contracts.

## Verification at the checkpoint

- Root unit suite: 291 passed, one existing platform skip.
- Installer suite: 65 passed.
- Packaged npm and Bun install tests: 16 cases / 271 assertions passed, no skips.
- Real embed checks across three built decks: 74 assertions passed.
- Root deck check and lint passed; lint retains a pre-existing SkepticsStage
  rhetoric warning.
- Site lint and type checks passed. Final site unit suite: 256 passed.
- Site build acceptance: 23 passed on the reviewed build.
- Independent code review approved the final startup readiness and interaction
  fixes. Visual review checked the current live-only layout at 360, 390, and
  1440px and found no blocking overflow or control-geometry regression.
- `git diff --check` passed before the checkpoint commit.
- Final browser run: **57/58 passed**. The mobile graph forward/reverse test
  stalled at slide 2, step 2 to 3. It passed in the preceding run; this is an
  unresolved intermittent failure, not waived. Reproduce it with the retained
  trace and determine whether it is engine, coordinator, or test synchronization
  before changing timeouts or weakening the assertion.
- Final captures were refreshed: six full-page sizes, player states, continuous
  live interaction, and first-Next proofs. The browser report and failure trace
  are preserved with the local review artifacts. The complete quality gate has
  not passed because of the failure above and the user's design assessment.
- Network budget checks passed: shell/poster 271–321 KB; live deck 696 KB
  separately; zero recording requests or video elements. These figures use gzip
  estimates for text plus encoded binary bytes, not uncompressed wire totals.

## Next work toward 9/10

These are proposed review priorities, not a claim that every item is a confirmed
bug. Start by reviewing the current page with the user; do not equate passing
tests with presentation quality.

1. **Establish the next visual direction with one complete showcase slice.**
   Compare the real desktop and mobile experience with `../rr/site`,
   `../kelvo/docs-site`, and `../stacks-api/apps/web`, without copying their
   identity. Review hierarchy, typography, spacing, density, surface contrast,
   and how the introduction frames the deck. Resolve this composition before
   expanding another site-wide styling pass. One design owner evaluates the
   whole page.
2. **Make the first interaction feel immediate and intentional.** Review cold
   loading, poster-to-live continuity, initial autoplay, and the first Next and
   Previous at every startup point. Check that state labels, captions, and
   motion agree, with no toolbar movement or apparent restart. Measure actual
   live asset/network cost and time to useful interaction before optimizing;
   the claim that live decks are lighter than recordings was not established.
3. **Polish the authored presentation sequences themselves.** Review OpenData
   and AISD independently of the landing page against the source talks. Check
   readable holds, elegant forward/reverse motion, continuity across slide
   boundaries, graph settling, campus detail discovery, and loop behavior.
   Any rough transition in the demo is a product-quality problem even if the
   player correctly acknowledges it.
4. **Improve the rhythm of the whole page.** Reassess supporting sections as a
   continuous composition: installation clarity, evidence prominence, example
   selection, theme presentation, and the final documentation route. Remove
   repetitive or visually weak blocks only when a concrete replacement improves
   the reading sequence. Avoid decorative gradients and generic card grids.
5. **Complete mobile and input review.** Check 360/390px, tablet, and mobile
   landscape with actual touch interaction. Confirm slide geometry remains
   identical, external captions remain readable/stable, controls stay reachable,
   chooser focus is correct, and fullscreen contains the whole slide. Verify
   campus tap/hover/focus behavior without accidental navigation.
6. **Finish the acceptance evidence and remaining checks.** Run the documented
   site unit, build, browser, and accessibility checks against the final merged
   dependencies. Capture full pages at 390/1440/1920px, plus 360px, tablet, and
   landscape checks; loading, interactive, chooser, failure, and fullscreen;
   continuous first-input, forward/reverse, switching, and AISD exploration.
   Compare the same slide/step across widths. Include rapid/alternating inputs,
   loading inputs, boundaries/no-ops, replay, stale sessions, retry, reduced
   motion, and offscreen/hidden pause using real excerpts as well as stubs.
7. **Validate cross-agent authoring in practice.** Run representative clean
   project authoring sessions in the supported agents, checking that each finds
   and follows the shared guidance. Keep native integration claims separate
   from packaged-file and installer checks. Add adapters only for demonstrated
   discovery gaps, not duplicated rule sets.

Completion remains blocked by unresolved clipping, blurry rendering, ambiguous
state, inaccessible controls, abrupt startup, rough transitions, or inconsistent
page composition. Obtain user acceptance of the design quality before calling
the 9/10 target achieved.

## Where to resume

- Site composition: `site/src/pages/index.astro`, `site/src/styles/landing.css`,
  `site/src/styles/tokens.test.ts`, `site/src/lib/tokens.ts`.
- Player: `site/src/components/landing/DeckPlayer.tsx`, `site/src/lib/player/`.
- Embed protocol/input: `packages/decks/setup/embed.ts`,
  `packages/decks/composables/embed-navigation.ts`.
- Excerpts: `examples/opendata-showcase/`, `examples/aisd-showcase/`.
- Fixture/poster generation: `site/scripts/demo.mjs`; featured recordings were
  removed, while unrelated legacy recording tooling/assets were retained.
- Agent installation: `packages/decks/scripts/init.mjs`,
  `packages/decks/agent/README.md`, `packages/decks/agent/instructions.md`.
- Tests: player component tests, `site/e2e/site.spec.ts`, installer/tarball/embed
  suites. Commands are documented in root `AGENTS.md` and `site/Makefile`.
- Local review artifacts from this session are outside the repo in
  `/Users/riley/Documents/Codex/2026-11-03/this-is-still-very-low-quality-4/outputs/review`.

Main advanced during this work with two independent `@steamfield/ui` dependency
and ToolCallCard test commits. Preserve those changes when merging this
checkpoint. The verification above was performed in the isolated checkout
before integrating those main-branch dependency updates.
