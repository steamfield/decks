# RFC 0007: react-decks, a React slide framework to replace Slidev

Status: In progress on branch `react-decks`. Phases 0 to 2 are done: the fixture deck runs in a browser with keyboard navigation, URL-held position, an adaptive canvas and hot reload, proven by 470 unit and integration tests and 12 Playwright tests. Next is phase 3, the parity spike.

## Problem

The decks use a small part of Slidev and pay for the rest. Every page is HTML plus components
with no markdown constructs; clicks are paced by components through `$clicks`, never by
`v-click`; one layout is used; routing is hash-only. In exchange the repo carries Vue, a
restart after every new component file, a `src:` manifest that drifts from `pages/` (the
reason `bun run check` exists), a presenter view tied to one window, and no shared motion
vocabulary: each stage hand-rolls its gsap.

## Evidence

- 0 of 63 page files and 0 of the 6 inline `od-templates` slides contain a markdown construct.
- No `v-click`, `v-after`, `<Transform>`, `<Toc>`, custom layout or `onSlideEnter` anywhere.
- The Slidev runtime surface in use is `useNav` (11 properties), `useSlideContext`
  (`$clicks`, `$renderContext`), `useIsSlideActive`, and `$slidev.configs.decksCredit`.
- `AGENTS.md` documents the restart-after-adding-a-component trap at length.
- `packages/decks/styles/base.css` overrides Slidev's canvas to an untransformed 100vw x
  100vh slide, which is why slides cannot render correctly in a preview-sized box.

## Plan

Build the framework in `react-decks/` as its own bun workspace, port the addon and the ten
example decks onto it, and swap the repo over once it is proven. Design:
`react-decks/docs/architecture.md`. Behaviour parity: `react-decks/docs/parity.md`. Code is
written by Codex runs from contracts (`.claude/delegate/react-decks-contract.md`); the
orchestrator owns the design, the public export lists and the harness.

0. Foundations: workspace with a passing gate and enforced package boundaries, the
   architecture document, agent rules. Done when: `bun run --cwd react-decks check` and
   `check:isolated` pass and a contract has round-tripped through foreman.
1. Core: navigation, clicks, URL codec, notes, sync protocol, canvas fit, as pure TypeScript.
   Done when: every behaviour table in architecture section 2 has a passing test per row.
2. Walking skeleton: Vite plugins, MDX slides, the store, hooks, the canvas, the play view,
   `decks dev|build`. Done when: a fixture deck walks slides and clicks in a browser, a reload
   keeps `#/n?clicks=c`, a new component file renders without restart, and 4:3 and 21:9
   windows fill with no letterbox.
3. Parity spike and checkpoint 1: one story slide and one conventional slide hand-ported; the
   gsap-to-React tween bridge measured on the heaviest stage; OpenChart checked under a
   scaled canvas. Done when: the tween bridge, canvas and compat-CSS decisions are confirmed
   or revised in the architecture document and reviewed.
4. Presenter and motion: a presenter window synced over BroadcastChannel; motion tokens, step
   primitives, shared-element morphs, scripted timelines, the settled signal. Done when: two
   windows drive each other, and each slide of the motion gallery deck reverses to identical
   pixels and matches its instant-mode end state.
5. Theme and styling: `defineTheme`, deck `theme.json` overrides with live reload, a deck that
   installs its own Tailwind, `decks new`. Done when: a token edit shows without restart and
   the Tailwind fixture builds.
6. Export and tooling: print view, PDF export, `shot`, `snap`, `check`, the embed protocol,
   the viewer, `film` and `motion-check`. Done when: export yields one page per frame, the
   embed check passes on a built fixture, and `film` writes a contact sheet.
7. Kit: theme tokens, styles, compat CSS, the story engine and all components in React. Done
   when: the kit's tests pass and each component renders in play, presenter and print.
8. Proof decks and checkpoint 2: `tides` and `agent-experience` ported; lint and hooks
   extended to `.mdx` and `.tsx`. Done when: each frame is within the snap threshold of its
   Slidev baseline or the difference is explained, and both decks present on two screens.
9. Remaining decks. Done when: all ten pass `check`, `lint`, `build`, `export`,
   `motion-check` and their snap diffs.
10. Agent docs and packaging: rules, skills, templates and `decks init` rewritten for MDX and
    React, plus a `deck-motion` skill. Done when: `test:tarball` passes in a scratch project.

Not doing: drawings, Monaco, Shiki magic-move, recording, history and memory router modes,
remote and tunnel, pptx export, relative click numbering, click-on-slide-halves navigation, a
dark toggle, a notes editor, layouts, a letterboxing canvas mode.

## Scope

New: `react-decks/`, `.claude/delegate/`, the react-decks
sections of `AGENTS.md` and `.claude/delegate.md`, The
Slidev path under `packages/decks/` and `examples/` keeps working until the swap; phases 8
to 10 extend `packages/decks/lint/` and `packages/decks/scripts/` without removing Slidev
support.

## Verification

Per run: the contract's scoped tests, three times alone, then the package suite. Per phase:
`bun run --cwd react-decks check` and `check:isolated`, then the fixture decks driven in a
browser. At checkpoint 2: `build`, `export`, `snap` and `snap:diff` against Slidev baselines,
`motion-check`, the embed check on built output, and the outer repo's `check`, `test`,
`typecheck` and `lint` still passing.

## Open questions

- Whether a per-frame React re-render (`useTween`) holds frame rate on stages with hundreds
  of marks, or the hot primitives need gsap writing SVG attributes through refs. Phase 3
  measures it.
- Whether `@opendata-ai/openchart-react` maps pointer coordinates correctly inside a
  transform-scaled ancestor and accepts a pixel ratio.
- Whether time can be seeked across gsap, CSS and view-transition animations at once for
  `decks film`, or it falls back to slowed real-time capture.
