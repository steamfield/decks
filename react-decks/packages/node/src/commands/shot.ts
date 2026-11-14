import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const shot = defineCommand({
  meta: { name: "decks shot", description: "Screenshot one frame of a deck" },
  args: {
    deck: { type: "positional", required: true, description: "Deck alias or directory" },
    slide: { type: "positional", required: true, description: "Slide number" },
    clicks: { type: "positional", required: false, description: "Click step (default 0)" },
    out: { type: "string", description: "PNG path" },
  },
  run() {
    throw new DeckError("decks shot is not implemented yet.");
  },
});
