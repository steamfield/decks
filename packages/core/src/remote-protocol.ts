// Messages between deck windows, the dev server's remote relay and the remote presenter page.
// Shapes only; validation lives where each message is received.

/** A deck window reports its position over the HMR socket. */
export const REMOTE_POSITION = "deck-remote:position";
/** The dev server forwards a remote's intent to one deck window over the HMR socket. */
export const REMOTE_INTENT = "deck-remote:intent";

export type RemoteIntent =
  | { readonly type: "next" }
  | { readonly type: "prev" }
  | { readonly type: "go"; readonly slide: number };

export interface RemotePosition {
  readonly slide: number;
  readonly click: number;
  readonly view: "play" | "presenter" | "overview";
  readonly focused: boolean;
}

export interface RemoteSlide {
  readonly id: string;
  readonly title: string;
  readonly clicks: number;
  readonly notes: readonly { readonly click: number; readonly html: string }[];
}

export interface RemoteDeck {
  readonly title: string;
  readonly slides: readonly RemoteSlide[];
}

/** Relay to remote page. `startedAt` is when the relay first saw the position change. */
export type RemoteServerMessage =
  | { readonly type: "deck"; readonly deck: RemoteDeck }
  | {
      readonly type: "position";
      readonly slide: number;
      readonly click: number;
      readonly startedAt: number | null;
    }
  | { readonly type: "waiting" }
  | { readonly type: "pong" };

/** Remote page to relay. */
export type RemoteClientMessage =
  | RemoteIntent
  | { readonly type: "reset-timer" }
  | { readonly type: "ping" };
