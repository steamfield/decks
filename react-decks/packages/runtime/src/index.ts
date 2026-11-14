// React client: the deck store, hooks, the adaptive canvas and the views.

export { createBroadcastTransport } from "./broadcast-transport";
export { Deck } from "./deck";
export {
  type DeckApi,
  type RenderContext,
  type SlideApi,
  useDeck,
  useSlide,
  useSlideScale,
} from "./hooks";
export { mountDeck } from "./mount";
export { Notes } from "./notes";
export { OverviewView } from "./overview-view";
export { PlayView } from "./play-view";
export { PresenterView } from "./presenter-view";
export { registerSettleProbe } from "./settle";
export { SlideFrame } from "./slide-frame";
export { SlideHost } from "./slide-host";
export type { DeckSource, NoteHtml, SlideLoader } from "./source";
export { createDeckStore, type DeckState, type DeckStore } from "./store";
