import type {
  RemoteClientMessage,
  RemoteDeck,
  RemoteIntent,
  RemotePosition,
  RemoteServerMessage,
} from "@react-decks/core";
import { act } from "@testing-library/react";
import { onTestFinished } from "vitest";
import { install } from "../deck.test-support";
import { mountRemote, type RemoteLink } from "../index";

export function recordingLink() {
  const reports: RemotePosition[] = [];
  const listeners = new Set<(intent: RemoteIntent) => void>();
  const link: RemoteLink = {
    report: (position) => reports.push(position),
    onIntent(apply) {
      listeners.add(apply);
      return () => listeners.delete(apply);
    },
  };
  return {
    link,
    reports,
    emit(intent: RemoteIntent) {
      act(() => {
        for (const apply of listeners) apply(intent);
      });
    },
  };
}

export const deck: RemoteDeck = {
  title: "Field notes",
  slides: [
    {
      id: "arrival",
      title: "Arrival",
      clicks: 3,
      notes: [
        { click: 0, html: "<p>Introduce the site.</p>" },
        { click: 1, html: "<strong>Describe the river.</strong>" },
        { click: 3, html: "<p>Show the map.</p>" },
      ],
    },
    { id: "departure", title: "Departure", clicks: 0, notes: [{ click: 0, html: " " }] },
  ],
};

export function remotePage() {
  const sockets: TestSocket[] = [];
  const sent: RemoteClientMessage[] = [];
  class TestSocket extends EventTarget {
    static OPEN = 1;
    readyState = 0;
    readonly at = Date.now();
    constructor(readonly url: string | URL) {
      super();
      sockets.push(this);
    }
    open() {
      this.readyState = 1;
      this.dispatchEvent(new Event("open"));
    }
    send(frame: string) {
      if (this.readyState !== 1) throw new Error("Socket is closed");
      sent.push(JSON.parse(frame));
    }
    close() {
      this.readyState = 3;
      this.dispatchEvent(new Event("close"));
    }
    frame(data: string) {
      this.dispatchEvent(new MessageEvent("message", { data }));
    }
    deliver(message: RemoteServerMessage) {
      this.frame(JSON.stringify(message));
    }
  }
  install(globalThis, "WebSocket", TestSocket);
  const url = "/?token=t%2B1&theme=dark";
  history.replaceState(null, "", url);
  const root = document.createElement("div");
  root.id = "deck-root";
  document.body.append(root);
  let unmount: (() => void) | undefined;
  function dispose() {
    act(() => unmount?.());
    unmount = undefined;
  }
  onTestFinished(() => {
    dispose();
    root.remove();
    history.replaceState(null, "", "/");
  });
  act(() => {
    unmount = mountRemote();
  });
  act(() => sockets[0]?.open());
  const deliver = (message: RemoteServerMessage) => act(() => sockets.at(-1)?.deliver(message));
  function position(slide = 1, click = 0, elapsed: number | null = null) {
    deliver({ type: "position", slide, click, elapsed });
  }
  return {
    url,
    dispose,
    sent,
    sockets,
    deliver,
    position,
    present() {
      deliver({ type: "deck", deck });
      position();
    },
  };
}
