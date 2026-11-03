// The example gallery (src/scripts/site.ts) and the hero player (DeckPlayer) talk
// through one window event. A pick made before the player hydrates waits on
// window.__decksPick, which the player reads when it mounts.

/** The window event the gallery sends: `detail` is a deck name. */
export const PICK_EVENT = "decks:pick";

declare global {
  interface Window {
    /** A gallery pick made before the player hydrated. */
    __decksPick?: string;
  }
}
