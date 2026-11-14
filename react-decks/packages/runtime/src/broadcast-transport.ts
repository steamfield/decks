import type { SyncMessage, Transport } from "@react-decks/core";

function isMessage(value: unknown): value is SyncMessage {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    !("from" in value) ||
    typeof value.from !== "string"
  )
    return false;
  if (value.type === "hello") return true;
  if (value.type !== "state" || !("state" in value) || !("stamp" in value)) return false;
  const { state, stamp } = value;
  if (
    typeof state !== "object" ||
    state === null ||
    !("nav" in state) ||
    typeof stamp !== "object" ||
    stamp === null
  )
    return false;
  const { nav } = state;
  return (
    typeof nav === "object" &&
    nav !== null &&
    "slide" in nav &&
    typeof nav.slide === "number" &&
    Number.isFinite(nav.slide) &&
    "click" in nav &&
    typeof nav.click === "number" &&
    Number.isFinite(nav.click) &&
    "seq" in stamp &&
    typeof stamp.seq === "number" &&
    Number.isFinite(stamp.seq) &&
    "started" in stamp &&
    typeof stamp.started === "number" &&
    Number.isFinite(stamp.started) &&
    "origin" in stamp &&
    typeof stamp.origin === "string" &&
    (!("aspect" in state) || (typeof state.aspect === "number" && Number.isFinite(state.aspect)))
  );
}

export function createBroadcastTransport(channelId: string): Transport {
  const channel = new BroadcastChannel(channelId);
  return {
    post: (message) => channel.postMessage(message),
    subscribe(listener) {
      const receive = (event: MessageEvent<unknown>) => {
        // Another tab may still be running an older build with a different protocol.
        if (isMessage(event.data)) listener(event.data);
      };
      channel.addEventListener("message", receive);
      return () => channel.removeEventListener("message", receive);
    },
    close: () => channel.close(),
  };
}
