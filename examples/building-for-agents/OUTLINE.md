# Building for agents: deck spec

This file is the build contract for the Austin JS talk deck. It is written so an agent with no prior context can build the deck from it. When the deck is scaffolded, move this file into the deck directory (`git mv OUTLINE.md examples/building-for-agents/OUTLINE.md`) and keep it current: if a slide changes, change it here in the same commit.

Everything below was gathered on 2026-11-13 by reading the product repos under `~/Projects`. Paths, line numbers and figures come from those reads and are secondhand to you. Before a figure or a code excerpt goes on a slide, open the file and confirm it (see "Numbers and provenance").

## 1. The talk

| | |
| --- | --- |
| Title | Building for agents |
| Full title (cover lede, meetup listing) | Building for agents: using TypeScript to build agent tooling and infrastructure. From CLIs to native macOS apps that support DX and AX. |
| Event | Austin JS meetup, November 2026 |
| Speaker | Riley Hilliard, Steamfield |
| Length | 30 minutes of content. Q&A is separate. The deck carries hidden extension slides that take it to about 38 minutes if the slot allows (section 9). |
| Audience | Working JavaScript and TypeScript developers. Assume they have used a coding agent (Claude Code, Codex, Cursor). Do not assume they know Effect, MCP internals, Tauri, or any Steamfield product. |
| Deck type | Story deck: one pinned visualization per slide, beats on arrow keys, prose in the stage's card. |
| Quality bar | `examples/texas-2026`, `examples/opendata-pitch`, `examples/aisd-showcase`. Read all three before designing anything. |

"DX" is developer experience: what a person sees at the terminal or in the app. "AX" is agent experience: what a coding agent reads, pays for in context, and acts on. Slide 2 defines both on screen. After that the deck uses the abbreviations freely.

## 2. Decisions Riley has already made

These came from a question round on 2026-11-13. Do not reopen them.

1. Repo "breakaways" are in-deck animated tours (a file tree that lights up beside real code). Each deep dive also has a release valve: an optional cue to leave the deck for a live demo, scripted in `SPEAKER-GUIDE.md`. The deck must work with every valve skipped.
2. Three products get deep dives of about five minutes each: Stacks, foreman, StatGlass. The other two (rr, Decks) get about 90 seconds each.
3. The spine is one piece of work moving from start to ship, told with real recordings stitched together. Each step shows something that happened, taken from artifacts already in the repos. It is framed as how work moves through the stack. It never claims to be one literal feature followed end to end.
4. The look is Steamfield synthwave, taken from steamfield.io and built as its own design system with a `DESIGN.md` and tokens, to the texas-2026 standard. Update, 2026-11-13: the deck matches the site hero's look and feel. Every slide sits inside the hero's CRT tube (scanlines, phosphor mask, grain, hum bar, tube corners, the slight barrel distortion) and uses its aged palette; the cover and close run the hero's three.js scene, with the sun rising over one minute. The heavy tape tracking noise is the one effect left out. `DESIGN.md` in this folder is the current design contract, and where section 6 below disagrees with it (the turned-down CRT, scanlines kept off code, the left-aligned cover, the site's full-saturation accents), `DESIGN.md` wins.
5. Effect is taught through the Stacks repo tour. There is no separate Effect primer slide. foreman reuses the ideas without re-explaining them.
6. The landing pages for steamfield.io and each product have animated system diagrams. Reuse them (section 7 is the inventory), and build new ones wherever an animated diagram explains a mechanism better than a static one.
7. Presenter notes are a full speakable script, one paragraph per beat, plus a `SPEAKER-GUIDE.md`.
8. The fleet: Riley typically runs 2 to 4 coding agents at once. This is author-reported; record it as `FLAG: author-reported`.
9. The close is a QR code to steamfield.io.
10. Byline: "Austin JS · November 2026".

## 3. Thesis and arc

The thesis, said once on slide 2 and paid off on slide 28: every tool Riley ships has two users, a person and a coding agent, and the agent support lives in ordinary engineering decisions about output, errors, exit codes and concurrency. None of the tools calls a model.

The thread is a verb per product, in the order work flows:

| Step | Product | Language shown on its chip | Depth |
| --- | --- | --- | --- |
| Start | Stacks | TypeScript · Effect 4 | Deep dive |
| Delegate | foreman | TypeScript · Effect 4 | Deep dive |
| Test | rr | Go | Brief |
| Watch | StatGlass | Rust + TypeScript | Deep dive |
| Present | Decks | TypeScript · Vue | Brief |

Honesty about languages is a rule (section 4). The title promises TypeScript; two products are mostly something else, and the deck says so on the object.

## 4. Rules every run follows

Deck mechanics:

- Read these before touching any file, in this order: `AGENTS.md`, `.claude/rules/deck-writing.md`, `.claude/rules/prose-patterns.md`, `.claude/rules/deck-patterns.md`, `.claude/rules/story-stage.md`, `.claude/rules/deck-data.md`, `packages/decks/story/README.md`, `.claude/skills/building-a-deck/SKILL.md`. Codex runs also read `.claude/delegate.md`.
- Every stage is built on `useStage`. `clicks:` in `slides.md` equals the COPY length minus 1. The orchestrator owns `slides.md`; a stage author whose beat count differs from this file says so in the hand-off and does not edit the manifest.
- Story cards are at most 8 words of lead and 20 words of body. `beats.test.ts` enforces it. The drafts in section 10 were counted by hand; recount them.
- Each slide has one claim headline ending in a period, one line where possible (about 50 characters), two lines at most.
- Durations come only from `DUR`, easings only from `SETTLE`, `DRAW`, `TRACE`. No raw `vw`/`vh`. No hex, radius or opacity literals in components.
- Each beat changes one thing. Earlier items dim to the `design.ts` dim level. A beat's resting state is set before its `beat(n)` label so seeking is exact in both directions.
- At most two live text zones per beat: the card plus one chip or label. Code panes and terminal panes count as the visualization, so keep their text to what the beat is about and dim the rest.
- Presenter notes are the trailing HTML comment on each page: `SAY (opening)` for beat 0, then one plain `[click]` paragraph per click, each speakable in about 25 seconds, then `IF ASKED`.
- Restart the dev server after adding a component file.

Content:

- No em dashes anywhere. No marketing adjectives. Product names keep their casing: StatGlass, Stacks, rr, Decks, foreman.
- Print the evidence status on the object, as a small pixel-type tag. There are three: `Recorded` (replays a real artifact; the tag carries the date), `Schematic` (a diagram of how something works, with no real data), `Illustrative` (made-up sample values). Never rely on a legend. A stage that mixes a recording with a schematic tags each part.
- Print the language on every product's first slide as a chip (the table in section 3). rr is Go. StatGlass is about 60 percent Rust and its agent CLI is Rust. Say these plainly; they are part of the talk, and slide 23 turns one of them into a point.
- Code on a slide is real code, quoted from the named file, trimmed with `// …` where lines are dropped. Never paraphrase code into something that would not compile. At most 14 lines visible at once, set no smaller than 24px at the 1920 canvas.
- Terminal output on a slide is real output from a fixture or a doc, or it is tagged `Illustrative`.
- Every figure comes from a `data/*.ts` constant that cites a row in `data-sources.md`. A figure with no row does not go on a slide. That includes figures in headlines, cards, chips and notes.
- Do not claim a speedup for rr. The README's "roughly a third" is an expectation, and the rr site's own blog says so. If a timing is needed, the only measured one is a README example: 52.9 s wall clock against 97 s summed across three shards.
- Do not say foreman "pushes" or "notifies" Claude. Claude is woken because a background `foreman wait` process exits (slide 14 is about exactly this).
- Do not say rr balances by load. It takes the first host it can lock, in config order.
- Do not say rr shards automatically. A shard is a task the user defines; a parent task lists them under `parallel:`.

### Prose audit

Riley has flagged AI-sounding prose in earlier decks, so prose gets the same rigor as code. The write hook blocks the worst patterns; that is a floor. Before writing any headline, card, chip, label or note, also read the `ce:writer` skill (`$HOME/.claude/plugins/cache/claude-essentials/ce/<newest>/skills/writer/SKILL.md` and its `references/forbidden-patterns.md`).

Check every visible string against these and rewrite any that match: balanced antithesis and seesaw pairs; negation then assertion; trailing contrasts used for drama; characterizing a fact instead of stating it; abstract nouns standing in for facts; triads; rhetorical questions; section-ending kickers; cards that describe the visual instead of the content; notes that restate the headline; recap openers ("So far we've seen").

Every stage hand-off includes a prose audit table: one row per visible string, with the patterns checked and what changed. Before the deck is called done, a fresh agent that wrote none of it runs `bun run review-prose agents` and the orchestrator resolves every finding.

## 5. Deck setup

```bash
bun run new agents building-for-agents --story --author "Riley Hilliard" --brand "Steamfield" --url steamfield.io
```

Alias `agents`, directory `examples/building-for-agents`, registry name `building-for-agents`, `"animated": true` (set by `--story`).

Files the deck ends up with:

```
examples/building-for-agents/
  OUTLINE.md            this file
  DESIGN.md             the design run writes it (section 6)
  SPEAKER-GUIDE.md      timings, the 30/40-minute switch, live-demo release valves
  slides.md             headmatter + manifest (orchestrator only)
  theme.json            Steamfield palette mapped onto the six hue slots
  data-sources.md       slide -> source map, with a "Numbers refresh" section
  pages/NN-slug.md      header comment, <XStage />, trailing notes comment
  components/           one *Stage.vue per slide + the shared parts in section 6.5 + design.ts
  data/                 one provenance-commented module per slide; data/code/ holds excerpts
  styles/tokens.css     font imports, type scale, spacing, radii, CRT values
  styles/index.css      how tokens attach to shared components; deck-local view-transition rules
  public/               fonts (Heros), the mark, any poster images
```

Headmatter is the story template from `examples/texas-2026/slides.md` with this deck's title, `exportFilename: building-for-agents` and fonts from `theme.json`. Keep `transition: { name: od-cut, css: false }` and `htmlAttrs: { data-od-story: "" }`.

Dependencies the deck needs that the repo may not have yet: fontsource packages for Orbitron (variable), Press Start 2P, VT323 and JetBrains Mono (variable); TeX Gyre Heros is self-hosted (copy the three woff2 files and `GUST-FONT-LICENSE.txt` from `~/Projects/steamfield/public/fonts/`). The root `package.json` pins `@steamfield/ui` at `~0.2.0`; the Vue agent demo this deck uses lives at `@steamfield/ui/vue/agent-demo` in 0.4.0. Check whether 0.2.0 has it and bump if not, then rebuild every registered deck (`bun run build:all`) to confirm nothing else moved.

If building the deck exposes a gap in shared tooling (TypeScript highlighting in `CodeInk` is the likely one), add an RFC under `docs/rfcs/` and build the deck-local version first. Do not change the addon ad hoc.

## 6. Design system: "Night drive, on stage"

The source is `~/Projects/steamfield/DESIGN.md` and the tokens at the top of `~/Projects/steamfield/src/styles/global.css`. Read both. The site is an 80s arcade and synthwave poster built from real data: near-black violet sky, a neon grid to the horizon, the Steamfield mark as a setting sun, CRT monitors and pixel type. The deck borrows that costume and turns it down for a projector. The nostalgia goes on the frame; the content stays crisp and readable from the back row.

The design run writes `DESIGN.md` in the deck directory with the full token map, in the shape of `examples/texas-2026/DESIGN.md`. The cover and slide 5 are the approval samples: build those two first, screenshot them with `bun run shot`, and get Riley's approval before any other stage is styled.

### 6.1 Color

`theme.json` recolors the six hue slots. They mean different things in this deck, so do not read the slot names literally:

| Slot | Appearance (site token) | Meaning in this deck |
| --- | --- | --- |
| `rose` | Hot pink `#FF2E88` (`accent`) | The actor being discussed: the agent, the running process, the highlighted series. One pink thing per beat. |
| `cyan` | Cyan `#2DE2E6` | Data and output: results, working delegates, samples, links. |
| `amber` | Yellow `#FFD319` | Waiting and held: a locked host, a held question, a pending step. Also figure tags. |
| `emerald` | Phosphor `#47FF9C` | Anything a computer printed that passed: a green verify, exit 0, terminal text. |
| `violet` | Violet `#A04DFF` | Transport and plumbing: rsync, sockets, JSON-RPC, the wireframe grid. |
| `slate` | Lavender greys (`#A395D6` family) | Neutral structure and dimmed items. |

Failure is pink with a ✕, as on the site's rr figure. There is no red.

Surfaces come from the site: canvas `#0B0221`, well `#120531`, card `#170A3D`, borders `#2E1B63` and `#4B2D91`, text `#F6F1FF`, secondary `#D2C7F4`, muted `#A395D6`. Orange `#FF901F` appears only inside the sunset gradient. The sunset (yellow, orange, pink, violet, top to bottom) is the one gradient and it fills the mark and nothing else.

Each ramp is four `#rrggbb` steps getting lighter, with step 1 at least 3:1 against the canvas (`packages/decks/theme/theme.test.ts` covers this deck once it is registered). Put the site token at step 2 or 3 and derive the others. Pink at full saturation is close to the 3:1 floor at darker steps, so compute contrast instead of eyeballing it.

Product brand colors (OpenData's cyan, Stacks' lime) are not used as product accents. Products are told apart by their pixel icon and name.

### 6.2 Type

| Role | Face | Where |
| --- | --- | --- |
| Headlines, card text, prose | TeX Gyre Heros (bold for headlines) | Every claim headline and every card |
| Cover title, product name plates, section words | Orbitron 800 to 900, uppercase | The cover, the name plate on a product's first slide, station names on the thread. Short strings only, never a sentence. |
| Tags and counters | Press Start 2P | Evidence tags, the `FIG. n` tag, thread rail labels, exit codes. Never below 16px at the 1920 canvas, never more than a few words. |
| Terminal output | VT323 | Terminal panes and agent-session panes, set large (30px or more) |
| Code | JetBrains Mono | Code panes and inline code, 24px or more |

Claim headlines are sentences, and Orbitron uppercase is unreadable at sentence length, so headlines are Heros. This departs from the site, where page titles are chrome Orbitron. One Mr Dafoe script line is allowed on the cover, written across the Orbitron title, and nowhere else.

Set `fonts.sans` to Heros and `fonts.mono` to JetBrains Mono in `theme.json`, and leave `fonts.serif` aliased to the sans, because the addon's headline reads it. Orbitron, the pixel face, VT323 and the script are `--sf-font-*` tokens in `styles/tokens.css`. Verify each font loaded in the browser; a fallback face looks plausible in a screenshot.

### 6.3 Shape, glow and the CRT

- Radii from the site: 2px chips, 4px controls, 8px cards. The CRT bezel is the exception (18px outer, 12px screen).
- Glows go on neon elements only: the grid, the sun, the one pink actor, a line while it draws. Text in cards and code never glows. Tags do not glow.
- `CrtFrame` is the figure frame for recordings. Anything tagged `Recorded` plays on a CRT screen: a bezel in the card color, faint static scanlines at the site's `--crt-scan` strength, and the `Recorded` tag in the bezel's lower edge with its date and source. Schematics are drawn straight on the canvas with no bezel. This makes "this really happened" a visible property of the frame.
- Scanlines never cross code or body text, and nothing flickers. No large area changes luminance quickly (the site's flash rule applies).
- The canvas carries a quiet floor: a perspective grid in violet at low opacity in the bottom fifth, static on content slides, drifting slowly toward the viewer on the cover, dividers and the close. Ambient motion is CSS, stops under reduced motion, and is absent in presenter, overview and export.

### 6.4 Layout

The reserved regions in `story-stage.md` hold: headline band top left, card bottom left (or right when the stage needs the left). One more region is this deck's own:

- The thread rail runs along the bottom of every content slide, from x 110 to 1810 at about y 990 to 1045, under the card. It shows the five products as 12x12 pixel icons (data in `~/Projects/steamfield/src/data/pixel-icons.ts`) with the verb under each in pixel type. Products already covered sit at full strength, the current one has a 2px pink marker and its name in Orbitron, the rest sit at the dim level. It is the site's stage rail, moved to the bottom. It carries the view-transition name `vt-thread-rail` so it holds still across slide changes while the marker slides.
- A product's first slide shows a name plate at the right end of the headline band: pixel icon, product name in Orbitron, and the language chip. Later slides for the same product show only the chip.
- Every figure carries a `FIG. n` tag in yellow pixel type at its top left, numbered through the deck, as on the site.

### 6.5 Shared deck-local components

Build these before the stages. Each is a Vue component in `components/`, reads color through `ink()` and `theme`, takes a 0..1 progress or an index from the beat script, and owns no timeline.

| Component | What it is | Notes |
| --- | --- | --- |
| `ThreadRail` | The bottom rail above | Props: `current` (step id), `done` (ids). Lives in a `StoryLayer` so it can carry the view-transition name. |
| `NamePlate`, `LangChip` | Product plate and language chip | Text comes from `data/products.ts`, the one source for names, verbs and languages. |
| `EvidenceTag` | `Recorded 2026-10-29`, `Schematic`, `Illustrative` | Solid border for recorded, dashed for schematic, dotted for illustrative. |
| `CrtFrame` | Bezel and screen for recordings | Slot for content; props for the tag text and source line. |
| `RepoTree` | An animated file tree | Props: `nodes` (path, depth, kind, note), `lit` (set of paths), `focus` (one path), `reveal` (0..1). Rows rise in on an eased stagger. Unlit rows sit at the dim level; the focused row gets the pink marker and a one-line note to its right in muted type. Mono type. |
| `CodePane` | A syntax-highlighted excerpt | Props: `excerpt` (from `data/code/`), `focus` (line ranges to keep bright), `reveal`. Shows the file path and line range as its label. Highlighting must work in export, so tokenize ahead of time: a script (`scripts/tokenize.mjs`) runs Shiki with the synthwave-84 theme the site uses and writes token arrays next to each excerpt. Changing excerpts cross-fade in place; the pane never moves. |
| `TermPane` | A terminal transcript | Props: `lines` (text, tone), `shown` (how many lines), `caret`. VT323, phosphor for output, muted for prompts. Lines appear whole, in steps of `DUR.tick`; nothing types character by character except a command being entered. |
| `AgentPane` | A scripted agent session | Wraps `@steamfield/ui/vue/agent-demo` with the deck's tokens mapped onto its `--sf-*` variables. The script position is driven by the beat. |
| `PacketPath` | A dot travelling along an SVG path | Props: `d`, `progress`, `hue`, `label`. Used for every "message goes from A to B" in the system diagrams so they all move the same way. |
| `design.ts` | JS-side constants | Dim level, rail geometry, tree row height, code line height, packet radius. Mirrors of CSS values are documented together, as in texas-2026. |

### 6.6 Motion

The story engine's rules hold. On top of them:

- System diagrams are simulations. The landing-page diagrams this deck ports are pure functions of time (`sceneAt(t)`), written to loop on a clock. A deck beat is a pure function of the click. Bridge them the same way everywhere: the stage keeps one reactive `t`, each beat tweens `t` to that beat's still moment with `ease: 'none'` over a `DUR` value, and the template renders `sceneAt(t)`. Stepping back then replays the simulation in reverse for free. Pick each beat's still moment so the frame makes its point without motion, because export, presenter and reduced motion all show stills. Section 7 lists the source of each simulation.
- When a simulation span is long (the rr flow covers about 20 seconds of simulated time), split it over more beats or chain `DUR.bloom` tweens. Never add a duration literal.
- Things that never stop while a beat rests (a blinking caret, the StatGlass one-second tick, a running delegate's border trace) are ambient. They are CSS or `requestAnimationFrame` state under the `playCount` key, they stop under reduced motion, and no beat depends on them.
- A code pane changes by cross-fade and focus, never by scrolling.
- Slide changes use the deck's fade override. Named morphs are listed in section 8.

### 6.7 Do not

Glow on card or code text. Pixel type for a sentence. Orbitron for a sentence. Per-band colors on the mark. Scanlines over code. A chart-like decoration that is not a chart. Anything that looks recorded and is not tagged. A product's brand color as its accent. Emoji. Sound.

## 7. Animation sources

Riley asked that the existing landing-page animations be used. These are the ones worth porting. All are React; the deck is Vue, so port the pure model and redraw the view as an SVG stage. Keep each model in step with its source and say so in the data module's provenance header.

| Source | What it shows | Model to port (framework-free) | Used on |
| --- | --- | --- | --- |
| `~/Projects/rr/site/src/components/landing/FlowDiagram.tsx` (768 lines) | "How runs share hosts": four agents on a laptop, one rr process per call, three hosts, locks, a waiting column, retries every 2 s | `rr/site/src/lib/flow.ts` (`simulate`, `sceneAt`, `flowSteps`, `FLOW_HOSTS`, `FLOW_RUNS`); the wide geometry constants are at the top of `FlowDiagram.tsx`. steamfield.io has its own port: `~/Projects/steamfield/src/lib/rr-flow.ts` and `src/components/home/RrDemo.tsx` | Slide 16 |
| `~/Projects/rr/site/src/components/landing/MonitorStage.tsx` and `monitor/MonitorCard.tsx` | One real `rr test` run replayed from two sides: `rr monitor` host cards on top, the run's output as a person or an agent sees it underneath | `rr/site/src/lib/monitor/timeline.ts`, `render.ts`; fixtures `rr/site/fixtures/monitor.jsonl`, `run.jsonl`, `run.pretty.txt`, `run.stdout.txt` | Slides 2, 20, E3 |
| `~/Projects/rr/site/src/components/landing/QueueBoard.tsx` | Interactive lock queue | `rr/site/src/lib/queue.ts` | Reference for slide 16's waiting beat |
| `~/Projects/claude-codex/site/src/components/landing/session/SessionCanvas.tsx` (647 lines) and `SessionDiagram.tsx` | Claude, the daemon board and delegate cards in worktrees, with packets travelling and a held question | `claude-codex/site/src/data/session.ts` (`buildSession`, `sceneAt`, `stepAt`); steamfield.io's port: `~/Projects/steamfield/src/lib/foreman-session.ts`, `src/data/foreman-session.ts`, `src/components/home/ForemanCanvas.tsx` | Slide 11 |
| `~/Projects/claude-codex/site/src/components/landing/Lifecycle.tsx` | The run state machine with a real excerpt per state | `claude-codex/site/src/data/lifecycle.ts` | Reference for slides 13 and 14 |
| `~/Projects/claude-codex/site/src/components/landing/SupervisionConsole.tsx` | A recorded run replayed as a transcript and an event feed | `claude-codex/site/src/data/supervision.ts`; fixtures `claude-codex/site/fixtures/runs/*.json`, `fixtures/cli/*.json` | Slide 14's terminal lines |
| `~/Projects/statglass/docs-site/src/islands/DashboardDemo.tsx`, `PopoverDemo.tsx` | The real React app in an iframe, running on its mock transport | `statglass/docs-site/src/lib/demo.ts` (URL builder, scenarios `multi-host`, `linux-host`, and so on); the demo build comes from `scripts/build-demo.mjs` | Slide 22 |
| `~/Projects/steamfield/src/components/home/StatGlassDemo.tsx` | The popover on simulated readings | `~/Projects/steamfield/src/lib/statglass-demo.ts` (every value a pure function of the sample number) | Slides 20 and 21 |
| `~/Projects/stacks-api/apps/web/src/islands/home-cli-script.ts` and `islands/blog/scenarios/*.ts` (`verify-loop`, `tamper-check`, `new-project`, `brief-preview`) | Scripted agent sessions with the stacks CLI | The scenario files are data (`DemoTurn[]`) | Slides 6, 9, E1 |
| `~/Projects/decks/site/src/components/landing/DeckPlayer.tsx`, fixture `site/fixtures/hook-denial.json` | A deck stepping through beats; a recorded hook denial | The fixture | Slide 27 |

New animated diagrams this deck builds because none exists: the Stacks loop with its real verify timeline (slide 5), the foreman process diagram (slide 13), the held-question sequence diagram (slide 14), the Rust to TypeScript sample pipeline (slide 21), the Transport fork (slide 22) and the habits matrix (slide 28).

## 8. The arc

Default cut: 28 slides, 80 beats, about 28.25 minutes by the Min column. Slides 07, 17 and 25 are live demos (section 10). Slides 05, 12, 18 and 24 are hand-off slides: each is one beat (no clicks) that shows one prompt with a Copy button, for pasting into an external Claude Code session. Slide 25 has `hide: true`; restoring it makes 29 slides, 84 beats and about 29.25 minutes.

The numbers below are filename prefixes. A hidden slide is dropped before numbering, so playback positions are consecutive: filenames 01-24 play as 1-24 and 26-29 as 25-28. For `decks shot` or presenter navigation, use 3 for the thread, 27 for habits and 28 for the close. With slide 25 restored, it plays at position 25 and files 26-29 play as positions 26-29.

| # | Page / stage | Headline (draft) | Step | Beats | Min |
| --- | --- | --- | --- | --- | --- |
| 1 | `01-cover` / `StoryCover` + `NightDriveField` | Building for agents | | 1 | 0.5 |
| 2 | `02-two-users` / `TwoUsersStage` | Every tool I ship has two users. | | 3 | 1.25 |
| 3 | `03-thread` / `ThreadStage` | I ship a change with five tools I built. | | 3 | 1.25 |
| 4 | `04-stacks-title` / `SectionStage` | Stacks starts a project an agent can finish. | Start | 1 | 0.25 |
| 5 | `05-stacks-loop` / `StacksLoopStage` | Stacks hands the agent a brief and a finish line. | Start | 5 | 1.75 |
| 6 | `06-stacks-handoff` / `HandoffStage` | One prompt scaffolds a deck and writes it. | Start | 1 | 0.5 |
| 7 | `07-stacks-live` / `LiveDemoStage` | Stacks gives a failed check an exit code. | Start | 4 | 1.0 |
| 8 | `08-stacks-tour` / `StacksTourStage` | An Effect CLI is commands, services and one error table. | Start | 6 | 2.75 |
| 9 | `09-stacks-output` / `StacksOutputStage` | Stacks prints the same result three ways. | Start | 4 | 1.5 |
| 10 | `10-foreman-title` / `SectionStage` | foreman delegates the coding to Codex agents. | Delegate | 1 | 0.25 |
| 11 | `11-foreman-session` / `ForemanSessionStage` | Claude delegates to Codex, one worktree per task. | Delegate | 5 | 2.0 |
| 12 | `12-foreman-handoff` / `HandoffStage` | One prompt has three Codex agents build an app in parallel. | Delegate | 1 | 0.5 |
| 13 | `13-foreman-daemon` / `ForemanDaemonStage` | A daemon sits between the two agents. | Delegate | 4 | 1.5 |
| 14 | `14-foreman-question` / `ForemanQuestionStage` | A held question is an unanswered request. | Delegate | 4 | 1.5 |
| 15 | `15-rr-title` / `SectionStage` | rr runs the tests on machines that sit idle. | Test | 1 | 0.25 |
| 16 | `16-rr-locks` / `RrLocksStage` | rr gives every run its own machine. | Test | 8 | 2.0 |
| 17 | `17-rr-live` / `LiveDemoStage` | rr runs this task across my machines. | Test | 3 | 0.75 |
| 18 | `18-rr-handoff` / `HandoffStage` | One prompt shards the app's tests across three hosts. | Test | 1 | 0.5 |
| 19 | `19-statglass-title` / `SectionStage` | StatGlass shows what those machines are doing. | Watch | 1 | 0.25 |
| 20 | `20-monitor-to-glass` / `MonitorToGlassStage` | I kept rr monitor open all day, so I built an app. | Watch | 3 | 1.0 |
| 21 | `21-glass-boundary` / `GlassBoundaryStage` | Rust owns the data. TypeScript draws it. | Watch | 5 | 2.0 |
| 22 | `22-glass-browser` / `GlassBrowserStage` | The whole app runs in a browser tab. | Watch | 2 | 1.0 |
| 23 | `23-glass-cli` / `GlassCliStage` | Agents ask StatGlass what happened at 3pm. | Watch | 3 | 1.25 |
| 24 | `24-statglass-handoff` / `HandoffStage` | An agent reads this laptop's load from StatGlass. | Watch | 1 | 0.5 |
| 25 | `25-glass-live` / `LiveDemoStage` (hidden) | StatGlass reports this laptop's CPU history. | Watch | 4 | 1.0 |
| 26 | `26-decks-title` / `SectionStage` | Decks made the Horse Tinder pitch we started with. | Present | 1 | 0.75 |
| 27 | `27-decks` / `DecksStage` | Decks rejects a sentence before it reaches a slide. | Present | 3 | 1.25 |
| 28 | `28-habits` / `HabitsStage` | Each tool has some of the same six habits. | | 4 | 1.5 |
| 29 | `29-close` / `CloseStage` | Start at steamfield.io. | | 1 | 0.5 |

The headlines record each slide's claim. The wording is a draft and has to pass the prose audit. A figure in a headline is subject to `data-sources.md`; if the check changes the figure, the headline changes.

Cross-slide morphs (only adjacent slides share a name; add each name in both places in `styles/index.css`, per `story-stage.md`):

- `vt-thread-rail`: every content slide to the next. The rail holds; the marker slides.
- `vt-thread-row` (slide 3 to slide 5): the five stations collapse down into the rail.
- `vt-host-cards` (slide 16 to slide 20): rr's three host boxes become the three `rr monitor` cards.

## 9. Stretching to 40 minutes

Four extension slides sit in the manifest with `hide: true` in their stanza. Removing `hide` from all four extends the talk; re-time it before presenting. `SPEAKER-GUIDE.md` lists them in the order to restore if only some fit. They are specified at the end of section 10. `beats.test.ts` still checks a hidden slide; confirm that against the Slidev version in the lockfile, and if hidden slides break a guard, keep the extensions in a second manifest (`slides-40.md`, alias `agents-40`) instead.

| # | Page / stage | Headline (draft) | After | Beats | Min |
| --- | --- | --- | --- | --- | --- |
| E1 | `09b-stacks-tamper` / `StacksTamperStage` | Editing a verify step stops verify. | 9 | 4 | 1.5 |
| E2 | `14b-foreman-fake-codex` / `ForemanFakeStage` | A 117-line script stands in for Codex. | 14 | 3 | 1.5 |
| E3 | `16b-rr-two-views` / `RrTwoViewsStage` | One run reads differently to a person and an agent. | 16 | 4 | 1.5 |
| E6 | `09c-stacks-mcp` / `StacksMcpStage` | The MCP server is three tools that shell out. | E1 | 3 | 1.0 |

## 10. Per-slide spec

Coordinates are in the 1920x1080 stage viewBox. Card copy is given as `lead` / `body`. "Say" is the gist of that beat's note; the builder writes the full paragraph in Riley's voice (first person, plain, specific, no hype; `~/Projects/steamfield/src/content/blog/design-cli-for-ai-agents.mdx` and `why-steamfield.mdx` are the voice references and hold much of the argument).

### 1. Cover

`StoryCover` with a deck-local `NightDriveField` in its `field` slot: the site hero in miniature, still. Sky gradient, the mark as the sun with its disc on the horizon at 70 percent of the height, a ridgeline, the neon grid floor. Take the mark's geometry from `~/Projects/steamfield/src/components/brand/paths.ts` and the layering from `src/components/home/NightDrive.astro`. The ridgeline is real data, as on the site: the seven-day average of commits per day across the product repos, from `~/Projects/steamfield/src/data/commits.json`. Give it an `EvidenceTag` and a source row.

- Title in Orbitron: BUILDING FOR AGENTS. One Mr Dafoe script line across it: "in TypeScript".
- Lede in Heros: "Agent tooling and infrastructure, from CLIs to a native macOS app."
- Byline: Riley Hilliard · Steamfield · Austin JS · November 2026.
- Entrance: the grid light builds, then the sun rises a short way on `TRACE` and settles. The grid drifts toward the viewer as ambient motion. One beat, no card.
- Say: who I am, that Steamfield is a small studio that builds its own products, and that tonight is five tools I built because coding agents became the main user of my command line.

### 2. Two users

Purpose: define DX and AX with one real run seen from both sides. Source: `rr/site/fixtures/` (the same `rr test` run recorded as `run.pretty.txt` and `run.jsonl`), which is what `MonitorStage.tsx` replays.

Layout: two `CrtFrame` terminals side by side above the card line. Left is labelled "What I see", right "What the agent reads". Tag: `Recorded`, with the fixture's date.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Left terminal fills with the `--pretty` run: phases, spinners resolved to ticks, a pass summary. Right terminal is dark. | A person skims this. / Colour, spinners and a progress line redrawn on every tick. | This is developer experience. I glance at it and move on. |
| 1 | Right terminal fills with the raw bytes of that pretty output, escape codes visible (use `rr/site/fixtures/raw/` if it holds them; otherwise show the pretty text with its ANSI sequences written out and tag the pane `Illustrative`). | An agent reads every byte. / It pays for each one in context and acts on it literally. | The agent does not skim. A redrawn progress line arrives as dozens of escape sequences. |
| 2 | Right terminal cross-fades to the JSON events for the same run; the `result` line is pink. A chip names it: `"type":"result"`. | So the output becomes an API. / DX is what I see at the terminal. AX is what the agent reads. | Agent experience. The rest of the talk is what changes when you design for the right-hand screen. |

### 3. The thread

Purpose: show all five products once, in the order work flows, and set up the rail.

Layout: a road line across the stage at y 560, drawn on `TRACE` at entrance, with five stations. Each station is a pixel icon in a small CRT tile, the verb in pixel type under it, and (from beat 1) the product name in Orbitron and its `LangChip`. Tag: `Schematic`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The line and five tiles with verbs only: Start, Delegate, Test, Watch, Present. | I built each one for my own work. / Most started inside OpenData, whose test suite is about 14,000 tests. | Each tool started as a chore I got tired of. |
| 1 | Names and language chips land on an eased stagger, left to right. | Most of it is TypeScript. / rr is Go, and StatGlass keeps its samplers in Rust. | This is a JS meetup, so I will say up front which parts are not JS. |
| 2 | Stacks, foreman and StatGlass brighten; the other two drop to the dim level. Then the row hands off to the rail (`vt-thread-row`). | Three get a closer look tonight. / Stacks, foreman and StatGlass, with the repo open. | The other two, rr and Decks, get ninety seconds each. |

Figure: "about 14,000" is the published figure on the rr site and in `why-steamfield.mdx`. A static count on 2026-11-13 found about 14,300 Python test functions and about 5,300 TypeScript test cases in the OpenData monorepo. Re-derive a collected count before the talk (`data-sources.md` row; see section 11) and use whatever it returns.

### 6. Stacks: the loop

Purpose: the product workflow. Stacks writes a brief, the agent builds, `stacks verify` decides when it is done.

Layout: a loop drawn left to right across y 300 to 520: a command chip (`stacks new sveltekit tea-dashboard`), a stack of file chips (`AGENTS.md`, `.claude/`, `.stacks/BRIEF.md`, `.stacks/manifest.json`), an agent box, a verify gate, and a return path from the gate back to the agent. Below it, at y 600 to 680 on the right two thirds, an `InkTimeline` in seconds since scaffold with an `InkTimelineCursor`. Name plate: Stacks, TypeScript · Effect 4.

Data: `~/Projects/stacks-tests/tea-dashboard/.stacks/state/runs.jsonl` (a real Claude Code build with stacks 0.5.0: failed at 393 s, green at 501 s and 623 s after scaffold), its `BRIEF.md` (4,481 words by `wc -w`) and `manifest.json`. Tag the timeline `Recorded 2026-10-29`. The loop itself is `Schematic`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The command types over `DUR.trace`. Four files drop separately over `DUR.gather`. | One command writes the brief. / It writes starter files, agent instructions and a 4,481-word BRIEF.md. | A stack is a Markdown recipe. Stacks makes no model calls and runs nothing from it. |
| 1 | The prompt appears. A packet crosses to the agent over `DUR.gather`, then the agent lights. Earlier setup dims. | The agent’s prompt is two sentences. / It names the brief and says the work is done when stacks verify passes. | The brief is a file I can review and change. |
| 2 | The cursor and outbound packet travel over `DUR.gather` while the fifteen squares resolve in order. After `DUR.eraseHold`, the failure appears over `DUR.morph` with the label "lint + 4 doc checks". The return packet takes `DUR.scale`. | The first verify run failed. / Claude Code ran it 393 seconds in and 5 of 15 steps failed. | Lint and four documentation checks failed. The result returns to the agent. |
| 3 | The agent works. The outbound packet and cursor travel to 501 seconds over `DUR.gather` while the squares resolve again. After `DUR.eraseHold`, the gate passes over `DUR.morph`. | The next verify run passed. / The agent fixed the failures and all 15 steps passed at 501 seconds. | The completion rule from the prompt has now been met. |
| 4 | The agent and recording dim. After `DUR.eraseHold`, the manifest and gate locks appear over `DUR.morph`, followed by the outside digest. | Stacks refuses to verify edited checks. / Stacks keeps a hash of the steps outside the project and refuses to run if one was edited. | A person must accept a change to the verify steps. |

The planned release valve A (Stacks in a scratch directory) is now slide 7.

### 7. Stacks: live

Purpose: run the Stacks commands in front of the room and show that a failed verify ends in exit code 5, which a caller can branch on.

Layout: `LiveDemoStage` with one terminal pane (`LiveTerm`) filling the width under the headline, on the grid shared by the three live slides: 135 columns by 17 rows at a nominal 28px. There is no story card and the pane has no label. Each beat's one-line caption (the `lead` in `COPY`) sits in the pane's bottom band, and three command cards sit directly above the thread rail. Each command card has a play button; on the next command it advances the slide one click, and in overview, preview and print it is a static icon. The pane plays the recording in `data/fixtures/07-stacks-live.json` (tag `Recorded 2026-11-16 · stacks 0.12.0`). When the deck runs from `bun run decks dev agents --live-term`, the same pane runs the commands in a real shell and its tag reads `Live`. Live, the shell is `zsh -d` with a private `ZDOTDIR` (the framework’s private `.zshrc`) and an environment stripped of the package runner's variables and `node_modules/.bin` PATH entries, so `bun` and `node` behave as in the speaker's own terminal. Output longer than three lines is paced at about 30 lines a second, and the trackpad scrolls from anywhere on the pane. Default text is light, the prompt and typed command are bold green, and tools' own ANSI colours show. The viewport keeps complete exchanges and always shows the newest command with its output. Name plate: Stacks.

Data: `data/07-stacks-live.ts` over the fixture; source record `data/sources/07-stacks-live.md`. The second command's ten leading progress lines are left out of the recording; no other line is cut or rewritten. The recording is the capture at 92 columns, wrapped for playback at the shared 135-column grid. Live, the second command also prints verify's progress lines (they go to stderr), so the command line scrolls off the top of the 17 rows by the time `exit=5` prints.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Terminal off; the first command card is next. | Watch the exit code. / These commands run in a shell, with a recording available. | The pane is live when the connection is up and a recording otherwise. |
| 1 | `stacks new typescript-cli demo-cli --sandbox --no-launch --offline` and its output. | The scaffold includes the agent's next step. / Stacks wrote the project and brief, then printed the hand-off. | Nothing is built yet. |
| 2 | `stacks verify` piped through `tail -5`, the report and `exit=5`. | Fresh scaffolds fail verify. / The unbuilt project exits 5; the report tells the agent what to fix. | A caller can branch on the exit code. |
| 3 | `stacks verify --json` through `jq`: outcome, totals, firstGreen, tamperCheck. | Scripts can read the same result. / JSON reports the outcome, check totals and gate state. | Named fields describe the same unfinished project. |

### 8. Stacks: the repo tour

Purpose: the Effect breakaway. Teach four ideas (a command, a service with its layer, one error table, a test that swaps a layer) from real files.

Layout: `RepoTree` at left (x 110 to 700, y 200 to 690) showing `packages/cli/src`; `CodePane` at right (x 760 to 1810, y 200 to 950); card bottom left under the tree. Tag: none (code panes carry their path and line range).

Tree nodes, in order, with the one-line note shown when a node is focused:

```
packages/cli/src/
  bin.ts          the only file that touches Node
  main.ts         one invocation: errors become exit codes
  cli.ts          the effect/cli command tree
  runtime.ts      AppLayer
  errors.ts       every tagged error, one exit-code table
  commands/       one file per command
  services/       Output, Host, Processes, Tcp
  platform/       Node-only adapters
  schemas/        one Schema per --json result
  core/           platform-free domain logic
    registry/  compose/  brief/  scaffold/  verify/
tests/            222 files, real command tree, fake layers
```

| Beat | Tree | Code pane | Card | Say |
| --- | --- | --- | --- | --- |
| 0 | Draws in. `bin.ts`, `main.ts`, `cli.ts` lit. A chip reads "231 files · 29,402 lines". | Empty frame. | Three files start every run. / bin.ts touches Node, main.ts maps errors to exit codes, cli.ts builds the command tree. | A lint rule rejects a Node import anywhere else. |
| 1 | `commands/` focused. | `commands/runs.ts` lines 1 to 25, trimmed to the `Command.make` call and `withDescription`. Focus the handler. | A command is one small file. / Flags, a thin handler, and help text that lists its own exit codes. | `yield*` pulls a service out of the environment. That is all the Effect you need to read this. |
| 2 | `services/` focused. | `services/host.ts` lines 29 to 48, trimmed: the class line, `static layer`, `static memory`. | A service ships with its own fake. / Host.layer wraps the real process. Host.memory is the test double, in the same class. | A service is an interface with a name. A layer is how you build one. |
| 3 | `runtime.ts` and `bin.ts` focused. | `runtime.ts` lines 11 to 19 (`AppLayer`). | Layers wire it together once. / Config, then output, then logging and processes. Tests call the same function. | This is dependency injection that the compiler checks. |
| 4 | `errors.ts` focused. | `errors.ts` lines 425 to 443, trimmed to six rows and the `satisfies` clause. Focus `satisfies`. | Every error has one row. / Exit code, retryable, keeps its report. The compiler rejects an error with no row. | Add an error class and forget the row, and the build fails. |
| 5 | `tests/` focused. | `tests/update.test.ts` lines 250 to 279, trimmed to the fake `HttpClient`, the `runCli` call with `http: Layer.succeed(...)`, and the `expect` on the envelope. | Tests swap a layer. / The real command tree runs against a fake HttpClient. There are no module mocks. | The assertion is the exact JSON an agent would get, including the next step. |

Facts to verify before quoting: Effect 4.0.6 with the built-in `effect/cli` module (not `@effect/cli`); the published CLI runs on Node 22 or newer and refuses Bun, while Bun is the package manager and bundler. Put those in the notes for beat 0.

### 9. Stacks: three audiences

Purpose: the AX payoff of the tour. One result, three renderings, and exit codes that each mean one action.

Layout: three `TermPane`s side by side (x 110 to 1810, y 200 to 640), labelled in pixel type: PERSON, AGENT, SCRIPT. Below them from beat 3, a strip of exit-code tiles. Card bottom left.

Data: human text from `packages/cli/docs/quickstart.md` lines 150 to 157; the `VerifyFailed` envelope from `packages/cli/tests/errors.test.ts` lines 373 to 380; the exit table from `packages/cli/docs/reference/output.md` lines 70 to 85; the audience rule from `src/services/output.ts` lines 24 to 32 and the agent markers from `src/env-names.ts` lines 35 to 44. Get the agent-text rendering by running `CLAUDECODE=1 stacks verify` in the tea-dashboard project and recording it; tag panes `Recorded` only if they are.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | PERSON pane: `verify: failed (full run; 0 passed, 1 failed, …)` with colour and the `Next:` line. | A person gets colour and a summary. / Only when stdout is a terminal, no agent is detected and CI is unset. | Human output is the special case. |
| 1 | AGENT pane: the same facts, no ANSI, `> step` lines. A chip lists `CLAUDECODE · CODEX_* · CURSOR_AGENT · AI_AGENT`. | An agent gets the same facts, plain. / Stacks checks for agent markers in the environment, then drops colour and progress. | Nobody has to pass a flag. The CLI works out who is reading. |
| 2 | SCRIPT pane: one `VerifyResult` object, then the error envelope with `"next"` in pink. | A script gets one JSON object. / The error envelope is the last line of stderr, with the next step written out. | `stacks schema` prints the JSON Schema for every one of these shapes. |
| 3 | The panes dim. Exit tiles rise: 0, 2, 3, 4, 5, 6, 130, each with its action from the table. 5 and 6 are bright. | Each exit code means one action. / Five means read the report. Six means ask a person. | A published code never changes meaning. Treat it like an API. |

### 11. foreman: the session

Purpose: the product workflow. Claude writes contracts, Codex delegates run in worktrees, one stops to ask, Claude answers, Claude commits.

Layout: port `SessionCanvas.tsx`'s wide geometry scaled to the stage: Claude box at left, the daemon board in the centre, delegate cards stacked at right, each card titled with its worktree path and branch. Packets use `PacketPath`. Colors follow the site's Fig. 8: pink Claude, cyan working delegates, yellow the held question, phosphor completed commands. Name plate: foreman, TypeScript · Effect 4. Tag: `Recorded`, with the run date, and "timeline shortened" in the source line, as the site says.

Data: `buildSession` and `sceneAt` from `claude-codex/site/src/data/session.ts` over `claude-codex/site/fixtures/runs/*.json`. Use one batch of runs for the whole slide and take every figure from that batch. Two batches exist: the four `fix-*` runs (started within 18 seconds of each other on 2026-11-06, 24.8 to 70.5 minutes long) and the `site-*` runs (in `site-commands`, question q1 was asked at t = 31,410 ms and answered at 49,673 ms, about 18 seconds later). Check which runs the site's session uses and do not put a figure from one batch on a card about the other.

| Beat | Stage (`t` tweens to this still) | Card | Say |
| --- | --- | --- | --- |
| 0 | Claude holds contract cards, each showing its `- May change:` line. Delegates are queued. | Claude writes a contract per task. / Plain markdown. The one line foreman parses is May change. | I ask Claude for a feature. Claude splits it and writes each delegate a contract. |
| 1 | Packets go to the daemon; worktree cards appear with `.claude/worktrees/<name>` and `foreman/<name>`; command counters tick. | Each delegate gets its own worktree. / A branch each, under .claude/worktrees, so no two write the same files. | These are Codex models, started through the Codex CLI's own login. No API key. |
| 2 | One delegate turns yellow; its packet stops at the daemon board, which shows the real question text, trimmed. Other delegates keep running. | One delegate stops to ask. / The daemon holds the question. The others keep working. | This is a real question from a real run. |
| 3 | The answer packet travels Claude to daemon to delegate; the card returns to cyan. | Claude answered it. / The reply goes back into the same turn and the delegate carries on. | Give the measured delay from the batch in use. |
| 4 | Delegates turn phosphor; a diff packet travels to Claude; a chip on Claude reads "review · test · commit". | Claude reviews and commits the work. / foreman never commits. Its digest lists any file outside May change. | The delegate writes code. The orchestrator is accountable for it. |

Release valve B (3 minutes, optional, leaves the deck): see section 12. Rehearse it; whether the delegate asks depends on the model.

### 13. foreman: the daemon

Purpose: the repo breakaway as a process diagram, with the tree alongside.

Layout: five boxes left to right at y 380: Claude Code, the `foreman` CLI, a socket, the daemon (with "supervisor" inside it), `codex app-server`, then three thread lanes fanning out. A small `RepoTree` at right (x 1340 to 1810, y 200 to 640) lists `src/commands/`, `src/core/`, `src/daemon/`, `src/supervisor/`, `src/codex/`, `src/guide/`, `src/schemas/`, `src/errors.ts`; the folder that implements the lit box is focused. Tag: `Schematic`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Boxes draw. A CLI call blips in and fades out while the daemon stays lit. | The CLI exits. The daemon stays. / Runs outlive the command that started them. It quits after 30 idle minutes. | Same Effect layout as Stacks. I scaffolded foreman from the Stacks typescript-cli stack. |
| 1 | The socket lights violet; frames `{ id, body }` pass both ways. Tree focus: `src/daemon/`. | They talk over a Unix socket. / Newline-delimited JSON. If the socket is missing, the CLI starts the daemon. | One daemon per home directory, held by an exclusive SQLite transaction. |
| 2 | The Codex side lights; chips name `thread/start`, `turn/start`, `turn/steer`. Tree focus: `src/codex/`, `src/supervisor/`. | One Codex process serves every run. / JSON-RPC over stdio, routed by thread id. | This is the Codex app-server protocol. There is no SDK dependency. |
| 3 | A chip under Codex: "0.166.0 · 467 schema files". Four small binaries appear under the CLI box: darwin-arm64, darwin-x64, linux-x64, linux-arm64. | The protocol is pinned by hash. / A hash over 467 schema files from Codex 0.166.0. foreman doctor reports a mismatch. | It ships as one binary per platform, built with `bun build --compile`. |

Figures: 9,189 lines of TypeScript in `src` excluding tests, 44 test files, 111 commits from 2026-11-05 to 2026-11-07. Use them in notes; re-derive first.

### 14. foreman: the held question

Purpose: the technical heart. Two mechanisms that are simpler than people expect.

Layout: a sequence diagram with four lifelines at x 300, 700, 1100, 1500: Claude, `foreman wait` (labelled "background task"), daemon, Codex. Messages are `PacketPath`s between lifelines. A `CodePane` sits at the right third from y 560 down when a beat shows code; the card is bottom left. Tag: `Schematic`. Code excerpts carry their own path labels.

| Beat | Stage | Code pane | Card | Say |
| --- | --- | --- | --- | --- |
| 0 | Codex sends `item/tool/call ask_orchestrator` to the daemon. The daemon lifeline turns yellow and nothing goes back. | `src/supervisor/questions.ts` lines 125 to 157, trimmed to `run.calls.set(id, …)`, the `QuestionAsked` event and `registry.state(run, "waiting")`. | Codex calls a tool named ask_orchestrator. / The daemon stores the request id and sends no reply, so the turn blocks. | Holding a question is just declining to answer an RPC. |
| 1 | The daemon resolves a marker; the `foreman wait` lifeline prints one line (`question  slug q1 …` and `next: foreman answer …`) and ends. An arrow from its end reaches Claude. | `src/supervisor/registry.ts` lines 114 to 119 (`wake`). | Claude wakes when a process exits. / A background foreman wait returns, and Claude Code reports the finished task. | Nothing is pushed to Claude. I used the notification Claude Code already has. |
| 2 | Claude sends `foreman answer`; the daemon responds to the stored request; Codex resumes. | `questions.ts` lines 82 to 87 (`respond(rpc.id, …)`). | The answer is the JSON-RPC response. / After fifteen minutes with none, the daemon replies itself: carry on without it. | A late answer still arrives, as a steer into the running turn. |
| 3 | The diagram dims. | `tests/supervisor-integration.test.ts` lines 6317 to 6334, trimmed to `f.start({ questionTimeoutMs: 1000 })`, `TestClock.adjust(1000)` and the two `expect`s. | The timeout test takes no time. / Effect's TestClock moves the clock. A 117-line script plays Codex. | Every one of these states has a test like this. |

### 16. rr: host locks

Purpose: how test runs are spread across a fleet of agents. rr is the one Go tool; say so in the first sentence.

Layout: port `FlowDiagram.tsx`'s wide geometry: a laptop region at left holding four agent rows (each labelled with its worktree), a "Waiting for a host" column, and three host boxes at right. Each agent's rr process is a pink chip that moves between the agent row, the waiting column and a host. Colors follow the site's Fig. 6: pink the rr process, cyan its output, violet rsync, yellow waiting, phosphor a passing exit code. Name plate: rr, Go. Tag: `Schematic`, source line "rr's own simulation of its lock rules".

Data: `rr/site/src/lib/flow.ts` (`FLOW_HOSTS` is `m4-mini`, `m1-linux`, `m1-mini`; `FLOW_RUNS` has four agents; poll interval 2,000 ms). For beat 7, line 4 of `rr/site/fixtures/run.jsonl`: a real result event from an OpenData run with a Vitest failure at `src/data/articles/charts-json.test.ts:74`.

| Beat | Stage (`t` still) | Card | Say |
| --- | --- | --- | --- |
| 0 | 0 ms. Every host free; no rr process yet. | Each rr call is a separate process. / The only state they share is a lock on each host. rr has no server. | rr is Go. These processes share host locks. |
| 1 | 1000 ms. Agent 1 has locked every host; sync starts. | A parallel task locks every host. / Its shards are tasks the config lists under parallel. rsync copies the files and SSH runs the command. | Shards are tasks I define under parallel. |
| 2 | 3900 ms. Sync has finished and every host runs its configured subtask. | Files sync before the tests start. / Each host runs its configured subtask while the parallel run holds every lock. | rsync copies files; SSH runs the configured command. |
| 3 | 7950 ms. Both agents have moved into waiting; agent 2's retry is already starting dimly. Hold between the two waiting moves. | A run waits when every host is locked. / Each process tries hosts in config order, then waits on the laptop when every lock is held. | They try every host before waiting. |
| 4 | 10250 ms. Failed retry, every lock still held by agent 1. The waiting event names rr test. | A failed retry names the lock holder. / It retries every 2 seconds and prints a waiting event with the command that holds the lock. | Independent retry timers; output names the holder. |
| 5 | 13550 ms. Agent 1's result has returned. Agents 2 and 3 run on the first two hosts; third host free. Hold between acquisitions. | A retry locks the first free host. / Each git worktree syncs to its own remote directory unless the config turns that off. | Agent 2 checks first; agent 3 takes the next host in config order. |
| 6 | 17000 ms. Agent 4 holds the third host and syncs. Agents 2 and 3 still run. | Agent 4 locks a host without waiting. / Its process tries the occupied hosts first, then locks the next host in config order. | Agent 4 probes the occupied hosts and skips the waiting column. |
| 7 | 17000 ms unchanged. Diagram dims; recorded result strip shows file and line. | The result event gives file and line. / rr parses pytest, Go test, Jest and Vitest output and reports each failed test's file, line and message. | Recorded Vitest failure, line 74, missing tooltip field. |

Notes also carry: the hosts in OpenData's real config are `mbp`, `m4-mini` and `m1-mini` (`~/Projects/opendata/.rr.yaml` lines 34 to 60), which differs from the simulation's host names; OpenData sets `worktree_isolation: false`, so beat 5's body describes rr's default, which is why it says "by default". The planned release valve C (two worktrees running `rr test` with `rr monitor` alongside) is now slide 17.

### 17. rr: live

Purpose: after slide 16's simulation, run rr in front of the room against the machines configured for this repo, and show a parallel task put one shard on each named host.

Layout: `LiveDemoStage` with one terminal pane (`LiveTerm`, working directory the repo root) laid out as on slide 7: 135 columns by 17 rows under the headline, the beat's caption in the pane's bottom band, no story card and no label, and two command cards above the thread rail. The command cards behave as on slide 7. The pane plays the recording in `data/fixtures/17-rr-live.json` (tag `Recorded 2026-11-16 · rr 0.30.0`). When the deck runs from `bun run decks dev agents --live-term`, the same pane runs the commands in a real shell and its tag reads `Live`. The hosts are the four in the root `.rr.yaml`: m1-linux, m1-mini and m4-mini over the network, and mbp, the presenting laptop (`FLAG: author-reported`). The `demo` task lists demo-1 to demo-4 under `parallel`; each runs one shard of `bun run test packages/core`. Language chip: Go.

Data: `data/17-rr-live.ts` over the fixture; source record `data/sources/17-rr-live.md`. The first command's output is complete. The second leaves out its four leading progress lines and its blank lines; the Parallel Execution Summary is complete and no line is rewritten. The capture is kept at 104 columns and playback wraps at the shared 135-column grid. Recorded host locks describe the capture; live locks vary, because another task can hold a host during the demo.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Terminal off; the first command card is next. | These hosts include this laptop. / The shell queries the machines configured for this repo. | The previous slide simulated the locks; these are the real machines. |
| 1 | `rr monitor --once --no-color`: four hosts, each online, LOCK `-` in the recording. | The snapshot reports each host's lock. | The table shows the lock state before the run starts. |
| 2 | `rr demo --pretty`: the Parallel Execution Summary, one shard per host, 4 passed. | Each shard ran on a named host. / The demo task locks the hosts and syncs the repo before running its configured subtasks. | The config defines the shards. |

### 20. From rr monitor to StatGlass

Purpose: the origin story, told as a morph. `FLAG: author-reported`: nothing in either repo records that StatGlass came from watching `rr monitor`. It is Riley's account; the note says "I".

Layout: three host cards across the stage at y 240 to 620. They arrive from slide 16 through `vt-host-cards`. In beats 0 and 1 they are `rr monitor` TUI cards inside one wide `CrtFrame` terminal: VT323, braille sparklines, CPU and RAM, latency, and `> <command>` for the lock holder. Port `rr/site/src/lib/monitor/timeline.ts` and `render.ts`, fed by `rr/site/fixtures/monitor.jsonl` (hosts `m1-mini`, `m4-mini`, `mbp`). In beat 2 the bezel dissolves and the same three cards redraw as StatGlass host cards in the app's style, under a macOS menu bar strip with the StatGlass item. Name plate: StatGlass, Rust + TypeScript. Tags: `Recorded` on the monitor replay; `Illustrative` on the StatGlass cards unless they are driven by a real capture.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The monitor replay plays to its busiest frame (`busiestFrame` in `timeline.ts`). | rr monitor shows the fleet live. / CPU, memory and the command holding each lock, read over SSH. | I added this to rr as a debugging aid. Then I noticed it was always open. |
| 1 | A history bar under the cards fills to its end and stops; a chip reads "600 samples". | It remembers ten minutes. / A 600-sample buffer that is gone when the terminal closes. | The question I kept asking was about earlier: why were the fans going at three? |
| 2 | The cards morph; the history bar extends far to the left, ticked at 1 h, 24 h, 7 d, 30 d. | StatGlass keeps 30 days. / A menu bar app for Apple Silicon, with the same hosts and their history in SQLite. | It used to be called Kelvo. It also reads rr's lock file and shows which job holds each host. |

### 21. StatGlass: the boundary

Purpose: the repo breakaway for the native app. Where the Rust and TypeScript line falls and how one tick crosses it.

Layout: two columns with a seam between them. Left (x 110 to 800), three Rust boxes stacked: `statglass-collect` (samplers), `statglass-engine` (one-hour ring), `statglass-store` (SQLite, tiers). Right (x 1120 to 1810), four TypeScript boxes: `core/transport`, `core/live-state.ts` (reducer), `app/stores` (zustand), `app/widgets` (SVG). The seam at x 960 is a vertical file tile labelled `src/core/generated/bindings.ts`. A proportion bar under the headline shows Rust against TypeScript by line count. A sample dot (`PacketPath`, cyan) travels the whole route. A `CodePane` slides over the lower half when a beat shows code. Tag: `Schematic`.

| Beat | Stage | Code pane | Card | Say |
| --- | --- | --- | --- | --- |
| 0 | Both columns draw and the language-share bar grows. | | StatGlass is 58 percent Rust by lines. / Rust has the samplers, the SQLite store, remote hosts and the menu bar item. The React UI is TypeScript. | Rust owns meaning; the client formats and draws. |
| 1 | The language-share comparison and unrelated actors dim. After `DUR.eraseHold`, the bindings tile and code appear over `DUR.morph`. | Rust `subscribe_live` and its generated TypeScript binding. | tauri-specta generates bindings.ts. / It writes 92 commands and 10 events from the Rust source. A pre-push hook fails if the file is stale. | Both signatures come from the Rust source. |
| 2 | The sample travels from sampler through engine to transport over `DUR.gather`. After `DUR.eraseHold`, the frame-message chip appears over `DUR.morph`. Storage, tray and downstream boxes stay dim. | | Rust sends samples over a Tauri Channel. / Each tick is one message whose values are an array, ordered by a layout sent earlier. | Series names go once per layout. |
| 3 | The packet travels to the widget over `DUR.gather`. The chart and tick code appear during travel. After a landing hold of `DUR.eraseHold`, the chart advances one sample over `DUR.morph`. | The real `use-tick-scroll.ts` animation call. | Each tick runs one transform animation. / d3 computes the path and React renders it as SVG. The animation slides the redrawn chart one slot. | The sample lands before the chart ticks. |
| 4 | TypeScript dims. A sample travels to the seam over `DUR.gather`. After `DUR.eraseHold`, the idle result appears over `DUR.morph` and the Rust tray lights. | | Idle CPU was 0.67 percent of one core. / Rust draws the menu bar item. Measured once, menu bar only, on an M3 Max in October 2026. | A single measurement, with other builds running. |

Figures (re-derive): 153,401 lines of Rust in `crates` and `src-tauri` including inline tests; 111,644 lines of TypeScript in `src` including tests and generated code; 92 commands (`grep -o '__TAURI_INVOKE[<(]'`; the 81 counted earlier missed the 11 calls written `__TAURI_INVOKE<T>(`) and 10 events; 0.672 percent of one core and 104.9 MB, menu bar only, a single run recorded in `plan/competitor-benchmarks.md` and `README.md` lines 182 to 196. The card says "one run" because it is one run.

### 22. StatGlass: in a browser tab

Purpose: the DX point a JS audience will take home. The UI depends on an interface, so the whole app runs without Tauri.

Layout: beat 0 is a fork diagram: a "React UI" box at left, a `Transport` interface tile in the centre, two implementations at right ("Tauri: commands and Channels" and "Mock: in-browser fake backend"), with a `CodePane` under it showing the interface from `src/core/transport/contracts.ts` (pick the six to ten lines that declare `subscribeLive` and one request method). Beat 1 replaces the diagram with the real dashboard.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The fork draws; the mock branch lights cyan. Tag: `Schematic`. | The UI never imports Tauri. / It calls a Transport interface with two implementations: the native one and a mock. | The repo's AGENTS.md states the rule; check whether lint enforces it before saying so. |
| 1 | A browser-chrome frame fades in holding the real StatGlass dashboard running on its mock transport, scenario `multi-host`. Tag: `Illustrative data`, source "the real app, mock transport". | This is the real React app. / The mock feeds it. Vitest, Playwright and the docs site run the same build. | I do most UI work in a browser with hot reload and never start the native shell. |

The embed: the demo build is produced by `statglass/scripts/build-demo.mjs` into `docs-site/public/demo` and is served at `statglass.steamfield.io/demo/index.html?window=dashboard&scenario=multi-host` (URL builder in `docs-site/src/lib/demo.ts`). Copy the built demo into the deck's `public/statglass-demo/` so the talk does not depend on venue wifi, and load the iframe only in the real slide view. Presenter, overview and export show a poster screenshot instead (capture it with `bun run shot`). If the build is too large to check in, load the hosted URL and fall back to the poster after a short timeout. The planned release valve D (the real app, then Timeline and Hosts) is now slide 25; the frame here can still be clicked into to open Timeline and Hosts.

### 23. StatGlass: the agent CLI

Purpose: the AX side of the native app, and the honest note that this CLI is Rust.

Layout: an `AgentPane` in terminal layout across the left two thirds, in a `CrtFrame`; card bottom left; from beat 2 a quote tile at right. Tag: `Illustrative session; output format from the CLI's tests`.

Data: commands from `crates/statglass-cli/src/cli.rs`; the exact agent-text output from `crates/statglass-cli/tests/cli.rs` lines 321 to 349:

```
cpu.total on m1-linux, 13:00 to 16:00 (1 min buckets, 98% measured)
min 2.1%  mean 18.4%  max 97.0% in the minute from 15:12  last 6.3% at 16:00  (mean approximate)
gap 14:31 to 14:37: host offline
```

and the reason for Rust from `plan/rfc-agent-cli.md` lines 106 to 109.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The session plays: a request ("Which machine is least busy, and what was m1-linux doing for the last three hours?"), then `statglass now --all --json` and `statglass history cpu.total --host m1-linux --since 3h` with the output above. | The CLI reads recorded history. / now, history, events and top, for this Mac or any host it mirrors. | `top` tells an agent about this second. This tells it about this afternoon. |
| 1 | The `gap` line turns yellow; a second short exchange shows an error envelope with `"next"`. | A gap is reported as a gap. / Missing samples are never drawn as zero, in a chart or in the CLI. | Same envelope shape as Stacks: tag, message, retryable, next. I copied my own CLI. |
| 2 | The session dims; the quote tile shows the RFC's reasoning in Riley's words, with `bun build --compile` in code type. | This CLI is Rust, on purpose. / A compiled TypeScript binary came to about 55 MB beside a 36 MB app. | It would also have hand-copied types Rust already owns. The MCP server, if I build one, is where a TypeScript package fits. |

Check the RFC's wording before the card ships. It gives 55 to 60 MB per architecture as an estimate against a 36 MB app, and says the helper binary beside the CLI is 550 KB. The card must not compare the CLI's own size to anything unless that size is measured.

### 25. StatGlass: live

Hidden in the default cut (`hide: true`). Purpose: run the CLI from slide 23 against the StatGlass app on the presenting laptop, and show history with its coverage, events with process names, and the same summary as JSON.

Layout: `LiveDemoStage` with one terminal pane (`LiveTerm`, working directory a temp directory) laid out as on slide 7: 135 columns by 17 rows under the headline, the beat's caption in the pane's bottom band, no story card and no label, and three command cards above the thread rail. The command cards behave as on slide 7. The pane plays the recording in `data/fixtures/25-glass-live.json` (tag `Recorded 2026-11-16 · statglass 0.10.0`), captured while this repo's test gate ran. When the deck runs from `bun run decks dev agents --live-term`, the same pane runs the commands in a real shell and its tag reads `Live`; the app must have been running for at least 30 minutes. Language chip: Rust + TypeScript.

Data: `data/25-glass-live.ts` over the fixture; source record `data/sources/25-glass-live.md`. Every output line is kept. The capture is kept at 92 columns and playback wraps at the shared 135-column grid. The capture used 24 rows; playback uses 17. The host name and the test activity during capture are `FLAG: author-reported`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Terminal off; the first command card is next. | Ask the app about this laptop. / These commands read the history StatGlass keeps on this machine. | The app has been sampling since the laptop was opened. |
| 1 | `statglass history cpu.total --since 30m`: range, 10 s buckets, 100% measured; min, mean, max with the peak's bucket. | The summary includes its measurement coverage. / CPU history reports the bucket size alongside the range and average. | The first line states coverage. |
| 2 | `statglass events --since 2h`: five events, fan ramps and sustained bun use, each with process names. | Events name the processes running then. / Fan ramps and sustained CPU use each carry process names. | Process names show what was running at the time. |
| 3 | `statglass history cpu.total --since 30m --json` through `jq '.series[0].summary'`. | A script can read the same summary. / JSON includes the peak's bucket size and the fraction measured. | Named fields for the same readings. |

### 27. Decks

Purpose: 90 seconds, self-referential. The audience has been looking at Decks for 25 minutes.

Layout: a `CodePane` at left; at right a beat scrubber: four dots for beats with a cursor that follows the real click index, driven by this slide's own `clicks`. Name plate: Decks, TypeScript · Vue. Tag on beat 1: `Recorded`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The code pane shows this stage's own `useStage` call, trimmed (copy array, `beats` function). The scrubber sits on beat 0. | A beat is a function of the click. / This slide is a Vue component on a GSAP timeline. Stepping back plays it in reverse. | Decks is a Slidev addon. Press back and watch. |
| 1 | The code pane swaps to a recorded hook denial from `site/fixtures/hook-denial.json`: an agent's write, the deny, the pattern id. | A hook blocks the worst patterns. / The lint has 27 patterns. Five are denied before the agent's write lands. | The agent that drafted these slides was refused more than once. |
| 2 | A counter chip counts up to the number of rows in this deck's `data-sources.md`. | Every number here has a source row. / A fact-check skill reruns the command behind each figure in this deck. | Briefs have been wrong before. Fresh derivation caught it every time. |

Figures: 27 patterns and 5 denied come from `~/Projects/steamfield/src/data/projects.ts`; re-derive both from `packages/decks/lint/ai-rhetoric-patterns.tsv`. Beat 2's count is computed from the deck's own file at build time. The "refused more than once" line in the notes is true only if it happens; record a real denial during the build or cut the line.

### 28. Six habits

Purpose: the payoff. What the five tools share, shown as a matrix so each habit is tied to evidence.

Layout: a matrix. Rows are the six habits, as short labels in Heros at x 110 to 620. Columns are the five products as pixel icons at x 700 to 1810. A cell lights when the product shows that habit. The thread rail is fully lit under it. Tag: none; every lit cell has a source row.

| Habit | Lit cells and the evidence |
| --- | --- |
| Output is an API | Stacks (`--json`, `stacks schema`), foreman (`--json`), rr (JSON events by default), StatGlass (`--json`, `statglass schema`) |
| Errors name the next step | Stacks (`next`), foreman (`next:` and `or:` lines), rr (`suggestion`), StatGlass (`next`) |
| One exit code, one action | Stacks, foreman, rr, StatGlass |
| Done is a command | Stacks (`verify`), foreman (the contract's gate, run by Claude), Decks (`check`, `lint`, guard tests) |
| Safe with several agents | rr (host locks), foreman (a worktree per run), Stacks (state outside the project), Decks (`shot` and `snap` pick free ports) |
| The docs ship in the binary | Stacks (`stacks` prints the agent guide; `skill install`), foreman (`guide`, `skill install`), StatGlass (`guide`, `skill install`), rr (plugin with a skill), Decks (`decks init`) |

Confirm each cell against the product before lighting it, and drop any you cannot source.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Rows 1 and 2 light, left to right. | Treat output as an API. / A flag for JSON, a published schema, and errors that say what to run next. | The second try works instead of the fifth. |
| 1 | Rows 3 and 4 light. | Make done a command. / One exit code per action, and a check the agent cannot edit. | If done is a feeling, the agent will feel done. |
| 2 | Rows 5 and 6 light. | Assume several agents at once. / Locks, worktrees, and a guide the binary prints itself. | The docs that ship in the binary always match the installed version. |
| 3 | The matrix dims to the row labels; the rail glows. | None of these tools calls a model. / They are ordinary CLIs and one app. The agent support is in how they print. | You can do every one of these in the tool you already maintain, on Monday. |

### 29. Close

`CloseStage`: the cover's `NightDriveField` returns with the sun lower on the horizon. Title in Orbitron: STEAMFIELD.IO. Lede in Heros: "Five products, all open source." An `OdQrCard` to `https://steamfield.io`. Byline as the cover. One beat. This slide stays up during Q&A, so add a small line of install commands under the lede in JetBrains Mono, taken from `~/Projects/steamfield/src/data/projects.ts`: `npm install -g @steamfield/stacks`, `npm install -g @steamfield/foreman`, `brew install rileyhilliard/tap/rr`.

### Extension slides (hidden in the 30-minute cut)

E1, Stacks tamper check. Port `stacks-api/apps/web/src/islands/blog/scenarios/tamper-check.ts` into an `AgentPane`. Beats: an agent edits a `run` in `manifest.json` to `true`; `stacks verify` prints "Verify steps changed" and exits 5 with nothing run; `CLAUDECODE=1 stacks verify --accept-changes` exits 6; a person runs `--accept-changes` in a terminal. Source the mechanism from `src/core/verify/tamper.ts`.

E2, foreman's fake Codex. Tree focus on `tests/fixtures/fake-app-server/`. Beats: `main.mjs` (117 lines, refuses any argv other than `app-server --listen stdio://`); the `askOrchestrator` scenario from `scenarios.ts` lines 100 to 110; the recorded real session it replays (`tests/fixtures/codex-0.166.0.jsonl`). Point: fake the process boundary, and take the payloads from a recording.

E3, rr in two views. Port `MonitorStage.tsx` fully: monitor cards on top, and under them the same run as `--pretty` text and as JSON events, switching by beat. All `Recorded`.

E6, Stacks MCP. Beats: three tools in `packages/mcp/src/toolkit.ts` lines 13 to 58 (`stacks_list`, `stacks_new`, `stacks_verify`) with their readonly and destructive annotations; each spawns the CLI with `--json`; a drift test keeps the schemas in step. Point: the MCP server is a thin wrapper because the CLI was already an API.

## 11. Numbers and provenance

`data-sources.md` follows the skeleton in `.claude/rules/deck-data.md`: one section per slide, one row per figure with the command or file that produces it, a "Numbers refresh (2026-11-13)" section, and a "Banned on-slide content (checked)" section. Every `data/*.ts` module opens with a provenance header naming its source repo, file, line range, the commit it was read at, and the date.

Derive each number fresh with the recorded command even though this file states it. Commits the research read: stacks `a952e96`, statglass `5db8622a`. Record the commit for the others when you read them.

Code excerpts live in `data/code/<slide>-<name>.ts` as the exact text plus `{ repo, path, lines, commit }`. Add a test that reads each source file, when the sibling repo is present at `~/Projects/<repo>`, and fails if the excerpt's untrimmed lines no longer match. Skip it cleanly when the repo is absent so CI on another machine still passes.

Known conflicts and stale facts. Each needs a decision recorded in `data-sources.md`:

| Fact | What the research found |
| --- | --- |
| StatGlass version | The repo is at 0.12.0 (2026-11-10). `steamfield/src/data/projects.ts` says 0.3.2. Use the repo. Tell Riley the site is stale; do not fix the site from this task. |
| rr version | Latest tag v0.29.4 (2026-11-03). The site says 0.29.3. |
| rr's parsed frameworks | The code parses pytest, Go test, Jest and Vitest's default reporter. The README omits Vitest. Bun's test runner and Playwright are not parsed. |
| rr speedup | Not measured. See section 4. |
| OpenData test count | "About 14,000" is published. A static count is about 19,600 definitions. Get a collected count (`pytest --collect-only -q` in `opendata/` and `backend/`, `vitest list` in the TypeScript packages, or the totals from one `rr test` run) and use it on slide 3. |
| StatGlass CPU figure | 0.672 percent is one run, before remote monitoring existed. Keep "one run" next to it. |
| StatGlass origin | Author-reported. No repo records it. |
| Agents at once | 2 to 4, author-reported. |
| foreman contract | Free-form markdown. Only the `- May change:` line is parsed. Do not call it a schema. |
| Stacks runtime | The published CLI runs on Node and refuses Bun. Bun builds and bundles it. Do not call it a Bun CLI. |
| A subagent report called rr a Rust tool | It is Go (`go.mod`, Go 1.26). |

Banned on slides: any rr speedup multiple; "load-balanced" for rr; "pushes" or "notifies" for foreman; any size for the StatGlass CLI binary; "all open source".

## 12. Speaker guide and live demos

`SPEAKER-GUIDE.md` follows `examples/texas-2026/SPEAKER-GUIDE.md`. It holds: the talk in one paragraph; how to run the deck with the live shell and how to make the PDF backup; a timing table with a running clock for the default cut; one section per demo slide with its commands, what the audience sees, how long each command takes and how to recover; a pre-talk checklist; the beats that can be dropped if the talk runs long (slide 8 beat 3, slide 13 beat 3, slide 21 beat 4, slide 28 beat 2); and restoring slide 25 if it runs short.

The plan had four release valves, each an optional cue to leave the deck for a live demo. Three of them are now demo slides inside the deck, built on `LiveDemoStage` (section 10), and they are part of the timed cut:

| Valve | Planned | Now |
| --- | --- | --- |
| A | Stacks in a scratch directory, after slide 6 | Slide 07: `stacks new`, `stacks verify` with its exit code, `stacks verify --json` |
| C | rr: two worktrees running `rr test`, `rr monitor` alongside, after slide 16 | Slide 17: `rr monitor --once --no-color`, then `rr demo --pretty` across the four hosts in the root `.rr.yaml` |
| D | StatGlass: the menu bar app, then Timeline and Hosts, after slide 22 | Slide 25 (hidden): `statglass history` and `statglass events` against the running app |

How a demo slide behaves:

- The slide shows a terminal pane and one card per command. The arrow key, the presenter window's next, or the lit card's play button runs the next command. Clicking into the pane lets the speaker type; Esc gives the keys back to the deck.
- The pane runs a shell only when the deck is started with `bun run decks dev agents --live-term` from the repo root on the presenting laptop, and its tag then reads `Live`. In every other case (a build, the PDF export, the website embed, the presenter and overview thumbnails, or a shell that failed) it plays the recording and the tag reads `Recorded <date> · <tool version>`. After a failure the tag also says `live unavailable: <reason>`.
- A press made before the shell is ready, or while a command is still running, is queued and runs at the next prompt, in order. The tag reads `Live · busy` meanwhile.
- The shell resets when the speaker arrives on the slide at click 0 or steps back to click 0. A browser reload keeps the session.
- Only one audience window: two windows on the deck would both send commands to the same shell.

Valve B stays an optional demo that leaves the deck, after slide 11, time-boxed at 3 minutes and outside the timing table. It needs two prepared contracts, the Codex CLI logged in, `foreman doctor` green and the Codex hooks trusted. The commands: `foreman start <name> --new-worktree --contract <file> --write --effort low` for each contract, `foreman status`, `foreman wait --all --timeout 9m`, and `foreman answer <name> <question-id> "<answer>"` if a delegate asks. Whether a delegate asks depends on the model, so rehearse it. It ends by returning to the deck and pressing the arrow key. If it fails, say that slide 11 showed a recorded session and move on.

Pre-talk checklist items the research turned up, kept in the guide: run any `stacks` command once beforehand so the first-run telemetry notice does not appear on stage; run `rr demo --pretty` once to warm the hosts; have StatGlass running long enough to have history if slide 25 is in.

## 13. Build plan

Work in a git worktree under `.claude/worktrees/`. If the build is delegated through foreman or `codex-delegate`, use the wave plan and contract templates in `.claude/skills/building-a-deck/contracts/README.md`; two writers never touch the same files.

Wave 0, design (one agent, then Riley's approval). Scaffold the deck. Write `theme.json`, `styles/tokens.css`, `components/design.ts`, `DESIGN.md`. Build `NightDriveField`, `ThreadRail`, `NamePlate`, `LangChip`, `EvidenceTag`, `CrtFrame`. Build slide 1 and slide 5 completely. Screenshot both at every beat and stop for approval.

Wave 1, shared parts and data (parallel, disjoint files). `RepoTree`; `CodePane` with `scripts/tokenize.mjs` and the excerpt drift test; `TermPane`; `AgentPane`; `PacketPath`. Port the simulations in section 7 into `data/` with provenance headers and a unit test per port that pins a few scene times against the source's own values. Write `data/products.ts` and the first pass of `data-sources.md`.

Wave 2, stages (parallel, one agent per product, each owning its stages, pages and data modules): Stacks (4, 6, 7, E1, E6); foreman (8, 9, 10, E2); rr and the StatGlass origin (11, 13, E3); StatGlass (14, 15, 16); frame and close (2, 3, 18, 19, 20). Each hand-off includes screenshots of every beat from `bun run shot`, the prose audit table, and any beat-count difference from this file.

Wave 3, assembly (the orchestrator). `slides.md` manifest with `clicks:`, titles and `hide: true` on the extensions. Presenter notes for every page. `SPEAKER-GUIDE.md`. The view-transition names in `styles/index.css`. A full walk with `bun run snap`.

Wave 4, review. A fresh agent runs the prose review. The `fact-checking-a-deck` skill runs over `bun run fact-extract agents`. A design pass checks every slide at 1920x1080 and at a 4:3 projector size for clipping, and checks legibility of the smallest code and pixel type. Riley walks the deck in `/presenter` with a timer.

## 14. Definition of done

- `bun run check`, `bun run typecheck`, `bun run test`, `bun run lint` and `bun run build agents` pass, and the story guards report scanning this deck.
- `bun run shot agents <n>` shows no console errors and no wrapped one-line headline on any slide.
- `bun run export agents` produces a PDF in which every slide is readable as a still, including the simulation slides and slide 22's poster.
- Every figure in `bun run fact-extract agents` traces to a row in `data-sources.md`, and each row's command was rerun in the week of the talk.
- Every code excerpt passes the drift test against its source repo.
- Every recording carries a `Recorded` tag with a date, every diagram a `Schematic` tag, and every made-up value an `Illustrative` tag.
- The prose review by an agent that did not write the deck has no open findings.
- Stepping backward through every slide replays each beat in reverse with nothing left behind.
- A timed read-through of the notes lands between 27 and 29 minutes for the 30-minute cut.
- The cover and slide 5 were approved by Riley before the rest was styled.

## 15. Open items for Riley

- Confirm the origin sentence on slide 20 reads the way you would say it.
- Slide 11 needs one batch of foreman runs. If you would rather show a newer session than the 2026-11-06 recordings, record it with `claude-codex/site/scripts/capture-runs.mjs` and point the data module at it.
- Slide 22 embeds the StatGlass demo build. Say whether checking the built demo into this repo is acceptable or the slide should load the hosted copy.
- `steamfield/src/data/projects.ts` has stale versions for StatGlass and rr. That is a separate change to the site.
