import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import type { NavState } from "./navigation";
import {
  createMemoryHub,
  createSyncSession,
  type MemoryHub,
  type SyncMessage,
  type SyncStamp,
  type SyncState,
  syncChannelId,
  type Transport,
} from "./sync";

function connect(hub: MemoryHub) {
  const transport = hub.connect();
  onTestFinished(() => transport.close());
  return transport;
}

function tab(
  hub: MemoryHub,
  id: string,
  initial: NavState,
  startedAt: number,
  transport = connect(hub),
) {
  let nav = initial;
  const received: SyncState[] = [];
  const session = createSyncSession({
    id,
    startedAt,
    transport,
    current: () => ({ nav }),
    onRemote: (state) => {
      nav = state.nav;
      received.push(state);
    },
  });
  onTestFinished(() => session.close());
  return {
    session,
    transport,
    received,
    get nav() {
      return nav;
    },
    publish(state: SyncState) {
      nav = state.nav;
      session.publish(state);
    },
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("createSyncSession rules", () => {
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
    messages.length = 0;
    nav = { slide: 4, click: 1 };
    peer.post({ type: "hello", from: "c" });
    await vi.runAllTimersAsync();
    expect(messages).toEqual([
      {
        type: "state",
        from: "a",
        stamp: { seq: 1, started: 1000, origin: "a" },
        state: { nav, aspect: 4 / 3 },
      },
    ]);
  });

  it("adopts only newer stamps, ordered by sequence, earlier start, then origin", async () => {
    const hub = createMemoryHub();
    const local = tab(hub, "m", { slide: 1, click: 0 }, 1000);
    const peer = connect(hub);
    const newer: SyncState = { nav: { slide: 3, click: 2 }, aspect: 2 };
    const tieWinner: SyncState = { nav: { slide: 4, click: 0 } };
    const olderSession: SyncState = { nav: { slide: 5, click: 1 } };
    const states: [SyncStamp, SyncState][] = [
      [{ seq: 2, started: 2000, origin: "a" }, newer],
      [{ seq: 2, started: 2000, origin: "a" }, { nav: { slide: 9, click: 0 } }],
      [{ seq: 1, started: 500, origin: "z" }, { nav: { slide: 9, click: 0 } }],
      [{ seq: 2, started: 2000, origin: "0" }, { nav: { slide: 9, click: 0 } }],
      [{ seq: 2, started: 2000, origin: "z" }, tieWinner],
      [{ seq: 2, started: 1000, origin: "a" }, olderSession],
      [{ seq: 2, started: 3000, origin: "z" }, { nav: { slide: 9, click: 0 } }],
    ];
    for (const [stamp, state] of states) peer.post({ type: "state", from: "peer", stamp, state });
    await vi.runAllTimersAsync();
    expect(local.received).toEqual([newer, tieWinner, olderSession]);
    expect(local.nav).toEqual(olderSession.nav);
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
    messages.length = 0;
    const next = { nav: { slide: 2, click: 2 } };
    local.publish(next);
    await vi.runAllTimersAsync();
    expect(messages).toEqual([
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
    a.received.length = 0;
    b.received.length = 0;
    const observer = connect(hub);
    const messages: SyncMessage[] = [];
    observer.subscribe((message) => messages.push(message));
    const state = { nav: { slide: 3, click: 2 }, aspect: 2 };
    a.publish(state);
    await vi.runAllTimersAsync();
    expect([a.nav, b.nav]).toEqual([state.nav, state.nav]);
    expect(a.received).toEqual([]);
    expect(b.received).toEqual([state]);
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
});

describe("sync guarantees", () => {
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

  it("ignores a late publish at the talk's sequence even when the newcomer has the greater id", async () => {
    const hub = createMemoryHub();
    const older = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    older.publish({ nav: { slide: 8, click: 2 } });
    await vi.runAllTimersAsync();
    const late = tab(hub, "z", { slide: 1, click: 0 }, 2000);
    late.publish({ nav: { slide: 2, click: 0 } });
    await vi.runAllTimersAsync();
    const expected = { slide: 8, click: 2 };
    expect([older.nav, late.nav]).toEqual([expected, expected]);
    expect(older.received).toEqual([]);
    expect(late.received).toEqual([{ nav: expected }]);
  });

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

  it.each(["answer first", "navigation first"])(
    "three tabs agree when navigation races a queued answer: %s",
    async (order) => {
      const hub = createMemoryHub();
      const a = tab(hub, "a", { slide: 1, click: 0 }, 1000);
      const b = tab(hub, "b", { slide: 1, click: 0 }, 2000);
      await vi.runAllTimersAsync();
      a.publish({ nav: { slide: 6, click: 1 } });
      await vi.runAllTimersAsync();
      const next = { nav: { slide: 7, click: 2 } };
      if (order === "answer first") {
        // Answer hello, then navigate in the same task; both posts stay queued.
        a.transport.subscribe((message) => {
          if (message.type === "hello" && message.from === "c") a.publish(next);
        });
      }
      const c = tab(hub, "c", { slide: 1, click: 0 }, 3000);
      // Deliver hello; answers it queues run in the next timer turn.
      await vi.advanceTimersByTimeAsync(0);
      if (order === "navigation first") a.publish(next);
      await vi.runAllTimersAsync();
      expect([a.nav, b.nav, c.nav]).toEqual([next.nav, next.nav, next.nav]);
      expect(c.received).toEqual(
        order === "answer first" ? [{ nav: { slide: 6, click: 1 } }, next] : [next],
      );
    },
  );

  it.each([true, false])(
    "simultaneous publishes converge on the older session (greater id publishes first: %s)",
    async (greaterFirst) => {
      const hub = createMemoryHub();
      const a = tab(hub, "a", { slide: 1, click: 0 }, 1000);
      const z = tab(hub, "z", { slide: 1, click: 0 }, 2000);
      await vi.runAllTimersAsync();
      const aState = { nav: { slide: 4, click: 1 } };
      const zState = { nav: { slide: 8, click: 2 } };
      if (greaterFirst) {
        z.publish(zState);
        a.publish(aState);
      } else {
        a.publish(aState);
        z.publish(zState);
      }
      await vi.runAllTimersAsync();
      expect([a.nav, z.nav]).toEqual([aState.nav, aState.nav]);
    },
  );

  it("a joined tab ignores another tab's equal-stamp answer to a newcomer", async () => {
    const hub = createMemoryHub();
    const a = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    const b = tab(hub, "b", { slide: 1, click: 0 }, 2000);
    await vi.runAllTimersAsync();
    const state = { nav: { slide: 5, click: 2 } };
    a.publish(state);
    await vi.runAllTimersAsync();
    a.received.length = 0;
    b.received.length = 0;
    const c = tab(hub, "c", { slide: 1, click: 0 }, 3000);
    await vi.runAllTimersAsync();
    expect([a.nav, b.nav, c.nav]).toEqual([state.nav, state.nav, state.nav]);
    expect([a.received, b.received, c.received]).toEqual([[], [], [state]]);
  });

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

  it("stops receiving and publishing after close, including already queued messages", async () => {
    const hub = createMemoryHub();
    const a = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    const b = tab(hub, "b", { slide: 1, click: 0 }, 2000);
    await vi.runAllTimersAsync();
    a.received.length = 0;
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
    expect(a.received).toEqual([]);
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

  it("known limit: two early navigations can outnumber the talk and move the others", async () => {
    const hub = createMemoryHub();
    const older = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    older.publish({ nav: { slide: 8, click: 2 } });
    await vi.runAllTimersAsync();
    const late = tab(hub, "z", { slide: 1, click: 0 }, 2000);
    late.publish({ nav: { slide: 2, click: 0 } });
    const next = { nav: { slide: 3, click: 0 } };
    late.publish(next);
    await vi.runAllTimersAsync();
    expect([older.nav, late.nav]).toEqual([next.nav, next.nav]);
    expect(older.received).toEqual([next]);
    expect(late.received).toEqual([]);
  });

  it("known limit: equal starts can leave sequential tabs split when the first hello has no recipient", async () => {
    const hub = createMemoryHub();
    const older = tab(hub, "a", { slide: 8, click: 2 }, 1000);
    const late = tab(hub, "z", { slide: 1, click: 0 }, 1000);
    await vi.runAllTimersAsync();
    expect([older.nav, late.nav]).toEqual([
      { slide: 8, click: 2 },
      { slide: 1, click: 0 },
    ]);
    expect([older.received, late.received]).toEqual([[], []]);
  });
});

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
