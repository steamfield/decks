import { describe, expect, it, onTestFinished, vi } from "vitest";
import type { NavState } from "./navigation";
import { createMemoryHub, createSyncSession, type SyncMessage, type Transport } from "./sync";
import { connect, tab } from "./sync.test-support";

describe("joining a sync session", () => {
  it("subscribes before posting hello on creation", async () => {
    const hub = createMemoryHub();
    const peer = tab(hub, "peer", { slide: 8, click: 2 }, 1000);
    const real = connect(hub);
    const events: (string | SyncMessage)[] = [];
    // Record the Transport contract while retaining the real asynchronous hub.
    const transport: Transport = {
      subscribe(listener) {
        events.push("subscribe");
        return real.subscribe(listener);
      },
      post(message) {
        events.push(message);
        real.post(message);
      },
      close() {
        real.close();
      },
    };
    const newcomer = tab(hub, "new", { slide: 1, click: 0 }, 2000, transport);
    expect(events).toEqual(["subscribe", { type: "hello", from: "new" }]);
    await vi.runAllTimersAsync();
    expect([peer.nav, newcomer.nav]).toEqual([
      { slide: 8, click: 2 },
      { slide: 8, click: 2 },
    ]);
    expect(newcomer.received).toEqual([{ nav: { slide: 8, click: 2 } }]);
  });
  it("answers every other id's hello with current state and an unchanged stamp", async () => {
    const hub = createMemoryHub();
    let nav: NavState = { slide: 3, click: 0 };
    const session = createSyncSession({
      id: "a",
      startedAt: 1000,
      transport: connect(hub),
      current: () => ({ nav, aspect: 4 / 3 }),
      onRemote: (state) => {
        nav = state.nav;
      },
    });
    onTestFinished(() => session.close());
    const peer = connect(hub);
    const messages: SyncMessage[] = [];
    peer.subscribe((message) => messages.push(message));
    peer.post({ type: "hello", from: "b" });
    await vi.runAllTimersAsync();
    expect(messages).toEqual([
      {
        type: "state",
        from: "a",
        stamp: { seq: 0, started: 1000, origin: "a" },
        state: { nav, aspect: 4 / 3 },
      },
    ]);
    session.publish({ nav });
    await vi.runAllTimersAsync();
    const start = messages.length;
    nav = { slide: 4, click: 1 };
    peer.post({ type: "hello", from: "c" });
    await vi.runAllTimersAsync();
    expect(messages.slice(start)).toEqual([
      {
        type: "state",
        from: "a",
        stamp: { seq: 1, started: 1000, origin: "a" },
        state: { nav, aspect: 4 / 3 },
      },
    ]);
  });
  it.each(["a", "z"])(
    "a sequentially opened tab %s adopts the older tab before anyone navigates",
    async (lateId) => {
      const hub = createMemoryHub();
      const older = tab(hub, "m", { slide: 8, click: 2 }, 1000);
      const late = tab(hub, lateId, { slide: 1, click: 0 }, 2000);
      await vi.runAllTimersAsync();
      const expected = { slide: 8, click: 2 };
      expect([older.nav, late.nav]).toEqual([expected, expected]);
      expect(older.received).toEqual([]);
      expect(late.received).toEqual([{ nav: expected }]);
    },
  );
  it.each(["opens", "reloads with the same id", "reloads with a new id"])(
    "a tab that %s mid-talk adopts the talk without moving the others",
    async (situation) => {
      const hub = createMemoryHub();
      const audience = tab(hub, "audience", { slide: 1, click: 0 }, 1000);
      if (situation !== "opens") {
        const old = tab(hub, "presenter", { slide: 1, click: 0 }, 2000);
        await vi.runAllTimersAsync();
        old.session.close();
      }
      audience.publish({ nav: { slide: 7, click: 0 } });
      audience.publish({ nav: { slide: 8, click: 2 } });
      await vi.runAllTimersAsync();
      const late = tab(
        hub,
        situation === "reloads with a new id" ? "new" : "presenter",
        { slide: 1, click: 0 },
        3000,
      );
      audience.transport.post({ type: "hello", from: "audience" });
      await vi.runAllTimersAsync();
      const expected = { slide: 8, click: 2 };
      expect([audience.nav, late.nav]).toEqual([expected, expected]);
      expect(audience.received).toEqual([]);
      expect(late.received).toEqual([{ nav: expected }]);
    },
  );
  it.each([
    { greaterFirst: true, aStarted: 1000, zStarted: 2000, slide: 2, click: 0 },
    { greaterFirst: false, aStarted: 1000, zStarted: 2000, slide: 2, click: 0 },
    { greaterFirst: true, aStarted: 2000, zStarted: 1000, slide: 9, click: 2 },
    { greaterFirst: false, aStarted: 2000, zStarted: 1000, slide: 9, click: 2 },
    { greaterFirst: true, aStarted: 1000, zStarted: 1000, slide: 9, click: 2 },
    { greaterFirst: false, aStarted: 1000, zStarted: 1000, slide: 9, click: 2 },
  ])(
    "tabs opening together agree by age then origin: $aStarted/$zStarted, greater id first: $greaterFirst",
    async ({ greaterFirst, aStarted, zStarted, slide, click }) => {
      const hub = createMemoryHub();
      const ids = greaterFirst ? ["z", "a"] : ["a", "z"];
      // Both channels are open before either hello is posted.
      const participants: { id: string; transport: Transport }[] = ids.map((id) => ({
        id,
        transport: connect(hub),
      }));
      const tabs = participants.map(({ id, transport }) =>
        tab(
          hub,
          id,
          { slide: id === "z" ? 9 : 2, click: id === "z" ? 2 : 0 },
          id === "z" ? zStarted : aStarted,
          transport,
        ),
      );
      await vi.runAllTimersAsync();
      const expected = { slide, click };
      expect(tabs.map((participant) => participant.nav)).toEqual([expected, expected]);
    },
  );
  it("keeps its own state if the only other tab closes before answering", async () => {
    const hub = createMemoryHub();
    const old = tab(hub, "z", { slide: 9, click: 0 }, 1000);
    await vi.runAllTimersAsync();
    const observer = connect(hub);
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    const newcomer = tab(hub, "a", { slide: 9, click: 0 }, 2000);
    old.session.close();
    old.session.publish({ nav: { slide: 10, click: 0 } });
    await vi.runAllTimersAsync();
    expect([old.nav, newcomer.nav]).toEqual([
      { slide: 9, click: 0 },
      { slide: 9, click: 0 },
    ]);
    expect(newcomer.received).toEqual([]);
    expect(messages).toEqual([{ type: "hello", from: "a" }]);
  });
  // Known limit, so this is expected to fail. When a fix makes it pass, vitest reports the
  // `it.fails` as red: flip it to a plain `it`.
  it.fails("equal starts converge sequential tabs even when the first hello has no recipient", async () => {
    const hub = createMemoryHub();
    const older = tab(hub, "a", { slide: 8, click: 2 }, 1000);
    const late = tab(hub, "z", { slide: 1, click: 0 }, 1000);
    await vi.runAllTimersAsync();
    expect([older.nav, late.nav]).toEqual([
      { slide: 8, click: 2 },
      { slide: 8, click: 2 },
    ]);
  });
});
