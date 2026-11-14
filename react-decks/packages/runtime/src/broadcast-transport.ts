import type { SyncMessage, Transport } from "@react-decks/core";

export function createBroadcastTransport(channelId: string): Transport {
  const channel = new BroadcastChannel(channelId);
  return {
    post: (message) => channel.postMessage(message),
    subscribe(listener) {
      const receive = (event: MessageEvent<SyncMessage>) => listener(event.data);
      channel.addEventListener("message", receive);
      return () => channel.removeEventListener("message", receive);
    },
    close: () => channel.close(),
  };
}
