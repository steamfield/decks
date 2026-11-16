import {
  TERM_ATTACH,
  TERM_DATA,
  TERM_GONE,
  TERM_INPUT,
  TERM_READY,
  TERM_RESET,
  TERM_STATE,
  TERM_STEP,
  type TermPaneSpec,
} from "../protocol";

export interface TermTransport {
  on(event: string, receive: (data: unknown) => void): void;
  off(event: string, receive: (data: unknown) => void): void;
  send(event: string, data: unknown): void;
}

export function createConnection(transport: TermTransport, pane: TermPaneSpec) {
  let snapshot: { live: boolean; busy: boolean; reason: string; queued: readonly number[] } = {
    live: false,
    busy: false,
    reason: "",
    queued: [],
  };
  let buffer = "";
  let active = false;
  let previous: { active: boolean; click: number } | undefined;
  const listeners = new Set<() => void>();
  const output = new Set<(chunk: string) => void>();
  const update = (next: typeof snapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const matches = (message: unknown): message is Record<string, unknown> =>
    typeof message === "object" && message !== null && "id" in message && message.id === pane.id;
  const ready = (message: unknown) => {
    if (!matches(message) || typeof message.buffer !== "string") return;
    buffer = message.buffer;
    // RIS shares xterm's write queue, so pending old output is cleared before the replay.
    for (const receive of output) receive(`\u001bc${buffer}`);
    update({ ...snapshot, live: true, reason: "" });
  };
  const data = (message: unknown) => {
    if (!matches(message) || typeof message.chunk !== "string") return;
    buffer = (buffer + message.chunk).slice(-200 * 1024);
    for (const receive of output) receive(message.chunk);
  };
  const state = (message: unknown) => {
    if (
      matches(message) &&
      typeof message.busy === "boolean" &&
      Array.isArray(message.queued) &&
      message.queued.every((click: unknown) => typeof click === "number")
    )
      update({
        live: snapshot.live,
        busy: message.busy,
        reason: snapshot.reason,
        queued: [...message.queued],
      });
  };
  const gone = (message: unknown) => {
    if (matches(message) && typeof message.reason === "string")
      update({ live: false, busy: false, reason: message.reason, queued: [] });
  };
  const disconnect = () =>
    update({ live: false, busy: false, reason: "connection lost", queued: [] });
  const handlers = [
    { event: TERM_READY, receive: ready },
    { event: TERM_DATA, receive: data },
    { event: TERM_STATE, receive: state },
    { event: TERM_GONE, receive: gone },
    { event: "vite:ws:disconnect", receive: disconnect },
  ];
  const detach = () => {
    if (!active) return;
    active = false;
    for (const { event, receive } of handlers) transport.off(event, receive);
    update({ live: false, busy: false, reason: "", queued: [] });
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(receive: () => void) {
      listeners.add(receive);
      return () => {
        listeners.delete(receive);
      };
    },
    subscribeOutput(receive: (chunk: string) => void) {
      output.add(receive);
      receive(`\u001bc${buffer}`);
      return () => {
        output.delete(receive);
      };
    },
    navigate(eligible: boolean, click: number) {
      const before = previous;
      previous = { active: eligible, click };
      if (!eligible) return detach();
      if (!active) {
        active = true;
        for (const { event, receive } of handlers) transport.on(event, receive);
        transport.send(TERM_ATTACH, { pane });
      }
      if (before && click === 0 && (!before.active || before.click !== 0)) {
        // Arriving at click 0, or stepping back to it, starts a clean session and drops any
        // waiting steps. Stepping back to a later click leaves the queue alone.
        transport.send(TERM_RESET, { id: pane.id });
      } else if (before?.active && click === before.click + 1) {
        transport.send(TERM_STEP, { id: pane.id, click });
      }
    },
    input(data: string) {
      if (active && snapshot.live) transport.send(TERM_INPUT, { id: pane.id, data });
    },
    unavailable(reason: string) {
      update({ live: false, busy: false, reason, queued: [] });
    },
    detach,
  };
}

export type TermConnection = ReturnType<typeof createConnection>;
