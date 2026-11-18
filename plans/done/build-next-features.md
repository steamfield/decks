# Build: next-features

## Context

`@steamfield/decks` is at 1.0.0-rc.1. With MDX plugins, code blocks, layers, layouts and the OG
image shipped, the remaining gaps users notice coming from Slidev are a control tray, the go-to
dialog, code morphing and hand-drawn marks. The live terminal from the agents talk has proved
itself in rehearsal and is ready to move into the framework (RFC 0008). This build lands all
five, each with its user guide page and plugin skill updated, so an agent writing a deck finds
them.

Decided with Riley on 2026-11-16:

- Five features: live terminal, control tray, code morphing (#4), hand-drawn marks (#5), go-to
  dialog with `Toc` and `Link` (#9).
- Terminal: goes into the decks packages per RFC 0008. macOS and Linux only; on Windows panes
  show their recording and dev logs one line. Opt-in is `decks dev --live-term` (replaces
  `DECKS_LIVE_TERM`); the loopback check stays and is not configurable.
- Tray: play view only. Hidden until the pointer is over the bottom-left corner or a tray
  button has focus, as in Slidev. Controls: prev, next, counter (opens go-to), overview,
  presenter, fullscreen, text size. The rest of Slidev's tray (dark mode, drawing, recording,
  editor, exporter, info, settings) maps to features Decks does not have.
- Magic move: Slidev's ````` ````md magic-move ````` fence syntax.
- Marks: the `roughjs` generator (DOM-free, seeded) makes the paths; Decks renders and animates
  them.
- Guide pages (`docs/guide/`): I write them in phase 3 from the landed behaviour. Skills under
  `plugins/decks/skills/` are updated by each feature's Codex run.
- Landing branch `build/next-features`; merge to main only when Riley asks.

## Execution

I orchestrate; Codex does the implementation through foreman (`execute:codex`: newest sol
model, high effort, fast mode). The contracts come from `.claude/delegate/contract.md`, with
procedure from `.claude/delegate.md`. Each run starts with
`foreman start <run> --new-worktree --from build/next-features --setup "bun install"`,
writes its tests first from the contract's test list, runs its scoped checks and gets one
fresh-Codex review. Then I read the diff, check it against the contract, merge `--no-ff`, run
`rr run --local "bun run check"` on the branch and tag the phase. With three runs in parallel,
contracts carry scoped checks only, and I run the full gate.

I do the work that is mine under AGENTS.md: `docs/` (contract sections, guide), every
`package.json` (through `bun add`/`bun remove`), every `packages/*/src/index.ts`,
`vitest.config.ts`, `decks.json`, the CI workflow and the CHANGELOG. Everything else goes to
Codex.

## Phase 0: scaffold (mine)

1. Cut `build/next-features` from main. The feature-gaps archive edits from earlier go in as
   the first commit; `.vscode/` stays untracked.
2. Dependencies:
   - `bun add @xterm/xterm@6.0.0` in kit and decks.
   - `@shikijs/magic-move@4.6.0` (it tracks our shiki 4.6.0, and `/react` and `/core` are
     public exports) in node, motion and decks.
   - `roughjs@4.6.6` in motion and decks.
3. `docs/architecture.md`: new Final sections, which are the contracts below (tray and go-to in
   §4.5, `Mark` in §5.3, magic move in §6.7, the live terminal in §6.8 for node and §7.2 for
   kit), `g` added to the §4.2 key table, and the stale "print view not built" lines fixed.
4. Exports stubbed in each `src/index.ts`, with a stub throwing `not implemented` at every
   planned module path:
   - runtime: `Toc`, `Link`
   - motion: `Mark`, `MagicMove`
   - kit: `LiveTerm`
   - core: the term protocol types and event names
5. Registration lines lanes would otherwise share:
   - `Mark` in `clicks.ts` `stepNames` and its `until` list
   - `Mark`, `Toc` and `Link` in the default MDX components (`packages/node/src/dev/entry.ts`)
   - a `g` binding in `deck-keys.ts` that calls `goTo.show()`
6. `packages/core/src/term-protocol.ts`, written by me from `term/protocol.ts` with the
   position change below, because both terminal runs build against it.

Then a fast devil's-advocate pass on this plan (sonnet, at most five findings), run alongside
the scaffold.

## Phase 1: navigate and mark (3 Codex runs in parallel)

### 1A Control tray (runtime)

Owns:

- `packages/runtime/src/navigation/deck-actions.ts` (new): `toggleFullscreen()`,
  `toggleOverview(store, home)` and `openPresenter(source, state)`, extracted unchanged from
  `deck-keys.ts:17-61`
- `deck-keys.ts`, which calls those actions; the `g` line stays as the scaffold wrote it
- `views/control-tray.tsx` and `control-tray.css`, with tests
- `views/play-view.tsx`
- `plugins/decks/skills/working-with-decks/references/project.md` (a presenting-controls
  paragraph)

Behaviour:

| Control | Shown when | Action |
| --- | --- | --- |
| Previous, next | always | `useDeck().prev/next`; disabled at the first and last frame |
| Counter "n / total" | always | button, opens the go-to dialog (`goTo.show()`) |
| Overview | always | `toggleOverview` |
| Presenter | not embedded | `openPresenter`, the same rules as `p` (§4.2) |
| Fullscreen | `document.fullscreenEnabled` | `toggleFullscreen`; the label switches between Enter and Exit |
| Text size − / + | always | `stepTextScale(name, ±1)` |

- The whole tray is absent when `embedded` or `bridge` is set, and outside the play view.
- Reveal is CSS only: a bottom-left hit area with `:hover` and `:focus-within` raises opacity
  over `--deck-dur-base`.
- The cursor stays visible over the tray despite `data-deck-idle`.
- On `pointerleave` the tray blurs its focused button, so Space advances the talk again. This
  is Slidev's fix for the Space-on-button rule in §4.2.
- Icons are inline SVG, following `slides/deck-credit.tsx`. Colours are `--rd-ui-*` from
  `currentColor`, classes are `rd-`, and everything is in `@layer react-decks`.

Tests:

- dom: one test per row of the table above, plus embedded/bridge absence and the blur on
  `pointerleave`, using the existing `install()` fakes for fullscreen and `window.open`.
- e2e: in `e2e/tray.spec.ts`, hovering the corner reveals the tray, clicking next advances
  both windows, and the fullscreen button toggles `document.fullscreenElement`.

### 1B Go-to dialog, Toc, Link (runtime)

Owns:

- `navigation/go-to-state.ts`: a per-deck `useGoTo(): { open, show, hide }`, held in the deck
  context and not the store, because it is not position
- `navigation/go-to-dialog.tsx` and `.css`
- `slides/toc.tsx`, `slides/link.tsx`
- tests for all of the above
- `e2e/go-to.spec.ts`
- `plugins/decks/skills/deck-design/references/layout.md` (`Toc`)

Behaviour:

- `g` opens a native `<dialog>` in play and presenter. It does not open when embedded, in
  print or in the overview.
- Typing filters the slides by number or by a case-insensitive title substring. Up and Down
  move the selection, Enter calls `go(slide)`, and Escape or a click outside closes the dialog
  with the position unchanged. Deck keys are ignored while the dialog is open.
- `<Link to={n}>` is an `<a>` whose `href` is the formatted hash; a click calls `go(n)`.
- `<Toc />` lists every slide's title as a `Link` and marks the current slide with
  `aria-current`.
- Outside the `slide` and `presenter` render contexts, both render text with no navigation, so
  an overview thumbnail never navigates.

Tests: a dom test per behaviour above, and e2e for `g`, typing "3", Enter, and the URL.

### 1C Mark (motion)

Owns:

- `packages/motion/src/mark.tsx`, `mark.css` and `mark.test.tsx`
- `e2e/motion-mark.spec.ts`
- `examples/motion/slides/NN-mark.mdx` (next free number)
- the `Mark` section of `plugins/decks/skills/deck-motion/references/motion.md`

API: `<Mark kind="underline|circle|box|strike|cross|bracket" at={n} until={m}? color?>`. The
default colour is `currentColor`, and `color` takes any CSS colour or token `var()`.

- Paths come from `rough.generator()` with a seed fixed per kind. All five contexts therefore
  render identical paths.
- They are drawn in an absolutely positioned SVG over an inline-block wrapper, using a
  normalised `viewBox`, `preserveAspectRatio="none"` and `vector-effect="non-scaling-stroke"`.
  No layout measurement is needed.
- The animation is `pathLength=1` plus the `stroke-dashoffset` transition that `Draw` uses,
  keyed on `data-step-state`. Going back un-draws, and outside the slide context or in
  `instant` mode the mark snaps to its end state.

Tests:

- dom: state per click, `until` hiding the mark, and identical path data in the slide and
  print contexts.
- e2e: draw forward, back and print.

Phase 1 integration (mine, at landing): a test in `e2e/tray.spec.ts` that the tray counter
opens the go-to dialog. Demo: `bun run decks dev motion`, hover the bottom-left, click the
counter, type a slide, and step the `Mark` slide.

## Phase 2: live code (3 Codex runs in parallel)

| Run | Owns | Delivers |
| --- | --- | --- |
| 2A Terminal server | `packages/node/src/term/*` (sessions, shell, environment, plugin and their tests, moved from `examples/building-for-agents/term/server`); `packages/node/term/{shell_pty.py,zsh/.zshrc}`; the `term` field in `dev/config.ts`; `--live-term` in the dev command; the asset copy in `packages/decks/build.mjs` with a source/dist path switch like `prose-patterns.ts:4` | The plugin is registered by the dev server, not `vite.plugins`. `term: { dirs?: Record<string,string> }` names working directories that panes pick by key. The run keeps every RFC 0008 session rule, with one change (below). On win32 it logs one line and stays off. A non-loopback host refuses with a logged reason. |
| 2B Terminal client | `packages/kit/src/term/*` (connection, use-live-term, output-pacer, terminal-face, xterm-host, `live-term.tsx` and css, dom tests); `e2e/live-term.spec.ts`; the fixture deck `examples/terminal/`; the terminal section of `plugins/decks/skills/building-a-deck/references/workflow.md` | `<LiveTerm pane={spec} click={n} fallback={node} />`. It renders `fallback` (the deck's recording) unless the deck is eligible: `--live-term`, play view, active slide, `slide` context, live motion. It then lazy-loads `XtermHost`. Theme and frame come from CSS variables; the CRT skin stays in the agents deck. The e2e covers the fallback; the live-shell e2e needs the server half, so it moves to 3A. |
| 2C Magic move | `packages/node/src/mdx/magic-move.ts`, plus its branches in `clicks.ts` and `code-blocks.ts`; `packages/motion/src/magic-move.tsx` and test; `e2e/code-magic-move.spec.ts`; an `examples/motion` slide; the magic-move section of `deck-motion/references/motion.md` | The 4-backtick fence `md magic-move [title] {at:N, lines:true}` holds inner fences, each with its own `{ranges}`. Tokens are compiled with `@shikijs/magic-move/core` `toKeyedTokens` and rendered with `/react` `ShikiMagicMovePrecompiled`. The static click total is `at + Σ max(1, ranges_i) − 1`. The morph animates only on a forward step in the live slide context, and snaps with duration 0 otherwise. Malformed fences throw a `DeckError` naming the slide and line. |

The one change to the session rules (RFC open question 4): the client reports its position
`{pane, click}` on every navigation instead of sending steps. The server runs command N only
when the pane's server-side position moves from N−1 to N. A second audience window reporting
the same position is a no-op, so two windows never double-type a command.

At the 2B merge (mine): the `decks.json` entry for `examples/terminal`.

CI (mine): `apt-get install -y zsh` in `.github/workflows/check.yml` for the e2e shards, so the
live-shell e2e runs on Linux instead of being skipped.

Demo: `bun run decks dev terminal --live-term`, then press next on the terminal slide. A
plain `bun run decks dev terminal` shows the recording. `bun run decks dev motion` shows the
magic-move slide.

## Phase 3: the agents deck on the framework, docs, release notes

| Who | Work |
| --- | --- |
| Codex 3A | `examples/building-for-agents` uses the kit `LiveTerm` and `term` config. It deletes `term/` and keeps `CrtPanel`, `TermPane` and `LiveDemoStage` as the deck's skin. `SPEAKER-GUIDE.md` and `OUTLINE.md` say `decks dev agents --live-term`. `decks shot` of the three live slides (positions given in the contract) matches the pre-migration captures. Also `e2e/live-term-shell.spec.ts`: the live shell in the terminal fixture at DPR 1 and 2 (RFC open question 2), two audience windows and the presenter running each command once. |
| Me | `bun remove @xterm/xterm` from the deck; drop the `examples/*/term` include in `vitest.config.ts`. |
| Me | Guide pages: `presenting.md` (tray, `g`); `slides.md` (`Toc`, `Link`); `motion.md` (`Mark`); `code-blocks.md` (magic move); a new `terminal.md` with `config.md` and `cli.md` (`--live-term`, macOS and Linux only, the TUI replay limit from RFC open question 3); `migrating-from-slidev.md` rows for `v-mark`, magic move, the tray and `g`. |
| Me | RFC 0008 marked Done with its commit. `feature-gaps.md` rows #4, #5 and #9 and the live terminal move to `archive/feature-gaps-shipped.md`. A CHANGELOG `## Unreleased` section. A reviewer check that the skills Codex edited read correctly together. |

## Final review and gate

- Gates: `rr run --local "bun run check"` on a cold Vite cache, `bun run check:isolated` and
  `bun run test:tarball`. The tarball test proves `shell_pty.py` and `zsh/.zshrc` ship in
  `dist/`.
- An opus `code-reviewer` on scaffold-parent..HEAD; every finding that holds gets fixed.
- After each run: an `AGENTS.md` Proportion/Testing note and a `docs/delegation-log.md` row.
- Report: phases and tags, what was cut, findings fixed or skipped.
- Closing issues #4, #5 and #9 (and the five from the archive) needs `gh issue close`, which
  the classifier blocked earlier, so I'll hand Riley the command.

## Assumptions Riley can override

- The tray has no touch swipe navigation; tapping the corner reveals it.
- `Toc` lists every slide flat, without a `levels` option.
- `Mark` has no `highlight` kind, because `Highlight` exists.
- `LiveTerm`'s recording format stays in the deck (a `fallback` node). The framework does not
  define a recording format or a recorder, per RFC 0008's scope.
- A full-screen TUI in a pane is documented as unsupported; there is no server-side screen
  model.

## Verification

- Each phase: the full gate green on the branch, then the demo above, driven as a user,
  including the impatient paths: a key before ready, three nexts at once, and a reload
  mid-command.
- Terminal: two audience windows plus the presenter run each command once; a slide reset at
  click 0; a dropped socket falls back to the recording with a tag; the built deck and
  `decks export` show only recordings.
- Tray: the Space key after clicking a tray button and moving away advances the talk; the tray
  never appears in `?embedded` or the site's deck player.

## DA findings applied (2026-11-16)

- §6.8: a command runs at most once per session, and windows report position only on a change
  while mounted, so a lagging window or a newly opened one cannot re-run a command or reset a
  live session.
- 1A's counter test checks the button; opening the dialog is the landing test (1B owns the
  dialog). `MagicMove` was already registered in `entry.ts`. `decks.json` for the terminal
  fixture lands with 2B.
