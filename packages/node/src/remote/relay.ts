import { isDeepStrictEqual } from "node:util";
import type {
  RemoteClientMessage,
  RemoteDeck,
  RemoteIntent,
  RemotePosition,
  RemoteServerMessage,
} from "@react-decks/core";

type Window = (intent: RemoteIntent) => void;
type Remote = (message: RemoteServerMessage) => void;

export function createRelay(deck: RemoteDeck) {
  const windows = new Map<
    Window,
    { view: RemotePosition["view"]; focusedPlay: boolean; focused: boolean }
  >();
  // A remote that received waiting needs a position even if the next report repeats it.
  const remotes = new Map<Remote, boolean>();
  let position: Pick<RemotePosition, "slide" | "click"> | undefined;
  let started: number | undefined;
  function current(now = performance.now()): RemoteServerMessage {
    return position && windows.size
      ? {
          type: "position",
          ...position,
          elapsed: started === undefined ? null : Math.floor(now - started),
        }
      : { type: "waiting" };
  }
  function send(remote: Remote, message: RemoteServerMessage) {
    if (message.type === "waiting" || message.type === "position")
      remotes.set(remote, message.type === "waiting");
    remote(message);
  }
  function broadcast(message: RemoteServerMessage) {
    for (const remote of remotes.keys()) send(remote, message);
  }
  function target() {
    let play: Window | undefined;
    let presenter: Window | undefined;
    let background: Window | undefined;
    for (const [window, report] of windows) {
      if (report.focusedPlay) play = window;
      if (report.view === "presenter") presenter = window;
      if (report.view === "play") background = window;
    }
    return play ?? presenter ?? background;
  }
  return {
    connect(remote: Remote) {
      remote({ type: "deck", deck });
      send(remote, current());
      return () => remotes.delete(remote);
    },
    updateDeck(updated: RemoteDeck) {
      // Every slide save rebuilds the payload; one that only changed slide body text is equal.
      if (isDeepStrictEqual(updated, deck)) return;
      deck = updated;
      broadcast({ type: "deck", deck });
    },
    report(window: Window, { slide, click, view, focused }: RemotePosition) {
      const first = windows.size === 0;
      const previous = windows.get(window);
      const focusedPlay = view === "play" && (focused || previous?.focusedPlay === true);
      const gainedFocus = focused && (previous?.view !== "play" || !previous.focused);
      // Insertion order breaks ties even if two focus reports arrive in the same millisecond.
      if (!focusedPlay || gainedFocus) windows.delete(window);
      windows.set(window, { view, focusedPlay, focused });
      const changed =
        position !== undefined && (slide !== position.slide || click !== position.click);
      const now = performance.now();
      if (changed) started ??= now;
      if (!first && !changed) {
        if (target()) {
          for (const [remote, waiting] of remotes) if (waiting) send(remote, current());
        }
        return;
      }
      position = { slide, click };
      broadcast(current(now));
    },
    disconnect(window: Window) {
      if (windows.delete(window) && !windows.size) broadcast({ type: "waiting" });
    },
    receive(remote: Remote, message: RemoteClientMessage) {
      switch (message.type) {
        case "ping":
          remote({ type: "pong" });
          return;
        case "reset-timer":
          started = undefined;
          broadcast(current());
          return;
        default: {
          const window = target();
          if (window) window(message);
          else send(remote, { type: "waiting" });
        }
      }
    },
  };
}
