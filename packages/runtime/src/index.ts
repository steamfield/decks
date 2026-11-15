// React client: the deck store, hooks, the adaptive canvas and the views.

export { SlideFrame } from "./canvas/slide-frame";
export { Deck } from "./deck";
export { registerCaptionProvider } from "./embed/embed-caption";
export { routeEmbedNavigation } from "./embed/embed-navigation";
export type {
  EmbedCommand,
  EmbedDirection,
  EmbedMessage,
  EmbedMeta,
  EmbedState,
} from "./embed/protocol";
export {
  type DeckApi,
  type RenderContext,
  type SlideApi,
  useDeck,
  useSlide,
  useSlideScale,
} from "./hooks";
export { Center, Cover, ImageSide, Section, TwoCol } from "./layouts/layouts";
export { mountDeck } from "./mount";
export { Notes } from "./notes";
export { registerSettleProbe } from "./settle/settle";
export { SlideHost } from "./slides/slide-host";
export type { DeckSource, NoteHtml, SlideLoader } from "./source";
export { createBroadcastTransport } from "./store/broadcast-transport";
export { createDeckStore, type DeckState, type DeckStore } from "./store/store";
export { OverviewView } from "./views/overview-view";
export { PlayView } from "./views/play-view";
export { PresenterView } from "./views/presenter-view";
