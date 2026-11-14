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
2. Three products get deep dives of about five minutes each: Stacks, foreman, StatGlass. The other four (rr, OpenData, OpenChart, Decks) get about 90 seconds each.
3. The spine is one piece of work moving from start to ship, told with real recordings stitched together. Each step shows something that happened, taken from artifacts already in the repos. It is framed as how work moves through the stack. It never claims to be one literal feature followed end to end.
4. The look is Steamfield synthwave, taken from steamfield.io and built as its own design system with a `DESIGN.md` and tokens, to the texas-2026 standard. Update, 2026-11-13: the deck matches the site hero's look and feel. Every slide sits inside the hero's CRT tube (scanlines, phosphor mask, grain, hum bar, tube corners, the slight barrel distortion) and uses its aged palette; the cover and close run the hero's three.js scene, with the sun rising over one minute. The heavy tape tracking noise is the one effect left out. `DESIGN.md` in this folder is the current design contract, and where section 6 below disagrees with it (the turned-down CRT, scanlines kept off code, the left-aligned cover, the site's full-saturation accents), `DESIGN.md` wins.
5. Effect is taught through the Stacks repo tour. There is no separate Effect primer slide. foreman reuses the ideas without re-explaining them.
6. The landing pages for steamfield.io and each product have animated system diagrams. Reuse them (section 7 is the inventory), and build new ones wherever an animated diagram explains a mechanism better than a static one.
7. Presenter notes are a full speakable script, one paragraph per beat, plus a `SPEAKER-GUIDE.md`.
8. The fleet: Riley typically runs 2 to 4 coding agents at once. This is author-reported; record it as `FLAG: author-reported`.
9. The close is a QR code to steamfield.io.
10. Byline: "Austin JS · November 2026".

## 3. Thesis and arc

The thesis, said once on slide 2 and paid off on slide 18: every tool Riley ships has two users, a person and a coding agent, and the agent support lives in ordinary engineering decisions about output, errors, exit codes and concurrency. None of the tools calls a model.

The thread is a verb per product, in the order work flows:

| Step | Product | Language shown on its chip | Depth |
| --- | --- | --- | --- |
| Start | Stacks | TypeScript · Effect 4 | Deep dive |
| Delegate | foreman | TypeScript · Effect 4 | Deep dive |
| Test | rr | Go | Brief |
| Watch | StatGlass | Rust + TypeScript | Deep dive |
| Ask | OpenData | TypeScript MCP server · Python engine | Brief |
| Chart | OpenChart | TypeScript | Brief |
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

- No em dashes anywhere. No marketing adjectives. Product names keep their casing: OpenData, OpenChart, StatGlass, Stacks, rr, Decks, foreman.
- Print the evidence status on the object, as a small pixel-type tag. There are three: `Recorded` (replays a real artifact; the tag carries the date), `Schematic` (a diagram of how something works, with no real data), `Illustrative` (made-up sample values). Never rely on a legend. A stage that mixes a recording with a schematic tags each part.
- Print the language on every product's first slide as a chip (the table in section 3). rr is Go. StatGlass is about 60 percent Rust and its agent CLI is Rust. OpenData's engine is Python. Say these plainly; they are part of the talk, and slide 14 turns one of them into a point.
- Code on a slide is real code, quoted from the named file, trimmed with `// …` where lines are dropped. Never paraphrase code into something that would not compile. At most 14 lines visible at once, set no smaller than 24px at the 1920 canvas.
- Terminal output on a slide is real output from a fixture or a doc, or it is tagged `Illustrative`.
- Every figure comes from a `data/*.ts` constant that cites a row in `data-sources.md`. A figure with no row does not go on a slide. That includes figures in headlines, cards, chips and notes.
- Do not claim a speedup for rr. The README's "roughly a third" is an expectation, and the rr site's own blog says so. If a timing is needed, the only measured one is a README example: 52.9 s wall clock against 97 s summed across three shards.
- Do not say foreman "pushes" or "notifies" Claude. Claude is woken because a background `foreman wait` process exits (slide 9 is about exactly this).
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

The design run writes `DESIGN.md` in the deck directory with the full token map, in the shape of `examples/texas-2026/DESIGN.md`. The cover and slide 4 are the approval samples: build those two first, screenshot them with `bun run shot`, and get Riley's approval before any other stage is styled.

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

- The thread rail runs along the bottom of every content slide, from x 110 to 1810 at about y 990 to 1045, under the card. It shows the seven products as 12x12 pixel icons (data in `~/Projects/steamfield/src/data/pixel-icons.ts`) with the verb under each in pixel type. Products already covered sit at full strength, the current one has a 2px pink marker and its name in Orbitron, the rest sit at the dim level. It is the site's stage rail, moved to the bottom. It carries the view-transition name `vt-thread-rail` so it holds still across slide changes while the marker slides.
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
| `~/Projects/rr/site/src/components/landing/FlowDiagram.tsx` (768 lines) | "How runs share hosts": four agents on a laptop, one rr process per call, three hosts, locks, a waiting column, retries every 2 s | `rr/site/src/lib/flow.ts` (`simulate`, `sceneAt`, `flowSteps`, `FLOW_HOSTS`, `FLOW_RUNS`); the wide geometry constants are at the top of `FlowDiagram.tsx`. steamfield.io has its own port: `~/Projects/steamfield/src/lib/rr-flow.ts` and `src/components/home/RrDemo.tsx` | Slide 10 |
| `~/Projects/rr/site/src/components/landing/MonitorStage.tsx` and `monitor/MonitorCard.tsx` | One real `rr test` run replayed from two sides: `rr monitor` host cards on top, the run's output as a person or an agent sees it underneath | `rr/site/src/lib/monitor/timeline.ts`, `render.ts`; fixtures `rr/site/fixtures/monitor.jsonl`, `run.jsonl`, `run.pretty.txt`, `run.stdout.txt` | Slides 2, 11, E3 |
| `~/Projects/rr/site/src/components/landing/QueueBoard.tsx` | Interactive lock queue | `rr/site/src/lib/queue.ts` | Reference for slide 10's waiting beat |
| `~/Projects/claude-codex/site/src/components/landing/session/SessionCanvas.tsx` (647 lines) and `SessionDiagram.tsx` | Claude, the daemon board and delegate cards in worktrees, with packets travelling and a held question | `claude-codex/site/src/data/session.ts` (`buildSession`, `sceneAt`, `stepAt`); steamfield.io's port: `~/Projects/steamfield/src/lib/foreman-session.ts`, `src/data/foreman-session.ts`, `src/components/home/ForemanCanvas.tsx` | Slide 7 |
| `~/Projects/claude-codex/site/src/components/landing/Lifecycle.tsx` | The run state machine with a real excerpt per state | `claude-codex/site/src/data/lifecycle.ts` | Reference for slides 8 and 9 |
| `~/Projects/claude-codex/site/src/components/landing/SupervisionConsole.tsx` | A recorded run replayed as a transcript and an event feed | `claude-codex/site/src/data/supervision.ts`; fixtures `claude-codex/site/fixtures/runs/*.json`, `fixtures/cli/*.json` | Slide 9's terminal lines |
| `~/Projects/statglass/docs-site/src/islands/DashboardDemo.tsx`, `PopoverDemo.tsx` | The real React app in an iframe, running on its mock transport | `statglass/docs-site/src/lib/demo.ts` (URL builder, scenarios `multi-host`, `linux-host`, and so on); the demo build comes from `scripts/build-demo.mjs` | Slide 13 |
| `~/Projects/steamfield/src/components/home/StatGlassDemo.tsx` | The popover on simulated readings | `~/Projects/steamfield/src/lib/statglass-demo.ts` (every value a pure function of the sample number) | Slides 11 and 12 |
| `~/Projects/stacks-api/apps/web/src/islands/home-cli-script.ts` and `islands/blog/scenarios/*.ts` (`verify-loop`, `tamper-check`, `new-project`, `brief-preview`) | Scripted agent sessions with the stacks CLI | The scenario files are data (`DemoTurn[]`) | Slides 4, 6, E1 |
| `~/Projects/steamfield/src/data/opendata-demo.ts`, `src/lib/opendata-demo.ts`, `OpenDataDemo.tsx` | A four-turn Claude session with real queries, rows and run times | The data module | Slide 15 |
| `~/Projects/openchart/examples/src/gallery/agents/` (`scenarios.ts`, `replay.ts`) | "Chat analyst: write, repair, refine": an emitted spec runs through the real `validateSpec` | The scenario data; the deck calls `validateSpec` itself at module load | Slide 16 |
| `~/Projects/decks/site/src/components/landing/DeckPlayer.tsx`, fixture `site/fixtures/hook-denial.json` | A deck stepping through beats; a recorded hook denial | The fixture | Slide 17 |

New animated diagrams this deck builds because none exists: the Stacks loop with its real verify timeline (slide 4), the foreman process diagram (slide 8), the held-question sequence diagram (slide 9), the Rust to TypeScript sample pipeline (slide 12), the Transport fork (slide 13), the split tool result (slide 15) and the habits matrix (slide 18).

## 8. The arc

Thirty-minute cut: 19 slides, 68 beats, about 27.5 minutes of script, which leaves room for slide changes and one release valve.

| # | Page / stage | Headline (draft) | Step | Beats | Min |
| --- | --- | --- | --- | --- | --- |
| 1 | `01-cover` / `StoryCover` + `NightDriveField` | Building for agents | | 1 | 0.5 |
| 2 | `02-two-users` / `TwoUsersStage` | Every tool I ship has two users. | | 3 | 1.25 |
| 3 | `03-thread` / `ThreadStage` | One change passes through seven tools. | | 3 | 1.25 |
| 4 | `04-stacks-loop` / `StacksLoopStage` | Stacks hands the agent a brief and a finish line. | Start | 4 | 1.75 |
| 5 | `05-stacks-tour` / `StacksTourStage` | An Effect CLI is commands, services and one error table. | Start | 6 | 2.75 |
| 6 | `06-stacks-output` / `StacksOutputStage` | Stacks prints the same result three ways. | Start | 4 | 1.5 |
| 7 | `07-foreman-session` / `ForemanSessionStage` | Claude delegates to Codex, one worktree per task. | Delegate | 5 | 2.0 |
| 8 | `08-foreman-daemon` / `ForemanDaemonStage` | A daemon sits between the two agents. | Delegate | 4 | 1.5 |
| 9 | `09-foreman-question` / `ForemanQuestionStage` | A held question is an unanswered request. | Delegate | 4 | 1.5 |
| 10 | `10-rr-locks` / `RrLocksStage` | rr gives every run its own machine. | Test | 5 | 2.0 |
| 11 | `11-monitor-to-glass` / `MonitorToGlassStage` | I kept rr monitor open all day, so I built an app. | Watch | 3 | 1.0 |
| 12 | `12-glass-boundary` / `GlassBoundaryStage` | Rust owns the data. TypeScript draws it. | Watch | 5 | 2.0 |
| 13 | `13-glass-browser` / `GlassBrowserStage` | The whole app runs in a browser tab. | Watch | 2 | 1.0 |
| 14 | `14-glass-cli` / `GlassCliStage` | Agents ask StatGlass what happened at 3pm. | Watch | 3 | 1.25 |
| 15 | `15-opendata` / `OpenDataStage` | OpenData answers the model and the person separately. | Ask | 4 | 1.5 |
| 16 | `16-openchart` / `OpenChartStage` | OpenChart tells the agent which field is wrong. | Chart | 4 | 1.5 |
| 17 | `17-decks` / `DecksStage` | Decks rejects a sentence before it reaches a slide. | Present | 3 | 1.25 |
| 18 | `18-habits` / `HabitsStage` | Six habits carry across all seven tools. | | 4 | 1.5 |
| 19 | `19-close` / `CloseStage` | Start at steamfield.io. | | 1 | 0.5 |

The headlines record each slide's claim. The wording is a draft and has to pass the prose audit. A figure in a headline is subject to `data-sources.md`; if the check changes the figure, the headline changes.

Cross-slide morphs (only adjacent slides share a name; add each name in both places in `styles/index.css`, per `story-stage.md`):

- `vt-thread-rail`: every content slide to the next. The rail holds; the marker slides.
- `vt-thread-row` (slide 3 to slide 4): the seven stations collapse down into the rail.
- `vt-host-cards` (slide 10 to slide 11): rr's three host boxes become the three `rr monitor` cards.
- `vt-chart-card` (slide 15 to slide 16): the chart that rendered in the conversation lifts out and becomes slide 16's render target.

## 9. Stretching to 40 minutes

Six extension slides sit in the manifest with `hide: true` in their stanza. Removing `hide` from all six brings the deck to about 38 minutes. `SPEAKER-GUIDE.md` lists them in the order to restore if only some fit. They are specified at the end of section 10. `beats.test.ts` still checks a hidden slide; confirm that against the Slidev version in the lockfile, and if hidden slides break a guard, keep the extensions in a second manifest (`slides-40.md`, alias `agents-40`) instead.

| # | Page / stage | Headline (draft) | After | Beats | Min |
| --- | --- | --- | --- | --- | --- |
| E1 | `06b-stacks-tamper` / `StacksTamperStage` | Editing a verify step stops verify. | 6 | 4 | 1.5 |
| E2 | `09b-foreman-fake-codex` / `ForemanFakeStage` | A 117-line script stands in for Codex. | 9 | 3 | 1.5 |
| E3 | `10b-rr-two-views` / `RrTwoViewsStage` | One run reads differently to a person and an agent. | 10 | 4 | 1.5 |
| E4 | `15b-mcp-app` / `McpAppStage` | The chart is a React app the server ships as one file. | 15 | 4 | 2.0 |
| E5 | `15c-benchmark` / `BenchmarkStage` | With the connector, 25 of 30 answers were right. | E4 | 3 | 1.25 |
| E6 | `06c-stacks-mcp` / `StacksMcpStage` | The MCP server is three tools that shell out. | E1 | 3 | 1.0 |

## 10. Per-slide spec

Coordinates are in the 1920x1080 stage viewBox. Card copy is given as `lead` / `body`. "Say" is the gist of that beat's note; the builder writes the full paragraph in Riley's voice (first person, plain, specific, no hype; `~/Projects/steamfield/src/content/blog/design-cli-for-ai-agents.mdx` and `why-steamfield.mdx` are the voice references and hold much of the argument).

### 1. Cover

`StoryCover` with a deck-local `NightDriveField` in its `field` slot: the site hero in miniature, still. Sky gradient, the mark as the sun with its disc on the horizon at 70 percent of the height, a ridgeline, the neon grid floor. Take the mark's geometry from `~/Projects/steamfield/src/components/brand/paths.ts` and the layering from `src/components/home/NightDrive.astro`. The ridgeline is real data, as on the site: the seven-day average of commits per day across the product repos, from `~/Projects/steamfield/src/data/commits.json`. Give it an `EvidenceTag` and a source row.

- Title in Orbitron: BUILDING FOR AGENTS. One Mr Dafoe script line across it: "in TypeScript".
- Lede in Heros: "Agent tooling and infrastructure, from CLIs to a native macOS app."
- Byline: Riley Hilliard · Steamfield · Austin JS · November 2026.
- Entrance: the grid light builds, then the sun rises a short way on `TRACE` and settles. The grid drifts toward the viewer as ambient motion. One beat, no card.
- Say: who I am, that Steamfield is a small studio that builds its own products, and that tonight is seven tools I built because coding agents became the main user of my command line.

### 2. Two users

Purpose: define DX and AX with one real run seen from both sides. Source: `rr/site/fixtures/` (the same `rr test` run recorded as `run.pretty.txt` and `run.jsonl`), which is what `MonitorStage.tsx` replays.

Layout: two `CrtFrame` terminals side by side above the card line. Left is labelled "What I see", right "What the agent reads". Tag: `Recorded`, with the fixture's date.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Left terminal fills with the `--pretty` run: phases, spinners resolved to ticks, a pass summary. Right terminal is dark. | A person skims this. / Colour, spinners and a progress line redrawn on every tick. | This is developer experience. I glance at it and move on. |
| 1 | Right terminal fills with the raw bytes of that pretty output, escape codes visible (use `rr/site/fixtures/raw/` if it holds them; otherwise show the pretty text with its ANSI sequences written out and tag the pane `Illustrative`). | An agent reads every byte. / It pays for each one in context and acts on it literally. | The agent does not skim. A redrawn progress line arrives as dozens of escape sequences. |
| 2 | Right terminal cross-fades to the JSON events for the same run; the `result` line is pink. A chip names it: `"type":"result"`. | So the output becomes an API. / DX is what I see at the terminal. AX is what the agent reads. | Agent experience. The rest of the talk is what changes when you design for the right-hand screen. |

### 3. The thread

Purpose: show all seven products once, in the order work flows, and set up the rail.

Layout: a road line across the stage at y 560, drawn on `TRACE` at entrance, with seven stations. Each station is a pixel icon in a small CRT tile, the verb in pixel type under it, and (from beat 1) the product name in Orbitron and its `LangChip`. Tag: `Schematic`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The line and seven tiles with verbs only: Start, Delegate, Test, Watch, Ask, Chart, Present. | I built each one for my own work. / Most started inside OpenData, whose test suite is about 14,000 tests. | I did not plan seven products. Each one was a chore I got tired of. |
| 1 | Names and language chips land on an eased stagger, left to right. | Most of it is TypeScript. / rr is Go, and StatGlass keeps its samplers in Rust. | This is a JS meetup, so I will say up front which parts are not JS. |
| 2 | Stacks, foreman and StatGlass brighten; the other four drop to the dim level. Then the row hands off to the rail (`vt-thread-row`). | Three get a closer look tonight. / Stacks, foreman and StatGlass, with the repo open. | The other four get ninety seconds each. |

Figure: "about 14,000" is the published figure on the rr site and in `why-steamfield.mdx`. A static count on 2026-11-13 found about 14,300 Python test functions and about 5,300 TypeScript test cases in the OpenData monorepo. Re-derive a collected count before the talk (`data-sources.md` row; see section 11) and use whatever it returns.

### 4. Stacks: the loop

Purpose: the product workflow. Stacks writes a brief, the agent builds, `stacks verify` decides when it is done.

Layout: a loop drawn left to right across y 300 to 520: a command chip (`stacks new sveltekit tea-dashboard`), a stack of file chips (`AGENTS.md`, `.claude/`, `.stacks/BRIEF.md`, `.stacks/manifest.json`), an agent box, a verify gate, and a return path from the gate back to the agent. Below it, at y 600 to 680 on the right two thirds, an `InkTimeline` in seconds since scaffold with an `InkTimelineCursor`. Name plate: Stacks, TypeScript · Effect 4.

Data: `~/Projects/stacks-tests/tea-dashboard/.stacks/state/runs.jsonl` (a real Claude Code build with stacks 0.5.0: failed at 393 s, green at 501 s and 623 s after scaffold), its `BRIEF.md` (4,481 words by `wc -w`) and `manifest.json`. Tag the timeline `Recorded 2026-10-29`. The loop itself is `Schematic`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The command chip types in; the file chips drop out of it one by one. | One command writes the brief. / Starter files, agent instructions and a 4,481-word BRIEF.md. It runs nothing from the stack. | A stack is a Markdown recipe. The CLI never calls a model and pins no versions. |
| 1 | The hand-off prompt appears over a `PacketPath` from the files to the agent box. | The hand-off is one sentence. / Read .stacks/BRIEF.md and carry it out. You are done when stacks verify passes. | That sentence is the entire prompt. Everything else is in the brief. |
| 2 | The cursor glides along the timeline to 393 s: the gate shows a pink ✕ and a packet returns to the agent. Then to 501 s: the gate turns phosphor. | Verify failed once, then passed. / A real Claude Code build: failed at 393 seconds, green at 501. | This is a real run record. The agent was not done at six and a half minutes, and verify said so. |
| 3 | The manifest chip gets a lock; a digest chip appears outside the project box, in a region labelled "your machine". | The agent cannot move the finish line. / Steps are hashed outside the project. Edit one and verify refuses to run. | An agent that cannot make a test pass will sometimes delete the test. This is the answer to that. |

Release valve A (2 minutes, after this slide): `stacks search`, `stacks show typescript-cli`, `stacks new typescript-cli demo-cli --sandbox --no-launch`, `stacks verify --json; echo "exit=$?"` in a scratch directory with `--offline`. Script in `SPEAKER-GUIDE.md`.

### 5. Stacks: the repo tour

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
tests/            209 files, real command tree, fake layers
```

| Beat | Tree | Code pane | Card | Say |
| --- | --- | --- | --- | --- |
| 0 | Draws in. `bin.ts`, `main.ts`, `cli.ts` lit. A chip reads "203 files · 24,386 lines". | Empty frame. | Three files start every run. / bin.ts touches Node, main.ts maps errors to exit codes, cli.ts builds the command tree. | A lint rule rejects a Node import anywhere else. |
| 1 | `commands/` focused. | `commands/runs.ts` lines 1 to 25, trimmed to the `Command.make` call and `withDescription`. Focus the handler. | A command is one small file. / Flags, a thin handler, and help text that lists its own exit codes. | `yield*` pulls a service out of the environment. That is all the Effect you need to read this. |
| 2 | `services/` focused. | `services/host.ts` lines 29 to 48, trimmed: the class line, `static layer`, `static memory`. | A service ships with its own fake. / Host.layer wraps the real process. Host.memory is the test double, in the same class. | A service is an interface with a name. A layer is how you build one. |
| 3 | `runtime.ts` and `bin.ts` focused. | `runtime.ts` lines 11 to 19 (`AppLayer`). | Layers wire it together once. / Config, then output, then logging and processes. Tests call the same function. | This is dependency injection that the compiler checks. |
| 4 | `errors.ts` focused. | `errors.ts` lines 425 to 443, trimmed to six rows and the `satisfies` clause. Focus `satisfies`. | Every error has one row. / Exit code, retryable, keeps its report. The compiler rejects an error with no row. | Add an error class and forget the row, and the build fails. |
| 5 | `tests/` focused. | `tests/update.test.ts` lines 250 to 279, trimmed to the fake `HttpClient`, the `runCli` call with `http: Layer.succeed(...)`, and the `expect` on the envelope. | Tests swap a layer. / The real command tree runs against a fake HttpClient. There are no module mocks. | The assertion is the exact JSON an agent would get, including the next step. |

Facts to verify before quoting: Effect 4.0.6 with the built-in `effect/cli` module (not `@effect/cli`); the published CLI runs on Node 22 or newer and refuses Bun, while Bun is the package manager and bundler. Put those in the notes for beat 0.

### 6. Stacks: three audiences

Purpose: the AX payoff of the tour. One result, three renderings, and exit codes that each mean one action.

Layout: three `TermPane`s side by side (x 110 to 1810, y 200 to 640), labelled in pixel type: PERSON, AGENT, SCRIPT. Below them from beat 3, a strip of exit-code tiles. Card bottom left.

Data: human text from `packages/cli/docs/quickstart.md` lines 150 to 157; the `VerifyFailed` envelope from `packages/cli/tests/errors.test.ts` lines 373 to 380; the exit table from `packages/cli/docs/reference/output.md` lines 70 to 85; the audience rule from `src/services/output.ts` lines 24 to 32 and the agent markers from `src/config.ts` lines 58 to 71. Get the agent-text rendering by running `CLAUDECODE=1 stacks verify` in the tea-dashboard project and recording it; tag panes `Recorded` only if they are.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | PERSON pane: `verify: failed (full run; 0 passed, 1 failed, …)` with colour and the `Next:` line. | A person gets colour and a summary. / Only when stdout is a terminal, no agent is detected and CI is unset. | Human output is the special case. |
| 1 | AGENT pane: the same facts, no ANSI, `> step` lines. A chip lists `CLAUDECODE · CODEX_* · CURSOR_AGENT · AI_AGENT`. | An agent gets the same facts, plain. / Stacks checks for agent markers in the environment, then drops colour and progress. | Nobody has to pass a flag. The CLI works out who is reading. |
| 2 | SCRIPT pane: one `VerifyResult` object, then the error envelope with `"next"` in pink. | A script gets one JSON object. / The error envelope is the last line of stderr, with the next step written out. | `stacks schema` prints the JSON Schema for every one of these shapes. |
| 3 | The panes dim. Exit tiles rise: 0, 2, 3, 4, 5, 6, 130, each with its action from the table. 5 and 6 are bright. | Each exit code means one action. / Five means read the report. Six means ask a person. | A published code never changes meaning. Treat it like an API. |

### 7. foreman: the session

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

Release valve B (3 minutes): two prepared contracts, `foreman start … --new-worktree --contract … --write --effort low`, `foreman status`, `foreman wait --all --timeout 9m`, `foreman answer`. Script in `SPEAKER-GUIDE.md`. Rehearse it; whether the delegate asks depends on the model.

### 8. foreman: the daemon

Purpose: the repo breakaway as a process diagram, with the tree alongside.

Layout: five boxes left to right at y 380: Claude Code, the `foreman` CLI, a socket, the daemon (with "supervisor" inside it), `codex app-server`, then three thread lanes fanning out. A small `RepoTree` at right (x 1340 to 1810, y 200 to 640) lists `src/commands/`, `src/core/`, `src/daemon/`, `src/supervisor/`, `src/codex/`, `src/guide/`, `src/schemas/`, `src/errors.ts`; the folder that implements the lit box is focused. Tag: `Schematic`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Boxes draw. A CLI call blips in and fades out while the daemon stays lit. | The CLI exits. The daemon stays. / Runs outlive the command that started them. It quits after 30 idle minutes. | Same Effect layout as Stacks. I scaffolded foreman from the Stacks typescript-cli stack. |
| 1 | The socket lights violet; frames `{ id, body }` pass both ways. Tree focus: `src/daemon/`. | They talk over a Unix socket. / Newline-delimited JSON. If the socket is missing, the CLI starts the daemon. | One daemon per home directory, held by an exclusive SQLite transaction. |
| 2 | The Codex side lights; chips name `thread/start`, `turn/start`, `turn/steer`. Tree focus: `src/codex/`, `src/supervisor/`. | One Codex process serves every run. / JSON-RPC over stdio, routed by thread id. | This is the Codex app-server protocol. There is no SDK dependency. |
| 3 | A chip under Codex: "0.166.0 · 467 schema files". Four small binaries appear under the CLI box: darwin-arm64, darwin-x64, linux-x64, linux-arm64. | The protocol is pinned by hash. / A hash over 467 schema files from Codex 0.166.0. foreman doctor reports a mismatch. | It ships as one binary per platform, built with `bun build --compile`. |

Figures: 9,189 lines of TypeScript in `src` excluding tests, 44 test files, 111 commits from 2026-11-05 to 2026-11-07. Use them in notes; re-derive first.

### 9. foreman: the held question

Purpose: the technical heart. Two mechanisms that are simpler than people expect.

Layout: a sequence diagram with four lifelines at x 300, 700, 1100, 1500: Claude, `foreman wait` (labelled "background task"), daemon, Codex. Messages are `PacketPath`s between lifelines. A `CodePane` sits at the right third from y 560 down when a beat shows code; the card is bottom left. Tag: `Schematic`. Code excerpts carry their own path labels.

| Beat | Stage | Code pane | Card | Say |
| --- | --- | --- | --- | --- |
| 0 | Codex sends `item/tool/call ask_orchestrator` to the daemon. The daemon lifeline turns yellow and nothing goes back. | `src/supervisor/questions.ts` lines 125 to 157, trimmed to `run.calls.set(id, …)`, the `QuestionAsked` event and `registry.state(run, "waiting")`. | Codex calls a tool named ask_orchestrator. / The daemon stores the request id and sends no reply, so the turn blocks. | Holding a question is just declining to answer an RPC. |
| 1 | The daemon resolves a marker; the `foreman wait` lifeline prints one line (`question  slug q1 …` and `next: foreman answer …`) and ends. An arrow from its end reaches Claude. | `src/supervisor/registry.ts` lines 114 to 119 (`wake`). | Claude wakes when a process exits. / A background foreman wait returns, and Claude Code reports the finished task. | Nothing is pushed to Claude. I used the notification Claude Code already has. |
| 2 | Claude sends `foreman answer`; the daemon responds to the stored request; Codex resumes. | `questions.ts` lines 82 to 87 (`respond(rpc.id, …)`). | The answer is the JSON-RPC response. / After fifteen minutes with none, the daemon replies itself: carry on without it. | A late answer still arrives, as a steer into the running turn. |
| 3 | The diagram dims. | `tests/supervisor-integration.test.ts` lines 6317 to 6334, trimmed to `f.start({ questionTimeoutMs: 1000 })`, `TestClock.adjust(1000)` and the two `expect`s. | The timeout test takes no time. / Effect's TestClock moves the clock. A 117-line script plays Codex. | Every one of these states has a test like this. |

### 10. rr: host locks

Purpose: how test runs are spread across a fleet of agents. rr is the one Go tool; say so in the first sentence.

Layout: port `FlowDiagram.tsx`'s wide geometry: a laptop region at left holding four agent rows (each labelled with its worktree), a "Waiting for a host" column, and three host boxes at right. Each agent's rr process is a pink chip that moves between the agent row, the waiting column and a host. Colors follow the site's Fig. 6: pink the rr process, cyan its output, violet rsync, yellow waiting, phosphor a passing exit code. Name plate: rr, Go. Tag: `Schematic`, source line "rr's own simulation of its lock rules".

Data: `rr/site/src/lib/flow.ts` (`FLOW_HOSTS` is `m4-mini`, `m1-linux`, `m1-mini`; `FLOW_RUNS` has four agents; poll interval 2,000 ms). For beat 4, line 4 of `rr/site/fixtures/run.jsonl`: a real result event from an OpenData run with a Vitest failure at `src/data/articles/charts-json.test.ts:74`.

| Beat | Stage (`t` still) | Card | Say |
| --- | --- | --- | --- |
| 0 | Laptop, four agents, three hosts draw. All hosts free. | Four agents, three hosts, no server. / Each rr call is its own process. They coordinate only through a lock on each host. | rr is Go, the one tool tonight that is not TypeScript. It is here because the agents use it all day. |
| 1 | Agent 1 runs a parallel `rr test`: its chips lock all three hosts; violet rsync bars, then cyan test bars. | A parallel task takes every host. / One shard per machine, synced by rsync and run over SSH. | A shard is just a task I define. OpenData's `rr test` fans out to eight. |
| 2 | Agents 2 and 3 arrive, find every lock held, move to the waiting column and tick every 2 s. A chip shows `"status":"waiting"` with the holder's command. | Late runs wait and say why. / The waiting event names the holder, so the agent does not kill a healthy run. | A silent wait looks like a hang. An agent that thinks a command hung will do something worse. |
| 3 | Agent 1 finishes (phosphor tags). Agent 2 takes the first host, agent 3 the second; agent 4 arrives and takes the third without waiting. | A freed host goes to the next retry. / Each worktree syncs to its own remote directory by default. | I usually have two to four agents going. They never collide. |
| 4 | The diagram dims; a `TermPane` strip rises along the bottom third showing the real result event, with `"file":"…charts-json.test.ts:74"` in pink. Tag on the strip: `Recorded`. | The result names the failing line. / rr parses pytest, Jest, Vitest and Go output into file, line and message. | The agent reads one line instead of scrolling a log. |

Notes also carry: the hosts in OpenData's real config are `mbp`, `m4-mini` and `m1-mini` (`~/Projects/opendata/.rr.yaml` lines 34 to 60), which differs from the simulation's host names; OpenData sets `worktree_isolation: false`, so beat 3's body describes rr's default, which is why it says "by default". Release valve C (2 minutes): two worktrees running `rr test` at once with `rr monitor` in a third pane.

### 11. From rr monitor to StatGlass

Purpose: the origin story, told as a morph. `FLAG: author-reported`: nothing in either repo records that StatGlass came from watching `rr monitor`. It is Riley's account; the note says "I".

Layout: three host cards across the stage at y 240 to 620. They arrive from slide 10 through `vt-host-cards`. In beats 0 and 1 they are `rr monitor` TUI cards inside one wide `CrtFrame` terminal: VT323, braille sparklines, CPU and RAM, latency, and `> <command>` for the lock holder. Port `rr/site/src/lib/monitor/timeline.ts` and `render.ts`, fed by `rr/site/fixtures/monitor.jsonl` (hosts `m1-mini`, `m4-mini`, `mbp`). In beat 2 the bezel dissolves and the same three cards redraw as StatGlass host cards in the app's style, under a macOS menu bar strip with the StatGlass item. Name plate: StatGlass, Rust + TypeScript. Tags: `Recorded` on the monitor replay; `Illustrative` on the StatGlass cards unless they are driven by a real capture.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The monitor replay plays to its busiest frame (`busiestFrame` in `timeline.ts`). | rr monitor shows the fleet live. / CPU, memory and the command holding each lock, read over SSH. | I added this to rr as a debugging aid. Then I noticed it was always open. |
| 1 | A history bar under the cards fills to its end and stops; a chip reads "600 samples". | It remembers ten minutes. / A 600-sample buffer that is gone when the terminal closes. | The question I kept asking was about earlier: why were the fans going at three? |
| 2 | The cards morph; the history bar extends far to the left, ticked at 1 h, 24 h, 7 d, 30 d. | StatGlass keeps 30 days. / A menu bar app for Apple Silicon, with the same hosts and their history in SQLite. | It used to be called Kelvo. It also reads rr's lock file and shows which job holds each host. |

### 12. StatGlass: the boundary

Purpose: the repo breakaway for the native app. Where the Rust and TypeScript line falls and how one tick crosses it.

Layout: two columns with a seam between them. Left (x 110 to 800), three Rust boxes stacked: `statglass-collect` (samplers), `statglass-engine` (one-hour ring), `statglass-store` (SQLite, tiers). Right (x 1120 to 1810), four TypeScript boxes: `core/transport`, `core/live-state.ts` (reducer), `app/stores` (zustand), `app/widgets` (SVG). The seam at x 960 is a vertical file tile labelled `src/core/generated/bindings.ts`. A proportion bar under the headline shows Rust against TypeScript by line count. A sample dot (`PacketPath`, cyan) travels the whole route. A `CodePane` slides over the lower half when a beat shows code. Tag: `Schematic`.

| Beat | Stage | Code pane | Card | Say |
| --- | --- | --- | --- | --- |
| 0 | Both columns draw; the proportion bar grows from the centre. | | It is about 60 percent Rust. / Samplers, storage, remote hosts and the menu bar item. TypeScript is the React UI. | The project rule is written down: Rust owns meaning, the client presents. |
| 1 | The seam lights. | Top: `src-tauri/src/commands.rs` lines 68 to 100, trimmed to the attributes and the `subscribe_live` signature. Bottom: the matching line from `bindings.ts` line 150. | One builder emits both sides. / tauri-specta writes bindings.ts: 81 commands and 10 events, checked before every push. | The Rust doc comments come through as TSDoc. |
| 2 | The dot leaves the sampler, passes the ring, crosses the seam as a `frame` message, and repeats on the ambient one-second tick. A chip shows `{ kind: "frame", values: [ … ] }`. | | Samples arrive on a Channel. / One message a tick, with values as a positional array against an announced layout. | Tauri events would work. Channels are built for streams and Rust owns when they stop. |
| 3 | The dot continues: reducer, store, widget. A small live area chart at lower right slides one slot per tick. | `src/app/widgets/lib/use-tick-scroll.ts` lines 24 to 38, trimmed to the `el.animate` call. | One transform animates each tick. / d3 computes the path, React renders SVG, and a single translateX slides it left. | Selectors return flat primitives, so a CPU change does not re-render the memory card. A test counts the renders. |
| 4 | The right column dims and the dot stops at the seam; a menu bar tile on the Rust side stays lit. A chip: "0.67% of one core". | | Idle costs 0.67 percent of a core. / The menu bar item is drawn in Rust. One run on an M3 Max, October 2026. | When no window is open, Rust closes the channel and ticks every two seconds. |

Figures (re-derive): 153,401 lines of Rust in `crates` and `src-tauri` including inline tests; 111,644 lines of TypeScript in `src` including tests and generated code; 81 `__TAURI_INVOKE` calls and 10 events; 0.672 percent of one core and 104.9 MB, menu bar only, a single run recorded in `plan/competitor-benchmarks.md` and `README.md` lines 182 to 196. The card says "one run" because it is one run.

### 13. StatGlass: in a browser tab

Purpose: the DX point a JS audience will take home. The UI depends on an interface, so the whole app runs without Tauri.

Layout: beat 0 is a fork diagram: a "React UI" box at left, a `Transport` interface tile in the centre, two implementations at right ("Tauri: commands and Channels" and "Mock: in-browser fake backend"), with a `CodePane` under it showing the interface from `src/core/transport/contracts.ts` (pick the six to ten lines that declare `subscribeLive` and one request method). Beat 1 replaces the diagram with the real dashboard.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The fork draws; the mock branch lights cyan. Tag: `Schematic`. | The UI never imports Tauri. / It calls a Transport interface with two implementations: the native one and a mock. | The repo's AGENTS.md states the rule; check whether lint enforces it before saying so. |
| 1 | A browser-chrome frame fades in holding the real StatGlass dashboard running on its mock transport, scenario `multi-host`. Tag: `Illustrative data`, source "the real app, mock transport". | This is the real React app. / The mock feeds it. Vitest, Playwright and the docs site run the same build. | I do most UI work in a browser with hot reload and never start the native shell. |

The embed: the demo build is produced by `statglass/scripts/build-demo.mjs` into `docs-site/public/demo` and is served at `statglass.steamfield.io/demo/index.html?window=dashboard&scenario=multi-host` (URL builder in `docs-site/src/lib/demo.ts`). Copy the built demo into the deck's `public/statglass-demo/` so the talk does not depend on venue wifi, and load the iframe only in the real slide view. Presenter, overview and export show a poster screenshot instead (capture it with `bun run shot`). If the build is too large to check in, load the hosted URL and fall back to the poster after a short timeout. This slide is also release valve D: click into the frame and open Timeline and Hosts.

### 14. StatGlass: the agent CLI

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

### 15. OpenData

Purpose: 90 seconds on an MCP server written in TypeScript, and the idea that one tool result serves two readers.

Layout: an `AgentPane` in chat layout at left (x 110 to 1000), replaying the steamfield.io session from `~/Projects/steamfield/src/data/opendata-demo.ts` (the queries, rows and run times there are the ones that ran; use its first turn). At right (x 1060 to 1810), a "tool result" tile that splits in beat 2 into two branches. Name plate: OpenData, with two chips: "MCP server: TypeScript" and "Engine: Python · DuckDB". Tag: `Recorded` on the session.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The question posts; a `search_datasets` step row opens. | The MCP server is TypeScript. / Fourteen tools on Bun and Hono, in front of a Python and DuckDB engine. | The data engine is Python. Everything an agent touches is TypeScript. |
| 1 | The right tile shows the server's instruction line `WORKFLOW: search_datasets -> query_sql -> openchart` (`mcp/src/server.ts` lines 52 to 62). The `query_sql` step runs. | The workflow is one instruction line. / Search results carry column schemas, so the agent goes straight to SQL. | Tool descriptions are prompts. I tune them from transcripts. |
| 2 | The result tile splits: `content` (text) goes left to a "model" label; `structuredContent` and `_meta` go right to an "iframe" label. | Each result has two readers. / The model gets a text sample. The chart's rows go to the interface only. | Chart rows never enter the model's context. |
| 3 | The chart renders inside the conversation. | The chart renders inside the chat. / A React app in a sandboxed iframe, served by the server as a ui:// resource. | That chart is the next product. |

Figures (re-derive): 14 registered tools, 11 for the model and 3 app-only (`mcp/src/tools/index.ts` lines 23 to 36); query results capped at 60 rows for the model; up to 120 chart rows in `_meta`. Catalog size for the notes: the 2026-11-02 snapshot has 1,046 datasets from 214 providers (`frontend/app/routes/home/_data/landing-snapshot.json`); `why-steamfield.mdx` says 1,036 and 213. Use the snapshot, and say "public data sources", since a few providers are not government.

### 16. OpenChart

Purpose: 90 seconds on validation that an agent can act on.

Layout: three columns. Left (x 110 to 720): a `CodePane` with a JSON spec. Centre (x 760 to 1140): a verdict tile. Right (x 1180 to 1810): the render target, arriving from slide 15 through `vt-chart-card`. From beat 3 a package strip runs along y 660: core, engine, vanilla, then react, vue, svelte. Name plate: OpenChart, TypeScript. Tag: none on the spec; the verdict is live.

The verdict is real: the stage's data module imports `validateSpec` from `@opendata-ai/openchart-engine` (already a dependency of the addon) and calls it on both specs at module load. The error text on screen is whatever it returns. The spec is the bar spec from `~/Projects/openchart/README.md` lines 26 to 44, with one field name misspelled the way the test fixture does it (`packages/engine/src/compiler/__tests__/validate-did-you-mean.test.ts` lines 25 to 40).

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The spec draws in. | A chart is a JSON spec. / Mark, data, encoding and chrome. The engine works out scales, labels and layout. | Agents write config more reliably than drawing code, so the chart is config. |
| 1 | The misspelled line turns pink; the verdict tile shows `path`, `code` and `suggestion` from the real result. | The error points at one field. / A JSON Pointer path, a code, and the nearest column name by edit distance. | The validator is hand-written, about 3,400 lines, for input the compiler never sees. |
| 2 | One token in the spec changes; the verdict turns phosphor; the chart draws through `<OpenChart :spec>`. | One token changes and it renders. / The agent fixed the field the error named and tried again. | The schema also ships as JSON Schema, generated from the types and checked in CI. |
| 3 | The package strip rises; engine is widest, wrappers thin. | The engine never touches the DOM. / The same spec renders in React, in Vue on this slide, or to SVG in Node. | The React wrapper is about 5 percent of the engine's size. |

Figures (re-derive): 6 published packages at 9.0.0; 19 marks (two repo comments still say 16; use the type); non-test lines engine 50,097 and react 2,639; validator 3,369 lines. OpenChart has no CLI and no MCP server of its own; do not imply one.

### 17. Decks

Purpose: 90 seconds, self-referential. The audience has been looking at Decks for 25 minutes.

Layout: a `CodePane` at left; at right a beat scrubber: four dots for beats with a cursor that follows the real click index, driven by this slide's own `clicks`. Name plate: Decks, TypeScript · Vue. Tag on beat 1: `Recorded`.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | The code pane shows this stage's own `useStage` call, trimmed (copy array, `beats` function). The scrubber sits on beat 0. | A beat is a function of the click. / This slide is a Vue component on a GSAP timeline. Stepping back plays it in reverse. | Decks is a Slidev addon. Press back and watch. |
| 1 | The code pane swaps to a recorded hook denial from `site/fixtures/hook-denial.json`: an agent's write, the deny, the pattern id. | A hook blocks the worst patterns. / The lint has 27 patterns. Five are denied before the agent's write lands. | The agent that drafted these slides was refused more than once. |
| 2 | A counter chip counts up to the number of rows in this deck's `data-sources.md`. | Every number here has a source row. / A fact-check skill reruns the command behind each figure in this deck. | Briefs have been wrong before. Fresh derivation caught it every time. |

Figures: 27 patterns and 5 denied come from `~/Projects/steamfield/src/data/projects.ts`; re-derive both from `packages/decks/lint/ai-rhetoric-patterns.tsv`. Beat 2's count is computed from the deck's own file at build time. The "refused more than once" line in the notes is true only if it happens; record a real denial during the build or cut the line.

### 18. Six habits

Purpose: the payoff. What the seven tools share, shown as a matrix so each habit is tied to evidence.

Layout: a matrix. Rows are the six habits, as short labels in Heros at x 110 to 620. Columns are the seven products as pixel icons at x 700 to 1810. A cell lights when the product shows that habit. The thread rail is fully lit under it. Tag: none; every lit cell has a source row.

| Habit | Lit cells and the evidence |
| --- | --- |
| Output is an API | Stacks (`--json`, `stacks schema`), foreman (`--json`), rr (JSON events by default), StatGlass (`--json`, `statglass schema`), OpenData (`outputSchema` on every tool), OpenChart (JSON Schema export) |
| Errors name the next step | Stacks (`next`), foreman (`next:` and `or:` lines), rr (`suggestion`), StatGlass (`next`), OpenData (recovery hints, for example the rate-limit text), OpenChart (`suggestion` with did-you-mean) |
| One exit code, one action | Stacks, foreman, rr, StatGlass |
| Done is a command | Stacks (`verify`), foreman (the contract's gate, run by Claude), Decks (`check`, `lint`, guard tests), OpenChart (`validateSpec`) |
| Safe with several agents | rr (host locks), foreman (a worktree per run), Stacks (state outside the project), Decks (`shot` and `snap` pick free ports) |
| The docs ship in the binary | Stacks (`stacks` prints the agent guide; `skill install`), foreman (`guide`, `skill install`), StatGlass (`guide`, `skill install`), rr (plugin with a skill), Decks (`decks init`), OpenChart (`llms.txt`) |

Confirm each cell against the product before lighting it, and drop any you cannot source.

| Beat | Stage | Card | Say |
| --- | --- | --- | --- |
| 0 | Rows 1 and 2 light, left to right. | Treat output as an API. / A flag for JSON, a published schema, and errors that say what to run next. | The second try works instead of the fifth. |
| 1 | Rows 3 and 4 light. | Make done a command. / One exit code per action, and a check the agent cannot edit. | If done is a feeling, the agent will feel done. |
| 2 | Rows 5 and 6 light. | Assume several agents at once. / Locks, worktrees, and a guide the binary prints itself. | The docs that ship in the binary always match the installed version. |
| 3 | The matrix dims to the row labels; the rail glows. | None of these tools calls a model. / They are ordinary CLIs and one app. The agent support is in how they print. | You can do every one of these in the tool you already maintain, on Monday. |

### 19. Close

`CloseStage`: the cover's `NightDriveField` returns with the sun lower on the horizon. Title in Orbitron: STEAMFIELD.IO. Lede in Heros: "Seven products, most of them open source." An `OdQrCard` to `https://steamfield.io`. Byline as the cover. One beat. This slide stays up during Q&A, so add a small line of install commands under the lede in JetBrains Mono, taken from `~/Projects/steamfield/src/data/projects.ts`: `npm install -g @steamfield/stacks`, `npm install -g @steamfield/foreman`, `brew install rileyhilliard/tap/rr`. "Most" is deliberate: OpenData is open core.

### Extension slides (hidden in the 30-minute cut)

E1, Stacks tamper check. Port `stacks-api/apps/web/src/islands/blog/scenarios/tamper-check.ts` into an `AgentPane`. Beats: an agent edits a `run` in `manifest.json` to `true`; `stacks verify` prints "Verify steps changed" and exits 5 with nothing run; `CLAUDECODE=1 stacks verify --accept-changes` exits 6; a person runs `--accept-changes` in a terminal. Source the mechanism from `src/core/verify/tamper.ts`.

E2, foreman's fake Codex. Tree focus on `tests/fixtures/fake-app-server/`. Beats: `main.mjs` (117 lines, refuses any argv other than `app-server --listen stdio://`); the `askOrchestrator` scenario from `scenarios.ts` lines 100 to 110; the recorded real session it replays (`tests/fixtures/codex-0.166.0.jsonl`). Point: fake the process boundary, and take the payloads from a recording.

E3, rr in two views. Port `MonitorStage.tsx` fully: monitor cards on top, and under them the same run as `--pretty` text and as JSON events, switching by beat. All `Recorded`.

E4, the MCP App. Beats: a tool advertises `_meta.ui.resourceUri` (`mcp/src/tools/tracking.ts` lines 30 to 35); the server serves one self-contained HTML file of about 1.1 MB built with `vite-plugin-singlefile`; the host renders it in a sandboxed iframe; `ontoolresult` delivers `structuredContent` (`mcp/src/mcp-app/main.tsx` lines 96 to 118). Show the 49-line prototype `~/Projects/opendata-mcp-app/src/app/src/App.tsx` lines 9 to 34 as the smallest working example. Riley has given an Austin JS talk on this before (`~/Projects/opendata/talks/austin-js/mcp-apps/`); reuse its diagrams where they fit and do not repeat its jokes.

E5, the benchmark. Two rows of 30 marks, web search against the connector, as `examples/opendata-pitch/components/BenchmarkStage.vue` draws them (port it and its data with provenance). Figures from `~/Projects/opendata/plans/2026-09-11-benchmark-infra/phase1-report.md`: hand-graded, 6 of 30 with web search only and 25 of 30 with the connector. The report's own caveat goes on the slide as a tag, not only in the notes: nine questions were rewritten to need the catalog, the un-rewritten result is 15 against 27, and these are single runs.

E6, Stacks MCP. Beats: three tools in `packages/mcp/src/toolkit.ts` lines 13 to 58 (`stacks_list`, `stacks_new`, `stacks_verify`) with their readonly and destructive annotations; each spawns the CLI with `--json`; a drift test keeps the schemas in step. Point: the MCP server is a thin wrapper because the CLI was already an API.

## 11. Numbers and provenance

`data-sources.md` follows the skeleton in `.claude/rules/deck-data.md`: one section per slide, one row per figure with the command or file that produces it, a "Numbers refresh (2026-11-13)" section, and a "Banned on-slide content (checked)" section. Every `data/*.ts` module opens with a provenance header naming its source repo, file, line range, the commit it was read at, and the date.

Derive each number fresh with the recorded command even though this file states it. Commits the research read: stacks `a952e96`, openchart `26bd0ba6`, statglass `5db8622a`. Record the commit for the others when you read them.

Code excerpts live in `data/code/<slide>-<name>.ts` as the exact text plus `{ repo, path, lines, commit }`. Add a test that reads each source file, when the sibling repo is present at `~/Projects/<repo>`, and fails if the excerpt's untrimmed lines no longer match. Skip it cleanly when the repo is absent so CI on another machine still passes.

Known conflicts and stale facts. Each needs a decision recorded in `data-sources.md`:

| Fact | What the research found |
| --- | --- |
| StatGlass version | The repo is at 0.12.0 (2026-11-10). `steamfield/src/data/projects.ts` says 0.3.2. Use the repo. Tell Riley the site is stale; do not fix the site from this task. |
| rr version | Latest tag v0.29.4 (2026-11-03). The site says 0.29.3. |
| rr's parsed frameworks | The code parses pytest, Go test, Jest and Vitest's default reporter. The README omits Vitest. Bun's test runner and Playwright are not parsed. |
| rr speedup | Not measured. See section 4. |
| OpenChart mark count | 19 in the type. Two comments in the repo say 16. |
| OpenData catalog size | 1,046 datasets and 214 providers in the 2026-11-02 snapshot; 1,036 and 213 in the blog post; "800+" in one stale docs page. |
| OpenData test count | "About 14,000" is published. A static count is about 19,600 definitions. Get a collected count (`pytest --collect-only -q` in `opendata/` and `backend/`, `vitest list` in the TypeScript packages, or the totals from one `rr test` run) and use it on slide 3. |
| StatGlass CPU figure | 0.672 percent is one run, before remote monitoring existed. Keep "one run" next to it. |
| StatGlass origin | Author-reported. No repo records it. |
| Agents at once | 2 to 4, author-reported. |
| foreman contract | Free-form markdown. Only the `- May change:` line is parsed. Do not call it a schema. |
| Stacks runtime | The published CLI runs on Node and refuses Bun. Bun builds and bundles it. Do not call it a Bun CLI. |
| A subagent report called rr a Rust tool | It is Go (`go.mod`, Go 1.26). |

Banned on slides: any rr speedup multiple; "load-balanced" for rr; "pushes" or "notifies" for foreman; "government" as a blanket description of OpenData's sources; any size for the StatGlass CLI binary; "all open source".

## 12. Speaker guide and release valves

`SPEAKER-GUIDE.md` follows `examples/texas-2026/SPEAKER-GUIDE.md`. It holds: a timing table with a running clock per slide for the 30-minute cut and for the 38-minute cut; the order in which to restore extension slides; which beats can be dropped on the fly if the talk runs long (slide 5 beat 3, slide 8 beat 3, slide 12 beat 4, slide 18 beat 2); a pre-talk checklist; and the release valves.

Each valve is optional, has a time box, and ends by pressing the arrow key to the next slide. Each lists exact commands, what the audience should see, and what to say if it fails ("the slide showed you the recording; moving on").

| Valve | After slide | Time | What |
| --- | --- | --- | --- |
| A | 4 | 2 min | Stacks in a scratch directory: search, show, `new --sandbox --no-launch`, `verify --json`, the exit code |
| B | 7 | 3 min | foreman: two contracts, two delegates, one question, answered live |
| C | 10 | 2 min | rr: two worktrees running `rr test` at once, `rr monitor` alongside |
| D | 13 | 1 min | StatGlass: the real menu bar app, then Timeline and Hosts in the dashboard |

Take at most one valve in the 30-minute cut. Pre-talk checklist items the research turned up: run any `stacks` command once beforehand or set `DO_NOT_TRACK=1` so the first-run telemetry notice does not appear on stage; warm each rr worktree's remote `node_modules` with one run; have `foreman doctor` green and the Codex hooks trusted; have StatGlass running long enough to have history, or run `bun run seed` in a dev build.

## 13. Build plan

Work in a git worktree under `.claude/worktrees/`. If the build is delegated through foreman or `codex-delegate`, use the wave plan and contract templates in `.claude/skills/building-a-deck/contracts/README.md`; two writers never touch the same files.

Wave 0, design (one agent, then Riley's approval). Scaffold the deck. Write `theme.json`, `styles/tokens.css`, `components/design.ts`, `DESIGN.md`. Build `NightDriveField`, `ThreadRail`, `NamePlate`, `LangChip`, `EvidenceTag`, `CrtFrame`. Build slide 1 and slide 4 completely. Screenshot both at every beat and stop for approval.

Wave 1, shared parts and data (parallel, disjoint files). `RepoTree`; `CodePane` with `scripts/tokenize.mjs` and the excerpt drift test; `TermPane`; `AgentPane`; `PacketPath`. Port the simulations in section 7 into `data/` with provenance headers and a unit test per port that pins a few scene times against the source's own values. Write `data/products.ts` and the first pass of `data-sources.md`.

Wave 2, stages (parallel, one agent per product, each owning its stages, pages and data modules): Stacks (4, 5, 6, E1, E6); foreman (7, 8, 9, E2); rr and the StatGlass origin (10, 11, E3); StatGlass (12, 13, 14); OpenData and OpenChart (15, 16, E4, E5); frame and close (2, 3, 17, 18, 19). Each hand-off includes screenshots of every beat from `bun run shot`, the prose audit table, and any beat-count difference from this file.

Wave 3, assembly (the orchestrator). `slides.md` manifest with `clicks:`, titles and `hide: true` on the extensions. Presenter notes for every page. `SPEAKER-GUIDE.md`. The view-transition names in `styles/index.css`. A full walk with `bun run snap`.

Wave 4, review. A fresh agent runs the prose review. The `fact-checking-a-deck` skill runs over `bun run fact-extract agents`. A design pass checks every slide at 1920x1080 and at a 4:3 projector size for clipping, and checks legibility of the smallest code and pixel type. Riley walks the deck in `/presenter` with a timer.

## 14. Definition of done

- `bun run check`, `bun run typecheck`, `bun run test`, `bun run lint` and `bun run build agents` pass, and the story guards report scanning this deck.
- `bun run shot agents <n>` shows no console errors and no wrapped one-line headline on any slide.
- `bun run export agents` produces a PDF in which every slide is readable as a still, including the simulation slides and slide 13's poster.
- Every figure in `bun run fact-extract agents` traces to a row in `data-sources.md`, and each row's command was rerun in the week of the talk.
- Every code excerpt passes the drift test against its source repo.
- Every recording carries a `Recorded` tag with a date, every diagram a `Schematic` tag, and every made-up value an `Illustrative` tag.
- The prose review by an agent that did not write the deck has no open findings.
- Stepping backward through every slide replays each beat in reverse with nothing left behind.
- A timed read-through of the notes lands between 27 and 29 minutes for the 30-minute cut.
- The cover and slide 4 were approved by Riley before the rest was styled.

## 15. Open items for Riley

- Confirm the origin sentence on slide 11 reads the way you would say it.
- Slide 7 needs one batch of foreman runs. If you would rather show a newer session than the 2026-11-06 recordings, record it with `claude-codex/site/scripts/capture-runs.mjs` and point the data module at it.
- Slide 13 embeds the StatGlass demo build. Say whether checking the built demo into this repo is acceptable or the slide should load the hosted copy.
- `steamfield/src/data/projects.ts` has stale versions for StatGlass and rr. That is a separate change to the site.
