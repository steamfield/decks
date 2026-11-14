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

/** Throws an Error naming the first problem. Returns the same object when valid. */
export function assertManifest(manifest: DeckManifest): DeckManifest {
  if (manifest.slides.length === 0) {
    throw new Error("Manifest has 0 slides");
  }

  const ids = new Set<string>();
  for (const [index, slide] of manifest.slides.entries()) {
    if (slide.no !== index + 1) {
      throw new Error(`Slide no ${slide.no} must be ${index + 1}`);
    }
    if (ids.has(slide.id)) {
      throw new Error(`Duplicate slide id: ${slide.id}`);
    }
    ids.add(slide.id);
    if (!Number.isInteger(slide.clicks) || slide.clicks < 0) {
      throw new Error(`Slide ${slide.id} has invalid clicks: ${slide.clicks}`);
    }
  }

  for (const dimension of ["width", "height"] as const) {
    const value = manifest.canvas[dimension];
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Canvas ${dimension} must be positive and finite: ${value}`);
    }
  }
  return manifest;
}
