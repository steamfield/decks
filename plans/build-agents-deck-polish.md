# Build: agents-deck-polish

Take `examples/building-for-agents` from 8/10 to 9/10 for the Austin JS talk, which is within a
few days of 2026-11-16. Polish, not a rewrite.

Landing: integration worktree `.claude/worktrees/agents-deck-polish`, branch
`feat/agents-deck-polish`, cut from `main` (094eaa0). Merge to main only when Riley says so.
Execution: I orchestrate; Codex runs do the coding through foreman (`execute:codex`, newest sol
model, high effort), contracts from `.claude/delegate/contract.md`, rules from `AGENTS.md` and
`.claude/delegate.md`. Gate: `rr run --local "bun run check"` in the worktree. Deck checks:
`bun run decks check`, `bun run decks lint agents`, `bun run decks build agents`.
First step after approval: copy this plan to `plans/build-agents-deck-polish.md` on the branch.

## Context

Four things hold the deck at 8/10.

1. Two of the seven product slides (OpenData, OpenChart) do not belong in this talk.
2. The talk describes CLIs but never runs one. The outline planned "release valves" (leave the
   deck for a terminal) and a `SPEAKER-GUIDE.md`; neither was built.
3. The rr (slide 10) and Stacks (slide 4) system-design animations are too fast to follow.
   Measured from the timelines: rr replays its simulation at 2.25x to 3.4x real time, so a lock
   probe is on screen for 0.07 to 0.27 s and click 3 packs a release, two waits, a bounce, an
   arrival and a lock into 2.4 s. Stacks click 2 shows fail, fix and pass in 2.8 s with 0.34 s
   per verdict.
4. The framework has no live terminal (`docs/feature-gaps.md` has no row for it). Slidev has none
   either: its checkout at `~/Projects/slidev` (437f139c) contains no xterm, pty or ttyd code,
   only the Monaco code runner. The third-party `slidev-addon-liveshell` wraps ttyd and stops
   working in build and export.

## Decisions settled with Riley

- Remove the OpenData and OpenChart slides and their thread stations. Passing factual mentions
  stay (the 14,000-test origin line, rr fixtures recorded from OpenData runs, commit data).
- Live terminal: a real shell in the slide when presenting from `decks dev`, with a recorded
  fallback everywhere else. Deck-local now; an RFC and a feature-gaps row for promoting it to
  the kit after the talk.
- An arrow key sends a prepared command to the real shell. Clicking into the terminal allows
  free typing; Esc gives the keys back to the deck.
- The rr demo runs against the real hosts, with the recording as fallback.
- The 3 minutes freed by the removal go to three live demo slots.

## The arc after this work

Five tools, twenty slides. New slides are marked NEW; the rest are renumbered (slide files must
be `NN-slug.mdx` with unique numbers, so inserting means shifting).

| # | Slide | Change |
| --- | --- | --- |
| 01 | cover | lede says five tools |
| 02 | two-users | none |
| 03 | thread | five stations: Start, Delegate, Test, Watch, Present |
| 04 | stacks-loop | slower, one more beat (fail and pass get a click each) |
| 05 | stacks-live | NEW. Live: `stacks new`, `stacks verify`, the exit code |
| 06-07 | stacks-tour, stacks-output | renumbered only |
| 08-10 | foreman session, daemon, question | renumbered only |
| 11 | rr-locks | slower, more beats, one event per click |
| 12 | rr-live | NEW. Live: a real `rr` run beside `rr monitor`; hands off to 13 |
| 13 | monitor-to-glass | renumbered only |
| 14 | glass-boundary | pacing pass (packet travel, holds) |
| 15 | glass-browser | renumbered; offline poster instead of the "loads in slide view" text |
| 16 | glass-cli | renumbered only |
| 17 | glass-live | NEW. Live: `statglass now` and `statglass history` on this laptop |
| 18 | decks | renumbered only |
| 19 | habits | six habits by five tools; a row left with fewer than two lit cells is cut |
| 20 | close | five tools |

Why these three slots: each demo follows the slide that explains the mechanism, so the audience
knows what to watch for, and each proves the claim made just before it. The rr demo ends on a
live `rr monitor`, which is the literal subject of the next headline ("StatGlass started as the
rr monitor command"). foreman gets no live slot: its demo takes 3 minutes and whether the
delegate asks a question depends on the model.

Time, counted honestly: 27.5 min of script today, minus 3.0 (two slides), plus 3.5 to 4.5 of
demos, plus about 1.5 for the notes on the new beats (rr gains three clicks, Stacks one). That is
30 to 31 minutes with no slack. So: slide 17 ships with `hide: true` and is restored only if a
rehearsal runs short; new beats get short notes (about 12 s, not 25); `SPEAKER-GUIDE.md` carries
clock checkpoints and the beats to drop on stage.

## Live terminal design (deck-local)

```
examples/building-for-agents/
  term/protocol.ts      event names and message types shared by plugin and component; no logic
  term/sessions.ts      session state: one pty per session id, which steps have run, reset; pure
                        logic with the spawn function passed in
  term/plugin.ts        Vite plugin: wires sessions to Vite's dev WebSocket (custom events); the
                        only module that imports node-pty; wiring only
  components/LiveTerm.tsx (+ .module.css)   one pane: fallback TermPane, or xterm when live
  components/LiveDemoStage.tsx              a demo slide: headline, 1 or 2 LiveTerm panes, card,
                                            rail; data-driven
  data/05-stacks-live.ts, 12-rr-live.ts, 17-glass-live.ts   steps (prepared commands), card
                                            copy, recorded fallback transcripts
```

Behaviour (revised after the devil's advocate review; see the log at the end):

- Transport is Vite's existing HMR socket (`server.ws.on` / `import.meta.hot.send` custom
  events). No new port, no `ws` dependency. `deck.config.ts` registers the plugin through
  `vite.plugins`, which `packages/node/src/dev/server.ts:40` already supports.
- The pty comes from macOS `script -q /dev/null zsh -f`, spawned with plain pipes, with
  `stty rows R cols C` sent first. No native module, so nothing new installs on Linux CI, the
  tarball test or Workers Builds (`examples/*` is a workspace, so a `node-pty` dependency would
  install everywhere and bun does not run its install script). `node-pty` is the fallback only
  if `script` cannot drive `rr monitor`, and adding it is a question to Riley.
- Opt-in: the plugin does nothing unless `DECKS_LIVE_TERM=1` is set when `decks dev` starts. CI,
  e2e and ordinary dev never spawn a shell.
- Fallback is the default render. The component shows the recorded transcript through the
  existing `TermPane`, stepped by click, tagged `Recorded <date>`. It swaps to xterm (tagged
  `Live`) only after the server answers a handshake, and only when
  `renderContext === "slide" && isActive && view === "play" && !embedded` (the gate
  `layers/above.tsx:17` uses). Build, export, shot, presenter, overview, print and the site embed
  always get the recording. `import.meta.hot` guards the xterm import so a build drops it.
- A session is a `zsh -f` in a fresh temp directory outside the repo (the Vite watcher reloads
  on file adds inside the deck), with a plain prompt that carries a ready marker and
  `DO_NOT_TRACK=1`, so no personal prompt or rc output reaches the projector.
- One session per pane id, owned by the server; every window attaches to the same one. The
  server keeps a bounded output buffer and replays it on attach, so a reload or a remount shows
  the session as it stands.
- Steps: a command is sent only on a forward step of exactly one click, only for a step that has
  not run, and only when the shell is back at its prompt marker. Otherwise the pane shows `busy`
  and sends nothing. Stepping back, jumping from the overview and arriving from the next slide
  send nothing. The session resets only when the slide becomes active at click 0.
- xterm sits in a counter-scaled host (the fix `docs/architecture.md:1818-1823` records for
  OpenChart), with a font size from the frame scale, fixed rows and columns, no fit addon and
  no cursor blink. Esc is caught with `attachCustomKeyEventHandler` and blurs the terminal.
- Command cards (added 2026-11-16 at Riley's request): each prepared command is shown as a
  syntax-highlighted snippet with a play button. Play advances the slide by one click, the same
  path as the arrow key. The terminal opens on the first play, the command sits at the prompt
  for about 0.6 s, then runs.
- This is what makes presenter mode work: keys go to the presenter window, the click syncs to
  the audience window over BroadcastChannel, and the audience window's slide sends the command.
- Error model: pty spawn failure, native module load failure, a dropped socket or a shell that
  exits all return the pane to the recording with a one-line `Live unavailable: <reason>` tag;
  the reason is also logged by the dev server. Nothing throws into the slide, because
  `shot`/`export` fail on any console error.
- Safety: a shell on a socket is remote code execution for whoever can reach the dev server.
  The plugin refuses to start sessions unless the server is bound to localhost, and it is off
  by default.

Dependencies, changed by me in the example's `package.json` only: add `@xterm/xterm` 6.0.0 at
the start of Phase 1; remove `@opendata-ai/openchart-engine` in Phase 0.

The bridge unit proves a `script` round trip (a command, its output, the prompt marker, and
`rr monitor` drawing at a set size) before it builds any UI, and stops to ask if that fails.

## Animation pacing rules (slides 04, 11, 14)

Durations stay `DUR` tokens or sums and multiples of them (precedent:
`examples/aisd-showcase/components/WaffleStage.tsx`). The rr simulation model in
`data/10-rr-locks.ts` is a port of rr's `flow.ts` and is not changed; only `STILLS`, the beat
list and the tween durations change.

- Simulation playback at most 1.25x real time while an event is happening (probe, lock, bounce,
  retry, release). Idle stretches (tests running) may run faster, as a separate chained tween.
- One event per click. rr goes from 3 simulation clicks to about 6: agent 1 locks three hosts;
  sync then tests; agents 2 and 3 bounce and wait; a retry fails and the waiting event appears;
  agent 1 releases and agent 2 takes the freed host; agent 4 arrives and locks without waiting.
- A hold of `DUR.eraseHold` between two events inside one click (precedent:
  `examples/opendata-pitch/components/PipelineStage.tsx`), never at the end of a click's
  segment: `use-timeline.ts:49-67` squeezes the next segment into the time left when a click
  lands mid-tween, so a trailing hold would speed up the next beat. Each click's segment is
  capped at about 3 s, which also bounds the rewind when stepping back.
- Lead-in: on each beat the actors that are not part of the event drop to the dim level before
  the event starts, so the eye is already on the right chip.
- Stacks loop: command typing and file drop slow to about double; click 2 splits into "verify
  fails at 393 s, packet returns to the agent" and "agent fixes, verify passes at 501 s"; the
  gate's 15 step squares resolve in sequence.
- Glass boundary: packet travel on `DUR.gather`, a hold when the sample lands.
- Each new beat gets a card (8-word lead, 20-word body), a `[click]` note paragraph and a
  resting frame that makes its point as a still, because presenter, export and reduced motion
  show stills.

## Units

Each is one Codex run in its own worktree. Phases are sequential; units inside a phase run in
parallel and own disjoint files.

### Phase 0: trim and renumber (one unit, nothing else runs)

`trim-renumber`. Delete slides 15 and 16 with their stages, CSS, data, code excerpts, sources and
`data-sources.md` sections. Cut `opendata` and `openchart` from `ProductId` and `PRODUCTS`
(`data/products.ts`); fix everything typed on them. Rewrite the hardcoded "seven" strings (cover
lede, slide 3 headline and cards, close title, `OPEN_SOURCE` in `data/19-close.ts`, notes).
Re-verify the habits matrix and its headline against five columns. Rename slide, data, source
and fixture files to the numbering above, leaving 05, 12 and 17 free. Update `OUTLINE.md`,
`SPEAKER-NOTES.md`, `data-sources.md`. Also: `ThreadRail.module.css:8` hardcodes
`repeat(7, 1fr)`; data file headers and `OUTLINE.md:633` cite old slide numbers. Done when
`decks check`, `decks lint agents`, `decks build agents`, typecheck and the deck's hand-run data
tests pass, no deleted name is imported anywhere, and a grep for `\b7\b|seven|Slide \d+` across
`components/`, `data/` and the three `.md` files has only explained hits.

Then me, inline: `bun remove @opendata-ai/openchart-engine` in the example; rewrite the two
`docs/guide/kit.md` passages (75 and 333-350) against a stage that still exists, re-condensing
the snippet instead of repointing it; record the Stacks demo transcript with `script`; commit
`term/protocol.ts` and a fallback-only `components/LiveTerm.tsx` (a wrapper over `TermPane`
with the final props) so the two terminal units below share a fixed seam; add
`examples/*/term/*.test.ts` to the `examples` vitest project.
Tag `phase-0`. Demo: the 17-slide deck plays end to end.

### Phase 1: demo slide, terminal bridge and pacing (four units in parallel)

| Unit | Owns | Done when |
| --- | --- | --- |
| `demo-stage` | `components/LiveDemoStage.*`, `components/EvidenceTag.*` (adds `Live`), `slides/05-stacks-live.mdx`, `data/05-stacks-live.ts`, its source file | Slide 05 plays the recorded Stacks transcript by arrow key in dev, `decks build` and `decks shot`, with no console error. No new dependency. This alone is a demoable slide if the bridge slips |
| `term-bridge` | `term/sessions.ts`, `term/plugin.ts`, their tests, `components/LiveTerm.*`, `deck.config.ts` | With `DECKS_LIVE_TERM=1`, a `LiveTerm` pane runs prepared commands in a real shell under the rules above; without it the pane is unchanged |
| `rr-pacing` | `components/RrLocksStage.*`, `data/10-rr-locks.ts` (renamed 11) and its test, `slides/11-rr-locks.mdx` | Pacing rules met; the stills test passes with the new `STILLS`; the port-parity test still passes |
| `stacks-pacing` | `components/StacksLoopStage.*`, `slides/04-stacks-loop.mdx`, `components/GlassBoundaryStage.*`, `slides/14-glass-boundary.mdx` | Pacing rules met; `clicks:` matches COPY length minus 1 |

`term-bridge` tests: `term/sessions.test.ts` runs in the gate and covers the step rules with a
recording fake spawn passed in (a repeated step is ignored; a step while busy is not sent; a
jump of more than one click sends nothing; a second attach gets the buffer; reset on
activation; an exited shell reports once; an unknown pane id is an error that names it). One
integration test runs a real `script` shell through a real Vite server (`echo` round trip),
macOS only, run by hand and said so in its header. A
Playwright check of the fallback render at each click goes in the unit's verification, not as a
committed spec, since the deck is not an e2e fixture.

Shared files no unit edits: `SPEAKER-NOTES.md`, `OUTLINE.md`, `data-sources.md`. Each unit hands
back its note paragraphs and source rows; I merge them. Tag `phase-1`. Demo: slide 05 live,
slides 04 and 11 at the new pace.

### Phase 2: the other two demos and the speaker guide (two units in parallel)

| Unit | Owns |
| --- | --- |
| `live-demos` | `slides/12-rr-live.mdx`, `slides/17-glass-live.mdx`, `data/12-rr-live.ts`, `data/17-glass-live.ts`, their sources; two panes on slide 12 (`rr monitor` and a real run) |
| `speaker-guide` | `SPEAKER-GUIDE.md` (timing table with a running clock, pre-talk checklist, per-demo script with the exact commands and the line to say if it falls back); `components/GlassBrowserStage.*` offline poster in `public/` |

The rr demo runs in this repo against four machines. I edit `.rr.yaml` myself (no unit touches
it): add `mbp` as the last host (it already exists in `~/.rr/config.yaml` as `local: true`; last
in the list so everyday gates still prefer the minis, since rr takes the first host it can lock
in config order), and add a `demo` parallel task of four shards (`bun run test --shard=N/4`), so
one arrow key shows a run fan out across all four hosts while `rr monitor` shows four cards in
the other pane. That is the real version of slide 11's "a parallel task takes every host" beat.
All hosts have a Tailscale SSH fallback in the global config. I time the task on the real hosts
(target under 20 s warm) and trim the shard command if it runs long. Before the units start I
capture the fallbacks myself, since a Codex worktree cannot produce them: the rr run and
`statglass` output as transcripts, and the `rr monitor` pane as a still image (a redrawing TUI
does not fit `TermLine[]`), each with a `data-sources.md` row. If running rr from inside the
repo triggers a Vite reload in rehearsal, the demo moves to a clean clone outside it.
Tag `phase-2`.

### Phase 3: finish (me)

`docs/feature-gaps.md` row and `docs/rfcs/0008-live-terminal.md` (what the deck-local version
proved, what a kit version needs). Regenerate the site recording and posters (`make -C site
demo`), since `site/fixtures/examples/building-for-agents.json` pins 19 slides and 68 states.
Fresh-agent prose review of every new visible string. Cold-cache gate, `check:isolated`,
`test:tarball`, `make -C site ci-fresh`. `docs/delegation-log.md` rows and `AGENTS.md` lessons.

Cut order if time runs short: offline poster, glass-boundary pacing, slide 17, slide 12. Phase 0,
the two pacing units and slide 05 are the floor.

## Assumptions Riley can override

- Slide 3 keeps "Most started inside OpenData" even though OpenData is no longer a station.
- foreman gets no live demo.
- `SPEAKER-GUIDE.md` is in scope because the demos need a script and a checklist.
- No framework package changes. If a unit needs one, it asks.
- StatGlass's hosted demo is not vendored into the deck; slide 15 gets a poster for offline.

## Verification

- Per unit: its contract's scoped commands, then `rr run --local "bun run check"` in its
  worktree before merge, and again on the integration branch after each merge.
- Pacing: I record slides 04, 11 and 14 at each click with Playwright video against `decks dev`
  and check every click against the rules above; Riley watches the same clicks before merge.
- Fallback: `bun run decks shot agents 05 <n>`, `12 <n>`, `17 <n>` for every click, plus
  `decks export agents`, all without `DECKS_LIVE_TERM`.
- Live: `DECKS_LIVE_TERM=1 bun run decks dev agents`, then each demo slide driven by arrow keys
  from the presenter window with the audience window unfocused; step back and forward; reload
  mid-demo; kill the shell mid-demo; disconnect the network on slide 12.
- Pacing also gets a back-step check: two steps back on slides 04 and 11.
- A rehearsal pass by Riley on the real hosts, at the projector's resolution with the CRT layer
  on, before the talk.

## Log

Devil's advocate review, 2026-11-16, eight findings, all applied: `script` replaces `node-pty`
as the pty source; step rules rewritten for busy shells, jumps, reloads and second windows;
counter-scaled xterm host and an Esc handler; holds moved off segment ends; Phase 0 gained the
rail CSS, stale slide numbers and the kit.md rewrite; the terminal unit split into `demo-stage`
and `term-bridge` behind a seam I commit first; fallback captures moved to me; the time budget
restated at 30 to 31 minutes with slide 17 hidden by default.
