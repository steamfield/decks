import type { NavState } from "./navigation";

export interface SyncState {
  readonly nav: NavState;
  /** Width / height of the audience window, when the sender is an audience view. */
  readonly aspect?: number;
}

export type SyncMessage =
  | { readonly type: "hello"; readonly from: string }
  | { readonly type: "state"; readonly from: string; readonly state: SyncState };

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
            if (participant !== receive) participant(message);
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
  readonly transport: Transport;
  /** Called to answer a newcomer's hello. */
  readonly current: () => SyncState;
  /** Called when another participant's state should be applied locally. */
  readonly onRemote: (state: SyncState) => void;
  /** How long to wait for an answer before assuming this tab is alone. Default 300. */
  readonly joinTimeoutMs?: number;
}

export interface SyncSession {
  /** False until a state arrived or the join timeout passed. */
  readonly joined: boolean;
  /** Tell the other participants about a local change. No-op until joined. */
  publish(state: SyncState): void;
  /** Stops listening, cancels the join timer, closes the transport. */
  close(): void;
}

export function createSyncSession(options: SyncSessionOptions): SyncSession {
  const { id, transport, current, onRemote, joinTimeoutMs = 300 } = options;
  let joined = false;
  let closed = false;
  // Arm the timer and listen before hello: the memory hub can answer synchronously.
  const timer = setTimeout(() => {
    joined = true;
  }, joinTimeoutMs);
  const unsubscribe = transport.subscribe((message) => {
    if (closed || message.from === id) return;
    if (message.type === "hello") {
      if (joined) transport.post({ type: "state", from: id, state: current() });
    } else {
      onRemote(message.state);
      joined = true;
      clearTimeout(timer);
    }
  });
  transport.post({ type: "hello", from: id });
  return {
    get joined() {
      return joined;
    },
    publish(state) {
      if (joined && !closed) transport.post({ type: "state", from: id, state });
    },
    close() {
      closed = true;
      clearTimeout(timer);
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
