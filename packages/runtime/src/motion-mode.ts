import type { DeckView } from "@react-decks/core";

let instantMove = false;
const listeners = new Set<() => void>();

/**
 * The deck's motion mode: instant outside play, under reduced motion or `?motion=instant`, and
 * for a move an embed host asked to show without motion. The override only ever downgrades.
 */
export function motionMode(view: DeckView, reducedMotion: boolean): "live" | "instant" {
  return instantMove ||
    view !== "play" ||
    reducedMotion ||
    new URLSearchParams(window.location.search).get("motion") === "instant"
    ? "instant"
    : "live";
}

export function subscribeMotionMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Forces instant motion until released; listeners rewrite `data-deck-motion` synchronously. */
export function setInstantMove(on: boolean) {
  if (instantMove === on) return;
  instantMove = on;
  for (const listener of [...listeners]) listener();
}
