# RFC 0009: a remote presenter on a second device

Status: Done. Shipped on `feat/remote-and-motion` (2026-11-18): the relay is `packages/node/src/remote/`, the window link and page are `packages/runtime/src/remote/`, and the user guide is `docs/guide/presenting.md`.

## Problem

A developer talk leaves the deck to show VS Code, a terminal and a demo app in a browser. To
do that on a projector the speaker mirrors the laptop's screen, and a mirrored screen has no
private display for the presenter window. The speaker loses the notes, the next-slide hint
and the timer for the whole talk, not only during the demos.

Mirroring also breaks control. A key or clicker press goes to the app with focus, so while
VS Code is in front, next types into the editor instead of advancing the deck. The speaker
has to click back into the browser before every slide change.

The guide says so today (`docs/guide/presenting.md`, "Two-window sync"): sync runs over
`BroadcastChannel`, so every window must be in the same browser on the same machine, and
"there is no remote control from another device". Slidev has one (`slidev --remote`), which
serves the whole dev server on the network with an optional password.

## Evidence

Riley's talk on 2026-11-17 needed VS Code, a terminal and a demo app in a browser. The
screen was mirrored, presenter mode was unusable, and the talk ran without notes. Riley has
an iPad and a second laptop available as a notes device.

## Design

`decks dev --remote` starts a second, small server next to the dev server. It listens on
the network on its own port and serves one page: a remote that shows notes and sends
navigation requests. The dev server itself stays on loopback.

```
laptop                                               iPad or second laptop
┌───────────────────────────────────────────┐        ┌──────────────────────┐
│ Vite dev server (loopback, as today)      │        │ remote page          │
│   play window ──┬─ BroadcastChannel        │        │  position, titles,   │
│   presenter  ───┘  (sync, unchanged)       │        │  notes, timer,       │
│   play window ── HMR socket: position out, │        │  prev / next / go-to │
│                  intents in ──┐            │        │                      │
│ remote server (LAN, token)    │            │  WS    │                      │
│   relay ◄─────────────────────┘ ◄──────────┼────────┤ intents out,         │
│   page, deck payload                       │ ──────►│ position + notes in  │
└───────────────────────────────────────────┘        └──────────────────────┘
```

### Why a second server instead of Slidev's approach

Putting the Vite server on the network would expose the dev server (source files, `/@fs`,
the HMR socket) to the room. It would also switch off the live terminal, whose loopback
check is non-configurable (RFC 0008, question 5); the terminal shares the HMR socket, so
keeping it would mean adding a per-connection check and weakening a rule decided on
purpose. A separate server that speaks a few message types has a much smaller surface. It
never serves slide code and never carries a terminal event.

The cost is that the remote shows no slide images in v1. It shows text: the title of the
current and next slide, the position, the click, and the notes. With the projector showing
VS Code half the time, the notes are what the speaker is missing.

### The remote sends intents and is not a sync participant

The remote does not run `createSyncSession`. It sends intents (`next`, `prev`,
`go { slide }`), and a laptop window applies each one through its own store, which then
publishes over `BroadcastChannel` as any local navigation does. The remote only renders the
position the relay pushes.

Making the remote a second sync participant was the first draft and was rejected: the sync
tie-break uses each session's `startedAt`, a wall-clock time, so clock skew between the iPad
and the laptop would decide every same-frame conflict; the remote would need the manifest's
click counts current to compute `navigate` without clamping wrongly after an edit; and the
relay would have to answer `hello`s, which drags a fresh window opened at `#/3` to whatever
position the relay last saw. With intents, navigation logic stays in one place and the
existing sync contract (architecture section on Sync, Final) is unchanged.

One window receives each intent, or two windows would each advance and the talk would skip
a click. The target is the most recently focused play window connected over HMR, falling back
to the most recently connected presenter window. A window reports its view and focus to the
relay when they change. With no window connected the relay drops the intent and the remote
shows "Waiting for the deck".

### The remote server

- Created in `dev/server.ts`, above the Vite plugins, and passed into them. A config change
  restarts the Vite server (`plugins.ts:224`), not the remote server, so its token, port and
  connected remotes survive. It closes when the dev server process ends.
- Listens on all interfaces on its own port (`--remote-port`, default the first free port
  above the dev port). The dev server's bind address does not change.
- Generates a 128-bit token at start and prints the remote URL with each LAN IPv4 address
  (first) and the mDNS name (`<host>.local`), plus a QR code, in the terminal only. The token
  is never sent to a deck window, so it can never appear on the projector.
- Every request needs the token: the page load as a query parameter, which stays in the
  page's URL so a reload stays authenticated (the device is not projected), and the WebSocket
  upgrade, which also checks that `Origin` is the remote server's own origin. After a failed
  handshake the page requests its own URL again: only a 403 means the link has expired. A wrong token gets a 403 and a logged line
  naming the client address.
- The deck payload is built in `plugins.ts` from the same `scanDeck()` result that feeds
  `buildManifest` and `renderNotes`: per slide, its title, click count and rendered note
  segments. It is plain JSON, pushed to remotes on the same invalidations that reload the
  manifest and notes modules.
- The relay accepts three intent shapes from a remote, validated with zod as
  `term/plugin.ts` does; anything else closes the socket. Windows send position updates
  (`{ slide, click }` with the window's view and focus) over HMR custom events.
- Timer: the relay records when it first sees the position change, and pushes the elapsed
  talk time with every position, so the page never compares clocks with the laptop. The remote's timer survives its own reload or the iPad sleeping.
  "Reset timer" on the remote resets the relay's start. The presenter window keeps its own
  timer, as today.

### Laptop windows

In dev with `--remote`, the dev entry passes `mountDeck` a hook that sends the window's
position, view and focus over `import.meta.hot` and applies intents arriving there through
the store's `dispatch`. The same gate as sync applies (`mount.tsx:17-20`): an embedded,
bridged or print window neither reports nor receives intents. `runtime` already uses
`import.meta.hot` (`slide-host.tsx:126`), so no node import is needed.

A remote intent applied by the play window is a local navigation, so a live terminal pane on
the slide runs its next command as it would for an arrow key (`use-live-term.ts:42-44`
reports on every position change, and the term server's `ran` guard keeps a command to one
run).

### The remote page

It shows:

- position ("5 / 12") and click ("click 2 of 3"), the current and next slide titles;
- the notes for the current slide, with the current click's segment marked and scrolled
  into view, the presenter window's rule;
- the elapsed time from the relay and the local time;
- large previous and next buttons, and a go-to list of slide titles.

It takes arrow keys, Page Up/Down and Space, so a clicker paired with a second laptop drives
the deck from there. A dead socket is detected by a heartbeat (an iPad waking from sleep gets
no close event), shows "Disconnected" with the time, and reconnects with backoff; on
reconnect the relay sends the current position, payload and timer start. The laptop's
windows work the same with or without a remote.

## Plan

1. `--remote` and `--remote-port` on `decks dev`; the remote server created in
   `dev/server.ts` with token, origin check, intent validation, target window choice, timer
   start and the deck payload from `plugins.ts`. Done when: node tests start a real dev
   server with `--remote`, connect a WebSocket with and without the token, see a bad token
   and a malformed intent refused, see an intent reach exactly one of two connected windows,
   and see a config edit restart Vite while the remote's socket stays open.
2. The window side: an optional hook in `mountDeck`'s options (the exact `index.ts` line goes
   in the contract), wired in `dev/entry.ts` only with `--remote`. Done when: dom tests show
   a position change reported, an intent applied as a `dispatch`, and an embedded or print
   window reporting nothing.
3. The remote page: a runtime view, `mountRemote`, built when `decks dev --remote` starts
   with Vite's `build()` and the dev server's own `config()` (so source and published
   resolution are the existing ones, and the page always matches the installed runtime). Done
   when: dom tests cover each item the page shows and its keys; the tarball test starts
   `decks dev --remote` from the packed package and loads the page.
4. The QR code in the terminal. `uqr` (0.1.3) is already a kit dependency; node needs it
   added at the same version.
5. E2E: a play window and a remote page in two Playwright contexts (two profiles, so
   `BroadcastChannel` cannot connect them). Next on the remote moves the play window and
   the presenter window; next in the play window updates the remote's notes; two play
   windows open and a remote next advances one click, not two; the remote reloads mid-talk
   and its timer keeps counting; a remote next on the live terminal fixture's slide runs the
   command once.
6. Guide: a "Remote presenter" section in `presenting.md` and the flags in `cli.md`, with
   network setup for venue wifi and the security note below.

## Interleavings to step through before the contract

- The remote presses next twice before the first position update arrives: two intents, two
  clicks forward. That is what the speaker pressed.
- Remote and laptop press next in the same frame: both are local navigations in windows of
  one browser, so the existing two-window rule applies and one press can be lost.
- The target window closes with an intent in flight: the relay retargets on the socket's
  close; an intent sent to a dead socket is lost and the speaker presses again.
- A slide is added mid-talk: the window applies the intent against its own fresh manifest;
  the remote's titles refresh on the payload push.
- The remote connects before any window: "Waiting for the deck" until a window reports.

## Scope

Out of scope for v1: slide images on the remote, a remote for a built or exported deck, HTTPS,
a view-only role, and more than one deck per remote server.

## Verification

A real talk setup: the laptop mirrored to an external display, an iPad on the same network,
VS Code in front on the laptop. Every next on the iPad moves the deck behind VS Code and
updates the notes; switch to the browser and the slide is where the iPad says. Repeat with a
second laptop and a clicker paired to it, then on a phone hotspot, and with the iPad's Wi-Fi
toggled off and on mid-talk.

## Decisions

Settled with Riley on 2026-11-17.

1. Plain HTTP on the LAN for v1. The token travels in the clear, so someone on the same open
   wifi could read the notes and step the deck. Stepping the deck runs a live terminal
   slide's prepared commands in a real shell on the laptop, though never arbitrary input.
   Over HTTP the page is not a secure context, so the iPad gets no wake lock and needs
   Auto-Lock set to Never. The guide says plainly that the safe setup is a phone hotspot both
   devices join. Self-signed HTTPS was rejected for v1: it needs a certificate trusted on the
   iPad, which is a worse first experience.
2. `--remote` and `--live-term` may run together. The commands are the deck author's and the
   token is required; the guide's security note names the risk in decision 1.
3. No slide images in v1. A later version could push captures of the current and next slide
   from the dev server (the `decks shot` path); revisit after one real talk shows whether
   titles are enough.
4. Venue networks often isolate clients from each other, so the iPad may not reach the
   laptop. The guide names the fallbacks (a phone hotspot both devices join, or a Thunderbolt
   Bridge cable for a second Mac) and tells the speaker to open the URL from the iPad before
   going on stage.
