import type { SyncMessage } from "@react-decks/core";
import { expect, it, onTestFinished } from "vitest";
import { createBroadcastTransport } from "../index";

it("ignores unknown or incomplete broadcast messages before delivering a valid sentinel", async () => {
  const id = crypto.randomUUID();
  const sender = new BroadcastChannel(id);
  const transport = createBroadcastTransport(id);
  onTestFinished(() => {
    sender.close();
    transport.close();
  });
  const received: SyncMessage[] = [];
  const delivered = new Promise<void>((resolve) =>
    transport.subscribe((message) => {
      received.push(message);
      if (message.type === "hello") resolve();
    }),
  );
  for (const value of [
    null,
    {},
    { type: "new-version" },
    { type: "state", from: "old" },
    { type: "state", from: "old", stamp: {}, state: { nav: {} } },
  ])
    sender.postMessage(value);
  sender.postMessage({ type: "hello", from: "sentinel" });
  await delivered;
  expect(received).toEqual([{ type: "hello", from: "sentinel" }]);
});
