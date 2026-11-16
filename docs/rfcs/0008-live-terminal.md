# RFC 0008: a live terminal on a slide

Status: Draft. A deck-local version runs in `examples/building-for-agents/term/` and was
built for one talk. This RFC records what it proved and what moving it into the framework
takes. Nothing in `packages/` has changed.

## Problem

A talk about command-line tools has to leave the deck to run one. The speaker switches to a
terminal window, the audience loses the slide, the presenter view loses its notes and timer,
and the font size is whatever the terminal had. Slidev has no answer either: its checkout has
no pty or xterm code, and the third-party `slidev-addon-liveshell` wraps ttyd and stops
working in a build or an export.

## Evidence: the deck-local version

A slide shows a terminal pane and one card per prepared command. Pressing next (the arrow key,
the presenter window, or the card's play button, which all go through deck navigation) types
the next command into a real shell and runs it. Clicking into the pane lets the speaker type;
Esc gives the keys back to the deck.

The pane always has a recording, and the recording is the default render. A real shell
replaces it only when all of these hold: the dev server was started with `DECKS_LIVE_TERM=1`,
the server is bound to loopback, the slide is the active one in the play view (not presenter,
overview, print or an embed), and motion is live. Build, export, `decks shot` and the site
embed always show the recording, so a deck with a live pane still builds and exports with no
shell anywhere. A shell that fails to start, exits, or loses its socket returns the pane to the
recording and says so on the pane's tag; nothing throws into the slide.

```
term/protocol.ts            event names and message shapes; no logic, no imports
term/server/sessions.ts     session rules: one shell per pane id, steps, queue, reset, replay
term/server/shell.ts        spawns the pty helper
term/server/shell_pty.py    a pty in Python's standard library; no native module
term/server/plugin.ts       Vite plugin: wires sessions to custom events on the HMR socket
term/client/connection.ts   one pane's connection: attach, navigate, output, state
term/client/use-live-term.ts  the React hook over a connection
term/client/xterm-host.tsx  xterm in a counter-scaled host
components/LiveTerm.tsx     the pane: recording, or the host when live (deck-specific skin)
components/LiveDemoStage.tsx  the demo slide: panes, command cards (deck-specific)
```

`term/boundaries.test.ts` enforces that `term/server` imports no browser or React code,
`term/client` imports no `node:*` module, and nothing under `term/` imports from the deck.

## Rules the session layer settled

These came out of stepping through the interleavings and out of live rehearsal. A framework
version keeps them.

- One shell per pane id, owned by the server. Every window attaches to the same shell, and an
  attach replays a bounded tail of its output (200 KB), so a reload shows the session as it
  stands.
- A command is sent only for a forward step of exactly one click. Stepping back, jumping from
  the overview and arriving from the next slide send nothing.
- A step that arrives before the shell is ready, or while a command is running, waits in an
  ordered queue and runs at the next prompt. Dropping it instead left the command cards
  showing a command as run that never ran.
- The prompt is detected by an OSC 133 marker the shell prints. The command is typed, then
  the carriage return follows 600 ms later, so the audience reads the command before its
  output.
- The session resets only when the slide becomes active at click 0 or navigation returns to
  click 0, and only if something ran or was typed. A mount or a reload only attaches.
- The shell is `zsh -f` in a fresh temporary directory outside the repo, or a directory the
  deck's config names. The browser never sends a path.

## Plan

| Deck-local | Framework home | Work |
| --- | --- | --- |
| `term/protocol.ts` | `packages/core` | none; it has no imports |
| `term/server/*` | `packages/node` | register the plugin from the dev server behind a `deck.config.ts` field instead of `vite.plugins` |
| `term/client/*` | `packages/kit` | export `LiveTerm`'s live half as a kit component; `@xterm/xterm` becomes a kit dependency |
| `components/LiveTerm.tsx` | `packages/kit/src/ink/` | split the deck's CRT skin from the generic pane |
| `components/LiveDemoStage.tsx` | stays in the deck | it is this deck's layout |

Open questions for the framework version:

1. The pty helper is Python, which macOS and most Linux hosts ship. Windows has none. Either
   `node-pty` becomes an optional dependency or the feature is documented as macOS and Linux.
2. xterm draws on a grid of whole device pixels. The host snaps the font size so the glyph
   advance is whole and turns ligatures off (a font with an `ff` ligature made xterm pad every
   `f`). A kit version needs a browser test at two device pixel ratios.
3. A full-screen program that redraws (a TUI) replays badly from a bounded tail. The deck
   avoids them: `rr monitor --once` instead of `rr monitor`. A kit version either documents
   the limit or keeps a server-side screen model.
4. Two audience windows share one shell, and each sends its own steps. The deck accepts one
   audience window as a limit. A kit version should send steps from one window only.
5. A shell on a socket is remote code execution for whoever can reach the dev server. The
   loopback check and the opt-in variable are the whole defence, and they should stay
   non-configurable.

## Scope

Out of scope: running a shell in a built or exported deck, recording a session from inside the deck, and
any hosted or shared mode.
