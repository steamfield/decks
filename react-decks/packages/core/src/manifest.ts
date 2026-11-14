export interface SlideMeta {
  /** 1-based position among visible slides. */
  readonly no: number;
  /** Filename without extension, e.g. "03-outcome-ladder". Stable across reorders. */
  readonly id: string;
  /** Path relative to the deck directory, e.g. "slides/03-outcome-ladder.mdx". */
  readonly file: string;
  readonly title: string;
  /** Number of clicks after the initial state. 0 means the slide has no steps. */
  readonly clicks: number;
  /** Name of the transition into the following slide; undefined uses the deck default. */
  readonly transition?: string;
}

export interface CanvasSize {
  readonly width: number;
  readonly height: number;
}

export interface DeckManifest {
  /** Registry alias; also part of the sync channel id. */
  readonly name: string;
  readonly title: string;
  readonly canvas: CanvasSize;
  readonly slides: readonly SlideMeta[];
}
