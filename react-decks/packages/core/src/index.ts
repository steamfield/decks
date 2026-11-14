// Pure deck logic shared by the browser runtime and the Node tooling.
export { type CanvasFit, fitCanvas } from "./canvas";
export { clicksForSlide, type StepState, stepState } from "./clicks";
export { type DeckLocation, type DeckView, formatHash, parseLocation } from "./location";
export { assertManifest, type CanvasSize, type DeckManifest, type SlideMeta } from "./manifest";
export {
  clampNav,
  type NavAction,
  type NavDirection,
  type NavState,
  navDirection,
  navigate,
} from "./navigation";
export { type NoteSegment, noteClickCount, segmentNotes } from "./notes";
export {
  createMemoryHub,
  createSyncSession,
  type MemoryHub,
  type SyncMessage,
  type SyncSession,
  type SyncSessionOptions,
  type SyncStamp,
  type SyncState,
  syncChannelId,
  type Transport,
} from "./sync";
