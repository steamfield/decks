import { describe, expect, it, vi } from "vitest";

import { createMemoryHub, type SyncMessage } from "./sync";
import { connect } from "./sync.test-support";

describe("createMemoryHub", () => {
  it("queues delivery in sender order to other participants, never inside post", async () => {
    const hub = createMemoryHub();
    const first = connect(hub);
    const sender = connect(hub);
    const last = connect(hub);
    const received: { participant: string; message: SyncMessage }[] = [];
    first.subscribe((message) => received.push({ participant: "first", message }));
    sender.subscribe((message) => received.push({ participant: "sender", message }));
    last.subscribe((message) => received.push({ participant: "last", message }));
    const one: SyncMessage = { type: "hello", from: "one" };
    const two: SyncMessage = { type: "hello", from: "two" };
    sender.post(one);
    sender.post(two);
    expect(received).toEqual([]);
    await vi.runAllTimersAsync();
    expect(received.filter((entry) => entry.participant === "sender")).toEqual([]);
    for (const participant of ["first", "last"]) {
      expect(received.filter((entry) => entry.participant === participant)).toEqual([
        { participant, message: one },
        { participant, message: two },
      ]);
    }
  });
  it("never delivers to a transport closed before delivery or posts from it", async () => {
    const hub = createMemoryHub();
    const open = connect(hub);
    const closed = connect(hub);
    const openMessages: SyncMessage[] = [];
    const closedMessages: SyncMessage[] = [];
    open.subscribe((message) => openMessages.push(message));
    closed.subscribe((message) => closedMessages.push(message));
    open.post({ type: "hello", from: "open" });
    closed.close();
    closed.subscribe((message) => closedMessages.push(message));
    closed.post({ type: "hello", from: "closed" });
    await vi.runAllTimersAsync();
    expect(openMessages).toEqual([]);
    expect(closedMessages).toEqual([]);
  });
  it("stops delivery when a listener unsubscribes", async () => {
    const hub = createMemoryHub();
    const sender = connect(hub);
    const receiver = connect(hub);
    const messages: SyncMessage[] = [];
    const unsubscribe = receiver.subscribe((message) => messages.push(message));
    const first: SyncMessage = { type: "hello", from: "first" };
    sender.post(first);
    await vi.runAllTimersAsync();
    sender.post({ type: "hello", from: "second" });
    unsubscribe();
    await vi.runAllTimersAsync();
    expect(messages).toEqual([first]);
  });
  it("does not deliver to a transport closed by an earlier recipient", async () => {
    const hub = createMemoryHub();
    const sender = connect(hub);
    const first = connect(hub);
    const last = connect(hub);
    const messages: SyncMessage[] = [];
    first.subscribe(() => last.close());
    last.subscribe((message) => messages.push(message));
    sender.post({ type: "hello", from: "sender" });
    await vi.runAllTimersAsync();
    expect(messages).toEqual([]);
  });
});
