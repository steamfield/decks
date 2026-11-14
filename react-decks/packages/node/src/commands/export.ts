import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const exportDeck = defineCommand({
  meta: { name: "decks export", description: "Export a deck to PDF through the print view" },
  args: {
    deck: { type: "positional", required: true, description: "Deck alias or directory" },
    out: { type: "string", description: "PDF path" },
    final: {
      type: "boolean",
      default: false,
      description: "One page per slide at its final click",
    },
  },
  run() {
    throw new DeckError("decks export is not implemented yet.");
  },
});
