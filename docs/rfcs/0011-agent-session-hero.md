# RFC 0011: an agent session as the landing hero, and a guide page on working with agents

Status: Draft. Revised after a landing-page review (the decisions it changed are listed under "Review changes"); the session is scripted rather than recorded, at the user's direction.

## Problem

Decks is a slide framework built for coding agents. You describe a talk, the agent writes it from real data, checks its own work, and you refine it in conversation. The landing page shows none of that workflow:

- The hero is a tagline, a four-line lede, an install command and a `DeckPlayer` cycling the example decks (`site/src/pages/index.astro`). A prospect sees good slides, but not how they were made, so Decks reads like any slide tool with nice themes.
- The agent section (`#agent`) doesn't render. It needs a `keeling` entry that `site/src/data/examples.json` no longer has (`index.astro:32-34,107`), and the hook-denial panel inside it is gone with it. Nothing on the live page shows an agent at work.
- The guide has no page on working with an agent. The landing page's "Writing decks with an agent" link goes to `decks init` in the CLI reference, which covers which files get installed, not how to prompt.

Within the first viewport, a prospect should see an agent build an animated deck from a prompt and then change it on request.

## Evidence

- `@steamfield/ui` 0.4 is a site dependency. Its headless `useAgentDemo` hook compiles a scripted session and exposes the view plus `play`, `pause`, `seek` and `replay` controls (`steamfield-ui/src/react/agent-demo/use-agent-demo.ts`). The `AgentDemo` component adds a `stage` slot beside the transcript. A view carries `turnStarts` and `turnEnds`; the current turn index is on the hook's result, not on the view.
- `DeckPlayer` (`site/src/components/landing/DeckPlayer.tsx`) plays a built example deck in an iframe, with a slide `range` for the guide demos. Two of its behaviours matter here:
  - It runs its own clock: a 1500ms opening hold (`:413`), then a dwell of at least 3000ms per step (`site/src/lib/player/format.ts:43`).
  - A ranged demo starts and takes its poster on the range's last slide (`site/src/data/demo-examples.ts:30-33`).
- The kit has everything the session's deck needs: `StoryStage` and `ChartSteps` for a chart that builds in beats, and the motion templates `title-reveal`, `word-swap` and `bar-board`.
- RFC 0010 put the motion vocabulary in the kit (`bar-board`, `word-swap`, the role curves), so a request to make the bars snap in has a polished result to land on.

## The experience

### First viewport

The hero head shrinks so the demo starts inside the first viewport:

- **Desktop (≥1024px):** a two-column hero. The left column holds the H1 (`Build animated presentations with coding agents.`), a one-line lede and the two buttons. The right column holds the demo, starting no more than 200px from the top of the page at 1280×800. The install command moves directly under the demo, still above the fold at 1280×800.
- **Phone:** the H1, then the deck player, then the transcript, then the install block (the deck comes first, with no caption line above it). The player's top edge sits within the first 844px at 390px wide.

The `hero-in-media` fade goes away for the demo. Its poster paints at once and is the LCP element.

### The demo

The demo is one component, `AgentSession`, with a terminal transcript and a deck player:

- **Desktop:** side by side. The player takes about 60% of the width, because the slides carry the visual half of the pitch.
- **Phone:** stacked.

### Keeping the transcript and the deck in sync

The whole pitch is that what you ask for is what you get. So the deck shows exactly what each prompt asks for, at the moment the agent says it's done, and never before. Every turn has three phases, and the deck is the clock:

1. **Ask.** The prompt types into the terminal. The player holds still on the state the request starts from:
   - for turn 1, an empty first slide;
   - for a new slide, the end of the previous turn;
   - for a refine, the slide being changed, in its current form.
2. **Work.** The tool calls stream. The player keeps holding, so the viewer still sees the "before" while the agent edits it.
3. **Land.** The agent's lead line ("Done. The bars now snap in…") appears, and the transcript pauses. On that line, the player plays the result forward from its first step: the new slide's entrance, or the refined slide's builds. When the result has played, the transcript resumes and the next turn begins.

The text and the payoff never compete for the eye, and nothing on the deck changes until the agent says it changed.

What the deck plays must match what the prompt asked for, in two ways:

- **Words.** Every phrase the prompt quotes appears on the result slide verbatim. If the prompt says the title is "Slides your agent can animate.", that's the title that rises in.
- **Style.** Every style the prompt names is the one the slide uses. "scoreboard style" lands on `bar-board`, and "a reel" of swapped words lands on `word-swap`.

The script records both for each turn (`quotes` and `uses`), and a test checks them against the result slide's source (plan item 1). A copy edit that changes only one side then fails the build.

There's one set of controls: play/pause, replay and a turn list in the terminal's title bar. `DeckStage` has no controls of its own. After the last turn, the demo holds for 4 seconds on the finished deck and loops.

### The player: a new one, not a refactor

The hero needs a deck previewer that a script drives exactly. `DeckPlayer` (`site/src/components/landing/DeckPlayer.tsx`, 793 lines) is built for the opposite job: a viewer browsing decks. That decides whether this is a refactor or a new player.

| | `DeckPlayer` today | What the hero needs |
| --- | --- | --- |
| Who drives it | The viewer (keys, clicks, the example switcher, the rail, gallery picks), with autoplay as a fallback | The transcript script, and nobody else |
| Who owns the clock | The player: a 1500ms opening hold, then a reading dwell of 3–9s per step from the caption's word count (`lib/player/format.ts:43`) | The parent: hold until told, play a range when told, report when it's done |
| Its hardest code | Acknowledged navigation: a `desired` position reconciled with what the deck reports, steering keys back into a range, pausing on attention (`DeckPlayer.tsx:202-418`) | None of that: one command at a time, resolved when the deck has settled |
| UI | Title bar, transport, counter, captions, rail, fullscreen, live status | The slide, and nothing else |
| Reasons to change | Browsing and reading: the gallery, captions, blog and guide demos | Demo choreography |

The two share the iframe and its message protocol, and almost nothing above that. Their reasons to change are different. Routing the hero through `DeckPlayer` would mean either threading a "driven" mode through its navigation reconciliation, which exists to handle viewer input the hero never has, or first extracting a controller from that code with only the hero as the reason. Both fight the player rather than use it.

So the hero gets a new player, `DeckStage`, and `DeckPlayer` is left as it is. The shared layer stays where it already is: `site/src/lib/player/protocol.ts` (message parsing and command builders) and `example.ts`. `DeckStage` builds on those directly. Nothing gets extracted from `DeckPlayer` now. Two players with similar boot code are better than one abstraction shaped by a single new caller. If later `DeckPlayer` work wants the stage's controller, it can move onto it then, with its own reason.

What is shared, and does help the existing player, is the runtime side. The embed protocol (`packages/runtime/src/embed/protocol.ts`) knows only `next`, `prev`, `nextSlide`, `prevSlide` and `go(slide, beat)`, and both players lack the same two things:

- a way to put a position on screen without animating it
- a way to choose which way a transition plays

`DeckPlayer`'s guide demos work around both today. A ranged demo boots on its range's last slide (`data/demo-examples.ts:30-33`), and its replay jumps back from the last slide to the first, which plays the transition in reverse. So the protocol additions belong to the runtime, help both players, and are the one place this RFC changes code `DeckPlayer` relies on.

**Protocol additions** (`packages/runtime/src/embed/`, and the protocol section of `docs/architecture.md`):

- `show { slide, beat }` puts that position on screen settled: no transition and no entrance motion. The deck runs that one move with motion `instant`, then goes back to live motion.
- `go` gains `direction: "forward" | "backward"`. With `direction`, the transition plays that way regardless of slide order. A non-adjacent `go` uses the deck-wide `transition` (else `fade`), so the demo deck sets one. Motion mode is a single `data-deck-motion` attribute (architecture 4.3), so `show` downgrades it to `instant` for one move (it never upgrades a reduced-motion deck) and the base mode returns when that move settles or a newer command supersedes it. `go` with `direction` is used by turn 5, which returns to the reel from the end of the deck and plays forward.
- No driven-embed flag: `DeckStage`'s frame is `inert`, so no key, pointer or focus reaches the deck, and the stage ignores captions.
- Each command's `requestId` already comes back on its matching `settled` state (`embed.ts`), so a caller can wait for the deck to have really finished. Nothing to add there.

**`DeckStage`** (`site/src/components/landing/DeckStage.tsx`, with a framework-free `site/src/lib/stage/controller.ts` under it):

- The controller owns one iframe. Its methods return promises that resolve on the deck's settled report, never on timers:
  - `ready()`
  - `show(slide, beat)`
  - `go(slide, beat, { direction })`
  - `play(range, { dwellMs })`
  - `cancel()`

  One command is in flight at a time, and a new one cancels the pending one.
- The component renders the 16:9 slide canvas with rounded corners and the theme's shadow, and nothing else: no transport, counter, caption, rail or status text.
- Its poster crossfades to the live frame once the first `show` settles.
- The frame is `inert` and `aria-hidden`. The stage carries its own label, describing what the agent built so far.
- `AgentSession` drives it: `show(hold)` on the prompt, `play(result)` on the lead line. Docs ship no islands, so the guide keeps `DeckPlayer` through its `demo=` fences.

**Not in this RFC:** improving `DeckPlayer` itself. If it should adopt `show`, so guide demos boot on their first slide and replay forward, or move onto the stage's controller, that's a separate change, judged on what it does for browsing.

### The session

#### What it has to prove

A prospect gives the hero 10 to 40 seconds. In that time the demo has to show the job Decks does from start to finish, not a tour of features. Decks' value props, and where the session shows each one:

| Value prop | Where it shows |
| --- | --- |
| An agent turns a brief and your data into a whole, presentable deck | Beat 1: one prompt, then the full deck flips through |
| Data storytelling: charts that build in steps, with figures traced to a source | Beat 1: a story-stage chart advancing in beats, and `data-sources.md` being written |
| Motion graphics that look produced | Beats 2 and 3: a reel opener and a scoreboard build |
| Refining by conversation | Beats 2–4: each is one plain-English sentence |
| The agent checks its own work | Beat 4: `decks film` and `inspect` catch a slide that overflows at presenter size, the agent fixes it, and `lint` passes |
| It ships as a real talk | Beat 5: a static build and a PDF |
| It's your repo: MDX and React files you can read and diff | Every beat: the tool calls name the files they write |

Left to the rest of the page: theming (the themes section), the presenter view and remote presenter, code blocks, 3D, and the live terminal. They're real value, but each needs its own explanation, and the hero's job is the core loop.

The first draft of this RFC failed that test. "Make a reel about Decks" is a meta subject nobody would present, its one chart had no story, and it never showed a deck being finished. The session below is a realistic talk instead.

#### The brief

A fictional platform team presents at Thursday's all-hands: their CI build time fell from 14 minutes to 4. The data is two CSVs the user hands the agent (`examples/agent-hero/data/build-times.csv` and `changes.csv`, the minutes each change saved), so the figures trace to a file in the repo, as a real team's would. The fine print says the team and its data are illustrative.

#### Five beats in about 35 seconds

Each beat follows the ask, work, land rhythm. The prompt types in about 0.8s, and each beat shows three or four tool calls at most, each a single line. The deck's result carries the time.

| # | Prompt | Shown calls | Player holds | Player lands | Time |
| --- | --- | --- | --- | --- | --- |
| 1 | "Turn build-times.csv into a 5-slide talk for Thursday's all-hands: our builds went from 14 minutes to 4." | loads `building-a-deck` and `deck-data`; reads the CSV; writes `data-sources.md` and `slides/01…05.mdx`; `decks check` ✓ | an empty first slide | a quick flip through all five slides: the `title-reveal` cover, a story stage whose chart steps through the weeks, a stat slide, the three changes that did it, and a close | ~11s |
| 2 | "Open with a reel: 'Builds were slow.', then 'flaky.', then 'fast.'" | adds `slides/00-reel.mdx` (`word-swap`) | the cover | the swap through exactly those words | ~6s |
| 3 | "Make the drop hit harder: show what each change saved, scoreboard style." | moves the stat slide to `bar-board` | the plain stat slide | the minutes each change saved snapping in as bars, largest first, the biggest saver accented | ~6s |
| 4 | "Check every slide at presenter size." | `decks film`, `decks inspect` (the close overflows its box), the fix, `decks lint` ✓ | the crowded close | the fixed close | ~6s |
| 5 | "Ship it." | `decks build` → `dist/`; `decks export --final` → `talk.pdf` | the fixed close | the reel playing once more, as the finished deck opens | ~5s |

The total is about 35 seconds, then a 4-second hold on the finished deck, then it loops. The test for the length: by 12 seconds, a viewer who stops watching has already seen a whole deck made from data. By 30 seconds they've seen the motion, the refining and the checks.

To keep the arc readable for someone who isn't watching every frame, the terminal's title bar shows the five beats as a labeled strip: Draft, Reel, Chart, Check, Ship. The current beat is highlighted, and each label jumps to its beat. Someone scanning the page reads the whole workflow from the strip without waiting for it.

Beat 1's flip-through is the one place the deck plays more than one slide. It uses a hero dwell of about 1.5s per slide, with only the story stage's beats stepped, so the full deck lands within the first 12 seconds.

#### Truthfulness

The session is scripted, so it has to stay true to what an agent with this plugin actually does:

- Every command, skill and template it names exists.
- Every slide it claims to produce is in the demo deck, and matches the request in words and style.
- Every figure on a slide traces to the CSV through `data-sources.md`, as `deck-data` requires.
- Beat 4's overflow is one `decks inspect` really reports on the crowded close, and the deck's copy carries no lint findings: the demo never ships a deliberately bad sentence.

A test checks all of it (plan item 1).

The fine print under the demo reads: "An illustrative session with a fictional team's data. Every slide is a real Decks slide, from examples/agent-hero." It quotes no time or cost. That also stops a prospect expecting a five-slide deck in 11 seconds from their own first prompt; the guide page says what a real first draft takes.

### Before it plays, and without motion

- **First paint:** the transcript shows turn 1's prompt as already submitted, and the player shows turn 1's hold: the empty first slide, in the deck's theme. The title rises into it about 4 seconds later, once the agent's lead line appears.
  - The hook runs with `beforeStart: "start"`, and turn 1's typing time is set to zero.
  - A `<noscript>` holds `StaticTranscript`, with all five prompts and leads, beside the cover's poster. That's the no-JS and crawler view.
- **Reduced motion:** the hook's reduced view shows that static view, and `DeckStage` shows the poster of the finished deck's last slide.
- **Playback starts** when the demo is 15% in view (the package's gate). Above the fold, that means on hydration.

### The phone transcript

On a phone the transcript shows prompts and leads only. That's a second, compiled script with the tool calls left out, so no dead air takes their place. The server renders the static view, and the component picks the script after hydration with `matchMedia`, so there's no hydration mismatch.

### The guide page: "Working with an agent"

The page is `docs/guide/agents.md`, in the guide nav after Getting started. It covers:

1. **Set up:** `decks init`, with a link to the CLI reference.
2. **The loop:** describe the talk, watch it with `decks dev`, ask for changes, check sources with `deck-data`.
3. **Prompting** for four jobs:
   - creating a deck from data
   - refining an animation
   - adding a reel graphic
   - asking the agent to check its own work

   Each section shows that turn of the scripted session: its transcript, rendered statically at build time from `agent-session.ts`, and a `demo=` player on that turn's range of `examples/agent-hero` that plays live once scrolled into view. The live player counts toward the guide's three-player cap (`deck-demos.ts:10`).
4. **What keeps it honest:** `decks check`, `lint`, `shot`, `film`, `inspect`, the prose hooks (the hook-denial panel moves here), and `data-sources.md`.

The transcript stays static on docs pages, because docs ship no islands (`site/.claude/rules/site/ui.md`). Only the existing demo player script mounts there.

### The rest of the landing page

- **The example gallery player** moves into the examples section, `client:visible`, and that section's lede ("the player at the top of the page") is rewritten. Gallery picks (`PICK_EVENT`, `__decksPick`) scroll to the player's new place.
- **The landing would run three deck iframes** (hero, motion showcase, gallery), but no more than two are ever live at once: the gallery's player only boots when a reader scrolls to it.
- **The dead `#agent` section and its Keeling code** are removed.

## Plan

1. **The demo deck and the script.**
   - Author `examples/agent-hero`, with every hold and result state in beat order: the empty first slide, the plain stat slide that beat 3 replaces, and the crowded close that beat 4 fixes. Add `data/build-times.csv` and the `data-sources.md` that traces every figure to it. List the deck as unlisted in `examples.json` so it builds and gets posters but stays out of the gallery.
   - Write `site/src/data/agent-session.ts`: the `DemoScript`, plus for each turn a `hold` slide, a `result` range, its `quotes` (phrases the prompt quotes) and its `uses` (templates and curves the prompt names). Keep it as code rather than a fixture.
   - Done when:
     - the deck passes `decks check` and `decks lint`;
     - the script validates with `validateScript`;
     - a drift test checks that every `decks` subcommand, skill and template the script names exists (the CLI's command list, `plugins/decks/skills/`, `MOTION_TEMPLATE_BEATS`);
     - a fidelity test checks, per turn, that every `quotes` phrase appears in the prompt and verbatim in the result range's slide source, and that every `uses` entry appears in the prompt's wording and in that source;
     - each turn's `kind` (`new`, `refine` or `revisit`) and `hold` are explicit: turn 2 holds the cover the reel goes before, a refine holds the slide being refined, and turn 5 holds the end of turn 4.
2. **Protocol, then `DeckStage`** (see "The player"), as two changes:
   1. **Protocol.** Add `show` and `direction` in `packages/runtime/src/embed/`. Update `docs/architecture.md`'s protocol section, and leave `DeckPlayer`'s behaviour unchanged.
      - Done when: a Playwright spec against a fixture deck shows four things. `show` paints the target's final step with no transition frames (a MutationObserver log of transition classes stays empty). `go` with `direction: "backward"` plays the reverse transition. `show` under reduced motion stays instant afterwards. `DeckPlayer`'s existing specs pass untouched.
   2. **`DeckStage` and its controller.**
      - Done when: specs drive a real built deck through `show`, `go` and `play`, including a `play` cancelled midway, and assert on the state each promise resolves with. The stage renders only the canvas (axe passes). Poster and frame swap with no blank frame. Re-rendering with equal props sends no command.
3. **`AgentSession`** (`site/src/components/landing/AgentSession.tsx`, built on `useAgentDemo`).
   - It renders the transcript beside a `DeckStage`. Through the controller, it calls `show(hold)` when a turn's prompt starts and `play(result)` when the lead line starts (`onStepStart`). It pauses the transcript on the lead line, resumes it when `play` resolves, and loops with `onComplete` plus `replay`.
   - It uses the phone script below 768px after hydration, and the `noscript` static view.
   - Add it to `site.islands`.
   - Done when: a browser test records the transcript's step starts and the deck's slide and step changes into one ordered log in the page, then asserts on the log after the loop completes, not on timings. The log must show that, for every turn:
     - the player shows the `hold` slide from the prompt's start through the last tool call;
     - the result range starts only after the lead line appears;
     - the next prompt starts only after the result range ends;
     - the loop returns to turn 1's hold.

     It also checks that the static, no-JS and reduced-motion views render.
4. **Hero layout** (`index.astro`, `config.ts`, `landing.css`).
   - Done when Playwright shows: at 1280×800, the demo's top edge is at or above 200px and the install command is visible without scrolling; at 390×844, the player's top edge is inside the viewport. The demo's poster paints without waiting for hydration, and the axe check passes. LCP is measured in the lab trace (Verification), not asserted.
5. **Guide page and events.**
   - Write `docs/guide/agents.md`, add the transcript-and-poster fence, and point the landing links at the new page.
   - Add `agent_demo_turn_reached {turn}`, `agent_demo_completed`, and `example_opened` from the hero to `src/lib/events.ts`.
   - Done when: the drift test checks each fence's turn against `agent-session.ts`, and the events fire once each in a browser test.

## Scope

In scope: the demo deck and scripted session, the embed protocol additions, `DeckStage` and its controller, `AgentSession`, the hero layout, the guide page, demo events, and removing the dead `#agent` code.

Out of scope:

- A live agent on the page. Nothing calls a model.
- A Codex version of the session. The guide says the same skills work in Codex.
- Recording a real session. The session is scripted (see "The session").
- Changes to `@steamfield/ui`. If the hook falls short (for example, a built-in loop), that's raised there separately.

## Verification

- The site gate, and the browser tests in plan items 2–5.
- **Load timing:** a throttled lab trace (cold cache, a mid-tier phone profile and a desktop profile) of the page's first seconds. The poster paints at first contentful paint, and turn 1's first tool call shows within 1.5s of hydration. This is a measurement for the PR, not a gate test, because the repo's tests don't compare wall-clock times.
- **First impressions:** before merging, five developers who already use a coding agent watch the hero for 30 seconds, and five more watch today's hero as a baseline. Each says what Decks does. The new hero passes if at least four of five name all three: an agent builds a whole deck from their data, the deck is animated, and they can change it by asking. It also has to beat the baseline.
- **After launch:** the share of hero views that reach beat 3 and beat 5 (`agent_demo_turn_reached`), and install-command copies per landing view. There's no meaningful pre-launch baseline (PostHog has no key yet, site `AGENTS.md`), so these track the hero over time rather than as a before-and-after comparison.

## Review changes

| Finding | Change |
| --- | --- |
| Refine turns show nothing changing; turn 1 already played the final chart | One authored demo deck that holds each turn's state, including the "before" of a refine, as its own slides. Each turn is a slide range |
| Two clocks: the player's dwell would be cut off by the next turn, and a new range object every render resets it | Each turn runs ask, work, land: the deck holds the "before" while the agent works, plays the result on the lead line, and the transcript waits for it. The controller's `show` and `play`, and an ordered-log test |
| (User) The current player is too heavy and can't be driven precisely; a new player or a refactor? | A new player, `DeckStage`, because its job and its reasons to change differ from `DeckPlayer`'s. They share the runtime protocol additions (`show` and `direction`), which help both. `DeckPlayer` itself is untouched |
| (User) Does the demo show a coherent arc and Decks' full value in a watchable length? | It didn't: it was a meta reel with one chart and no ending. The session is now a realistic all-hands talk from a CSV, in five beats (draft, reel, chart, check, ship) and about 35 seconds. The whole deck lands by 12 seconds, a labeled beat strip shows the arc at a glance, and a table maps each value prop to a beat |
| (User) What the deck plays must be what the prompt asked for | Each turn's `quotes` and `uses` are checked against the result slide's source |
| The split sat mostly below the fold (about 540px down at 1280×800, about 900px down on a phone) | Two-column hero head, player-first stack on phones, the install block under the demo, no fade on the media |
| The 0s state contradicted the components (last-slide poster, hidden first boot, `beforeStart` default, the fade) | A poster on the range's first slide, `beforeStart: "start"` with zero typing for turn 1, `noscript` static view, driven forward play with no hold |
| An invented "night buses" topic would fail provenance, the hero's own differentiator | A fictional team's build times from a CSV in the repo, traced through `data-sources.md` and labelled illustrative |
| A cube transition is the least distinctive capability | Turn 4 is the agent checking its own work with `film` and `inspect`, showing what really happened |
| The Keeling section doesn't render today | Corrected in Problem; its dead code is removed and the hook panel moves to the guide |
| Two transport bars | One set of controls in the terminal bar; `DeckStage` has none |
| `AgentDemo` has no responsive tool-call mode | A second compiled phone script, chosen after hydration |
| Docs ship no islands | Static transcript at build, plus the existing demo player script only |
| Time and cost figures would mislead | The session is labelled illustrative and quotes no time or cost |
| (User) A slide with a deliberate cliché for the lint to catch puts slop in the demo deck | Beat 4 shows `inspect` catching a layout overflow instead; the deck's copy passes `lint` |
| The 10-second test, the analytics baseline and timing on the demo clock were all invalid | A 25-second test with agent users against a baseline, demo events, and a throttled lab trace |

## Decisions

The open questions were settled on the recommendations: beat 5 lands on the finished deck, not the presenter view; the hero has no "Browse example decks" tab; turn 1 holds on an empty slide; and on a phone the deck comes first with the transcript under it.

On the transcript: `site/AGENTS.md` says no transcript line is typed by hand. This session is the one exception, and the drift and fidelity tests (plan item 1) stand in for a generator.

The phone script is derived from the one `DemoScript` by dropping its tool calls, so there is one source.
