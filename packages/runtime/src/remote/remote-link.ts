import type { RemoteIntent, RemotePosition } from "@react-decks/core";

/** How a deck window talks to the remote relay; the dev entry builds it from `import.meta.hot`. */
export interface RemoteLink {
  report(position: RemotePosition): void;
  /** Returns an unsubscribe function. */
  onIntent(apply: (intent: RemoteIntent) => void): () => void;
}
