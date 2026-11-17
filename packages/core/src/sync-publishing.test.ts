import { describe, expect, it, onTestFinished, vi } from "vitest";

import { createMemoryHub, createSyncSession, type SyncMessage, type SyncState } from "./sync";
import { connect, tab } from "./sync.test-support";

describe("publishing and closing", () => {
  it("exposes the adopted stamp before remote delivery and the next local publication", async () => {
    const hub = createMemoryHub();
    const peer = tab(hub, "peer", { slide: 2, click: 0 }, 1000);
    const local = tab(hub, "local", { slide: 1, click: 0 }, 2000);
    expect(local.session.getStamp()).toEqual({ seq: 0, started: 2000, origin: "local" });
    await vi.runAllTimersAsync();
    expect(local.session.getStamp()).toEqual({ seq: 0, started: 1000, origin: "peer" });
    peer.publish({ nav: { slide: 2, click: 1 } });
    await vi.runAllTimersAsync();
    expect(local.session.getStamp()).toEqual(peer.session.getStamp());
    local.publish({ nav: { slide: 2, click: 2 } });
    expect(local.session.getStamp()).toEqual({ seq: 2, started: 2000, origin: "local" });
  });
  it("publishes the next sequence with its own origin, even before hearing back", async () => {
    const hub = createMemoryHub();
    const local = tab(hub, "local", { slide: 1, click: 0 }, 2000);
    const peer = connect(hub);
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    const first = { nav: { slide: 2, click: 1 } };
    local.publish(first);
    await vi.runAllTimersAsync();
    expect(messages).toEqual([
      {
        type: "state",
        from: "local",
        stamp: { seq: 1, started: 2000, origin: "local" },
        state: first,
      },
    ]);
    peer.post({
      type: "state",
      from: "peer",
      stamp: { seq: 7, started: 1000, origin: "peer" },
      state: first,
    });
    await vi.runAllTimersAsync();
    const start = messages.length;
    const next = { nav: { slide: 2, click: 2 } };
    local.publish(next);
    await vi.runAllTimersAsync();
    expect(messages.slice(start)).toEqual([
      {
        type: "state",
        from: "local",
        stamp: { seq: 8, started: 2000, origin: "local" },
        state: next,
      },
    ]);
  });
  it("ignores hello and state carrying its own id", async () => {
    const hub = createMemoryHub();
    const local = tab(hub, "same", { slide: 1, click: 0 }, 1000);
    const peer = connect(hub);
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    peer.post({ type: "hello", from: "same" });
    peer.post({
      type: "state",
      from: "same",
      stamp: { seq: 99, started: 1000, origin: "same" },
      state: { nav: { slide: 9, click: 0 } },
    });
    await vi.runAllTimersAsync();
    expect(local.nav).toEqual({ slide: 1, click: 0 });
    expect(local.received).toEqual([]);
    expect(messages).toEqual([]);
  });
  it("never posts in response to receiving state", async () => {
    const hub = createMemoryHub();
    const a = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    const b = tab(hub, "b", { slide: 1, click: 0 }, 2000);
    await vi.runAllTimersAsync();
    const aStart = a.received.length;
    const bStart = b.received.length;
    const observer = connect(hub);
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    const state = { nav: { slide: 3, click: 2 }, aspect: 2 };
    a.publish(state);
    await vi.runAllTimersAsync();
    expect([a.nav, b.nav]).toEqual([state.nav, state.nav]);
    expect(a.received.slice(aStart)).toEqual([]);
    expect(b.received.slice(bStart)).toEqual([state]);
    expect(messages).toEqual([
      { type: "state", from: "a", stamp: { seq: 1, started: 1000, origin: "a" }, state },
    ]);
  });
  it("adopts the stamp before an onRemote that throws", async () => {
    const hub = createMemoryHub();
    const peer = connect(hub);
    const received: SyncState[] = [];
    const state = { nav: { slide: 4, click: 1 } };
    const session = createSyncSession({
      id: "local",
      startedAt: 2000,
      transport: connect(hub),
      current: () => state,
      onRemote: (remote) => {
        received.push(remote);
        throw new Error("cannot apply remote");
      },
    });
    onTestFinished(() => session.close());
    await vi.runAllTimersAsync();
    const message: SyncMessage = {
      type: "state",
      from: "peer",
      stamp: { seq: 5, started: 1000, origin: "peer" },
      state,
    };
    peer.post(message);
    await expect(vi.runAllTimersAsync()).rejects.toThrow("cannot apply remote");
    peer.post(message);
    await vi.runAllTimersAsync();
    expect(received).toEqual([state]);
    const messages: SyncMessage[] = [];
    peer.subscribe((remote) => messages.push(remote));
    session.publish(state);
    await vi.runAllTimersAsync();
    expect(messages).toEqual([
      { type: "state", from: "local", stamp: { seq: 6, started: 2000, origin: "local" }, state },
    ]);
  });
  it("stops receiving and publishing after close, including already queued messages", async () => {
    const hub = createMemoryHub();
    const a = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    const b = tab(hub, "b", { slide: 1, click: 0 }, 2000);
    await vi.runAllTimersAsync();
    const start = a.received.length;
    const observer = connect(hub);
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    b.publish({ nav: { slide: 2, click: 0 } });
    a.session.close();
    a.session.close();
    a.session.publish({ nav: { slide: 9, click: 0 } });
    a.transport.post({ type: "hello", from: "closed transport" });
    b.transport.post({ type: "hello", from: "b" });
    await vi.runAllTimersAsync();
    expect(a.received.slice(start)).toEqual([]);
    expect(a.nav).toEqual({ slide: 1, click: 0 });
    expect(messages).toEqual([
      {
        type: "state",
        from: "b",
        stamp: { seq: 1, started: 2000, origin: "b" },
        state: { nav: { slide: 2, click: 0 } },
      },
      { type: "hello", from: "b" },
    ]);
  });
});
