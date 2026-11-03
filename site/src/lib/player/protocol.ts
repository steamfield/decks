// The embed contract between the landing page and an example deck in an iframe.
// The deck side lives in the addon (every example deck speaks it; the repo's
// `bun run test:embed` tests it); this file is the page side. Both sides are
// same-origin: the page sends commands with postMessage, and the deck answers
// with decks:ready, decks:meta, then decks:state on load and on every navigation
// change (settled: false), and again when the motion has stopped (settled: true).
// A move superseded by a newer command never reports settled: only the newest
// does. `prev` from beat 0 lands on the previous slide's last beat; nextSlide and
// prevSlide land on beat 0; `go` takes a 1-based slide and clamps it.

export type Command = { requestId?: number } & (
  | { type: "decks:cmd"; cmd: "next" | "prev" | "nextSlide" | "prevSlide" }
  | { type: "decks:cmd"; cmd: "go"; slide: number; beat: number }
);

export type Direction = "forward" | "backward" | null;

export type DeckState = {
  requestId?: number;
  /** 1-based slide number. */
  slide: number;
  slides: number;
  /** 0-based beat within the slide. */
  beat: number;
  /** The slide's last beat index (Slidev's clicksTotal): 0 without clicks, 2 for three cards. */
  beats: number;
  /** The story card's text; empty on a slide without a card. */
  lead: string;
  body: string;
  settled: boolean;
  direction: Direction;
};

export type DeckMeta = { title: string; slides: number; slideTitles: string[] };

export type DeckMessage =
  | { type: "decks:ready" }
  | { type: "decks:navigate"; cmd: "next" | "prev" | "nextSlide" | "prevSlide" }
  | { type: "decks:interaction" }
  | { type: "decks:error"; message: string }
  | ({ type: "decks:meta" } & DeckMeta)
  | ({ type: "decks:state" } & DeckState);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** Narrows an unknown postMessage payload to a deck message, or null for anything else. */
export function parseDeckMessage(data: unknown): DeckMessage | null {
  if (!isObject(data) || typeof data.type !== "string") return null;
  switch (data.type) {
    case "decks:error":
      return typeof data.message === "string"
        ? { type: "decks:error", message: data.message }
        : null;
    case "decks:interaction":
      return { type: "decks:interaction" };
    case "decks:navigate":
      return ["next", "prev", "nextSlide", "prevSlide"].includes(String(data.cmd))
        ? { type: "decks:navigate", cmd: data.cmd as "next" | "prev" | "nextSlide" | "prevSlide" }
        : null;
    case "decks:ready":
      return { type: "decks:ready" };
    case "decks:meta": {
      if (typeof data.title !== "string" || !isCount(data.slides)) return null;
      const titles = Array.isArray(data.slideTitles) ? data.slideTitles : [];
      return {
        type: "decks:meta",
        title: data.title,
        slides: data.slides,
        slideTitles: titles.map((title) => (typeof title === "string" ? title : "")),
      };
    }
    case "decks:state": {
      const { slide, slides, beat, beats } = data;
      if (!isCount(slide) || !isCount(slides) || !isCount(beat) || !isCount(beats)) return null;
      const direction =
        data.direction === "forward" || data.direction === "backward" ? data.direction : null;
      return {
        type: "decks:state",
        ...(isCount(data.requestId) ? { requestId: data.requestId } : {}),
        slide,
        slides,
        beat,
        beats,
        lead: typeof data.lead === "string" ? data.lead : "",
        body: typeof data.body === "string" ? data.body : "",
        settled: data.settled === true,
        direction,
      };
    }
    default:
      return null;
  }
}

export const command = {
  next: (): Command => ({ type: "decks:cmd", cmd: "next" }),
  prev: (): Command => ({ type: "decks:cmd", cmd: "prev" }),
  nextSlide: (): Command => ({ type: "decks:cmd", cmd: "nextSlide" }),
  prevSlide: (): Command => ({ type: "decks:cmd", cmd: "prevSlide" }),
  go: (slide: number, beat = 0): Command => ({ type: "decks:cmd", cmd: "go", slide, beat }),
};

/** True on the deck's last beat of its last slide: PLAY stops there. */
export const atEnd = (state: DeckState) => state.slide >= state.slides && state.beat >= state.beats;

/** True on the first beat of the first slide. */
export const atStart = (state: DeckState) => state.slide <= 1 && state.beat <= 0;
