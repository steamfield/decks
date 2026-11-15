import { describe, expect, it, vi } from "vitest";

import { createMemoryHub, type SyncStamp, type SyncState } from "./sync";
import { connect, tab } from "./sync.test-support";

describe("ordering remote states", () => {
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
    const aStart = a.received.length;
    const bStart = b.received.length;
    const c = tab(hub, "c", { slide: 1, click: 0 }, 3000);
    await vi.runAllTimersAsync();
    expect([a.nav, b.nav, c.nav]).toEqual([state.nav, state.nav, state.nav]);
    expect([a.received.slice(aStart), b.received.slice(bStart), c.received]).toEqual([
      [],
      [],
      [state],
    ]);
  });
  // Known limit, so this is expected to fail. When a fix makes it pass, vitest reports the
  // `it.fails` as red: flip it to a plain `it`.
  it.fails("two early navigations in a later tab do not move the talk", async () => {
    const hub = createMemoryHub();
    const older = tab(hub, "a", { slide: 1, click: 0 }, 1000);
    older.publish({ nav: { slide: 8, click: 2 } });
    await vi.runAllTimersAsync();
    const late = tab(hub, "z", { slide: 1, click: 0 }, 2000);
    late.publish({ nav: { slide: 2, click: 0 } });
    const next = { nav: { slide: 3, click: 0 } };
    late.publish(next);
    await vi.runAllTimersAsync();
    expect([older.nav, late.nav]).toEqual([
      { slide: 8, click: 2 },
      { slide: 8, click: 2 },
    ]);
  });
});
