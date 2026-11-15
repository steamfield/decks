export type EmbedCommand = { requestId?: number } & (
  | { type: "decks:cmd"; cmd: "next" | "prev" | "nextSlide" | "prevSlide" }
  | { type: "decks:cmd"; cmd: "go"; slide: number; beat: number }
);

export type EmbedDirection = "forward" | "backward" | null;

export type EmbedState = {
  requestId?: number;
  /** 1-based slide number. */
  slide: number;
  slides: number;
  /** 0-based beat within the slide. */
  beat: number;
  /** The slide's last beat index: 0 without clicks, 2 for three cards. */
  beats: number;
  /** The story card's text; empty on a slide without a card. */
  lead: string;
  body: string;
  settled: boolean;
  direction: EmbedDirection;
};

export type EmbedMeta = { title: string; slides: number; slideTitles: string[] };

export type EmbedMessage =
  | { type: "decks:ready" }
  | { type: "decks:navigate"; cmd: Exclude<EmbedCommand["cmd"], "go"> }
  | { type: "decks:interaction" }
  | { type: "decks:error"; message: string }
  | ({ type: "decks:meta" } & EmbedMeta)
  | ({ type: "decks:state" } & EmbedState);
