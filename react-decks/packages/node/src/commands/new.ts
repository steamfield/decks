import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const newDeck = defineCommand({
  meta: { name: "decks new", description: "Scaffold a deck and register it in decks.json" },
  args: {
    alias: { type: "positional", required: true, description: "Alias to register" },
    dir: {
      type: "positional",
      required: false,
      description: "Directory name under decksDir (default: the alias)",
    },
    story: { type: "boolean", default: false, description: "Scaffold a story deck" },
    author: { type: "string", description: "Author name" },
    url: { type: "string", description: "Brand URL for the cover" },
  },
  run() {
    throw new DeckError("decks new is not implemented yet.");
  },
});
