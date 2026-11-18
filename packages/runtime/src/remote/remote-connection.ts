import type { RemoteClientMessage, RemoteDeck, RemoteServerMessage } from "@react-decks/core";

type Position = Extract<RemoteServerMessage, { type: "position" }>;
export interface RemoteState {
  deck?: RemoteDeck;
  position?: Position & { received: number };
  disconnectedSince?: Date;
  expired?: boolean;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isServerMessage(value: unknown): value is RemoteServerMessage {
  if (!record(value)) return false;
  switch (value.type) {
    case "pong":
    case "waiting":
      return true;
    case "position":
      return (
        Number.isFinite(value.slide) &&
        Number.isFinite(value.click) &&
        (value.elapsed === null || Number.isFinite(value.elapsed))
      );
    case "deck": {
      const deck = value.deck;
      return (
        record(deck) &&
        typeof deck.title === "string" &&
        Array.isArray(deck.slides) &&
        deck.slides.every(
          (slide: unknown) =>
            record(slide) &&
            typeof slide.id === "string" &&
            typeof slide.title === "string" &&
            Number.isFinite(slide.clicks) &&
            Array.isArray(slide.notes) &&
            slide.notes.every(
              (note: unknown) =>
                record(note) && Number.isFinite(note.click) && typeof note.html === "string",
            ),
        )
      );
    }
    default:
      return false;
  }
}

export function connectRemote(render: (state: RemoteState) => void) {
  const page = new URL(location.href);
  const url = new URL("/ws", page);
  url.protocol = page.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", page.searchParams.get("token") ?? "");
  let lastPresentation: RemoteState = {};
  let disconnectedSince: Date | undefined;
  let socket: WebSocket | undefined;
  let heartbeat: number | undefined;
  let deadline: number | undefined;
  let retry: number | undefined;
  let backoff = 1000;
  let probe: AbortController | undefined;

  function send(message: RemoteClientMessage) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  function closeSocket() {
    window.clearInterval(heartbeat);
    window.clearTimeout(deadline);
    const previous = socket;
    socket = undefined;
    previous?.close();
  }

  function dispose() {
    window.clearTimeout(retry);
    closeSocket();
    probe?.abort();
  }

  // Browsers hide the HTTP status of a failed upgrade. The page checks the same token.
  async function checkToken() {
    if (probe) return;
    const request = new AbortController();
    probe = request;
    const timeout = window.setTimeout(() => request.abort(), 10000);
    try {
      const response = await fetch(page.href, {
        cache: "no-store",
        mode: "same-origin",
        signal: request.signal,
      });
      if (!request.signal.aborted && response.status === 403) {
        dispose();
        render({ expired: true });
      }
    } catch {
      // Offline and unreachable both leave the socket retry scheduled.
    } finally {
      window.clearTimeout(timeout);
      if (probe === request) probe = undefined;
    }
  }

  function connect() {
    const current = new WebSocket(url);
    socket = current;
    let opened = false;
    let state: RemoteState = {};

    function disconnect() {
      if (socket !== current) return;
      closeSocket();
      disconnectedSince ??= new Date();
      render({ ...lastPresentation, disconnectedSince });
      retry = window.setTimeout(connect, backoff);
      backoff = Math.min(10000, backoff * 2);
      if (!opened) void checkToken();
    }
    function refreshDeadline() {
      window.clearTimeout(deadline);
      deadline = window.setTimeout(disconnect, 10000);
    }
    refreshDeadline();
    current.addEventListener("close", disconnect);
    current.addEventListener("open", () => {
      if (socket !== current) return;
      opened = true;
      disconnectedSince = undefined;
      render(state);
      probe?.abort();
      probe = undefined;
      refreshDeadline();
      heartbeat = window.setInterval(() => send({ type: "ping" }), 5000);
    });
    current.addEventListener("message", (event: MessageEvent<string>) => {
      if (socket !== current) return;
      if (typeof event.data !== "string") return;
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!isServerMessage(message)) return;
      refreshDeadline();
      backoff = 1000;
      switch (message.type) {
        case "deck":
          state = { ...state, deck: message.deck };
          break;
        case "position":
          state = { deck: state.deck, position: { ...message, received: performance.now() } };
          break;
        case "waiting":
          state = { deck: state.deck };
          lastPresentation = state;
          break;
        case "pong":
          return;
      }
      if (state.deck && state.position) lastPresentation = state;
      render(state);
    });
  }
  connect();
  return { send, dispose };
}
