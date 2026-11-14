import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import {
  createMemoryHub,
  createSyncSession,
  type SyncMessage,
  type SyncSessionOptions,
  type SyncState,
  syncChannelId,
} from "./sync";

function start(options: SyncSessionOptions) {
  const session = createSyncSession(options);
  onTestFinished(() => session.close());
  return session;
}

describe("createSyncSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("posts hello on creation and remains unjoined until the default timeout", async () => {
    const hub = createMemoryHub();
    const observer = hub.connect();
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    const remote: SyncState[] = [];
    const session = start({
      id: "alone",
      transport: hub.connect(),
      current: () => ({ nav: { slide: 1, click: 0 } }),
      onRemote: (state) => remote.push(state),
    });
    expect(messages).toEqual([{ type: "hello", from: "alone" }]);
    expect(session.joined).toBe(false);
    await vi.advanceTimersByTimeAsync(299);
    expect(session.joined).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(session.joined).toBe(true);
    expect(remote).toEqual([]);
    expect(messages).toEqual([{ type: "hello", from: "alone" }]);
    observer.close();
  });

  it("answers hello with current state only after joining", async () => {
    const hub = createMemoryHub();
    const peer = hub.connect();
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    let current: SyncState = { nav: { slide: 1, click: 0 } };
    start({
      id: "presenter",
      transport: hub.connect(),
      current: () => current,
      onRemote: () => {},
    });
    messages.length = 0;
    peer.post({ type: "hello", from: "early" });
    expect(messages).toEqual([]);
    await vi.advanceTimersByTimeAsync(300);
    current = { nav: { slide: 8, click: 3 }, aspect: 4 / 3 };
    peer.post({ type: "hello", from: "late" });
    expect(messages).toEqual([{ type: "state", from: "presenter", state: current }]);
    peer.close();
  });

  it("adopts an answer, joins and cancels its timer without pulling the first session back", async () => {
    const hub = createMemoryHub();
    const firstState: SyncState = { nav: { slide: 8, click: 2 }, aspect: 16 / 9 };
    const firstRemote: SyncState[] = [];
    const first = start({
      id: "first",
      transport: hub.connect(),
      current: () => firstState,
      onRemote: (state) => firstRemote.push(state),
    });
    await vi.advanceTimersByTimeAsync(300);
    const secondRemote: SyncState[] = [];
    const second = start({
      id: "second",
      transport: hub.connect(),
      current: () => ({ nav: { slide: 1, click: 0 } }),
      onRemote: (state) => secondRemote.push(state),
    });
    expect(first.joined).toBe(true);
    expect(second.joined).toBe(true);
    expect(secondRemote).toEqual([firstState]);
    expect(firstRemote).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(secondRemote).toEqual([firstState]);
    expect(firstRemote).toEqual([]);
  });

  it("joins alone only when the configured timeout expires", async () => {
    const hub = createMemoryHub();
    const session = start({
      id: "alone",
      transport: hub.connect(),
      current: () => ({ nav: { slide: 1, click: 0 } }),
      onRemote: () => {},
      joinTimeoutMs: 50,
    });
    await vi.advanceTimersByTimeAsync(49);
    expect(session.joined).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(session.joined).toBe(true);
  });

  it("posts nothing when publish is called before joining", async () => {
    const hub = createMemoryHub();
    const observer = hub.connect();
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    const state: SyncState = { nav: { slide: 1, click: 0 } };
    const session = start({
      id: "late",
      transport: hub.connect(),
      current: () => state,
      onRemote: () => {},
    });
    messages.length = 0;
    session.publish(state);
    await vi.advanceTimersByTimeAsync(299);
    session.publish(state);
    expect(messages).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    session.publish(state);
    expect(messages).toEqual([{ type: "state", from: "late", state }]);
    observer.close();
  });

  it("ignores hello and state messages carrying its own id", async () => {
    const hub = createMemoryHub();
    const peer = hub.connect();
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    const remote: SyncState[] = [];
    const state: SyncState = { nav: { slide: 9, click: 3 } };
    const session = start({
      id: "same",
      transport: hub.connect(),
      current: () => state,
      onRemote: (s) => remote.push(s),
    });
    messages.length = 0;
    peer.post({ type: "state", from: "same", state });
    expect(session.joined).toBe(false);
    await vi.advanceTimersByTimeAsync(300);
    peer.post({ type: "hello", from: "same" });
    peer.post({ type: "state", from: "same", state });
    expect(remote).toEqual([]);
    expect(messages).toEqual([]);
    peer.close();
  });

  it("delivers one publish to the receiver without echoing any further messages", async () => {
    const hub = createMemoryHub();
    const initial: SyncState = { nav: { slide: 1, click: 0 } };
    const senderRemote: SyncState[] = [];
    const sender = start({
      id: "sender",
      transport: hub.connect(),
      current: () => initial,
      onRemote: (s) => senderRemote.push(s),
    });
    await vi.advanceTimersByTimeAsync(300);
    const receiverRemote: SyncState[] = [];
    const receiver = start({
      id: "receiver",
      transport: hub.connect(),
      current: () => initial,
      onRemote: (s) => receiverRemote.push(s),
    });
    expect(receiver.joined).toBe(true);
    receiverRemote.length = 0;
    const observer = hub.connect();
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    const next: SyncState = { nav: { slide: 3, click: 2 }, aspect: 2 };
    sender.publish(next);
    await vi.advanceTimersByTimeAsync(1000);
    expect(receiverRemote).toEqual([next]);
    expect(senderRemote).toEqual([]);
    expect(messages).toEqual([{ type: "state", from: "sender", state: next }]);
    observer.close();
  });

  it("keeps three sessions on the state published by any joined participant", async () => {
    const hub = createMemoryHub();
    const initial: SyncState = { nav: { slide: 6, click: 2 } };
    let secondState = initial;
    let thirdState = initial;
    const firstRemote: SyncState[] = [];
    const secondRemote: SyncState[] = [];
    const thirdRemote: SyncState[] = [];
    const first = start({
      id: "first",
      transport: hub.connect(),
      current: () => initial,
      onRemote: (s) => firstRemote.push(s),
    });
    await vi.advanceTimersByTimeAsync(300);
    const second = start({
      id: "second",
      transport: hub.connect(),
      current: () => secondState,
      onRemote: (state) => {
        secondState = state;
        secondRemote.push(state);
      },
    });
    const third = start({
      id: "third",
      transport: hub.connect(),
      current: () => thirdState,
      onRemote: (state) => {
        thirdState = state;
        thirdRemote.push(state);
      },
    });
    expect([first.joined, second.joined, third.joined]).toEqual([true, true, true]);
    expect(secondState).toEqual(initial);
    expect(thirdState).toEqual(initial);
    firstRemote.length = 0;
    secondRemote.length = 0;
    thirdRemote.length = 0;
    const next: SyncState = { nav: { slide: 7, click: 0 }, aspect: 1.25 };
    second.publish(next);
    expect(firstRemote).toEqual([next]);
    expect(secondRemote).toEqual([]);
    expect(thirdRemote).toEqual([next]);
  });

  it("cancels the join timer and closes the underlying transport after close", async () => {
    const hub = createMemoryHub();
    const peer = hub.connect();
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    const remote: SyncState[] = [];
    const state: SyncState = { nav: { slide: 4, click: 1 } };
    const transport = hub.connect();
    const transportMessages: SyncMessage[] = [];
    transport.subscribe((message) => transportMessages.push(message));
    const session = start({
      id: "closed",
      transport,
      current: () => state,
      onRemote: (s) => remote.push(s),
    });
    session.close();
    messages.length = 0;
    await vi.advanceTimersByTimeAsync(300);
    expect(session.joined).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    peer.post({ type: "hello", from: "peer" });
    peer.post({ type: "state", from: "peer", state });
    session.publish(state);
    transport.post({ type: "state", from: "closed", state });
    expect(remote).toEqual([]);
    expect(messages).toEqual([]);
    expect(transportMessages).toEqual([]);
    peer.close();
  });

  it("stops a joined session from publishing or receiving after close", async () => {
    const hub = createMemoryHub();
    const peer = hub.connect();
    const remote: SyncState[] = [];
    const state: SyncState = { nav: { slide: 2, click: 1 } };
    const session = start({
      id: "closed",
      transport: hub.connect(),
      current: () => state,
      onRemote: (s) => remote.push(s),
    });
    await vi.advanceTimersByTimeAsync(300);
    session.close();
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    peer.post({ type: "state", from: "peer", state });
    peer.post({ type: "hello", from: "peer" });
    session.publish(state);
    expect(remote).toEqual([]);
    expect(messages).toEqual([]);
    peer.close();
  });
});

describe("createMemoryHub", () => {
  it("delivers synchronously in connection order to every participant except the sender", () => {
    const hub = createMemoryHub();
    const first = hub.connect();
    const sender = hub.connect();
    const last = hub.connect();
    const received: { participant: string; message: SyncMessage }[] = [];
    first.subscribe((message) => received.push({ participant: "first", message }));
    sender.subscribe((message) => received.push({ participant: "sender", message }));
    last.subscribe((message) => received.push({ participant: "last", message }));
    const message: SyncMessage = { type: "hello", from: "sender" };
    sender.post(message);
    expect(received).toEqual([
      { participant: "first", message },
      { participant: "last", message },
    ]);
    first.close();
    sender.close();
    last.close();
  });

  it("never sends from or delivers to a closed transport", () => {
    const hub = createMemoryHub();
    const open = hub.connect();
    const closed = hub.connect();
    const openMessages: SyncMessage[] = [];
    const closedMessages: SyncMessage[] = [];
    open.subscribe((message) => openMessages.push(message));
    closed.subscribe((message) => closedMessages.push(message));
    closed.close();
    closed.subscribe((message) => closedMessages.push(message));
    closed.post({ type: "hello", from: "closed" });
    open.post({ type: "hello", from: "open" });
    expect(openMessages).toEqual([]);
    expect(closedMessages).toEqual([]);
    open.close();
  });

  it("stops delivery when a listener unsubscribes", () => {
    const hub = createMemoryHub();
    const sender = hub.connect();
    const receiver = hub.connect();
    const messages: SyncMessage[] = [];
    const unsubscribe = receiver.subscribe((message) => messages.push(message));
    const first: SyncMessage = { type: "hello", from: "first" };
    sender.post(first);
    unsubscribe();
    sender.post({ type: "hello", from: "second" });
    expect(messages).toEqual([first]);
    sender.close();
    receiver.close();
  });

  it("does not deliver to a transport closed by an earlier recipient during a post", () => {
    const hub = createMemoryHub();
    const sender = hub.connect();
    const first = hub.connect();
    const last = hub.connect();
    const messages: SyncMessage[] = [];
    first.subscribe(() => last.close());
    last.subscribe((message) => messages.push(message));
    sender.post({ type: "hello", from: "sender" });
    expect(messages).toEqual([]);
    sender.close();
    first.close();
  });
});

describe("syncChannelId", () => {
  it.each(["demo/tides", "/demo/tides", "demo/tides/", "/demo/tides/", "//demo/tides//"])(
    "normalizes base %s to start and end with one slash",
    (base) => {
      expect(syncChannelId("tides", base)).toBe("react-decks:tides:/demo/tides/");
    },
  );

  it.each(["", "/", "//"])("normalizes root base %s", (base) => {
    expect(syncChannelId("tides", base)).toBe("react-decks:tides:/");
  });
});
