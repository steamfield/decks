import { afterEach, beforeEach, onTestFinished, vi } from "vitest";
import type { NavState } from "./navigation";
import { createSyncSession, type MemoryHub, type SyncState } from "./sync";

export function connect(hub: MemoryHub) {
  const transport = hub.connect();
  onTestFinished(() => transport.close());
  return transport;
}

export function tab(
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
