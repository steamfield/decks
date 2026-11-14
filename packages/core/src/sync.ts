import type { NavState } from "./navigation";

export interface SyncState {
  readonly nav: NavState;
  /** Width / height of the audience window, when the sender is an audience view. */
  readonly aspect?: number;
}

/** Orders states by sequence, then earlier start, then origin as strings. */
export interface SyncStamp {
  readonly seq: number;
  /** `startedAt` of the session that published this state. */
  readonly started: number;
  /** Id of the session that published this state. */
  readonly origin: string;
}

export type SyncMessage =
  | { readonly type: "hello"; readonly from: string }
  | {
      readonly type: "state";
      readonly from: string;
      readonly stamp: SyncStamp;
      readonly state: SyncState;
    };

export interface Transport {
  post(message: SyncMessage): void;
  /** Returns an unsubscribe function. */
  subscribe(listener: (message: SyncMessage) => void): () => void;
  close(): void;
}

export interface MemoryHub {
  /** Each call returns a transport for one participant. */
  connect(): Transport;
}

export function createMemoryHub(): MemoryHub {
  const participants = new Set<(message: SyncMessage) => void>();
  return {
    connect() {
      let closed = false;
      const listeners = new Set<(message: SyncMessage) => void>();
      const receive = (message: SyncMessage) => {
        for (const listener of [...listeners]) {
          if (closed) return;
          listener(message);
        }
      };
      participants.add(receive);
      return {
        post(message) {
          if (closed) return;
          for (const participant of [...participants]) {
            if (participant !== receive) setTimeout(() => participant(message), 0);
          }
        },
        subscribe(listener) {
          if (!closed) listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        close() {
          closed = true;
          participants.delete(receive);
          listeners.clear();
        },
      };
    },
  };
}

export interface SyncSessionOptions {
  /** Unique per tab. */
  readonly id: string;
  /** When this tab's session began, in milliseconds since the epoch. The caller supplies it. */
  readonly startedAt: number;
  readonly transport: Transport;
  /** The session's current local state; used to answer a newcomer. */
  readonly current: () => SyncState;
  /** Called when a newer state from another participant should be applied locally. */
  readonly onRemote: (state: SyncState) => void;
}

export interface SyncSession {
  /** Tell the other participants about a local change. */
  publish(state: SyncState): void;
  /** Stops listening and closes the transport. Later publishes do nothing. */
  close(): void;
}

export function createSyncSession(options: SyncSessionOptions): SyncSession {
  const { id, startedAt, transport, current, onRemote } = options;
  let stamp: SyncStamp = { seq: 0, started: startedAt, origin: id };
  let closed = false;
  const unsubscribe = transport.subscribe((message) => {
    if (closed || message.from === id) return;
    if (message.type === "hello") {
      transport.post({ type: "state", from: id, stamp, state: current() });
    } else if (
      message.stamp.seq > stamp.seq ||
      (message.stamp.seq === stamp.seq &&
        (message.stamp.started < stamp.started ||
          (message.stamp.started === stamp.started && message.stamp.origin > stamp.origin)))
    ) {
      stamp = message.stamp;
      onRemote(message.state);
    }
  });
  transport.post({ type: "hello", from: id });
  return {
    publish(state) {
      if (closed) return;
      stamp = { seq: stamp.seq + 1, started: startedAt, origin: id };
      transport.post({ type: "state", from: id, stamp, state });
    },
    close() {
      closed = true;
      unsubscribe();
      transport.close();
    },
  };
}

/** Stable channel name for a deck served at a base path. */
export function syncChannelId(deckName: string, base: string): string {
  const path = base.replace(/^\/+|\/+$/g, "");
  return `react-decks:${deckName}:/${path}${path ? "/" : ""}`;
}
